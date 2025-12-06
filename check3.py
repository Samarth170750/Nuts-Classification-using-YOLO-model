import os

images_path = 'C:/Users/SAMARTH/Desktop/Night/dataset/Images/train/'
labels_path = 'C:/Users/SAMARTH/Desktop/Night/dataset/Labels/train/'

# Get file names without extensions and in lowercase, also strip extra spaces
image_files = set(os.path.splitext(f.strip().lower())[0] for f in os.listdir(images_path))
label_files = set(os.path.splitext(f.strip().lower())[0] for f in os.listdir(labels_path))

# Print out files that are missing labels or images
print(f"Images without labels: {image_files - label_files}")
print(f"Labels without images: {label_files - image_files}")
