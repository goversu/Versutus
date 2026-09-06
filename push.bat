@echo off
SETLOCAL EnableDelayedExpansion

:: Change to the directory containing this batch file
cd /d "%~dp0"

:: Ensure git is accessible even if PATH hasn't refreshed in the current session
where git >nul 2>nul
if errorlevel 1 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        SET "PATH=%PATH%;C:\Program Files\Git\cmd"
    ) else (
        echo [ERROR] Git was not found in PATH or at "C:\Program Files\Git\cmd\git.exe".
        echo Please ensure Git is installed.
        pause
        exit /b 1
    )
)

SET BRANCH=main

echo Checking for changes...
git add -A

:: Check if there are staged changes to commit
git diff --cached --quiet
if errorlevel 1 (
    SET "msg=Auto-commit %date% %time%"
    echo Committing changes: !msg!
    git commit -m "!msg!"
    
    echo Syncing with GitHub - pulling latest remote changes...
    git pull --rebase origin %BRANCH%
    
    echo Pushing changes to GitHub...
    git push origin %BRANCH%
) else (
    echo No local changes detected to commit.
)

echo.
echo Done!
pause
