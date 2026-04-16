@echo off
chcp 65001 >nul
title zero.height.crm
cd /d "%~dp0electron"
node_modules\.bin\electron .
