# Meteor Madness FastAPI Server

This is a basic FastAPI server for the Meteor Madness AI-based Meteor deflection system.

## Setup

The server is configured to run in a Python virtual environment with the following dependencies:
- FastAPI
- Uvicorn (ASGI server)
- Python-multipart

## Running the Server

### Option 1: Using the start script
```bash
./start_server.sh
```

### Option 2: Manual start
```bash
# From the project root directory
source .venv/bin/activate
cd server
python main.py
```

### Option 3: Using uvicorn directly
```bash
# From the server directory
uvicorn main:app --host 0.0.0.0 --port 8001 --reload
```

## API Endpoints

Once the server is running, you can access:

- **Server**: http://localhost:8001
- **API Documentation**: http://localhost:8001/docs
- **Alternative API Docs**: http://localhost:8001/redoc

### Available Endpoints

- `GET /` - Root endpoint with welcome message
- `GET /health` - Health check endpoint
- `GET /meteors` - Example endpoint for meteor data
- `POST /meteor/analyze` - Example POST endpoint for meteor analysis

## Development

The server runs with auto-reload enabled, so changes to the code will automatically restart the server during development.

## Virtual Environment

The server uses a Python virtual environment located at `../.venv/` relative to the server directory. All dependencies are isolated within this environment.