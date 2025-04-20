import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.express as px
from datetime import datetime, time
import holidays
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder

# Set page config
st.set_page_config(
    page_title="Smart Food Demand Forecast",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main {
        background-color: #f5f5f5;
    }
    .stButton>button {
        background-color: #4CAF50;
        color: white;
        border-radius: 5px;
    }
    .stSelectbox, .stDateInput, .stTimeInput {
        background-color: white;
    }
    .metric-card {
        background-color: white;
        border-radius: 10px;
        padding: 15px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        margin-bottom: 15px;
    }
</style>
""", unsafe_allow_html=True)

# Load data and models
@st.cache_resource
def load_assets():
    try:
        # Load the historical data (1.csv)
        df = pd.read_csv('1.csv', parse_dates=['Time/Date'])
        model_data = joblib.load("food_demand_model.pkl")
        return {
            'model': model_data['model'],
            'item_encoder': model_data['item_encoder'],
            'feature_processor': model_data.get('feature_processor', None),
            'historical_data': df
        }
    except FileNotFoundError as e:
        st.error(f"File not found: {str(e)}")
        return None
    except Exception as e:
        st.error(f"Error loading resources: {str(e)}")
        return None

# Load the assets (model and historical data)
assets = load_assets()
if assets is None:
    st.stop()

model = assets['model']
item_encoder = assets['item_encoder']
feature_processor = assets['feature_processor']
historical_data = assets['historical_data']

# Preprocess historical data for analysis and prediction
def preprocess_historical_data(df):
    """Process the historical sales data to create features."""
    df['Time/Date'] = pd.to_datetime(df['Time/Date'])
    df['date'] = df['Time/Date'].dt.date
    df['day_of_week'] = df['Time/Date'].dt.dayofweek
    df['hour'] = df['Time/Date'].dt.hour
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['month'] = df['Time/Date'].dt.month
    df['item_code'] = item_encoder.transform(df['Item Name'])
    return df

historical_data = preprocess_historical_data(historical_data)

# Sidebar inputs
st.sidebar.header("📊 Prediction Parameters")
selected_item = st.sidebar.selectbox("Menu Item", item_encoder.classes_)
prediction_date = st.sidebar.date_input("Date", datetime.now())
prediction_time = st.sidebar.time_input("Time", time(12, 0))
forecast_days = st.sidebar.slider("Forecast Period (days)", 1, 30, 7)

# Main app
st.title("🍽️ Smart Food Demand Forecasting")
st.markdown("Predict future demand and optimize your inventory planning")

# Tab layout for Prediction, Historical Trends, and Recommendations
tab1, tab2, tab3 = st.tabs(["📈 Prediction", "📊 Historical Trends", "💡 Recommendations"])

# Prediction tab: Predict demand based on selected parameters
def predict_demand(item, date, time):
    """Predict the food demand using the trained model."""
    india_holidays = holidays.India()
    is_holiday = date in india_holidays

    input_data = {
        'item_code': item_encoder.transform([item])[0],
        'day_of_week': date.weekday(),
        'is_weekend': int(date.weekday() >= 5),
        'is_holiday': int(is_holiday),
        'month': date.month,
        'is_peak_hours': int((11 <= time.hour <= 14) or (18 <= time.hour <= 21)),
        'is_morning': int(6 <= time.hour <= 10),
        'is_late_night': int(time.hour <= 5 or time.hour >= 22)
    }

    input_df = pd.DataFrame([input_data])
    prediction = model.predict(input_df)[0]
    return max(0, round(prediction))

with tab1:
    st.subheader("Instant Demand Prediction")

    if st.button("Predict Now"):
        with st.spinner('Calculating demand...'):
            demand = predict_demand(selected_item, prediction_date, prediction_time)

            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Predicted Demand", f"{demand} units")
            with col2:
                st.metric("Day of Week", prediction_date.strftime("%A"))
            with col3:
                st.metric("Time Slot", prediction_time.strftime("%I:%M %p"))

# Historical trends tab: Display past demand trends
with tab2:
    st.subheader("Historical Trends")
    filtered_data = historical_data[historical_data['Item Name'] == selected_item]
    daily_demand = filtered_data.groupby('date')['Quantity Sold'].sum().reset_index()

    fig = px.line(daily_demand, x='date', y='Quantity Sold', title=f'Daily Sales Trend for {selected_item}')
    st.plotly_chart(fig, use_container_width=True)

# Recommendations tab: Provide inventory recommendations
with tab3:
    st.subheader("Inventory & Preparation Recommendations")
    avg_daily = historical_data[historical_data['Item Name'] == selected_item] \
        .groupby('date')['Quantity Sold'].sum().mean()

    peak_day = historical_data[historical_data['Item Name'] == selected_item] \
        .groupby('day_of_week')['Quantity Sold'].mean().idxmax()
    
    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

    st.markdown(f"""
    - 📌 **Average Daily Demand:** {avg_daily:.1f} units  
    - 🚀 **Peak Sales Day:** {days[peak_day]}  
    - ✅ **Recommendation:** Ensure at least **{int(avg_daily + 5)} units** available on average days.  
    - 🔁 Monitor inventory around lunch (11 AM - 2 PM) and dinner (6 PM - 9 PM).
    """)
