# FraudShield — Payment Fraud Detection

A full-stack AI/ML project for detecting payment fraud using a Machine Learning model.

## Features
- Interactive, responsive web UI built with HTML/CSS/JS.
- Random Forest model for fraud detection trained with scikit-learn.
- Flask REST API for predicting fraud risk.

## Tech Stack
- Frontend: HTML, CSS, JavaScript
- Backend: Python, Flask, Flask-CORS
- Machine Learning: scikit-learn, pandas, numpy, joblib

## Setup Instructions
1. Install Python 3.8+
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Generate data and train the model:
   ```bash
   python src/train.py
   ```
4. Start the Flask Backend:
   ```bash
   python src/app.py
   ```
5. Open `index.html` in your web browser to use the application.
