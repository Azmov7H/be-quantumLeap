# Issues Report

## 1) Server fails to start locally: EADDRINUSE :5000

- Description: Running `npm start` throws `Error: listen EADDRINUSE: address already in use :::5000`.
- Steps to Reproduce:
  1. `npm install`
  2. `npm start`
  3. Observe error stack showing port 5000 in use
- Suspected Files: `server.js`
- Workarounds:
  - Temporary: set a different port `PORT=5050` in a `.env` file.
  - Permanent: document port configuration in README; optionally add auto-retry or choose a free port when 5000 is occupied.

## 2) render.yaml start command points to non-existent path

- Description: `render.yaml` uses `startCommand: "node src/server.js"` but the entry is `server.js` in project root.
- Steps to Reproduce: Attempt deploy using current `render.yaml`.
- Suspected Files: `render.yaml`
- Proposed Fixes:
  - Temporary: change to `startCommand: "node server.js"`.
  - Long-term: align project structure (move `server.js` to `src/server.js`) or update render config accordingly.

## 3) Mongoose deprecated options warnings

- Description: Warnings for `useNewUrlParser` and `useUnifiedTopology` in `mongoose.connect`.
- File: `config/db.js`
- Proposed Fix:
  - Remove deprecated options and rely on defaults:
    ```
    await mongoose.connect(process.env.MONGODB_URI);
    ```

## 4) Missing `.env.example`

- Description: No example environment file tracked; onboarding friction.
- Proposed Fix:
  - Add `.env.example` containing: `PORT`, `FRONTEND_URL`, `MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`.
  - Status: Blocked by ignore rules; needs maintainer to add file manually.

## 6) Moderation controllers missing and router not mounted

- Description: `routes/moderationRoutes.js` references `controllers/moderationController.js` which does not exist. Also `server.js` does not mount `moderationRoutes`.
- Impact: All moderation endpoints 404.
- Proposed Fixes:
  - Temporary: Remove moderation route import from docs or mark as unavailable.
  - Permanent: Implement `getPendingPosts`, `approvePost`, `rejectPost` in `controllers/moderationController.js` and mount `app.use("/api/moderation", moderationRoutes)` in `server.js`.

## 5) Socket uses `Post` without import (fixed)

- Description: `socket.js` referenced `Post` in `likePost` without import, causing runtime error.
- Fix Applied: Added `import Post from "./models/Post.js";` to `socket.js`.


