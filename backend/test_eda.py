import pandas as pd
from services.data_service import DataService

def test_eda():
    ds = DataService()
    
    # Create dataset with numeric and categorical features
    csv_data = (
        "id,salary,age,category,region\n"
        "1,50000,25,Tech,North\n"
        "2,60000,30,Tech,North\n"
        "3,120000,45,Exec,South\n"
        "4,130000,50,Exec,South\n"
        "5,45000,22,Sales,East\n"
        "6,50000,28,Sales,East\n"
    ).encode('utf-8')
    
    print("--- Loading Data ---")
    ds.load_data(csv_data, "test_eda.csv")
    
    print("\n--- Pearson Correlation ---")
    corr_p = ds.get_correlation_matrix("pearson")
    print(corr_p["columns"])
    print(corr_p["values"])
    
    print("\n--- Spearman Correlation ---")
    corr_s = ds.get_correlation_matrix("spearman")
    print(corr_s["values"])
    
    print("\n--- Cramer's V ---")
    corr_c = ds.get_correlation_matrix("cramers_v")
    print(corr_c["columns"])
    print(corr_c["values"])
    
    print("\n--- Dimensionality Reduction (PCA) ---")
    pca_res = ds.get_dimensionality_reduction("pca")
    print(f"Generated {len(pca_res)} points. First point:")
    if pca_res:
        print(pca_res[0])
    
    print("\n--- Dimensionality Reduction (t-SNE) ---")
    tsne_res = ds.get_dimensionality_reduction("tsne")
    print(f"Generated {len(tsne_res)} points. First point:")
    if tsne_res:
        print(tsne_res[0])

if __name__ == "__main__":
    test_eda()
