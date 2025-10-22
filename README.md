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
- Framer Motion (animations)
- React Context API
- Lucide React (icons)

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
│   │   ├── Home.tsx        # Infinite scroll feed with For You/Following tabs
│   │   ├── Article.tsx     # Post detail with comments
│   │   ├── New.tsx         # Create post with image upload
│   │   ├── Edit.tsx        # Edit post
│   │   ├── Profile.tsx     # User profile with Posts/Comments tabs + followers/following modal
│   │   ├── Search.tsx      # User search page
│   │   ├── Login.tsx       # User login
│   │   ├── Register.tsx    # User registration
│   │   └── NotFound.tsx    # 404 page
│   ├── components/         # Reusable components
│   │   ├── post/           # Post-related components
│   │   ├── comment/        # Comment-related components
│   │   ├── user/           # User-related components
│   │   │   └── UserListModal.tsx  # Followers/Following list modal
│   │   └── ProtectedRoute.tsx
│   ├── contexts/           # React Context
│   │   └── AuthContext.tsx # Authentication state
│   ├── services/           # API service layer
│   │   ├── api/            # API configuration
│   │   ├── postService.ts
│   │   ├── commentService.ts
│   │   ├── authService.ts
│   │   └── userService.ts
│   ├── hooks/              # Custom React hooks
│   │   └── useInfiniteScroll.ts
│   ├── types/              # TypeScript type definitions
│   │   ├── post.ts
│   │   ├── comment.ts
│   │   └── user.ts
│   └── utils/              # Utility functions
│       └── dateFormat.ts
├── backend/
│   ├── main.py             # FastAPI application
│   ├── routers/            # API route modules
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── posts.py        # Post endpoints
│   │   ├── users.py        # User endpoints
│   │   └── comments.py     # Comment endpoints
│   ├── core/               # Core utilities
│   │   ├── database.py     # MongoDB connection
│   │   ├── security.py     # JWT authentication
│   │   └── exceptions.py   # Custom exceptions
│   ├── models/             # Pydantic models
│   ├── utils/              # Helper functions
│   ├── seed_data.py        # Dummy data generation script
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
- **Optional authentication** - non-logged-in users can browse posts
- Password hashing with bcrypt

### Post Management
- Create, read, update, delete posts (CRUD)
- **Image upload and display** (single image per post, base64 encoding)
- **500 character limit** for post content
- Infinite scroll feed with pagination
- **Persistent like state** - likes maintained across page navigation
- **Like toggle system** (one like per user, prevent duplicates)
- Author information display with profile links
- Edit/Delete permissions (author only)
- Search and sorting (by date, likes, comments)

### Social Features
- **User profiles** with Posts and Comments tabs
- **User search** with real-time filtering
- **Follow/Unfollow system** with follower/following counts
- **Followers/Following list modal** - click counts to see detailed user lists
- **Follow within modal** - follow/unfollow directly from the user list
- **For You / Following feed tabs** - view all posts or only from followed users
- Profile navigation from author names
- **Non-authenticated browsing** - view profiles without login

### Comment System
- Create and delete comments
- **Comment like functionality with persistent state**
- **Visual like indicator** (❤️/🤍 emoji toggle)
- Author information display with profile links
- Delete permissions (author only)
- Real-time comment count

### UI/UX Design
- **Glassmorphism design system** - modern frosted glass effect
- **Instagram/X-inspired dark theme** with purple-pink gradients
- **Framer Motion animations** - smooth page transitions and interactions
- **Animated tab navigation** - For You/Following and Profile tabs
- **Sticky headers** with backdrop blur effects
- **Gradient avatars** with first letter of username
- **Modern action bars** with glassmorphic styling
- **Responsive design** optimized for all screen sizes
- Type-safe API communication
- Loading states and error handling
- Optimized performance with custom hooks

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (sets refresh token cookie)
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout (clears refresh token cookie)
- `GET /api/auth/me` - Get current user info

### Posts
- `GET /api/posts?page={page}&limit={limit}&q={query}&sort={sort}` - Get posts with pagination, search, and sorting
- `GET /api/posts/following?page={page}&limit={limit}&sort={sort}` - Get posts from followed users (requires auth)
- `GET /api/posts/{id}` - Get single post
- `POST /api/posts` - Create post with optional image (requires auth)
- `PUT /api/posts/{id}` - Update post (requires auth, author only)
- `PATCH /api/posts/{id}/like` - Toggle like on post (requires auth)
- `DELETE /api/posts/{id}` - Delete post (requires auth, author only)

### Users
- `GET /api/users/search?q={query}` - Search users by username (excludes current user if authenticated)
- `GET /api/users/{user_id}` - Get user profile with follower/following counts
- `GET /api/users/{user_id}/posts?page={page}&limit={limit}` - Get user's posts
- `GET /api/users/{user_id}/comments?page={page}&limit={limit}` - Get user's comments
- `GET /api/users/{user_id}/followers` - Get user's followers list (optional auth for isFollowing status)
- `GET /api/users/{user_id}/following` - Get users that this user follows (optional auth for isFollowing status)
- `POST /api/users/{user_id}/follow` - Follow user (requires auth)
- `DELETE /api/users/{user_id}/follow` - Unfollow user (requires auth)

### Comments
- `GET /api/posts/{post_id}/comments` - Get comments for a post
- `POST /api/posts/{post_id}/comments` - Create comment (requires auth)
- `PATCH /api/comments/{comment_id}/like` - Toggle like on comment (requires auth)
- `DELETE /api/comments/{comment_id}` - Delete comment (requires auth, author only)

## Testing the Application

1. **Register and login**
   - Navigate to `/register`
   - Fill in username, email, and password
   - Auto-login after registration

2. **Create posts**
   - Click "New Post" in the header (requires login)
   - Write title and content
   - Optionally upload an image
   - Submit to create

3. **Browse and interact**
   - Browse posts in the **For You** feed (all posts)
   - Like posts (toggle like by clicking again)
   - Click a post to view details
   - Add and like comments (requires login)
   - Sort by date, likes, or comments

4. **User profiles and social features**
   - Click on any username to view their profile
   - See their posts and comments in separate tabs
   - Follow/Unfollow users
   - View follower/following counts
   - **Click on Followers/Following counts** to see detailed user lists
   - Follow/Unfollow directly from the modal

5. **Search and follow**
   - Use the search page to find users
   - Follow users you're interested in
   - Switch to **Following** tab to see posts from followed users only

6. **Edit and delete**
   - Only your own posts show Edit/Delete buttons
   - Only your own comments show Delete button
   - Edit posts with updated content or images

7. **Test permissions**
   - Logout to see protected routes redirect to login
   - Try accessing `/new` without auth
   - Verify you can't edit/delete other users' content

## Dummy Data Generation

To populate the database with test data for development:

```bash
cd backend
python seed_data.py
```

This generates:
- 10 test users (user0@example.com to user9@example.com, password: password123)
- 100 posts with realistic content
- 300 comments
- Random follow relationships
- Random likes on posts and comments
- Database indexes for performance

## Learning Resources

For detailed architecture and development guidance, see [CLAUDE.md](./CLAUDE.md)

## License

This is a personal learning project.
