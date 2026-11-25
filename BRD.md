# Business Requirements Document – Issue Tracker System

## 1. Purpose
Provide a simple web application for teams to log, assign, track and discuss issues from creation to closure.

## 2. Scope
In scope: authentication, issue management, assignment, status tracking, comments, dashboard. Out of scope: email notifications, file attachments, multi-project support.

## 3. User Roles
| Role | Capabilities |
|---|---|
| User | Register/login, create, edit and delete own issues, view status and assignee, comment, view dashboard |
| Admin | Create, edit and delete any issue; assign issues to users; update status (Open / In Progress / Closed); comment; dashboard with counts; sees which user created each issue in the issues list |

## 4. Functional Requirements
| ID | Requirement |
|---|---|
| FR1 | Users can register and log in with email and password |
| FR2 | Admin can log in through a dedicated admin login |
| FR3 | Users can create, edit and delete issues (subject to permissions) |
| FR4 | Only the admin can assign issues to registered users |
| FR5 | Issue status is one of Open, In Progress, Closed; only the admin can change it, users can view it |
| FR6 | Users can add comments to an issue; comments show author and time |
| FR7 | Dashboard shows counts by status, total, assigned to me and unassigned |
| FR8 | Issues can be searched by title and filtered by status / assignee |

## 5. Non-Functional Requirements
Passwords hashed with bcrypt; JWT authentication (7-day expiry); input validation and meaningful HTTP errors; CORS restricted to the deployed frontend; responsive UI.

## 6. Data Model
- **User**: name, email (unique), password (hash), role (user/admin)
- **Issue**: title, description, status, priority, createdBy → User, assignedTo → User, comments[{text, author → User, timestamps}], timestamps

## 7. Architecture
React SPA → REST API (Express) → MongoDB Atlas. Stateless API; token stored in browser localStorage.

## 8. Deployment
**Hosting**
- Database: MongoDB Atlas (free M0 cluster)
- Backend: Render Web Service (Node)
- Frontend: Vercel (static Vite build)
- Code: GitHub (auto-deploy on push to `main`)

**Required services:** GitHub account, MongoDB Atlas, Render, Vercel.

**Deployment approach:** Continuous deployment from the GitHub repo. Render builds the `backend` folder, Vercel builds the `frontend` folder; configuration is through environment variables only.

**Steps to deploy**
1. *Database* – Create an Atlas cluster, add a database user, allow network access `0.0.0.0/0`, copy the connection string (include DB name `issue_tracker`).
2. *Push code* – `git init && git add . && git commit -m "Issue tracker" && git remote add origin <repo-url> && git push -u origin main`.
3. *Backend (Render)* – New → Web Service → select repo. Root Directory `backend`, Build Command `npm install`, Start Command `npm start`. Add env vars: `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `CLIENT_URL` (temporary `*`). Deploy and verify `https://<api>.onrender.com/api/health`.
4. *Frontend (Vercel)* – New Project → select repo. Root Directory `frontend`, Framework Vite, add env var `VITE_API_URL=https://<api>.onrender.com`. Deploy (`vercel.json` handles SPA routing).
5. *CORS* – Set `CLIENT_URL` on Render to the Vercel URL and redeploy.
6. *Verify* – Register a user, log in at `/admin-login`, create/assign an issue, comment, check the dashboard.

**Updating:** push to `main`; both platforms redeploy automatically. To change config, edit env vars and redeploy.

**Notes:** Render free tier sleeps when idle (first request can take ~50 s). Never commit `.env` files.

## 9. Acceptance Criteria
All FR1–FR8 work on the deployed URL; unauthorized API calls return 401/403; README and BRD allow another developer to run and deploy independently.
