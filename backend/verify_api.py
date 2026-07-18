import requests
import os
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Starting VibeData API Integration Tests...")
    
    # 1. Test Root
    try:
        r = requests.get(f"{BASE_URL}/")
        print(f"[Pass] Root status: {r.status_code}, content: {r.json()}")
    except Exception as e:
        print(f"[Fail] Backend is not responding at {BASE_URL}: {e}")
        sys.exit(1)

    # 2. Test Chat Scoping
    payload = {
        "messages": [],
        "newMessage": "I want to analyze customer churn trends"
    }
    r = requests.post(f"{BASE_URL}/api/chat", json=payload)
    if r.status_code == 200:
        res = r.json()
        print(f"[Pass] Chat Scoping response received. Preview: {res['response'][:100]}...")
    else:
        print(f"[Fail] Chat scoping error {r.status_code}: {r.text}")

    # 3. Test Report Compiler
    payload_report = {
        "messages": [
            {"role": "user", "content": "I want to analyze customer churn trends"},
            {"role": "model", "content": "Sure, let's explore. What are your primary metrics?"},
            {"role": "user", "content": "We need to track customer lifetime value and churn rates."}
        ]
    }
    r = requests.post(f"{BASE_URL}/api/report", json=payload_report)
    if r.status_code == 200:
        res = r.json()
        print(f"[Pass] Report generated. length: {len(res['report'])}")
    else:
        print(f"[Fail] Report generation error {r.status_code}: {r.text}")

    # 4. Test File Upload
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_file_path = os.path.join(script_dir, "..", "sample_data.csv")
    if not os.path.exists(sample_file_path):
        print(f"[Fail] Sample CSV file not found at {sample_file_path}")
        return

    with open(sample_file_path, "rb") as f:
        files = {"file": (os.path.basename(sample_file_path), f, "text/csv")}
        r = requests.post(f"{BASE_URL}/api/upload", files=files)
        
    if r.status_code == 200:
        summary = r.json()
        print(f"[Pass] File upload succeeded. File: {summary['filename']}, Rows: {summary['row_count']}, Columns: {summary['column_count']}")
        assert summary["row_count"] == 16, "Expected 16 rows"
        assert summary["duplicate_count"] == 2, "Expected 2 duplicates in sample_data.csv"
    else:
        print(f"[Fail] File upload error {r.status_code}: {r.text}")
        return

    # 5. Test Suggestions
    r = requests.get(f"{BASE_URL}/api/clean/suggest")
    if r.status_code == 200:
        suggs = r.json().get("suggestions", [])
        print(f"[Pass] Received {len(suggs)} cleaning suggestions.")
        for s in suggs[:2]:
            print(f"   - Column: {s['column']} | Issue: {s['issue']} | Recommended: {s['technique']}")
    else:
        print(f"[Fail] Suggestions error {r.status_code}: {r.text}")

    # 6. Test Apply cleaning (Remove duplicates)
    clean_payload = {
        "operation_id": "remove_duplicates",
        "column": "All Rows",
        "method": "Keep First"
    }
    r = requests.post(f"{BASE_URL}/api/clean/apply", json=clean_payload)
    if r.status_code == 200:
        summary_clean = r.json()
        print(f"[Pass] Cleaning applied: remove_duplicates. Rows before: 16 -> Rows after: {summary_clean['row_count']}")
        assert summary_clean["row_count"] == 14, f"Expected 14 rows after de-duplication, got {summary_clean['row_count']}"
    else:
        print(f"[Fail] Apply cleaning error {r.status_code}: {r.text}")

    # 6b. Test Calculated Field creation
    calc_payload = {
        "column": "spent_per_min",
        "expression": "amount_spent / session_duration_mins"
    }
    r = requests.post(f"{BASE_URL}/api/clean/calculate", json=calc_payload)
    if r.status_code == 200:
        summary_calc = r.json()
        print(f"[Pass] Calculated column created successfully. New column count: {summary_calc['column_count']}")
        assert "spent_per_min" in summary_calc["columns"], "Expected spent_per_min column to exist"
    else:
        print(f"[Fail] Calculated field error {r.status_code}: {r.text}")

    # 6c. Test Correlation heatmap endpoint
    r = requests.get(f"{BASE_URL}/api/stats/correlation")
    if r.status_code == 200:
        corr = r.json()
        print(f"[Pass] Correlation calculated successfully. Columns: {len(corr['columns'])}")
        assert "spent_per_min" in corr["columns"], "Expected new calculated column in correlation"
    else:
        print(f"[Fail] Correlation calculation error {r.status_code}: {r.text}")

    # 6d. Test Pivot Table calculation
    pivot_payload = {
        "index_col": "product_category",
        "values_col": "amount_spent",
        "aggfunc": "mean"
    }
    r = requests.post(f"{BASE_URL}/api/pivot", json=pivot_payload)
    if r.status_code == 200:
        piv = r.json()
        print(f"[Pass] Pivot Table computed successfully. Status: {piv['status']}, Agg: {piv['aggfunc']}")
        assert piv["status"] == "success", f"Expected success, got {piv['status']}"
    # 6e. Test T-Test calculation
    ttest_payload = {
        "group_col": "product_category",
        "value_col": "amount_spent",
        "group1": "Electronics",
        "group2": "Clothing"
    }
    r = requests.post(f"{BASE_URL}/api/stats/ttest", json=ttest_payload)
    if r.status_code == 200:
        res = r.json()
        print(f"[Pass] T-Test calculated successfully. Status: {res['status']}, significant: {res.get('significant')}")
    else:
        print(f"[Fail] T-Test calculation error {r.status_code}: {r.text}")

    # 6f. Test Linear Regression calculation (assert regression points structure)
    regression_payload = {
        "x_cols": ["session_duration_mins"],
        "y_col": "amount_spent"
    }
    r = requests.post(f"{BASE_URL}/api/ml/regression", json=regression_payload)
    if r.status_code == 200:
        res = r.json()
        print(f"[Pass] Linear Regression calculated successfully. Equation: {res.get('equation')}, Points count: {len(res.get('points', []))}")
        assert res["status"] == "success"
        assert "points" in res
        if len(res["points"]) > 0:
            assert "actual" in res["points"][0]
            assert "predicted" in res["points"][0]
    else:
        print(f"[Fail] Regression calculation error {r.status_code}: {r.text}")

    # 7. Test Export CSV
    r = requests.get(f"{BASE_URL}/api/export/csv")
    if r.status_code == 200:
        print(f"[Pass] Cleaned CSV export received. Length: {len(r.content)} bytes")
    else:
        print(f"[Fail] Export CSV error {r.status_code}: {r.text}")

    # 8. Test Export Pipeline Python script
    r = requests.get(f"{BASE_URL}/api/export/script")
    if r.status_code == 200:
        script = r.text
        print(f"[Pass] Python pipeline script exported successfully. Length: {len(script)} chars")
        assert "df = df.drop_duplicates(keep='first')" in script, "Expected script to document de-duplication step."
        assert "df['spent_per_min'] = df.eval('amount_spent / session_duration_mins')" in script, "Expected script to document calculated column creation."
    else:
        print(f"[Fail] Export script error {r.status_code}: {r.text}")

    # 9. Test Connection Management Endpoints
    print("\nTesting Connection Management Endpoints...")
    # 9a. Test Connection Testing (SQLite Database File)
    # Create a temporary sqlite db for verification
    temp_db_path = os.path.join(script_dir, "temp_test_db.sqlite")
    import sqlite3 as sql
    try:
        conn = sql.connect(temp_db_path)
        cursor = conn.cursor()
        cursor.execute("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, role TEXT);")
        cursor.execute("INSERT INTO users VALUES (1, 'Alice', 'Admin'), (2, 'Bob', 'Member');")
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[Warning] Failed to setup temp SQLite db: {e}")

    # Test valid connection
    test_payload = {
        "type": "sqlite",
        "config": {"database_path": "backend/temp_test_db.sqlite"}
    }
    r = requests.post(f"{BASE_URL}/api/connections/test", json=test_payload)
    if r.status_code == 200:
        res = r.json()
        print(f"[Pass] Connection testing SQLite (success case): {res['success']}, message: {res['message']}")
        assert res["success"] is True
    else:
        print(f"[Fail] Connection testing SQLite error: {r.status_code}: {r.text}")

    # Test invalid connection (file not found)
    test_payload_invalid = {
        "type": "sqlite",
        "config": {"database_path": "backend/non_existent.sqlite"}
    }
    r = requests.post(f"{BASE_URL}/api/connections/test", json=test_payload_invalid)
    if r.status_code == 200:
        res = r.json()
        print(f"[Pass] Connection testing SQLite (failure case): {res['success']}, message: {res['message']}")
        assert res["success"] is False
    else:
        print(f"[Fail] Connection testing SQLite invalid error: {r.status_code}: {r.text}")

    # 9b. Test Save Connection Profile
    save_payload = {
        "name": "Integration Test SQLite",
        "type": "sqlite",
        "config": {"database_path": "backend/temp_test_db.sqlite"}
    }
    r = requests.post(f"{BASE_URL}/api/connections", json=save_payload)
    if r.status_code == 200:
        conn_profile = r.json()
        print(f"[Pass] Connection profile created. ID: {conn_profile['id']}")
        assert conn_profile["name"] == "Integration Test SQLite"
        conn_id = conn_profile["id"]
    else:
        print(f"[Fail] Create connection error: {r.status_code}: {r.text}")
        conn_id = None

    if conn_id:
        # 9c. Test List Connections
        r = requests.get(f"{BASE_URL}/api/connections")
        if r.status_code == 200:
            connections_list = r.json()
            found = any(c["id"] == conn_id for c in connections_list)
            print(f"[Pass] List connections contains new connection: {found}")
            assert found is True
        else:
            print(f"[Fail] List connections error: {r.status_code}: {r.text}")

        # 9d. Test Catalog Retrieval
        r = requests.get(f"{BASE_URL}/api/connections/{conn_id}/catalog")
        if r.status_code == 200:
            catalog = r.json()
            print(f"[Pass] Catalog retrieved successfully. Tables: {len(catalog)}")
            assert any(t["name"] == "users" for t in catalog), "Expected 'users' table in sqlite catalog"
        else:
            print(f"[Fail] Get catalog error: {r.status_code}: {r.text}")

        # 9e. Test Schema & Preview Retrieval
        r = requests.get(f"{BASE_URL}/api/connections/{conn_id}/schema/users")
        if r.status_code == 200:
            schema = r.json()
            print(f"[Pass] Schema discovery completed. Columns: {len(schema['columns'])}, Preview Rows: {len(schema['preview'])}")
            assert len(schema["columns"]) == 3, "Expected 3 columns (id, name, role)"
            assert schema["columns"][0]["name"] == "id"
            assert schema["columns"][0]["type"] in ["INTEGER", "int64"]
            assert len(schema["preview"]) == 2, "Expected 2 preview rows"
        else:
            print(f"[Fail] Get schema error: {r.status_code}: {r.text}")

        # 9f. Test Data Ingestion
        r = requests.post(f"{BASE_URL}/api/connections/{conn_id}/ingest/users")
        if r.status_code == 200:
            summary = r.json()
            print(f"[Pass] Connection data ingested successfully. Rows: {summary['row_count']}, Columns: {summary['column_count']}")
            assert summary["row_count"] == 2, "Expected 2 rows in active dataset"
            assert summary["column_count"] == 3, "Expected 3 columns in active dataset"
        else:
            print(f"[Fail] Ingest connection data error: {r.status_code}: {r.text}")

        # 9g. Test Delete Connection
        r = requests.delete(f"{BASE_URL}/api/connections/{conn_id}")
        if r.status_code == 200:
            print(f"[Pass] Connection profile deleted successfully.")
        else:
            print(f"[Fail] Delete connection error: {r.status_code}: {r.text}")

    # Cleanup temp sqlite db file
    try:
        if os.path.exists(temp_db_path):
            os.remove(temp_db_path)
    except Exception as e:
        print(f"[Warning] Failed to clean up temp SQLite db file: {e}")

    print("\nAll integration API checks passed successfully!")

if __name__ == "__main__":
    run_tests()

