import streamlit as st
import pandas as pd
import requests
from sklearn.linear_model import LinearRegression
import numpy as np
import time

# --- Configuration ---
CHANNEL_ID = '2896085'
READ_API_KEY = '0FALZCHXD350JZLE'
FIELD_NUMBER = '1'  # Update if using another field
FETCH_URL = f'https://api.thingspeak.com/channels/{CHANNEL_ID}/fields/{FIELD_NUMBER}.json?api_key={READ_API_KEY}&results=100'

st.set_page_config(page_title="Smart Water Monitoring", layout="centered")
st.title("🚰 Smart Water Tank Monitor & Predictor")

# --- Fetch Data from ThingSpeak ---
def fetch_data():
    response = requests.get(FETCH_URL)
    data = response.json()
    feeds = data['feeds']
    df = pd.DataFrame(feeds)
    df['created_at'] = pd.to_datetime(df['created_at'])
    df['value'] = pd.to_numeric(df[f'field{FIELD_NUMBER}'], errors='coerce')
    df = df.dropna(subset=['value'])
    return df

df = fetch_data()

if df.empty:
    st.error("No data available. Please check your ThingSpeak setup.")
    st.stop()

# --- Show Latest Data ---
latest_value = df['value'].iloc[-1]
latest_time = df['created_at'].iloc[-1]
st.metric("🔄 Latest Water Level", f"{latest_value:.2f}", help="Fetched from ThingSpeak")
st.caption(f"Last updated: {latest_time.strftime('%Y-%m-%d %H:%M:%S')}")

# --- Water Level Status ---
def get_status(level):
    if level >= 1500:
        return "✅ Tank is Nearly Full"
    elif level >= 500:
        return "🟡 Water Level is OK"
    else:
        return "🔴 Refill Needed"

st.subheader("📊 Current Tank Status:")
st.info(get_status(latest_value))

# --- Predict Water Level with Linear Regression and Find Refill Time ---
st.subheader("🔮 Water Level Prediction (Linear Regression Model)")

# Prepare the data for prediction
df['timestamp'] = df['created_at'].astype(np.int64) // 10**9  # Convert datetime to Unix timestamp for regression
X = df['timestamp'].values.reshape(-1, 1)  # Features (timestamps)
y = df['value'].values  # Target (water levels)

# Train the Linear Regression model
model = LinearRegression()
model.fit(X, y)

# Predict future water levels for a period of time (up to 100 minutes ahead)
future_times = np.array([df['timestamp'].iloc[-1] + i * 600 for i in range(1, 101)]).reshape(-1, 1)  # Next 100 minutes
future_predictions = model.predict(future_times)

# Convert future timestamps to datetime
future_datetimes = pd.to_datetime(future_times.flatten(), unit='s')

# --- When will the water level reach critical? ---
critical_threshold = 500  # Critical level for refill
critical_time = future_datetimes[future_predictions < critical_threshold][0] if len(future_predictions[future_predictions < critical_threshold]) > 0 else None

# Show the exact time when refill is needed
if critical_time:
    st.warning(f"⚠️ Refill Suggested by: **{critical_time.strftime('%Y-%m-%d %H:%M:%S')}**")
else:
    st.success("✅ The tank will not reach critical levels in the next 100 minutes.")

# --- Graph: Past + Future Predictions ---
st.subheader("📈 Water Level Trend (Past + Prediction)")

# Combine actual and predicted data
history_df = pd.DataFrame({
    "Datetime": df['created_at'],
    "Water Level": df['value']
})
future_df = pd.DataFrame({
    "Datetime": future_datetimes,
    "Water Level": future_predictions
})

combined_df = pd.concat([history_df, future_df])

# Show the line chart
st.line_chart(data=combined_df.set_index("Datetime"))
