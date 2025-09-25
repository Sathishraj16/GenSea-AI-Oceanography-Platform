import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
import matplotlib.colors as mcolors

# Load CSV
@st.cache_data
def load_data():
    df = pd.read_csv("ocean_data.csv")
    df = df.dropna()
    return df

df = load_data()

st.title("🌊 Arctic Sentinel: AI-Powered Ice Risk & Drift Tracker")

# Sidebar controls
time_options = sorted(df['time'].unique())
selected_time = st.sidebar.selectbox("Select Time Step", time_options)

# Filter data
subset = df[df['time'] == selected_time]

# Plot
fig, ax = plt.subplots(figsize=(10, 6))

# 1. Risk zones (red if thinning predicted vs actual)
if 'pred_sithick' in df.columns and 'risk' in df.columns:
    risky = subset[subset['risk']]
    ax.scatter(risky['longitude'], risky['latitude'], 
               color='red', label='High Melt Risk', alpha=0.6)

# 2. Drift arrows
ax.quiver(subset['longitude'], subset['latitude'], 
          subset['usi'], subset['vsi'], 
          color='blue', alpha=0.5, scale=20, label="Ice Drift")

# 3. Anomalies
if 'anomaly' in df.columns:
    anomalies = subset[subset['anomaly'] == True]
    ax.scatter(anomalies['longitude'], anomalies['latitude'], 
               color='orange', marker='x', label='Anomaly')

ax.set_title(f"Sea Ice Conditions at {selected_time}")
ax.set_xlabel("Longitude")
ax.set_ylabel("Latitude")
ax.legend()

st.pyplot(fig)
