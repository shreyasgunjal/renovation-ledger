# Renovation Ledger — Local Mac Setup

A local-first renovation expense tracker with React, Spring Boot and PostgreSQL.

## Requirements
- macOS
- Java 21
- Node.js 20 or newer
- Docker Desktop (recommended for PostgreSQL)
- VS Code (optional)

Check installations:
```bash
java -version
node -v
npm -v
docker --version
```

## 1. Start PostgreSQL
From this project folder:
```bash
docker compose up -d
docker compose ps
```
This starts PostgreSQL on port 5432. Local development credentials are in `docker-compose.yml`; do not reuse these credentials in a public deployment.

## 2. Start the backend
Open a new Terminal tab:
```bash
cd backend
mvn spring-boot:run
```
Backend API: http://localhost:8080/api

## 3. Start the frontend
Open another Terminal tab:
```bash
cd frontend
npm install
npm run dev
```
Open the local URL Vite prints, normally http://localhost:5173.

## Features in this starter
- Add, view and delete renovation expenses
- Categories, dates, payment methods and payee/vendor
- Upload and view receipt files (stored in `backend/uploads`)
- Contractor directory with agreed, paid and outstanding amounts
- Editable project budget (saved in this browser)
- Budget utilisation and category reports
- CSV export (opens in Excel)

## Important limitations in this first local build
- This is a local development starter, not a production-secure shared app.
- No login or role permissions yet. Do not expose it to the internet or use it for sensitive documents.
- Contractor paid amount is a running summary, not a detailed installment ledger yet.
- Expense records and receipt files are stored locally in PostgreSQL and `backend/uploads`.
- The browser budget setting is local to that browser.
- CSV is Excel-compatible; native `.xlsx` export can be added next.
- Receipt upload supports files up to 10 MB.

## Stop services
- Stop frontend/backend with Ctrl+C in their Terminal tabs.
- Stop PostgreSQL with `docker compose down`.
- Keep database data with `docker compose down`; remove it permanently only with `docker compose down -v`.

## API quick reference
- `GET /api/expenses`
- `POST /api/expenses`
- `DELETE /api/expenses/{id}`
- `POST /api/receipts` (multipart field `file`)
- `GET /api/receipts/{filename}`
- `GET /api/contractors`
- `POST /api/contractors`
- `PUT /api/contractors/{id}`
- `DELETE /api/contractors/{id}`
