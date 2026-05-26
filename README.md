# DeskFlow

DeskFlow is a MERN support ticket triage board built for the assessment brief.

## Structure

- `backend/` - Express, MongoDB, Mongoose API
- `frontend/` - Vite React single-page ticket board

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Set `MONGODB_URI` to a MongoDB Atlas connection string. Set `CLIENT_ORIGIN` to the deployed frontend URL in production.

## Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend URL. In production this must be the deployed backend URL, not `localhost`.

## API

- `POST /tickets`
- `GET /tickets?status=&priority=&breached=true`
- `PATCH /tickets/:id`
- `DELETE /tickets/:id`
- `GET /tickets/stats`
- `GET /health`

Status transitions are enforced server-side: `open -> in_progress -> resolved -> closed`, with one-step backward moves allowed. SLA fields are computed on every read response.
