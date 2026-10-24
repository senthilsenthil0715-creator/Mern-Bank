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

## Features
- Register / login (JWT, bcrypt, rate-limited auth, helmet)
- Unique account numbers, deposit, withdraw, transfer with recipient lookup and confirmation
- Atomic balance updates (no negative balances, refund on failed credit)
- Saved recipients, categories, search + filter + paginated statements, CSV export
- Dashboard with income/spending charts and category breakdown
- Change password, light/dark theme, responsive layout
- Admin console: bank stats, freeze/unfreeze customers
