from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Response, Query
from fastapi.responses import StreamingResponse, FileResponse
import os
import tempfile
import nbformat
from nbformat.v4 import new_notebook, new_code_cell, new_markdown_cell
import joblib
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from services.ai_service import AIService
from services.data_service import DataService
from services.connection_service import ConnectionService
from services.audit_service import AuditService

router = APIRouter()
ai_service = AIService()
data_service = DataService()
connection_service = ConnectionService()
audit_service = AuditService()

# --- Schemas ---

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    newMessage: str

class LoginRequest(BaseModel):
    username: str
    password: str

class AuditRequest(BaseModel):
    action: str
    details: str

class ReportRequest(BaseModel):
    messages: List[Message]

class CleanApplyRequest(BaseModel):
    operation_id: str
    column: str
    method: str

class InsightRequest(BaseModel):
    query: str
    data_preview: Optional[Dict[str, Any]] = None

class CalculateFieldRequest(BaseModel):
    column: str
    expression: str

class PivotTableRequest(BaseModel):
    index_col: Optional[str] = None
    columns_col: Optional[str] = None
    values_col: str
    aggfunc: str

class TTestRequest(BaseModel):
    group_col: str
    value_col: str
    group1: str
    group2: str

class AnovaRequest(BaseModel):
    group_col: str
    value_col: str

class RegressionRequest(BaseModel):
    x_cols: List[str]
    y_col: str
    test_size: float = 0.2

class LogisticRegressionRequest(BaseModel):
    x_cols: List[str]
    y_col: str
    test_size: float = 0.2

class ChiSquareRequest(BaseModel):
    col1: str
    col2: str

class FeatureImportanceRequest(BaseModel):
    target_col: str

class KMeansRequest(BaseModel):
    features: List[str]
    k: int

class KMeansDiagnosticsRequest(BaseModel):
    features: List[str]

class RootCauseRequest(BaseModel):
    metric_col: str
    slice_col: str

class DimensionalityRequest(BaseModel):
    algorithm: str

class DashboardPromptRequest(BaseModel):
    prompt: str
    dataset_schema: str

class TimeSeriesRequest(BaseModel):
    date_col: str
    val_col: str
    aggfunc: str

class SQLGenerateRequest(BaseModel):
    query: str
    schema_metadata: dict

class SQLFixRequest(BaseModel):
    broken_query: str
    error_message: str
    schema_metadata: dict

class SQLExecuteRequest(BaseModel):
    query: str

class JoinRequest(BaseModel):
    join_type: str
    left_on: str
    right_on: str

class ForecastRequest(BaseModel):
    date_col: str
    val_col: str
    periods: int
    algorithm: str = "holt-winters"

class SentimentRequest(BaseModel):
    text_col: str

class TopicModelingRequest(BaseModel):
    text_col: str
    n_topics: int = 5

class GeminiKeyRequest(BaseModel):
    api_key: str

def update_env_file(key: str, value: str):
    env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
    lines = []
    replaced = False
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if line.strip().startswith(f"{key}="):
                    lines.append(f"{key}={value}\n")
                    replaced = True
                else:
                    lines.append(line)
    if not replaced:
        lines.append(f"{key}={value}\n")
    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

# --- Routes ---

@router.get("/status")
def get_status():
    return {"status": "ok", "service": "vibedata-api"}

@router.get("/settings/gemini")
def get_gemini_settings():
    key = os.environ.get("GEMINI_API_KEY", "")
    configured = bool(key)
    masked_key = ""
    if configured:
        masked_key = key[:7] + "..." + key[-4:] if len(key) > 11 else "configured"
    return {"configured": configured, "masked_key": masked_key}

@router.post("/settings/gemini")
def save_gemini_settings(payload: GeminiKeyRequest):
    key = payload.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    
    # Test key first
    success, err = AIService.test_api_key(key)
    if not success:
        raise HTTPException(status_code=400, detail=f"Failed to verify API key: {err}")
    
    # Save to .env
    update_env_file("GEMINI_API_KEY", key)
    # Dynamic configure
    ai_service.configure_api_key(key)
    
    audit_service.log_action("admin", "Update API Key", "Google Gemini API key was updated and verified")
    return {"status": "success", "message": "Gemini API key updated successfully."}

@router.post("/settings/gemini/test")
def test_gemini_settings(payload: GeminiKeyRequest):
    key = payload.api_key.strip()
    if not key:
        raise HTTPException(status_code=400, detail="API key cannot be empty")
    
    success, err = AIService.test_api_key(key)
    if success:
        return {"success": True}
    else:
        return {"success": False, "error": err}

@router.post("/auth/login")
def login(payload: LoginRequest):
    # Dummy authentication for MVP Enterprise Security
    if payload.username == "admin" and payload.password == "admin123":
        audit_service.log_action("admin", "User Login", "Successful authentication")
        return {"status": "success", "token": "mock-jwt-token-7382"}
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.get("/audit")
def get_audit_logs():
    return {"status": "success", "logs": audit_service.get_logs()}

@router.post("/audit")
def post_audit_log(payload: AuditRequest):
    audit_service.log_action("admin", payload.action, payload.details)
    return {"status": "success"}

@router.post("/chat")
def chat_discussion(payload: ChatRequest):
    try:
        history = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        response = ai_service.discuss_problem(history, payload.newMessage)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/report")
def generate_report(payload: ReportRequest):
    try:
        history = [{"role": msg.role, "content": msg.content} for msg in payload.messages]
        report_md = ai_service.generate_report(history)
        return {"report": report_md}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        content = await file.read()
        summary = data_service.load_data(content, file.filename)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/upload/demo/{dataset_name}")
def load_demo_dataset(dataset_name: str):
    try:
        summary = data_service.load_demo_dataset(dataset_name)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/join/upload")
async def upload_secondary_dataset(file: UploadFile = File(...)):
    try:
        content = await file.read()
        result = data_service.load_secondary_data(content, file.filename)
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/join/execute")
def execute_join(payload: JoinRequest):
    try:
        summary = data_service.execute_join(
            join_type=payload.join_type,
            left_on=payload.left_on,
            right_on=payload.right_on
        )
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/connect/mock_db")
def connect_mock_db():
    try:
        return data_service.load_mock_database()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/connect/mock_api")
def connect_mock_api():
    try:
        return data_service.load_mock_api()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/profile")
def get_profile():
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_summary()

@router.get("/clean/suggest")
def suggest_cleaning():
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    summary = data_service.get_summary()
    suggestions = ai_service.suggest_cleaning_steps(summary)
    return {"suggestions": suggestions}

@router.get("/clean/tasks")
def get_cleaning_tasks():
    """Returns all applicable cleaning task categories with techniques based on the loaded dataset."""
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    
    import pandas as pd
    df = data_service.current_df
    all_cols = list(df.columns)
    numeric_cols = df.select_dtypes(include=["number"]).columns.tolist()
    text_cols = df.select_dtypes(include=["object", "category"]).columns.tolist()
    datetime_cols = df.select_dtypes(include=["datetime", "datetime64"]).columns.tolist()
    
    # Columns with nulls
    null_cols = [c for c in all_cols if int(df[c].isna().sum()) > 0]
    null_info = {c: int(df[c].isna().sum()) for c in null_cols}
    
    dup_count = int(df.duplicated().sum())
    
    tasks = {
        "columns": all_cols,
        "numeric_cols": numeric_cols,
        "text_cols": text_cols,
        "datetime_cols": datetime_cols,
        "null_cols": null_cols,
        "null_info": null_info,
        "duplicate_count": dup_count,
        "row_count": len(df),
        "categories": [
            {
                "id": "missing_data",
                "title": "Handle Missing Values",
                "icon": "AlertTriangle",
                "description": "Fill or remove null values in columns",
                "applicable_cols": null_cols,
                "techniques": [
                    {"id": "impute_nulls_", "label": "Impute with Mean", "method": "Impute with Mean", "col_type": "numeric"},
                    {"id": "impute_nulls_", "label": "Impute with Median", "method": "Impute with Median", "col_type": "numeric"},
                    {"id": "fill_method_", "label": "Impute with Mode", "method": "Impute with Mode", "col_type": "any"},
                    {"id": "impute_nulls_", "label": "Impute with KNN", "method": "Impute with KNN", "col_type": "numeric"},
                    {"id": "impute_nulls_", "label": "Impute with MICE (Iterative)", "method": "Impute with MICE (Iterative)", "col_type": "numeric"},
                    {"id": "impute_nulls_", "label": "Fill with Constant (0 or 'Unknown')", "method": "Fill with Constant (0 or 'Unknown')", "col_type": "any"},
                    {"id": "fill_method_", "label": "Forward Fill (ffill)", "method": "Forward Fill (ffill)", "col_type": "any"},
                    {"id": "fill_method_", "label": "Backward Fill (bfill)", "method": "Backward Fill (bfill)", "col_type": "any"},
                    {"id": "fill_method_", "label": "Interpolate (Linear)", "method": "Interpolate (Linear)", "col_type": "numeric"},
                    {"id": "impute_nulls_", "label": "Drop Rows with Nulls", "method": "Drop Rows with Nulls", "col_type": "any"}
                ]
            },
            {
                "id": "duplicates",
                "title": "Remove Duplicate Rows",
                "icon": "Copy",
                "description": f"Found {dup_count} duplicate rows",
                "applicable_cols": ["__all__"],
                "techniques": [
                    {"id": "remove_duplicates", "label": "Keep First", "method": "Keep First", "col_type": "any"},
                    {"id": "remove_duplicates", "label": "Keep Last", "method": "Keep Last", "col_type": "any"},
                    {"id": "remove_duplicates", "label": "Drop All Duplicates", "method": "Drop All", "col_type": "any"}
                ]
            },
            {
                "id": "data_types",
                "title": "Fix Data Types",
                "icon": "Settings",
                "description": "Convert columns to the correct data type",
                "applicable_cols": all_cols,
                "techniques": [
                    {"id": "convert_datatype_", "label": "Convert to Numeric", "method": "Convert to Numeric", "col_type": "any"},
                    {"id": "convert_datatype_", "label": "Convert to String", "method": "Convert to String", "col_type": "any"},
                    {"id": "convert_datatype_", "label": "Convert to Category", "method": "Convert to Category", "col_type": "any"},
                    {"id": "convert_datatype_", "label": "Convert to Boolean", "method": "Convert to Boolean", "col_type": "any"},
                    {"id": "convert_date_", "label": "Convert to Datetime", "method": "Convert to Datetime", "col_type": "any"}
                ]
            },
            {
                "id": "rename_cols",
                "title": "Rename Columns",
                "icon": "Edit3",
                "description": "Make column names consistent and readable",
                "applicable_cols": all_cols,
                "techniques": [
                    {"id": "rename_column_", "label": "Rename to Custom Name", "method": "__input__", "col_type": "any", "input_label": "New Column Name"},
                    {"id": "standardize_names", "label": "Standardize All to snake_case", "method": "Convert to snake_case", "col_type": "any"}
                ]
            },
            {
                "id": "text_cleaning",
                "title": "Standardize Text",
                "icon": "Type",
                "description": "Ensure consistent text formatting across values",
                "applicable_cols": text_cols,
                "techniques": [
                    {"id": "standardize_text_", "label": "Convert to lowercase", "method": "Convert to lowercase", "col_type": "text"},
                    {"id": "standardize_text_", "label": "Convert to UPPERCASE", "method": "Convert to UPPERCASE", "col_type": "text"},
                    {"id": "standardize_text_", "label": "Convert to Title Case", "method": "Convert to Title Case", "col_type": "text"},
                    {"id": "standardize_text_", "label": "Strip Whitespace", "method": "Strip Whitespace", "col_type": "text"}
                ]
            },
            {
                "id": "remove_spaces",
                "title": "Remove Extra Spaces",
                "icon": "Scissors",
                "description": "Clean whitespace issues in text columns",
                "applicable_cols": text_cols,
                "techniques": [
                    {"id": "remove_spaces_", "label": "Strip Leading/Trailing", "method": "Strip Leading/Trailing", "col_type": "text"},
                    {"id": "remove_spaces_", "label": "Collapse Multiple Spaces", "method": "Collapse Multiple Spaces", "col_type": "text"},
                    {"id": "remove_spaces_", "label": "Remove All Spaces", "method": "Remove All Spaces", "col_type": "text"}
                ]
            },
            {
                "id": "outliers",
                "title": "Handle Outliers",
                "icon": "TrendingUp",
                "description": "Identify or remove extreme values using statistical methods",
                "applicable_cols": numeric_cols,
                "techniques": [
                    {"id": "handle_outliers_", "label": "Remove Rows Outside IQR", "method": "Remove Rows Outside IQR", "col_type": "numeric"},
                    {"id": "handle_outliers_", "label": "Cap at 99th Percentile", "method": "Cap at 99th Percentile", "col_type": "numeric"},
                    {"id": "handle_outliers_", "label": "Isolation Forest (Multi-dimensional)", "method": "Isolation Forest (Multi-dimensional)", "col_type": "numeric"},
                    {"id": "handle_outliers_", "label": "Local Outlier Factor (LOF)", "method": "Local Outlier Factor (LOF)", "col_type": "numeric"},
                    {"id": "handle_outliers_", "label": "Median Absolute Deviation (MAD)", "method": "Median Absolute Deviation (MAD)", "col_type": "numeric"}
                ]
            },
            {
                "id": "validate_range",
                "title": "Validate Data Ranges",
                "icon": "Shield",
                "description": "Ensure values are within realistic boundaries",
                "applicable_cols": numeric_cols,
                "techniques": [
                    {"id": "validate_range_", "label": "Remove Negative Values", "method": "Remove Negative Values", "col_type": "numeric"},
                    {"id": "validate_range_", "label": "Remove Zero Values", "method": "Remove Zero Values", "col_type": "numeric"},
                    {"id": "validate_range_", "label": "Cap to Custom Range", "method": "__range_input__", "col_type": "numeric", "input_label": "Min,Max"},
                    {"id": "validate_range_", "label": "Remove Outside Custom Range", "method": "__range_remove__", "col_type": "numeric", "input_label": "Min,Max"}
                ]
            },
            {
                "id": "format_dates",
                "title": "Format Dates",
                "icon": "Calendar",
                "description": "Convert columns to proper datetime format",
                "applicable_cols": all_cols,
                "techniques": [
                    {"id": "convert_date_", "label": "Convert to Datetime", "method": "Convert to Datetime", "col_type": "any"}
                ]
            },
            {
                "id": "drop_columns",
                "title": "Remove Columns",
                "icon": "Trash2",
                "description": "Drop unnecessary columns from the dataset",
                "applicable_cols": all_cols,
                "techniques": [
                    {"id": "drop_column_", "label": "Drop Selected Column", "method": "drop", "col_type": "any"}
                ]
            },
            {
                "id": "fix_inconsistent",
                "title": "Correct Inconsistent Values",
                "icon": "RefreshCw",
                "description": "Standardize categories (e.g. 'M', 'Male', 'male' → 'Male')",
                "applicable_cols": text_cols,
                "techniques": [
                    {"id": "fix_inconsistent_", "label": "Replace Value", "method": "__replace_input__", "col_type": "text", "input_label": "Old Value → New Value"}
                ]
            },
            {
                "id": "handle_invalid",
                "title": "Handle Invalid Values",
                "icon": "XOctagon",
                "description": "Replace or remove impossible values (negative ages, future dates, etc.)",
                "applicable_cols": all_cols,
                "techniques": [
                    {"id": "handle_invalid_", "label": "Replace with NaN", "method": "Replace with NaN", "col_type": "any"},
                    {"id": "handle_invalid_", "label": "Remove Negative Values", "method": "Remove Negative Values", "col_type": "numeric"},
                    {"id": "handle_invalid_", "label": "Remove Future Dates", "method": "Remove Future Dates", "col_type": "any"}
                ]
            },
            {
                "id": "cross_validate",
                "title": "Cross-Validate Records",
                "icon": "GitCompare",
                "description": "Check consistency between related columns (e.g. start_date ≤ end_date)",
                "applicable_cols": all_cols,
                "techniques": [
                    {"id": "cross_validate_", "label": "Column A ≤ Column B", "method": "__cross_input__", "col_type": "any", "operator": "<="},
                    {"id": "cross_validate_", "label": "Column A ≥ Column B", "method": "__cross_input__", "col_type": "any", "operator": ">="},
                    {"id": "cross_validate_", "label": "Column A ≠ Column B", "method": "__cross_input__", "col_type": "any", "operator": "!="}
                ]
            },
            {
                "id": "encoding",
                "title": "Encode Categorical Variables",
                "icon": "Hash",
                "description": "Convert categories to numeric representations for modeling",
                "applicable_cols": text_cols,
                "techniques": [
                    {"id": "encode_categorical_", "label": "One-Hot Encoding", "method": "One-Hot Encoding", "col_type": "text"},
                    {"id": "encode_categorical_", "label": "Label Encoding", "method": "Label Encoding", "col_type": "text"}
                ]
            },
            {
                "id": "scaling",
                "title": "Scale Numeric Features",
                "icon": "BarChart2",
                "description": "Normalize numeric columns for ML models",
                "applicable_cols": numeric_cols,
                "techniques": [
                    {"id": "scale_numeric_", "label": "Z-Score Normalization", "method": "Z-Score Normalization", "col_type": "numeric"},
                    {"id": "scale_numeric_", "label": "Min-Max Scaling", "method": "Min-Max Scaling", "col_type": "numeric"}
                ]
            },
            {
                "id": "temporal_features",
                "title": "Temporal Feature Engineering",
                "icon": "Calendar",
                "description": "Extract date/time features and cyclical encodings",
                "applicable_cols": datetime_cols,
                "techniques": [
                    {"id": "temporal_features_", "label": "Extract Month", "method": "Extract Month", "col_type": "datetime"},
                    {"id": "temporal_features_", "label": "Extract Day of Week", "method": "Extract Day of Week", "col_type": "datetime"},
                    {"id": "temporal_features_", "label": "Extract Holiday Flag", "method": "Extract Holiday Flag", "col_type": "datetime"},
                    {"id": "temporal_features_", "label": "Cyclical Sine/Cosine Transform", "method": "Cyclical Sine/Cosine Transform", "col_type": "datetime"}
                ]
            },
            {
                "id": "class_imbalance",
                "title": "Handle Class Imbalance",
                "icon": "TrendingUp",
                "description": "Re-balance skewed datasets for ML models",
                "applicable_cols": text_cols + numeric_cols,
                "techniques": [
                    {"id": "class_imbalance_", "label": "SMOTE Oversampling", "method": "SMOTE Oversampling", "col_type": "any"},
                    {"id": "class_imbalance_", "label": "Random Undersampling", "method": "Random Undersampling", "col_type": "any"}
                ]
            }
        ]
    }
    return tasks

@router.get("/clean/unique/{column}")
def get_unique_values(column: str):
    """Returns unique values for a column — for inspection and fixing inconsistencies."""
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    if column not in data_service.current_df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found.")
    
    val_counts = data_service.current_df[column].value_counts().head(50)
    return {
        "column": column,
        "total_unique": int(data_service.current_df[column].nunique()),
        "values": [{"value": str(k), "count": int(v)} for k, v in val_counts.items()]
    }

@router.post("/clean/apply")
def apply_cleaning(payload: CleanApplyRequest):
    try:
        summary = data_service.apply_cleaning(payload.operation_id, payload.column, payload.method)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/clean/calculate")
def calculate_field(payload: CalculateFieldRequest):
    try:
        summary = data_service.apply_cleaning("create_calculated_field", payload.column, payload.expression)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/clean/undo")
def undo_cleaning():
    try:
        summary = data_service.undo_last_step()
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/clean/revert/{step_index}")
def revert_cleaning(step_index: int):
    try:
        summary = data_service.revert_to_step(step_index)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/clean/preview")
def preview_cleaning(payload: CleanApplyRequest):
    try:
        preview = data_service.preview_cleaning(payload.operation_id, payload.column, payload.method)
        return preview
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/stats/correlation")
def get_correlation(method: str = Query("pearson")):
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_correlation_matrix(method)

@router.post("/stats/dimensionality")
def get_dimensionality(payload: DimensionalityRequest):
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_dimensionality_reduction(payload.algorithm)

@router.get("/stats/distribution/{column}")
def get_distribution(column: str):
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_distribution(column)

@router.post("/stats/timeseries")
def get_time_series(payload: TimeSeriesRequest):
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_time_series(payload.date_col, payload.val_col, payload.aggfunc)

@router.get("/stats/anomalies/{column}")
def get_anomalies(column: str):
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_anomalies(column)

@router.get("/stats/boxplot/{column}")
def get_boxplot(column: str):
    """Returns box plot statistics for a numeric column."""
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    import pandas as pd, numpy as np
    df = data_service.current_df
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found.")
    if not pd.api.types.is_numeric_dtype(df[column]):
        raise HTTPException(status_code=400, detail=f"Column '{column}' is not numeric.")
    
    col_data = df[column].dropna()
    if col_data.empty:
        raise HTTPException(status_code=400, detail="Column is empty after dropping NaN.")
    
    q1 = float(col_data.quantile(0.25))
    median = float(col_data.median())
    q3 = float(col_data.quantile(0.75))
    iqr = q3 - q1
    whisker_low = float(col_data[col_data >= q1 - 1.5 * iqr].min())
    whisker_high = float(col_data[col_data <= q3 + 1.5 * iqr].max())
    outliers = col_data[(col_data < q1 - 1.5 * iqr) | (col_data > q3 + 1.5 * iqr)].tolist()
    
    return {
        "column": column,
        "min": float(col_data.min()),
        "q1": q1, "median": median, "q3": q3,
        "max": float(col_data.max()),
        "whisker_low": whisker_low, "whisker_high": whisker_high,
        "iqr": iqr, "mean": float(col_data.mean()),
        "outliers": [float(x) for x in outliers[:50]]
    }

class ScatterRequest(BaseModel):
    x_col: str
    y_col: str

@router.post("/stats/scatter")
def get_scatter(payload: ScatterRequest):
    """Returns scatter plot data points for two columns."""
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    import pandas as pd, numpy as np
    df = data_service.current_df
    for c in [payload.x_col, payload.y_col]:
        if c not in df.columns:
            raise HTTPException(status_code=404, detail=f"Column '{c}' not found.")
    
    clean = df[[payload.x_col, payload.y_col]].dropna()
    # Sample if too large
    if len(clean) > 500:
        clean = clean.sample(500, random_state=42)
    
    points = [{"x": float(r[payload.x_col]), "y": float(r[payload.y_col])} for _, r in clean.iterrows()]
    
    # Calculate correlation
    try:
        corr_val = clean[payload.x_col].corr(clean[payload.y_col])
        corr = 0.0 if pd.isna(corr_val) else float(corr_val)
    except Exception:
        corr = 0.0
    
    return {
        "x_col": payload.x_col, "y_col": payload.y_col,
        "points": points, "correlation": corr, "count": len(points)
    }

@router.get("/stats/pie/{column}")
def get_pie(column: str):
    """Returns value counts for a pie chart."""
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    df = data_service.current_df
    if column not in df.columns:
        raise HTTPException(status_code=404, detail=f"Column '{column}' not found.")
    
    vc = df[column].value_counts().head(10)
    total = int(vc.sum())
    slices = [{"name": str(k), "value": int(v), "pct": round(int(v)/total*100, 1)} for k, v in vc.items()]
    return {"column": column, "slices": slices, "total": total}

@router.post("/stats/ttest")
def post_ttest(payload: TTestRequest):
    return data_service.calculate_ttest(payload.group_col, payload.value_col, payload.group1, payload.group2)

@router.post("/stats/anova")
def post_anova(payload: AnovaRequest):
    return data_service.calculate_anova(payload.group_col, payload.value_col)

@router.post("/stats/chisquare")
def post_chisquare(payload: ChiSquareRequest):
    return data_service.calculate_chi_square(payload.col1, payload.col2)

@router.post("/ml/regression")
def post_regression(payload: RegressionRequest):
    return data_service.train_linear_regression(payload.x_cols, payload.y_col, payload.test_size)

@router.post("/ml/logistic")
def post_logistic(payload: LogisticRegressionRequest):
    return data_service.train_logistic_regression(payload.x_cols, payload.y_col, payload.test_size)

@router.post("/ml/feature_importance")
def post_feature_importance(payload: FeatureImportanceRequest):
    return data_service.calculate_feature_importance(payload.target_col)

@router.post("/ml/kmeans")
def post_kmeans(payload: KMeansRequest):
    return data_service.train_kmeans(payload.features, payload.k)

@router.post("/ml/kmeans/diagnostics")
def post_kmeans_diagnostics(payload: KMeansDiagnosticsRequest):
    return data_service.calculate_kmeans_diagnostics(payload.features)

@router.post("/ml/root_cause")
def post_root_cause(payload: RootCauseRequest):
    return data_service.calculate_root_cause(payload.metric_col, payload.slice_col)

@router.post("/ml/forecast")
def post_forecast(payload: ForecastRequest):
    return data_service.calculate_forecast(payload.date_col, payload.val_col, payload.periods, payload.algorithm)

@router.post("/ml/sentiment")
def post_sentiment(payload: SentimentRequest):
    return data_service.calculate_sentiment(payload.text_col)

@router.post("/ml/topic_modeling")
def post_topic_modeling(payload: TopicModelingRequest):
    return data_service.calculate_topic_modeling(payload.text_col, payload.n_topics)

@router.post("/ml/dashboard")
def post_dashboard(payload: DashboardPromptRequest):
    from services.ai_service import AIService
    ai = AIService()
    audit_service.log_action("admin", "AI Dashboard Generation", f"Requested AI dashboard for prompt: '{payload.prompt}'")
    return ai.generate_dashboard_layout(payload.prompt, payload.dataset_schema)

@router.post("/pivot")
def get_pivot(payload: PivotTableRequest):
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No active dataset loaded.")
    return data_service.get_pivot_table(payload.index_col, payload.columns_col, payload.values_col, payload.aggfunc)

@router.post("/insights")
def generate_insights(payload: InsightRequest):
    try:
        preview = payload.data_preview
        if not preview and data_service.current_df is not None:
            preview = data_service.get_summary()
        
        insights = ai_service.generate_insights(payload.query, preview or {})
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sql/generate")
def generate_sql(payload: SQLGenerateRequest):
    try:
        sql_query = ai_service.generate_sql(payload.query, payload.schema_metadata)
        return {"sql": sql_query}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sql/fix")
def fix_sql(payload: SQLFixRequest):
    try:
        fixed_result = ai_service.fix_sql(payload.broken_query, payload.error_message, payload.schema_metadata)
        # fixed_result is now a dict containing 'explanation' and 'sql'
        return fixed_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/sql/execute")
def execute_sql(payload: SQLExecuteRequest):
    try:
        result = data_service.execute_sql(payload.query)
        if result.get("status") == "error":
            raise HTTPException(status_code=400, detail=result.get("message"))
        return result
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/export/csv")
def export_csv():
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No dataset to export.")
    
    csv_bytes = data_service.get_cleaned_csv_bytes()
    filename = f"cleaned_{data_service.filename.split('.')[0]}.csv"
    
    return StreamingResponse(
        iter([csv_bytes]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/script")
def export_script():
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No dataset to export script for.")
    
    script_content = data_service.get_reproducible_code()
    filename = f"clean_pipeline_{data_service.filename.split('.')[0]}.py"
    
    return StreamingResponse(
        iter([script_content.encode("utf-8")]),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/notebook")
def export_notebook():
    if data_service.current_df is None:
        raise HTTPException(status_code=400, detail="No dataset to export notebook for.")
    
    script_content = data_service.get_reproducible_code()
    
    nb = new_notebook()
    markdown_intro = "# VibeData Executive Analytics\n## Autogenerated Data Pipeline\n\nThis Jupyter Notebook was automatically generated by VibeData. It contains the reproducible Python Pandas steps used to clean and transform your dataset."
    nb.cells.append(new_markdown_cell(markdown_intro))
    nb.cells.append(new_code_cell(script_content))
    
    notebook_json = nbformat.writes(nb)
    filename = f"clean_pipeline_{data_service.filename.split('.')[0]}.ipynb"
    
    return StreamingResponse(
        iter([notebook_json.encode("utf-8")]),
        media_type="application/x-ipynb+json",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

# --- Connections Endpoints ---

class ConnectionCreateRequest(BaseModel):
    name: str
    type: str
    config: Dict[str, Any]

class ConnectionTestRequest(BaseModel):
    type: str
    config: Dict[str, Any]

@router.get("/connections")
def get_connections():
    return connection_service.load_connections()

# --- Pipeline Orchestration Endpoints ---

from services.pipeline_service import pipeline_service

class PipelineCreateRequest(BaseModel):
    name: str
    description: str
    cron: str
    code: str

@router.get("/pipelines")
def get_pipelines():
    return pipeline_service.get_pipelines()

@router.post("/pipelines")
def create_pipeline(req: PipelineCreateRequest):
    return pipeline_service.save_pipeline(req.name, req.description, req.cron, req.code)

@router.post("/pipelines/{pipeline_id}/run")
def run_pipeline(pipeline_id: str):
    return pipeline_service.run_pipeline_now(pipeline_id)

@router.delete("/pipelines/{pipeline_id}")
def delete_pipeline(pipeline_id: str):
    return pipeline_service.delete_pipeline(pipeline_id)

@router.post("/connections")
def create_connection(payload: ConnectionCreateRequest):
    return connection_service.create_connection(payload.name, payload.type, payload.config)

@router.post("/connections/test")
def test_connection(payload: ConnectionTestRequest):
    return connection_service.test_connection(payload.type, payload.config)

@router.delete("/connections/{conn_id}")
def delete_connection(conn_id: str):
    success = connection_service.delete_connection(conn_id)
    if not success:
        raise HTTPException(status_code=404, detail="Connection not found")
    return {"success": True}

@router.get("/connections/{conn_id}/catalog")
def get_connection_catalog(conn_id: str):
    try:
        return connection_service.get_catalog(conn_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/connections/{conn_id}/schema/{table_name}")
def get_connection_schema(conn_id: str, table_name: str):
    try:
        return connection_service.get_schema_and_preview(conn_id, table_name)
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/connections/{conn_id}/ingest/{table_name}")
def ingest_connection_data(conn_id: str, table_name: str):
    try:
        df = connection_service.ingest(conn_id, table_name)
        summary = data_service.set_dataframe(df, f"{table_name}.csv")
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

