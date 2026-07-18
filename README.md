# VibeData Analytics Suite 📊

VibeData is a premium, end-to-end interactive data analytics platform designed for business analysts and data scientists. It provides an intuitive 11-step pipeline from scoping to cleaning, SQL querying, exploratory analysis, hypothesis testing, machine learning forecasting, and report export.

---

## 🚀 Quick Start (Docker Compose - Option 1)

The easiest way to run the entire suite is using **Docker Compose**. This spins up both the frontend and backend automatically with all dependencies isolated.

### Prerequisites
* Ensure you have [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Launch Instructions
1. Open your terminal in the project directory.
2. Build and start the containers:
   ```bash
   docker-compose up --build
   ```
3. Once running, open your browser and navigate to:
   * **Frontend Application**: `http://localhost:5173`
   * **Backend API Docs**: `http://localhost:8000/docs`

---

## 🔑 Login Credentials

The application uses standard enterprise demo credentials to secure the workspace dashboard.

* **Username**: `admin`
* **Password**: `admin123`

---

## 🛠️ Manual Development Setup

If you prefer to run the services separately without Docker:

### 1. Backend Setup (FastAPI)
1. Navigate to the `backend` directory.
2. Create and activate a python virtual environment:
   ```bash
   python -m venv .venv
   # Windows PowerShell:
   .\.venv\Scripts\Activate.ps1
   # Linux/macOS:
   source .venv/bin/activate
   ```
3. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Run the server:
   ```bash
   python main.py
   ```
   *(Server starts at `http://localhost:8000`)*

### 2. Frontend Setup (React + Vite)
1. Navigate to the `frontend` directory.
2. Install node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
   *(Application starts at `http://localhost:5173`)*

---

## ⚙️ Configuring Google Gemini API Key

The platform uses Google Gemini to generate project scopes, interpret statistical outcomes, and write automated executive reports.

1. Obtain an API key from Google AI Studio.
2. Launch the application, click **Settings** (or the lock/key icon on the top right), enter your key, and click **Save & Verify**.
3. Alternatively, you can create/edit a `.env` file in the `backend` directory and add:
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

---

## 🧹 Inactivity Guard
To safeguard uploaded documents and configurations, the session will automatically expire and reset if the user is inactive for more than **1 hour**.
