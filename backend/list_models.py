import os
from dotenv import load_dotenv
import google.generativeai as genai

load_dotenv()
genai.configure(api_key=os.environ.get("GEMINI_API_KEY"))

print("Testing gemini-3.5-flash...")
try:
    model = genai.GenerativeModel("gemini-3.5-flash")
    resp = model.generate_content("Hello")
    print(resp.text)
except Exception as e:
    print("Error:", e)

