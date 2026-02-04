🛠️ Hostel Management System – Backend (API Server)

This repository contains the backend API for the Hostel Management System, built using Node.js, Express.js, and MongoDB.

The backend handles authentication, authorization, room allocation, resident management, maintenance requests, billing, payments, reporting logic, and role-based access control for Admin and Staff users.

## 🎥 Demo Video

Watch the complete demo of the Hostel Management System here:  
👉 https://drive.google.com/file/d/1cQP24g1GNHSisuMVr90Xgzw19tAQi9xG/view?usp=drive_link



🚀 Live Backend (Render)

🔗 API Base URL
https://backend-hostel-management.onrender.com

🔐 Demo Credentials (For Evaluation)
👑 Admin Account

Email: admin@hostel.com

Password: admin123

👷 Staff Account

Email: staff@hostel.com

Password: staff123

🔎 Role Rules
Admin

Full access to all APIs

Can create, edit, activate, and deactivate Staff users

Staff

Can access Rooms, Residents, Maintenance, Billing, and Reports

Cannot manage users

ℹ️ Staff users are created and managed only by Admin.

✨ Features (Backend)
🔐 Authentication & Authorization

JWT-based authentication

Secure password hashing using bcrypt

Middleware-based route protection

Role-based access control (Admin / Staff)

Automatic creation of a default Admin user on first server boot

🧑‍💼 User Management

Create / Update / Delete users

Activate / Deactivate users

Role enforcement (Admin / Staff)

Admin users are protected from deletion

🏠 Room Management

Add / Edit / Delete rooms

Track room status:

Available

Occupied

Maintenance

Automatic room occupancy synchronization when residents move in or out

👤 Resident Management

Check-in / Check-out flow

Automatic room assignment

Update resident details

Sync resident active/inactive status with room occupancy

🔧 Maintenance Management

Create maintenance requests

Update issue status:

Open

In Progress

Closed

Track priority and category

💳 Billing & Payment Handling (Backend Logic)

Create and manage bills

Update bill status (Pending / Paid)

Store invoice metadata

Mark payments with date and method

Revenue data structured for reporting and dashboards

Note:
Payment gateway integration is intentionally simulated for demo purposes.
Real payment gateways (Razorpay / Stripe) can be integrated as a future enhancement.

📊 Reporting Support

Billing summaries

Room occupancy data

Maintenance statistics

Structured API responses for frontend dashboards

🧰 Tech Stack

Node.js

Express.js

MongoDB Atlas

Mongoose

JWT Authentication

Bcrypt (Password Hashing)

CORS

Dotenv

📂 Folder Structure
server/
├── server.js              # Server entry point
├── package.json
├── package-lock.json
├── .env                   # Environment variables (not committed)
├── .gitignore
└── src/
    ├── index.js           # Express setup & route wiring
    ├── seedAdmin.js       # Creates default admin user
    │
    ├── middleware/
    │   ├── auth.js
    │   ├── verifyToken.js
    │   ├── requireAdmin.js
    │   └── validateBilling.js
    │
    ├── models/
    │   ├── Billing.js
    │   ├── Invoice.js
    │   ├── Maintenance.js
    │   ├── Payment.js
    │   ├── Resident.js
    │   ├── Room.js
    │   └── User.js
    │
    └── routes/
        ├── auth.js
        ├── users.js
        ├── rooms.js
        ├── residents.js
        ├── maintenance.js
        ├── billing.js
        └── payments.js

⚙️ Installation & Setup (Backend)
1️⃣ Clone the Repository
git clone https://github.com/annie199810/backend-hostel-management.git
cd backend-hostel-management

2️⃣ Install Dependencies
npm install

3️⃣ Environment Variables

Create a .env file in the root directory
(Do NOT commit this file to GitHub)

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLIENT_ORIGIN=http://localhost:5173
PORT=5000

4️⃣ Start the Server
npm start


or using nodemon:

npm run dev


Backend will run on:
👉 http://localhost:5000

🔗 API Endpoints
Authentication
POST /api/auth/login
POST /api/auth/register
GET  /api/auth/me

Users (Admin Only)
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

Set correct CLIENT_ORIGIN for production

Enable auto-deploy from GitHub

Use Render backend URL in frontend .env file

📌 Project Scope

This backend focuses on secure APIs, role-based authorization, and core hostel management logic.
Advanced features such as real payment gateway integration and high-concurrency booking locks are planned as future enhancements.

🧹 Notes

Secure password handling using bcrypt

JWT-based route protection

Clear separation of Admin and Staff permissions

No company or brand names included (GUVI compliant)

🔗 Related Repository

🎨 Frontend Repository
https://github.com/annie199810/frontend-hostel-management