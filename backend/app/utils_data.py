import os
import io
import random
from datetime import datetime, timedelta
from typing import List, Tuple

import numpy as np
import pandas as pd

from .config import DEFAULT_DATASET_PATH, DATA_DIR

REQUIRED_COLUMNS = [
    "date",
    "lat",
    "lon",
    "region",
    "sea_temperature",
    "salinity",
    "fish_stock_index",
    "biodiversity_index",
    "eDNA_detected_species",
    "invasive_species_flag",
]

REGIONS = [
    "Bay of Bengal",
    "Arabian Sea",
    "Laccadive Sea",
    "Indian Ocean",
    "Andaman Sea",
    "Persian Gulf",
    "South China Sea",
    "Gulf of Alaska",
    "North Atlantic",
    "South Atlantic",
    "Pacific Northwest",
]

SPECIES = [
    "Salmon",
    "Tuna",
    "Mackerel",
    "Anchovy",
    "Sardine",
    "Cod",
    "Snapper",
    "Grouper",
]


def _random_species(n: int) -> List[str]:
    return random.sample(SPECIES, k=n)


def generate_synthetic_dataset(n_rows: int = 1000, seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    start_date = datetime.utcnow() - timedelta(days=365)

    rows = []
    for i in range(n_rows):
        date = start_date + timedelta(days=int(rng.integers(0, 365)))
        region = random.choice(REGIONS)

        # Base lat/lon per region for realism
        region_centers = {
            "Bay of Bengal": (15.0, 87.0),
            "Arabian Sea": (18.0, 64.0),
            # Use a northern/central Indian Ocean centroid to produce more in-bounds points
            "Indian Ocean": (15.0, 80.0),
            "Laccadive Sea": (10.0, 72.0),
            "Andaman Sea": (12.0, 97.0),
            "Persian Gulf": (25.0, 54.0),
            "South China Sea": (12.0, 112.0),
            "Gulf of Alaska": (55.0, -148.0),
            "North Atlantic": (40.0, -30.0),
            "South Atlantic": (-30.0, -10.0),
            "Pacific Northwest": (45.0, -130.0),
        }
        lat0, lon0 = region_centers.get(region, (20.0, 80.0))
        lat = lat0 + rng.normal(0, 3)
        lon = lon0 + rng.normal(0, 3)

        sea_temperature = float(np.clip(rng.normal(20, 6), -2, 35))
        salinity = float(np.clip(rng.normal(34, 1.5), 30, 38))

        # Create more realistic fishing zone patterns
        # Generate zone types with specific characteristics
        zone_type = rng.choice(['safe', 'caution', 'restricted', 'invasive'], p=[0.4, 0.3, 0.2, 0.1])
        
        if zone_type == 'safe':
            # High fish stock, good biodiversity, no invasive species
            fish_stock_index = float(np.clip(rng.normal(75, 10), 50, 100))
            biodiversity_index = float(np.clip(rng.normal(70, 8), 50, 100))
            invasive_species_flag = "no"
        elif zone_type == 'caution':
            # Moderate fish stock, low biodiversity
            fish_stock_index = float(np.clip(rng.normal(45, 8), 30, 70))
            biodiversity_index = float(np.clip(rng.normal(35, 5), 20, 50))
            invasive_species_flag = "no"
        elif zone_type == 'restricted':
            # Low fish stock, very low biodiversity
            fish_stock_index = float(np.clip(rng.normal(25, 5), 10, 40))
            biodiversity_index = float(np.clip(rng.normal(30, 5), 15, 45))
            invasive_species_flag = "no"
        else:  # invasive
            # Variable fish stock but invasive species present
            fish_stock_index = float(np.clip(rng.normal(40, 15), 20, 80))
            biodiversity_index = float(np.clip(rng.normal(45, 10), 25, 70))
            invasive_species_flag = "yes"

        # Add some environmental correlation
        if sea_temperature > 25:  # Warmer waters
            fish_stock_index *= 0.9  # Slightly lower fish stock
            biodiversity_index *= 1.1  # Higher biodiversity in warm waters
        if salinity < 32:  # Lower salinity
            biodiversity_index *= 0.8  # Lower biodiversity in low salinity

        n_species = int(rng.integers(2, 5))
        eDNA_detected_species = ",".join(_random_species(n_species))

        rows.append(
            {
                "date": date.strftime("%Y-%m-%d"),
                "lat": round(float(lat), 4),
                "lon": round(float(lon), 4),
                "region": region,
                "sea_temperature": round(sea_temperature, 2),
                "salinity": round(salinity, 2),
                "fish_stock_index": round(fish_stock_index, 2),
                "biodiversity_index": round(biodiversity_index, 2),
                "eDNA_detected_species": eDNA_detected_species,
                "invasive_species_flag": invasive_species_flag,
            }
        )

    df = pd.DataFrame(rows)
    return df


# ----- Regional filtering: Northern Indian Ocean focus -----
INDIA_REGION_NAMES = {
    "Bay of Bengal",
    "Arabian Sea",
    "Laccadive Sea",
    "Indian Ocean",  # filtered further by bounding box
    "Andaman Sea",
    "Persian Gulf",  # optional context, included but also bbox-restricted
}

INDIA_BBOX = {
    "lat_min": 0.0,
    "lat_max": 30.0,
    "lon_min": 50.0,
    "lon_max": 100.0,
}


def filter_northern_indian_ocean(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Region name pre-filter
    df = df[df["region"].astype(str).isin(INDIA_REGION_NAMES)]
    # Bounding box filter
    df = df[(df["lat"].astype(float) >= INDIA_BBOX["lat_min"]) & (df["lat"].astype(float) <= INDIA_BBOX["lat_max"]) & (
        df["lon"].astype(float) >= INDIA_BBOX["lon_min"]) & (df["lon"].astype(float) <= INDIA_BBOX["lon_max"])]
    return df.reset_index(drop=True)


def ensure_dataset_exists() -> str:
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DEFAULT_DATASET_PATH):
        df = generate_synthetic_dataset()
        df.to_csv(DEFAULT_DATASET_PATH, index=False)
    return DEFAULT_DATASET_PATH


def validate_dataset_columns(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    return (len(missing) == 0, missing)


def read_dataset(path: str = DEFAULT_DATASET_PATH) -> pd.DataFrame:
    if path.lower().endswith(".csv"):
        df = pd.read_csv(path)
    elif path.lower().endswith(".xlsx") or path.lower().endswith(".xls"):
        df = pd.read_excel(path)
    else:
        raise ValueError("Unsupported file type. Use CSV or Excel.")
    return df


def parse_uploaded_file(file_bytes: bytes, filename: str) -> pd.DataFrame:
    if filename.lower().endswith(".csv"):
        df = pd.read_csv(io.BytesIO(file_bytes))
    elif filename.lower().endswith(".xlsx") or filename.lower().endswith(".xls"):
        df = pd.read_excel(io.BytesIO(file_bytes))
    else:
        raise ValueError("Unsupported file type. Please upload CSV or Excel.")
    return df
