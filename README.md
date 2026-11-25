# Issue Tracker System

A full-stack (MERN) issue tracking app with user and admin login, issue CRUD, assignment, status tracking, comments and a dashboard.

**Live URL (frontend):** https://issue-tracker-nine-brown.vercel.app  
**API URL (backend):** https://issue-tracker-xfli.onrender.com  
**GitHub:** https://github.com/psriraksha/issue-tracker

> Note: the backend is on a free Render plan, so the first request after a period of inactivity can take up to a minute.

## Features
- User registration and login (JWT); separate **Admin login** page (admin account is seeded from env vars)
- Create, edit and delete issues (a user manages own issues; admin manages all)
- Any user can choose who will solve an issue; only the admin can change the status (Open → In Progress → Closed)
- Privacy: a user sees only the issues they filed or that are assigned to them; the admin sees all issues
- Comments on issues
- Dashboard with counts: total, per status, assigned to me, unassigned
- Issue list with search, status filter and "assigned to me" filter

## Roles and Permissions
| Action | User | Admin |
|---|---|---|
| See issues | Only issues they filed or that are assigned to them | All issues |
| Create issue and choose who will solve it | Yes | Yes |
| Edit / delete issue (including changing the solver) | Own issues only | Any issue |
| Change status | No (view only) | Yes |
| Comment | On issues they can see | On any issue |
| Dashboard counts | Own issues | All issues |

Notes: an issue can only be given to a registered (non-admin) user or left unassigned. A user who is only the assignee (did not file the issue) can view and comment, but cannot edit or delete it. Requesting an issue you cannot see returns `404`. A newly registered user has filed no issues and been assigned none yet, so every dashboard count (total, per status, assigned to me, unassigned) starts at 0; counts update as soon as they create or are assigned an issue.

## Architecture
```
React (Vite) SPA  --HTTPS/JSON + JWT-->  Express REST API  --Mongoose-->  MongoDB Atlas
   (Vercel)                                  (Render)                       (cloud DB)
```
- `frontend/` – React 18, React Router, Axios
- `backend/` – Node.js, Express, Mongoose, bcryptjs, jsonwebtoken
- Comments are embedded in the Issue document; users are referenced by ObjectId.

## Tech Stack
React, Vite, React Router, Axios · Node.js, Express · MongoDB (Atlas), Mongoose · JWT, bcrypt · Vercel + Render

## Project Structure
```
backend/  server.js, models/, routes/, middleware/, .env.example
frontend/ src/ (App.jsx, pages.jsx, auth.jsx, api.js), vercel.json, .env.example
BRD.md    Business Requirements Document (incl. Deployment section)
```

## Local Setup
Prerequisites: Node.js 18+, a MongoDB Atlas (or local MongoDB) connection string.
```bash
# Backend
cd backend && npm install
cp .env.example .env        # fill in values
npm run dev                 # http://localhost:5000

# Frontend (new terminal)
cd frontend && npm install
cp .env.example .env
npm run dev                 # http://localhost:5173
```
Log in as admin at `/admin-login` using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend `.env`. Normal users register at `/register` and log in at `/login`; admin accounts cannot use the normal login and users cannot use the admin login.

## Environment Variables
**backend/.env**
| Name | Description |
|---|---|
| PORT | API port (default 5000; Render sets it automatically) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Long random secret for signing tokens |
| CLIENT_URL | Allowed frontend origin(s), comma-separated (CORS). Use `http://localhost:5173` locally; if unset, all origins are allowed |
| ADMIN_EMAIL / ADMIN_PASSWORD | Admin account, created on first start if it does not exist yet |

**frontend/.env**
| Name | Description |
|---|---|
| VITE_API_URL | Base URL of the backend (no trailing slash, no `/api`). Defaults to `http://localhost:5000` |

Never commit `.env` files (they are git-ignored); commit only the `.env.example` templates.

## API Details
All routes are prefixed `/api`. Protected routes need `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | /health | – | Health check |
| POST | /auth/register | – | Body: name, email, password (min 6) |
| POST | /auth/login | – | Body: email, password (normal users only) |
| POST | /auth/admin-login | – | Same as login, admin accounts only |
| GET | /auth/me | User | Current user |
| GET | /users | User | List registered (non-admin) users, used to choose who will solve an issue |
| GET | /issues | User | User sees own and assigned issues; admin sees all. Query: status, search, mine=true |
| POST | /issues | User | Body: title (required), description, priority, assignedTo (optional user id) |
| GET | /issues/:id | User | Issue with comments (404 if the user neither filed it nor is assigned to it; admin sees all) |
| PUT | /issues/:id | Creator/Admin | Creator edits title, description, priority and assignee; admin also sets status. Non-admin status change returns 403 |
| DELETE | /issues/:id | Creator/Admin | Delete issue |
| POST | /issues/:id/comments | User | Body: text (user must be able to see the issue) |
| GET | /dashboard | User | Counts for the user's own issues; admin counts all |

## Deployment
See the **Deployment** section in [BRD.md](./BRD.md). Summary: MongoDB Atlas (DB) → Render (backend, root `backend`) → Vercel (frontend, root `frontend`, `VITE_API_URL` = Render URL) → set `CLIENT_URL` on Render to the Vercel URL.
