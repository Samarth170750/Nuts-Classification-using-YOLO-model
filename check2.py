from torchvision.ops import nms
import torch

boxes = torch.tensor([[10, 10, 20, 20], [12, 12, 22, 22]], dtype=torch.float).cuda()
scores = torch.tensor([0.9, 0.8], dtype=torch.float).cuda()

print(nms(boxes, scores, 0.5))  # Should run without error
