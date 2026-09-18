#!/bin/sh
# Comptasse CLI installer for macOS and Linux
# Usage: curl -fsSL https://comptasse.com/cli/install.sh | sh
set -e

REPO="comptasse/comptasse"
INSTALL_DIR="${COMPTASSE_INSTALL_DIR:-$HOME/.local/bin}"
DEST="${INSTALL_DIR}/comptasse"

command -v curl >/dev/null 2>&1 || { echo "Error: curl is required."; exit 1; }

URL="https://github.com/${REPO}/releases/latest/download/comptasse.sh"
VERSION_URL="https://github.com/${REPO}/releases/latest/download/version"

echo "Downloading comptasse CLI..."
mkdir -p "$INSTALL_DIR"
curl -fsSL --progress-bar "$URL" -o "$DEST"
# The version file is generated from root VERSION and ships next to the CLI;
# comptasse.sh reads it at runtime. Older releases may lack it, so fetch is non-fatal.
if curl -fsSL --progress-bar "$VERSION_URL" -o "${INSTALL_DIR}/version" 2>/dev/null; then
  :
else
  echo "Note: version metadata not available for this release; 'comptasse --version' will report 'unknown'. Reinstall to refresh."
fi
chmod +x "$DEST"

echo "Installed: $DEST"
echo "Version:   $($DEST --version)"

# ── PATH hint ─────────────────────────────────────────────────────────────────
case ":$PATH:" in
    *":${INSTALL_DIR}:"*)
        echo "Run: comptasse --help"
        ;;
    *)
        printf '\nAdd to PATH: export PATH="$HOME/.local/bin:$PATH"\n'
        printf 'Then reload your shell, or run: source ~/.bashrc\n'
        ;;
esac

