from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import cv2
import mediapipe as mp
import pickle
import tkinter as tk 

# --- 1. SETUP & MODEL LOADING ---
try:
    with open("xgb_RecommendedReps.pkl", "rb") as f:
        model_reps = pickle.load(f)
    with open("xgb_RecommendedSets.pkl", "rb") as f:
        model_sets = pickle.load(f)
    with open("xgb_RecommendedWeightLoad_kg.pkl", "rb") as f:
        model_weight = pickle.load(f)
    print("AI Models loaded successfully.")
except Exception as e:
    print(f"Model Load Error: {e}")

# --- 2. THE MISSING FUNCTION (FIXED) ---
def get_recommendation(exercise_num, sex_int, age, height, weight, load, sets, reps, avg_score):
    """Calculates XGBoost predictions for the next workout session"""
    X = np.array([[exercise_num, sex_int, age, height, weight, load, sets, reps, avg_score]], dtype=float)
    return {
        "recommended_reps": int(model_reps.predict(X)[0]),
        "recommended_sets": int(model_sets.predict(X)[0]),
        "recommended_weight": float(model_weight.predict(X)[0])
    }

app = Flask(__name__)
CORS(app)

# Import analyzers
from exercises.bench_press import BenchPressAnalyzer
from exercises.overhead_press import OverheadPressAnalyzer
from exercises.squat import SquatAnalyzer

# Get Screen Resolution for perfect desktop coverage
root = tk.Tk()
SCREEN_W = root.winfo_screenwidth()
SCREEN_H = root.winfo_screenheight()
root.destroy()

@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    workout = data.get("workout", "Squat")
    user = data.get("user", {})

    # Data Parsing
    try:
        age = int(user.get("age", 0))
        height = float(user.get("height", 0))
        weight = float(user.get("weight", 0))
        sex_map = {"M": 0, "Male": 0, "F": 1, "Female": 1}
        sex_int = sex_map.get(user.get("sex"), 0)
        workout_map = {"Squat": 0, "Bench Press": 1, "Overhead Press": 2}
        workout_num = workout_map.get(workout, 0)
        load, sets, reps = float(user.get("load", 0)), int(user.get("sets", 0)), int(user.get("reps", 0))
    except Exception as e:
        return jsonify({"error": f"Input error: {str(e)}"}), 400

    analyzers = {"Squat": SquatAnalyzer, "Bench Press": BenchPressAnalyzer, "Overhead Press": OverheadPressAnalyzer}
    analyzer = analyzers[workout]()
    
    cap = cv2.VideoCapture(0)
    cap.set(cv2.CAP_PROP_FRAME_WIDTH, 1280)
    cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 720)

    # Window configuration to cover side gaps but keep title bar
    window_name = "BIOMECHFIT_ULTRA_v3.0"
    cv2.namedWindow(window_name, cv2.WINDOW_NORMAL) 
    cv2.resizeWindow(window_name, SCREEN_W, SCREEN_H - 100) 
    cv2.setWindowProperty(window_name, cv2.WND_PROP_TOPMOST, 1)

    rep_count, form_scores, ticker_pos = 0, [], 0
    mp_pose, mp_drawing = mp.solutions.pose, mp.solutions.drawing_utils

    with mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
        while cap.isOpened():
            success, frame = cap.read()
            if not success: break

            frame = cv2.flip(frame, 1)
            
            # --- ZOOM LOGIC TO HIDE GAPS ---
            h, w, _ = frame.shape
            crop_w = int(w * 0.12) # Slight crop to fill width
            frame = frame[:, crop_w:w-crop_w]
            frame = cv2.resize(frame, (SCREEN_W, SCREEN_H - 100))
            h, w, _ = frame.shape
            
            # HUD Overlay
            overlay = frame.copy()
            cv2.rectangle(overlay, (0, 0), (w, 105), (12, 12, 12), -1)
            cv2.rectangle(overlay, (0, h-90), (w, h), (12, 12, 12), -1)
            cv2.addWeighted(overlay, 0.65, frame, 0.35, 0, frame)

            results = pose.process(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

            if results.pose_landmarks:
                mp_drawing.draw_landmarks(frame, results.pose_landmarks, mp_pose.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(255, 255, 0), thickness=2, circle_radius=1),
                    mp_drawing.DrawingSpec(color=(255, 255, 255), thickness=1))

                score, issues, stage_changed = analyzer.process_frame(results.pose_landmarks.landmark)

                if stage_changed == "rep":
                    rep_count += 1
                    form_scores.append(score)
                    if rep_count >= reps: break

                # TOP UI
                cv2.putText(frame, f"// SESSION_ACTIVE: {workout.upper()}", (40, 45), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 0), 1)
                cv2.putText(frame, f"REPS: {rep_count}/{reps}", (40, 95), 
                            cv2.FONT_HERSHEY_SIMPLEX, 1.5, (255, 255, 255), 2)

                # SCROLLING TICKER
                if issues:
                    issues_str = " | ".join(issues) if isinstance(issues, list) else str(issues)
                    full_text = f" ALERT: {issues_str.upper()}        " * 3
                    t_size = cv2.getTextSize(full_text, cv2.FONT_HERSHEY_SIMPLEX, 0.8, 2)[0]
                    ticker_pos -= 3 
                    if abs(ticker_pos) > t_size[0] // 3: ticker_pos = 0
                    
                    cv2.rectangle(frame, (0, h-80), (w, h-35), (20, 20, 160), -1)
                    cv2.putText(frame, full_text, (ticker_pos, h-48), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

            cv2.imshow(window_name, frame)
            if cv2.waitKey(1) & 0xFF in [ord('q'), ord('a')]: break

    cap.release()
    cv2.destroyAllWindows()

    # --- FINAL ANALYSIS ---
    avg_score = round(sum(form_scores)/len(form_scores), 2) if form_scores else 0
    # Calling the function that was previously "undefined"
    prediction = get_recommendation(workout_num, sex_int, age, height, weight, load, sets, reps, round(avg_score))
    
    return jsonify({
        "workout": workout, 
        "reps": rep_count, 
        "avg_score": avg_score, 
        "recommendation": prediction
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)