from services.data_service import DataService

def test_drift():
    ds = DataService()

    # 1. Initial load - establishes baseline
    print("--- Initial Load ---")
    csv_data_1 = b"id,name,age\n1,Alice,30\n2,Bob,25"
    summary1 = ds.load_data(csv_data_1, "test_file.csv")
    print("Warnings (should be empty):", summary1.get("schema_drift_warnings"))

    # 2. Second load - simulate drift (change age to string, drop name, add salary)
    print("\n--- Second Load ---")
    csv_data_2 = b"id,age,salary\n1,thirty,50000\n2,twenty-five,40000"
    summary2 = ds.load_data(csv_data_2, "test_file.csv")
    
    print("Warnings:")
    for w in summary2.get("schema_drift_warnings", []):
        print(" -", w)

if __name__ == "__main__":
    test_drift()
