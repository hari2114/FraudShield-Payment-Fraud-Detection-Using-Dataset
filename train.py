import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib

# Ensure directories exist
os.makedirs("data", exist_ok=True)
os.makedirs("models", exist_ok=True)

print("Generating synthetic fraud dataset...")
# Generate a realistic-looking dataset
# Features: Amount, Hour (0-23), Velocity (txn per day), LocationRisk (0-10), CategoryRisk (0-10)
np.random.seed(42)
n_samples = 5000

# Safe transactions (90%)
n_safe = int(n_samples * 0.9)
safe_data = {
    'amount': np.random.exponential(scale=50, size=n_safe),
    'hour': np.random.randint(6, 23, size=n_safe),
    'velocity': np.random.poisson(lam=2, size=n_safe),
    'location_risk': np.random.uniform(0, 3, size=n_safe),
    'category_risk': np.random.uniform(0, 3, size=n_safe),
    'fraud': 0
}

# Fraud transactions (10%)
n_fraud = n_samples - n_safe
fraud_data = {
    'amount': np.random.exponential(scale=300, size=n_fraud), # Higher amounts
    'hour': np.random.randint(0, 6, size=n_fraud),           # Late night
    'velocity': np.random.poisson(lam=8, size=n_fraud),      # High velocity
    'location_risk': np.random.uniform(6, 10, size=n_fraud), # High location risk
    'category_risk': np.random.uniform(6, 10, size=n_fraud), # High category risk
    'fraud': 1
}

df_safe = pd.DataFrame(safe_data)
df_fraud = pd.DataFrame(fraud_data)
df = pd.concat([df_safe, df_fraud]).sample(frac=1, random_state=42).reset_index(drop=True)

# Save dataset
data_path = "data/synthetic_data.csv"
df.to_csv(data_path, index=False)
print(f"Dataset saved to {data_path}")

# Train the model
print("Training Random Forest model...")
X = df.drop('fraud', axis=1)
y = df['fraud']

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestClassifier(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

# Evaluate
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("Classification Report:\n", classification_report(y_test, y_pred))

# Save the model
model_path = "models/fraud_model.pkl"
joblib.dump(model, model_path)
print(f"Model saved to {model_path}")
print("Training complete!")
