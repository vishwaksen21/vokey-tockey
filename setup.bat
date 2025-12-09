@echo off
REM Vokey-Tockey Setup Script for Windows
REM This script sets up both backend and frontend for development

echo ========================================
echo   Vokey-Tockey Setup Script (Windows)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed. Please install Python 3.9+ first.
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js 18+ first.
    exit /b 1
)

echo Python version:
python --version
echo Node.js version:
node --version
echo.

REM Setup Backend
echo Setting up Backend...
cd backend

REM Create virtual environment if it doesn't exist
if not exist "venv" (
    echo Creating Python virtual environment...
    python -m venv venv
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat

REM Install dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Create .env if it doesn't exist
if not exist ".env" (
    echo Creating .env file...
    copy .env.example .env
)

echo Backend setup complete!
echo.

REM Setup Frontend
echo Setting up Frontend...
cd ..\frontend

REM Install dependencies
echo Installing Node.js dependencies...
call npm install

REM Create .env.local if it doesn't exist
if not exist ".env.local" (
    echo Creating .env.local file...
    copy .env.example .env.local
)

echo Frontend setup complete!
echo.

cd ..

REM Done
echo ========================================
echo Setup complete!
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   venv\Scripts\activate
echo   uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Then open http://localhost:5173 in your browser!
echo.
pause
