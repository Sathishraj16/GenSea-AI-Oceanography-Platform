from typing import List, Optional
from pydantic import BaseModel


class MetricsResponse(BaseModel):
    regression_r2: Optional[float] = None
    classification_accuracy: Optional[float] = None
    classification_f1: Optional[float] = None


class TrainResponse(BaseModel):
    message: str
    metrics: MetricsResponse


class MapPoint(BaseModel):
    lat: float
    lon: float
    region: str
    sea_temperature: float
    salinity: float
    fish_stock_index: float
    biodiversity_index: float
    eDNA_detected_species: List[str]
    invasive_species_flag: str
    ai_recommendation: str


class PredictRow(BaseModel):
    date: str
    lat: float
    lon: float
    region: str
    sea_temperature: float
    salinity: float
    biodiversity_index: float
    eDNA_detected_species: List[str]
    invasive_species_flag: str


class PredictRequest(BaseModel):
    rows: List[PredictRow]


class PredictResponse(BaseModel):
    fish_stock_predictions: List[float]
    biodiversity_risk_predictions: List[str]
    recommendations: List[str]
