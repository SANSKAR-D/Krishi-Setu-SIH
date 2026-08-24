import os
import json
import numpy as np
import tensorflow as tf
from tensorflow import keras

# Set up default paths relative to this file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'test_model.keras')
CLASS_NAMES_PATH = os.path.join(BASE_DIR, 'class_names.json')

class PlantDiseaseService:
    """
    A service class to process 3-5 plant images and return a combined prediction 
    based on the average confidence score.
    """
    def __init__(self, model_path=MODEL_PATH, class_names_path=CLASS_NAMES_PATH, img_size=(224, 224)):
        self.img_size = img_size
        
        # Load the Keras model
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model not found at {model_path}")
        self.model = keras.models.load_model(model_path)
        
        # Load class names mapping
        if not os.path.exists(class_names_path):
            raise FileNotFoundError(f"Class names file not found at {class_names_path}")
        with open(class_names_path, 'r') as f:
            self.class_names = json.load(f)

    def preprocess_image(self, image_path):
        """Loads and preprocesses a single image."""
        if not os.path.exists(image_path):
            raise FileNotFoundError(f"Image not found: {image_path}")
        
        image = tf.io.read_file(image_path)
        # Decode and resize
        image = tf.image.decode_image(image, channels=3, expand_animations=False)
        image = tf.image.resize(image, self.img_size)
        # Convert to float32 before model processing
        image = tf.cast(image, tf.float32)
        # Add batch dimension
        image = tf.expand_dims(image, 0)
        return image

    def predict(self, image_paths):
        """
        Takes 3-5 image paths, predicts the disease based on the average 
        confidence score, and returns the result in JSON format.
        """
        if not isinstance(image_paths, list):
            raise ValueError("image_paths must be a list of file paths")
        
        if not (3 <= len(image_paths) <= 5):
            raise ValueError(f"Expected 3 to 5 images, but got {len(image_paths)}. Please provide 3-5 image paths.")
        
        all_probs = []
        for path in image_paths:
            img = self.preprocess_image(path)
            
            # Predict
            probs = self.model.predict(img, verbose=0)[0]
            
            # Ensure float32 in case of mixed precision
            probs = np.array(probs, dtype=np.float32)
            all_probs.append(probs)
            
        # Stack probabilities and calculate the average (Soft Voting)
        all_probs_stacked = np.stack(all_probs)
        avg_probs = np.mean(all_probs_stacked, axis=0)
        
        # Get the final combined prediction
        final_idx = np.argmax(avg_probs)
        final_confidence = float(avg_probs[final_idx] * 100)
        
        # Get class name securely based on index
        if final_idx < len(self.class_names):
            final_class = self.class_names[final_idx]
        else:
            final_class = f"Unknown (ID: {final_idx})"
            
        # Prepare the output dictionary
        result = {
            "predicted_class": final_class,
            "average_confidence_percentage": round(final_confidence, 2),
            "images_processed": len(image_paths)
        }
        
        # Return as JSON string
        return json.dumps(result, indent=4)

# Helper function for teammate to easily import and use in the backend route
def process_plant_images(image_paths, model_path=MODEL_PATH, class_names_path=CLASS_NAMES_PATH):
    """
    Helper function to process images without manually initializing the class.
    Expected usage in backend:
    
    from services import process_plant_images
    json_result = process_plant_images(['img1.jpg', 'img2.jpg', 'img3.jpg'])
    """
    service = PlantDiseaseService(model_path=model_path, class_names_path=class_names_path)
    return service.predict(image_paths)

if __name__ == "__main__":
    print("PlantDiseaseService is ready.")
    print("Import `process_plant_images` or `PlantDiseaseService` in the backend to use.")
