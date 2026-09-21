@echo off
title Push to GitHub Pages
echo ===================================================
echo   Pushing Website to GitHub: dogandoruk/dorukdogan
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Adding changes...
git add .

echo [2/3] Committing changes...
git commit -m "Update portfolio website"

echo [3/3] Pushing to GitHub main branch...
git push -u origin main

echo.
if %errorlevel% equ 0 (
    echo ===================================================
    echo [SUCCESS] Code successfully pushed to GitHub!
    echo.
    echo In ~60 seconds your website will be live at:
    echo https://dogandoruk.github.io/dorukdogan/
    echo ===================================================
) else (
    echo [ERROR] Push failed. Please check your GitHub permissions or sign in.
)

pause
