"""
YOLOv5 object detection — used to catch cheating aids (mobile phones,
books, extra people in frame) that face-landmark models don't see.

Loaded via the `ultralytics` package, which ships YOLOv5 weights and
downloads them automatically on first run (needs internet once).
"""
from modules import config

_model = None


def _get_model():
    global _model
    if _model is None:
        from ultralytics import YOLO
        # 'yolov5su' is the ultralytics-native, pip-installable YOLOv5 weight set
        _model = YOLO("yolov5su.pt")
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
        results = model.predict(
            frame_bgr, conf=config.YOLO_CONF_THRESHOLD, verbose=False
        )[0]

        persons = 0
        phone_detected = False
        book_detected = False
        prohibited_detected = False
        prohibited_items = []
        boxes = []

        names = results.names
        for box in results.boxes:
            cls_id = int(box.cls[0])
            label = str(names.get(cls_id, str(cls_id))).lower()
            conf = float(box.conf[0])
            xyxy = [float(v) for v in box.xyxy[0]]
            boxes.append({"label": label, "conf": round(conf, 2), "box": xyxy})

            # Person detection — use lower threshold for catching background people
            if label == config.PERSON_CLASS_NAME:
                if conf >= config.YOLO_PERSON_CONF_THRESHOLD:
                    persons += 1

            # Phone detection
            if label in config.PHONE_CLASS_NAMES or "phone" in label:
                phone_detected = True
                prohibited_detected = True
                if "Phone" not in prohibited_items:
                    prohibited_items.append("Phone")

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


