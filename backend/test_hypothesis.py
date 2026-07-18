import pandas as pd
import numpy as np
from services.data_service import DataService
import json

def test_hypothesis():
    ds = DataService()
    
    # 1. Normal dataset (Assumptions Met)
    np.random.seed(42)
    group1 = np.random.normal(loc=100, scale=10, size=50)
    group2 = np.random.normal(loc=110, scale=10, size=50)
    group3 = np.random.normal(loc=120, scale=10, size=50)
    
    df_normal = pd.DataFrame({
        "group": ["A"]*50 + ["B"]*50 + ["C"]*50,
        "value": np.concatenate([group1, group2, group3])
    })
    
    print("--- Loading Normal Data ---")
    ds.load_data(df_normal.to_csv(index=False).encode('utf-8'), "normal.csv")
    
    print("\n--- Normal T-Test (A vs B) ---")
    res_t = ds.calculate_ttest("group", "value", "A", "B")
    print(json.dumps(res_t, indent=2))
    
    print("\n--- Normal ANOVA (A vs B vs C) ---")
    res_a = ds.calculate_anova("group", "value")
    print(json.dumps(res_a, indent=2))
    
    # 2. Skewed dataset (Assumptions Violated)
    # Use exponential distribution to create heavy skew
    skew1 = np.random.exponential(scale=10, size=50)
    skew2 = np.random.exponential(scale=100, size=50) # Very different variance
    skew3 = np.random.exponential(scale=200, size=50)
    
    df_skewed = pd.DataFrame({
        "group": ["X"]*50 + ["Y"]*50 + ["Z"]*50,
        "value": np.concatenate([skew1, skew2, skew3])
    })
    
    print("\n--- Loading Skewed Data ---")
    ds.load_data(df_skewed.to_csv(index=False).encode('utf-8'), "skewed.csv")
    
    print("\n--- Skewed T-Test (X vs Y) ---")
    res_t2 = ds.calculate_ttest("group", "value", "X", "Y")
    print(json.dumps(res_t2, indent=2))
    
    print("\n--- Skewed ANOVA (X vs Y vs Z) ---")
    res_a2 = ds.calculate_anova("group", "value")
    print(json.dumps(res_a2, indent=2))

if __name__ == "__main__":
    test_hypothesis()
