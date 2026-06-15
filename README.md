# tata-hackathon

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Near-Miss Accident Prediction System
A futuristic, AI-powered system designed to predict driving risk in real-time, detect near-miss accidents, analyze driver emotion using telemetry patterns, and take smart preventive actions.

## Getting Started

First, run the FastAPI backend server:
```bash
cd backend
# Activate the virtual environment
.\.venv\Scripts\activate
# Start the server
python -m uvicorn main:app --reload
```

Then, run the Next.js development server in a separate terminal:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the real-time AI simulation dashboard.
