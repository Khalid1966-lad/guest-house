#!/bin/bash
# Version management script
# Usage: ./scripts/version.sh <version> [description]
# Example: ./scripts/version.sh v1.9.2 "Fix invoice dropdown"

if [ -z "$1" ]; then
    echo "Usage: ./scripts/version.sh <version> [description]"
    echo "Example: ./scripts/version.sh v1.9.2 \"Fix invoice dropdown\""
    exit 1
fi

VERSION=$1
DESCRIPTION=${2:-"Release $VERSION"}
DATE=$(date +%Y-%m-%d)
YEAR=$(date +%Y)

# Update version file
cat > src/lib/version.ts << EOF
// This file is auto-updated by the version script
// Do not edit manually - use: bun run version <version>

export const APP_VERSION = "$VERSION"
export const VERSION_DATE = "$DATE"
export const VERSION_NAME = "$DESCRIPTION"
export const COPYRIGHT_YEAR = $YEAR
EOF

echo "Updated version to $VERSION"
echo "Date: $DATE"
echo "Description: $DESCRIPTION"
echo ""
echo "Don't forget to:"
echo "1. git add src/lib/version.ts"
echo "2. git commit -m 'Bump version to $VERSION'"
echo "3. git tag -a $VERSION -m '$DESCRIPTION'"
echo "4. git push origin master --tags"
