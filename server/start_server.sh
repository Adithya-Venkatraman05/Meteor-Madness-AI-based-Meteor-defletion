#!/bin/bash

# Script to start the FastAPI server in the virtual environment

echo "Starting Meteor Madness FastAPI Server..."
echo "Virtual environment: .venv"
echo "Server will be available at: http://localhost:8001"
echo "API documentation will be available at: http://localhost:8001/docs"
echo ""

# Change to server directory
cd "$(dirname "$0")"

# Activate virtual environment and run the server
source ../.venv/bin/activate
python main.py