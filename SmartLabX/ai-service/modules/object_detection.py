"""
YOLOv5 object detection — used to catch cheating aids (mobile phones,
books, extra people in frame) that face-landmark models don't see.

Loaded via the `ultralytics` package and the model weights bundled with
the AI service.
"""
import os
import threading

from modules import config

_model = None
_model_lock = threading.Lock()
_infer_lock = threading.Lock()


def _get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:
                from ultralytics import YOLO
                weights_path = os.path.join(config.BASE_DIR, "yolov5su.pt")
                if not os.path.isfile(weights_path):
                    raise FileNotFoundError(f"YOLO weights not found: {weights_path}")
                _model = YOLO(weights_path)
    return _model


def detect_objects(frame_bgr):
    """
    Runs YOLOv5/YOLOv8 on a frame.
    Returns {
        "persons": int,
        "phone_detected": bool,
        "book_detected": bool,
        "prohibited_detected": bool,
        "prohibited_items": list,
        "boxes": [...],
        "error": str|None
    }
    """
    try:
        model = _get_model()
        with _infer_lock:
            results = model.predict(
                frame_bgr,
                conf=min(config.YOLO_CONF_THRESHOLD, config.YOLO_PERSON_CONF_THRESHOLD,
                         config.YOLO_PHONE_CONF_THRESHOLD),
                verbose=False,
                imgsz=getattr(config, "YOLO_IMGSZ", 640),
            )[0]

        persons = 0
        phone_detected = False
        book_detected = False
        prohibited_detected = False
        prohibited_items = []
        boxes = []
        person_boxes = []

        names = results.names
        for box in sorted(results.boxes, key=lambda item: float(item.conf[0]), reverse=True):
            cls_id = int(box.cls[0])
            label = str(names.get(cls_id, str(cls_id))).lower()
            conf = float(box.conf[0])
            xyxy = [float(v) for v in box.xyxy[0]]

            if label == config.PERSON_CLASS_NAME and conf >= config.YOLO_PERSON_CONF_THRESHOLD:
                x1, y1, x2, y2 = xyxy
                area = max(0.0, x2 - x1) * max(0.0, y2 - y1)
                duplicate = False
                for px1, py1, px2, py2 in person_boxes:
                    intersection = max(0.0, min(x2, px2) - max(x1, px1)) * \
                        max(0.0, min(y2, py2) - max(y1, py1))
                    other_area = max(0.0, px2 - px1) * max(0.0, py2 - py1)
                    union = area + other_area - intersection
                    if union > 0 and intersection / union >= 0.5:
                        duplicate = True
                        break
                if duplicate:
                    continue
                person_boxes.append(xyxy)

            boxes.append({"label": label, "conf": round(conf, 2), "box": xyxy})

            # Person detection — use lower threshold for catching background people
            if label == config.PERSON_CLASS_NAME:
                if conf >= config.YOLO_PERSON_CONF_THRESHOLD:
                    persons += 1

            # Phone detection
            if label in config.PHONE_CLASS_NAMES or "phone" in label:
                if conf >= config.YOLO_PHONE_CONF_THRESHOLD:
                    phone_detected = True
                    prohibited_detected = True
                    if "Phone" not in prohibited_items:
                        prohibited_items.append("Phone")
                continue

            # Book / paper / cheat sheet detection
            elif label in config.BOOK_CLASS_NAMES or "book" in label or "notebook" in label:
                book_detected = True
                prohibited_detected = True
                item_name = label.capitalize()
                if item_name not in prohibited_items:
                    prohibited_items.append(item_name)

            # Other prohibited items
            elif label in config.PROHIBITED_CLASS_NAMES:
                prohibited_detected = True
                if label.capitalize() not in prohibited_items:
                    prohibited_items.append(label.capitalize())

        return {
            "persons": persons,
            "phone_detected": phone_detected,
            "book_detected": book_detected,
            "prohibited_detected": prohibited_detected,
            "prohibited_items": prohibited_items,
            "boxes": boxes,
            "error": None
        }
    except Exception as exc:
        return {
            "persons": 0,
            "phone_detected": False,
            "book_detected": False,
            "prohibited_detected": False,
            "prohibited_items": [],
            "boxes": [],
            "error": str(exc)
        }
