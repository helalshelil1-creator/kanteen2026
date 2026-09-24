@echo off
git add -A
git commit -m "auto update %date% %time%"
git push origin main
echo.
echo Done!
pause