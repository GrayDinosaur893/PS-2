import cv2
import numpy as np
import shutil
import sys
import os
import time
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

# Bypass blocking cv2.waitKey(0) in modules to prevent infinite hangs
cv2.imshow = lambda *args, **kwargs: None
cv2.waitKey = lambda *args, **kwargs: None
cv2.destroyAllWindows = lambda *args, **kwargs: None

sys.path.append(os.path.join(os.path.dirname(__file__), 'floorTo3dVer2', 'floorTo3d'))

from Feature_Extractor import extract_features
from Geometric_Resolver import GeometricResolver
from Generator_3D import Generator3D
from Material_Engine import MaterialEngine

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/test")
async def test_endpoint():
    """Temporary test endpoint to confirm React rendering handles API signatures properly."""
    return {
        "walls": [
            {"id": "w_test1", "start": [-5, -5], "end": [-5, 5], "type": "load-bearing", "height": 3, "best_option": {"material": "Test Brick", "score": 90}}
        ],
        "rooms": [],
        "dimensions": {"width": 512, "height": 512},
        "materials": []
    }

@app.post("/process")
async def process_floor_plan(file: UploadFile = File(...)):
    start_time = time.time()
    print("====================================")
    print("Step 1: File received")
    temp_file = f"temp_{file.filename}"
    
    with open(temp_file, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # STEP 4: PERFORMANCE FIX - Resize image to 512x512
        print("-> Resizing image for performance optimization...")
        img = cv2.imread(temp_file)
        if img is None:
            raise Exception("Invalid image format.")
        
        # Capture raw dimensions before resize
        raw_h, raw_w = img.shape[:2]
        
        # Optimize performance heavily
        img = cv2.resize(img, (512, 512))
        cv2.imwrite(temp_file, img)
        
        dimensions = {"width": 512, "height": 512, "raw_width": raw_w, "raw_height": raw_h}

        # Step 2: Feature Extraction
        print(f"Step 2: Feature extraction start [{time.time() - start_time:.2f}s]")
        try:
            features = extract_features(temp_file)
        except Exception as e:
            raise RuntimeError(f"Feature_Extractor_failed: {str(e)}")
            
        # Step 3: Geometry Resolver
        print(f"Step 3: Geometry resolving start [{time.time() - start_time:.2f}s]")
        try:
            resolver = GeometricResolver()
            geometry = resolver.resolve_geometry(None, features["walls"])
        except Exception as e:
            raise RuntimeError(f"Geometry_Resolver_failed: {str(e)}")

        # Step 4: 3D Generation
        print(f"Step 4: 3D generation start [{time.time() - start_time:.2f}s]")
        try:
            gen3d = Generator3D()
            model3D = gen3d.generate_mesh_data(geometry)
        except Exception as e:
            raise RuntimeError(f"Generator_3D_failed: {str(e)}")

        # Step 4.5: Openings Architecture Classification
        print(f"Step 4.5: Classifying Openings (Doors/Windows) [{time.time() - start_time:.2f}s]")
        raw_openings = features.get("openings", [])
        structured_openings = []
        
        # Discover architectural bounds
        all_x, all_y = [], []
        for box in features.get("walls", []):
            for p in box:
                all_x.append(p[0])
                all_y.append(p[1])
                
        minX = min(all_x) if all_x else 0
        maxX = max(all_x) if all_x else 512
        minY = min(all_y) if all_y else 0
        maxY = max(all_y) if all_y else 512
        
        BORDER_TOLERANCE = 25 # ~1m physical clearance

        for op in raw_openings:
            p1, p2 = op[0], op[1]
            bx = (p1[0] + p2[0]) / 2.0
            by = (p1[1] + p2[1]) / 2.0
            
            is_outer = (abs(bx - minX) < BORDER_TOLERANCE or abs(bx - maxX) < BORDER_TOLERANCE or 
                        abs(by - minY) < BORDER_TOLERANCE or abs(by - maxY) < BORDER_TOLERANCE)
                        
            loc = "Outer" if is_outer else "Inner"
            geom_type = "Window" if is_outer else "Door"
            
            import math
            length = math.hypot(p2[0] - p1[0], p2[1] - p1[1]) * 0.05
            
            structured_openings.append({
                "start": p1,
                "end": p2,
                "type": geom_type,
                "length": length,
                "location": loc
            })

        # Step 5: Material Engine
        print(f"Step 5: Material engine start [{time.time() - start_time:.2f}s]")
        try:
            mat_engine = MaterialEngine()
            materials_output = mat_engine.assign_materials(geometry)
            openings_materials = mat_engine.assign_materials(structured_openings)
        except Exception as e:
            raise RuntimeError(f"Material_Engine_failed: {str(e)}")

        print(f"-> Processing Complete! Packaging Payload... [{time.time() - start_time:.2f}s]")
        
        # Clean the output (removing Shapely LineString un-serializable objects)
        clean_walls = []
        clean_materials = []
        for i in range(len(model3D)):
            wall3d = model3D[i]
            mat_info = materials_output[i]
            
            clean_walls.append({
                "id": f"wall_{i}",
                "start": wall3d["start"],
                "end": wall3d["end"],
                "height": wall3d["height"],
                "type": wall3d["type"],
                "length": mat_info["length"],
                "best_option": mat_info["best_option"],
                "alternatives": mat_info["alternatives"]
            })
            
            clean_materials.append({
                "type": mat_info["type"],
                "length": mat_info["length"],
                "best_option": mat_info["best_option"],
                "alternatives": mat_info["alternatives"]
            })
            
        # Clean openings output securely linking with their physics profiles
        final_openings = []
        for i in range(len(structured_openings)):
            op = structured_openings[i]
            mat_info = openings_materials[i]
            
            final_openings.append({
                "id": f"opening_{i}",
                "start": op["start"],
                "end": op["end"],
                "type": op["type"],
                "location": op["location"],
                "length": op["length"],
                "best_option": mat_info["best_option"],
                "alternatives": mat_info["alternatives"]
            })

        print(f"Execution Terminated Successfully. Total time: {time.time() - start_time:.2f}s")

        return {
            "walls": clean_walls,
            "rooms": features.get("rooms", []),
            "openings": final_openings,
            "materials": clean_materials,
            "dimensions": dimensions
        }

    except Exception as e:
        error_msg = str(e)
        print(f"❌ PIPELINE ERROR: {error_msg}")
        # Fail Safe Response ensuring React never crashes
        return {
            "walls": [],
            "rooms": [],
            "dimensions": {},
            "materials": [],
            "error": error_msg
        }
    finally:
        if os.path.exists(temp_file):
            os.remove(temp_file)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
