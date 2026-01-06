@echo off
echo ==========================================
echo    Accua Game - Iniciando...
echo ==========================================
pause

echo [1/4] Verificando Python...
python --version
if %errorlevel% neq 0 (
    echo [ERROR] No se encuentra Python.
    pause
    exit
)

echo [2/4] Verificando Node.js...
node --version
if %errorlevel% neq 0 (
    echo [ERROR] No se encuentra Node.js.
    pause
    exit
)

echo [3/4] Instalando dependencias (por favor espera)...
if not exist "backend\venv" (
    python -m venv backend\venv
    call backend\venv\Scripts\activate
    pip install -r backend\requirements.txt
)

cd frontend
if not exist "node_modules" (
    call npm install
)
call npm run build
cd ..

if exist "backend\static" rmdir /s /q "backend\static"
move "frontend\dist" "backend\static"

echo [4/4] Iniciando Accua Game...
echo URL: http://localhost:8000
echo (Si esa no funciona, prueba: http://127.0.0.1:8000)
call backend\venv\Scripts\activate
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --workers 1

pause
