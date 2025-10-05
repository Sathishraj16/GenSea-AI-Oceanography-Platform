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


