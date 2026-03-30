#Narrator

# technical output from the MaterialEngine and turns it into human‑readable explanations.

class Narrator:
    def __init__(self):
        # Local knowledge base derived from the starter material database [cite: 40, 41]
        self.material_logic = {
            "AAC Blocks": "chosen for partition walls due to low cost and high durability for non-structural use[cite: 40].",
            "Red Brick": "selected for load-bearing walls because of its high strength-to-cost ratio[cite: 40].",
            "RCC": "mandated for slabs and columns to provide maximum structural integrity[cite: 41].",
            "Steel Frame": "required for this section as the unsupported span exceeds 5 meters.",
            "Fly Ash Brick": "recommended for general walling to balance cost and environmental high durability[cite: 41]."
        }

    def generate_explanation(self, element_data):
        """
        Generates evidence-backed justifications using geometric data[cite: 35, 60].
        """
        mat_name = element_data['best_option']['material']
        el_type = element_data.get('type', 'load-bearing')
        length = round(element_data.get('length', 0), 2)
        score = element_data['best_option']['score']

        # 1. Base justification from database [cite: 40]
        base_reason = self.material_logic.get(mat_name, "selected based on the optimal tradeoff score.")

        # 2. Add structural context [cite: 58]
        context = f"For this {el_type} element with a measured span of {length}m, "
        
        # 3. Add specific tradeoff evidence [cite: 35, 58]
        tradeoff = f"The decision achieved a tradeoff score of {score}, prioritizing strength for this specific span."

        # 4. Critical Warning for large spans 
        warning = ""
        if length > 5.0 and mat_name != "Steel Frame":
            warning = " WARNING: Large unsupported span detected. Consider upgrading to Steel Frame[cite: 58]."

        return f"{context}{base_reason} {tradeoff}{warning}"

    def full_report(self, processed_elements):
        """
        Aggregates explanations for the final system output.
        """
        report = []
        for el in processed_elements:
            explanation = self.generate_explanation(el)
            report.append({
                "id": id(el.get('geometry')),
                "explanation": explanation
            })
        return report