import sys
import numpy as np

# Mock mediapipe NormalizedLandmark
class MockLandmark:
    def __init__(self, x=0.5, y=0.5, z=0.0):
        self.x = x
        self.y = y
        self.z = z

class MockLandmarkList:
    def __init__(self, landmarks):
        self.landmark = landmarks

def create_pose(nose_x=0.5, nose_y=0.30, l_sh_y=0.50, r_sh_y=0.50, mouth_x=0.5, mouth_y=0.36):
    lm = [MockLandmark(0.5, 0.5) for _ in range(33)]
    lm[0] = MockLandmark(nose_x, nose_y, 0.0)
    lm[9] = MockLandmark(mouth_x - 0.02, mouth_y, 0.0)
    lm[10] = MockLandmark(mouth_x + 0.02, mouth_y, 0.0)
    lm[11] = MockLandmark(0.40, l_sh_y, 0.0)
    lm[12] = MockLandmark(0.60, r_sh_y, 0.0)
    return MockLandmarkList(lm)

def make_hand(wrist=(0.5, 0.7, 0.0), thumb_tip=(0.42, 0.55, 0.0),
              idx_mcp=(0.47, 0.55, 0.0), idx_tip=(0.47, 0.35, 0.0),
              mid_mcp=(0.50, 0.54, 0.0), mid_tip=(0.50, 0.33, 0.0),
              rng_mcp=(0.53, 0.55, 0.0), rng_tip=(0.53, 0.36, 0.0),
              pnk_mcp=(0.56, 0.56, 0.0), pnk_tip=(0.56, 0.40, 0.0)):
    lm = [MockLandmark(0.5, 0.5) for _ in range(21)]
    lm[0] = MockLandmark(*wrist)
    lm[1] = MockLandmark(wrist[0] - 0.03, wrist[1] - 0.05, wrist[2])
    lm[2] = MockLandmark(wrist[0] - 0.05, wrist[1] - 0.09, wrist[2])
    lm[3] = MockLandmark(wrist[0] - 0.06, wrist[1] - 0.12, wrist[2])
    lm[4] = MockLandmark(*thumb_tip)
    
    for f_idx, (mcp, tip, base_idx) in enumerate([
        (idx_mcp, idx_tip, 5),
        (mid_mcp, mid_tip, 9),
        (rng_mcp, rng_tip, 13),
        (pnk_mcp, pnk_tip, 17),
    ]):
        lm[base_idx] = MockLandmark(*mcp)
        # pip
        lm[base_idx + 1] = MockLandmark(
            mcp[0] * 0.67 + tip[0] * 0.33,
            mcp[1] * 0.67 + tip[1] * 0.33,
            mcp[2] * 0.67 + tip[2] * 0.33,
        )
        # dip
        lm[base_idx + 2] = MockLandmark(
            mcp[0] * 0.33 + tip[0] * 0.67,
            mcp[1] * 0.33 + tip[1] * 0.67,
            mcp[2] * 0.33 + tip[2] * 0.67,
        )
        # tip
        lm[base_idx + 3] = MockLandmark(*tip)

    return MockLandmarkList(lm)

from gesture_recognizer import GestureClassifier

pose = create_pose()

test_cases = [
    # 1. NO vs YES:
    # NO: Index & Middle tips pinching to Thumb tip, Ring and Pinky curled in palm
    ("NO (Beak Pinch)",
     make_hand(
         wrist=(0.5, 0.65, 0.0),
         thumb_tip=(0.48, 0.48, 0.0),
         idx_mcp=(0.47, 0.55, 0.0), idx_tip=(0.48, 0.48, 0.0),
         mid_mcp=(0.50, 0.54, 0.0), mid_tip=(0.49, 0.48, 0.0),
         rng_mcp=(0.53, 0.55, 0.0), rng_tip=(0.53, 0.60, 0.0), # curled
         pnk_mcp=(0.56, 0.56, 0.0), pnk_tip=(0.56, 0.61, 0.0)  # curled
     ),
     "NO"),

    # YES: S-fist (all 4 fingers curled into palm, thumb across fingers, not pinching)
    ("YES (Closed S-Fist)",
     make_hand(
         wrist=(0.5, 0.65, 0.0),
         thumb_tip=(0.48, 0.54, -0.02),
         idx_mcp=(0.47, 0.55, 0.0), idx_tip=(0.47, 0.60, 0.0),
         mid_mcp=(0.50, 0.54, 0.0), mid_tip=(0.50, 0.60, 0.0),
         rng_mcp=(0.53, 0.55, 0.0), rng_tip=(0.53, 0.60, 0.0),
         pnk_mcp=(0.56, 0.56, 0.0), pnk_tip=(0.56, 0.60, 0.0)
     ),
     "YES"),


    # HELLO: Open flat hand at temple/forehead level
    ("HELLO (Salute / Wave)",
     make_hand(
         wrist=(0.60, 0.38, 0.0),
         thumb_tip=(0.55, 0.30, 0.0),
         idx_mcp=(0.60, 0.30, 0.0), idx_tip=(0.60, 0.16, 0.0), # forehead / temple height
         mid_mcp=(0.63, 0.29, 0.0), mid_tip=(0.63, 0.14, 0.0),
         rng_mcp=(0.66, 0.30, 0.0), rng_tip=(0.66, 0.16, 0.0),
         pnk_mcp=(0.69, 0.31, 0.0), pnk_tip=(0.69, 0.19, 0.0)
     ),
     "HELLO"),

    # 4 Fingers on CHIN -> Must be THANK_YOU!
    ("THANK_YOU (4 fingers on chin)",
     make_hand(
         wrist=(0.50, 0.52, 0.0), # wrist below chin
         thumb_tip=(0.46, 0.44, 0.0), # thumb rested/folded
         idx_mcp=(0.48, 0.44, 0.0), idx_tip=(0.49, 0.36, 0.0), # fingertips on chin/mouth
         mid_mcp=(0.50, 0.44, 0.0), mid_tip=(0.50, 0.35, 0.0),
         rng_mcp=(0.52, 0.44, 0.0), rng_tip=(0.51, 0.36, 0.0),
         pnk_mcp=(0.54, 0.45, 0.0), pnk_tip=(0.53, 0.38, 0.0)
     ),
     "THANK_YOU"),

    # YOU: Solo index pointing FORWARD at camera
    ("YOU",
     make_hand(
         wrist=(0.65, 0.65, 0.0),
         thumb_tip=(0.62, 0.58, 0.0),
         idx_mcp=(0.65, 0.52, 0.0), idx_tip=(0.65, 0.50, -0.14), # pointing forward (z negative, dy small)
         mid_mcp=(0.68, 0.52, 0.0), mid_tip=(0.68, 0.59, 0.0),
         rng_mcp=(0.71, 0.53, 0.0), rng_tip=(0.71, 0.60, 0.0),
         pnk_mcp=(0.74, 0.54, 0.0), pnk_tip=(0.74, 0.60, 0.0)
     ),
     "YOU"),

    # YOU: Solo index pointing forward & upward at laptop webcam
    ("YOU (Angled upward at webcam)",
     make_hand(
         wrist=(0.50, 0.65, 0.0),
         thumb_tip=(0.47, 0.58, 0.0),
         idx_mcp=(0.50, 0.55, 0.0), idx_tip=(0.50, 0.44, -0.10),
         mid_mcp=(0.53, 0.55, 0.0), mid_tip=(0.53, 0.60, 0.0),
         rng_mcp=(0.56, 0.56, 0.0), rng_tip=(0.56, 0.61, 0.0),
         pnk_mcp=(0.59, 0.57, 0.0), pnk_tip=(0.59, 0.61, 0.0)
     ),
     "YOU"),

    # I: Solo index pointing INWARD at chest
    ("I (Me / Self)",
     make_hand(
         wrist=(0.50, 0.60, 0.0),
         thumb_tip=(0.48, 0.54, 0.0),
         idx_mcp=(0.50, 0.52, 0.0), idx_tip=(0.50, 0.55, 0.14), # pointing inward toward chest (z positive)
         mid_mcp=(0.52, 0.52, 0.0), mid_tip=(0.52, 0.58, 0.0),
         rng_mcp=(0.54, 0.53, 0.0), rng_tip=(0.54, 0.59, 0.0),
         pnk_mcp=(0.56, 0.54, 0.0), pnk_tip=(0.56, 0.59, 0.0)
     ),
     "I"),

    # LOOK: Index + Middle forward spread
    ("LOOK",
     make_hand(
         wrist=(0.65, 0.65, 0.0),
         thumb_tip=(0.61, 0.58, 0.0),
         idx_mcp=(0.63, 0.52, 0.0), idx_tip=(0.58, 0.50, -0.14), # pointing forward spread
         mid_mcp=(0.67, 0.51, 0.0), mid_tip=(0.72, 0.50, -0.14),
         rng_mcp=(0.71, 0.53, 0.0), rng_tip=(0.71, 0.60, 0.0),
         pnk_mcp=(0.74, 0.54, 0.0), pnk_tip=(0.74, 0.60, 0.0)
     ),
     "LOOK"),

    # WE: Index + Middle forward together
    ("WE",
     make_hand(
         wrist=(0.65, 0.65, 0.0),
         thumb_tip=(0.61, 0.58, 0.0),
         idx_mcp=(0.64, 0.52, 0.0), idx_tip=(0.64, 0.50, -0.14),
         mid_mcp=(0.66, 0.51, 0.0), mid_tip=(0.66, 0.50, -0.14),
         rng_mcp=(0.71, 0.53, 0.0), rng_tip=(0.71, 0.60, 0.0),
         pnk_mcp=(0.74, 0.54, 0.0), pnk_tip=(0.74, 0.60, 0.0)
     ),
     "WE"),

    # PLEASE: Flat open hand on chest
    ("PLEASE",
     make_hand(
         wrist=(0.50, 0.55, 0.0), # wrist on chest
         thumb_tip=(0.46, 0.54, 0.0),
         idx_mcp=(0.48, 0.52, 0.0), idx_tip=(0.49, 0.48, 0.0), # fingertips on upper chest
         mid_mcp=(0.50, 0.52, 0.0), mid_tip=(0.50, 0.47, 0.0),
         rng_mcp=(0.52, 0.52, 0.0), rng_tip=(0.51, 0.48, 0.0),
         pnk_mcp=(0.54, 0.53, 0.0), pnk_tip=(0.53, 0.49, 0.0)
     ),
     "PLEASE"),

    # Number handshapes MUST NOT detect as numbers (should return None)
    ("Handshape 10 (Thumbs up) -> No number",
     make_hand(
         wrist=(0.5, 0.65, 0.0),
         thumb_tip=(0.42, 0.45, 0.0),
         idx_mcp=(0.47, 0.55, 0.0), idx_tip=(0.47, 0.60, 0.0),
         mid_mcp=(0.50, 0.54, 0.0), mid_tip=(0.50, 0.60, 0.0),
         rng_mcp=(0.53, 0.55, 0.0), rng_tip=(0.53, 0.60, 0.0),
         pnk_mcp=(0.56, 0.56, 0.0), pnk_tip=(0.56, 0.60, 0.0)
     ),
     "None"),

    ("Handshape 1 (Solo index up) -> No number",
     make_hand(
         wrist=(0.65, 0.65, 0.0),
         thumb_tip=(0.62, 0.58, 0.0),
         idx_mcp=(0.65, 0.52, 0.0), idx_tip=(0.65, 0.34, 0.0),
         mid_mcp=(0.68, 0.52, 0.0), mid_tip=(0.68, 0.59, 0.0),
         rng_mcp=(0.71, 0.53, 0.0), rng_tip=(0.71, 0.60, 0.0),
         pnk_mcp=(0.74, 0.54, 0.0), pnk_tip=(0.74, 0.60, 0.0)
     ),
     "None"),

    ("Handshape 2 (Index+mid up) -> No number",
     make_hand(
         wrist=(0.65, 0.65, 0.0),
         thumb_tip=(0.61, 0.58, 0.0),
         idx_mcp=(0.65, 0.52, 0.0), idx_tip=(0.65, 0.34, 0.0),
         mid_mcp=(0.68, 0.51, 0.0), mid_tip=(0.68, 0.33, 0.0),
         rng_mcp=(0.71, 0.53, 0.0), rng_tip=(0.71, 0.60, 0.0),
         pnk_mcp=(0.74, 0.54, 0.0), pnk_tip=(0.74, 0.60, 0.0)
     ),
     "None"),

    ("Handshape 4 (4 up in space) -> No number",
     make_hand(
         wrist=(0.70, 0.65, 0.0),
         thumb_tip=(0.66, 0.55, 0.0),
         idx_mcp=(0.67, 0.52, 0.0), idx_tip=(0.67, 0.34, 0.0),
         mid_mcp=(0.70, 0.51, 0.0), mid_tip=(0.70, 0.32, 0.0),
         rng_mcp=(0.73, 0.52, 0.0), rng_tip=(0.73, 0.34, 0.0),
         pnk_mcp=(0.76, 0.53, 0.0), pnk_tip=(0.76, 0.37, 0.0)
     ),
     "None"),
]

# Dual hand test cases
dual_test_cases = [
    ("HOW (Both hands cupped at chest)",
     make_hand(wrist=(0.40, 0.58, 0.0), thumb_tip=(0.42, 0.52, 0.0), idx_mcp=(0.42, 0.55, 0.0), idx_tip=(0.44, 0.50, 0.0)),
     make_hand(wrist=(0.60, 0.58, 0.0), thumb_tip=(0.58, 0.52, 0.0), idx_mcp=(0.58, 0.55, 0.0), idx_tip=(0.56, 0.50, 0.0)),
     "HOW"),
    ("WHAT (Both open hands spread wide)",
     make_hand(wrist=(0.25, 0.65, 0.0), thumb_tip=(0.20, 0.55, 0.0), idx_mcp=(0.24, 0.52, 0.0), idx_tip=(0.24, 0.34, 0.0), mid_mcp=(0.26, 0.51, 0.0), mid_tip=(0.26, 0.33, 0.0), rng_mcp=(0.28, 0.52, 0.0), rng_tip=(0.28, 0.34, 0.0), pnk_mcp=(0.30, 0.53, 0.0), pnk_tip=(0.30, 0.37, 0.0)),
     make_hand(wrist=(0.75, 0.65, 0.0), thumb_tip=(0.80, 0.55, 0.0), idx_mcp=(0.76, 0.52, 0.0), idx_tip=(0.76, 0.34, 0.0), mid_mcp=(0.74, 0.51, 0.0), mid_tip=(0.74, 0.33, 0.0), rng_mcp=(0.72, 0.52, 0.0), rng_tip=(0.72, 0.34, 0.0), pnk_mcp=(0.70, 0.53, 0.0), pnk_tip=(0.70, 0.37, 0.0)),
     "WHAT"),
]

if __name__ == '__main__':
    all_passed = True
    print("=== ASL RECOGNITION ACCURACY & DISAMBIGUATION TEST ===")
    for name, hand, expected in test_cases:
        res = GestureClassifier.classify_hand(hand, pose_landmarks=pose)
        detected = res.get("gesture") if res else "None"
        match = detected == expected
        status = "PASS" if match else "FAIL"
        if not match:
            all_passed = False
        print(f"[{status}] {name:30s} -> Expected: {expected:10s} | Got: {detected:10s}")

    for name, l_hand, r_hand, expected in dual_test_cases:
        res = GestureClassifier.classify_two_hands(l_hand, r_hand, pose_landmarks=pose)
        detected = res.get("gesture") if res else "None"
        match = detected == expected
        status = "PASS" if match else "FAIL"
        if not match:
            all_passed = False
        print(f"[{status}] {name:35s} -> Expected: {expected:10s} | Got: {detected:10s}")

    print("-" * 60)
    if all_passed:
        print("ALL TEST CASES PASSED PERFECTLY!")
        sys.exit(0)
    else:
        print("SOME TEST CASES FAILED!")
        sys.exit(1)
