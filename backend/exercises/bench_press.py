import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle

# Landmarks
L_HIP = mp.solutions.pose.PoseLandmark.LEFT_HIP.value
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value
L_ELBOW = mp.solutions.pose.PoseLandmark.LEFT_ELBOW.value
L_WRIST = mp.solutions.pose.PoseLandmark.LEFT_WRIST.value


class BenchPressAnalyzer(BaseAnalyzer):

    def __init__(self):
        super().__init__(required_landmarks=[
            L_HIP, L_SHOULDER, L_ELBOW, L_WRIST
        ])

        # Rep logic
        self.stage = "up"

        # Readiness/Countdown system
        self.ready = False
        self.start_pose_ready = False
        self.start_pose_frames = 0
        self.countdown_done = False
        self.countdown_start_time = None

    # ---------------------------------------------------------
    #   UTILITIES
    # ---------------------------------------------------------
    def _all_joints_detected(self, landmarks):
        try:
            for lm in self.required_landmarks:
                _ = landmarks[lm]
            return True
        except:
            return False

    def _starting_position_ok(self, landmarks):
        """User holding bar in starting 'up' position."""
        try:
            shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            elbow = self.get_landmark_coords(landmarks, L_ELBOW)
            wrist = self.get_landmark_coords(landmarks, L_WRIST)

            elbow_angle = calculate_angle(shoulder, elbow, wrist)

            # Bar at top position = elbows extended (130°–160°)
            return 130 < elbow_angle < 170
        except:
            return False

    def _handle_start_countdown(self, seconds=3):
        import time

        if self.countdown_start_time is None:
            self.countdown_start_time = time.time()

        elapsed = time.time() - self.countdown_start_time
        remaining = seconds - int(elapsed)

        if remaining > 0:
            return f"Starting in {remaining}..."
        else:
            self.countdown_done = True
            return "Start!"

    # ---------------------------------------------------------
    #   FORM SCORING
    # ---------------------------------------------------------
    def rate_angle(self, angle, ideal_min, ideal_max, tolerance=10):
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

    def analyze_form(self, shoulder_angle, elbow_angle, wrist_angle):
        issues = []

        shoulder_score = self.rate_angle(shoulder_angle, 40, 80)
        elbow_score = self.rate_angle(elbow_angle, 130, 150)
        wrist_score = self.rate_angle(wrist_angle, 160, 200)

        # Feedback
        if shoulder_score < 5:
            if shoulder_angle < 40:
                issues.append("Too deep — avoid excessive shoulder stress.")
            elif shoulder_angle > 80:
                issues.append("Range too shallow — lower bar slightly.")

        if elbow_score < 5:
            if elbow_angle < 130:
                issues.append("Incomplete lockout — extend slightly more.")
            elif elbow_angle > 150:
                issues.append("Avoid hyperextending elbows.")

        if wrist_score < 5:
            if wrist_angle < 160:
                issues.append("Wrist flexed — keep bar aligned with forearm.")
            elif wrist_angle > 200:
                issues.append("Avoid overextending wrist backward.")

        weighted = (shoulder_score * 0.45) + (elbow_score * 0.40) + (wrist_score * 0.15)
        return round(weighted, 2), issues

    # ---------------------------------------------------------
    #   MAIN PROCESSING
    # ---------------------------------------------------------
    def process_frame(self, landmarks):

        # 1 — Wait until all joints visible
        if not self.ready:
            if self._all_joints_detected(landmarks):
                self.ready = True
            else:
                return 0, ["Waiting for full body detection..."], None

        # 2 — Require stable starting position
        if not self.start_pose_ready:
            if self._starting_position_ok(landmarks):
                self.start_pose_frames += 1

                if self.start_pose_frames > 10:
                    self.start_pose_ready = True
                else:
                    return 0, ["Hold your starting top position..."], None
            else:
                self.start_pose_frames = 0
                return 0, ["Get into starting top position..."], None

        # 3 — 3-second countdown
        if not self.countdown_done:
            msg = self._handle_start_countdown(seconds=3)
            return 0, [msg], None

        # 4 — Normal rep analysis
        self.form_issues = []
        stage_changed = None
        current_score = 5

        try:
            hip = self.get_landmark_coords(landmarks, L_HIP)
            shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            elbow = self.get_landmark_coords(landmarks, L_ELBOW)
            wrist = self.get_landmark_coords(landmarks, L_WRIST)

            shoulder_angle = calculate_angle(elbow, shoulder, hip)
            elbow_angle = calculate_angle(shoulder, elbow, wrist)
            wrist_angle = calculate_angle(elbow, wrist, hip)

            current_score, fb = self.analyze_form(shoulder_angle, elbow_angle, wrist_angle)
            self.form_issues.extend(fb)

            # Rep detection
            if shoulder_angle < 60 and self.stage == "up":
                self.stage = "down"
            elif shoulder_angle > 90 and self.stage == "down":
                self.stage = "up"
                stage_changed = "rep"
                return current_score, self.form_issues, stage_changed

        except Exception as e:
            self.form_issues.append(f"Error: {str(e)}")

        return current_score, self.form_issues, stage_changed