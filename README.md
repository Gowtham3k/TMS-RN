# TMS - Complaint Raising System

A modern, role-based ticket management system built with the MERN stack (MongoDB, Express, React, Node).

## Features
- **Role-Based Dashboards**: Customized views for User, Admin, and Super Admin.
- **Complaint Management**: Raise, track, assign, and update statuses of complaints.
- **Premium UI**: Glassmorphism, gradients, and modern charts.
- **Secure Auth**: JWT-based authentication with password hashing.

## Tech Stack
- **Frontend**: React.js (Vite), Chart.js, Lucide Icons, Framer Motion.
- **Backend**: Node.js, Express, MongoDB, JWT, Bcrypt.

## Setup Instructions

### 1. Prerequisites
- Node.js installed.
- MongoDB running locally (default: `mongodb://localhost:27017/complaint_system`).

### 2. Backend Setup
- Go to `backend/` folder.
- Create a `.env` file (one has been created for you).
- Run `npm install`.
- (Optional) Seed the database with demo users: `node seed.js`.

### 3. Frontend Setup
- Go to `frontend/` folder.
- Run `npm install`.

### 4. Running the Project
From the root directory, run:
```bash
npm run dev
```
This will start both the backend (Port 5000) and frontend (Port 5173).

## Demo Credentials
- **Super Admin**: `admin@test.com` / `password123`
- **User**: `user@test.com` / `password123`
