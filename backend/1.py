import pandas as pd
import numpy as np
import holidays
from datetime import datetime
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.impute import SimpleImputer
import joblib
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings('ignore')

class FoodDemandPredictor:
    def __init__(self):
        self.model = None
        self.item_encoder = None
        self.feature_processor = None
        self.holidays = holidays.India()
        
    def load_data(self, file_path='1.csv'):
        """Load data from CSV file with error handling"""
        try:
            df = pd.read_csv(file_path, parse_dates=['Time/Date'])
            print(f"Successfully loaded data with {len(df)} records.")
            return df
        except FileNotFoundError:
            print(f"Error: '{file_path}' file not found.")
            return None
        except Exception as e:
            print(f"Error loading data: {str(e)}")
            return None
    
    def create_features(self, df):
        """Create time-based and other relevant features"""
        df['Time/Date'] = pd.to_datetime(df['Time/Date'])
        
        # Time features
        df['hour'] = df['Time/Date'].dt.hour
        df['day_of_week'] = df['Time/Date'].dt.dayofweek
        df['day_of_month'] = df['Time/Date'].dt.day
        df['month'] = df['Time/Date'].dt.month
        df['year'] = df['Time/Date'].dt.year
        df['is_weekend'] = (df['day_of_week'] >= 5).astype(int)
        
        # Business logic features
        df['is_peak_hours'] = ((df['hour'] >= 11) & (df['hour'] <= 14)) | \
                             ((df['hour'] >= 18) & (df['hour'] <= 21))
        df['is_morning'] = (df['hour'] >= 6) & (df['hour'] <= 10)
        df['is_late_night'] = (df['hour'] <= 5) | (df['hour'] >= 22)
        
        # Holiday features
        df['date'] = df['Time/Date'].dt.date
        df['is_holiday'] = df['date'].apply(lambda x: x in self.holidays).astype(int)
        
        # Item features
        self.item_encoder = LabelEncoder()
        df['item_code'] = self.item_encoder.fit_transform(df['Item Name'])
        
        # Lag features (if we had more data)
        # df['rolling_avg_7d'] = df.groupby('Item Name')['Quantity Sold'].transform(
        #     lambda x: x.rolling(window=7, min_periods=1).mean())
        
        return df
    
    def preprocess_data(self, df):
        """Preprocess data and create aggregated features"""
        # Aggregate to daily level
        daily_sales = df.groupby(['date', 'Item Name', 'item_code', 'day_of_week', 
                                 'is_weekend', 'is_holiday', 'month', 'year']).agg({
            'Quantity Sold': 'sum',
            'is_peak_hours': 'mean',
            'is_morning': 'mean',
            'is_late_night': 'mean'
        }).reset_index()
        
        return daily_sales
    
    def build_model_pipeline(self):
        """Build a robust model pipeline with preprocessing"""
        # Define numeric and categorical features
        numeric_features = ['day_of_week', 'month', 'is_peak_hours', 'is_morning', 'is_late_night']
        categorical_features = ['item_code', 'is_weekend', 'is_holiday']
        
        # Create transformers
        numeric_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='median')),
            ('scaler', StandardScaler())])
        
        categorical_transformer = Pipeline(steps=[
            ('imputer', SimpleImputer(strategy='constant', fill_value=0)),
            ('onehot', OneHotEncoder(handle_unknown='ignore'))])
        
        # Combine preprocessing steps
        self.feature_processor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, numeric_features),
                ('cat', categorical_transformer, categorical_features)])
        
        # Create final pipeline
        pipeline = Pipeline(steps=[
            ('preprocessor', self.feature_processor),
            ('regressor', RandomForestRegressor(
                n_estimators=300,
                max_depth=12,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42,
                n_jobs=-1))])
        
        return pipeline
    
    def train_model(self, X, y):
        """Train the model with evaluation"""
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42)
        
        # Build and train model
        model = self.build_model_pipeline()
        model.fit(X_train, y_train)
        
        # Evaluate
        train_pred = model.predict(X_train)
        test_pred = model.predict(X_test)
        
        print("\nModel Evaluation:")
        print(f"Train MAE: {mean_absolute_error(y_train, train_pred):.2f}")
        print(f"Test MAE: {mean_absolute_error(y_test, test_pred):.2f}")
        print(f"Train RMSE: {np.sqrt(mean_squared_error(y_train, train_pred)):.2f}")
        print(f"Test RMSE: {np.sqrt(mean_squared_error(y_test, test_pred)):.2f}")
        
        return model
    
    def save_model(self, model_path='food_demand_model.pkl'):
        """Save the entire model pipeline and encoders"""
        model_data = {
            'model': self.model,
            'item_encoder': self.item_encoder,
            'feature_processor': self.feature_processor
        }
        joblib.dump(model_data, model_path)
        print(f"\nModel saved successfully to {model_path}")
    
    def run_pipeline(self):
        """Run the complete training pipeline"""
        # Load data
        df = self.load_data()
        if df is None:
            return
        
        # Feature engineering
        df = self.create_features(df)
        
        # Preprocess data
        daily_sales = self.preprocess_data(df)
        
        # Prepare features and target
        features = ['item_code', 'day_of_week', 'is_weekend', 'is_holiday', 
                   'month', 'is_peak_hours', 'is_morning', 'is_late_night']
        X = daily_sales[features]
        y = daily_sales['Quantity Sold']
        
        # Train model
        self.model = self.train_model(X, y)
        
        # Save model
        self.save_model()

if __name__ == '__main__':
    predictor = FoodDemandPredictor()
    predictor.run_pipeline()