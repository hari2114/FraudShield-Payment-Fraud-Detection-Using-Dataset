// ── Range sync ──────────────────────────────────────────
function syncRange(id, v, pre='', suf='') {
  const display = id === 'hour' ? pad(v)+':00' : (pre + Number(v).toLocaleString() + suf);
  document.getElementById('val-'+id).textContent = display;
}
function pad(n) { return String(n).padStart(2,'0'); }
function toggleCheck(id) {
  const el = document.getElementById(id);
  el.classList.toggle('active', document.querySelector('#'+id+' input').checked);
}

// ── Analysis engine ──────────────────────────────────────
async function runAnalysis() {
  const amount   = parseInt(document.getElementById('inp-amount').value);
  const hour     = parseInt(document.getElementById('inp-hour').value);
  const velocity = parseInt(document.getElementById('inp-velocity').value);
  
  // Map frontend values to backend values
  const locationRaw = document.getElementById('inp-location').value;
  let location = 'domestic';
  if (locationRaw === 'foreign' || locationRaw === 'impossible') location = 'international';

  const merchantRaw = document.getElementById('inp-merchant').value;
  let category = 'retail';
  if (merchantRaw === 'online') category = 'retail';
  else if (merchantRaw === 'casino' || merchantRaw === 'jewelry') category = 'electronics'; 
  else if (merchantRaw === 'crypto') category = 'crypto';
  else category = 'retail';

  const device   = document.getElementById('inp-device').checked;
  const declined = document.getElementById('inp-declined').checked;
  const newmerch = document.getElementById('inp-newmerchant').checked;
  const vpn      = document.getElementById('inp-vpn').checked;

  const riskFactors = [];
  if (vpn) riskFactors.push('vpn');
  if (device) riskFactors.push('new_device');

  const requestData = { amount, hour, velocity, location, category, riskFactors };

  // Set UI to loading state
  const vb = document.getElementById('verdict-box');
  vb.style.background = 'rgba(255,255,255,0.1)';
  vb.style.color = 'var(--text)';
  vb.textContent = 'Connecting to Machine Learning Model...';

  let backendScore = 0;
  try {
      const response = await fetch('http://127.0.0.1:5000/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestData)
      });
      if (!response.ok) throw new Error('Server returned ' + response.status);
      const data = await response.json();
      backendScore = data.risk_score || 0;
  } catch (err) {
      console.error(err);
      vb.textContent = 'Error connecting to API. Generating local estimate...';
      // fallback to local calculation if backend is down
      backendScore = localCalculate(amount, hour, velocity, locationRaw, merchantRaw, device, declined, newmerch, vpn).score;
  }

  // Generate signals locally for UI details
  const localSigs = localCalculate(amount, hour, velocity, locationRaw, merchantRaw, device, declined, newmerch, vpn).sigs;

  renderResult(backendScore, localSigs);
}

function localCalculate(amount, hour, velocity, location, merchant, device, declined, newmerch, vpn) {
    let score = 0;
    const sigs = [];

    if (amount > 2500)       { score += 28; sigs.push({ t:'d', l:'Extreme amount ($'+amount.toLocaleString()+')', d:'Very high spend flagged' }); }
    else if (amount > 1000)  { score += 16; sigs.push({ t:'w', l:'High amount ($'+amount.toLocaleString()+')', d:'Above typical spend' }); }
    else if (amount > 400)   { score += 6;  sigs.push({ t:'i', l:'Elevated amount ($'+amount.toLocaleString()+')', d:'Slightly above average' }); }

    if (hour >= 1 && hour <= 5)  { score += 22; sigs.push({ t:'d', l:'Night transaction ('+pad(hour)+':00)', d:'1–5 AM peak fraud window' }); }
    else if (hour === 0 || hour >= 23) { score += 10; sigs.push({ t:'w', l:'Late-night transaction', d:'Unusual hour' }); }

    if (velocity >= 8)       { score += 25; sigs.push({ t:'d', l:'High velocity ('+velocity+' txns)', d:'Card testing pattern detected' }); }
    else if (velocity >= 4)  { score += 12; sigs.push({ t:'w', l:'Elevated velocity ('+velocity+' txns)', d:'Multiple rapid transactions' }); }

    if (location==='impossible') { score += 42; sigs.push({ t:'d', l:'Impossible travel', d:'Two countries within 1 hour' }); }
    else if (location==='foreign') { score += 18; sigs.push({ t:'w', l:'Foreign country', d:'Transaction outside home region' }); }
    else if (location==='nearby')  { score += 4;  sigs.push({ t:'i', l:'Nearby city', d:'Minor location shift' }); }

    if (merchant==='crypto')  { score += 24; sigs.push({ t:'d', l:'Crypto exchange', d:'High-risk merchant category' }); }
    else if (merchant==='casino') { score += 20; sigs.push({ t:'d', l:'Casino / gambling', d:'High-risk merchant category' }); }
    else if (merchant==='jewelry') { score += 15; sigs.push({ t:'w', l:'Luxury jewelry', d:'High-value resalable goods' }); }

    if (vpn)      { score += 18; sigs.push({ t:'d', l:'VPN / proxy detected', d:'Identity masking signal' }); }
    if (device)   { score += 14; sigs.push({ t:'w', l:'Unknown device', d:'Device not seen before' }); }
    if (declined) { score += 18; sigs.push({ t:'d', l:'Prior declined attempt', d:'Probe-then-exploit pattern' }); }
    if (newmerch) { score += 6;  sigs.push({ t:'i', l:'New merchant', d:'No transaction history here' }); }

    return { score: Math.min(score, 100), sigs };
}

function renderResult(score, sigs) {
  // Ring
  score = Math.round(score);
  const circumference = 364.4;
  const offset = circumference - (score / 100) * circumference;
  const ring = document.getElementById('ring-fill');
  ring.style.strokeDashoffset = offset;
  const scoreEl = document.getElementById('ring-score');
  
  // animate number (simple)
  let curr = 0;
  const step = Math.ceil(score / 20) || 1;
  const int = setInterval(() => {
    curr += step;
    if (curr >= score) { curr = score; clearInterval(int); }
    scoreEl.textContent = curr;
  }, 20);

  // Colors
  let color, bgColor, verdict, meterLabel;
  if (score >= 70) {
    color = '#ff3c6e'; bgColor = 'rgba(255,60,110,0.12)';
    verdict = 'BLOCKED — Transaction declined. High fraud risk.';
    meterLabel = 'High risk';
  } else if (score >= 35) {
    color = '#ffab40'; bgColor = 'rgba(255,171,64,0.12)';
    verdict = 'REVIEW — Step-up verification required (OTP / call).';
    meterLabel = 'Medium risk';
  } else {
    color = '#00e676'; bgColor = 'rgba(0,230,118,0.1)';
    verdict = 'APPROVED — Transaction within acceptable risk range.';
    meterLabel = 'Low risk';
  }

  ring.style.stroke = color;
  scoreEl.style.color = color;

  document.getElementById('meter-fill').style.width  = score + '%';
  document.getElementById('meter-fill').style.background = color;
  document.getElementById('meter-label').textContent = meterLabel;

  const vb = document.getElementById('verdict-box');
  vb.style.background = bgColor;
  vb.style.color = color;
  vb.textContent = verdict;

  const out = document.getElementById('signals-out');
  if (sigs.length === 0) {
    out.innerHTML = '<div style="font-size:0.8rem; color:var(--muted); padding:8px 0;">No suspicious signals detected.</div>';
  } else {
    out.innerHTML = sigs.map(s => {
      const cls = s.t==='d'?'sig-danger':s.t==='w'?'sig-warn':'sig-info';
      const dcls = s.t==='d'?'sig-dot-d':s.t==='w'?'sig-dot-w':'sig-dot-i';
      return `<div class="signal-item ${cls}">
        <div class="signal-dot ${dcls}"></div>
        <div class="signal-text"><strong>${s.l}</strong><br><span style="opacity:0.75;">${s.d}</span></div>
      </div>`;
    }).join('');
  }
}

// ── Live feed ────────────────────────────────────────────
const merchants = ['Amazon','Starbucks','Netflix','Apple Store','Shell Petrol','McDonald\'s','Zara','Crypto.com','Casino Royale','H&M','Uber','Swiggy','Flipkart','Binance','Tanishq Jewels'];
const countries = ['IN','US','UK','DE','SG','AE','RU','CN','BR','AU'];
const statuses  = ['safe','safe','safe','safe','safe','warn','warn','fraud'];

function randItem(arr) { return arr[Math.floor(Math.random()*arr.length)]; }
function randInt(a,b)  { return Math.floor(Math.random()*(b-a+1))+a; }
function nowTime()     { const d=new Date(); return pad(d.getHours())+':'+pad(d.getMinutes())+':'+pad(d.getSeconds()); }

function addFeedItem() {
  const status   = randItem(statuses);
  const amount   = status==='fraud' ? randInt(800,4999) : randInt(5,499);
  const merchant = randItem(merchants);
  const country  = status==='fraud' ? randItem(countries.slice(2)) : 'IN';
  const pillCls  = status==='fraud'?'pill-fraud': status==='warn'?'pill-warn':'pill-safe';
  const pillTxt  = status==='fraud'?'BLOCKED': status==='warn'?'REVIEW':'OK';
  const amtColor = status==='fraud'?'color:var(--danger);': status==='warn'?'color:var(--warn);':'color:var(--text);';

  const list = document.getElementById('feed-list');
  const item = document.createElement('div');
  item.className = 'feed-item';
  item.innerHTML = `
    <span class="feed-time">${nowTime()}</span>
    <span class="feed-merchant">${merchant}</span>
    <span class="feed-amount" style="${amtColor}">$${amount.toLocaleString()}</span>
    <span class="feed-country">${country}</span>
    <span><span class="status-pill ${pillCls}">${pillTxt}</span></span>
  `;
  list.insertBefore(item, list.firstChild);
  while (list.children.length > 30) list.removeChild(list.lastChild);
}

// Seed + start
for (let i = 0; i < 12; i++) addFeedItem();
setInterval(addFeedItem, 1800);

// Init ranges
syncRange('amount', 120, '$', '');
syncRange('hour', 14);
syncRange('velocity', 1, '', ' txns');
