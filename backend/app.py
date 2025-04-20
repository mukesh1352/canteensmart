import streamlit as st
import pandas as pd
import numpy as np
import joblib
import plotly.express as px
from datetime import datetime, timedelta, time
import holidays
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import calendar

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
        # Load historical data (replace with your actual data loading)
        df = pd.read_csv('1.csv', parse_dates=['Time/Date'])
        
        # Load trained model
        model_data = joblib.load("food_demand_model.pkl")
        
        return {
            'model': model_data['model'],
            'item_encoder': model_data['item_encoder'],
            'feature_processor': model_data['feature_processor'],
            'historical_data': df
        }
    except Exception as e:
        st.error(f"Error loading resources: {str(e)}")
        return None

assets = load_assets()
if assets is None:
    st.stop()

model = assets['model']
item_encoder = assets['item_encoder']
feature_processor = assets['feature_processor']
historical_data = assets['historical_data']

# Preprocess historical data
def preprocess_historical_data(df):
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

# Tab layout
tab1, tab2, tab3 = st.tabs(["📈 Prediction", "📊 Historical Trends", "💡 Recommendations"])

with tab1:
    # Current prediction
    st.subheader("Instant Demand Prediction")
    
    def predict_demand(item, date, time):
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
    
    if st.button("Predict Now"):
        with st.spinner('Calculating demand...'):
            demand = predict_demand(selected_item, prediction_date, prediction_time)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Predicted Demand", f"{demand} units")
            with col2:
                st.metric("Day of Week", prediction_date.strftime("%A"))
            with col3:
                st.metric("Peak Hours", 
                         "Yes" if (11 <= prediction_time.hour <= 14) or (18 <= prediction_time.hour <= 21) else "No")
            
            # Forecast chart
            st.subheader(f"{forecast_days}-Day Forecast")
            forecast_dates = [prediction_date + timedelta(days=i) for i in range(forecast_days)]
            forecast_data = []
            
            for date in forecast_dates:
                for hour in [8, 12, 15, 19]:  # Key meal times
                    forecast_time = time(hour, 0)
                    demand = predict_demand(selected_item, date, forecast_time)
                    forecast_data.append({
                        'Date': date,
                        'Time': forecast_time,
                        'Demand': demand,
                        'Day': date.strftime("%A"),
                        'Meal Time': "Breakfast" if hour == 8 else "Lunch" if hour == 12 else "Afternoon" if hour == 15 else "Dinner"
                    })
            
            forecast_df = pd.DataFrame(forecast_data)
            fig = px.line(forecast_df, x='Date', y='Demand', color='Meal Time',
                          title=f"Demand Forecast for {selected_item}",
                          labels={'Demand': 'Predicted Demand (units)'})
            st.plotly_chart(fig, use_container_width=True)

with tab2:
    st.subheader("Historical Sales Trends")
    
    # Filter historical data for selected item
    item_data = historical_data[historical_data['Item Name'] == selected_item].copy()
    
    if len(item_data) > 0:
        # Time period selector
        time_period = st.radio("View by:", ["Daily", "Weekly", "Monthly"], horizontal=True)
        
        if time_period == "Daily":
            grouped = item_data.groupby('date')['Quantity Sold'].sum().reset_index()
            fig = px.line(grouped, x='date', y='Quantity Sold', 
                          title=f"Daily Sales for {selected_item}")
        elif time_period == "Weekly":
            item_data['week'] = item_data['Time/Date'].dt.to_period('W').dt.start_time
            grouped = item_data.groupby('week')['Quantity Sold'].sum().reset_index()
            fig = px.line(grouped, x='week', y='Quantity Sold', 
                          title=f"Weekly Sales for {selected_item}")
        else:  # Monthly
            item_data['month'] = item_data['Time/Date'].dt.to_period('M').dt.start_time
            grouped = item_data.groupby('month')['Quantity Sold'].sum().reset_index()
            fig = px.line(grouped, x='month', y='Quantity Sold', 
                          title=f"Monthly Sales for {selected_item}")
        
        st.plotly_chart(fig, use_container_width=True)
        
        # Hourly heatmap
        st.subheader("Hourly Demand Patterns")
        heatmap_data = item_data.groupby(['day_of_week', 'hour'])['Quantity Sold'].mean().reset_index()
        heatmap_data['day_name'] = heatmap_data['day_of_week'].apply(lambda x: calendar.day_name[x])
        
        fig = px.density_heatmap(heatmap_data, x='hour', y='day_name', z='Quantity Sold',
                                title="Average Demand by Day and Hour",
                                labels={'hour': 'Hour of Day', 'day_name': 'Day of Week'},
                                height=500)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("No historical data available for this item")

with tab3:
    st.subheader("Smart Recommendations")
    
    # Generate recommendations based on predictions
    if st.button("Generate Recommendations"):
        with st.spinner('Analyzing patterns...'):
            # Recommendation 1: Best selling days
            item_data = historical_data[historical_data['Item Name'] == selected_item]
            if len(item_data) > 0:
                best_day = item_data.groupby('day_of_week')['Quantity Sold'].mean().idxmax()
                best_day_name = calendar.day_name[best_day]
                
                # Recommendation 2: Optimal stock levels
                avg_demand = item_data['Quantity Sold'].mean()
                std_demand = item_data['Quantity Sold'].std()
                recommended_stock = round(avg_demand + std_demand)
                
                # Recommendation 3: Best selling time
                best_hour = item_data.groupby('hour')['Quantity Sold'].mean().idxmax()
                best_time = f"{best_hour}:00 - {best_hour+1}:00"
                
                # Display recommendations
                col1, col2, col3 = st.columns(3)
                with col1:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h3>📅 Best Day</h3>
                        <p>{best_day_name}</p>
                    </div>
                    """, unsafe_allow_html=True)
                with col2:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h3>🕒 Best Time</h3>
                        <p>{best_time}</p>
                    </div>
                    """, unsafe_allow_html=True)
                with col3:
                    st.markdown(f"""
                    <div class="metric-card">
                        <h3>📦 Recommended Stock</h3>
                        <p>{recommended_stock} units</p>
                    </div>
                    """, unsafe_allow_html=True)
            else:
                st.warning("Insufficient data for recommendations.")
