# Install Arduino CLI on Windows (run in PowerShell as Administrator if needed)
Write-Host "Installing Arduino CLI..." -ForegroundColor Cyan

$winget = Get-Command winget -ErrorAction SilentlyContinue
if ($winget) {
  winget install --id ArduinoSA.CLI -e --accept-source-agreements --accept-package-agreements
} else {
  Write-Host "winget not found. Download from https://arduino.github.io/arduino-cli/" -ForegroundColor Yellow
  exit 1
}

$cli = Get-Command arduino-cli -ErrorAction SilentlyContinue
if (-not $cli) {
  $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
}

Write-Host "Installing Arduino AVR core (Uno/Nano/Mega)..." -ForegroundColor Cyan
arduino-cli core update-index
arduino-cli core install arduino:avr

Write-Host "Installing ESP32 core..." -ForegroundColor Cyan
arduino-cli config add board_manager.additional_urls https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
arduino-cli core update-index
arduino-cli core install esp32:esp32

Write-Host "Done. Verify with: arduino-cli version" -ForegroundColor Green
arduino-cli version
