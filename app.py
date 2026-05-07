from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import os
import pandas as pd

app = Flask(__name__)
CORS(app) # Enable CORS for all routes so frontend can connect

# Load the model
MODEL_PATH = "models/fraud_model.pkl"

model = None
if os.path.exists(MODEL_PATH):
    model = joblib.load(MODEL_PATH)
    print("Model loaded successfully.")
else:
    print(f"Warning: Model not found at {MODEL_PATH}. Please run train.py first.")

@app.route('/predict', methods=['POST'])
def predict():
    if model is None:
        return jsonify({"error": "Model not loaded on server."}), 500
        
    try:
        data = request.json
        # Extract features
        amount = float(data.get('amount', 0))
        hour = int(data.get('hour', 12))
        velocity = int(data.get('velocity', 1))
        
        # In a real app, these might come from a DB or IP lookup, 
        # but here we'll map the UI inputs to mock risk scores
        location = data.get('location', 'domestic')
        category = data.get('category', 'retail')
        risk_factors = data.get('riskFactors', [])
        
        # Mock calculation of location and category risk (0-10)
        location_risk = 8.0 if location == 'international' else 2.0
        category_risk = 7.0 if category in ['crypto', 'electronics'] else 3.0
        
        # Add risk if VPN or new device
        if 'vpn' in risk_factors: location_risk += 2.0
        if 'new_device' in risk_factors: category_risk += 2.0
        
        # Cap at 10
        location_risk = min(10.0, location_risk)
        category_risk = min(10.0, category_risk)

        # Create DataFrame for prediction matching training features
        features = pd.DataFrame([{
            'amount': amount,
            'hour': hour,
            'velocity': velocity,
            'location_risk': location_risk,
            'category_risk': category_risk
        }])
        
        # Predict
        prediction = model.predict(features)[0]
        probabilities = model.predict_proba(features)[0]
        
        # Probability of fraud (class 1)
        fraud_prob = float(probabilities[1]) * 100
        
        return jsonify({
            "fraud": int(prediction),
            "risk_score": round(fraud_prob, 2)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400

if __name__ == '__main__':
    # Start the server
    print("Starting FraudShield Backend on port 5000...")
    app.run(debug=True, host='0.0.0.0', port=5000)
