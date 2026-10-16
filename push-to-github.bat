@echo off
echo ========================================================
echo Pushing Cal-C to https://github.com/randomboss-67/Cal-C
echo ========================================================
git push -u origin main
if %ERRORLEVEL% equ 0 (
    echo.
    echo [SUCCESS] Pushed successfully to GitHub!
    echo Check GitHub Actions: https://github.com/randomboss-67/Cal-C/actions
) else (
    echo.
    echo [NOTE] If you were prompted to sign in, please complete the GitHub authentication in your browser and try again.
)
pause
