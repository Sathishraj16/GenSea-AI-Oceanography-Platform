# AI-Driven Ocean & Fisheries Insights

Full-stack hackathon-ready web app providing oceanographic, fisheries, and eDNA insights with ML models, charts, and an interactive 2D Leaflet map.

## Features
- Synthetic dataset (~1000 rows) or upload CSV/Excel, auto-retrain ML models  
- ML models:  
  - Regression → predict `fish_stock_index`  
  - Classification → predict biodiversity risk (`low`/`medium`/`high`)  
  - Metrics: R², Accuracy, F1  
- Agentic AI recommendations  
- Interactive 2D map with markers & popups  
- Dashboard with charts & data explorer  

## Tech Stack
- **Frontend:** React + Vite + TailwindCSS + Recharts + React-Leaflet  
- **Backend:** FastAPI + scikit-learn (RandomForest)  
- **Data:** CSV/Excel (synthetic preloaded or uploaded)  

## Quick Setup

### Backend
```powershell
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r backend/requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
Frontend
cd frontend
npm install
npm run dev


API: http://localhost:8000
 | Frontend: http://localhost:5173

API Endpoints

GET / → Health check

GET /data?limit=1000 → Dataset

GET /map-data?limit=1000 → Map data + AI recommendations

GET /metrics → Model metrics

POST /train → Retrain models

POST /upload → Upload CSV/Excel

POST /predict → Predict on input rows

Required Columns

date, lat, lon, region, sea_temperature, salinity, fish_stock_index, biodiversity_index, eDNA_detected_species, invasive_species_flag

eDNA species: comma-separated; invasive flag: yes/no

Goal

Quickly analyze ocean and fisheries data with AI insights, interactive dashboards, and easy CSV integration.
