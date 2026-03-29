import cv2
from Feature_Extractor import extract_features
from Geometric_Resolver import GeometricResolver
from Material_Engine import MaterialEngine
from Narrator import Narrator
from Generator_3D import Generator3D # Import your new module

def run_pipeline(image_path):
    # Stage 01: Parsing
    raw_lines, contours = extract_features(image_path)
    
    # Stage 02: Geometry Reconstruction (Fixes the 0m span)
    resolver = GeometricResolver(grid_size=10)
    structured_elements = resolver.resolve_geometry(raw_lines, contours)
    
    # Stage 03: 3D Generation (NEW INTEGRATION)
    # This prepares the data for the browser-based render
    generator = Generator3D(floor_height=3.0)
    mesh_data = generator.generate_mesh_data(structured_elements)
    
    # Stage 04: Material Analysis
    engine = MaterialEngine()
    final_bill = engine.assign_materials(structured_elements)
    
    # Stage 05: Explainability
    narrator = Narrator()
    report = narrator.full_report(final_bill)
    
    # Return everything for the final demo
    return final_bill, report, mesh_data

if __name__ == "__main__":
    bill, report, mesh = run_pipeline('plan_b.png')
    # Print report for terminal check
    for item in report:
        print(f"Element ID {item['id']}: {item['explanation']}\n")
    
    # Optional: Print first mesh object to verify 3D extrusion
    print(f"Successfully generated {len(mesh)} 3D structural elements.")

    import json # Add this to your imports at the top

if __name__ == "__main__":
    bill, report, mesh = run_pipeline('plan_b.png')
    
    # 1. Print terminal report
    for item in report:
        print(f"Element ID {item['id']}: {item['explanation']}\n")
    
    # 2. Export 3D Data for Three.js
    with open('model_data.json', 'w') as f:
        json.dump(mesh, f)
        
    print(f"Successfully exported {len(mesh)} structural elements to model_data.json")