import streamlit as st
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error
from sklearn.preprocessing import LabelEncoder
import holidays
from datetime import datetime, timedelta
import plotly.express as px

# Set page config
st.set_page_config(
    page_title="Food Demand Forecasting",
    page_icon="🍽️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom CSS
st.markdown("""
<style>
    .main {background-color: #f5f5f5;}
    .reportview-container .main .block-container {padding-top: 2rem;}
    .stDateInput {width: 200px;}
    .stSelectbox {width: 300px;}
</style>
""", unsafe_allow_html=True)

# Title and description
st.title("🍽️ Food Demand Forecasting")
st.markdown("""
This application predicts food demand based on historical sales data and provides recommendations.
""")

# Load data function (mock data if file not found)
@st.cache_data
def load_data():
    try:
        df = pd.read_csv('1.csv', parse_dates=['Time/Date'])
    except FileNotFoundError:
        st.warning("Original file not found, using sample data...")
        data = {
            'Item Name': ['Paneer Biryani', 'Aloo Paratha', 'Rajma Rice']*100,
            'Quantity Sold': np.random.randint(1, 10, size=300),
            'Time/Date': pd.date_range(start='2023-01-01', periods=300, freq='H')
        }
        df = pd.DataFrame(data)
    return df

# Preprocess data
@st.cache_data
def preprocess_data(df):
    # Convert to datetime if not already
    df['Time/Date'] = pd.to_datetime(df['Time/Date'])

    # Extract temporal features
    df['date'] = df['Time/Date'].dt.date
    df['year'] = df['Time/Date'].dt.year
    df['month'] = df['Time/Date'].dt.month
    df['day'] = df['Time/Date'].dt.day
    df['day_of_week'] = df['Time/Date'].dt.dayofweek
    df['hour'] = df['Time/Date'].dt.hour
    df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
    df['is_peak'] = ((df['hour'] >= 11) & (df['hour'] <= 14)) | ((df['hour'] >= 18) & (df['hour'] <= 21))
    df['is_peak'] = df['is_peak'].astype(int)

    # Add holiday information (India as example)
    in_holidays = holidays.India(years=df['Time/Date'].dt.year.unique())
    df['is_holiday'] = df['Time/Date'].dt.date.apply(lambda x: x in in_holidays).astype(int)

    # Encode item names
    item_encoder = LabelEncoder()
    df['item_code'] = item_encoder.fit_transform(df['Item Name'])
    
    return df, item_encoder

# Train model
@st.cache_resource
def train_model(daily_sales):
    X = daily_sales[['Item Name', 'day_of_week', 'is_weekend', 'is_holiday', 'month', 'is_peak', 'rolling_3day']]
    y = daily_sales['Quantity Sold']
    X = pd.get_dummies(X, columns=['Item Name'])
    
    model = RandomForestRegressor(n_estimators=200, random_state=42)
    model.fit(X, y)
    return model, X.columns

# Load and preprocess data
df = load_data()
df, item_encoder = preprocess_data(df)

# Create daily sales aggregation
daily_sales = df.groupby(['date', 'Item Name', 'day_of_week', 'is_weekend', 'is_holiday', 'month']).agg({
    'Quantity Sold': 'sum',
    'is_peak': 'mean'
}).reset_index()

# Add rolling features
daily_sales['rolling_3day'] = daily_sales.groupby('Item Name')['Quantity Sold'].transform(
    lambda x: x.rolling(3, min_periods=1).mean()
)

# Train model
model, feature_columns = train_model(daily_sales)

# Sidebar controls
st.sidebar.header("Forecast Controls")
prediction_date = st.sidebar.date_input(
    "Select date for prediction",
    min_value=datetime.now().date(),
    value=datetime.now().date() + timedelta(days=1)
)

selected_items = st.sidebar.multiselect(
    "Select items to forecast",
    options=df['Item Name'].unique(),
    default=df['Item Name'].unique()[:3]
)

# Main content tabs
tab1, tab2, tab3, tab4 = st.tabs(["Forecast", "Historical Data", "Recommendations", "Anomaly Detection"])

with tab1:
    st.header("Demand Forecast")
    
    def predict_demand(date_to_predict, items):
        if not items:
            return pd.DataFrame()
            
        day_of_week = date_to_predict.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        is_holiday = 1 if date_to_predict in holidays.India() else 0
        month = date_to_predict.month
        is_peak = 0.5
        
        pred_data = []
        for item in items:
            item_data = daily_sales[daily_sales['Item Name'] == item]
            rolling_3day = item_data['Quantity Sold'].tail(3).mean() if len(item_data) > 0 else 0
            
            features = {
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'is_holiday': is_holiday,
                'month': month,
                'is_peak': is_peak,
                'rolling_3day': rolling_3day
            }
            features.update({f'Item Name_{item}': 1})
            pred_data.append(features)
        
        pred_df = pd.DataFrame(pred_data).fillna(0)
        
        for col in feature_columns:
            if col not in pred_df.columns:
                pred_df[col] = 0
        
        pred_df = pred_df[feature_columns]
        pred_df['predicted_quantity'] = model.predict(pred_df)
        pred_df['Item Name'] = items
        
        return pred_df[['Item Name', 'predicted_quantity']].sort_values('predicted_quantity', ascending=False)

    if st.button("Generate Forecast"):
        with st.spinner("Generating predictions..."):
            predictions = predict_demand(prediction_date, selected_items)
            
            if not predictions.empty:
                col1, col2 = st.columns(2)
                
                with col1:
                    st.subheader("Top Items by Predicted Demand")
                    st.dataframe(predictions.style.background_gradient(cmap='Blues'), 
                                use_container_width=True)
                
                with col2:
                    st.subheader("Visualization")
                    fig = px.bar(predictions, 
                                 x='Item Name', 
                                 y='predicted_quantity',
                                 color='predicted_quantity',
                                 color_continuous_scale='Blues')
                    st.plotly_chart(fig, use_container_width=True)
            else:
                st.warning("Please select at least one item to forecast.")

with tab2:
    st.header("Historical Sales Data")
    
    # Date range selector
    col1, col2 = st.columns(2)
    with col1:
        start_date = st.date_input("Start date", 
                                 value=df['date'].min(), 
                                 min_value=df['date'].min(), 
                                 max_value=df['date'].max())
    with col2:
        end_date = st.date_input("End date", 
                               value=df['date'].max(), 
                               min_value=df['date'].min(), 
                               max_value=df['date'].max())
    
    filtered_df = df[(df['date'] >= start_date) & (df['date'] <= end_date)]
    
    if not filtered_df.empty:
        # Sales by item
        st.subheader("Sales by Item")
        item_counts = filtered_df['Item Name'].value_counts().reset_index()
        item_counts.columns = ['Item Name', 'Count']
        fig = px.bar(item_counts, 
                     x='Item Name', 
                     y='Count', 
                     color='Count',
                     color_continuous_scale='Viridis')
        st.plotly_chart(fig, use_container_width=True)
        
        # Time series of sales
        st.subheader("Sales Over Time")
        time_agg = filtered_df.groupby('date')['Quantity Sold'].sum().reset_index()
        fig = px.line(time_agg, 
                      x='date', 
                      y='Quantity Sold',
                      markers=True)
        st.plotly_chart(fig, use_container_width=True)
    else:
        st.warning("No data available for selected date range.")

with tab3:
    st.header("Product Recommendations")
    
    # Create order groups for recommendations
    df['order_id'] = (df['Time/Date'].diff() > pd.Timedelta('30min')).cumsum()
    item_matrix = pd.crosstab(df['order_id'], df['Item Name'])
    co_occurrence = item_matrix.T.dot(item_matrix)
    np.fill_diagonal(co_occurrence.values, 0)
    
    selected_item = st.selectbox(
        "Select an item to get recommendations",
        options=df['Item Name'].unique()
    )
    
    if st.button("Get Recommendations"):
        recommendations = co_occurrence[selected_item].sort_values(ascending=False).head(3).index.tolist()
        
        if recommendations:
            st.subheader(f"Customers who bought {selected_item} also bought:")
            for i, item in enumerate(recommendations, 1):
                st.markdown(f"{i}. {item}")
            
            # Visualize co-occurrence
            st.subheader("Item Pair Frequency")
            top_pairs = co_occurrence[selected_item].sort_values(ascending=False).head(10).reset_index()
            top_pairs.columns = ['Item', 'Frequency']
            fig = px.bar(top_pairs, 
                         x='Item', 
                         y='Frequency',
                         color='Frequency',
                         color_continuous_scale='Greens')
            st.plotly_chart(fig, use_container_width=True)
        else:
            st.warning(f"No recommendation data available for {selected_item}")

with tab4:
    st.header("Anomaly Detection")
    st.info("This section identifies unusual sales patterns in historical data.")
    
    # Create daily sales pivot
    daily_pivot = daily_sales.pivot(index='date', columns='Item Name', values='Quantity Sold').fillna(0)
    
    # Detect anomalies
    from sklearn.ensemble import IsolationForest
    clf = IsolationForest(contamination=0.05, random_state=42)
    anomalies = clf.fit_predict(daily_pivot)
    daily_pivot['anomaly'] = anomalies
    anomaly_dates = daily_pivot[daily_pivot['anomaly'] == -1].index
    
    if not anomaly_dates.empty:
        st.subheader("Detected Anomalies")
        st.write(f"Found {len(anomaly_dates)} unusual days in the dataset:")
        st.dataframe(pd.DataFrame({'Anomaly Dates': anomaly_dates}))
        
        st.subheader("Sales with Anomalies Highlighted")
        fig, ax = plt.subplots(figsize=(12, 6))
        for item in daily_pivot.columns[:3]:  # Plot first 3 items
            if item != 'anomaly':
                ax.plot(daily_pivot.index, daily_pivot[item], label=item)
        
        for date in anomaly_dates:
            ax.axvline(date, color='red', alpha=0.3)
        
        ax.set_title('Daily Sales with Anomalies Highlighted')
        ax.legend()
        plt.xticks(rotation=45)
        st.pyplot(fig)
    else:
        st.success("No anomalies detected in the dataset.")

# Footer
st.markdown("---")
st.markdown("""
**Food Demand Forecasting** - This application helps predict food demand and optimize inventory management.
""")
