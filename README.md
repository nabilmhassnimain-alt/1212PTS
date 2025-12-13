# 1212PTS Deployment Notes

This project has separate backend and frontend apps that are deployed independently (e.g., to Vercel). Use the following environment variables so production deployments can reach each other and the database:

## Backend
- `MONGODB_URI` – connection string for MongoDB (required).
- `FRONTEND_URL` – the deployed frontend origin (e.g., `https://<your-frontend>.vercel.app`) so CORS allows browser requests.
- `PORT` – optional, defaults to `4000`.

The backend automatically allows local development origins `http://localhost:5173` and `http://localhost:5174`.

## Frontend
- `VITE_API_URL` – URL of the deployed backend (e.g., `https://<your-backend>.vercel.app`). If not set, production builds fall back to the current page origin, while local development still defaults to `http://localhost:4000`.

Redeploy both apps after updating the environment variables.
