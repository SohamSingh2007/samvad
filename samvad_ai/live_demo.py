"""
Live Webcam ASL Recognition Demo
Runs real-time sign language recognition with subtitle overlay on your webcam.
Usage:
    python live_demo.py
Controls:
    Press 'q' to quit
    Press 'c' to clear current subtitles
"""

import time
import cv2
import numpy as np
import mediapipe as mp

from meeting_recognizer import MeetingSignRecognizer
from pipeline import HolisticFeatureExtractor


def draw_hud(frame, current_subtitle, committed_history, fps, pose_ok, left_ok, right_ok):
    h, w, _ = frame.shape

    # 1. Top status bar
    overlay = frame.copy()
    cv2.rectangle(overlay, (0, 0), (w, 50), (20, 20, 20), -1)

    # 2. Bottom subtitle banner
    banner_height = 90
    cv2.rectangle(overlay, (0, h - banner_height), (w, h), (15, 15, 15), -1)

    alpha = 0.75
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    # FPS counter
    cv2.putText(
        frame,
        f"ASL Meeting CSLR | FPS: {fps:.1f}",
        (15, 32),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.7,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    # Status indicators for Pose, Left Hand, Right Hand
    def get_color(ok):
        return (50, 205, 50) if ok else (80, 80, 80)

    cv2.circle(frame, (w - 180, 25), 8, get_color(pose_ok), -1)
    cv2.putText(frame, "Pose", (w - 165, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

    cv2.circle(frame, (w - 120, 25), 8, get_color(left_ok), -1)
    cv2.putText(frame, "L Hand", (w - 105, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

    cv2.circle(frame, (w - 50, 25), 8, get_color(right_ok), -1)
    cv2.putText(frame, "R Hand", (w - 35, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (220, 220, 220), 1)

    # Subtitle Display
    sub_title_text = current_subtitle if current_subtitle else "..."
    cv2.putText(
        frame,
        "LIVE CAPTION:",
        (20, h - banner_height + 25),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.5,
        (0, 200, 255),
        1,
        cv2.LINE_AA,
    )
    cv2.putText(
        frame,
        sub_title_text,
        (20, h - banner_height + 65),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.85,
        (255, 255, 255),
        2,
        cv2.LINE_AA,
    )

    # Previous committed sentence (if any)
    if committed_history:
        prev_text = f"Prev: {committed_history[-1]}"
        cv2.putText(
            frame,
            prev_text,
            (20, h - banner_height - 10),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            (180, 180, 180),
            1,
            cv2.LINE_AA,
        )


def main():
    print("Starting ASL Meeting Recognition Webcam Stream...")
    print("Press 'q' to quit, 'c' to clear subtitles.")

    committed_sentences = []

    def on_sentence_commit(sentence):
        print(f"\n[COMMITTED]: {sentence}")
        committed_sentences.append(sentence)

    recognizer = MeetingSignRecognizer(
        window_size=32,
        hop_size=6,
        silence_timeout_sec=1.5,
        on_sentence_commit=on_sentence_commit,
    )
    extractor = HolisticFeatureExtractor()

    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open webcam.")
        return

    # Target effective FPS ~8.0
    frame_interval = 1.0 / 8.0
    last_frame_time = time.time()
    fps_history = []

    mp_drawing = mp.solutions.drawing_utils
    mp_holistic = mp.solutions.holistic

    try:
        while True:
            start_t = time.time()
            ret, frame = cap.read()
            if not ret:
                break

            # Mirror for natural webcam viewing
            frame = cv2.flip(frame, 1)

            # Throttle to ~8 FPS for the transformer model
            now = time.time()
            feat, mask, results = extractor.process_frame(frame)

            if (now - last_frame_time) >= frame_interval:
                recognizer.push_frame_features(feat, mask)
                last_frame_time = now

            # Draw landmarks lightly
            if results.pose_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    results.pose_landmarks,
                    mp_holistic.POSE_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(80, 210, 120), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(80, 250, 240), thickness=2, circle_radius=2),
                )
            if results.left_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    results.left_hand_landmarks,
                    mp_holistic.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(121, 22, 76), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(121, 44, 250), thickness=2, circle_radius=1),
                )
            if results.right_hand_landmarks:
                mp_drawing.draw_landmarks(
                    frame,
                    results.right_hand_landmarks,
                    mp_holistic.HAND_CONNECTIONS,
                    mp_drawing.DrawingSpec(color=(245, 117, 66), thickness=2, circle_radius=2),
                    mp_drawing.DrawingSpec(color=(245, 66, 230), thickness=2, circle_radius=1),
                )

            # Calculate FPS
            dt = time.time() - start_t
            if dt > 0:
                fps_history.append(1.0 / dt)
            if len(fps_history) > 20:
                fps_history.pop(0)
            avg_fps = sum(fps_history) / max(1, len(fps_history))

            # Draw HUD
            draw_hud(
                frame,
                recognizer.get_live_subtitle(),
                committed_sentences,
                avg_fps,
                pose_ok=bool(mask[0]),
                left_ok=bool(mask[1]),
                right_ok=bool(mask[2]),
            )

            cv2.imshow("ASL Meeting Captioning", frame)

            key = cv2.waitKey(1) & 0xFF
            if key == ord("q"):
                break
            elif key == ord("c"):
                recognizer.reset()
                committed_sentences.clear()

    finally:
        cap.release()
        cv2.destroyAllWindows()
        extractor.close()


if __name__ == "__main__":
    main()
