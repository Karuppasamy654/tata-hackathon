import os
import joblib  # type: ignore
import pandas as pd  # type: ignore
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, status  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from sqlalchemy.orm import Session  # type: ignore
from pydantic import BaseModel  # type: ignore
from typing import List

from database import get_db, User, SessionLocal
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from datetime import timedelta

# Load ML Models lazily
regressor = None
classifier = None

def load_models():
    global regressor, classifier
    if regressor is None or classifier is None:
        try:
            regressor = joblib.load('backend/models/risk_regressor.pkl')
            classifier = joblib.load('backend/models/risk_classifier.pkl')
        except FileNotFoundError:
            print("WARNING: ML Models not found. Please run train_model.py first.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_models()
    yield

app = FastAPI(title="Near-Miss Accident Predictor API", lifespan=lifespan)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Schemas ---

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    safety_score: float
    driving_sessions: int

class TelemetryData(BaseModel):
    speed: float
    acceleration: float
    brake_intensity: float
    distance_to_vehicle: float
    steering_angle: float

class PredictRiskRequest(BaseModel):
    telemetry: List[TelemetryData]
    emotion: str = "focused"

class RiskPrediction(BaseModel):
    risk_score: float
    risk_class: str
    factors: List[str]
    accident_probability: float
    time_to_impact: float
    intervention: bool
    message: str

class UpdateScoreRequest(BaseModel):
    session_score: float  # 0-100, higher = safer

# --- Auth Endpoints ---

@app.post("/auth/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(email=user.email, name=user.name, hashed_password=hashed_password)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/auth/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user

# --- Leaderboard Endpoint ---

@app.get("/leaderboard", response_model=List[UserResponse])
def get_leaderboard(db: Session = Depends(get_db)):
    # Get top 20 users by safety score descending
    users = db.query(User).order_by(User.safety_score.desc()).limit(20).all()
    return users

# --- User Score Update Endpoint ---

@app.post("/user/update-score")
def update_score(
    payload: UpdateScoreRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Persist a session's safety score. Blends with prior score (EMA) and increments sessions."""
    # Exponential moving average: 70% prior + 30% new session
    # Extract plain Python scalars from ORM attributes to avoid Pyright Column type errors
    prior_score: float = current_user.safety_score * 1.0  # type: ignore[operator]
    prior_sessions: int = (current_user.driving_sessions or 0) * 1  # type: ignore[operator]
    blended: float = prior_score * 0.7 + payload.session_score * 0.3
    new_score: float = round(max(0.0, min(100.0, blended)), 2)
    new_sessions: int = prior_sessions + 1
    current_user.safety_score = new_score  # type: ignore[assignment]
    current_user.driving_sessions = new_sessions  # type: ignore[assignment]
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {
        "success": True,
        "new_score": current_user.safety_score,
        "driving_sessions": current_user.driving_sessions
    }

# --- ML Prediction Endpoint ---

@app.post("/predict-risk", response_model=RiskPrediction)
def predict_risk(payload: PredictRiskRequest):
    global regressor, classifier
    if not regressor or not classifier:
        load_models()
        if not regressor:
            raise HTTPException(status_code=503, detail="ML Models not loaded")
            
    if not payload.telemetry:
        raise HTTPException(status_code=400, detail="No telemetry data provided")
        
    # Use latest frame for primary risk scoring
    current_frame = payload.telemetry[-1]
            
    # Calculate TTC
    ttc = 999.0
    if current_frame.speed > 0:
        ttc = current_frame.distance_to_vehicle / (current_frame.speed * 0.27778)
    ttc = min(max(ttc, 0), 10.0)
    
    # Create input dataframe matching training features
    input_df = pd.DataFrame([{
        'speed': current_frame.speed,
        'acceleration': current_frame.acceleration,
        'brake_intensity': current_frame.brake_intensity,
        'distance_to_vehicle': current_frame.distance_to_vehicle,
        'steering_angle': current_frame.steering_angle,
        'time_to_collision': ttc
    }])
    
    # Predict — bind to local vars so type checker knows they're non-None
    _regressor = regressor
    _classifier = classifier
    if _regressor is None or _classifier is None:
        raise HTTPException(status_code=503, detail="ML Models not loaded")
    
    ml_score = float(_regressor.predict(input_df)[0])
    ml_class = _classifier.predict(input_df)[0]
    
    # HYBRID LOGIC: Apply rule-based boosts to ML score
    hybrid_score = ml_score
    factors = []
    
    if current_frame.speed > 80 and current_frame.distance_to_vehicle < 15:
        hybrid_score += 25.0
        factors.append("Critical Tailgating")
    elif current_frame.speed > 80:
        factors.append("High Speed")
        
    if abs(current_frame.steering_angle) > 30 and current_frame.speed > 60:
        hybrid_score += 20.0
        factors.append("Dangerous Turn")
    elif abs(current_frame.steering_angle) > 25:
        factors.append("Sharp Turn")
        
    if current_frame.brake_intensity > 0.7:
        hybrid_score += 15.0
        factors.append("Emergency Braking")
    elif current_frame.brake_intensity > 0.4:
        factors.append("Hard Braking")
        
    if current_frame.distance_to_vehicle < 10:
        hybrid_score += 10.0
        factors.append("Close Proximity")
        
    # --- EMOTION FUSION ---
    emotion = payload.emotion.lower()
    if emotion == "sleepy":
        if current_frame.speed > 50:
            hybrid_score += 30.0
            factors.append("Sleepy at Speed (CRITICAL)")
        else:
            hybrid_score += 15.0
            factors.append("Driver Sleepy")
    elif emotion == "distracted":
        if abs(current_frame.steering_angle) > 10:
            hybrid_score += 20.0
            factors.append("Distracted + Steering Variance")
        else:
            hybrid_score += 10.0
            factors.append("Driver Distracted")
    elif emotion == "angry":
        if current_frame.acceleration > 0.5 or current_frame.brake_intensity > 0.5:
            hybrid_score += 15.0
            factors.append("Aggressive Driving Behavior")
            
    # Cap score at 100
    final_score = max(0.0, min(100.0, hybrid_score))
    
    # Override class if hybrid score pushes it to a new tier
    final_class = ml_class
    if final_score >= 70:
        final_class = "danger"
    elif final_score >= 40 and final_class == "safe":
        final_class = "warning"
        
    # --- ACCIDENT PREDICTION MODEL ---
    # Calculate accident probability based on recent history and final score
    base_prob = final_score / 100.0
    
    # Trend analysis from history
    trend_penalty = 0.0
    if len(payload.telemetry) >= 3:
        past_distance = payload.telemetry[0].distance_to_vehicle
        current_distance = current_frame.distance_to_vehicle
        if current_distance < past_distance and current_frame.speed > 60:
            trend_penalty = 0.15  # Distance closing rapidly at speed
            
    if ttc < 2.0:
        base_prob = max(base_prob, 0.85)
    elif ttc < 3.5:
        base_prob = max(base_prob, 0.65)
        
    final_prob = min(1.0, max(0.0, base_prob + trend_penalty))
    
    # --- SMART EMERGENCY SYSTEM ---
    intervention = False
    message = ""
    if final_prob > 0.75:
        intervention = True
        message = "⚠️ AI TOOK CONTROL: Emergency braking applied to prevent collision."
    
    return {
        "risk_score": final_score,
        "risk_class": final_class,
        "factors": factors,
        "accident_probability": round(final_prob * 100, 1),
        "time_to_impact": round(ttc, 1) if ttc < 10 else 99.9,
        "intervention": intervention,
        "message": message
    }
