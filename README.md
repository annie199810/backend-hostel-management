🛠️ Hostel Management System — Backend (API Server)

This repository contains the backend API for the Hostel Management System, built using Node.js, Express.js, and MongoDB.
It handles authentication, room allocation, resident management, maintenance requests, billing, and reporting logic.

🚀 Live Backend URL (Render)

🔗 https://backend-hostel-management.onrender.com

📌 Features (Backend)
🔐 Authentication & Authorization

Login & Register API

JWT-based secure authentication

Middleware to protect private routes

Auto-create default Admin on first boot

🧑‍💼 User Management

Create / Update / Delete users

Activate / Deactivate user status

Role-based access (Admin / Staff)

🏠 Room Management

Add / Edit / Delete rooms

Track availability

Sync room occupancy when residents move / update rooms

👤 Resident Management

Check-in / Check-out flow

Auto-assign / remove from room

Update resident details

Sync active/inactive status

🔧 Maintenance Management

Create maintenance requests

Update issue status (Open → In Progress → Closed)

Track priority & category

💳 Billing & Payment Handling

Create new bills

Update bill status (Pending / Paid)

Store invoice metadata

Revenue analytics ready

🧰 Tech Stack

Node.js

Express.js

MongoDB Atlas

Mongoose

JWT Authentication

Bcrypt Password Hashing

CORS

Dotenv

📂 Folder Structure

/server
├── server.js                # Entry point (starts Express app)
├── package.json
├── package-lock.json
├── .env                     # (not committed) env variables
├── .gitignore
└── src
    ├── index.js             # Main Express setup & routes wiring
    ├── seedAdmin.js         # Script to create default admin
    │
    ├── middleware
    │   ├── auth.js
    │   ├── requireAdmin.js
    │   ├── validateBilling.js
    │   └── verifyToken.js
    │
    ├── models
    │   ├── Billing.js
    │   ├── Invoice.js
    │   ├── Maintenance.js
    │   ├── Payment.js
    │   ├── Resident.js
    │   ├── Room.js
    │   └── User.js
    │
    └── routes
        ├── auth.js
        ├── billing.js
        ├── payments.js
        ├── residents.js
        └── users.js


⚙️ Installation Guide (Local Setup)
1️⃣ Clone Backend Repo
git clone https://github.com/annie199810/backend-hostel-management.git
cd backend-hostel-management

2️⃣ Install dependencies
npm install

3️⃣ Create .env file

👉 NOT push .env to GitHub

MONGO_URI=your_mongo_connection_string
JWT_SECRET=your_secret
CLIENT_ORIGIN=http://localhost:5173
PORT=5000

4️⃣ Start the server
npm start

or using nodemon:

npm run dev

🔗 API Endpoints
Auth
POST /api/auth/login
POST /api/auth/register
GET  /api/me

Users
GET    /api/users
POST   /api/users
PUT    /api/users/:id
DELETE /api/users/:id

Rooms
GET    /api/rooms
POST   /api/rooms
PUT    /api/rooms/:id
DELETE /api/rooms/:id

Residents
GET    /api/residents
POST   /api/residents
PUT    /api/residents/:id
DELETE /api/residents/:id

Maintenance
GET    /api/maintenance
POST   /api/maintenance
PUT    /api/maintenance/:id
DELETE /api/maintenance/:id
PATCH  /api/maintenance/:id/status

Billing
GET    /api/billing
POST   /api/billing
PUT    /api/billing/:id
DELETE /api/billing/:id
PATCH  /api/billing/:id/pay

🚀 Deployment Notes (Render)

Add environment variables in Render Dashboard

Change CORS origin for production

Enable auto-deploy from GitHub

Backend URL must be used in frontend .env

