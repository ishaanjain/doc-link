# PDF Text Converter

A web application that allows users to upload PDF files and convert them to text format.

## Project Structure

```
.
├── backend/           # Python FastAPI backend
│   └── main.py       # Backend server implementation
├── frontend/         # React frontend
│   └── project/      # Frontend application
└── requirements.txt  # Python dependencies
```

## Setup Instructions

### Backend Setup

1. Create a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```
   The backend will run on http://localhost:8000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend/project
   ```

2. Install Node.js dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:5173

## Features

- Upload up to 2 PDF files
- Convert PDFs to text format
- View and download converted text files
- Modern UI with drag-and-drop support

## API Endpoints

- POST `/api/convert`: Upload and convert PDF files
  - Accepts up to 2 PDF files
  - Returns converted text content and metadata 