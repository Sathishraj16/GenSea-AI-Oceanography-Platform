# M_3.py
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import streamlit as st
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

# --------------------------
# 1. Load Data
# --------------------------
st.title("🌊 Ocean Data Anomaly Detector & Map")

# Load cleaned.csv
df = pd.read_csv("cleaned.csv")

# --------------------------
# 2. Select features for anomaly detection
# --------------------------
features = ['sob', 'ist', 'zos', 'siconc']  # salinity, temp, sea level, ice concentration

# Drop rows with missing values
df = df.dropna(subset=features)

# --------------------------
# 3. Standardize and Apply PCA
# --------------------------
scaler = StandardScaler()
X_scaled = scaler.fit_transform(df[features])

# Keep 2 PCA components (captures normal structure)
pca = PCA(n_components=2)
X_pca = pca.fit_transform(X_scaled)

# Reconstruct and compute reconstruction error
X_reconstructed = pca.inverse_transform(X_pca)
errors = np.mean((X_scaled - X_reconstructed)**2, axis=1)

# --------------------------
# 4. Mark anomalies
# --------------------------
df['anomaly_score'] = errors
threshold = np.percentile(errors, 95)  # top 5% considered anomalies
df['anomaly'] = df['anomaly_score'] > threshold

st.write(f"🔍 Anomaly threshold = {threshold:.4f}")
st.write(f"⚠️ Number of anomalies detected: {df['anomaly'].sum()} out of {len(df)} points")

# --------------------------
# 5. Plot Geographic Map
# --------------------------
subset = df[df['anomaly'] == True]

fig, ax = plt.subplots(figsize=(10, 6))
ax.scatter(df['longitude'], df['latitude'], alpha=0.2, label="Normal")
ax.scatter(subset['longitude'], subset['latitude'], color='red', label="Anomaly")
ax.set_xlabel("Longitude")
ax.set_ylabel("Latitude")
ax.set_title("Geographic Distribution of Anomalies")
ax.legend()

st.pyplot(fig)

# --------------------------
# 6. Show time-series of anomaly scores
# --------------------------
if "time" in df.columns:
    fig2, ax2 = plt.subplots(figsize=(12, 6))
    ax2.plot(df['time'], df['anomaly_score'], label="Anomaly Score")
    ax2.axhline(threshold, color='red', linestyle='--', label="Threshold")
    ax2.set_xlabel("Time")
    ax2.set_ylabel("Anomaly Score")
    ax2.set_title("Anomaly Scores Over Time")
    ax2.legend()
    st.pyplot(fig2)
