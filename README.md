# Spendwise — Frontend

React 19 SPA for the Spendwise personal finance manager. Communicates with the Spring Boot backend via JWT auth stored in localStorage, with session cookie fallback for cross-origin compatibility.

---

## Features

- ✔ JWT authentication with auto-redirect on token expiry (401 intercept)
- ✔ Dashboard with balance summary and recent transactions
- ✔ Income and expense management (add, delete, filter)
- ✔ Category management with emoji picker
- ✔ Savings goals with visual progress tracking
- ✔ Monthly and yearly reports with Recharts visualisations
- ✔ Advanced filter page (date range, keyword, sort direction)
- ✔ Excel export (XLSX) for income and expense lists
- ✔ Profile image upload via Cloudinary
- ✔ Responsive layout with mobile sidebar drawer
- ✔ Toast notifications (react-hot-toast)

---

## Tech Stack

| | |
|---|---|
| Framework | React 19 + Vite 7 |
| Routing | React Router DOM 7 |
| Styling | Tailwind CSS v4 |
| HTTP | Axios 1.x (with request/response interceptors) |
| Charts | Recharts 3 |
| Icons | Lucide React |
| Excel Export | SheetJS (xlsx) |
| Date Handling | Moment.js |
| Notifications | react-hot-toast |
| Image Upload | Cloudinary REST API |

---

## Project Structure

```
src/
├── components/      Menubar, Sidebar, Dashboard, AvatarPicker
├── context/         AppContext (global user state)
├── hooks/           useUser (auth fetch), ProtectRoute (route guard)
├── pages/           Home, Income, Expense, Category, Filter, Goals, Reports, Login, Signup
└── util/
    ├── apiEndpoints.js      Centralised API URL constants
    ├── axiosConfig.jsx      Axios instance with auth interceptors
    ├── exportExcel.js       XLSX export helper
    ├── uploadProfileImage.js  Cloudinary upload helper
    └── validation.js        Email format validation
```

---

## Setup

### Prerequisites
- Node.js 18+

### Install & Run
```bash
npm install
npm run dev
```
Runs on `http://localhost:3000` (strict port — matches backend CORS config).

### Environment
No `.env` file required for local dev. The backend URL is configured in:
```js
// src/util/apiEndpoints.js
export const BASE_URL = "https://spendwise-ofnc.onrender.com/api/v1.0";
```
Change this to the deployed backend URL for production builds.

### Build
```bash
npm run build
```

---

## Authentication Flow

1. `POST /auth/login` → receives `{ token, user }`
2. Token stored in `localStorage` as `"token"`
3. `axiosConfig.jsx` attaches `Authorization: Bearer <token>` on every non-auth request
4. On 401 response → token cleared → redirected to `/login`
5. `ProtectRoute` guards all private pages — checks `localStorage.getItem("token")`

---

## Key Design Decisions

- **Axios interceptors** handle auth injection and global 401/403/500 error handling centrally, avoiding per-component error handling boilerplate.
- **AppContext** holds the resolved `user` object so any component can access profile data without prop drilling.
- **`useUser` hook** fetches and caches the current user on mount — decoupled from auth so it works on page refresh.
- **Excel export** uses a client-side SheetJS approach (no backend needed) — arrays of plain objects are written directly to `.xlsx` blobs.

---

## Deployment

| | URL |
|---|---|
| Frontend (Vercel) | `https://spendwise-frontend.vercel.app` |
| Backend | `https://spendwise-backend.onrender.com/api/v1.0` |
