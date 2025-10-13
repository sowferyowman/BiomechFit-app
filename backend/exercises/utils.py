import numpy as np

def calculate_angle(a, b, c):
    """
    Calculates the angle (in degrees) between three 2D points (A, B, C) 
    with B as the vertex. This is a core utility function used by all exercise analyzers.
    
    Args:
        a, b, c (list/array-like): Coordinates of the three points [x, y].
        
    Returns:
        float: The angle in degrees (0 to 180).
    """
    # Convert points to NumPy arrays for easy calculation
    a, b, c = np.array(a), np.array(b), np.array(c)
    
    # Calculate radians using arctan2 to handle all quadrants correctly
    radians = np.arctan2(c[1] - b[1], c[0] - b[0]) - np.arctan2(a[1] - b[1], a[0] - b[0])
    
    # Convert to degrees and take absolute value
    angle = np.abs(radians * 180.0 / np.pi)
    
    # Ensure angle is between 0 and 180 degrees
    if angle > 180.0:
        angle = 360 - angle
        
    return angle
