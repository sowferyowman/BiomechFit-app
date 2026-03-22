import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle

L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value
L_HIP = mp.solutions.pose.PoseLandmark.LEFT_HIP.value
L_KNEE = mp.solutions.pose.PoseLandmark.LEFT_KNEE.value
L_ANKLE = mp.solutions.pose.PoseLandmark.LEFT_ANKLE.value
L_FOOT_INDEX = mp.solutions.pose.PoseLandmark.LEFT_FOOT_INDEX.value

class SquatAnalyzer(BaseAnalyzer):
    """
    Expert-based Squat analyzer with countdown and readiness.
    """
    def __init__(self):
        super().__init__(required_landmarks=[
            L_SHOULDER, L_HIP, L_KNEE, L_ANKLE, L_FOOT_INDEX
        ])
        self.stage = "up"

    def rate_angle(self, angle, ideal_min, ideal_max, tolerance=20):
        if ideal_min <= angle <= ideal_max:
            return 5
        elif abs(angle - ideal_min) <= tolerance or abs(angle - ideal_max) <= tolerance:
            return 4
        elif abs(angle - ideal_min) <= 2 * tolerance or abs(angle - ideal_max) <= 2 * tolerance:
            return 3
        elif abs(angle - ideal_min) <= 3 * tolerance or abs(angle - ideal_max) <= 3 * tolerance:
            return 2
        else:
            return 1

    def analyze_form(self, hip_angle, knee_angle, ankle_angle):
        issues = []

        hip_score = self.rate_angle(hip_angle, 130, 160)
        knee_score = self.rate_angle(knee_angle, 100, 140)
        ankle_score = self.rate_angle(ankle_angle, 80, 110)

        if hip_score < 5:
            if hip_angle < 130:
                issues.append("Go slightly deeper to engage glutes.")
            elif hip_angle > 160:
                issues.append("Excessive torso lean — keep chest upright.")
        if knee_score < 5:
            if knee_angle > 140:
                issues.append("Shallow squat — go deeper.")
            elif knee_angle < 100:
                issues.append("Too deep — avoid dropping below parallel.")
        if ankle_score < 5:
            if ankle_angle < 80:
                issues.append("Limited ankle dorsiflexion — heels may lift.")
            elif ankle_angle > 110:
                issues.append("Too much dorsiflexion — adjust stance width.")

        final_score = round(
            (hip_score * 5 + knee_score * 5 + ankle_score * 4) / 14, 2
        )

        if final_score < 2:
            final_score = 2

        return final_score, issues

    def process_frame(self, landmarks):

        # -------------------------------------
        # 1. Wait until ALL required joints exist
        # -------------------------------------
        if not self.ready:
            if self._all_joints_detected(landmarks):
                self.ready = True
            else:
                return 0, ["Waiting for full body detection..."], None

        # -------------------------------------
        # 2. 3-second countdown
        # -------------------------------------
        if not self.countdown_done:
            msg = self._handle_start_countdown()
            return 0, [msg], None

        # -------------------------------------
        # 3. Normal squat logic
        # -------------------------------------
        self.form_issues = []
        stage_changed = None

        try:
            l_shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            l_hip = self.get_landmark_coords(landmarks, L_HIP)
            l_knee = self.get_landmark_coords(landmarks, L_KNEE)
            l_ankle = self.get_landmark_coords(landmarks, L_ANKLE)
            l_toe = self.get_landmark_coords(landmarks, L_FOOT_INDEX)

            hip_angle = calculate_angle(l_shoulder, l_hip, l_knee)
            knee_angle = calculate_angle(l_hip, l_knee, l_ankle)
            ankle_angle = calculate_angle(l_knee, l_ankle, l_toe)

            current_score, feedback = self.analyze_form(
                hip_angle, knee_angle, ankle_angle
            )
            self.form_issues.extend(feedback)

            if knee_angle < 140 and self.stage == "up":
                self.stage = "down"

            if knee_angle > 170 and self.stage == "down":
                self.stage = "up"
                stage_changed = "rep"
                return current_score, self.form_issues, stage_changed

        except IndexError:
            self.form_issues.append("Not all landmarks visible (shoulder–toe).")
        except Exception as e:
            self.form_issues.append(f"Analysis error: {str(e)}")

        return self.current_rep_score, self.form_issues, stage_changed