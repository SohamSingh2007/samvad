"""
ASL Gesture Recogniser — Core Phrases.

Targets:
  Phrases : YES · NO · PLEASE · THANK_YOU · I · YOU · WE · LOOK · WHAT · WELCOME · HOW · HELLO

Architecture:
  - Exact geometric feature extraction over 21 MediaPipe landmarks.
  - Orthogonal, mutually-exclusive decision tree partitioned by finger extension count (num_up).
  - 8-frame temporal hysteresis smoothing to completely prevent jitter and flicker.
"""

import time
from collections import deque
from typing import Dict, Optional, Tuple
import numpy as np

# ---------------------------------------------------------------------------
# Target sets (used by NameAndNumberAggregator)
# ---------------------------------------------------------------------------
_PHRASES = frozenset(("YES", "NO", "PLEASE", "THANK_YOU", "I", "YOU", "WE", "LOOK", "WHAT", "WELCOME", "HOW", "HOW_ARE_YOU", "HELLO", "HI"))

# Landmark index groups: (MCP, PIP, DIP, TIP)
_FINGERS = (
    (5,  6,  7,  8),   # 1 = Index
    (9,  10, 11, 12),  # 2 = Middle
    (13, 14, 15, 16),  # 3 = Ring
    (17, 18, 19, 20),  # 4 = Pinky
)


# ---------------------------------------------------------------------------
# Hand feature extractor
# ---------------------------------------------------------------------------
def _analyse(landmarks) -> Optional[Dict]:
    """
    Extract rotation-invariant features from 21 MediaPipe landmarks.
    Returns None if data is missing or hand is too small.
    """
    lms = landmarks.landmark
    if len(lms) < 21:
        return None

    pts = np.array([[lm.x, lm.y, lm.z] for lm in lms], dtype=np.float32)
    wrist      = pts[0]
    middle_mcp = pts[9]
    palm_scale = float(np.linalg.norm(middle_mcp - wrist))
    if palm_scale < 1e-4:
        return None

    # Palm-axis unit vector (wrist → middle MCP)
    u_hand = (middle_mcp - wrist) / palm_scale

    # ── Finger extension (index=1 … pinky=4) ──────────────────────────────
    ext: Dict[int, bool] = {}
    for f_id, (mcp_i, pip_i, dip_i, tip_i) in enumerate(_FINGERS, start=1):
        mcp = pts[mcp_i]; pip = pts[pip_i]; dip = pts[dip_i]; tip = pts[tip_i]
        d_tip_w = float(np.linalg.norm(tip - wrist))
        d_pip_w = float(np.linalg.norm(pip - wrist))
        d_mcp_w = float(np.linalg.norm(mcp - wrist))
        d_tip_mcp = float(np.linalg.norm(tip - mcp) / palm_scale)

        # Straightness metric: knuckle → PIP and PIP → TIP cosine
        vk = pip - mcp; vf = tip - pip
        lk = np.linalg.norm(vk); lf = np.linalg.norm(vf)
        straight = False
        if lk > 1e-4 and lf > 1e-4:
            cos_a = float(np.dot(vk, vf) / (lk * lf))
            straight = cos_a > 0.45

        # Projection along palm axis
        proj = float(np.dot(tip - mcp, u_hand) / palm_scale)

        # A finger is extended when tip is farther from wrist than PIP & MCP,
        # is straight, and extends past the knuckle (supports both 2D planar extension
        # and foreshortened camera-facing pointing)
        std_ext = (
            (d_tip_w > d_pip_w)
            and (d_tip_w > d_mcp_w * 1.25)
            and (d_tip_mcp > 0.65)
            and (straight or proj > 0.30)
        )
        fwd_ext = (
            straight
            and (d_tip_w > d_pip_w)
            and (d_tip_w > d_mcp_w * 1.05)
            and (tip[2] - mcp[2] < -0.015 or tip[2] - wrist[2] < -0.02)
            and (d_tip_mcp > 0.38)
        )
        ext[f_id] = bool(std_ext or fwd_ext)

    # ── Thumb extension (index=0) ──────────────────────────────────────────
    t_tip = pts[4]; t_ip = pts[3]; t_mcp = pts[2]
    d_ti  = float(np.linalg.norm(t_tip - pts[5])  / palm_scale)  # thumb tip ↔ index MCP
    d_tr  = float(np.linalg.norm(t_tip - pts[13]) / palm_scale)  # thumb tip ↔ ring MCP
    d_tp  = float(np.linalg.norm(t_tip - pts[17]) / palm_scale)  # thumb tip ↔ pinky MCP
    d_tw  = float(np.linalg.norm(t_tip - wrist)   / palm_scale)  # thumb tip ↔ wrist

    # Thumb straightness
    v1 = t_ip - t_mcp; v2 = t_tip - t_ip
    l1 = np.linalg.norm(v1); l2 = np.linalg.norm(v2)
    t_cos = float(np.dot(v1, v2) / max(1e-4, l1 * l2))

    # Extended if sticking out away from index & pinky MCPs
    ext[0] = bool(
        (d_ti > 0.45 and d_tp > 0.75 and t_cos > 0.25)
        or (d_tw > 0.72 and d_ti > 0.42 and d_tp > 0.68)
    )

    # ── Tip-to-tip distances (normalised by palm_scale) ───────────────────
    d_t_idx = float(np.linalg.norm(t_tip - pts[8])  / palm_scale)
    d_t_mid = float(np.linalg.norm(t_tip - pts[12]) / palm_scale)
    d_t_rng = float(np.linalg.norm(t_tip - pts[16]) / palm_scale)
    d_t_pnk = float(np.linalg.norm(t_tip - pts[20]) / palm_scale)
    d_i_m   = float(np.linalg.norm(pts[8] - pts[12]) / palm_scale)  # index ↔ middle tip spread

    return {
        "pts":        pts,
        "u_hand":     u_hand,
        "palm_scale": palm_scale,
        "ext":        ext,           # {0:T, 1:I, 2:M, 3:R, 4:P}
        # thumb ↔ MCP distances
        "d_ti": d_ti, "d_tr": d_tr, "d_tp": d_tp, "d_tw": d_tw,
        # thumb ↔ tip distances
        "d_t_idx": d_t_idx, "d_t_mid": d_t_mid,
        "d_t_rng": d_t_rng, "d_t_pnk": d_t_pnk,
        # spread metric
        "d_i_m": d_i_m,
    }


# ---------------------------------------------------------------------------
# Gesture Classifier
# ---------------------------------------------------------------------------
class GestureClassifier:
    """
    Orthogonal, partitioned decision tree mapped to target conversational phrases.
    Partitioned strictly by finger count (num_up = I + M + R + P).
    """

    @staticmethod
    def classify_hand(landmarks, pose_landmarks=None, chin_touch_active: bool = False) -> Optional[Dict]:
        f = _analyse(landmarks)
        if f is None:
            return None

        pts = f["pts"]
        ext = f["ext"]
        T, I, M, R, P = ext[0], ext[1], ext[2], ext[3], ext[4]
        num_up = int(I) + int(M) + int(R) + int(P)

        fb = {
            "thumb": bool(T), "index": bool(I), "middle": bool(M),
            "ring": bool(R), "pinky": bool(P)
        }

        def _r(gesture, label, gtype="phrase", conf=0.99):
            return {
                "gesture": gesture, "type": gtype, "label": label,
                "confidence": conf, "fingers": fb
            }

        # ── Geometric vectors & direction metrics ─────────────────────────
        dx_i   = abs(float(pts[8, 0] - pts[5, 0]))          # horizontal spread
        dy_i   = float(pts[8, 1] - pts[5, 1])               # neg = tip above knuckle
        dz_knk = float(pts[8, 2] - pts[5, 2])               # neg = tip closer to camera than knuckle
        dz_wri = float(pts[8, 2] - pts[0, 2])               # neg = tip closer to camera than wrist

        # Finger direction flags
        is_idx_up = I and (dy_i <= -0.075) and (abs(dy_i) > 0.85 * dx_i)
        is_mid_up = M and (float(pts[12, 1] - pts[9, 1]) <= -0.075)

        # Pure vertical pointing straight UP toward ceiling (former number 1, no forward depth)
        is_idx_pure_up = I and (dy_i <= -0.11) and (abs(dy_i) > 1.1 * dx_i) and (dz_knk > -0.02) and (dz_wri > -0.025)

        # Index tip pointing FORWARD at camera / screen
        is_idx_fwd = I and (
            (dz_knk < -0.018 or dz_wri < -0.025)
            or (dy_i > -0.13 and dz_knk < 0.005)
        )
        is_mid_fwd = M and (
            (float(pts[12, 2] - pts[9, 2]) < -0.018 or float(pts[12, 2] - pts[0, 2]) < -0.025)
            or float(pts[12, 1] - pts[9, 1]) > -0.13
        )

        # ── Pose-based spatial zones ──────────────────────────────────────
        nose_x = 0.5; nose_y = 0.35; shoulder_y = 0.55; shoulder_z = 0.0
        hand_at_chest = False; hand_at_head = False; hand_strictly_on_chest = False
        hand_at_chin = False

        tip_x = float(pts[12, 0]); tip_y = float(pts[12, 1])
        idx_tip_y = float(pts[8, 1]); mcp_y = float(pts[9, 1])
        wl = landmarks.landmark[0]

        if pose_landmarks and len(pose_landmarks.landmark) > 12:
            nose       = pose_landmarks.landmark[0]
            nose_x     = nose.x;  nose_y = nose.y
            l_sh       = pose_landmarks.landmark[11]
            r_sh       = pose_landmarks.landmark[12]
            shoulder_y = (l_sh.y + r_sh.y) / 2.0
            shoulder_z = (l_sh.z + r_sh.z) / 2.0
            chest_y    = (nose_y + shoulder_y) / 2.0

            # Chin / mouth location estimation
            if len(pose_landmarks.landmark) > 10:
                mouth_x = (pose_landmarks.landmark[9].x + pose_landmarks.landmark[10].x) / 2.0
                mouth_y = (pose_landmarks.landmark[9].y + pose_landmarks.landmark[10].y) / 2.0
                chin_x = mouth_x
                chin_y = mouth_y + 0.04
            else:
                mouth_x = nose_x
                mouth_y = nose_y + 0.08
                chin_x = nose_x
                chin_y = nose_y + 0.12

            # General upper body zone (used for self-pointing "I")
            hand_at_chest = (
                chest_y - 0.08 < wl.y < shoulder_y + 0.30
                and abs(wl.x - nose_x) < 0.35
            )

            # Strictly placed on the chest (sternum/chest center, touching torso)
            # All fingertips must also be on/below upper chest, not raised up into the air
            wl_z = getattr(wl, 'z', 0.0)
            highest_tip_y = min(float(pts[8, 1]), float(pts[12, 1]), float(pts[16, 1]))
            hand_strictly_on_chest = (
                shoulder_y - 0.04 < wl.y < shoulder_y + 0.22
                and abs(wl.x - nose_x) < 0.20
                and (wl_z >= shoulder_z - 0.15)
                and highest_tip_y > shoulder_y - 0.04
            )

            # Chin / lower face zone for THANK YOU:
            # Fingertips (middle or index) close to chin/mouth center
            d_mid_chin = float(np.hypot(pts[12, 0] - chin_x, pts[12, 1] - chin_y))
            d_idx_chin = float(np.hypot(pts[8, 0] - chin_x, pts[8, 1] - chin_y))
            d_mid_mouth = float(np.hypot(pts[12, 0] - mouth_x, pts[12, 1] - mouth_y))
            d_idx_mouth = float(np.hypot(pts[8, 0] - mouth_x, pts[8, 1] - mouth_y))
            min_dist_chin = min(d_mid_chin, d_idx_chin, d_mid_mouth, d_idx_mouth)

            hand_at_chin = (
                min_dist_chin < 0.11
                and min(abs(pts[12, 0] - mouth_x), abs(pts[8, 0] - mouth_x)) < 0.11
                and (mouth_y - 0.05 <= min(tip_y, idx_tip_y) <= chin_y + 0.06)
                and not hand_strictly_on_chest
            )

            # General head level (eyes/forehead/head) - NOT used for Thank You
            eye_y = min(pose_landmarks.landmark[2].y, pose_landmarks.landmark[5].y)
            hand_at_head = (
                (tip_y < nose_y + 0.08 or wl.y < nose_y + 0.18)
                and abs(tip_x - nose_x) < 0.45
                and wl.y < shoulder_y + 0.15
            )
        else:
            # Standalone hand fallback when pose landmarks are absent
            # Center of mouth/chin is near (x=0.50, y=0.35)
            d_c = min(float(np.hypot(pts[12, 0] - 0.50, pts[12, 1] - 0.35)),
                      float(np.hypot(pts[8, 0] - 0.50, pts[8, 1] - 0.35)))
            hand_at_chin = (
                d_c < 0.11
                and 0.25 <= min(tip_y, idx_tip_y) <= 0.44
                and 0.38 < tip_x < 0.62
            )
            hand_at_head = (tip_y < 0.45 and 0.20 < tip_x < 0.80)

        # Hand vertical pointing up in open space
        is_five_up = (
            T and I and M and R and P
            and dy_i <= -0.075
            and abs(dy_i) > 0.85 * dx_i
            and is_mid_up
            and not hand_at_chin
            and not hand_strictly_on_chest
        )

        # ================================================================
        # CONTACT GESTURE: NO (Index + Middle pinching to Thumb tip)
        # In ASL, Index and Middle fingers reach forward to tap the thumb tip (beak pinch).
        # Ring and Pinky fingers are curled into the palm.
        # Works even if fingers bend downward toward thumb (num_up == 0 or 2).
        # ================================================================
        is_no_pinch = (
            f["d_t_idx"] < 0.44
            and f["d_t_mid"] < 0.44
            and f["d_i_m"] < 0.38
            and (not R and not P)
            and f["d_t_pnk"] > 0.35
        )
        if is_no_pinch:
            fb_no = dict(fb)
            fb_no.update({"thumb": True, "index": True, "middle": True, "ring": False, "pinky": False})
            return {"gesture": "NO", "type": "phrase", "label": "NO",
                    "confidence": 0.99, "fingers": fb_no}

        # ================================================================
        # GESTURE: THANK YOU (Flat open B-hand / 4-hand / 5-hand at chin/mouth moving outward)
        # Phase 1: Flat hand raised to chin / lips (fingers I, M, R extended).
        # Phase 2: Forward stroke moving outward/forward from the chin toward the person.
        # Works with thumb relaxed/folded (B-hand) or thumb open (5-hand).
        # ================================================================
        is_at_chin = (
            (I and M and R)
            and hand_at_chin
            and not hand_strictly_on_chest
        )
        is_forward_from_chin = (
            chin_touch_active
            and (I and M and R)
            and not hand_strictly_on_chest
            and abs(tip_x - nose_x) < 0.25
            and (nose_y - 0.04 <= min(tip_y, idx_tip_y) <= shoulder_y + 0.18)
            and dy_i < 0.10
        )

        if is_at_chin or is_forward_from_chin:
            not_pinch = (f["d_t_idx"] > 0.30 and f["d_t_mid"] > 0.30 and f["d_t_rng"] > 0.30)
            not_pointing_down = dy_i < 0.10
            if not_pinch and not_pointing_down:
                return _r("THANK_YOU", "THANK YOU")

        # ================================================================
        # GESTURE: HELLO (Open flat hand at temple/forehead/eye level, salute or wave)
        # In ASL, HELLO is signed with an open flat hand (B-hand or 5-hand) near the
        # temple or forehead (salute motion moving outward) or open hand waving at head level.
        # Height: tip_y < nose_y + 0.04 (at forehead/eye/temple level).
        # Must NOT be at chin (THANK_YOU) or on chest (PLEASE).
        # ================================================================
        is_hello = (
            (I and M and R)
            and hand_at_head
            and (tip_y < nose_y + 0.04 or (tip_y < mouth_y - 0.02 and abs(tip_x - nose_x) > 0.08))
            and not hand_at_chin
            and not hand_strictly_on_chest
            and f["d_t_idx"] > 0.35
            and f["d_t_mid"] > 0.35
        )
        if is_hello:
            return _r("HELLO", "HELLO")

        # ================================================================
        # CATEGORY 0: num_up == 0  (Closed fist or curled fingers)
        # Differentiates:
        #   - 10: Thumbs-Up (thumb extended straight UP)
        #   - NO: Beak pinch (index & middle touching thumb tip)
        #   - YES: S-fist (all fingers and thumb curled into fist)
        # ================================================================
        if num_up == 0:
            dy_t    = float(pts[4, 1] - pts[2, 1])          # neg = thumb tip above thumb MCP
            abv_knk = float(pts[5, 1] - pts[4, 1])          # pos = thumb tip above index knuckle
            d_ti    = f["d_ti"]                             # thumb tip to index MCP distance
            d_t_idx = f["d_t_idx"]                          # thumb tip to index tip distance

            # Thumbs-Up: Thumb extended up in the air (number 10 disabled, not a YES fist)
            is_thumbs_up = (
                abv_knk > 0.045
                and dy_t < -0.055
                and d_ti > 0.45
                and d_t_idx > 0.45
                and f["d_tw"] > 0.70
            )
            if is_thumbs_up:
                return None

            # NO: If index & middle tips meet thumb tip while curled down
            if (f["d_t_idx"] < 0.44 and f["d_t_mid"] < 0.44 and f["d_i_m"] < 0.38 and not R and not P):
                fb_no = dict(fb)
                fb_no.update({"thumb": True, "index": True, "middle": True, "ring": False, "pinky": False})
                return {"gesture": "NO", "type": "phrase", "label": "NO",
                        "confidence": 0.99, "fingers": fb_no}

            # YES: Closed S-fist in active signing space
            # In a fist, fingertips curl inside to palm, NOT pinching thumb tip
            is_in_signing_space = (pts[0, 1] < 0.90 and 0.10 < pts[0, 0] < 0.90)
            if is_in_signing_space and not (f["d_t_idx"] < 0.40 and f["d_t_mid"] < 0.40):
                fb_yes = dict(fb)
                fb_yes.update({"thumb": False, "index": False, "middle": False, "ring": False, "pinky": False})
                return {"gesture": "YES", "type": "phrase", "label": "YES",
                        "confidence": 0.99, "fingers": fb_yes}

            return None

        # ================================================================
        # CATEGORY 1: num_up == 1  (Solo index finger)
        # ================================================================
        if num_up == 1 and I:
            # 1. Pure vertical pointing straight UP toward ceiling (number 1 - disabled)
            if is_idx_pure_up:
                return None

            # 2. Pointing INWARD at self / chest -> I
            # Finger is tilted toward body (z neutral/positive) and NOT pointing upward in the air
            index_low = pts[8, 1] > nose_y + 0.08
            is_pointing_at_chest = (
                (hand_at_chest or index_low)
                and dy_i > -0.08
                and dz_knk >= -0.015
                and abs(pts[8, 0] - nose_x) < 0.25
                and not (dz_knk < -0.02 or dz_wri < -0.03)
            )
            if is_pointing_at_chest:
                return _r("I", "I")

            # 3. Pointing FORWARD at camera / interlocutor -> YOU
            if is_idx_fwd or (dy_i > -0.14 and not is_pointing_at_chest):
                return _r("YOU", "YOU")

            return None

        # ================================================================
        # CATEGORY 2: num_up == 2  (Index + Middle)
        # ================================================================
        if num_up == 2 and I and M:
            # NO: Index + Middle tips pinch down to touch thumb tip
            if f["d_t_idx"] < 0.32 and f["d_t_mid"] < 0.32:
                return _r("NO", "NO")

            # LOOK / WE: Pointing FORWARD at camera
            if is_idx_fwd and is_mid_fwd:
                if f["d_i_m"] > 0.22:
                    return _r("LOOK", "LOOK")      # fingers spread forward -> LOOK
                return _r("WE", "WE")              # fingers together forward -> WE

            return None

        # ================================================================
        # CATEGORY 3: num_up == 3  (Remaining 3-finger gestures)
        # ================================================================
        if num_up == 3:
            # Fallback for 3-finger Thank You at chin
            if hand_at_chin and I and M and R and not hand_strictly_on_chest:
                return _r("THANK_YOU", "THANK YOU")

            return None

        # ================================================================
        # CATEGORY 4: num_up == 4  (Index, Middle, Ring, Pinky extended)
        # ================================================================
        if num_up == 4:
            # If 4 fingers are at chin, this is THANK YOU (flat B-hand)
            if hand_at_chin and (I and M and R):
                return _r("THANK_YOU", "THANK YOU")

            # PLEASE: Open B-hand flat against chest (thumb rested/tucked near index, palm flat on sternum)
            if hand_strictly_on_chest and not is_five_up:
                if f["d_tp"] < 0.75 or f["d_ti"] < 0.45 or (pts[8, 2] - pts[0, 2] >= -0.04):
                    return _r("PLEASE", "PLEASE")
                return _r("WELCOME", "WELCOME")

            # WHAT: Open hands flat/tilted forward
            if not hand_strictly_on_chest and dy_i > -0.08 and not is_five_up and not hand_at_chin:
                return _r("WHAT", "WHAT")

        # Single-hand HOW (cupped curved hand at chest level, palm rolling upward)
        if hand_at_chest and not hand_strictly_on_chest and dy_i > -0.09 and not is_five_up and not (M and R and P):
            if (num_up >= 2 or T) and abs(pts[8, 0] - nose_x) < 0.28:
                return _r("HOW", "HOW")

        return None

    @staticmethod
    def classify_two_hands(left_landmarks, right_landmarks, pose_landmarks=None, chin_touch_active: bool = False) -> Optional[Dict]:
        """
        Dual-hand detection for THANK_YOU, WE, WHAT, and HOW.
        """
        if left_landmarks is None or right_landmarks is None:
            return None
        fl = _analyse(left_landmarks)
        fr = _analyse(right_landmarks)
        if fl is None or fr is None:
            return None

        el = fl["ext"]; er = fr["ext"]

        # THANK_YOU (two flat hands at chin/face level OR moving forward together from chin)
        if el[1] and el[2] and er[1] and er[2]:
            tip_l_y = fl["pts"][12, 1]; tip_r_y = fr["pts"][12, 1]
            if pose_landmarks and len(pose_landmarks.landmark) > 12:
                shoulder_y = (pose_landmarks.landmark[11].y + pose_landmarks.landmark[12].y) / 2.0
                nose_y = pose_landmarks.landmark[0].y
                nose_x = pose_landmarks.landmark[0].x
                at_chin_two = (
                    min(tip_l_y, tip_r_y) < nose_y + 0.12
                    and max(tip_l_y, tip_r_y) > nose_y - 0.05
                    and abs(fl["pts"][12, 0] - nose_x) < 0.22
                    and abs(fr["pts"][12, 0] - nose_x) < 0.22
                )
                fwd_from_chin_two = chin_touch_active and min(tip_l_y, tip_r_y) < shoulder_y + 0.15
                if at_chin_two or fwd_from_chin_two:
                    return {"gesture": "THANK_YOU", "type": "phrase", "label": "THANK YOU",
                            "confidence": 0.99,
                            "fingers": {"thumb": bool(fl["ext"][0]), "index": True, "middle": True,
                                        "ring": bool(fl["ext"][3]), "pinky": bool(fl["ext"][4])}}

        # WHAT (both open hands): >= 3 fingers up on each hand, spread wide
        nl = int(el[1]) + int(el[2]) + int(el[3]) + int(el[4])
        nr = int(er[1]) + int(er[2]) + int(er[3]) + int(er[4])
        wl_l = fl["pts"][0]; wl_r = fr["pts"][0]
        hand_dist_x = abs(float(wl_l[0] - wl_r[0]))
        hand_dist_y = abs(float(wl_l[1] - wl_r[1]))
        tip_dist    = float(np.linalg.norm(fl["pts"][8] - fr["pts"][8]))

        if nl >= 3 and nr >= 3 and hand_dist_x >= 0.35:
            return {"gesture": "WHAT", "type": "phrase", "label": "WHAT",
                    "confidence": 0.97,
                    "fingers": {"thumb": bool(fl["ext"][0]), "index": True, "middle": True,
                                "ring": True, "pinky": bool(fl["ext"][4])}}

        # WE (both-hand V): index + middle on each hand pointing outward (ring and pinky curled)
        if el[1] and el[2] and er[1] and er[2] and not (el[3] or er[3] or el[4] or er[4]):
            return {"gesture": "WE", "type": "phrase", "label": "WE",
                    "confidence": 0.98,
                    "fingers": {"thumb": False, "index": True, "middle": True,
                                "ring": False, "pinky": False}}

        # HOW (both hands cupped at chest level rolling up, backs together)
        # As illustrated in asl_how_are_you.jpg:
        is_chest_level = True
        if pose_landmarks and len(pose_landmarks.landmark) > 12:
            shoulder_y = (pose_landmarks.landmark[11].y + pose_landmarks.landmark[12].y) / 2.0
            is_chest_level = (shoulder_y - 0.10 < wl_l[1] < shoulder_y + 0.35)

        if is_chest_level and hand_dist_y < 0.20 and hand_dist_x < 0.35 and tip_dist < 0.30:
            return {
                "gesture": "HOW",
                "type": "phrase",
                "label": "HOW (Cupped hands at chest)",
                "confidence": 0.99,
                "fingers": {"thumb": True, "index": True, "middle": True, "ring": True, "pinky": True}
            }

        return None


# ---------------------------------------------------------------------------
# Voting aggregator — smooths per-frame predictions into confirmed events
# ---------------------------------------------------------------------------
class NameAndNumberAggregator:
    """
    Temporal aggregator enforcing continuous stability for a minimum hold duration (default 2.0s).
    A sign is strictly taken and emitted only if the user holds the gesture stably for at least 2.0 seconds.
    """

    def __init__(self, window_size: int = 8, min_votes: int = 4, hold_duration_required: float = 1.0):
        self.window_size = window_size
        self.min_votes   = min_votes
        self.hold_duration_required = hold_duration_required  # Must hold stable for 1.0s
        self.history: deque = deque(maxlen=window_size)
        self.instant_history: deque = deque(maxlen=window_size)
        self.last_committed: Optional[str] = None
        self.current_stable: Optional[Dict] = None
        self.consecutive_empty: int = 0
        self.last_fingers: Dict[str, bool] = {
            k: False for k in ("thumb", "index", "middle", "ring", "pinky")
        }
        # 2-second stability hold tracking
        self.candidate_gesture: Optional[str] = None
        self.candidate_start_time: float = 0.0
        self.current_hold_elapsed: float = 0.0
        self.candidate_committed: bool = False

        # Dynamic trajectory tracking for gestures
        self.last_chin_touch_time: float = 0.0
        self.chin_touch_pos: Optional[Tuple[float, float, float]] = None
        self.thank_you_forward_detected: bool = False

    @property
    def hold_progress(self) -> float:
        if not self.candidate_gesture or self.hold_duration_required <= 0:
            return 0.0
        return float(min(1.0, self.current_hold_elapsed / self.hold_duration_required))

    def process_hands(
        self,
        left_landmarks=None,
        right_landmarks=None,
        pose_landmarks=None,
    ) -> Tuple[Optional[Dict], Optional[Dict]]:
        """
        Returns (stable_result, confirmed_event).
        stable_result: Hysteresis-locked active sign (only populated after holding stably for >= 2.0s).
        confirmed_event: Committed event for sentence subtitle formation (emitted only after 2.0s hold).
        """
        now = time.time()
        # Active chin touch window (within 1.2s of raising to chin)
        chin_touch_active = (now - self.last_chin_touch_time) < 1.2

        instant = None
        if left_landmarks is not None and right_landmarks is not None:
            instant = GestureClassifier.classify_two_hands(
                left_landmarks, right_landmarks, pose_landmarks=pose_landmarks,
                chin_touch_active=chin_touch_active
            )
        if instant is None:
            active = right_landmarks or left_landmarks
            if active is not None:
                instant = GestureClassifier.classify_hand(
                    active, pose_landmarks=pose_landmarks,
                    chin_touch_active=chin_touch_active
                )

        # Track hand position for forward stroke detection
        active_landmarks = right_landmarks or left_landmarks
        if active_landmarks:
            tip = active_landmarks.landmark[12]
            tip_pos = (tip.x, tip.y, getattr(tip, 'z', 0.0))

            # Phase 1: Detect and lock chin touch position
            if instant and instant.get("gesture") == "THANK_YOU":
                if pose_landmarks and len(pose_landmarks.landmark) > 12:
                    nose = pose_landmarks.landmark[0]
                    mouth_x = (pose_landmarks.landmark[9].x + pose_landmarks.landmark[10].x) / 2.0 if len(pose_landmarks.landmark) > 10 else nose.x
                    mouth_y = (pose_landmarks.landmark[9].y + pose_landmarks.landmark[10].y) / 2.0 if len(pose_landmarks.landmark) > 10 else nose.y + 0.08
                    chin_y = mouth_y + 0.035
                    d_chin = float(min(np.hypot(tip.x - mouth_x, tip.y - chin_y), np.hypot(tip.x - mouth_x, tip.y - mouth_y)))
                    if d_chin < 0.085 and abs(tip.x - mouth_x) < 0.085:
                        self.last_chin_touch_time = now
                        self.chin_touch_pos = tip_pos
                        self.thank_you_forward_detected = False
                else:
                    if 0.30 < tip.y < 0.40 and 0.44 < tip.x < 0.56:
                        self.last_chin_touch_time = now
                        self.chin_touch_pos = tip_pos

            # Phase 2: Detect forward movement away from the recorded chin position
            if chin_touch_active and self.chin_touch_pos:
                dz_forward = self.chin_touch_pos[2] - tip_pos[2]
                d_moved = float(np.hypot(tip_pos[0] - self.chin_touch_pos[0], tip_pos[1] - self.chin_touch_pos[1]))
                dy_down = tip_pos[1] - self.chin_touch_pos[1]

                if dz_forward > 0.015 or (d_moved > 0.035 and dy_down > 0.01):
                    self.thank_you_forward_detected = True

        self.history.append(instant["gesture"] if instant else None)
        self.instant_history.append(instant)
        if instant:
            self.last_fingers = instant.get("fingers", self.last_fingers)

        valid = [g for g in self.history if g is not None]

        # Handle empty/hands-down state with hysteresis
        if not valid:
            self.consecutive_empty += 1
            if self.consecutive_empty >= 4:
                self.candidate_gesture = None
                self.candidate_start_time = 0.0
                self.current_hold_elapsed = 0.0
                self.candidate_committed = False
                self.current_stable = None
                self.last_committed = None
            return (self.current_stable if self.candidate_committed and self.consecutive_empty < 3 else None), None

        self.consecutive_empty = 0

        counts: Dict[str, int] = {}
        for g in valid:
            counts[g] = counts.get(g, 0) + 1
        majority, votes = max(counts.items(), key=lambda x: x[1])

        # Require minimum consistent votes in window
        if votes >= self.min_votes and majority in _PHRASES:
            if majority != self.candidate_gesture:
                # Gesture changed or newly detected: Start 2-second stability timer
                self.candidate_gesture = majority
                self.candidate_start_time = now
                self.current_hold_elapsed = 0.0
                self.candidate_committed = False
                self.current_stable = None
                return None, None
            else:
                # Continuing to hold the candidate gesture
                elapsed = now - self.candidate_start_time
                self.current_hold_elapsed = elapsed

                # STRICT RULE: Take the sign ONLY IF stable for at least 2.0 seconds
                if elapsed >= self.hold_duration_required:
                    for inst in reversed(self.instant_history):
                        if inst and inst.get("gesture") == majority:
                            self.current_stable = inst
                            break

                    stable_result = self.current_stable
                    event = None

                    # Emit single commit event once 2 seconds reached
                    if not self.candidate_committed:
                        self.candidate_committed = True
                        self.last_committed = majority
                        event = {
                            "event": "phrase_detected",
                            "phrase": majority,
                            "label": majority,
                            "confidence": 0.99,
                        }

                    return stable_result, event
                else:
                    # Still holding, under 2 seconds: DO NOT take yet
                    return None, None
        else:
            # Under min_votes: Hand is moving or unstable
            if self.candidate_gesture and counts.get(self.candidate_gesture, 0) < 2:
                # Candidate consistency was lost, reset 2-second timer
                self.candidate_gesture = None
                self.candidate_start_time = 0.0
                self.current_hold_elapsed = 0.0
                self.candidate_committed = False
                self.current_stable = None

            return (self.current_stable if self.candidate_committed else None), None

    def process_hand(self, landmarks, pose_landmarks=None):
        return self.process_hands(None, landmarks, pose_landmarks=pose_landmarks)

    def reset(self):
        self.last_committed = None
        self.current_stable = None
        self.consecutive_empty = 0
        self.candidate_gesture = None
        self.candidate_start_time = 0.0
        self.current_hold_elapsed = 0.0
        self.candidate_committed = False
        self.history.clear()
        self.instant_history.clear()
        self.last_chin_touch_time = 0.0
        self.chin_touch_pos = None
        self.thank_you_forward_detected = False

    clear_name = reset
