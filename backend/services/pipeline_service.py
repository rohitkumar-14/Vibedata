import json
import os
import uuid
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PIPELINES_FILE = "pipelines.json"

class PipelineService:
    def __init__(self):
        self.scheduler = BackgroundScheduler()
        self.scheduler.start()
        self._load_and_schedule_pipelines()

    def _get_pipelines(self):
        if not os.path.exists(PIPELINES_FILE):
            return []
        with open(PIPELINES_FILE, "r") as f:
            try:
                return json.load(f)
            except json.JSONDecodeError:
                return []

    def _save_pipelines(self, pipelines):
        with open(PIPELINES_FILE, "w") as f:
            json.dump(pipelines, f, indent=4)

    def _load_and_schedule_pipelines(self):
        pipelines = self._get_pipelines()
        for p in pipelines:
            self._schedule_job(p)

    def _schedule_job(self, pipeline):
        # Remove existing if any
        try:
            self.scheduler.remove_job(pipeline["id"])
        except Exception:
            pass
        
        cron = pipeline.get("cron")
        if not cron:
            return

        try:
            parts = cron.split()
            if len(parts) == 5:
                trigger = CronTrigger(minute=parts[0], hour=parts[1], day=parts[2], month=parts[3], day_of_week=parts[4])
                self.scheduler.add_job(
                    self.execute_pipeline_task, 
                    trigger, 
                    args=[pipeline["id"]], 
                    id=pipeline["id"], 
                    replace_existing=True
                )
        except Exception as e:
            logger.error(f"Failed to schedule {pipeline['id']}: {e}")

    def execute_pipeline_task(self, pipeline_id: str):
        pipelines = self._get_pipelines()
        for p in pipelines:
            if p["id"] == pipeline_id:
                logger.info(f"Executing scheduled pipeline: {p['name']}")
                # In a real enterprise system, we would securely execute p["code"] via a task queue worker.
                p["last_run"] = datetime.now().isoformat()
                p["status"] = "Success"
                self._save_pipelines(pipelines)
                break

    def get_pipelines(self):
        return self._get_pipelines()

    def save_pipeline(self, name: str, description: str, cron: str, code: str):
        pipelines = self._get_pipelines()
        new_id = str(uuid.uuid4())
        
        pipeline = {
            "id": new_id,
            "name": name,
            "description": description,
            "cron": cron,
            "code": code,
            "created_at": datetime.now().isoformat(),
            "last_run": None,
            "status": "Scheduled" if cron else "Saved"
        }
        
        pipelines.append(pipeline)
        self._save_pipelines(pipelines)
        if cron:
            self._schedule_job(pipeline)
            
        return {"status": "success", "pipeline": pipeline}

    def run_pipeline_now(self, pipeline_id: str):
        self.execute_pipeline_task(pipeline_id)
        return {"status": "success"}

    def delete_pipeline(self, pipeline_id: str):
        pipelines = self._get_pipelines()
        pipelines = [p for p in pipelines if p["id"] != pipeline_id]
        self._save_pipelines(pipelines)
        try:
            self.scheduler.remove_job(pipeline_id)
        except Exception:
            pass
        return {"status": "success"}

pipeline_service = PipelineService()
