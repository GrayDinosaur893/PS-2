class Generator3D:
    def __init__(self, floor_height=3.0):
        self.floor_height = floor_height # Mandatory standard height 

    def generate_mesh_data(self, structured_elements):
        """
        Converts 2D segments into 3D box coordinates for Three.js.
        """
        mesh_objects = []
        for el in structured_elements:
            coords = list(el['geometry'].coords)
            mesh_objects.append({
                "start": coords[0],
                "end": coords[1],
                "height": self.floor_height,
                "type": el['type']
            })
        return mesh_objects # This JSON is used by the frontend for rendering