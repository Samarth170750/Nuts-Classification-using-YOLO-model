# main.py
from detect_text_output import detect_nut

# Input image path
image_path = 'dataset/Images/test/Flange_Nut_Test(7).jpg'

# Run detection
predictions = detect_nut(image_path)

# Print the output list
print(predictions[0])
