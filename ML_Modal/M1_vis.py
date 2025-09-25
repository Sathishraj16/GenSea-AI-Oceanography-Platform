import streamlit as st
import pandas as pd
import matplotlib.pyplot as plt
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor

# =====================
# Load and Prepare Data
# =====================
@st.cache_data
def load_data():
    df = pd.read_csv("ocean_data.csv")
    df = df.dropna(subset=['sithick', 'ist', 'sob', 'mlotst', 'siage', 'usi', 'vsi'])
    return df

df = load_data()

st.title("🚨 Early Warning System for Sea Ice Thinning")

# =====================
# Train Model
# =====================
features = ['ist', 'sob', 'mlotst', 'siage', 'usi', 'vsi']
target = 'sithick'

X = df[features]
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = RandomForestRegressor(n_estimators=100, random_state=42)
model.fit(X_train, y_train)

st.sidebar.write(f"📊 Model R² Score: {model.score(X_test, y_test):.3f}")

# =====================
# Predictions + Risk
# =====================
df['pred_sithick'] = model.predict(X)
# Risk if predicted much lower than actual
df['risk'] = (df['sithick'] - df['pred_sithick']) < -0.2

# =====================
# Visualization
# =====================
time_options = sorted(df['time'].unique())
selected_time = st.sidebar.selectbox("Select Time Step", time_options)
subset = df[df['time'] == selected_time]

fig, ax = plt.subplots(figsize=(10, 6))

# Plot safe ice in blue
safe = subset[~subset['risk']]
ax.scatter(safe['longitude'], safe['latitude'], 
           c='blue', s=20, label='Stable Ice', alpha=0.6)

# Plot risky ice in red
risky = subset[subset['risk']]
ax.scatter(risky['longitude'], risky['latitude'], 
           c='red', s=40, label='High Melt Risk', alpha=0.7)

ax.set_title(f"Sea Ice Thinning Risk at {selected_time}")
ax.set_xlabel("Longitude")
ax.set_ylabel("Latitude")
ax.legend()

st.pyplot(fig)

st.markdown("### 📝 How It Works")
st.markdown("""
- A RandomForest model predicts **sea ice thickness (sithick)**.
- If predicted thickness is much lower than actual → the cell is flagged **at risk**.
- Red points = **potential early warning zones**.
""")
