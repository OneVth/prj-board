# Board Project - Learning TypeScript & FastAPI

A modern social media-inspired board/forum web application built from scratch to learn TypeScript and FastAPI.

## Learning Objectives

This project is created for hands-on practice with:

- **TypeScript** - Frontend development with React and TypeScript
- **FastAPI** - Modern Python web framework for building APIs
- **MongoDB** - NoSQL database with async operations
- **Modern UI/UX** - Instagram/X-inspired dark theme design

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router v7
- TailwindCSS v4

### Backend

- FastAPI
- MongoDB (Motor async driver)
- Python 3.11+

### Development Tools

- Docker (MongoDB container)
- ESLint
- Uvicorn

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker Desktop

### Installation

1. **Clone and navigate to project**

```bash
cd prj-board
```

2. **Frontend setup**

```bash
npm install
```

3. **Backend setup**

```bash
cd backend
pip install -r requirements.txt
```

4. **Start MongoDB**

```bash
docker-compose up -d
```

5. **Start backend server**

```bash
cd backend
python -m uvicorn main:app --reload
```

6. **Start frontend dev server**

```bash
npm run dev
```

Access the application at `http://localhost:5173`

## Development Commands

### Frontend

```bash
npm run dev             # Start dev server
npm run build           # Build for production
npm run lint            # Run ESLint
npm run preview         # Preview production build
```

### Backend

```bash
cd backend
python -m uvicorn main:app --reload              # Start on port 8000
python -m uvicorn main:app --reload --port 8001  # Start on alternate port
```

### Database

```bash
docker-compose up -d    # Start MongoDB
docker-compose down     # Stop MongoDB
```

## Project Structure

```
prj-board/
├── src/
│   ├── pages/          # Page components
│   ├── services/       # API service layer
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions
├── backend/
│   ├── main.py         # FastAPI application
│   └── requirements.txt
├── docker-compose.yml  # MongoDB configuration
└── README.md
```

## Key Features

- Infinite scroll feed
- Post creation and editing
- Like functionality
- Instagram/X-inspired dark theme UI
- Responsive design
- Type-safe API communication

## Learning Resources

For detailed architecture and development guidance, see [CLAUDE.md](./CLAUDE.md)

## License

This is a personal learning project.
