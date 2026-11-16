# Public deployment plan

This app is ready to move from a local Mac setup to a real public deployment.

## Recommended stack
- Frontend: Vercel
- Backend: Render
- Database: Neon or Supabase Postgres
- Receipt storage: Cloudinary or AWS S3

## Required environment variables

### Backend
- `DB_URL` = Postgres connection URL for the cloud database
- `DB_USERNAME` = database user
- `DB_PASSWORD` = database password
- `SERVER_PORT` = 8080
- `APP_ALLOWED_ORIGINS` = your frontend public URL(s), comma-separated
- `UPLOAD_DIR` = /tmp/uploads or equivalent writable directory

### Frontend
- `VITE_API_URL` = deployed backend URL, e.g. https://your-api.onrender.com/api

## Deployment steps
1. Create a managed Postgres database.
2. Deploy the backend to Render as a Java service.
3. Deploy the frontend to Vercel.
4. Set the frontend and backend environment variables.
5. Add a real auth layer if this will be used outside a personal demo.

## Why this is different from the tunnel
The Cloudflare tunnel only exposes your local machine. A hosted deployment continues working even when your Mac is off or sleeping.
