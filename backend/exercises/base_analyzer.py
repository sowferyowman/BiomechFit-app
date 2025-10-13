import mediapipe as mp
import numpy as np
import os
# Suppress TensorFlow/MediaPipe logs
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

class BaseAnalyzer:
    """
    Base class for all exercise analyzers.
    Handles common setup for MediaPipe Pose detection.
    """
    def __init__(self):
        # MediaPipe utility to draw landmarks
        self.mp_drawing = mp.solutions.drawing_utils
        
        # MediaPipe Pose components
        self.mp_pose = mp.solutions.pose
        # Initialize Pose model once per analyzer instance
        self.pose = self.mp_pose.Pose(
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        
        # Common state variables for rep counting and scoring
        self.rep_count = 0
        self.stage = "start"  # Tracks the current phase (e.g., 'up', 'down')
        self.current_rep_score = 1.0 # Tracks the lowest score achieved during the current rep (0.0 to 1.0)
        self.form_issues = []

    def get_landmark_coords(self, landmarks, landmark_id):
        """Helper to safely extract (x, y) coordinates from a landmark list."""
        lm = landmarks[landmark_id]
        # Only return x, y coordinates for 2D angle calculation
        return [lm.x, lm.y]

    def process_frame(self, landmarks):
        """
        MANDATORY METHOD: Processes a single frame's landmarks to analyze form,
        count reps, and detect issues.

        Args:
            landmarks: The list of detected MediaPipe landmarks.

        Returns:
            A tuple: (score, issues, stage_changed)
            - score (float): Form score for the current frame (0.0 to 1.0).
            - issues (list[str]): List of detected form issues.
            - stage_changed (str | None): "rep" if a rep was completed, or None.
        """
        # Subclasses MUST implement this method
        raise NotImplementedError("Subclasses must implement the process_frame method.")
