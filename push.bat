@echo off
SET REPO_URL=https://github.com/goversu/Versutus.git
SET BRANCH=main

echo Adding changes...
git add .

echo Committing changes...
:: Using a timestamp for the commit message
SET msg=Auto-commit %date% %time%
git commit -m "%msg%"

echo Pushing to GitHub...
git branch -M main
git push --force %REPO_URL% %BRANCH%

echo Done!
pause