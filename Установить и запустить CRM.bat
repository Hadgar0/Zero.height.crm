@echo off
chcp 65001 >nul
title zero.height.crm
echo.
echo  ╔══════════════════════════════════════╗
echo  ║        zero.height.crm              ║
echo  ╚══════════════════════════════════════╝
echo.

:: Проверяем Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo  [ОШИБКА] Node.js не найден!
    echo.
    echo  Скачай и установи Node.js LTS:
    echo  https://nodejs.org/en/download
    echo.
    start https://nodejs.org/en/download
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo  Node.js %NODE_VER% — OK

:: Переходим в папку electron
cd /d "%~dp0electron"

if not exist "node_modules\electron" (
    echo.
    echo  [1/2] Устанавливаю Electron (первый раз ~2-3 мин)...
    echo  Не закрывай окно!
    echo.
    call npm install --prefer-offline 2>&1
    if %errorlevel% neq 0 (
        echo.
        echo  [ОШИБКА] npm install завершился с ошибкой
        echo  Попробуй запустить от имени администратора
        pause
        exit /b 1
    )
    echo  Установка завершена — OK
)

echo.
echo  [2/2] Запуск CRM...
echo.

call npx electron . 2>&1

if %errorlevel% neq 0 (
    echo.
    echo  [ОШИБКА] Не удалось запустить
    echo  Попробуй: удали папку electron\node_modules и запусти снова
    pause
)
