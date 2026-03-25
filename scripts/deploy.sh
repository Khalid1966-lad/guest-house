#!/bin/bash
MODE=${1:-preview}
BRANCH_NAME="preview/current"

switch_to_postgres() {
    sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
    sed -i '/directUrl/d' prisma/schema.prisma
}

switch_to_sqlite() {
    sed -i 's/provider = "postgresql"/provider = "sqlite"/' prisma/schema.prisma
}

case $MODE in
    preview)
        echo "🚀 Deploying PREVIEW..."
        CURRENT_BRANCH=$(git branch --show-current)
        git checkout -B $BRANCH_NAME
        switch_to_postgres
        git add -A && git commit -m "Preview update" --allow-empty
        git push origin $BRANCH_NAME --force
        echo "✅ Preview deployed!"
        git checkout $CURRENT_BRANCH 2>/dev/null || git checkout master
        switch_to_sqlite
        ;;
    production)
        echo "🚀 Deploying PRODUCTION..."
        git checkout master
        switch_to_postgres
        git add -A && git commit -m "Production update" --allow-empty
        git push origin master
        echo "✅ Production deployed!"
        switch_to_sqlite
        ;;
esac
