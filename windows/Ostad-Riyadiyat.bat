@echo off
rem Ostad Riyadiyat - ouvre l application dans Edge (mode application). MIT.
set "APP=https://salimadour31-boop.github.io/ostad-riyadiyat/"
where msedge >nul 2>nul && (start "" msedge --app="%APP%" & exit /b)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%APP%" & exit /b)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%APP%" & exit /b)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%APP%" & exit /b)
start "" "%APP%"
