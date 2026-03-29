import cv2
import numpy as np
import math
import shutil
import os
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/process")
async def process_floor_plan(file: UploadFile = File(...)):
    temp_file = f"temp_{file.filename}"
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # 1. Read image with OpenCV
        image = cv2.imread(temp_file)
        if image is None:
            return {"error": "Could not read image"}
            
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        
        # Edge detection using Canny
        edges = cv2.Canny(blurred, 50, 150, apertureSize=3)
        
        # Detect lines using Hough Transform
        lines = cv2.HoughLinesP(edges, 1, np.pi/180, threshold=100, minLineLength=30, maxLineGap=10)
        
        walls = []
        if lines is not None:
            height, width = image.shape[:2]
            
            # 3. Normalize coordinates (scale down to a sensible unit for 3D UI, e.g., 20x20 area max)
            scale = max(width, height) / 20.0
            
            for index, line in enumerate(lines):
                x1, y1, x2, y2 = line[0]
                
                # Normalize and center coordinates
                nx1 = (x1 - width/2) / scale
                ny1 = (y1 - height/2) / scale
                nx2 = (x2 - width/2) / scale
                ny2 = (y2 - height/2) / scale
                
                # 4. Calculate dimensions
                dx = nx2 - nx1
                dy = ny2 - ny1
                length = math.sqrt(dx**2 + dy**2)
                angle = math.atan2(dy, dx)
                
                walls.append({
                    "id": f"wall_{index}",
                    "start": [nx1, ny1],
                    "end": [nx2, ny2],
                    "length": length,
                    "angle": angle,
                    "type": "Detected Wall",
                    "material": "Unknown",
                    "explanation": f"OpenCV detected line segment. Length: {length:.2f} units."
                })
        
        return {
            "walls": walls,
            "materials": [{"name": "Standard Drywall", "type": "Interior", "rating": "N/A", "price": "N/A"}],
            "explanations": ["Successfully extracted lines from the floor plan using OpenCV."]
        }
    except Exception as e:
        return {"error": str(e)}
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
