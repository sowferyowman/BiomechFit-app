from flask import Flask, request, jsonify
from flask_cors import CORS
import subprocess
import json
import os
import cv2
import numpy as np
import mediapipe as mp
import time

app = Flask(__name__)
CORS(app)

# Import exercise analyzers dynamically
from exercises.bench_press import BenchPressAnalyzer
from exercises.deadlift import DeadliftAnalyzer
from exercises.overhead_press import OverheadPressAnalyzer
from exercises.row import RowAnalyzer
from exercises.squat import SquatAnalyzer


@app.route("/analyze", methods=["POST"])
def analyze():
    data = request.json
    workout = data.get("workout")
    user = data.get("user", {})
    print(f"=== Incoming Request ===")
    print(f"Workout: {workout}")
    print(f"User Data: {user}")

    # Map workout to correct analyzer
    analyzers = {
        "Squat": SquatAnalyzer,
        "Deadlift": DeadliftAnalyzer,
        "Bench Press": BenchPressAnalyzer,
        "Overhead Press": OverheadPressAnalyzer,
        "Row": RowAnalyzer
    }

    if workout not in analyzers:
        print(f"❌ Unknown workout: {workout}")
        return jsonify({"error": f"Workout '{workout}' not recognized."}), 400

    cap = None # Initialize cap outside of try block for cleanup
    try:
        analyzer = analyzers[workout]()
        # Assuming all analyzers have a 'set_target_reps' or similar if needed, 
        # but relying on `target_reps` for the break condition is standard.
        target_reps = int(user.get("reps", 8))

        # Camera setup
        cap = cv2.VideoCapture(0) 
        if not cap.isOpened():
             raise IOError("Cannot open webcam. Check index (0) or if another app is using it.")

        rep_count = 0
        form_scores = []
        
        with analyzer.mp_pose.Pose(min_detection_confidence=0.5, min_tracking_confidence=0.5) as pose:
            while cap.isOpened():
                success, frame = cap.read()
                if not success:
                    print("Ignoring empty camera frame.")
                    continue

                # To improve performance, optionally resize the frame here before processing
                frame = cv2.resize(frame, (640, 480)) # Example resize

                # Process frame for pose detection
                frame.flags.writeable = False
                frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                results = pose.process(frame)
                
                frame.flags.writeable = True
                frame = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                
                landmarks = None
                if results.pose_landmarks:
                    landmarks = results.pose_landmarks.landmark
                    analyzer.mp_drawing.draw_landmarks(
                        frame, results.pose_landmarks, analyzer.mp_pose.POSE_CONNECTIONS
                    )

                # Only attempt analysis if landmarks are detected
                if landmarks:
                    # Analyze frame
                    # NOTE: Assuming analyzer.process_frame returns score, issues, and stage_changed ('rep' or None)
                    score, issues, stage_changed = analyzer.process_frame(landmarks)

                    # Count reps
                    if stage_changed == "rep":
                        rep_count += 1
                        form_scores.append(score)
                        print(f"✅ Rep {rep_count}/{target_reps}: {score:.2f} - {issues}")

                        if rep_count >= target_reps:
                            print("🎉 Target reps completed. Automatically closing video stream.")
                            break
                            
                    # Display issues on the screen for real-time feedback (optional, but helpful)
                    cv2.putText(frame, f"Form: {issues}", (10, 400),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
                    cv2.putText(frame, f"Reps: {rep_count}/{target_reps}", (10, 50),
                                cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)


                cv2.imshow(f"{workout} Analyzer", frame)
                
                key = cv2.waitKey(10) & 0xFF
                
                # --- NEW MANUAL EXIT / FORCE ANALYSIS ---
                if key == ord('q'):
                    print("🛑 User manually quit the analysis.")
                    break
                elif key == ord('a'): # Press 'a' to force analysis completion
                    print("🔑 User manually forcing analysis completion.")
                    break
                # -------------------------------------

        # Clean up video stream
        cap.release()
        cv2.destroyAllWindows()

        # Compute final stats
        # Ensure we don't divide by zero if 0 reps were recorded
        avg_score = round(sum(form_scores) / len(form_scores), 2) if form_scores else 0
        
        # Prepare the result object
        result = {
            "workout": workout,
            "reps": rep_count,
            "avg_score": avg_score,
            "details": form_scores
        }

        print("=== Workout Completed ===")
        print(result)
        return jsonify(result)

    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        # Ensure cleanup even on error
        if cap and cap.isOpened():
             cap.release()
             cv2.destroyAllWindows()
        return jsonify({"error": f"Internal server error: {str(e)}"}), 500
        
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
