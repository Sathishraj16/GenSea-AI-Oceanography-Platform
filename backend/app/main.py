import json
import os
from typing import List

from fastapi import FastAPI, File, HTTPException, UploadFile, Depends, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd

from .config import DEFAULT_DATASET_PATH, MODELS_DIR, BASE_DIR
import os
from .schemas import (
    MapPoint,
    MetricsResponse,
    PredictRequest,
    PredictResponse,
    TrainResponse,
)
from .utils_agent import ai_recommendation
from .utils_data import (
    REQUIRED_COLUMNS,
    ensure_dataset_exists,
    parse_uploaded_file,
    read_dataset,
    validate_dataset_columns,
    filter_northern_indian_ocean,
)
from .utils_model import load_models, predict_rows, train_models
from starlette.staticfiles import StaticFiles

METRICS_PATH = os.path.join(MODELS_DIR, "metrics.json")

app = FastAPI(title="Ocean & Fisheries Insights API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve backend directory as static for assets like the background image
app.mount("/media", StaticFiles(directory=BASE_DIR), name="media")


@app.on_event("startup")
async def startup_event():
    ensure_dataset_exists()
    # If models are missing, train them
    reg, cls = load_models()
    if reg is None or cls is None:
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        metrics = train_models(df)
        _save_metrics(metrics)


def _save_metrics(metrics: dict):
    os.makedirs(MODELS_DIR, exist_ok=True)
    with open(METRICS_PATH, "w", encoding="utf-8") as f:
        json.dump(metrics, f)


def _load_metrics() -> MetricsResponse:
    if os.path.exists(METRICS_PATH):
        with open(METRICS_PATH, "r", encoding="utf-8") as f:
            m = json.load(f)
        return MetricsResponse(**m)
    return MetricsResponse()


@app.get("/data")
def get_data(limit: int = 1000):
    try:
        # Use synthetic data for main application (fishing zones, etc.)
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        if limit:
            df = df.head(limit)
        return JSONResponse(df.to_dict(orient="records"))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/map-data", response_model=List[MapPoint])
def get_map_data(limit: int = 1000):
    try:
        # Always use synthetic data for Fisherman's Compass to show proper fishing zones
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        if limit:
            df = df.head(limit)
        records = df.to_dict(orient="records")
        
        # Compute AI recommendation per row
        for r in records:
            r["ai_recommendation"] = ai_recommendation(r)
            # Coerce eDNA to list for response_model
            species = r.get("eDNA_detected_species", "")
            if isinstance(species, str):
                r["eDNA_detected_species"] = [s.strip() for s in species.split(",") if s.strip()]
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload", response_model=TrainResponse)
async def upload_data(file: UploadFile = File(...)):
    try:
        data = await file.read()
        df = parse_uploaded_file(data, file.filename)
        ok, missing = validate_dataset_columns(df)
        if not ok:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {missing}. Required: {REQUIRED_COLUMNS}",
            )
        # Persist uploaded dataset (replace default)
        df.to_csv(DEFAULT_DATASET_PATH, index=False)
        # Retrain models
        df_sub = filter_northern_indian_ocean(df)
        if df_sub.empty:
            raise HTTPException(status_code=400, detail="Uploaded dataset has no rows in the Northern Indian Ocean filter.")
        metrics = train_models(df_sub)
        _save_metrics(metrics)
        return TrainResponse(message="Upload successful and models retrained.", metrics=MetricsResponse(**metrics))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/train", response_model=TrainResponse)
async def train_endpoint():
    try:
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        if df.empty:
            raise HTTPException(status_code=400, detail="No data available in the Northern Indian Ocean filter to train.")
        metrics = train_models(df)
        _save_metrics(metrics)
        return TrainResponse(message="Training complete.", metrics=MetricsResponse(**metrics))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/metrics", response_model=MetricsResponse)
async def metrics_endpoint():
    return _load_metrics()


@app.post("/predict", response_model=PredictResponse)
async def predict_endpoint(req: PredictRequest):
    try:
        models = load_models()
        if models[0] is None or models[1] is None:
            raise HTTPException(status_code=400, detail="Models are not trained. Train models first.")
        # Build rows for prediction
        rows = []
        for r in req.rows:
            d = r.dict()
            # Convert list species to comma-separated string for model utils
            if isinstance(d.get("eDNA_detected_species"), list):
                d["eDNA_detected_species"] = ",".join(d["eDNA_detected_species"])
            # For prediction, fish_stock is unknown; keep biodiversity_index and invasive flag provided
            rows.append(d)
        fish_pred, risk_pred = predict_rows(models, rows)
        # Build recommendations using predictions
        recs = []
        for i, r in enumerate(req.rows):
            row_dict = r.dict()
            row_dict["fish_stock_prediction"] = fish_pred[i]
            recs.append(ai_recommendation(row_dict))
        return PredictResponse(
            fish_stock_predictions=[float(x) for x in fish_pred],
            biodiversity_risk_predictions=[str(x) for x in risk_pred],
            recommendations=recs,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    return {"message": "Ocean & Fisheries Insights API running"}


# ---------------- API v1 with simple API key auth ---------------- #
API_KEY = os.environ.get("GENSEA_API_KEY", "GENSEA-2024")


async def require_api_key(request: Request):
    key = request.headers.get("x-api-key") or request.query_params.get("api_key")
    if key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid or missing API key")


@app.get("/api/v1/data/raw", dependencies=[Depends(require_api_key)])
async def api_raw_data(limit: int = 1000):
    try:
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        if limit:
            df = df.head(limit)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/data/summary", dependencies=[Depends(require_api_key)])
async def api_summary():
    try:
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        if df.empty:
            return {"count": 0}
        avg_stock = float(df["fish_stock_index"].astype(float).mean())
        avg_bio = float(df["biodiversity_index"].astype(float).mean())
        # Alerts
        invasive = (df["invasive_species_flag"].astype(str).str.lower() == "yes").sum()
        bans = (df["fish_stock_index"].astype(float) < 30).sum()
        conserve = (df["biodiversity_index"].astype(float) < 40).sum()
        total = int(len(df))
        return {
            "count": total,
            "avg_fisheries_sustainability_index": avg_stock,
            "avg_biodiversity_index": avg_bio,
            "restricted_zones": int(bans),
            "conservation_priority": int(conserve),
            "invasive_species_risk": int(invasive),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/ai/alerts", dependencies=[Depends(require_api_key)])
async def api_ai_alerts(limit: int = 1000):
    try:
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        if limit:
            df = df.head(limit)
        recs = []
        for _, r in df.iterrows():
            status_color = "Green"
            if str(r["invasive_species_flag"]).lower() == "yes":
                status_color = "Red"
            elif float(r["fish_stock_index"]) < 30 or float(r["biodiversity_index"]) < 40:
                status_color = "Yellow"
            recs.append(
                {
                    "region": r["region"],
                    "latitude": float(r["lat"]),
                    "longitude": float(r["lon"]),
                    "status_color": status_color,
                    "policy_recommendation": ai_recommendation(r.to_dict()),
                }
            )
        return recs
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/ml/predictions", dependencies=[Depends(require_api_key)])
async def api_ml_predictions(sample: int = 10):
    try:
        # Metrics
        metrics = _load_metrics().dict()
        # Sample predictions for upcoming dates (simulate by shifting date forward)
        reg, cls = load_models()
        if reg is None or cls is None:
            return {"metrics": metrics, "samples": []}
        df = read_dataset(DEFAULT_DATASET_PATH)
        df = filter_northern_indian_ocean(df)
        df = df.head(sample)
        if df.empty:
            return {"metrics": metrics, "samples": []}
        rows = []
        for _, r in df.iterrows():
            rows.append(
                {
                    "date": str(r["date"]),
                    "lat": float(r["lat"]),
                    "lon": float(r["lon"]),
                    "region": r["region"],
                    "sea_temperature": float(r["sea_temperature"]),
                    "salinity": float(r["salinity"]),
                    "biodiversity_index": float(r["biodiversity_index"]),
                    "eDNA_detected_species": [s.strip() for s in str(r["eDNA_detected_species"]).split(",") if s.strip()],
                    "invasive_species_flag": str(r["invasive_species_flag"]),
                }
            )
        fish_pred, risk_pred = predict_rows((reg, cls), rows)
        samples = []
        for i, r in enumerate(rows):
            samples.append(
                {
                    "region": r["region"],
                    "latitude": r["lat"],
                    "longitude": r["lon"],
                    "fish_stock_prediction": float(fish_pred[i]),
                    "biodiversity_risk_prediction": str(risk_pred[i]),
                }
            )
        return {"metrics": metrics, "samples": samples}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/ml/ocean-data")
async def get_ocean_data(limit: int = 10000):
    """Serve ocean data from ML_Modal directory for ML visualizations"""
    try:
        # Path to the ocean_data.csv in ML_Modal directory
        ocean_data_path = os.path.join(BASE_DIR, "..", "ML_Modal", "ocean_data.csv")
        
        if not os.path.exists(ocean_data_path):
            raise HTTPException(status_code=404, detail="Ocean data file not found")
        
        df = pd.read_csv(ocean_data_path)
        
        # Clean the data - remove rows with missing values in key columns
        key_columns = ['time', 'latitude', 'longitude', 'sithick', 'ist', 'sob', 'mlotst', 'siage', 'usi', 'vsi']
        df = df.dropna(subset=key_columns)
        
        if limit:
            df = df.head(limit)
        
        # Convert to the format expected by the frontend
        records = []
        for _, row in df.iterrows():
            records.append({
                "time": str(row["time"]),
                "latitude": float(row["latitude"]),
                "longitude": float(row["longitude"]),
                "sithick": float(row["sithick"]) if pd.notna(row["sithick"]) else 0,
                "ist": float(row["ist"]) if pd.notna(row["ist"]) else 0,
                "sob": float(row["sob"]) if pd.notna(row["sob"]) else 0,
                "mlotst": float(row["mlotst"]) if pd.notna(row["mlotst"]) else 0,
                "siage": float(row["siage"]) if pd.notna(row["siage"]) else 0,
                "usi": float(row["usi"]) if pd.notna(row["usi"]) else 0,
                "vsi": float(row["vsi"]) if pd.notna(row["vsi"]) else 0,
                "siconc": float(row["siconc"]) if pd.notna(row["siconc"]) else 0,
                "zos": float(row["zos"]) if pd.notna(row["zos"]) else 0,
                "tob": float(row["tob"]) if pd.notna(row["tob"]) else 0,
                "pbo": float(row["pbo"]) if pd.notna(row["pbo"]) else 0,
                "sialb": float(row["sialb"]) if pd.notna(row["sialb"]) else 0,
                "sivelo": float(row["sivelo"]) if pd.notna(row["sivelo"]) else 0,
                "sisnthick": float(row["sisnthick"]) if pd.notna(row["sisnthick"]) else 0,
            })
        
        return records
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
