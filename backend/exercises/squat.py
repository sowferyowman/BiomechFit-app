import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle # Universal angle calculator

# Landmark indices for readability (Left side used for analysis)
L_HIP = mp.solutions.pose.PoseLandmark.LEFT_HIP.value
L_KNEE = mp.solutions.pose.PoseLandmark.LEFT_KNEE.value
L_ANKLE = mp.solutions.pose.PoseLandmark.LEFT_ANKLE.value
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value

class SquatAnalyzer(BaseAnalyzer):
    """
    Analyzes form for the Squat exercise, focusing on knee depth and hip-to-back angle.
    Inherits MediaPipe setup and state management from BaseAnalyzer.
    """
    def __init__(self):
        super().__init__()
        # 'up' means standing/lockout, 'down' means in the deep squat position
        self.stage = "up"

    def analyze_form(self, knee_angle, hip_angle):
        """Analyze form and return normalized score and issues."""
        issues = []
        score = 1.0 # Start perfect

        # --- Depth Check (Knee Angle) ---
        # Ideal squat depth requires the hip crease to drop below the knee.
        # This usually means the knee angle is 90 degrees or less.
        if self.stage == "down" and knee_angle > 100:
            issues.append("Insufficient Depth: Go lower (Knee angle too open).")
            score *= 0.85
            
        # --- Torso/Hip Angle Check ---
        # The angle formed by the torso and thigh (Shoulder-Hip-Knee) should not collapse forward.
        if hip_angle < 120:
            issues.append("Torso Leaning Forward: Engage core and maintain upright chest.")
            score *= 0.9

        # Safety Check: If the knee is excessively bent (deep squat, knee angle < 60)
        if knee_angle < 60:
             issues.append("Very deep squat: Ensure knees track over feet.")
             score *= 0.95 # Minor penalty

        return score, issues

    def process_frame(self, landmarks):
        self.form_issues = []
        stage_changed = None
        current_score = 1.0

        try:
            # 1. Get Coordinates
            l_hip = self.get_landmark_coords(landmarks, L_HIP)
            l_knee = self.get_landmark_coords(landmarks, L_KNEE)
            l_ankle = self.get_landmark_coords(landmarks, L_ANKLE)
            l_shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)

            # 2. Calculate Angles
            # Knee Angle (Hip-Knee-Ankle) - measures squat depth
            knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
            # Hip Angle (Shoulder-Hip-Knee) - measures torso lean
            hip_angle = calculate_angle(l_shoulder, l_hip, l_knee)
            
            # 3. Form Scoring
            current_score, feedback_issues = self.analyze_form(knee_angle, hip_angle)
            self.form_issues.extend(feedback_issues)
            
            # Accumulate the lowest score (worst form) during the current rep
            self.current_rep_score = min(self.current_rep_score, current_score)

            # 4. Rep Counting Logic
            # UP position: Knee angle near 170-180 (standing)
            # DOWN position: Knee angle near 90-100 (squat depth)

            # Transition from UP to DOWN (Start of Eccentric phase/Descent)
            if knee_angle < 140 and self.stage == "up":
                self.stage = "down"

            # Transition from DOWN to UP (Rep completion/Ascent)
            # Only count the rep if the knee angle reaches near full extension
            if knee_angle > 170 and self.stage == "down":
                self.stage = "up"
                stage_changed = "rep"
                
                # Report the lowest score recorded during the entire rep
                score_to_report = self.current_rep_score 
                self.current_rep_score = 1.0 # Reset for next rep

                return score_to_report, self.form_issues, stage_changed

        except IndexError:
            self.form_issues.append("Not all required body parts are visible (Hip, Knee, Ankle, Shoulder).")
        except Exception as e:
            self.form_issues.append(f"Analysis error: {str(e)}")

        # Return current progress if no rep was completed
        return self.current_rep_score, self.form_issues, stage_changed
