# SocialSphere 🌐

A premium, full-featured social media platform with a stunning glassmorphism UI, built with the MERN stack.

LIVE DEMO: https://codealpha-socialmediaplatform-fsi1.onrender.com/ 
## ✨ Features

- **Authentication** — JWT-based secure auth with bcrypt password hashing
- **User Profiles** — Customizable profiles with avatar, bio, and cover photo
- **Posts** — Create, edit, delete posts with image uploads
- **Like System** — Like/unlike posts with real-time updates
- **Comments** — Add, edit, delete comments on posts
- **Follow System** — Follow/unfollow users, track followers & following
- **Search** — Search users, posts, and hashtags
- **Notifications** — Real-time notifications for likes, follows, and comments
- **Dark Mode** — Toggle between light and dark themes
- **Responsive Design** — Mobile-first, works on all devices
- **Glassmorphism UI** — Modern purple & blue gradient glass design
- **Loading Skeletons** — Smooth skeleton loading animations
- **Toast Notifications** — Elegant toast messages for user feedback
- **Image Preview** — Preview images before uploading
- **Infinite Scroll** — Seamless pagination experience

## 🛠 Tech Stack

| Layer    | Technology                |
|----------|---------------------------|
| Frontend | HTML5, CSS3, Vanilla JS   |
| Backend  | Node.js, Express.js       |
| Database | MongoDB Atlas + Mongoose  |
| Auth     | JWT, bcrypt               |
| Uploads  | Multer                    |

## 📁 Project Structure

```
SocialSphere/
├── backend/
│   ├── config/          # Database & app configuration
│   ├── controllers/     # Route handlers
│   ├── middleware/      # Auth, error handling, validation
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── uploads/         # Image upload directory
│   └── server.js        # Express app entry point
├── client/
│   ├── css/             # Stylesheets
│   ├── js/              # Frontend JavaScript
│   └── *.html           # HTML pages
├── .env.example         # Environment variables template
├── package.json         # Dependencies & scripts
└── README.md            # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js v16+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd SocialSphere
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your MongoDB Atlas connection string and a JWT secret.

4. **Generate a JWT secret**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and set it as `JWT_SECRET` in your `.env` file.

5. **Start the server**
   ```bash
   npm start
   ```

6. **Open the app**
   Navigate to [http://localhost:5000](http://localhost:5000)

## 📡 API Endpoints

### Authentication
| Method | Endpoint              | Description        |
|--------|-----------------------|--------------------|
| POST   | /api/auth/register    | Register a new user |
| POST   | /api/auth/login       | Login user         |

### Users
| Method | Endpoint                  | Description          |
|--------|---------------------------|----------------------|
| GET    | /api/users/profile        | Get current profile  |
| PUT    | /api/users/profile        | Update profile       |
| GET    | /api/users/:id            | Get user by ID       |
| POST   | /api/users/follow/:id     | Follow a user        |
| DELETE | /api/users/unfollow/:id   | Unfollow a user      |
| GET    | /api/users/search?q=      | Search users         |

### Posts
| Method | Endpoint              | Description         |
|--------|-----------------------|---------------------|
| GET    | /api/posts            | Get all posts       |
| GET    | /api/posts/:id        | Get single post     |
| POST   | /api/posts            | Create a post       |
| PUT    | /api/posts/:id        | Update a post       |
| DELETE | /api/posts/:id        | Delete a post       |
| POST   | /api/posts/:id/like   | Like a post         |
| DELETE | /api/posts/:id/unlike | Unlike a post       |

### Comments
| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | /api/posts/:id/comment      | Add comment          |
| PUT    | /api/comments/:id           | Edit comment         |
| DELETE | /api/comments/:id           | Delete comment       |

### Notifications
| Method | Endpoint                       | Description                |
|--------|--------------------------------|----------------------------|
| GET    | /api/notifications             | Get user notifications     |
| PUT    | /api/notifications/read/:id    | Mark notification as read  |

## 🌐 Deployment (Render)

1. Push the project to a GitHub repository
2. On Render, create a new **Web Service**
3. Connect your GitHub repository
4. Set:
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
5. Add environment variables from `.env.example`
6. Deploy!

## 📸 Screenshots

> *Screenshots coming soon*

## 👨‍💻 Contributing

Contributions are welcome! Please open an issue first to discuss changes.

## 📄 License

MIT — Free to use, modify, and distribute.
