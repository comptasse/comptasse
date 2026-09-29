#!/bin/sh
set -eu

# Build the production images, then run the full test pipeline against a fresh
# environment (see .scripts/test.sh).
just build ci
bash .scripts/test.sh
