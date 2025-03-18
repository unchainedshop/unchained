#!/bin/sh
# Wait for database
echo "Waiting for Postgres to start..."
sleep 10

# Start Medusa server
echo "Starting Medusa server..."
# Directly use Node to run the server instead of using the CLI
cd /app
node node_modules/@medusajs/medusa/dist/app.js 