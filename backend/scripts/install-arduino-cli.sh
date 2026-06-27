#!/usr/bin/env bash
# Install Arduino CLI on macOS without Homebrew — downloads the official binary.
set -euo pipefail

CLI_VERSION="${ARDUINO_CLI_VERSION:-1.2.2}"
INSTALL_DIR="${ARDUINO_CLI_INSTALL_DIR:-$HOME/.local/bin}"
PROJECT_BIN="$(cd "$(dirname "$0")/.." && pwd)/bin"

echo "==> Installing Arduino CLI v${CLI_VERSION} for macOS"

ARCH="$(uname -m)"
case "$ARCH" in
  arm64|aarch64) ASSET="arduino-cli_${CLI_VERSION}_macOS_ARM64.tar.gz" ;;
  x86_64)        ASSET="arduino-cli_${CLI_VERSION}_macOS_64bit.tar.gz" ;;
  *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

URL="https://github.com/arduino/arduino-cli/releases/download/v${CLI_VERSION}/${ASSET}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "==> Downloading ${URL}"
curl -fsSL "$URL" -o "$TMP/arduino-cli.tar.gz"
tar -xzf "$TMP/arduino-cli.tar.gz" -C "$TMP"
CLI_BIN="$TMP/arduino-cli"
chmod +x "$CLI_BIN"

mkdir -p "$INSTALL_DIR"
mkdir -p "$PROJECT_BIN"
cp "$CLI_BIN" "$INSTALL_DIR/arduino-cli"
cp "$CLI_BIN" "$PROJECT_BIN/arduino-cli"
chmod +x "$INSTALL_DIR/arduino-cli" "$PROJECT_BIN/arduino-cli"

export PATH="$INSTALL_DIR:$PROJECT_BIN:$PATH"

echo "==> Installed to:"
echo "    $INSTALL_DIR/arduino-cli"
echo "    $PROJECT_BIN/arduino-cli"
echo ""
echo "Add to your shell profile (~/.zshrc):"
echo "  export PATH=\"\$HOME/.local/bin:\$PATH\""
echo ""

"$INSTALL_DIR/arduino-cli" version

echo "==> Initializing config and board cores (this may take a few minutes)..."
"$INSTALL_DIR/arduino-cli" config init 2>/dev/null || true
"$INSTALL_DIR/arduino-cli" core update-index

echo "==> Installing Arduino AVR core (Uno/Nano/Mega)..."
"$INSTALL_DIR/arduino-cli" core install arduino:avr

echo "==> Installing ESP32 core..."
"$INSTALL_DIR/arduino-cli" config add board_manager.additional_urls \
  https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json 2>/dev/null || true
"$INSTALL_DIR/arduino-cli" core update-index
"$INSTALL_DIR/arduino-cli" core install esp32:esp32 || echo "    (ESP32 core install failed — retry later with: arduino-cli core install esp32:esp32)"

echo "==> Installing ESP8266 core..."
"$INSTALL_DIR/arduino-cli" config add board_manager.additional_urls \
  https://arduino.esp8266.com/stable/package_esp8266com_index.json 2>/dev/null || true
"$INSTALL_DIR/arduino-cli" core update-index
"$INSTALL_DIR/arduino-cli" core install esp8266:esp8266 || echo "    (ESP8266 core install failed — retry later)"

echo ""
echo "Done. Restart the backend server, then verify in Code Studio."
echo "  $INSTALL_DIR/arduino-cli version"
