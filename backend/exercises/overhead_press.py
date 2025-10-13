import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle # Universal angle calculator

# Landmark indices for readability (Left side used for analysis)
L_HIP = mp.solutions.pose.PoseLandmark.LEFT_HIP.value
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value
L_ELBOW = mp.solutions.pose.PoseLandmark.LEFT_ELBOW.value
L_WRIST = mp.solutions.pose.PoseLandmark.LEFT_WRIST.value

class OverheadPressAnalyzer(BaseAnalyzer):
    """
    Analyzes form for the Overhead Press exercise, focusing on elbow extension and alignment.
    Inherits MediaPipe setup and state management from BaseAnalyzer.
    """
    def __init__(self):
        super().__init__()
        # 'down' means bar is at shoulder height, 'up' means bar is locked out overhead
        self.stage = "down" 

    def analyze_form(self, elbow_angle, shoulder_angle):
        """Analyze form and return normalized score and issues."""
        issues = []
        score = 1.0 # Start perfect

        # --- Elbow Extension Check ---
        # At the top of the lift (Lockout)
        if self.stage == "up" and elbow_angle < 170:
             issues.append("Incomplete lockout (Elbow not fully extended).")
             score *= 0.85
             
        # --- Back Arch/Lean Check (Simplified) ---
        # Hip-Shoulder-Elbow angle should be relatively large to prevent excessive arching backward.
        if shoulder_angle < 100: 
            issues.append("Excessive backward lean or poor bar path (Shoulder alignment).")
            score *= 0.9

        return score, issues

    def process_frame(self, landmarks):
        self.form_issues = []
        stage_changed = None
        current_score = 1.0

        try:
            # 1. Get Coordinates
            l_hip = self.get_landmark_coords(landmarks, L_HIP)
            l_shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            l_elbow = self.get_landmark_coords(landmarks, L_ELBOW)
            l_wrist = self.get_landmark_coords(landmarks, L_WRIST)

            # 2. Calculate Angles
            # Elbow angle (Wrist-Elbow-Shoulder) - measures extension
            elbow_angle = calculate_angle(l_wrist, l_elbow, l_shoulder)
            # Shoulder angle (Hip-Shoulder-Elbow) - proxy for bar path/lean
            shoulder_angle = calculate_angle(l_hip, l_shoulder, l_elbow)
            
            # 3. Form Scoring
            current_score, feedback_issues = self.analyze_form(elbow_angle, shoulder_angle)
            self.form_issues.extend(feedback_issues)
            
            # Accumulate the lowest score (worst form) during the current rep
            self.current_rep_score = min(self.current_rep_score, current_score)

            # 4. Rep Counting Logic
            # UP position: Elbow angle near 180 (lockout)
            # DOWN position: Elbow angle near 90-110 (at shoulder height)

            # Transition from UP to DOWN (Start of Eccentric phase/Lowering the bar)
            if elbow_angle < 140 and self.stage == "up":
                self.stage = "down"

            # Transition from DOWN to UP (Rep completion/Lockout)
            if elbow_angle > 170 and self.stage == "down":
                self.stage = "up"
                stage_changed = "rep"
                
                # Report the lowest score recorded during the entire rep
                score_to_report = self.current_rep_score 
                self.current_rep_score = 1.0 # Reset for next rep

                return score_to_report, self.form_issues, stage_changed

        except IndexError:
            self.form_issues.append("Not all required body parts are visible (Hip, Shoulder, Elbow, Wrist).")
        except Exception as e:
            self.form_issues.append(f"Analysis error: {str(e)}")

        # Return current progress if no rep was completed
        return self.current_rep_score, self.form_issues, stage_changed
