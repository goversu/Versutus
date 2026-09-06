@echo off
SETLOCAL EnableDelayedExpansion

:: Ensure git is accessible even if PATH hasn't refreshed in the current session
where git >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "C:\Program Files\Git\cmd\git.exe" (
        SET "PATH=%PATH%;C:\Program Files\Git\cmd"
    ) else (
        echo [ERROR] Git was not found in PATH or at "C:\Program Files\Git\cmd\git.exe".
        echo Please ensure Git is installed.
        pause
        exit /b 1
    )
)

SET REPO_URL=https://github.com/goversu/Versutus.git
SET BRANCH=main

echo ========================================================
echo  Linking Local Folder to Online GitHub Repository
echo ========================================================

:: Initialize local repository with default branch main
if not exist ".git" (
    echo [1/5] Initializing local repository...
    git init -b %BRANCH%
) else (
    echo [1/5] Local repository already initialized.
)

:: Configure remote origin
echo [2/5] Connecting to remote repository (%REPO_URL%)...
git remote remove origin >nul 2>nul
git remote add origin %REPO_URL%

:: Fetch history from GitHub
echo [3/5] Fetching existing commits from GitHub...
git fetch origin %BRANCH%
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to fetch from %REPO_URL%.
    echo Please check your internet connection and GitHub repository permissions.
    pause
    exit /b 1
)

:: Align branch with remote commit history without modifying local files
echo [4/5] Syncing branch tracking with GitHub history...
git reset origin/%BRANCH%
git branch -u origin/%BRANCH% %BRANCH%

:: Check if there are any local edits differing from GitHub
echo [5/5] Checking for local changes...
git status --porcelain > "%temp%\git_status_check.txt"
set /p STATUS_CHECK=<"%temp%\git_status_check.txt"
del "%temp%\git_status_check.txt" >nul 2>nul

if defined STATUS_CHECK (
    echo Local changes/new files detected. Staging and committing...
    git add .
    git commit -m "Sync local changes from new device: %date% %time%"
    echo Pushing changes to GitHub...
    git push origin %BRANCH%
) else (
    echo Your local files already match the online repository.
)

echo.
echo ========================================================
echo  Successfully linked to GitHub!
echo  From now on, just double-click push.bat when you update files.
echo ========================================================
pause
