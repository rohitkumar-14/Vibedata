import os
import json
import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)

# Try to import Gemini SDK
try:
    import google.generativeai as genai
    HAS_GEMINI = True
except ImportError:
    HAS_GEMINI = False

class AIService:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY")
        if not HAS_GEMINI:
            logger.critical("google.generativeai package is not installed. Please install it.")
            raise RuntimeError("google.generativeai package missing.")
            
        self.is_configured = False
        self.model = None
        
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                self.model = genai.GenerativeModel("gemini-3.5-flash")
                self.is_configured = True
                logger.info("Gemini API initialized successfully.")
            except Exception as e:
                logger.error(f"Failed to initialize Gemini API: {e}")
        else:
            logger.warning("GEMINI_API_KEY environment variable not found. Please configure it in settings.")

    def configure_api_key(self, api_key: str):
        self.api_key = api_key
        os.environ["GEMINI_API_KEY"] = api_key
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel("gemini-3.5-flash")
        self.is_configured = True
        logger.info("Gemini API key reconfigured successfully.")

    @staticmethod
    def test_api_key(api_key: str) -> tuple[bool, str]:
        if not HAS_GEMINI:
            return False, "google.generativeai package missing."
        try:
            current_key = os.environ.get("GEMINI_API_KEY")
            genai.configure(api_key=api_key)
            test_model = genai.GenerativeModel("gemini-3.5-flash")
            # Run a small generate content call with a token limit to test the key
            config = genai.types.GenerationConfig(max_output_tokens=5)
            resp = test_model.generate_content("Hello", generation_config=config)
            # Access text to verify the request was successful
            _ = resp.text
            
            # Restore original key if it existed
            if current_key:
                genai.configure(api_key=current_key)
            return True, "Success"
        except Exception as e:
            # Restore original key if it existed
            if current_key:
                genai.configure(api_key=current_key)
            return False, str(e)

    def _check_configuration(self):
        if not self.is_configured or not self.api_key:
            raise RuntimeError("Gemini API key is not configured. Please set your API key in settings.")

    def _call_gemini(self, system_instruction: str, prompt: str) -> str:
        """Helper to call Gemini API with instructions."""
        self._check_configuration()
        try:
            config = genai.types.GenerationConfig(temperature=0.7)
            chat_model = genai.GenerativeModel(
                model_name="gemini-3.5-flash",
                system_instruction=system_instruction
            )
            response = chat_model.generate_content(prompt, generation_config=config)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API Error: {e}")
            raise e

    def discuss_problem(self, chat_history: list[dict], new_message: str) -> str:
        """
        Discusses the analytics problem statement with the user.
        chat_history format: [{"role": "user"|"model"|"assistant", "content": "..."}]
        """
        system_instruction = (
            "You are an AI Business Analyst Agent. Your goal is to proactively help "
            "the user define their analytics problem statement. "
            "You MUST gather the following requirements through natural conversation: "
            "1. Business Goals & Problem Statement "
            "2. Primary and Secondary KPIs (Metric definition) "
            "3. Stakeholders mapping "
            "4. Business hypotheses to test.\n"
            "Be inquisitive, professional, and guide the user if they miss any of these points. "
            "Suggest standard industry techniques (e.g., cohort analysis, regression, customer lifetime value) when relevant."
        )

        prompt_parts = []
        for msg in chat_history:
            role = "User" if msg["role"] == "user" else "Assistant"
            prompt_parts.append(f"{role}: {msg['content']}")
        prompt_parts.append(f"User: {new_message}")
        prompt = "\n".join(prompt_parts) + "\nAssistant:"
        
        return self._call_gemini(system_instruction, prompt)

    def generate_report(self, chat_history: list[dict]) -> dict:
        """
        Generates a comprehensive Analytical Project Scoping Report based on the discussion history.
        """
        system_instruction = (
            "You are an AI Business Analyst Agent. Based on the conversation history provided, "
            "generate a structured Scoping Report. You MUST output ONLY a valid JSON object "
            "with exactly these keys:\n"
            "1. 'project_brief': A string containing Background, problem statement, goals, and stakeholders mapping in markdown.\n"
            "2. 'kpi_tree': A string detailing Primary KPIs, secondary metrics, and formulas in markdown.\n"
            "3. 'analytics_plan': A string detailing Methodologies, required data points, and expected risks in markdown.\n"
            "4. 'business_questions': A string containing a bulleted list of hypotheses and key business questions to answer.\n"
            "5. 'kpi_checklist': An array of strings, where each string is a specific KPI or metric to calculate (e.g., ['Calculate Month-over-Month Churn', 'Calculate CLV']).\n"
            "6. 'data_requirements': An array of strings, where each string is a specific required column name for the dataset (e.g., ['Date', 'User_ID', 'Revenue']).\n"
            "Ensure the output is parseable JSON."
        )

        history_text = "\n".join([f"{msg['role']}: {msg['content']}" for msg in chat_history])
        prompt = f"Here is the discussion history:\n{history_text}\n\nGenerate the JSON Scoping Report now."
        
        try:
            response = self._call_gemini(system_instruction, prompt)
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response.split("```json")[1].split("```")[0].strip()
            elif clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1].split("```")[0].strip()
            return json.loads(clean_response)
        except Exception as e:
            logger.error(f"Error parsing Gemini JSON report output: {e}")
            raise RuntimeError(f"Failed to generate valid report from AI: {e}")

    def suggest_cleaning_steps(self, column_summary: dict) -> list[dict]:
        """
        Suggests cleaning techniques based on the columns metadata.
        """
        system_instruction = (
            "You are an automated data cleaning assistant. Analyze the following column summary "
            "and detect issues like missing values, duplicates, outliers, and type mismatches. "
            "Generate a list of recommended cleaning actions. The output MUST be a valid JSON array "
            "of objects, containing fields: 'id', 'column', 'issue', 'technique', 'description', 'options' (array of suggestions)."
        )

        prompt = f"Column Summary: {json.dumps(column_summary, indent=2)}"

        try:
            response = self._call_gemini(system_instruction, prompt)
            clean_response = response.strip()
            if clean_response.startswith("```json"):
                clean_response = clean_response.split("```json")[1].split("```")[0].strip()
            elif clean_response.startswith("```"):
                clean_response = clean_response.split("```")[1].split("```")[0].strip()
            return json.loads(clean_response)
        except Exception as e:
            logger.error(f"Error parsing Gemini JSON output for cleaning steps: {e}")
            raise RuntimeError(f"Failed to suggest cleaning steps: {e}")

    def generate_insights(self, query: str, data_preview: dict) -> str:
        """
        Provides explanations or insights on dataset characteristics or a specific EDA question.
        """
        system_instruction = (
            "You are a Senior Data Analyst. Analyze the dataset characteristics or query, "
            "and provide statistical insights, correlations, or observations. Keep it concise, "
            "actionable, and statistically sound."
        )

        prompt = f"Data Summary preview: {json.dumps(data_preview, indent=2)}\nUser Question: {query}"
        return self._call_gemini(system_instruction, prompt)

    def generate_sql(self, query: str, schema: dict) -> str:
        """
        Translates a natural language query into a valid SQL SELECT statement.
        """
        system_instruction = (
            "You are an expert SQL Assistant. Your task is to generate ONLY a valid SQL SELECT statement "
            "based on the natural language query and the provided dataset schema. "
            "The table name is ALWAYS 'active_data'. "
            "Do NOT output markdown wrappers (like ```sql), just the raw SQL query string. "
            "Ensure the query is compatible with SQLite."
        )

        prompt = f"Schema: {json.dumps(schema, indent=2)}\n\nUser Request: {query}\n\nSQL Query:"
        
        try:
            response = self._call_gemini(system_instruction, prompt)
            clean_sql = response.strip()
            if clean_sql.startswith("```sql"):
                clean_sql = clean_sql.split("```sql")[1].split("```")[0].strip()
            elif clean_sql.startswith("```"):
                clean_sql = clean_sql.split("```")[1].split("```")[0].strip()
            return clean_sql
        except Exception as e:
            logger.error(f"Error generating SQL: {e}")
            raise RuntimeError(f"Failed to generate SQL: {e}")

    def fix_sql(self, broken_query: str, error_message: str, schema: dict) -> dict:
        """
        Translates a broken SQL query and its error into a fixed SQL query and explanation.
        """
        system_instruction = (
            "You are an expert SQL Debugger. The user's SQLite query failed. "
            "You are provided with the broken query, the exact error message, and the schema. "
            "Your task is to fix the query and explain why it failed. "
            "Output ONLY a valid JSON object with exactly two keys: "
            "'explanation' (a plain English explanation of what went wrong and how you fixed it) "
            "and 'sql' (the corrected valid SQL SELECT statement as a raw string)."
        )

        prompt = f"Schema: {json.dumps(schema, indent=2)}\n\nBroken Query: {broken_query}\n\nError Message: {error_message}\n\nFixed SQL JSON:"
        
        try:
            response = self._call_gemini(system_instruction, prompt)
            import re
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                # Fallback if it didn't return JSON
                clean_sql = response.strip()
                if clean_sql.startswith("```sql"):
                    clean_sql = clean_sql.split("```sql")[1].split("```")[0].strip()
                elif clean_sql.startswith("```"):
                    clean_sql = clean_sql.split("```")[1].split("```")[0].strip()
                return {"explanation": "Applied automatic fixes to syntax.", "sql": clean_sql}
        except Exception as e:
            logger.error(f"Error fixing SQL: {e}")
            raise RuntimeError(f"Failed to fix SQL: {e}")

    def generate_dashboard_layout(self, prompt: str, schema_json: str) -> Dict[str, Any]:
        """
        Generates a JSON configuration for a dashboard consisting of 3-4 charts based on a prompt.
        """
        self._check_configuration()
        system_prompt = '''You are an expert Data Visualization Analyst.
You will be provided with a user's natural language request for a dashboard, along with the JSON schema of their dataset.
Your task is to design an optimal dashboard layout by returning a JSON array of 3 to 4 chart widget definitions.

Available chart types: 'bar', 'line', 'pie', 'area', 'scatter'.
Rules:
1. ONLY use column names that actually exist in the schema.
2. Ensure the Y-axis variable is numeric for all charts (except for counting categorical occurrences, but our frontend expects a numeric Y column, so ALWAYS select a valid numeric column for y_col).
3. Ensure the X-axis variable makes sense for the chart type (e.g., categorical for Bar/Pie, temporal/sequential for Line/Area).
4. Return ONLY a valid JSON object with a single key 'widgets' containing an array of objects.

JSON Structure:
{
"widgets": [
    {"chart_type": "bar", "x_col": "exact_column_name", "y_col": "exact_column_name", "title": "Clear Title"},
    ...
]
}'''
        user_prompt = f"Dataset Schema:\n{schema_json}\n\nUser Request: {prompt}\n\nReturn the JSON dashboard configuration."

        try:
            response = self.model.generate_content(
                contents=[
                    {"role": "user", "parts": [system_prompt]},
                    {"role": "user", "parts": [user_prompt]}
                ]
            )
            text = response.text
            
            import re
            json_match = re.search(r'\{[\s\S]*\}', text)
            if json_match:
                return json.loads(json_match.group(0))
            else:
                return {"status": "error", "message": "Failed to extract JSON from AI response."}
        except Exception as e:
            return {"status": "error", "message": f"Failed to generate dashboard layout: {str(e)}"}
