@echo off
title Push Website to GitHub Pages
echo ===================================================
echo   Pushing Clean Production Website to GitHub
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Checking working directory...
git status --short

echo.
echo [2/3] Staging and committing clean production changes...
git add .
git commit -m "Update portfolio production content via Studio CMS" 2>nul

echo.
echo [3/3] Pushing clean production commits to GitHub main branch...
git push origin main

echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo [SUCCESS] Website successfully pushed to GitHub!
    echo.
    echo Your website is updating at:
    echo https://dogandoruk.github.io/dorukdogan/
    echo ===================================================
) else (
    echo ===================================================
    echo [ERROR] Push failed. Please check your network or GitHub login.
    echo ===================================================
)

echo.
pause
