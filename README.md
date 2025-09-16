# 📡 QuantumDesk Backend API Endpoints

جميع الـ Endpoints الخاصة بالـ Backend.  
الـ Routes المحمية تتطلب إضافة Header بالشكل التالي:


---

## 🔑 Auth
| Method | Endpoint              | Protected | Description              |
|--------|-----------------------|-----------|--------------------------|
| POST   | `/api/auth/register`  | ❌        | Register new user        |
| POST   | `/api/auth/login`     | ❌        | Login & return JWT       |
| GET    | `/api/auth/profile`   | ✅        | Get user profile         |

---

## 📝 Posts
| Method | Endpoint            | Protected | Description                 |
|--------|---------------------|-----------|-----------------------------|
| GET    | `/api/posts`        | ❌        | Get all posts               |
| POST   | `/api/posts`        | ✅        | Create new post             |
| GET    | `/api/posts/:id`    | ❌        | Get single post             |
| DELETE | `/api/posts/:id`    | ✅        | Delete post (owner only)    |

---

## 💬 Comments
| Method | Endpoint                 | Protected | Description               |
|--------|--------------------------|-----------|---------------------------|
| POST   | `/api/comments/:postId`  | ✅        | Add comment to post       |
| GET    | `/api/comments/:postId`  | ❌        | Get comments for a post   |
| DELETE | `/api/comments/:id`      | ✅        | Delete comment            |

---

## 💌 Chats & Messages
| Method | Endpoint                   | Protected | Description               |
|--------|----------------------------|-----------|---------------------------|
| POST   | `/api/chats`               | ✅        | Start new chat            |
| GET    | `/api/chats`               | ✅        | Get user chats            |
| POST   | `/api/messages/:chatId`    | ✅        | Send message              |
| GET    | `/api/messages/:chatId`    | ✅        | Get messages in a chat    |

---

## 🔔 Notifications
| Method | Endpoint                          | Protected | Description               |
|--------|-----------------------------------|-----------|---------------------------|
| GET    | `/api/notifications`              | ✅        | Get user notifications    |
| PUT    | `/api/notifications/:id/read`     | ✅        | Mark notification as read |

---

## ⚖️ Moderation
| Method | Endpoint                   | Protected | Description              |
|--------|----------------------------|-----------|--------------------------|
| POST   | `/api/moderation/review`   | ✅        | Review content (post/comment) |

---

## 👤 Users
| Method | Endpoint            | Protected | Description             |
|--------|---------------------|-----------|-------------------------|
| GET    | `/api/users/:id`    | ❌        | Get user profile        |
| PUT    | `/api/users/:id`    | ✅        | Update user profile     |
| DELETE | `/api/users/:id`    | ✅        | Delete user account     |




