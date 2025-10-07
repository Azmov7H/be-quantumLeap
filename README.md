## QuantumDesk Backend (Node/Express)

Backend API for QuantumDesk social features: authentication, posts, comments, chats/messages, notifications, and user profiles with real-time updates via Socket.io and media uploads via Cloudinary.

### How to run locally
1) Copy `.env.example` to `.env` and fill values.
2) Install deps: `npm install`
3) Start dev server: `npm start`

Server listens on `PORT` (default 5000). CORS is restricted to `FRONTEND_URL`.

### Tech
- Express, Mongoose, JWT, Multer + Cloudinary, Socket.io, Helmet, CORS, Morgan

## Environment variables
Create a `.env` with the following keys:

```
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-strong-secret
FRONTEND_URL=http://localhost:3000

CLOUDINARY_CLOUD_NAME=xxxx
CLOUDINARY_API_KEY=xxxx
CLOUDINARY_API_SECRET=xxxx
```

Notes:
- `MONGODB_URI` is required by `config/db.js`.
- `JWT_SECRET` is required by `middlewares/auth.js` and auth controllers.
- `FRONTEND_URL` is used by CORS in `server.js` and by Socket.io in `socket.js`.
- Cloudinary vars are required for file uploads.

## Installation / Scripts

```
npm install
npm start
npm test        # placeholder (no tests configured)
```

package.json highlights:
- main: `server.js`
- scripts:
  - `start`: `nodemon server.js`

## Authorization
- Protected routes require `Authorization: Bearer <JWT>` header.
- Admin-only routes additionally check `req.user.role === "admin"`.

## Routes

### Auth
- POST `/api/auth/register` (public)
  - Body: `{ username: string, email: string, password: string }`
  - 201: `{ msg, user, token }`
  - 400/409/500 on errors
  - cURL:
    ```bash
    curl -X POST http://localhost:5000/api/auth/register \
      -H "Content-Type: application/json" \
      -d '{"username":"alice","email":"a@x.com","password":"pass"}'
    ```

- POST `/api/auth/login` (public)
  - Body: `{ email: string, password: string }`
  - 200: `{ token, user }`

- GET `/api/auth/me` (requires JWT)
  - 200: user object sans password

- PUT `/api/auth/update` (requires JWT, multipart)
  - Fields: `username?`, `email?`, `password?`, `bio?`, `facebook?`, `linkedin?`, `whatsapp?`
  - File: `profileImage` (image)
  - 200: `{ msg: "Profile updated", user }`

### Posts
- GET `/api/posts` (public)
  - 200: approved posts list

- GET `/api/posts/:id` (public)
  - Path: `id` (ObjectId)
  - 200: post | 404

- POST `/api/posts` (requires JWT, multipart)
  - Body: `{ title: string, summary: string, content: string }`
  - File: `image` (image)
  - 201: created post

- PUT `/api/posts/:id` (requires JWT, multipart)
  - Owner or admin
  - Fields: `title?`, `summary?`, `content?`
  - File: `image` (image)
  - 200: updated post

- DELETE `/api/posts/:id` (requires JWT)
  - Owner or admin
  - 200 `{ msg: "Post deleted" }`

- PUT `/api/posts/:id/like` (requires JWT)
  - 200: updated likes array

- POST `/api/posts/:id/comment` (requires JWT)
  - Body: `{ text: string }`
  - 201: populated comment

- GET `/api/posts/:id/comments` (public)
  - 200: post comments

### Chats
- POST `/api/chats` (requires JWT)
  - Body: `{ userId: string }`
  - 200: chat document (created or existing)

- GET `/api/chats` (requires JWT)
  - 200: simplified chat list `{ _id, user, lastMessage, updatedAt }[]`

### Messages
- GET `/api/messages/:chatId` (requires JWT)
  - 200: messages array

- POST `/api/messages/:chatId` (requires JWT, multipart allowed)
  - Body: `{ content?: string }`
  - File: `media` (image)
  - 201: created message (populated)

### Notifications
- GET `/api/notifications` (requires JWT)
  - 200: notifications for current user

- PUT `/api/notifications/read` (requires JWT)
  - 200: `{ msg: "All notifications marked as read" }`

### Users
- GET `/api/users/me` (requires JWT)
  - 200: current user

- PUT `/api/users/me` (requires JWT, multipart)
  - File: `avatar` (image)
  - Fields: `username?`, `email?`, `bio?`, `facebook?`, `linkedin?`, `whatsapp?`
  - 200: `{ msg, user }`

- GET `/api/users/:id` (public)
  - 200: user sans password | 404

- POST `/api/users/:id/follow` (requires JWT)
  - 200: `{ msg: "Followed", followersCount }`

- POST `/api/users/:id/unfollow` (requires JWT)
  - 200: `{ msg: "Unfollowed", followersCount }`

### Moderation (route file exists; controller missing)
- GET `/api/moderation/pending` (requires JWT + admin)
- PUT `/api/moderation/approve/:id` (requires JWT + admin)
- PUT `/api/moderation/reject/:id` (requires JWT + admin)

Note: `controllers/moderationController.js` is missing. These endpoints will 404 until implemented and mounted in `server.js`.

## Example cURL (auth + posts)
```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"a@x.com","password":"pass"}' | jq -r .token)

# Create post
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -F title="Hello" -F summary="Sum" -F content="Body" \
  -F image=@/path/to/image.jpg
```

## Known issues & TODO
- Server start failed with EADDRINUSE on port 5000. Free the port or change `PORT`.
- `routes/moderationRoutes.js` references a missing `controllers/moderationController.js`.
- `server.js` does not mount `moderationRoutes`.
- No lint/test scripts configured; `npm test` is placeholder.

## Commits & Branching
- Branch: `feature/docs-routes` for docs; `fix/<short-desc>` for fixes.
- Conventional commits recommended: `type(scope): short description`
  - Examples:
    - `docs(readme): add full API route specs`
    - `fix(server): avoid EADDRINUSE by honoring PORT env`
    - `feat(moderation): implement pending/approve/reject endpoints`

