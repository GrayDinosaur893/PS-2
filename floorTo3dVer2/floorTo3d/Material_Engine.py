#Material engine
#Calculates cost-durability scores and assigns materials from the JSON database using optimization k = durability/cost.
import math

class MaterialEngine:
    def __init__(self):
        # Master Database
        self.db = {
            "AAC Blocks": {"cost": 130, "durability": 130, "use": ["partition"]},
            "Red Brick": {"cost": 120, "durability": 120, "use": ["load-bearing", "structural"]},
            "RCC": {"cost": 400, "durability": 450, "use": ["structural"]},
            "Steel Frame": {"cost": 600, "durability": 650, "use": ["long-span"]},
            "Hollow Concrete Blocks": {"cost": 80, "durability": 75, "use": ["partition"]},
            "Fly Ash Bricks": {"cost": 110, "durability": 115, "use": ["load-bearing", "structural"]},
            "Precast Concrete Panels": {"cost": 450, "durability": 480, "use": ["load-bearing", "structural", "long-span"]},
            "Timber Frame": {"cost": 250, "durability": 200, "use": ["partition"]},

            # Doors
            "Wooden Door": {"cost": 150, "durability": 145, "use": ["door-inner"]},
            "Steel Door": {"cost": 400, "durability": 420, "use": ["door-outer"]},
            "Glass Door": {"cost": 300, "durability": 290, "use": ["door-inner", "door-outer"]},
            "Fiberglass Door": {"cost": 220, "durability": 250, "use": ["door-outer"]},
            "HDF Flush Door": {"cost": 90, "durability": 80, "use": ["door-inner"]},
            "UPVC Door": {"cost": 170, "durability": 160, "use": ["door-inner", "door-outer"]},

            # Windows
            "Glass Panel": {"cost": 100, "durability": 95, "use": ["window-inner", "window-outer"]},
            "Reinforced Glass": {"cost": 250, "durability": 240, "use": ["window-outer"]},
            "Aluminum Frame": {"cost": 180, "durability": 190, "use": ["window-span"]},
            "UPVC Window Frame": {"cost": 120, "durability": 125, "use": ["window-outer", "window-inner"]},
            "Wood Framed Window": {"cost": 280, "durability": 260, "use": ["window-inner"]},
            "Double Glazed Panel": {"cost": 350, "durability": 360, "use": ["window-outer", "window-span"]}
        }

    def evaluate_material(self, mat_specs):
        """Calculates material score based strictly on k = durability / cost"""
        k = mat_specs["durability"] / float(mat_specs["cost"])
        # Asymmetric Penalty Math:
        penalty = (1.0 - k) if k < 1 else (k - 1) * 0.5
        score = max(0, 100 - (penalty * 100))

        if 0.95 <= k <= 1.05:
            rating = "Optimal"
        elif (0.8 <= k < 0.95) or (1.05 < k <= 1.2):
            rating = "Good"
        else:
            rating = "Poor"

        return k, round(score, 1), rating

    def calculate_tradeoff(self, category_flag, span_length, context=""):
        """Filters materials and generates structural explanation."""
        recommendations = []
        
        # Override long span classification for basic walls
        if "bearing" in category_flag or "partition" in category_flag or "structural" in category_flag:
            target_use = "long-span" if span_length > 5.0 else category_flag
        else:
            # Handle doors / windows
            target_use = category_flag

        for mat, specs in self.db.items():
            if target_use not in specs["use"]:
                # Look for fallback spanning materials if specific use isn't directly bound
                # Only check fallback for windows spans
                if target_use == "window-span" and "window-outer" in specs["use"]:
                     pass # allow fallback
                else:
                     continue

            k, score, rating = self.evaluate_material(specs)
            
            reason = f"Based on structural context ({context}), {mat} natively hits an efficiency constant k={k:.2f}."
            
            if rating == "Optimal":
                reason += " This perfectly satisfies load optimizations without excessive budget bloat."
            elif k < 1:
                reason += " This performs slightly under engineering baselines."
            elif k > 1:
                reason += " This results in moderate over-engineering costs, offering superior durability."

            recommendations.append({
                "name": mat, 
                "cost": specs["cost"],
                "durability": specs["durability"],
                "score": score, 
                "k": round(k, 3), 
                "rating": rating,
                "reason": reason
            })

        return sorted(recommendations, key=lambda x: x["score"], reverse=True)

    def assign_materials(self, structured_elements):
        """Processes walls and openings outputs to assign best materials."""
        final_bill = []
        for el in structured_elements:
            geom_type = el.get("type", "partition")
            length = el.get("length", 1.0)
            loc = el.get("location", "Inner") # for doors/windows
            
            if "Door" in geom_type:
                target = "door-outer" if loc == "Outer" else "door-inner"
                context = "Outer building threshold" if loc == "Outer" else "Internal spatial division"
                options = self.calculate_tradeoff(target, length, context=context)
            elif "Window" in geom_type:
                target = "window-span" if length > 2.0 else ("window-outer" if loc == "Outer" else "window-inner")
                context = "Exterior shell opening" if loc == "Outer" else "Internal window division"
                options = self.calculate_tradeoff(target, length, context=context)
            else:
                # Standard wall
                context = f"Spanning {length:.1f} abstract units"
                options = self.calculate_tradeoff(geom_type, length, context=context)
            
            final_bill.append({
                "type": geom_type,
                "length": length,
                "best_option": options[0] if options else None,
                "alternatives": options[1:3]
            })
            
        return final_bill