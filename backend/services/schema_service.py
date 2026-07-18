import json
import os
from typing import Dict, Any, List

class SchemaService:
    def __init__(self, storage_path="schema_profiles.json"):
        # Store in backend root by default
        self.storage_path = storage_path
        self._ensure_storage_exists()

    def _ensure_storage_exists(self):
        if not os.path.exists(self.storage_path):
            with open(self.storage_path, "w") as f:
                json.dump({}, f)

    def _load_profiles(self) -> Dict[str, Any]:
        try:
            with open(self.storage_path, "r") as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {}

    def _save_profiles(self, profiles: Dict[str, Any]):
        with open(self.storage_path, "w") as f:
            json.dump(profiles, f, indent=4)

    def validate_schema(self, dataset_name: str, current_columns: Dict[str, Any]) -> List[str]:
        """
        Validates the current schema against a historical profile.
        If no profile exists, saves the current one as baseline.
        Returns a list of schema drift warnings.
        """
        profiles = self._load_profiles()
        warnings = []
        
        # Extract lightweight schema representation {col_name: dtype}
        current_schema = {col_name: info.get("dtype") for col_name, info in current_columns.items()}

        if dataset_name not in profiles:
            # First time seeing this dataset, save as baseline
            profiles[dataset_name] = current_schema
            self._save_profiles(profiles)
            return warnings

        historical_schema = profiles[dataset_name]
        
        # 1. Check for missing columns
        for old_col in historical_schema.keys():
            if old_col not in current_schema:
                warnings.append(f"Missing Column: '{old_col}' was present in historical profile but is missing now.")

        # 2. Check for new columns and type changes
        for new_col, new_type in current_schema.items():
            if new_col not in historical_schema:
                warnings.append(f"New Column Detected: '{new_col}' was not in historical profile.")
            else:
                old_type = historical_schema[new_col]
                if old_type != new_type:
                    warnings.append(f"Type Mismatch on '{new_col}': Expected '{old_type}' but got '{new_type}'.")
                    
        return warnings
