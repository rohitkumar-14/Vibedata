from typing import List, Dict
import datetime

class AuditService:
    def __init__(self):
        self.logs: List[Dict] = []

    def log_action(self, user: str, action: str, details: str):
        timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        self.logs.append({
            "timestamp": timestamp,
            "user": user,
            "action": action,
            "details": details
        })

    def get_logs(self):
        # Return descending order (newest first)
        return self.logs[::-1]
