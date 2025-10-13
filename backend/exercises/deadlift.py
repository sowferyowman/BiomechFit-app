import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle # Universal angle calculator

# Landmark indices for readability (Left side used for analysis)
L_HIP = mp.solutions.pose.PoseLandmark.LEFT_HIP.value
L_KNEE = mp.solutions.pose.PoseLandmark.LEFT_KNEE.value
L_ANKLE = mp.solutions.pose.PoseLandmark.LEFT_ANKLE.value
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value

class DeadliftAnalyzer(BaseAnalyzer):
    """
    Analyzes form for the Deadlift exercise, focusing on hip and knee angles for depth and back positioning.
    Inherits MediaPipe setup and state management from BaseAnalyzer.
    """
    def __init__(self):
        super().__init__()
        # 'up' means standing tall (lockout), 'down' means in the bent position (bottom of lift)
        self.stage = "up" 

    def analyze_form(self, hip_angle, knee_angle):
        """Analyzes form and returns normalized score and issues."""
        issues = []
        score = 1.0 # Start perfect

        # Back Angle Check (Hip angle provides proxy for back straightness)
        # If hip angle is too low (excessive bend), it suggests a rounded back or bad hinge form.
        if hip_angle < 150: 
            issues.append("Maintain a straighter back (hip angle is low).")
            score *= 0.9
            
        # Knee Lockout Check (Standing position)
        if self.stage == "up" and knee_angle > 175:
            issues.append("Avoid hyperextending knees at the top/lockout.")
            score *= 0.95

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
            # Hip Angle (Shoulder-Hip-Knee) - Determines forward lean/back angle
            hip_angle = calculate_angle(l_shoulder, l_hip, l_knee)
            # Knee Angle (Hip-Knee-Ankle) - Determines knee bend
            knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
            
            # 3. Form Scoring
            current_score, feedback_issues = self.analyze_form(hip_angle, knee_angle)
            self.form_issues.extend(feedback_issues)
            
            # Accumulate the lowest score during the current rep
            self.current_rep_score = min(self.current_rep_score, current_score)

            # 4. Rep Counting Logic
            # UP position: standing straight (hip angle near 180)
            # DOWN position: squatting/bending (hip angle < 140)

            # Transition from UP to DOWN (Start of Eccentric phase/Lowering the bar)
            if hip_angle < 160 and self.stage == "up":
                self.stage = "down"

            # Transition from DOWN to UP (Rep completion/Lockout)
            if hip_angle > 170 and self.stage == "down":
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
