import cv2
import numpy as np

def extract_features(image_path):
    src = cv2.imread(image_path)
    gray = cv2.cvtColor(src, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY_INV)

    # Use CLOSE to thicken and bridge gaps (Don't use OPEN)
    kernel = np.ones((5,5), np.uint8)
    closed = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)

    # Crop the bottom 15% to erase the "2 Bedrooms" text and scale bar
    height, width = closed.shape
    closed[int(height*0.85):height, :] = 0

    # RETR_LIST gets all the internal rooms back
    contours, _ = cv2.findContours(closed, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
    
    rooms = []
    for cnt in contours:
        if cv2.contourArea(cnt) > 2000: # Lowered to catch smaller rooms
            epsilon = 0.02 * cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, epsilon, True)
            rooms.append(approx)

    return [], rooms # Passing room contours directly