import mediapipe as mp
import numpy as np
import os
import time

# Suppress TensorFlow/MediaPipe logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'


class BaseAnalyzer:
    """
    Base class for all exercise analyzers.
    Handles:
      - Required joint visibility check
      - 5-second countdown before reps start
    """
    def __init__(self, required_landmarks=None):
        # MediaPipe setup
        self.mp_drawing = mp.solutions.drawing_utils
        self.mp_pose = mp.solutions.pose
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )

        # Rep + score tracking
        self.rep_count = 0
        self.stage = "start"
        self.current_rep_score = 5.0
        self.form_issues = []

        # Countdown system
        self.required_landmarks = required_landmarks or []
        self.ready = False               # All joints detected?
        self.countdown_done = False      # Countdown finished?
        self.countdown_start_time = None # When countdown begins
        self.countdown_seconds = 3       # Countdown length

    # ----------------------------------------------------
    # Landmark helper
    # ----------------------------------------------------
    def get_landmark_coords(self, landmarks, landmark_id):
        lm = landmarks[landmark_id]
        return [lm.x, lm.y]

    # ----------------------------------------------------
    # Check if ALL required joints are visible
    # ----------------------------------------------------
    def _all_joints_detected(self, landmarks):
        try:
            for lm_id in self.required_landmarks:
                lm = landmarks[lm_id]
                # Require 0.6 visibility or better
                if lm.visibility < 0.6:
                    return False
            return True
        except:
            return False

    # ----------------------------------------------------
    # Handles the 5-second countdown
    # ----------------------------------------------------
    def _handle_start_countdown(self):
        # Start countdown at first frame of full detection
        if self.countdown_start_time is None:
            self.countdown_start_time = time.time()
            return f"Get Ready: {self.countdown_seconds}"

        elapsed = int(time.time() - self.countdown_start_time)
        remaining = self.countdown_seconds - elapsed

        if remaining > 0:
            return f"Get Ready: {remaining}"

        # Countdown done
        self.countdown_done = True
        return "Start!"

    # ----------------------------------------------------
    # MUST be called at the start of every process_frame() in analyzers
    # ----------------------------------------------------
    def handle_readiness_and_countdown(self, landmarks):
        """
        Returns:
            (status_message, ready_flag)
            - If ready_flag is False → exercise SHOULD NOT proceed to rep logic.
            - If ready_flag is True → analyzer may continue with rep scoring/counting.
        """

        # 1. Check if all required joints are visible
        joints_ok = self._all_joints_detected(landmarks)

        if not joints_ok:
            # Reset countdown
            self.countdown_start_time = None
            self.countdown_done = False
            return "Waiting for full joint visibility...", False

        # 2. If countdown not done → run countdown
        if not self.countdown_done:
            msg = self._handle_start_countdown()
            return msg, False

        # 3. Ready for reps!
        return "Start!", True

    # ----------------------------------------------------
    # Subclasses override this
    # ----------------------------------------------------
    def process_frame(self, landmarks):
        raise NotImplementedError("Subclasses must implement process_frame().")