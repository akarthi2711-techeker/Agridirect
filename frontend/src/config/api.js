/**
 * Central API configuration
 *
 * All API calls in the app use this single base URL.
 * Set REACT_APP_API_URL in your .env file to point to the correct backend.
 *
 * Architecture:
 *   Vercel (frontend)
 *     └─► API Gateway (single entry point)
 *           ├─► Lambda  — /ai/*, /market/*, /crop/*, /chat/*
 *           └─► EC2 Express (HTTP proxy integration) — everything else
 */

const API_URL =
  process.env.REACT_APP_API_URL ||    // set in .env / Vercel env vars
  'http://localhost:5000/api';         // local dev fallback

export default API_URL;
