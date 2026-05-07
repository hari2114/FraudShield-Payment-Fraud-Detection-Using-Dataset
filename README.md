# FraudShield — Payment Fraud Detection

FraudShield is a full-stack AI/ML-based payment fraud detection system designed to identify suspicious financial transactions in real time using Machine Learning techniques.

The project combines a responsive frontend interface with a Flask backend and a trained Random Forest model to analyze transaction behavior and predict fraud risk.

---

## Features

- Real-time fraud prediction system
- Interactive and responsive web interface
- Machine Learning-based fraud detection
- REST API built with Flask
- Random Forest classification model
- Transaction risk analysis
- Fast prediction response

---

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- Flask
- Flask-CORS

### Machine Learning
- scikit-learn
- pandas
- numpy
- joblib

---

## Project Structure

```bash
FraudShield/
│
├── src/
│   ├── app.py
│   ├── train.py
│   └── model.pkl
│
├── data/
├── index.html
├── style.css
├── script.js
├── requirements.txt
└── README.md

## Installation & Setup
1. Clone the Repository
git clone https://github.com/hari2114/FraudShield.git
cd FraudShield
2. Install Dependencies
pip install -r requirements.txt
3. Train the Model
python src/train.py
4. Start Flask Backend
python src/app.py
5. Run the Frontend

Open index.html in your browser.

Machine Learning Model

The fraud detection system uses a Random Forest Classifier trained on transaction-related features such as:

Transaction amount
Transaction time
User behavior patterns
Payment activity
Risk-related indicators

The model predicts whether a transaction is:

Legitimate
Fraudulent
Future Improvements
Deep Learning integration
Real-time database support
User authentication
Payment gateway integration
Live analytics dashboard
Model deployment using Docker/Cloud
Author

Harish
AI/ML Developer | Unity Developer
