import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle # Universal angle calculator

# Landmark indices for readability (Left side used for analysis)
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value
L_ELBOW = mp.solutions.pose.PoseLandmark.LEFT_ELBOW.value
L_WRIST = mp.solutions.pose.PoseLandmark.LEFT_WRIST.value

class RowAnalyzer(BaseAnalyzer):
    """
    Analyzes form for the Row exercise, focusing primarily on elbow angle for range of motion (ROM).
    Inherits MediaPipe setup and state management from BaseAnalyzer.
    """
    def __init__(self):
        super().__init__()
        # 'down' means full extension (start/end of rep), 'up' means full contraction (middle of rep)
        self.stage = "down"

    def _get_score_and_feedback(self, angle):
        """
        Scores the elbow angle based on typical rowing form (normalized 0.0-1.0).
        Lower angle (better contraction) gives a higher score.
        """
        issues = []
        score = 1.0 # Start perfect

        # Scoring logic based on contraction angle (smaller angle is better)
        if angle <= 95:
            score = 1.0 # Excellent ROM
        elif 95 < angle <= 110:
            score = 0.95 # Good ROM
        elif 110 < angle <= 130:
            score = 0.8
            issues.append("Partial Rep: Elbow angle too wide at contraction.")
        else:
            score = 0.6
            issues.append("Very low range of motion (minimal contraction).")
            
        return score, issues

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
            
            # Always track form issues for the current frame
            self.form_issues.extend(feedback_issues)

            # Accumulate the lowest score (worst form) during the current rep attempt
            if self.stage == "up":
                 self.current_rep_score = min(self.current_rep_score, frame_score)
            else:
                 # When in the extended stage, reset form issues for the next contraction
                 self.form_issues = []

            # 4. Rep Counting Logic
            # 'down' (fully extended): elbow angle is largest (e.g., > 160)
            # 'up' (retracted/contracted): elbow angle is smallest (e.g., < 100)
            
            # Transition from DOWN to UP (Start of Concentric phase/contraction)
            if elbow_angle < 100 and self.stage == "down":
                self.stage = "up"
                
            # Transition from UP to DOWN (Rep completion/Full extension)
            if elbow_angle > 160 and self.stage == "up":
                self.stage = "down"
                stage_changed = "rep"
                
                # Report the minimum score recorded during the entire rep
                score_to_report = self.current_rep_score 
                self.current_rep_score = 1.0 # Reset for next rep

                return score_to_report, feedback_issues, stage_changed

        except IndexError:
            self.form_issues.append("Not all required body parts are visible (Shoulder, Elbow, Wrist).")
        except Exception as e:
            self.form_issues.append(f"Analysis error: {str(e)}")
            
        # Return the lowest accumulated score and the current issues if no rep was completed
        return self.current_rep_score, self.form_issues, stage_changed
