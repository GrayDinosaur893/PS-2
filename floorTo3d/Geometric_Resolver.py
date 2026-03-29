import numpy as np
from shapely.geometry import LineString

class GeometricResolver:
    def __init__(self, grid_size=15): # Increased grid size for better snapping
        self.grid_size = grid_size 

    def snap_to_grid(self, coord):
        return round(coord / self.grid_size) * self.grid_size

    def resolve_geometry(self, raw_lines, room_contours):
        scale_factor = 0.05 
        structured_walls = []
        
        for room in room_contours:
            points = [pt[0] for pt in room]
            if len(points) > 2:
                points.append(points[0]) # Close the loop
                
                for i in range(len(points) - 1):
                    x1, y1 = points[i]
                    x2, y2 = points[i+1]
                    
                    # FORCE 90 DEGREES: If it's mostly horizontal, make it perfectly horizontal
                    if abs(x1 - x2) > abs(y1 - y2):
                        y2 = y1 
                    else:
                        x2 = x1 
                    
                    # Snap to grid
                    sx1, sy1 = self.snap_to_grid(x1), self.snap_to_grid(y1)
                    sx2, sy2 = self.snap_to_grid(x2), self.snap_to_grid(y2)
                    
                    # Skip if it collapsed into a dot
                    if sx1 == sx2 and sy1 == sy2:
                        continue
                        
                    real_length = np.sqrt((sx2 - sx1)**2 + (sy2 - sy1)**2) * scale_factor
                    
                    # Ignore tiny door arcs
                    if real_length < 1.0: 
                        continue 
                        
                    wall_geom = LineString([(sx1, sy1), (sx2, sy2)])
                    
                    structured_walls.append({
                        "geometry": wall_geom,
                        "type": "load-bearing" if real_length > 3.0 else "partition",
                        "length": real_length
                    })
                    
        return structured_walls