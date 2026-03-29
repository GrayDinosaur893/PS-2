#Calculates cost-strength scores and assigns materials from the JSON database.

class MaterialEngine:
    def __init__(self):
        # Database from official starter material JSON 
        self.db = {
            "AAC Blocks": {"cost": 1, "strength": 2, "durability": 3, "use": "partition"},
            "Red Brick": {"cost": 2, "strength": 3, "durability": 2, "use": "load-bearing"},
            "RCC": {"cost": 3, "strength": 5, "durability": 5, "use": "structural"},
            "Steel Frame": {"cost": 3, "strength": 5, "durability": 5, "use": "long-span"}
        }

    def calculate_tradeoff(self, element_type, span_length, weights=(0.4, 0.6)):
        """Calculates material score based on cost vs strength."""
        recommendations = []
        w_cost, w_strength = weights

        for mat, specs in self.db.items():
            # Mandatory Structural Rule: Long spans (>5m) need Steel 
            if span_length > 5.0 and mat != "Steel Frame" and element_type == "load-bearing":
                continue
                
            # Filter by best use case 
            if element_type == "partition" and specs["use"] != "partition":
                continue

            # Core Tradeoff Logic: Higher score = better recommendation 
            score = (specs["strength"] * w_strength) - (specs["cost"] * w_cost)
            recommendations.append({"material": mat, "score": round(score, 2)})

        # Sort by score descending [cite: 35]
        return sorted(recommendations, key=lambda x: x["score"], reverse=True)

    def assign_materials(self, structured_elements):
        """Processes the geometric resolver output to assign materials."""
        final_bill = []
        for el in structured_elements:
            options = self.calculate_tradeoff(el["type"], el["length"])
            
            final_bill.append({
                "geometry": el["geometry"],
                "type": el["type"],        # <-- CRITICAL FIX: Pass type to Narrator
                "length": el["length"],    # <-- CRITICAL FIX: Pass length to Narrator
                "best_option": options[0] if options else "Unknown",
                "alternatives": options[1:3]
            })
            
        return final_bill