import os
import pandas as pd  # type: ignore
import numpy as np  # type: ignore
from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier  # type: ignore
from sklearn.model_selection import train_test_split  # type: ignore
import joblib  # type: ignore

def generate_synthetic_data(n_samples=5000):
    """
    Generate synthetic driving telemetry data.
    Features: speed, acceleration, brake_intensity, distance_to_vehicle, steering_angle
    """
    np.random.seed(42)
    
    # Generate realistic base data
    speed = np.random.normal(60, 25, n_samples)
    speed = np.clip(speed, 0, 180)
    
    acceleration = np.random.normal(0, 2, n_samples)
    acceleration = np.clip(acceleration, -10, 10)
    
    brake_intensity = np.random.exponential(0.1, n_samples)
    brake_intensity = np.clip(brake_intensity, 0, 1)
    
    distance_to_vehicle = np.random.normal(40, 20, n_samples)
    distance_to_vehicle = np.clip(distance_to_vehicle, 1, 150)
    
    steering_angle = np.random.normal(0, 10, n_samples)
    steering_angle = np.clip(steering_angle, -90, 90)
    
    # Calculate time to collision (ttc)
    # ttc = distance / relative_speed (simplification: just use speed if > 0)
    ttc = np.where(speed > 0, distance_to_vehicle / (speed * 0.27778), 999)
    ttc = np.clip(ttc, 0, 10) # cap at 10 seconds for model stability
    
    data = pd.DataFrame({
        'speed': speed,
        'acceleration': acceleration,
        'brake_intensity': brake_intensity,
        'distance_to_vehicle': distance_to_vehicle,
        'steering_angle': steering_angle,
        'time_to_collision': ttc
    })
    
    # Rule-based calculation for ground truth risk score
    # High speed, hard braking, close distance, fast acceleration change, sharp steering
    risk_score = (
        (data['speed'] / 180) * 30 +
        (data['brake_intensity']) * 25 +
        (np.maximum(0, 30 - data['distance_to_vehicle']) / 30) * 30 +
        (np.abs(data['acceleration']) / 10) * 10 +
        (np.abs(data['steering_angle']) / 90) * 5
    )
    
    # Add multiplier for dangerous combinations (e.g., tailgating at speed)
    combo_mask = (data['speed'] > 80) & (data['distance_to_vehicle'] < 15)
    risk_score[combo_mask] += 20
    
    # Apply sigmoid-like smoothing to keep it 0-100
    risk_score = 100 / (1 + np.exp(-0.06 * (risk_score - 50)))
    
    # Add noise to make the ML model actually learn rather than perfectly memoize
    risk_score += np.random.normal(0, 3, n_samples)
    risk_score = np.clip(risk_score, 0, 100)
    
    data['risk_score'] = risk_score
    
    # Determine class based on score
    conditions = [
        (data['risk_score'] >= 70),
        (data['risk_score'] >= 40)
    ]
    choices = ['danger', 'warning']
    data['risk_class'] = np.select(conditions, choices, default='safe')
    
    return data

def train():
    print("Generating synthetic data...")
    df = generate_synthetic_data(10000)
    
    features = ['speed', 'acceleration', 'brake_intensity', 'distance_to_vehicle', 'steering_angle', 'time_to_collision']
    
    X = df[features]
    y_score = df['risk_score']
    y_class = df['risk_class']
    
    # Train regressor for continuous 0-100 score
    print("Training Regressor...")
    X_train, X_test, y_train_score, y_test_score = train_test_split(X, y_score, test_size=0.2, random_state=42)
    regressor = RandomForestRegressor(n_estimators=100, max_depth=10, random_state=42)
    regressor.fit(X_train, y_train_score)
    score_acc = regressor.score(X_test, y_test_score)
    print(f"Regressor R^2 Score: {score_acc:.4f}")
    
    # Train classifier for discrete labels
    print("Training Classifier...")
    X_train, X_test, y_train_class, y_test_class = train_test_split(X, y_class, test_size=0.2, random_state=42)
    classifier = RandomForestClassifier(n_estimators=100, max_depth=10, random_state=42)
    classifier.fit(X_train, y_train_class)
    class_acc = classifier.score(X_test, y_test_class)
    print(f"Classifier Accuracy: {class_acc:.4f}")
    
    # Save models
    os.makedirs('backend/models', exist_ok=True)
    joblib.dump(regressor, 'backend/models/risk_regressor.pkl')
    joblib.dump(classifier, 'backend/models/risk_classifier.pkl')
    print("Models saved to backend/models/")

if __name__ == "__main__":
    train()
