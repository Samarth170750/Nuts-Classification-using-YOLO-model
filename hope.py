import torch
from yolov5 import train  # Make sure you're running this from inside the cloned yolov5 directory

if __name__ == "__main__":
    train.run(
        data='nuts.yaml',
        imgsz=640,
        batch=16,
        epochs=50,
        weights='yolov5s.pt',
        device='0',  # GPU
        name='nut_detector_yolov5s'
    )
