from typing import Dict


def ai_recommendation(row: Dict) -> str:
    fish_stock = float(row.get("fish_stock_index", row.get("fish_stock_prediction", 0)))
    biodiversity = float(row.get("biodiversity_index", 0))
    invasive_flag = str(row.get("invasive_species_flag", "no")).lower()

    if invasive_flag == "yes":
        return "🚨 Invasive species risk"
    if fish_stock < 30:
        return "⚠️ Fishing ban alert"
    if biodiversity < 40:
        return "⚠️ Recommend conservation zone"
    return "✅ Sustainable fishing possible"
