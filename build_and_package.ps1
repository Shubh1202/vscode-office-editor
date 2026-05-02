Write-Host "--- Starting Production Build ---" -ForegroundColor Cyan

# 1. Fresh Compile
Write-Host "[1/2] Compiling code..." -ForegroundColor Yellow
npm run compile

if ($LASTEXITCODE -ne 0) {
    Write-Host "Compilation failed. Please check errors above." -ForegroundColor Red
    exit
}

# 2. Package
Write-Host "[2/2] Creating VSIX installer..." -ForegroundColor Yellow
npx vsce package

Write-Host "--- Success! ---" -ForegroundColor Green
Write-Host "You can now install the .vsix file to test your extension."
