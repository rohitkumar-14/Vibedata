import pandas as pd
import numpy as np
import io
import re
import sqlite3
from typing import Dict, Any, List
from scipy import stats
from sklearn.linear_model import LinearRegression
from services.schema_service import SchemaService
from sklearn.impute import KNNImputer
from sklearn.experimental import enable_iterative_imputer
from sklearn.impute import IterativeImputer
from sklearn.ensemble import IsolationForest
from sklearn.neighbors import LocalOutlierFactor
from imblearn.over_sampling import SMOTE
from imblearn.under_sampling import RandomUnderSampler
import holidays

class DataService:
    def __init__(self):
        self.original_df: pd.DataFrame = None
        self.current_df: pd.DataFrame = None
        self.filename: str = ""
        self.history: List[Dict[str, Any]] = [] # Tracks operations
        
        # Secondary dataset for joins
        self.secondary_df: pd.DataFrame = None
        self.secondary_filename: str = ""
        
        self.schema_service = SchemaService()

    def load_data(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Loads CSV, Excel, JSON or Parquet data into a Pandas dataframe."""
        self.filename = filename
        self.history = [] # Reset history on new upload
        
        if filename.endswith(".csv"):
            self.original_df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith((".xls", ".xlsx")):
            self.original_df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith(".json"):
            try:
                self.original_df = pd.read_json(io.BytesIO(file_content), orient="records")
            except Exception:
                self.original_df = pd.read_json(io.BytesIO(file_content))
        elif filename.endswith(".parquet"):
            self.original_df = pd.read_parquet(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format. Supported: CSV, Excel, JSON, Parquet.")

        self.current_df = self.original_df.copy()
        return self.get_summary()

    def load_secondary_data(self, file_content: bytes, filename: str) -> Dict[str, Any]:
        """Loads a secondary dataset for merging."""
        self.secondary_filename = filename
        
        if filename.endswith(".csv"):
            self.secondary_df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith((".xls", ".xlsx")):
            self.secondary_df = pd.read_excel(io.BytesIO(file_content))
        elif filename.endswith(".json"):
            try:
                self.secondary_df = pd.read_json(io.BytesIO(file_content), orient="records")
            except Exception:
                self.secondary_df = pd.read_json(io.BytesIO(file_content))
        elif filename.endswith(".parquet"):
            self.secondary_df = pd.read_parquet(io.BytesIO(file_content))
        else:
            raise ValueError("Unsupported file format. Supported: CSV, Excel, JSON, Parquet.")

        return {
            "filename": self.secondary_filename,
            "columns": list(self.secondary_df.columns),
            "row_count": len(self.secondary_df)
        }

    def execute_join(self, join_type: str, left_on: str, right_on: str) -> Dict[str, Any]:
        """Merges the secondary dataset into the primary dataset."""
        if self.current_df is None:
            raise ValueError("No primary dataset loaded.")
        if self.secondary_df is None:
            raise ValueError("No secondary dataset loaded.")
        
        if left_on not in self.current_df.columns:
            raise ValueError(f"Column '{left_on}' not found in primary dataset.")
        if right_on not in self.secondary_df.columns:
            raise ValueError(f"Column '{right_on}' not found in secondary dataset.")
        if join_type not in ["inner", "left", "right", "outer"]:
            raise ValueError(f"Invalid join type: {join_type}")

        original_df = self.current_df.copy()
        
        try:
            # Perform the merge
            merged_df = pd.merge(
                self.current_df, 
                self.secondary_df, 
                how=join_type, 
                left_on=left_on, 
                right_on=right_on
            )
            
            # Record the python code for reproducibility
            python_code = f"# Requires secondary file: {self.secondary_filename}\n"
            python_code += f"df_secondary = pd.read_csv('{self.secondary_filename}') # Adjust read function based on extension\n"
            python_code += f"df = pd.merge(df, df_secondary, how='{join_type}', left_on='{left_on}', right_on='{right_on}')"
            
            action_desc = f"Merged '{self.secondary_filename}' ({join_type} join) on {left_on} = {right_on}"
            
            self.history.append({
                "operation_id": "merge_datasets",
                "column": left_on,
                "method": f"{join_type}:{right_on}",
                "description": action_desc,
                "code": python_code,
                "state_snapshot": original_df
            })
            
            self.current_df = merged_df
            return self.get_summary()
            
        except Exception as e:
            raise ValueError(f"Failed to merge datasets: {str(e)}")

    def set_dataframe(self, df: pd.DataFrame, filename: str) -> Dict[str, Any]:
        """Loads a Pandas dataframe directly, resetting cleaning history."""
        self.filename = filename
        self.history = []
        self.original_df = df.copy()
        self.current_df = df.copy()
        return self.get_summary()


    def load_mock_database(self) -> Dict[str, Any]:
        """Loads a simulated dataset from a Database connection."""
        self.filename = "mock_database_sales.csv"
        self.history = []
        
        # Create a mock sales dataset
        dates = pd.date_range(start="2023-01-01", periods=100)
        self.original_df = pd.DataFrame({
            "id": range(1, 101),
            "date": dates,
            "region": np.random.choice(["North", "South", "East", "West"], 100),
            "product_category": np.random.choice(["Electronics", "Clothing", "Home", "Sports"], 100),
            "sales": np.random.normal(500, 150, 100),
            "customer_age": np.random.normal(35, 10, 100).astype(int),
            "churn_flag": np.random.choice([0, 1], 100, p=[0.8, 0.2])
        })
        self.current_df = self.original_df.copy()
        return self.get_summary()

    def load_mock_api(self) -> Dict[str, Any]:
        """Loads a simulated dataset from a REST API."""
        self.filename = "mock_api_users.csv"
        self.history = []
        
        # Create a mock user dataset
        self.original_df = pd.DataFrame({
            "user_id": range(1001, 1101),
            "signup_date": pd.date_range(start="2023-06-01", periods=100),
            "plan_type": np.random.choice(["Basic", "Pro", "Enterprise"], 100),
            "ltv": np.random.normal(1200, 300, 100),
            "session_duration_mins": np.random.exponential(15, 100),
            "support_tickets": np.random.poisson(2, 100)
        })
        self.current_df = self.original_df.copy()
        return self.get_summary()

    def load_demo_dataset(self, dataset_name: str) -> Dict[str, Any]:
        """Loads a pre-packaged rich demo dataset based on selection."""
        self.history = []
        np.random.seed(42)
        
        if dataset_name == "retail_sales":
            self.filename = "retail_sales_demo.csv"
            # 150 rows of high-fidelity sales data with geo locations
            customers = [
                {"id": "CUST-101", "name": "Emma Watson", "country": "United Kingdom", "lat": 51.5074, "lon": -0.1278},
                {"id": "CUST-102", "name": "Jean Dupont", "country": "France", "lat": 48.8566, "lon": 2.3522},
                {"id": "CUST-103", "name": "John Doe", "country": "United States", "lat": 37.7749, "lon": -122.4194},
                {"id": "CUST-104", "name": "Yuki Tanaka", "country": "Japan", "lat": 35.6762, "lon": 139.6503},
                {"id": "CUST-105", "name": "Hans Müller", "country": "Germany", "lat": 52.5200, "lon": 13.4050},
                {"id": "CUST-106", "name": "Alessandro Rossi", "country": "Italy", "lat": 41.9028, "lon": 12.4964},
                {"id": "CUST-107", "name": "Maria Silva", "country": "Brazil", "lat": -23.5505, "lon": -46.6333},
                {"id": "CUST-108", "name": "David Smith", "country": "Australia", "lat": -33.8688, "lon": 151.2093},
                {"id": "CUST-109", "name": "Li Wei", "country": "China", "lat": 39.9042, "lon": 116.4074},
                {"id": "CUST-110", "name": "Fatima Al-Sayed", "country": "United Arab Emirates", "lat": 25.2048, "lon": 55.2708}
            ]
            
            n_rows = 150
            order_ids = [f"ORD-{1000 + i}" for i in range(n_rows)]
            cust_picks = [np.random.choice(customers) for _ in range(n_rows)]
            
            products = [
                {"sku": "SKU-PROD-001", "name": "VibeData Premium Dashboard", "price": 199.99},
                {"sku": "SKU-PROD-002", "name": "Analytics Engine Pro", "price": 499.00},
                {"sku": "SKU-PROD-003", "name": "Data Connector Pack", "price": 99.50},
                {"sku": "SKU-PROD-004", "name": "AI Insights Token pack", "price": 49.00},
                {"sku": "SKU-PROD-005", "name": "Dedicated Node Support", "price": 999.00}
            ]
            
            prod_picks = [np.random.choice(products) for _ in range(n_rows)]
            quantities = [int(np.random.choice([1, 2, 3, 5], p=[0.6, 0.25, 0.1, 0.05])) for _ in range(n_rows)]
            
            statuses = ["completed", "pending", "refunded", "cancelled"]
            status_probs = [0.8, 0.1, 0.06, 0.04]
            order_statuses = [np.random.choice(statuses, p=status_probs) for _ in range(n_rows)]
            
            # Dates in 2026
            order_dates = (pd.date_range(end="2026-06-10", periods=n_rows, freq="h")).strftime("%Y-%m-%d %H:%M:%S").tolist()
            
            self.original_df = pd.DataFrame({
                "order_id": order_ids,
                "customer_id": [c["id"] for c in cust_picks],
                "customer_name": [c["name"] for c in cust_picks],
                "country": [c["country"] for c in cust_picks],
                "latitude": [c["lat"] for c in cust_picks],
                "longitude": [c["lon"] for c in cust_picks],
                "product_sku": [p["sku"] for p in prod_picks],
                "product_name": [p["name"] for p in prod_picks],
                "quantity": quantities,
                "unit_price": [p["price"] for p in prod_picks],
                "total_price": [round(p["price"] * q, 2) for p, q in zip(prod_picks, quantities)],
                "order_status": order_statuses,
                "order_date": order_dates
            })
            
        elif dataset_name == "product_reviews":
            self.filename = "customer_feedback_nlp.csv"
            # Reviews text and ratings
            reviews_pool = [
                ("VibeData has completely changed how our company profiles data. Incredible!", 5, "Positive"),
                ("The automated Pandas script export is pure magic. Saves me hours daily.", 5, "Positive"),
                ("Extremely user friendly, but it lacks multi-table join options natively in the first step.", 4, "Neutral"),
                ("Good dashboard visualization engine, though I wanted more theme options.", 4, "Neutral"),
                ("Slow data loading times for files larger than 100MB, please optimize.", 2, "Negative"),
                ("Had some issues with connection testing for PostgreSQL.", 3, "Neutral"),
                ("Absolutely stunning visuals! My executive presentation went flawlessly.", 5, "Positive"),
                ("Excellent client-side privacy model. Great for sensitive healthcare datasets.", 5, "Positive"),
                ("The ML clustering model is a bit basic. Hope to see custom hyperparameter tweaks.", 3, "Neutral"),
                ("I faced a crash when trying to drop columns containing null dates.", 2, "Negative"),
                ("VibeData is the best BI tool I have used this year. Hand down.", 5, "Positive")
            ]
            
            n_rows = 120
            picks = [reviews_pool[np.random.randint(0, len(reviews_pool))] for _ in range(n_rows)]
            
            self.original_df = pd.DataFrame({
                "review_id": [f"REV-{5000 + i}" for i in range(n_rows)],
                "customer_name": [np.random.choice(["Alice Smith", "Bob Jones", "Carol White", "Dan Brown", "Eve Black"]) for _ in range(n_rows)],
                "product_id": [np.random.choice(["PROD-A", "PROD-B", "PROD-C"]) for _ in range(n_rows)],
                "rating": [p[1] for p in picks],
                "review_text": [p[0] for p in picks],
                "submission_date": pd.date_range(end="2026-06-10", periods=n_rows, freq="2h").strftime("%Y-%m-%d %H:%M:%S")
            })
            
        elif dataset_name == "saas_metrics":
            self.filename = "daily_saas_metrics.csv"
            # Time-series data
            n_rows = 180
            dates = pd.date_range(end="2026-06-10", periods=n_rows, freq="D")
            
            # Generate a trend + seasonal signal for active users
            t = np.arange(n_rows)
            trend = 5000 + t * 25
            seasonality = 1000 * np.sin(2 * np.pi * t / 7) # Weekly seasonality
            noise = np.random.normal(0, 200, n_rows)
            active_users = (trend + seasonality + noise).astype(int)
            
            new_signups = (active_users * np.random.uniform(0.015, 0.035)).astype(int)
            mrr = 150000 + t * 800 + np.random.normal(0, 1000, n_rows)
            churn_rate = np.random.uniform(0.01, 0.04, n_rows)
            
            self.original_df = pd.DataFrame({
                "date": dates.strftime("%Y-%m-%d"),
                "active_users": active_users,
                "new_signups": new_signups,
                "mrr": np.round(mrr, 2),
                "churn_rate": np.round(churn_rate, 4)
            })
            
        else:
            raise ValueError(f"Unknown demo dataset: {dataset_name}")
            
        self.current_df = self.original_df.copy()
        return self.get_summary()

    def get_summary(self) -> Dict[str, Any]:
        """Generates overview profile statistics of the current dataset state."""
        if self.current_df is None:
            return {"status": "No data loaded"}

        df = self.current_df
        total_rows = len(df)
        total_cols = len(df.columns)
        
        # Calculate duplicate rows
        try:
            duplicate_count = int(df.duplicated().sum())
        except Exception:
            duplicate_count = 0

        # Build column stats
        columns_info = {}
        for col in df.columns:
            null_count = int(df[col].isna().sum())
            null_percentage = (null_count / total_rows) * 100 if total_rows > 0 else 0.0
            
            # Simple unique count
            unique_count = int(df[col].nunique(dropna=True))
            
            # Data type
            dtype = str(df[col].dtype)
            
            # Describe stats based on type
            desc = {}
            if pd.api.types.is_numeric_dtype(df[col]):
                desc["count"] = total_rows
                desc["mean"] = float(df[col].mean()) if not pd.isna(df[col].mean()) else None
                desc["std"] = float(df[col].std()) if not pd.isna(df[col].std()) else None
                desc["min"] = float(df[col].min()) if not pd.isna(df[col].min()) else None
                desc["25%"] = float(df[col].quantile(0.25)) if not pd.isna(df[col].quantile(0.25)) else None
                desc["50%"] = float(df[col].median()) if not pd.isna(df[col].median()) else None
                desc["75%"] = float(df[col].quantile(0.75)) if not pd.isna(df[col].quantile(0.75)) else None
                desc["max"] = float(df[col].max()) if not pd.isna(df[col].max()) else None
                
                # Outliers calculation
                try:
                    q1 = float(df[col].quantile(0.25))
                    q3 = float(df[col].quantile(0.75))
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers = df[col][(df[col] < lower_bound) | (df[col] > upper_bound)]
                    desc["outliers_count"] = int(len(outliers))
                except Exception:
                    desc["outliers_count"] = 0

                # Small histogram for sparkline
                try:
                    clean_col = df[col].replace([np.inf, -np.inf], np.nan).dropna()
                    if not clean_col.empty:
                        counts, _ = np.histogram(clean_col, bins=10)
                        desc["histogram"] = counts.tolist()
                    else:
                        desc["histogram"] = []
                except Exception:
                    desc["histogram"] = []
            else:
                desc["count"] = total_rows
                desc["unique"] = int(df[col].nunique(dropna=True))
                
                val_counts = df[col].value_counts()
                if not val_counts.empty:
                    desc["top"] = str(val_counts.index[0])
                    desc["freq"] = int(val_counts.values[0])
                else:
                    desc["top"] = None
                    desc["freq"] = None
                
                # For non-numeric, show top values
                top_counts = val_counts.head(5).to_dict()
                desc["top_values"] = [{"value": str(k), "count": int(v)} for k, v in top_counts.items()]
                try:
                    desc["unique_values"] = sorted(df[col].dropna().unique().astype(str).tolist())[:30]
                except Exception:
                    desc["unique_values"] = []

            columns_info[col] = {
                "name": col,
                "dtype": dtype,
                "null_count": null_count,
                "null_percentage": null_percentage,
                "unique_count": unique_count,
                "stats": desc
            }

        # Take a small preview of data
        # Handle nan values for JSON conversion
        preview_data = df.head(10).replace({np.nan: None}).to_dict(orient="records")

        # Calculate Data Quality Score
        quality_score = 100.0
        dup_penalty = min(15.0, (duplicate_count / total_rows * 100) if total_rows > 0 else 0)
        quality_score -= dup_penalty
        
        total_cells = total_rows * total_cols
        total_nulls = sum(c["null_count"] for c in columns_info.values())
        null_penalty = min(40.0, (total_nulls / total_cells * 100) if total_cells > 0 else 0)
        quality_score -= null_penalty

        drift_warnings = self.schema_service.validate_schema(self.filename, columns_info) if self.filename else []

        return {
            "filename": self.filename,
            "row_count": total_rows,
            "column_count": total_cols,
            "duplicate_count": duplicate_count,
            "quality_score": round(max(0.0, quality_score), 1),
            "columns": columns_info,
            "preview": preview_data,
            "history_count": len(self.history),
            "schema_drift_warnings": drift_warnings
        }

    def apply_cleaning(self, operation_id: str, column: str, method: str) -> Dict[str, Any]:
        """Applies a data cleaning operation, records the operation, and returns the new summary."""
        if self.current_df is None:
            raise ValueError("No active dataset to clean")

        df = self.current_df.copy()
        python_code = ""
        action_desc = ""

        if operation_id == "change_dtype":
            try:
                if method == "Numeric":
                    df[column] = pd.to_numeric(df[column], errors="coerce")
                    python_code = f"df['{column}'] = pd.to_numeric(df['{column}'], errors='coerce')"
                    action_desc = f"Converted column '{column}' to Numeric."
                elif method == "Categorical":
                    df[column] = df[column].astype(str)
                    python_code = f"df['{column}'] = df['{column}'].astype(str)"
                    action_desc = f"Converted column '{column}' to Categorical (String)."
                elif method == "Datetime":
                    df[column] = pd.to_datetime(df[column], errors="coerce")
                    python_code = f"df['{column}'] = pd.to_datetime(df['{column}'], errors='coerce')"
                    action_desc = f"Converted column '{column}' to Datetime."
            except Exception as e:
                raise ValueError(f"Failed to change dtype: {e}")

        # 1. REMOVE DUPLICATES
        elif operation_id == "remove_duplicates":
            before = len(df)
            if method == "Keep First":
                df = df.drop_duplicates(keep="first")
                python_code = "df = df.drop_duplicates(keep='first')"
            elif method == "Keep Last":
                df = df.drop_duplicates(keep="last")
                python_code = "df = df.drop_duplicates(keep='last')"
            else:  # Drop All
                df = df.drop_duplicates(keep=False)
                python_code = "df = df.drop_duplicates(keep=False)"
            after = len(df)
            action_desc = f"Removed {before - after} duplicate rows ({method})."

        # 2. IMPUTE NULLS
        elif operation_id.startswith("impute_nulls_"):
            if method == "Impute with Median":
                median_val = df[column].median()
                if pd.isna(median_val):
                    median_val = 0
                df[column] = df[column].fillna(median_val)
                # Format string to represent value clearly
                python_code = f"df['{column}'] = df['{column}'].fillna(df['{column}'].median())"
                action_desc = f"Imputed nulls in column '{column}' using median ({median_val})."
            elif method == "Impute with Mean":
                mean_val = df[column].mean()
                if pd.isna(mean_val):
                    mean_val = 0
                df[column] = df[column].fillna(mean_val)
                python_code = f"df['{column}'] = df['{column}'].fillna(df['{column}'].mean())"
                action_desc = f"Imputed nulls in column '{column}' using mean ({mean_val:.2f})."
            elif method == "Impute with KNN":
                imputer = KNNImputer(n_neighbors=5)
                num_cols = df.select_dtypes(include=[np.number]).columns
                if column in num_cols:
                    df[num_cols] = imputer.fit_transform(df[num_cols])
                    python_code = f"from sklearn.impute import KNNImputer\nnum_cols = df.select_dtypes(include=[np.number]).columns\nimputer = KNNImputer(n_neighbors=5)\ndf[num_cols] = imputer.fit_transform(df[num_cols])"
                    action_desc = f"Imputed nulls in numeric columns (including '{column}') using KNN Imputer."
                else:
                    raise ValueError(f"KNN Imputation requires numeric data. '{column}' is not numeric.")
            elif method == "Impute with MICE (Iterative)":
                imputer = IterativeImputer(random_state=42)
                num_cols = df.select_dtypes(include=[np.number]).columns
                if column in num_cols:
                    df[num_cols] = imputer.fit_transform(df[num_cols])
                    python_code = f"from sklearn.experimental import enable_iterative_imputer\nfrom sklearn.impute import IterativeImputer\nnum_cols = df.select_dtypes(include=[np.number]).columns\nimputer = IterativeImputer(random_state=42)\ndf[num_cols] = imputer.fit_transform(df[num_cols])"
                    action_desc = f"Imputed nulls in numeric columns (including '{column}') using MICE (IterativeImputer)."
                else:
                    raise ValueError(f"MICE requires numeric data. '{column}' is not numeric.")
            elif method == "Fill with Constant (0 or 'Unknown')":
                fill_val = 0 if pd.api.types.is_numeric_dtype(df[column]) else "Unknown"
                df[column] = df[column].fillna(fill_val)
                python_code = f"df['{column}'] = df['{column}'].fillna({repr(fill_val)})"
                action_desc = f"Filled nulls in column '{column}' with constant: {fill_val}."
            elif method == "Drop Rows with Nulls":
                before = len(df)
                df = df.dropna(subset=[column])
                python_code = f"df = df.dropna(subset=['{column}'])"
                after = len(df)
                action_desc = f"Dropped {before - after} rows with nulls in column '{column}'."

        # 3. CONVERT DATE
        elif operation_id.startswith("convert_date_"):
            if method == "Convert to Datetime":
                df[column] = pd.to_datetime(df[column], errors="coerce")
                python_code = f"df['{column}'] = pd.to_datetime(df['{column}'], errors='coerce')"
                action_desc = f"Converted column '{column}' to datetime representation."

        # 4. OUTLIERS
        elif operation_id.startswith("handle_outliers_"):
            if method == "Cap at 99th Percentile":
                q_cap = df[column].quantile(0.99)
                df[column] = df[column].clip(upper=q_cap)
                python_code = f"df['{column}'] = df['{column}'].clip(upper=df['{column}'].quantile(0.99))"
                action_desc = f"Capped outlier values in '{column}' at 99th percentile ({q_cap})."
            elif method == "Remove Rows Outside IQR":
                before = len(df)
                q1 = df[column].quantile(0.25)
                q3 = df[column].quantile(0.75)
                iqr = q3 - q1
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                df = df[(df[column] >= lower) & (df[column] <= upper)]
                python_code = f"q1 = df['{column}'].quantile(0.25)\n" \
                              f"q3 = df['{column}'].quantile(0.75)\n" \
                              f"iqr = q3 - q1\n" \
                              f"df = df[(df['{column}'] >= q1 - 1.5 * iqr) & (df['{column}'] <= q3 + 1.5 * iqr)]"
                after = len(df)
                action_desc = f"Removed {before - after} rows containing outliers in '{column}' based on IQR."

            elif method == "Isolation Forest (Multi-dimensional)":
                iso = IsolationForest(contamination=0.05, random_state=42)
                num_cols = df.select_dtypes(include=[np.number]).columns
                if column in num_cols:
                    preds = iso.fit_predict(df[num_cols].fillna(0))
                    before = len(df)
                    df = df[preds == 1]
                    after = len(df)
                    python_code = f"from sklearn.ensemble import IsolationForest\nnum_cols = df.select_dtypes(include=[np.number]).columns\niso = IsolationForest(contamination=0.05, random_state=42)\npreds = iso.fit_predict(df[num_cols].fillna(0))\ndf = df[preds == 1]"
                    action_desc = f"Removed {before - after} outlier rows across numeric dimensions using Isolation Forest."
                else:
                    raise ValueError(f"Isolation Forest requires numeric data. '{column}' is not numeric.")
            elif method == "Local Outlier Factor (LOF)":
                lof = LocalOutlierFactor(contamination=0.05)
                num_cols = df.select_dtypes(include=[np.number]).columns
                if column in num_cols:
                    preds = lof.fit_predict(df[num_cols].fillna(0))
                    before = len(df)
                    df = df[preds == 1]
                    after = len(df)
                    python_code = f"from sklearn.neighbors import LocalOutlierFactor\nnum_cols = df.select_dtypes(include=[np.number]).columns\nlof = LocalOutlierFactor(contamination=0.05)\npreds = lof.fit_predict(df[num_cols].fillna(0))\ndf = df[preds == 1]"
                    action_desc = f"Removed {before - after} outlier rows across numeric dimensions using LOF."
                else:
                    raise ValueError(f"LOF requires numeric data. '{column}' is not numeric.")
            elif method == "Median Absolute Deviation (MAD)":
                median = df[column].median()
                mad = (df[column] - median).abs().median()
                if mad == 0:
                    action_desc = f"Skipped MAD for '{column}' because MAD is 0."
                    python_code = "# Skipped MAD due to MAD=0"
                else:
                    lower = median - 3 * mad
                    upper = median + 3 * mad
                    before = len(df)
                    df = df[(df[column] >= lower) & (df[column] <= upper)]
                    after = len(df)
                    python_code = f"median = df['{column}'].median()\nmad = (df['{column}'] - median).abs().median()\ndf = df[(df['{column}'] >= median - 3 * mad) & (df['{column}'] <= median + 3 * mad)]"
                    action_desc = f"Removed {before - after} rows containing outliers in '{column}' based on robust MAD."

        # 5. STANDARDIZE HEADERS
        elif operation_id == "standardize_names":
            if method == "Convert to snake_case":
                new_cols = []
                for c in df.columns:
                    c_clean = str(c).strip().lower()
                    c_clean = re.sub(r'[\s\-]+', '_', c_clean)
                    c_clean = re.sub(r'[^a-z0-9_]', '', c_clean)
                    new_cols.append(c_clean)
                df.columns = new_cols
                python_code = "df.columns = [re.sub(r'[^a-z0-9_]', '', re.sub(r'[\\s\\-]+', '_', str(c).strip().lower())) for c in df.columns]"
                action_desc = "Standardized column headers to snake_case."

        # 6. CALCULATED FIELD
        elif operation_id == "create_calculated_field":
            expr = method.strip()
            # Simple expression safety parsing
            if not re.match(r'^[a-zA-Z0-9_\s\+\-\*\/\.\(\)]+$', expr):
                raise ValueError("Invalid calculation expression. Only arithmetic operations are allowed.")
            
            # Evaluate using pandas df.eval
            eval_expr = f"{column} = {expr}"
            df = df.eval(eval_expr)
            python_code = f"df['{column}'] = df.eval('{expr}')"
            action_desc = f"Calculated custom column '{column}' = {expr}."

        # 7. ENCODING
        elif operation_id.startswith("encode_categorical_"):
            if method == "One-Hot Encoding":
                df = pd.get_dummies(df, columns=[column], dummy_na=False)
                # Convert boolean columns to int
                for col_name in df.columns:
                    if str(df[col_name].dtype) == "bool":
                        df[col_name] = df[col_name].astype(int)
                python_code = f"df = pd.get_dummies(df, columns=['{column}'], dummy_na=False)\nfor c in df.columns:\n    if str(df[c].dtype) == 'bool':\n        df[c] = df[c].astype(int)"
                action_desc = f"Applied One-Hot Encoding to categorical column '{column}'."
            elif method == "Label Encoding":
                df[column] = df[column].astype("category").cat.codes
                python_code = f"df['{column}'] = df['{column}'].astype('category').cat.codes"
                action_desc = f"Applied Label Encoding to categorical column '{column}'."

        # 8. SCALING
        elif operation_id.startswith("scale_numeric_"):
            if method == "Z-Score Normalization":
                mean_val = df[column].mean()
                std_val = df[column].std()
                if std_val > 0:
                    df[column] = (df[column] - mean_val) / std_val
                    python_code = f"df['{column}'] = (df['{column}'] - df['{column}'].mean()) / df['{column}'].std()"
                    action_desc = f"Applied Z-Score Normalization to '{column}'."
                else:
                    action_desc = f"Skipped Z-Score Normalization on '{column}' due to 0 standard deviation."
            elif method == "Min-Max Scaling":
                min_val = df[column].min()
                max_val = df[column].max()
                if max_val > min_val:
                    df[column] = (df[column] - min_val) / (max_val - min_val)
                    python_code = f"df['{column}'] = (df['{column}'] - df['{column}'].min()) / (df['{column}'].max() - df['{column}'].min())"
                    action_desc = f"Applied Min-Max Scaling to '{column}'."
                else:
                    action_desc = f"Skipped Min-Max Scaling on '{column}' due to zero range."

        # 9. DATATYPE CONVERSION
        elif operation_id.startswith("convert_datatype_"):
            if method == "Convert to Numeric":
                df[column] = pd.to_numeric(df[column], errors="coerce")
                python_code = f"df['{column}'] = pd.to_numeric(df['{column}'], errors='coerce')"
                action_desc = f"Converted column '{column}' to Numeric."
            elif method == "Convert to String":
                df[column] = df[column].astype(str)
                python_code = f"df['{column}'] = df['{column}'].astype(str)"
                action_desc = f"Converted column '{column}' to String representation."
            elif method == "Convert to Category":
                df[column] = df[column].astype("category")
                python_code = f"df['{column}'] = df['{column}'].astype('category')"
                action_desc = f"Converted column '{column}' to Category type."
            elif method == "Convert to Boolean":
                df[column] = df[column].astype(bool)
                python_code = f"df['{column}'] = df['{column}'].astype(bool)"
                action_desc = f"Converted column '{column}' to Boolean."

        # 10. RENAME COLUMN
        elif operation_id.startswith("rename_column_"):
            new_name = method.strip()
            if not new_name:
                raise ValueError("New column name cannot be empty.")
            if new_name in df.columns:
                raise ValueError(f"Column '{new_name}' already exists.")
            df = df.rename(columns={column: new_name})
            python_code = f"df = df.rename(columns={{'{column}': '{new_name}'}})"
            action_desc = f"Renamed column '{column}' to '{new_name}'."

        # 11. STANDARDIZE TEXT
        elif operation_id.startswith("standardize_text_"):
            if method == "Convert to lowercase":
                df[column] = df[column].astype(str).str.lower()
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.lower()"
                action_desc = f"Converted text in '{column}' to lowercase."
            elif method == "Convert to UPPERCASE":
                df[column] = df[column].astype(str).str.upper()
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.upper()"
                action_desc = f"Converted text in '{column}' to UPPERCASE."
            elif method == "Convert to Title Case":
                df[column] = df[column].astype(str).str.title()
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.title()"
                action_desc = f"Converted text in '{column}' to Title Case."
            elif method == "Strip Whitespace":
                df[column] = df[column].astype(str).str.strip()
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.strip()"
                action_desc = f"Stripped leading/trailing whitespace from '{column}'."

        # 12. REMOVE EXTRA SPACES
        elif operation_id.startswith("remove_spaces_"):
            if method == "Strip Leading/Trailing":
                df[column] = df[column].astype(str).str.strip()
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.strip()"
                action_desc = f"Stripped leading/trailing spaces from '{column}'."
            elif method == "Collapse Multiple Spaces":
                df[column] = df[column].astype(str).str.replace(r'\s+', ' ', regex=True).str.strip()
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.replace(r'\\s+', ' ', regex=True).str.strip()"
                action_desc = f"Collapsed multiple spaces into single spaces in '{column}'."
            elif method == "Remove All Spaces":
                df[column] = df[column].astype(str).str.replace(r'\s+', '', regex=True)
                python_code = f"df['{column}'] = df['{column}'].astype(str).str.replace(r'\\s+', '', regex=True)"
                action_desc = f"Removed all spaces from '{column}'."

        # 13. VALIDATE DATA RANGE
        elif operation_id.startswith("validate_range_"):
            # method format: "min_val,max_val" or technique name
            if method == "Remove Negative Values":
                before = len(df)
                df = df[df[column] >= 0]
                python_code = f"df = df[df['{column}'] >= 0]"
                after = len(df)
                action_desc = f"Removed {before - after} rows with negative values in '{column}'."
            elif method == "Remove Zero Values":
                before = len(df)
                df = df[df[column] != 0]
                python_code = f"df = df[df['{column}'] != 0]"
                after = len(df)
                action_desc = f"Removed {before - after} rows with zero values in '{column}'."
            elif method.startswith("cap_range:"):
                parts = method.split(":")[1].split(",")
                min_v, max_v = float(parts[0]), float(parts[1])
                df[column] = df[column].clip(lower=min_v, upper=max_v)
                python_code = f"df['{column}'] = df['{column}'].clip(lower={min_v}, upper={max_v})"
                action_desc = f"Capped values in '{column}' to range [{min_v}, {max_v}]."
            elif method.startswith("remove_range:"):
                parts = method.split(":")[1].split(",")
                min_v, max_v = float(parts[0]), float(parts[1])
                before = len(df)
                df = df[(df[column] >= min_v) & (df[column] <= max_v)]
                python_code = f"df = df[(df['{column}'] >= {min_v}) & (df['{column}'] <= {max_v})]"
                after = len(df)
                action_desc = f"Removed {before - after} rows outside range [{min_v}, {max_v}] in '{column}'."

        # 14. DROP COLUMN
        elif operation_id.startswith("drop_column_"):
            if column not in df.columns:
                raise ValueError(f"Column '{column}' does not exist.")
            df = df.drop(columns=[column])
            python_code = f"df = df.drop(columns=['{column}'])"
            action_desc = f"Removed column '{column}' from dataset."

        # 15. FIX INCONSISTENT VALUES (replace old value with new)
        elif operation_id.startswith("fix_inconsistent_"):
            # method format: "old_value>>>new_value"
            if ">>>" in method:
                parts = method.split(">>>")
                old_val = parts[0]
                new_val = parts[1]
                df[column] = df[column].astype(str).replace(old_val, new_val)
                python_code = f"df['{column}'] = df['{column}'].astype(str).replace('{old_val}', '{new_val}')"
                action_desc = f"Replaced '{old_val}' with '{new_val}' in column '{column}'."
            else:
                raise ValueError("Use format: old_value>>>new_value")

        # 16. HANDLE INVALID VALUES
        elif operation_id.startswith("handle_invalid_"):
            if method == "Replace with NaN":
                if pd.api.types.is_numeric_dtype(df[column]):
                    df.loc[df[column] < 0, column] = np.nan
                    python_code = f"df.loc[df['{column}'] < 0, '{column}'] = np.nan"
                    action_desc = f"Replaced negative values in '{column}' with NaN."
                else:
                    df[column] = df[column].replace(r'^\s*$', np.nan, regex=True)
                    python_code = f"df['{column}'] = df['{column}'].replace(r'^\\s*$', np.nan, regex=True)"
                    action_desc = f"Replaced empty/whitespace-only values in '{column}' with NaN."
            elif method == "Remove Negative Values":
                before = len(df)
                df = df[df[column] >= 0]
                python_code = f"df = df[df['{column}'] >= 0]"
                after = len(df)
                action_desc = f"Removed {before - after} rows with negative values in '{column}'."
            elif method == "Remove Future Dates":
                df[column] = pd.to_datetime(df[column], errors="coerce")
                before = len(df)
                df = df[df[column] <= pd.Timestamp.now()]
                python_code = f"df['{column}'] = pd.to_datetime(df['{column}'], errors='coerce')\ndf = df[df['{column}'] <= pd.Timestamp.now()]"
                after = len(df)
                action_desc = f"Removed {before - after} rows with future dates in '{column}'."

        # 17. CROSS-VALIDATE RECORDS
        elif operation_id.startswith("cross_validate_"):
            # method format: "operator:other_column" e.g. "<=:end_date"
            if ":" in method:
                parts = method.split(":", 1)
                operator = parts[0]
                other_col = parts[1]
                if other_col not in df.columns:
                    raise ValueError(f"Column '{other_col}' does not exist.")
                before = len(df)
                if operator == "<=":
                    df = df[df[column] <= df[other_col]]
                    python_code = f"df = df[df['{column}'] <= df['{other_col}']]"
                elif operator == ">=":
                    df = df[df[column] >= df[other_col]]
                    python_code = f"df = df[df['{column}'] >= df['{other_col}']]"
                elif operator == "<":
                    df = df[df[column] < df[other_col]]
                    python_code = f"df = df[df['{column}'] < df['{other_col}']]"
                elif operator == ">":
                    df = df[df[column] > df[other_col]]
                    python_code = f"df = df[df['{column}'] > df['{other_col}']]"
                elif operator == "==":
                    df = df[df[column] == df[other_col]]
                    python_code = f"df = df[df['{column}'] == df['{other_col}']]"
                elif operator == "!=":
                    df = df[df[column] != df[other_col]]
                    python_code = f"df = df[df['{column}'] != df['{other_col}']]"
                else:
                    raise ValueError(f"Unsupported operator: {operator}")
                after = len(df)
                action_desc = f"Removed {before - after} rows where '{column}' is NOT {operator} '{other_col}'."
            else:
                raise ValueError("Use format: operator:other_column (e.g. <=:end_date)")

        # 18. FORWARD/BACKWARD FILL + MODE IMPUTATION
        elif operation_id.startswith("fill_method_"):
            if method == "Forward Fill (ffill)":
                df[column] = df[column].ffill()
                python_code = f"df['{column}'] = df['{column}'].ffill()"
                action_desc = f"Applied forward fill to '{column}'."
            elif method == "Backward Fill (bfill)":
                df[column] = df[column].bfill()
                python_code = f"df['{column}'] = df['{column}'].bfill()"
                action_desc = f"Applied backward fill to '{column}'."
            elif method == "Impute with Mode":
                mode_val = df[column].mode()
                if not mode_val.empty:
                    df[column] = df[column].fillna(mode_val[0])
                    python_code = f"df['{column}'] = df['{column}'].fillna(df['{column}'].mode()[0])"
                    action_desc = f"Imputed nulls in '{column}' with mode ({mode_val[0]})."
                else:
                    action_desc = f"Skipped mode imputation on '{column}' — no mode found."
            elif method == "Interpolate (Linear)":
                df[column] = df[column].interpolate(method="linear")
                python_code = f"df['{column}'] = df['{column}'].interpolate(method='linear')"
                action_desc = f"Applied linear interpolation to '{column}'."

        # 19. TEMPORAL FEATURES
        elif operation_id.startswith("temporal_features_"):
            if not pd.api.types.is_datetime64_any_dtype(df[column]):
                df[column] = pd.to_datetime(df[column], errors="coerce")
            
            if method == "Extract Month":
                new_col = f"{column}_month"
                df[new_col] = df[column].dt.month
                python_code = f"df['{new_col}'] = pd.to_datetime(df['{column}'], errors='coerce').dt.month"
                action_desc = f"Extracted month from '{column}' into '{new_col}'."
            elif method == "Extract Day of Week":
                new_col = f"{column}_dayofweek"
                df[new_col] = df[column].dt.day_name()
                python_code = f"df['{new_col}'] = pd.to_datetime(df['{column}'], errors='coerce').dt.day_name()"
                action_desc = f"Extracted day of week from '{column}' into '{new_col}'."
            elif method == "Extract Holiday Flag":
                new_col = f"{column}_is_holiday"
                us_holidays = holidays.US()
                df[new_col] = df[column].apply(lambda x: 1 if x in us_holidays else 0)
                python_code = f"import holidays\nus_holidays = holidays.US()\ndf['{new_col}'] = pd.to_datetime(df['{column}'], errors='coerce').apply(lambda x: 1 if x in us_holidays else 0)"
                action_desc = f"Extracted US holiday flag from '{column}' into '{new_col}'."
            elif method == "Cyclical Sine/Cosine Transform":
                month_col = df[column].dt.month
                df[f"{column}_month_sin"] = np.sin(2 * np.pi * month_col / 12)
                df[f"{column}_month_cos"] = np.cos(2 * np.pi * month_col / 12)
                python_code = f"month_col = pd.to_datetime(df['{column}'], errors='coerce').dt.month\ndf['{column}_month_sin'] = np.sin(2 * np.pi * month_col / 12)\ndf['{column}_month_cos'] = np.cos(2 * np.pi * month_col / 12)"
                action_desc = f"Applied cyclical Sine/Cosine transformation on '{column}' (assumed monthly periodicity)."

        # 20. CLASS IMBALANCE
        elif operation_id.startswith("class_imbalance_"):
            target = df[column].dropna()
            feature_cols = df.select_dtypes(include=[np.number]).columns.drop(column, errors='ignore')
            if len(feature_cols) == 0:
                raise ValueError("No numeric feature columns available to resample.")
            
            if method == "SMOTE Oversampling":
                X = df[feature_cols].fillna(0)
                y = df[column]
                valid_idx = y.notna()
                X = X[valid_idx]
                y = y[valid_idx]
                
                smote = SMOTE(random_state=42)
                X_res, y_res = smote.fit_resample(X, y)
                
                before = len(df)
                df = pd.concat([X_res, y_res], axis=1)
                after = len(df)
                
                python_code = f"from imblearn.over_sampling import SMOTE\nvalid_idx = df['{column}'].notna()\nX = df.select_dtypes(include=[np.number]).drop(columns=['{column}'], errors='ignore').fillna(0)[valid_idx]\ny = df['{column}'][valid_idx]\nsmote = SMOTE(random_state=42)\nX_res, y_res = smote.fit_resample(X, y)\ndf = pd.concat([X_res, y_res], axis=1)"
                action_desc = f"Applied SMOTE Oversampling based on target '{column}'. Increased rows from {before} to {after} (Note: non-numeric features were dropped)."
            
            elif method == "Random Undersampling":
                X = df[feature_cols].fillna(0)
                y = df[column]
                valid_idx = y.notna()
                X = X[valid_idx]
                y = y[valid_idx]
                
                rus = RandomUnderSampler(random_state=42)
                X_res, y_res = rus.fit_resample(X, y)
                
                before = len(df)
                df = pd.concat([X_res, y_res], axis=1)
                after = len(df)
                
                python_code = f"from imblearn.under_sampling import RandomUnderSampler\nvalid_idx = df['{column}'].notna()\nX = df.select_dtypes(include=[np.number]).drop(columns=['{column}'], errors='ignore').fillna(0)[valid_idx]\ny = df['{column}'][valid_idx]\nrus = RandomUnderSampler(random_state=42)\nX_res, y_res = rus.fit_resample(X, y)\ndf = pd.concat([X_res, y_res], axis=1)"
                action_desc = f"Applied Random Undersampling based on target '{column}'. Decreased rows from {before} to {after} (Note: non-numeric features were dropped)."

        # Save to history if we did something
        if action_desc:
            self.history.append({
                "operation_id": operation_id,
                "column": column,
                "method": method,
                "description": action_desc,
                "code": python_code,
                "state_snapshot": self.current_df.copy() # Store copy for undo
            })
            self.current_df = df

        return self.get_summary()

    def undo_last_step(self) -> Dict[str, Any]:
        """Reverts the last applied cleaning action."""
        if not self.history:
            return self.get_summary()

        last_op = self.history.pop()
        self.current_df = last_op["state_snapshot"]
        return self.get_summary()

    def revert_to_step(self, step_index: int) -> Dict[str, Any]:
        """Reverts the dataframe to a specific point in history (time travel)."""
        if step_index < 0 or step_index >= len(self.history):
            raise ValueError(f"Invalid history step index: {step_index}")
        
        # Load the snapshot of the step we are reverting to
        self.current_df = self.history[step_index]["state_snapshot"].copy()
        
        # Truncate history up to that step
        self.history = self.history[:step_index]
        return self.get_summary()
        
    def preview_cleaning(self, operation_id: str, column: str, method: str) -> Dict[str, Any]:
        """Temporarily applies an operation to generate a diff/preview, without saving state."""
        if self.current_df is None:
            raise ValueError("No active dataset to preview")

        original_df = self.current_df.copy()
        original_history = self.history.copy()
        
        try:
            # Temporarily apply cleaning
            summary = self.apply_cleaning(operation_id, column, method)
            
            # Extract diff
            preview = {
                "before_rows": len(original_df),
                "after_rows": summary["row_count"],
                "before_cols": len(original_df.columns),
                "after_cols": summary["column_count"],
                "sample_data": summary["preview"]
            }
            return preview
        finally:
            # Rollback instantly
            self.current_df = original_df
            self.history = original_history

    def get_reproducible_code(self) -> str:
        """Returns executable Python Pandas script that replicates all cleaning history steps."""
        code_steps = []
        for idx, item in enumerate(self.history, 1):
            code_steps.append(f"# Step {idx}: {item['description']}\n{item['code']}\n")

        joined_steps = "\n".join(code_steps)
        
        script = f"""# ==========================================
# VibeData - Automated Data Cleaning Script
# Generated for: {self.filename}
# ==========================================

import pandas as pd
import numpy as np
import re

def clean_data(file_path):
    print(f"Loading dataset: {{file_path}}")
    # Load dataset
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported format")

    print(f"Original shape: {{df.shape}}")

    # --- Applying Recorded Cleaning Operations ---

{self.indent_code(joined_steps, 4)}

    print(f"Cleaned shape: {{df.shape}}")
    return df

if __name__ == '__main__':
    # Adjust path to your dataset file
    cleaned_df = clean_data('{self.filename}')
    cleaned_df.to_csv('cleaned_{self.filename.split(".")[0]}.csv', index=False)
    print("Cleaned file saved successfully as: cleaned_{self.filename.split('.')[0]}.csv")
"""
        return script

    @staticmethod
    def indent_code(code_str: str, num_spaces: int) -> str:
        """Helper to indent block code for functions."""
        if not code_str:
            return "    # No cleaning operations were applied."
        indentation = " " * num_spaces
        lines = code_str.split("\n")
        indented_lines = [f"{indentation}{line}" if line.strip() else line for line in lines]
        return "\n".join(indented_lines)

    def get_cleaned_csv_bytes(self) -> bytes:
        """Serializes current dataframe state to CSV format bytes."""
        if self.current_df is None:
            return b""
        
        output = io.StringIO()
        self.current_df.to_csv(output, index=False)
        return output.getvalue().encode("utf-8")

    def get_correlation_matrix(self, method: str = "pearson") -> Dict[str, Any]:
        """Calculates correlation matrix. Supports pearson, spearman, and cramers_v."""
        if self.current_df is None:
            return {}
        
        if method in ["pearson", "spearman"]:
            numeric_df = self.current_df.select_dtypes(include=[np.number])
            if numeric_df.empty:
                return {"columns": [], "values": []}
            corr = numeric_df.corr(method=method).fillna(0)
            return {
                "columns": list(corr.columns),
                "values": corr.values.tolist()
            }
        elif method == "cramers_v":
            cat_cols = self.current_df.select_dtypes(exclude=[np.number, 'datetime64', 'datetime64[ns]']).columns
            if len(cat_cols) < 2:
                return {"columns": [], "values": []}
            
            # Subsample if too many rows for performance
            df_cat = self.current_df[cat_cols].fillna("Missing").astype(str)
            if len(df_cat) > 2000:
                df_cat = df_cat.sample(2000, random_state=42)
                
            n = len(cat_cols)
            corr_mat = np.zeros((n, n))
            
            for i in range(n):
                for j in range(i, n):
                    if i == j:
                        corr_mat[i, j] = 1.0
                    else:
                        confusion = pd.crosstab(df_cat.iloc[:, i], df_cat.iloc[:, j])
                        chi2 = stats.chi2_contingency(confusion)[0]
                        total = confusion.sum().sum()
                        if total == 0:
                            v = 0.0
                        else:
                            phi2 = chi2 / total
                            r, k = confusion.shape
                            if min(k-1, r-1) > 0:
                                v = np.sqrt(phi2 / min(k-1, r-1))
                            else:
                                v = 0.0
                        corr_mat[i, j] = round(v, 4)
                        corr_mat[j, i] = round(v, 4)
                        
            return {
                "columns": list(cat_cols),
                "values": corr_mat.tolist()
            }
        else:
            return {"columns": [], "values": []}

    def get_dimensionality_reduction(self, algorithm: str) -> List[Dict[str, Any]]:
        """Projects high dimensional data to 2D using PCA or t-SNE."""
        if self.current_df is None:
            return []
        
        num_df = self.current_df.select_dtypes(include=[np.number]).dropna()
        if num_df.empty or num_df.shape[1] < 2:
            return []
            
        # Sample to 1000 rows max to keep algorithms fast
        if len(num_df) > 1000:
            num_df = num_df.sample(1000, random_state=42)
            
        from sklearn.preprocessing import StandardScaler
        X_scaled = StandardScaler().fit_transform(num_df)
        
        if algorithm == "pca":
            from sklearn.decomposition import PCA
            model = PCA(n_components=2)
            transformed = model.fit_transform(X_scaled)
        elif algorithm == "tsne":
            from sklearn.manifold import TSNE
            perplexity = min(30, max(1, len(X_scaled) - 1))
            model = TSNE(n_components=2, perplexity=perplexity, random_state=42)
            transformed = model.fit_transform(X_scaled)
        else:
            return []
            
        result = []
        cat_cols = self.current_df.select_dtypes(exclude=[np.number, 'datetime64', 'datetime64[ns]']).columns
        labels = self.current_df.loc[num_df.index, cat_cols[0]] if len(cat_cols) > 0 else num_df.index
        
        for i, (x, y) in enumerate(transformed):
            result.append({
                "x": float(x),
                "y": float(y),
                "label": str(labels.iloc[i])
            })
            
        return result

    def get_pivot_table(self, index_col: str, columns_col: str, values_col: str, aggfunc: str) -> Dict[str, Any]:
        """Generates dynamic Pivot Table statistics."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
        
        try:
            # Map aggregation string functions
            func_map = {
                "sum": "sum",
                "mean": "mean",
                "count": "count",
                "min": "min",
                "max": "max"
            }
            fn = func_map.get(aggfunc.lower(), "mean")
            
            # Calculate dynamic pivot table
            pivot_df = self.current_df.pivot_table(
                index=index_col if index_col else None,
                columns=columns_col if columns_col else None,
                values=values_col if values_col else None,
                aggfunc=fn,
                fill_value=0
            )
            
            # Format row index names and columns
            rows = [str(r) for r in pivot_df.index]
            
            # Check dimensions
            if isinstance(pivot_df.columns, pd.MultiIndex):
                # Flatten multi-index if nested
                cols = [str(c) for c in pivot_df.columns.values]
            else:
                cols = [str(c) for c in pivot_df.columns]
                
            # Values matrix
            values_matrix = []
            for row_vals in pivot_df.values:
                # Convert numpy float arrays to serializable lists of floats
                values_matrix.append([float(val) if not pd.isna(val) else 0.0 for val in row_vals])
                
            return {
                "status": "success",
                "rows": rows,
                "columns": cols,
                "values": values_matrix,
                "aggfunc": fn,
                "index_name": index_col,
                "columns_name": columns_col,
                "values_name": values_col
            }
        except Exception as e:
            return {
                "status": "error",
                "message": str(e)
            }

    def get_distribution(self, column: str) -> Dict[str, Any]:
        """Calculates distribution histogram data for EDA."""
        if self.current_df is None or column not in self.current_df.columns:
            return {"status": "error", "message": "Invalid column or no dataset"}
        
        # Replace inf with nan and drop all nan values
        df_col = self.current_df[column].replace([np.inf, -np.inf], np.nan).dropna()
        if df_col.empty:
            return {"status": "error", "message": "Column is empty"}
            
        if pd.api.types.is_numeric_dtype(df_col):
            # Numeric distribution (Histogram)
            counts, bins = np.histogram(df_col, bins="auto")
            labels = [f"{bins[i]:.2f}-{bins[i+1]:.2f}" for i in range(len(bins)-1)]
            return {
                "type": "numeric",
                "labels": labels,
                "counts": counts.tolist()
            }
        else:
            # Categorical distribution
            val_counts = df_col.value_counts().head(15)
            return {
                "type": "categorical",
                "labels": val_counts.index.astype(str).tolist(),
                "counts": val_counts.values.tolist()
            }

    def get_time_series(self, date_col: str, val_col: str, aggfunc: str) -> Dict[str, Any]:
        """Calculates aggregated time series data."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            # Ensure we only work with valid dates and numeric values
            df_clean = self.current_df[[date_col, val_col]].copy()
            df_clean[date_col] = pd.to_datetime(df_clean[date_col], errors='coerce')
            df_clean = df_clean.dropna(subset=[date_col])
            
            if df_clean.empty:
                return {"status": "error", "message": "No valid date values found."}
                
            # Map aggregation string functions
            func_map = {
                "sum": "sum",
                "mean": "mean",
                "count": "count"
            }
            fn = func_map.get(aggfunc.lower(), "sum")
            
            # Aggregate by Date
            ts_df = df_clean.groupby(df_clean[date_col].dt.date)[val_col].agg(fn).reset_index()
            
            # Sort by date
            ts_df = ts_df.sort_values(by=date_col)
            
            # Format output
            points = []
            for _, row in ts_df.iterrows():
                points.append({
                    "date": str(row[date_col]),
                    "value": float(row[val_col]) if not pd.isna(row[val_col]) else 0.0
                })
                
            return {
                "status": "success",
                "date_col": date_col,
                "val_col": val_col,
                "aggfunc": fn,
                "points": points
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_anomalies(self, column: str) -> Dict[str, Any]:
        """Detects outliers using Z-Score > 3."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df = self.current_df.copy()
            
            if not pd.api.types.is_numeric_dtype(df[column]):
                return {"status": "error", "message": f"Column '{column}' is not numeric."}
                
            mean = df[column].mean()
            std = df[column].std()
            
            if std == 0 or pd.isna(std):
                return {"status": "error", "message": "Standard deviation is zero or NaN."}
                
            df["__z_score"] = abs((df[column] - mean) / std)
            anomalies = df[df["__z_score"] > 3].copy()
            anomalies = anomalies.sort_values(by="__z_score", ascending=False)
            
            count = len(anomalies)
            anomalies["_index"] = anomalies.index
            
            top_anomalies = anomalies.head(50).replace({np.nan: None})
            
            return {
                "status": "success",
                "count": count,
                "threshold": "> 3 Std Dev",
                "anomalies": top_anomalies.to_dict(orient="records")
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_ttest(self, group_col: str, value_col: str, group1: str, group2: str) -> Dict[str, Any]:
        """Performs Independent T-Test between two groups with diagnostic checks."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
        
        try:
            g1_data = self.current_df[self.current_df[group_col] == group1][value_col].dropna()
            g2_data = self.current_df[self.current_df[group_col] == group2][value_col].dropna()
            
            if len(g1_data) < 2 or len(g2_data) < 2:
                return {"status": "error", "message": "Not enough data for groups"}
                
            t_stat, p_val = stats.ttest_ind(g1_data, g2_data, equal_var=False)
            
            # Diagnostics: Shapiro-Wilk for normality
            g1_shapiro_p = stats.shapiro(g1_data)[1] if len(g1_data) >= 3 else 1.0
            g2_shapiro_p = stats.shapiro(g2_data)[1] if len(g2_data) >= 3 else 1.0
            
            # Diagnostics: Levene for equal variance
            levene_p = stats.levene(g1_data, g2_data)[1]
            
            # Non-Parametric Alternative: Mann-Whitney U
            mw_stat, mw_p_val = stats.mannwhitneyu(g1_data, g2_data)
            
            warnings = []
            if g1_shapiro_p < 0.05 or g2_shapiro_p < 0.05:
                warnings.append("Normality assumption violated (Shapiro-Wilk p < 0.05). Consider using Mann-Whitney U results.")
            if levene_p < 0.05:
                warnings.append("Equal variance assumption violated (Levene's p < 0.05).")
                
            return {
                "status": "success",
                "t_stat": float(t_stat),
                "p_value": float(p_val),
                "group1_mean": float(g1_data.mean()),
                "group2_mean": float(g2_data.mean()),
                "significant": bool(p_val < 0.05),
                "diagnostics": {
                    "shapiro_group1_p": float(g1_shapiro_p),
                    "shapiro_group2_p": float(g2_shapiro_p),
                    "levene_p": float(levene_p)
                },
                "non_parametric": {
                    "test_name": "Mann-Whitney U",
                    "statistic": float(mw_stat),
                    "p_value": float(mw_p_val),
                    "significant": bool(mw_p_val < 0.05)
                },
                "warnings": warnings
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_anova(self, group_col: str, value_col: str) -> Dict[str, Any]:
        """Performs One-Way ANOVA across multiple groups with diagnostics."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            groups = self.current_df[group_col].dropna().unique()
            if len(groups) < 2:
                return {"status": "error", "message": "Need at least 2 groups for ANOVA"}
                
            data_groups = [self.current_df[self.current_df[group_col] == g][value_col].dropna() for g in groups]
            
            # Filter out groups with < 2 elements
            data_groups = [g for g in data_groups if len(g) >= 2]
            
            if len(data_groups) < 2:
                return {"status": "error", "message": "Not enough data points in groups"}
            
            f_stat, p_val = stats.f_oneway(*data_groups)
            
            group_means = {str(g): float(d.mean()) for g, d in zip(groups, data_groups)}
            
            # Diagnostics: Shapiro-Wilk on residuals (approx: test each group)
            shapiro_ps = [stats.shapiro(g)[1] if len(g) >= 3 else 1.0 for g in data_groups]
            min_shapiro_p = min(shapiro_ps) if shapiro_ps else 1.0
            
            # Diagnostics: Levene's test
            levene_p = stats.levene(*data_groups)[1] if len(data_groups) >= 2 else 1.0
            
            # Non-Parametric Alternative: Kruskal-Wallis H-test
            kw_stat, kw_p_val = stats.kruskal(*data_groups)
            
            warnings = []
            if min_shapiro_p < 0.05:
                warnings.append("Normality assumption violated in at least one group (Shapiro-Wilk p < 0.05). Consider using Kruskal-Wallis results.")
            if levene_p < 0.05:
                warnings.append("Equal variance assumption violated (Levene's p < 0.05).")
            
            return {
                "status": "success",
                "f_stat": float(f_stat) if not np.isnan(f_stat) else 0.0,
                "p_value": float(p_val) if not np.isnan(p_val) else 1.0,
                "group_means": group_means,
                "significant": bool(p_val < 0.05),
                "diagnostics": {
                    "min_shapiro_p": float(min_shapiro_p),
                    "levene_p": float(levene_p)
                },
                "non_parametric": {
                    "test_name": "Kruskal-Wallis",
                    "statistic": float(kw_stat),
                    "p_value": float(kw_p_val),
                    "significant": bool(kw_p_val < 0.05)
                },
                "warnings": warnings
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_chi_square(self, col1: str, col2: str) -> Dict[str, Any]:
        """Performs Chi-Square Test of Independence for two categorical variables."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df_clean = self.current_df[[col1, col2]].dropna()
            if len(df_clean) < 5:
                return {"status": "error", "message": "Not enough valid data points for Chi-Square"}
                
            # Create contingency table
            contingency_table = pd.crosstab(df_clean[col1], df_clean[col2])
            
            # Perform Chi-Square test
            chi2, p_val, dof, expected = stats.chi2_contingency(contingency_table)
            
            # Format contingency table for JSON output
            table_dict = contingency_table.to_dict(orient="index")
            formatted_table = []
            for row_key, col_dict in table_dict.items():
                row = {col1: str(row_key)}
                row.update({str(k): int(v) for k, v in col_dict.items()})
                formatted_table.append(row)
                
            return {
                "status": "success",
                "chi2_stat": float(chi2),
                "p_value": float(p_val),
                "degrees_of_freedom": int(dof),
                "contingency_table": formatted_table,
                "col2_categories": [str(c) for c in contingency_table.columns],
                "significant": bool(p_val < 0.05)
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def train_linear_regression(self, x_cols: List[str], y_col: str, test_size: float = 0.2) -> Dict[str, Any]:
        """Performs Multivariate Linear Regression with Train/Test split."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df_clean = self.current_df[x_cols + [y_col]].dropna()
            if len(df_clean) < 10:
                return {"status": "error", "message": "Not enough valid data points for regression"}
                
            X = df_clean[x_cols].values
            y = df_clean[y_col].values
            
            from sklearn.model_selection import train_test_split
            from sklearn.linear_model import LinearRegression
            from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
            
            model = LinearRegression()
            model.fit(X_train, y_train)
            
            y_pred = model.predict(X_test)
            r2 = r2_score(y_test, y_pred)
            rmse = float(np.sqrt(mean_squared_error(y_test, y_pred)))
            mae = float(mean_absolute_error(y_test, y_pred))
            
            coefficients = {col: float(coef) for col, coef in zip(x_cols, model.coef_)}
            intercept = float(model.intercept_)
            
            # For visualization, we'll plot Actual vs Predicted on the test set
            sample_size = min(len(y_test), 100)
            sample_indices = np.random.choice(len(y_test), sample_size, replace=False)
            
            points = []
            for idx in sample_indices:
                points.append({
                    "actual": float(y_test[idx]),
                    "predicted": float(y_pred[idx])
                })
                
            points = sorted(points, key=lambda p: p["actual"])

            return {
                "status": "success",
                "r_squared": float(r2),
                "rmse": rmse,
                "mae": mae,
                "coefficients": coefficients,
                "intercept": intercept,
                "equation": f"y = " + " + ".join([f"{c:.4f}*{col}" for col, c in zip(x_cols, model.coef_)]) + f" + {intercept:.4f}",
                "points": points
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def train_logistic_regression(self, x_cols: List[str], y_col: str, test_size: float = 0.2) -> Dict[str, Any]:
        """Performs Multivariate Logistic Regression with validation."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df_clean = self.current_df[x_cols + [y_col]].dropna()
            if len(df_clean) < 10:
                return {"status": "error", "message": "Not enough valid data points for logistic regression"}
                
            y_unique = df_clean[y_col].unique()
            if len(y_unique) != 2:
                return {"status": "error", "message": f"Dependent variable '{y_col}' must be binary (exactly 2 unique values). Found {len(y_unique)}."}
                
            X = df_clean[x_cols].values
            y_mapping = {y_unique[0]: 0, y_unique[1]: 1}
            y = df_clean[y_col].map(y_mapping).values
            
            from sklearn.model_selection import train_test_split
            from sklearn.linear_model import LogisticRegression
            from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
            
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
            
            model = LogisticRegression()
            model.fit(X_train, y_train)
            
            y_pred = model.predict(X_test)
            y_prob = model.predict_proba(X_test)[:, 1]
            
            acc = accuracy_score(y_test, y_pred)
            prec = precision_score(y_test, y_pred, zero_division=0)
            rec = recall_score(y_test, y_pred, zero_division=0)
            f1 = f1_score(y_test, y_pred, zero_division=0)
            
            try:
                roc_auc = roc_auc_score(y_test, y_prob)
            except Exception:
                roc_auc = 0.5 # fallback if only one class in test set
            
            coefficients = {col: float(coef) for col, coef in zip(x_cols, model.coef_[0])}
            intercept = float(model.intercept_[0])
            
            # Simple ROC-like curve data (sorting by predicted probability)
            sorted_indices = np.argsort(y_prob)
            y_prob_sorted = y_prob[sorted_indices]
            
            step = max(1, len(y_prob_sorted) // 50)
            curve_points = []
            for i in range(0, len(y_prob_sorted), step):
                curve_points.append({
                    "sample_index": int(i),
                    "probability": float(y_prob_sorted[i])
                })
            
            return {
                "status": "success",
                "accuracy": float(acc),
                "precision": float(prec),
                "recall": float(rec),
                "f1_score": float(f1),
                "roc_auc": float(roc_auc),
                "coefficients": coefficients,
                "intercept": intercept,
                "class_mapping": {str(k): v for k, v in y_mapping.items()},
                "target_class": str(y_unique[1]),
                "curve": curve_points
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_feature_importance(self, target_col: str) -> Dict[str, Any]:
        """Calculates Feature Importance using Random Forest on numeric columns."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            # 1. Identify numeric columns
            numeric_cols = self.current_df.select_dtypes(include=[np.number]).columns.tolist()
            if target_col not in numeric_cols:
                return {"status": "error", "message": f"Target column '{target_col}' must be numeric."}
                
            features = [c for c in numeric_cols if c != target_col]
            if not features:
                return {"status": "error", "message": "No numeric feature columns available to predict the target."}
                
            # 2. Drop NaNs
            df_clean = self.current_df[features + [target_col]].dropna()
            if len(df_clean) < 10:
                return {"status": "error", "message": "Not enough valid data points after dropping NaNs."}
                
            X = df_clean[features].values
            y = df_clean[target_col].values
            
            # 3. Determine if Regression or Classification based on target uniqueness
            from sklearn.ensemble import RandomForestRegressor, RandomForestClassifier
            
            y_unique = len(np.unique(y))
            if y_unique <= 5: # Treat as classification if few unique values
                model = RandomForestClassifier(n_estimators=100, random_state=42)
            else:
                model = RandomForestRegressor(n_estimators=100, random_state=42)
                
            model.fit(X, y)
            
            # 4. Extract importances
            importances = model.feature_importances_
            
            # 5. Sort and format
            feature_imp_list = [{"feature": f, "importance": float(imp)} for f, imp in zip(features, importances)]
            feature_imp_list = sorted(feature_imp_list, key=lambda x: x["importance"], reverse=True)
            
            return {
                "status": "success",
                "model_type": "Classifier" if y_unique <= 5 else "Regressor",
                "importances": feature_imp_list
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def train_kmeans(self, features: List[str], k: int) -> Dict[str, Any]:
        """Performs Multivariate K-Means clustering and projects to 2D using PCA."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df_clean = self.current_df[features].dropna()
            if len(df_clean) < k:
                return {"status": "error", "message": "Not enough valid data points to form clusters."}
                
            X = df_clean.values
            
            from sklearn.cluster import KMeans
            from sklearn.decomposition import PCA
            
            kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
            labels = kmeans.fit_predict(X)
            
            # Project to 2D for visualization
            if len(features) > 2:
                pca = PCA(n_components=2)
                X_proj = pca.fit_transform(X)
                centroids_proj = pca.transform(kmeans.cluster_centers_)
                x_label = "PCA Component 1"
                y_label = "PCA Component 2"
            elif len(features) == 2:
                X_proj = X
                centroids_proj = kmeans.cluster_centers_
                x_label = features[0]
                y_label = features[1]
            else:
                return {"status": "error", "message": "K-Means requires at least 2 features."}
            
            sample_size = min(len(df_clean), 300)
            sample_indices = np.random.choice(len(df_clean), sample_size, replace=False)
            
            points = []
            for idx in sample_indices:
                points.append({
                    "x": float(X_proj[idx][0]),
                    "y": float(X_proj[idx][1]),
                    "cluster": int(labels[idx])
                })
                
            formatted_centroids = [{"x": float(c[0]), "y": float(c[1]), "cluster": i} for i, c in enumerate(centroids_proj)]
            
            return {
                "status": "success",
                "k": k,
                "x_label": x_label,
                "y_label": y_label,
                "centroids": formatted_centroids,
                "points": points
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_root_cause(self, metric_col: str, slice_col: str) -> Dict[str, Any]:
        """Calculates dimensional contribution to a metric's variance/total for RCA."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df = self.current_df[[metric_col, slice_col]].dropna()
            if df.empty:
                return {"status": "error", "message": "No valid data points available after dropping NaNs."}
                
            # Aggregate metric by slice
            grouped = df.groupby(slice_col)[metric_col].sum().reset_index()
            total_metric = df[metric_col].sum()
            
            if total_metric == 0:
                return {"status": "error", "message": f"Total sum of {metric_col} is zero, cannot calculate relative contributions."}
                
            # Calculate percentage contribution
            grouped["contribution_pct"] = (grouped[metric_col] / total_metric) * 100
            
            # Sort by absolute contribution to find the biggest drivers (positive or negative)
            grouped["abs_contribution"] = grouped["contribution_pct"].abs()
            grouped = grouped.sort_values(by="abs_contribution", ascending=False)
            
            # Format output
            drivers = []
            for _, row in grouped.iterrows():
                drivers.append({
                    "category": str(row[slice_col]),
                    "value": float(row[metric_col]),
                    "contribution_pct": float(row["contribution_pct"])
                })
                
            return {
                "status": "success",
                "metric_col": metric_col,
                "slice_col": slice_col,
                "total_value": float(total_metric),
                "drivers": drivers
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def execute_sql(self, sql_query: str) -> Dict[str, Any]:
        """Executes a SQL query on the active dataframe using an in-memory SQLite database."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
        
        try:
            conn = sqlite3.connect(":memory:")
            # Clean dataframe column names for SQLite safety
            safe_df = self.current_df.copy()
            safe_df.columns = [re.sub(r'[^a-zA-Z0-9_]', '_', str(c)) for c in safe_df.columns]
            
            # Load active data into SQLite memory
            safe_df.to_sql("active_data", conn, index=False)
            
            # Inject auxiliary dimension tables for multi-table JOIN support
            np.random.seed(42)
            n_dims = 50
            dim_customers = pd.DataFrame({
                "customer_id": [f"CUST-{100 + i}" for i in range(n_dims)],
                "region": [np.random.choice(["North America", "Europe", "Asia", "South America"]) for _ in range(n_dims)],
                "tier": [np.random.choice(["Gold", "Silver", "Bronze"]) for _ in range(n_dims)]
            })
            dim_customers.to_sql("dim_customers", conn, index=False)
            
            dim_products = pd.DataFrame({
                "product_sku": ["SKU-A", "SKU-B", "SKU-C", "SKU-D", "SKU-E"],
                "category": ["Electronics", "Clothing", "Home", "Electronics", "Home"],
                "unit_cost": [120.50, 25.00, 45.99, 899.99, 15.00]
            })
            dim_products.to_sql("dim_products", conn, index=False)
            
            # Execute query
            result_df = pd.read_sql_query(sql_query, conn)
            
            # Extract preview and columns
            columns = [{"name": str(col), "type": str(result_df[col].dtype)} for col in result_df.columns]
            preview = result_df.head(100).replace({np.nan: None}).to_dict(orient="records")
            
            conn.close()
            return {
                "status": "success",
                "columns": columns,
                "preview": preview,
                "row_count": len(result_df)
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_time_series(self, date_col: str, val_col: str, aggfunc: str) -> Dict[str, Any]:
        """Calculates time series aggregation for charting."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
        
        try:
            # Ensure we have date col
            df = self.current_df.copy()
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df = df.dropna(subset=[date_col])
            
            if df.empty:
                return {"status": "error", "message": "No valid dates found"}
                
            # Sort by date
            df = df.sort_values(by=date_col)
            
            # Group by date based on aggfunc
            func_map = {"sum": "sum", "mean": "mean", "count": "count", "min": "min", "max": "max"}
            fn = func_map.get(aggfunc.lower(), "sum")
            
            df['__plot_date'] = df[date_col].dt.date
            grouped = df.groupby('__plot_date')[val_col].agg(fn).reset_index()
            
            points = []
            for _, row in grouped.iterrows():
                points.append({
                    "date": str(row['__plot_date']),
                    "value": float(row[val_col]) if not pd.isna(row[val_col]) else 0.0
                })
                
            return {
                "status": "success",
                "points": points,
                "date_col": date_col,
                "val_col": val_col,
                "aggfunc": fn
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def get_anomalies(self, numeric_col: str) -> Dict[str, Any]:
        """Detects anomalies using Z-score."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df = self.current_df.copy()
            
            if not pd.api.types.is_numeric_dtype(df[numeric_col]):
                return {"status": "error", "message": "Selected column is not numeric"}
                
            # Calculate Z-Scores
            mean_val = df[numeric_col].mean()
            std_val = df[numeric_col].std()
            
            if pd.isna(std_val) or std_val == 0:
                return {"status": "error", "message": "Standard deviation is zero or NaN, cannot calculate Z-scores."}
                
            df['__z_score'] = (df[numeric_col] - mean_val) / std_val
            
            # Filter |z| > 3
            anomalies_df = df[df['__z_score'].abs() > 3].copy()
            
            # Sort by absolute z-score descending
            anomalies_df['__abs_z'] = anomalies_df['__z_score'].abs()
            anomalies_df = anomalies_df.sort_values(by='__abs_z', ascending=False).head(50)
            
            # Extract to dict
            records = []
            for idx, row in anomalies_df.iterrows():
                rec = row.drop(['__abs_z']).to_dict()
                rec['_index'] = idx
                
                # Clean up any NaN for JSON serialization
                for k, v in rec.items():
                    if pd.isna(v):
                        rec[k] = None
                        
                records.append(rec)
                
            return {
                "status": "success",
                "anomalies": records,
                "count": len(records),
                "threshold": "> 3 Std Dev"
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_forecast(self, date_col: str, val_col: str, periods: int, algorithm: str = "holt-winters") -> Dict[str, Any]:
        """Calculates a time-series forecast using Exponential Smoothing or ARIMA."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            from statsmodels.tsa.holtwinters import ExponentialSmoothing
            from statsmodels.tsa.arima.model import ARIMA
            import pandas as pd
            import numpy as np

            df = self.current_df.copy()
            df[date_col] = pd.to_datetime(df[date_col], errors="coerce")
            df = df.dropna(subset=[date_col, val_col])
            
            if df.empty:
                return {"status": "error", "message": "No valid dates or values found"}

            df = df.sort_values(by=date_col)
            ts_df = df.groupby(date_col)[val_col].mean().reset_index()
            ts_df = ts_df.set_index(date_col)
            
            y = ts_df[val_col].values
            
            if len(y) < 10:
                return {"status": "error", "message": "Not enough data points for forecasting (minimum 10)."}

            try:
                if algorithm == "arima":
                    model = ARIMA(y, order=(1, 1, 1))
                    fit_model = model.fit()
                    forecast = fit_model.forecast(steps=periods)
                else:
                    model = ExponentialSmoothing(y, trend="add", seasonal=None, initialization_method="estimated")
                    fit_model = model.fit()
                    forecast = fit_model.forecast(periods)
            except Exception:
                if algorithm == "arima":
                    model = ARIMA(y, order=(0, 0, 0)) # fallback
                    fit_model = model.fit()
                    forecast = fit_model.forecast(steps=periods)
                else:
                    model = ExponentialSmoothing(y, initialization_method="estimated")
                    fit_model = model.fit()
                    forecast = fit_model.forecast(periods)

            last_date = ts_df.index[-1]
            freq = pd.infer_freq(ts_df.index)
            if freq is None:
                freq = 'D'
            
            future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=periods, freq=freq)

            historical_points = []
            for date, val in ts_df.iterrows():
                historical_points.append({
                    "date": str(date.date()),
                    "actual": float(val[val_col]),
                    "forecast": None
                })
            
            forecast_points = []
            for date, val in zip(future_dates, forecast):
                forecast_points.append({
                    "date": str(date.date()),
                    "actual": None,
                    "forecast": float(val)
                })

            return {
                "status": "success",
                "historical": historical_points,
                "forecast": forecast_points,
                "date_col": date_col,
                "val_col": val_col,
                "periods": periods
            }

        except ImportError:
            return {"status": "error", "message": "statsmodels is not installed."}
        except Exception as e:
            return {"status": "error", "message": f"Forecasting failed: {str(e)}"}

    def calculate_sentiment(self, text_col: str) -> Dict[str, Any]:
        """Calculates sentiment polarity for a text column using TextBlob."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
        try:
            from textblob import TextBlob
            import pandas as pd

            df = self.current_df.copy()
            if text_col not in df.columns:
                return {"status": "error", "message": f"Column '{text_col}' not found"}

            text_data = df[text_col].dropna().astype(str)
            if text_data.empty:
                return {"status": "error", "message": "Column is empty or contains no valid text"}

            if len(text_data) > 1000:
                text_data = text_data.sample(1000, random_state=42)

            sentiments = []
            positive_words = []
            negative_words = []

            for text in text_data:
                blob = TextBlob(text)
                polarity = blob.sentiment.polarity
                
                words = [w.lower() for w in blob.words if len(w) > 3]
                
                if polarity > 0.1:
                    sentiments.append("Positive")
                    positive_words.extend(words)
                elif polarity < -0.1:
                    sentiments.append("Negative")
                    negative_words.extend(words)
                else:
                    sentiments.append("Neutral")

            dist = pd.Series(sentiments).value_counts()
            total = len(sentiments)

            distribution = []
            for sentiment, count in dist.items():
                distribution.append({
                    "sentiment": sentiment,
                    "count": int(count),
                    "percentage": round(int(count) / total * 100, 1)
                })

            from collections import Counter
            top_pos = [w[0] for w in Counter(positive_words).most_common(10)] if positive_words else []
            top_neg = [w[0] for w in Counter(negative_words).most_common(10)] if negative_words else []

            return {
                "status": "success",
                "text_col": text_col,
                "distribution": distribution,
                "top_positive_words": top_pos,
                "top_negative_words": top_neg,
                "sample_size": total
            }
        except ImportError:
            return {"status": "error", "message": "textblob is not installed."}
        except Exception as e:
            return {"status": "error", "message": f"Sentiment analysis failed: {str(e)}"}

    def calculate_kmeans_diagnostics(self, features: List[str]) -> Dict[str, Any]:
        """Calculates Inertia (Elbow Method) and Silhouette Scores for K-Means."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df_clean = self.current_df[features].dropna()
            if len(df_clean) < 15:
                return {"status": "error", "message": "Need at least 15 valid data points for diagnostics."}
                
            X = df_clean.values
            
            from sklearn.cluster import KMeans
            from sklearn.metrics import silhouette_score
            
            diagnostics = []
            max_k = min(10, len(X) - 1)
            
            for k in range(2, max_k + 1):
                kmeans = KMeans(n_clusters=k, random_state=42, n_init="auto")
                labels = kmeans.fit_predict(X)
                inertia = kmeans.inertia_
                
                # Silhouette score is expensive, sample if dataset is huge
                if len(X) > 5000:
                    sample_indices = np.random.choice(len(X), 5000, replace=False)
                    score = silhouette_score(X[sample_indices], labels[sample_indices])
                else:
                    score = silhouette_score(X, labels)
                    
                diagnostics.append({
                    "k": k,
                    "inertia": float(inertia),
                    "silhouette_score": float(score)
                })
                
            return {
                "status": "success",
                "diagnostics": diagnostics
            }
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def calculate_topic_modeling(self, text_col: str, n_topics: int = 5) -> Dict[str, Any]:
        """Extracts topics from a text column using TF-IDF and LDA."""
        if self.current_df is None:
            return {"status": "error", "message": "No active dataset"}
            
        try:
            df = self.current_df.copy()
            if text_col not in df.columns:
                return {"status": "error", "message": f"Column '{text_col}' not found"}
                
            text_data = df[text_col].dropna().astype(str)
            if text_data.empty:
                return {"status": "error", "message": "Column is empty or contains no valid text"}
                
            # Limit for performance
            if len(text_data) > 5000:
                text_data = text_data.sample(5000, random_state=42)
                
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.decomposition import LatentDirichletAllocation
            
            vectorizer = TfidfVectorizer(max_df=0.95, min_df=2, stop_words='english', max_features=1000)
            tfidf = vectorizer.fit_transform(text_data)
            
            lda = LatentDirichletAllocation(n_components=n_topics, random_state=42, max_iter=10)
            lda.fit(tfidf)
            
            feature_names = vectorizer.get_feature_names_out()
            
            topics = []
            for topic_idx, topic in enumerate(lda.components_):
                top_features_ind = topic.argsort()[:-10 - 1:-1]
                top_features = [feature_names[i] for i in top_features_ind]
                weights = [float(topic[i]) for i in top_features_ind]
                
                topics.append({
                    "topic_id": topic_idx + 1,
                    "words": [{"word": w, "weight": float(wt)} for w, wt in zip(top_features, weights)]
                })
                
            return {
                "status": "success",
                "text_col": text_col,
                "n_topics": n_topics,
                "topics": topics
            }
        except Exception as e:
            return {"status": "error", "message": f"Topic modeling failed: {str(e)}"}
