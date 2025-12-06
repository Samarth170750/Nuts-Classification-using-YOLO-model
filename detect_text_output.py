# nut_detector.py
import torch

# Load the model globally once
model = torch.hub.load('yolov5', 'custom', path='yolov5/runs/train/nut_detector_yolov5s15/weights/best.pt', source='local')

def detect_nut(image_path):
    """
    Detect nut types from a given image path.

    Args:
        image_path (str): Path to the input image.

    Returns:
        list: Detected class names (e.g., ['Castle Nut', 'Wing Nut'])
    """
    results = model(image_path)
    df = results.pandas().xyxy[0]

    # Return class names or empty list if nothing detected
    return df['name'].tolist() if not df.empty else []
