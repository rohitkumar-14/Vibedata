import os

components_dir = r"d:\Rohit\data-analyst\frontend\src\components"

replacements = {
    'color: "white"': 'color: "var(--text-dark)"',
    "color: 'white'": "color: 'var(--text-dark)'",
    'background: "rgba(255,255,255,0.03)"': 'background: "var(--bg-card)"',
    'background: "rgba(255,255,255,0.02)"': 'background: "var(--bg-card)"',
    'background: "rgba(255,255,255,0.05)"': 'background: "var(--bg-card-hover)"',
    'background: "rgba(0,0,0,0.2)"': 'background: "var(--bg-card-hover)"',
    'background: "rgba(255, 255, 255, 0.05)"': 'background: "var(--bg-card-hover)"',
    'border: "1px solid rgba(255,255,255,0.05)"': 'border: "1px solid var(--border-color)"',
    'border: "1px solid rgba(255, 255, 255, 0.1)"': 'border: "1px solid var(--border-color)"',
    'borderBottom: "1px solid rgba(255,255,255,0.05)"': 'borderBottom: "1px solid var(--border-color)"',
    'borderRight: "1px solid rgba(255,255,255,0.05)"': 'borderRight: "1px solid var(--border-color)"',
}

for root, _, files in os.walk(components_dir):
    for file in files:
        if file.endswith(".jsx"):
            filepath = os.path.join(root, file)
            with open(filepath, "r", encoding="utf-8") as f:
                content = f.read()
            
            original_content = content
            for old, new in replacements.items():
                content = content.replace(old, new)
            
            if content != original_content:
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Updated {file}")

print("Done replacing styles.")
