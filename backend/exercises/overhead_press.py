import time
import mediapipe as mp
from .base_analyzer import BaseAnalyzer
from .utils import calculate_angle

# Required landmarks
L_HIP = mp.solutions.pose.PoseLandmark.LEFT_HIP.value
L_SHOULDER = mp.solutions.pose.PoseLandmark.LEFT_SHOULDER.value
L_ELBOW = mp.solutions.pose.PoseLandmark.LEFT_ELBOW.value
L_WRIST = mp.solutions.pose.PoseLandmark.LEFT_WRIST.value
L_EAR = mp.solutions.pose.PoseLandmark.LEFT_EAR.value


class OverheadPressAnalyzer(BaseAnalyzer):

    def __init__(self):
        super().__init__(
            required_landmarks=[
                L_HIP, L_SHOULDER, L_ELBOW, L_WRIST, L_EAR
            ]
        )

        self.stage = "down"

        # Readiness system
        self.ready = False
        self.start_pose_ready = False
        self.start_pose_frames = 0
        self.countdown_done = False
        self.countdown_start_time = None

    # ---------------------------------------------------------
    #   JOINT DETECTION CHECK
    # ---------------------------------------------------------
    def _all_joints_detected(self, landmarks):
        try:
            for lm in self.required_landmarks:
                _ = landmarks[lm]
            return True
        except:
            return False

    # ---------------------------------------------------------
    #   STARTING POSITION CHECK (bar at shoulders)
    # ---------------------------------------------------------
    def _starting_position_ok(self, landmarks):
        try:
            hip = self.get_landmark_coords(landmarks, L_HIP)
            shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            elbow = self.get_landmark_coords(landmarks, L_ELBOW)

            shoulder_angle = calculate_angle(elbow, shoulder, hip)
            return shoulder_angle < 140  # Bar at shoulder height
        except:
            return False

    # ---------------------------------------------------------
    #   COUNTDOWN HANDLER (3 SECONDS)
    # ---------------------------------------------------------
    def _handle_countdown(self, seconds=3):
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
    #   FORM ANALYSIS (unchanged)
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

    def analyze_form(self, s_angle, e_angle, n_angle):
        issues = []

        shoulder_score = self.rate_angle(s_angle, 160, 180)
        elbow_score = self.rate_angle(e_angle, 170, 180)
        neck_score = self.rate_angle(n_angle, 170, 180)

        if shoulder_score < 5:
            issues.append("Improve shoulder flexion; press fully overhead.")

        if elbow_score < 5:
            issues.append("Lock out elbows fully at the top.")

        if neck_score < 5:
            issues.append("Keep head neutral; avoid forward head posture.")

        final_score = round(
            (0.5 * shoulder_score) +
            (0.3 * elbow_score) +
            (0.2 * neck_score), 1
        )

        return final_score, issues

    # ---------------------------------------------------------
    #       MAIN PROCESSING FUNCTION
    # ---------------------------------------------------------
    def process_frame(self, landmarks):

        # 1. Wait for all joints
        if not self.ready:
            if self._all_joints_detected(landmarks):
                self.ready = True
            else:
                return 0, ["Waiting for full body detection..."], None

        # 2. Wait for stable start pose
        if not self.start_pose_ready:
            if self._starting_position_ok(landmarks):
                self.start_pose_frames += 1
                if self.start_pose_frames > 10:  # ~0.5 seconds
                    self.start_pose_ready = True
                return 0, ["Hold your starting position..."], None
            else:
                self.start_pose_frames = 0
                return 0, ["Get into starting position..."], None

        # 3. Countdown
        if not self.countdown_done:
            msg = self._handle_countdown(seconds=3)
            return 0, [msg], None

        # 4. AFTER COUNTDOWN — normal rep logic
        self.form_issues = []
        stage_changed = None
        score_to_report = 5

        try:
            hip = self.get_landmark_coords(landmarks, L_HIP)
            shoulder = self.get_landmark_coords(landmarks, L_SHOULDER)
            elbow = self.get_landmark_coords(landmarks, L_ELBOW)
            wrist = self.get_landmark_coords(landmarks, L_WRIST)
            ear = self.get_landmark_coords(landmarks, L_EAR)

            s_angle = calculate_angle(elbow, shoulder, hip)
            e_angle = calculate_angle(shoulder, elbow, wrist)
            n_angle = calculate_angle(shoulder, ear, hip)

            score_to_report, feedback = self.analyze_form(s_angle, e_angle, n_angle)
            self.form_issues.extend(feedback)

            # REP DETECTION
            if s_angle < 140 and self.stage == "up":
                self.stage = "down"

            elif s_angle > 165 and self.stage == "down":
                self.stage = "up"
                stage_changed = "rep"
                return score_to_report, self.form_issues, stage_changed

        except Exception as e:
            self.form_issues.append(f"Analysis error: {str(e)}")

        return score_to_report, self.form_issues, stage_changed