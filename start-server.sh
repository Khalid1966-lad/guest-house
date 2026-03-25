#!/bin/bash
cd /home/z/my-project
while true; do
    echo "Starting Next.js server..."
    node node_modules/.bin/next dev -p 3000
    echo "Server stopped, restarting in 2 seconds..."
    sleep 2
done
