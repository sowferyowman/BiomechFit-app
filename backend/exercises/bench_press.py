import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle # Universal angle calculator

# Landmark indices for readability (Left side used for analysis)
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value
L_ELBOW = mp.solutions.pose.PoseLandmark.LEFT_ELBOW.value
L_WRIST = mp.solutions.pose.PoseLandmark.LEFT_WRIST.value

class BenchPressAnalyzer(BaseAnalyzer):
    """
    Analyzes form for the Bench Press exercise, focusing on elbow angle.
    Inherits MediaPipe setup and state management from BaseAnalyzer.
    """
    def __init__(self):
        super().__init__()
        self.stage = "up"  # up, down

    def _get_score_and_feedback(self, angle):
        """
        Scores the elbow angle based on typical bench press form (normalized 0.0-1.0).
        """
        issues = []
        score = 1.0 # Start perfect

        # Ideal dumbbell bench press arm angle (elbow) ≈ 90° at bottom, 160–180° at top.
        if 85 <= angle <= 100:
            return 1.0, issues
        elif 70 <= angle < 85 or 100 < angle <= 120:
            issues.append("Minor Elbow Angle Adjustment Needed.")
            return 0.8, issues
        else:
            issues.append("Poor Elbow Angle: Risk of shoulder injury.")
            return 0.6, issues

    def process_frame(self, landmarks):
        self.form_issues = []
        stage_changed = None
        current_score = 1.0

        try:
            # 1. Get Coordinates
            l_shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            l_elbow = self.get_landmark_coords(landmarks, L_ELBOW)
            l_wrist = self.get_landmark_coords(landmarks, L_WRIST)

            # 2. Calculate Angle (Elbow)
            elbow_angle = calculate_angle(l_shoulder, l_elbow, l_wrist)
            
            # 3. Form Scoring
            frame_score, feedback_issues = self._get_score_and_feedback(elbow_angle)
            current_score = frame_score
            self.form_issues.extend(feedback_issues)

            # Accumulate the lowest score during the current rep
            self.current_rep_score = min(self.current_rep_score, current_score)

            # 4. Rep Counting Logic
            # Transition from UP to DOWN (Start of Eccentric phase)
            if elbow_angle < 120 and self.stage == "up":
                self.stage = "down"

            # Transition from DOWN to UP (Rep completion)
            if elbow_angle > 160 and self.stage == "down":
                self.stage = "up"
                stage_changed = "rep"
                
                # Report the lowest score recorded during the entire rep
                score_to_report = self.current_rep_score 
                self.current_rep_score = 1.0 # Reset for next rep

                return score_to_report, self.form_issues, stage_changed

        except IndexError:
            self.form_issues.append("Not all required body parts are visible (Shoulder, Elbow, Wrist).")
        except Exception as e:
            self.form_issues.append(f"Analysis error: {str(e)}")
            
        return self.current_rep_score, self.form_issues, stage_changed
