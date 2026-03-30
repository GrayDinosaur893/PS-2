#Collaborator for pipelines

import cv2
import json
from Feature_Extractor import extract_features
from Geometric_Resolver import GeometricResolver
from Material_Engine import MaterialEngine
from Narrator import Narrator
from Generator_3D import Generator3D

def run_pipeline(image_path):
    # Stage 01: Parsing (walls, rooms, openings)
    features = extract_features(image_path)
    walls = features["walls"]
    rooms = features["rooms"]
    openings = features["openings"]

    # Stage 02: Geometry Reconstruction
    resolver = GeometricResolver(grid_size=10)
    structured_elements = resolver.resolve_geometry([], walls)

    # Stage 03: 3D Generation
    generator = Generator3D(floor_height=3.0)
    mesh_data = generator.generate_mesh_data(structured_elements)

    # Stage 04: Material Analysis
    engine = MaterialEngine()
    final_bill = engine.assign_materials(structured_elements)

    # Stage 05: Explainability
    narrator = Narrator()
    report = narrator.full_report(final_bill)

    # Return everything for the final demo
    return final_bill, report, mesh_data, rooms, openings


if __name__ == "__main__":
    bill, report, mesh, rooms, openings = run_pipeline('plan_b.png')

    # 1. Print explanations
    for item in report:
        print(f"Element ID {item['id']}: {item['explanation']}\n")

    # 2. Export everything into a single JSON file
    with open('model_data.json', 'w') as f:
        json.dump({
            "walls": mesh,
            "rooms": [room for room in rooms],  # already lists from extractor
            "openings": [list(opening) for opening in openings]
        }, f)

    print(f"Exported {len(mesh)} walls, {len(rooms)} rooms, {len(openings)} openings into model_data.json")
