import os

components_to_update = {
    "MachineLearning.jsx": {
        "old": '{loading && <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}><div className="loader-spinner" style={{ width: "20px", height: "20px" }}></div><span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>AI is compiling machine learning insights...</span></div>}',
        "new": '{loading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}><SkeletonLoader height="30px" width="40%" /><SkeletonLoader height="200px" width="100%" /><SkeletonLoader height="100px" width="100%" /></div>}'
    },
    "RCA.jsx": {
        "old": '{aiLoading && <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}><div className="loader-spinner" style={{ width: "20px", height: "20px" }}></div><span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>AI is diagnosing root causes...</span></div>}',
        "new": '{aiLoading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}><SkeletonLoader height="30px" width="50%" /><SkeletonLoader height="150px" width="100%" /></div>}'
    },
    "EDA.jsx": {
        "old": '{isLoading && <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "1rem 0" }}><div className="loader-spinner" style={{ width: "20px", height: "20px" }}></div><span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>AI is analyzing data...</span></div>}',
        "new": '{isLoading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem 0" }}><SkeletonLoader height="25px" width="40%" /><SkeletonLoader height="200px" width="100%" /></div>}'
    },
    "DeeperAnalysis.jsx": {
        "old": '{loading && <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.5rem 0" }}><div className="loader-spinner" style={{ width: "20px", height: "20px" }}></div><span style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>AI is compiling statistical interpretation...</span></div>}',
        "new": '{loading && <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}><SkeletonLoader height="20px" width="60%" /><SkeletonLoader height="100px" width="100%" /></div>}'
    }
}

base_dir = r"d:\Rohit\data-analyst\frontend\src\components"

for file_name, replacements in components_to_update.items():
    file_path = os.path.join(base_dir, file_name)
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
        
        # Add import if missing
        if "SkeletonLoader" not in content:
            # Find the last import
            last_import_idx = content.rfind("import ")
            if last_import_idx != -1:
                end_of_line = content.find("\\n", last_import_idx)
                if end_of_line == -1: end_of_line = last_import_idx + 10
                # Just insert at top for safety
                content = "import SkeletonLoader from './SkeletonLoader';\n" + content

        original_content = content
        content = content.replace(replacements["old"], replacements["new"])

        if content != original_content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"Updated {file_name}")

print("Done.")
