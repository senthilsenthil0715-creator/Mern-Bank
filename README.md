# Nexa Bank – MERN Online Banking

## Requirements
Node 18+ and MongoDB running locally (or an Atlas URI in `backend/.env`).

## Run
```bash
# terminal 1
cd backend && npm install && npm run dev      # http://localhost:5000
# terminal 2
cd frontend && npm install && npm run dev     # http://localhost:5173
```
Admin is seeded on first start: **admin@nexabank.com / Admin@123** (change it after login).

The frontend uses `/api` by default; Vite proxies that path to the local backend. When deploying the frontend and backend separately, set `VITE_API_URL` in the frontend hosting environment to the backend URL ending in `/api` (for example, `https://your-backend.example.com/api`).

## Features
- Register / login (JWT, bcrypt, rate-limited auth, helmet)
- Unique account numbers, deposit, withdraw, transfer with recipient lookup and confirmation
- Atomic balance updates (no negative balances, refund on failed credit)
- Saved recipients, categories, search + filter + paginated statements, CSV export
- Dashboard with income/spending charts and category breakdown
- Change password, light/dark theme, responsive layout
- Admin console: bank stats, freeze/unfreeze customers
