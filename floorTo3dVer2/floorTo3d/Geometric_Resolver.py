#Converts data from Feature_Extractor to graph structures for 3D generation.


import numpy as np
from shapely.geometry import LineString

class GeometricResolver:
    def __init__(self, grid_size=5):  # finer grid snapping (was 20)
        self.grid_size = grid_size

    def snap_to_grid(self, coord):
        """Forces points to a grid to 'weld' wall corners together."""
        return round(coord / self.grid_size) * self.grid_size

    def resolve_geometry(self, raw_lines, wall_data):
        """
        Converts raw detections into a clean structural graph.
        """
        scale_factor = 0.05  # adjust if needed to match your plan scale
        structured_walls = []

        if isinstance(wall_data, list) and len(wall_data) > 0:
            for box in wall_data:
                # Compute bounding box dimensions
                xs = [p[0] for p in box]
                ys = [p[1] for p in box]
                bbox_width = max(xs) - min(xs)
                bbox_height = max(ys) - min(ys)
                mid_x = (max(xs) + min(xs)) / 2
                mid_y = (max(ys) + min(ys)) / 2

                if bbox_width > bbox_height:  # Horizontal Wall
                    length = bbox_width
                    start, end = (mid_x - length/2, mid_y), (mid_x + length/2, mid_y)
                else:  # Vertical Wall
                    length = bbox_height
                    start, end = (mid_x, mid_y - length/2), (mid_x, mid_y + length/2)

                # Snap to grid
                sx1, sy1 = self.snap_to_grid(start[0]), self.snap_to_grid(start[1])
                sx2, sy2 = self.snap_to_grid(end[0]), self.snap_to_grid(end[1])
                dist = np.sqrt((sx2 - sx1)**2 + (sy2 - sy1)**2)

                # Lower threshold to keep short walls
                if dist < 5:
                    continue

                wall_geom = LineString([(sx1, sy1), (sx2, sy2)])
                structured_walls.append({
                    "geometry": wall_geom,
                    "type": "load-bearing" if dist * scale_factor > 2.0 else "partition",
                    "length": dist * scale_factor
                })

        return structured_walls
