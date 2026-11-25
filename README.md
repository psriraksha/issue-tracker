# Issue Tracker System

A full-stack (MERN) issue tracking app with user and admin login, issue CRUD, assignment, status tracking, comments and a dashboard.

**Live URL (frontend):** https://issue-tracker-nine-brown.vercel.app  
**API URL (backend):** https://issue-tracker-xfli.onrender.com  
**GitHub:** https://github.com/psriraksha/issue-tracker

> Note: the backend is on a free Render plan, so the first request after a period of inactivity can take up to a minute.

## Features
- User registration and login (JWT); separate **Admin login** page (admin account is seeded from env vars)
- Create, edit and delete issues (a user manages own issues; admin manages all)
- **Admin controls:** only the admin assigns issues to users and updates status (**Open → In Progress → Closed**); users can see the status
- Admin sees who created each issue in the issues list
- Comments on issues
- Dashboard with counts: total, per status, assigned to me, unassigned
- Issue list with search, status filter and "assigned to me" filter

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
Log in as admin at `/admin-login` using `ADMIN_EMAIL` / `ADMIN_PASSWORD` from the backend `.env`.

## Environment Variables
**backend/.env**
| Name | Description |
|---|---|
| PORT | API port (default 5000; Render sets it automatically) |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Long random secret for signing tokens |
| CLIENT_URL | Allowed frontend origin(s), comma-separated (CORS) |
| ADMIN_EMAIL / ADMIN_PASSWORD | Admin account created on first start |

**frontend/.env**
| Name | Description |
|---|---|
| VITE_API_URL | Base URL of the backend (no trailing slash, no `/api`) |

## API Details
All routes are prefixed `/api`. Protected routes need `Authorization: Bearer <token>`.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | /health | – | Health check |
| POST | /auth/register | – | Body: name, email, password (min 6) |
| POST | /auth/login | – | Body: email, password |
| POST | /auth/admin-login | – | Same as login, admin accounts only |
| GET | /auth/me | User | Current user |
| GET | /users | User | List registered (non-admin) users, used for assignment |
| GET | /issues | User | Query: `status`, `search`, `mine=true` |
| POST | /issues | User | Body: title, description, priority (assignedTo honoured for admin only) |
| GET | /issues/:id | User | Issue with comments |
| PUT | /issues/:id | Creator/Admin | Creator edits title/description/priority; admin also sets status and assignee |
| DELETE | /issues/:id | Creator/Admin | Delete issue |
| POST | /issues/:id/comments | User | Body: text |
| GET | /dashboard | User | Counts by status, assigned to me, unassigned |

## Deployment
See the **Deployment** section in [BRD.md](./BRD.md). Summary: MongoDB Atlas (DB) → Render (backend, root `backend`) → Vercel (frontend, root `frontend`, `VITE_API_URL` = Render URL) → set `CLIENT_URL` on Render to the Vercel URL.