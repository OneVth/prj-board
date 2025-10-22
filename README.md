# Board Project - Learning TypeScript & FastAPI

A modern social media-inspired board/forum web application built from scratch to learn TypeScript and FastAPI. Features a complete authentication system, post management, and real-time commenting with Instagram/X-inspired dark theme UI.

## Learning Objectives

This project is created for hands-on practice with:

- **TypeScript** - Frontend development with React and TypeScript
- **FastAPI** - Modern Python web framework for building RESTful APIs
- **JWT Authentication** - Secure user authentication with access/refresh tokens
- **MongoDB** - NoSQL database with async operations
- **Modern UI/UX** - Instagram/X-inspired dark theme design
- **State Management** - React Context API for global authentication state

## Tech Stack

### Frontend

- React 18
- TypeScript
- Vite
- React Router v7
- TailwindCSS v4
- React Context API

### Backend

- FastAPI
- MongoDB (Motor async driver)
- Python 3.11+
- JWT (python-jose)
- Passlib (bcrypt)

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

4. **Environment setup**

Create a `.env` file in the `backend` directory:

```env
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DATABASE_NAME=board_db

# JWT Configuration
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
```

5. **Start MongoDB**

```bash
docker-compose up -d
```

6. **Start backend server**

```bash
cd backend
python -m uvicorn main:app --reload
```

7. **Start frontend dev server**

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
│   ├── pages/              # Page components
│   │   ├── Home.tsx        # Infinite scroll feed
│   │   ├── Article.tsx     # Post detail with comments
│   │   ├── New.tsx         # Create post
│   │   ├── Edit.tsx        # Edit post
│   │   ├── Login.tsx       # User login
│   │   ├── Register.tsx    # User registration
│   │   └── NotFound.tsx    # 404 page
│   ├── components/         # Reusable components
│   │   ├── post/           # Post-related components
│   │   ├── comment/        # Comment-related components
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx # Authentication state
│   ├── services/           # API service layer
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   └── authService.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── post.ts
│   │   ├── comment.ts
│   │   └── user.ts
│   └── utils/              # Utility functions
│       └── dateFormat.ts
├── backend/
│   ├── main.py             # FastAPI application
│   ├── auth.py             # JWT authentication utilities
│   ├── .env                # Environment variables
│   └── requirements.txt
├── docker-compose.yml      # MongoDB configuration
├── CLAUDE.md               # Development documentation
└── README.md
```

## Key Features

### Authentication & Authorization
- User registration and login with JWT
- Access token (15 min) + Refresh token (7 days) strategy
- Access tokens in memory, Refresh tokens in HTTPOnly cookies
- Protected routes for authenticated users only
- Password hashing with bcrypt

### Post Management
- Create, read, update, delete posts (CRUD)
- Infinite scroll feed with pagination
- Like functionality
- Author information display
- Edit/Delete permissions (author only)

### Comment System
- Create and delete comments
- Author information display
- Delete permissions (author only)
- Real-time comment count

### UI/UX
- Instagram/X-inspired dark theme
- Responsive design
- Type-safe API communication
- Loading states and error handling
- Smooth transitions and animations

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (sets refresh token cookie)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (clears refresh token cookie)
- `GET /api/auth/me` - Get current user info

### Posts
- `GET /api/posts?page={page}&limit={limit}` - Get posts with pagination
- `GET /api/posts/{id}` - Get single post
- `POST /api/posts` - Create post (requires auth)
- `PUT /api/posts/{id}` - Update post (requires auth, author only)
- `PATCH /api/posts/{id}/like` - Like post
- `DELETE /api/posts/{id}` - Delete post (requires auth, author only)

### Comments
- `GET /api/posts/{post_id}/comments` - Get comments for a post
- `POST /api/posts/{post_id}/comments` - Create comment (requires auth)
- `DELETE /api/comments/{comment_id}` - Delete comment (requires auth, author only)

## Testing the Application

1. **Register a new user**
   - Navigate to `/register`
   - Fill in username, email, and password
   - Auto-login after registration

2. **Create a post**
   - Click "New Post" in the header (requires login)
   - Write title and content
   - Submit to create

3. **View and interact**
   - Browse posts in the home feed
   - Click a post to view details
   - Like posts
   - Add comments (requires login)

4. **Edit/Delete**
   - Only your own posts show Edit/Delete buttons
   - Only your own comments show Delete button

5. **Logout and test permissions**
   - Logout to see protected routes redirect to login
   - Try accessing `/new` without auth

## Learning Resources

For detailed architecture and development guidance, see [CLAUDE.md](./CLAUDE.md)

## License

This is a personal learning project.
