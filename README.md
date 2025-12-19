🏨 Hostel Management System – Frontend

This repository contains the frontend application of the Hostel Management System, built using React (Vite) and Tailwind CSS.

The application provides a modern, responsive, and role-based UI for managing hostel operations such as rooms, residents, maintenance, billing, payments, reports, and users.

🚀 Live Application (Frontend)

🔗 Netlify URL
https://hostelmanagementtt.netlify.app

🔐 Demo Credentials (For Evaluation)
👑 Admin Account
Email: admin@hostel.com
Password: admin123

👷 Staff Account
Email: staff@hostel.com
Password: staff123

🔎 Role Behavior

Admin

Full access to all modules

Can create, edit, activate, and deactivate Staff users

Staff

Can manage rooms, residents, maintenance, billing, and reports

Cannot access User Management

ℹ️ Staff users are created only by Admin from the User Management page.

✨ Features (Frontend)
🔐 Authentication & Authorization

JWT-based login system

Token stored securely in localStorage

Protected routes (unauthorized users redirected to Login)

Role-based UI (Admin vs Staff)

🏠 Room Management

Add / Edit / Delete rooms

Room status tracking:

Available

Occupied

Maintenance

Automatic occupancy updates based on resident allocation

👤 Resident Management

Add / Edit / Delete residents

Auto room assignment

Check-in date handling

Room occupancy sync when residents change rooms

🔧 Maintenance Requests

Create / Update / Delete maintenance requests

Track status:

Open

In Progress

Closed

Priority levels:

High

Medium

Low

💳 Billing & Payments

Create and manage bills

Edit & delete bills

“Pay Now” option

Payment status update (Pending → Paid)

Invoice number, due date, and notes

Disabled actions for paid invoices

📊 Dashboard & Reports

Total revenue summary

Paid vs pending revenue

Monthly revenue breakdown

Room occupancy overview

Maintenance status analytics

Visual charts and insights

👥 User Management (Admin Only)

Add / Edit / Delete staff users

Activate / Deactivate users

Admin accounts are protected (cannot be deleted)

🎨 UI / UX

Built with Tailwind CSS

Fully responsive (desktop & mobile)

Clean card-based dashboard layout

Reusable UI components:

Cards

Modals

Tables

Forms

Status badges

🛠️ Tech Stack
Frontend

React.js (Vite)

Tailwind CSS

JavaScript (ES6)

Fetch API

JWT Authentication

LocalStorage

Deployment

Netlify

⚙️ Installation & Setup (Frontend)
1️⃣ Clone the Repository
git clone https://github.com/annie199810/frontend-hostel-management.git
cd frontend-hostel-management

2️⃣ Install Dependencies
npm install

3️⃣ Environment Variables

Create a .env file in the root directory:

VITE_API_BASE_URL=http://localhost:5000


For deployed backend (Netlify):

VITE_API_BASE_URL=https://backend-hostel-management.onrender.com

4️⃣ Run Development Server
npm run dev


Frontend will be available at:
👉 http://localhost:5173

📂 Project Structure
src/
│
├─ api/
│   ├─ auth.js
│   └─ users.js
│
├─ assets/
│   └─ images / icons
│
├─ auth/
│   ├─ AuthProvider.jsx
│   └─ ProtectedRoute.jsx
│
├─ components/
│   ├─ AddPaymentModal.jsx
│   ├─ Card.jsx
│   ├─ LoginPage.jsx
│   ├─ RegisterPage.jsx
│   ├─ Sidebar.jsx
│   ├─ StatusModal.jsx
│   └─ Topbar.jsx
│
├─ pages/
│   ├─ AboutPage.jsx
│   ├─ BillingPage.jsx
│   ├─ DashboardPage.jsx
│   ├─ MaintenancePage.jsx
│   ├─ ReportsPage.jsx
│   ├─ ResidentsPage.jsx
│   ├─ RoomsPage.jsx
│   └─ UserManagementPage.jsx
│
├─ utils/
│   └─ auth.js
│
├─ App.jsx
├─ App.css
└─ main.jsx

🔐 Authentication Flow

User logs in using email & password

Backend returns a JWT token

Token is stored in localStorage

All protected API requests include:

Authorization: Bearer <token>


If token is missing or invalid → redirect to Login page

🧪 Scripts
npm run dev       # Start frontend locally
npm run build     # Build production files
npm run preview   # Preview production build

🧹 Notes

No external UI libraries used (only Tailwind CSS)

Fully responsive UI

Clean separation of Admin and Staff roles

No company or brand names included (GUVI requirement compliant)

🔗 Related Repository

🔙 Backend Repository
https://github.com/annie199810/backend-hostel-management