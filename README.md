# 🎓 University Management System (UMS)
### Southeast University Bangladesh — Full-Stack Web Application

A production-ready UMS with Admin Panel + Tuition Fee Management System.

---

## 📁 Project Structure

```
ums/
├── database/
│   └── schema.sql              ← Full MySQL schema + seed data
│
├── backend/                    ← Node.js / Express API
│   ├── server.js               ← App entry point
│   ├── .env.example            ← Environment variable template
│   ├── package.json
│   ├── config/
│   │   └── db.js               ← MySQL connection pool
│   ├── middleware/
│   │   └── auth.js             ← Session auth guards
│   ├── controllers/
│   │   ├── authController.js   ← Login / logout
│   │   ├── studentController.js← Student CRUD
│   │   ├── courseController.js ← Course CRUD
│   │   ├── resultController.js ← Results + grade calc
│   │   └── feeController.js    ← 💰 Fees management (CORE)
│   └── routes/
│       ├── auth.js
│       ├── students.js
│       ├── courses.js          ← Also exports resultRouter
│       └── fees.js
│
└── frontend/                   ← Static HTML/CSS/JS pages
    ├── index.html              ← Portal home / login selector
    ├── assets/
    │   └── js/
    │       └── api.js          ← Centralized API utility + helpers
    ├── admin/
    │   ├── login.html          ← Admin login
    │   ├── dashboard.html      ← Admin dashboard with stats
    │   ├── students.html       ← Student CRUD
    │   ├── courses.html        ← Course CRUD
    │   ├── results.html        ← Results management
    │   ├── fees.html           ← 💰 Fee management (CORE)
    │   └── payments.html       ← Payment history
    └── student/
        ├── login.html          ← Student login
        ├── dashboard.html      ← Student home
        ├── fees.html           ← 💰 Fee statement (read-only)
        └── results.html        ← Academic transcript
```

---

## ⚙️ Prerequisites

- **Node.js** v18+ — https://nodejs.org
- **MySQL** v5.7+ (or MySQL 8) — https://dev.mysql.com/downloads/mysql/
- **npm** (comes with Node)

---

## 🚀 Step-by-Step Setup

### Step 1 — Database Setup

1. Open MySQL CLI or MySQL Workbench
2. Run the schema file:
```sql
source /path/to/ums/database/schema.sql;
```
Or copy-paste the contents of `database/schema.sql` into Workbench and execute.

This will:
- Create the `ums_db` database
- Create all 7 tables (admins, departments, students, courses, results, fees, payment_history)
- Insert sample data including demo admin and 5 students

### Step 2 — Backend Setup

```bash
# Navigate to backend folder
cd ums/backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
```

### Step 3 — Configure Environment

Open `backend/.env` and fill in your values:

```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=YOUR_MYSQL_PASSWORD_HERE    ← change this
DB_NAME=ums_db

SESSION_SECRET=ums_super_secret_key_change_in_production_2024
CORS_ORIGIN=http://localhost:5000
```

### Step 4 — Start the Server

```bash
# From the backend/ folder:
npm start

# OR for development with auto-reload:
npm run dev
```

You should see:
```
✅  MySQL connected successfully
🎓  UMS Server running on http://localhost:5000
📋  API base: http://localhost:5000/api
🌐  Frontend: http://localhost:5000
```

### Step 5 — Open the Application

Open your browser and go to:
```
http://localhost:5000
```

---

## 🔐 Demo Credentials

### Admin Panel
- URL: `http://localhost:5000/admin/login.html`
- Username: `admin`
- Password: `admin123`

### Student Portal
- URL: `http://localhost:5000/student/login.html`
- Student ID: `2021-1-60-001`
- Password: `student123`

Other demo students: `2021-1-60-002`, `2021-2-60-001`, `2022-1-60-001`, `2022-3-60-001`
(all use password: `student123`)

---

## 💰 Tuition Fee API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/fees` | Admin | Get all fees (with filters) |
| GET | `/api/fees/student/:id` | Admin | Get fees for one student |
| GET | `/api/fees/my-fees` | Student | Student's own fees (read-only) |
| POST | `/api/fees/add-fee` | Admin | Create new fee record |
| PUT | `/api/fees/update-fee/:id` | Admin | Edit fee total/due date |
| POST | `/api/fees/pay-fee` | Admin | Record a payment |
| DELETE | `/api/fees/delete-fee/:id` | Admin | Delete fee record |
| GET | `/api/fees/history/:fee_id` | Admin | Payment history |
| GET | `/api/fees/dashboard-stats` | Admin | Summary statistics |

### Payment Logic
```
due_amount = total_fee - paid_amount  (computed column in MySQL)
status:
  paid_amount == 0          → "Unpaid"
  0 < paid_amount < total   → "Partial"
  paid_amount >= total_fee  → "Paid"
```

---

## 📡 Full API Reference

### Auth
```
POST /api/auth/admin/login    { username, password }
POST /api/auth/admin/logout
POST /api/auth/student/login  { student_id, password }
POST /api/auth/student/logout
GET  /api/auth/session
```

### Students (Admin)
```
GET    /api/students          ?search=&dept=&status=
GET    /api/students/:id
POST   /api/students          { student_id, full_name, email, password, department_id, batch, semester }
PUT    /api/students/:id
DELETE /api/students/:id
GET    /api/students/departments
GET    /api/students/me/profile   (Student session)
```

### Courses
```
GET    /api/courses           ?search=&dept=&semester=
GET    /api/courses/:id
POST   /api/courses           (Admin)
PUT    /api/courses/:id       (Admin)
DELETE /api/courses/:id       (Admin)
```

### Results
```
GET    /api/results/all       ?student_id=&semester=&year=  (Admin)
GET    /api/results/student/:id    (Admin)
GET    /api/results/me             (Student session)
POST   /api/results           (Admin)
PUT    /api/results/:id       (Admin)
DELETE /api/results/:id       (Admin)
```

---

## 🏗️ Architecture

- **Pattern**: MVC (Model-View-Controller)
- **Auth**: Session-based (express-session + bcryptjs)
- **DB**: MySQL with connection pool (mysql2/promise)
- **API**: RESTful JSON endpoints
- **Frontend**: Vanilla JS + Tailwind CSS (no build step needed)

---

## 🔒 Security Features

- Passwords hashed with bcryptjs (salt rounds: 10)
- Session-based authentication (httpOnly cookies)
- Admin and Student sessions are separate
- All admin routes protected by `requireAdmin` middleware
- Student routes protected by `requireStudent` middleware
- Students cannot access or modify fee/result data

---

## 🛠️ Troubleshooting

**MySQL connection fails:**
- Verify MySQL is running: `sudo service mysql start` (Linux) or check System Preferences (Mac)
- Check your DB_PASSWORD in `.env`
- Make sure `ums_db` database exists (run the schema.sql first)

**Port already in use:**
- Change `PORT=5000` in `.env` to `PORT=3001` or another free port
- Also update `CORS_ORIGIN` to match

**Session not persisting:**
- Make sure `credentials: 'include'` is in fetch calls (already set in api.js)
- Make sure CORS_ORIGIN exactly matches the URL you're browsing

**"Cannot find module" errors:**
- Run `npm install` inside the `backend/` directory

---

## 📊 Database Tables

| Table | Purpose |
|-------|---------|
| `admins` | Admin accounts |
| `departments` | University departments |
| `students` | Student profiles + login |
| `courses` | Course catalog |
| `results` | Student grades (auto-calculated) |
| `fees` | **Tuition fee records** (core module) |
| `payment_history` | Detailed payment log per fee |

---

Built with ❤️ — Node.js · Express · MySQL · Tailwind CSS
