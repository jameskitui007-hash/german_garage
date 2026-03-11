# German Garage — Mercedes & BMW Parts Shop

A full-stack web application for a Mercedes and BMW specialist garage in Nairobi, Kenya. Includes a customer-facing parts shop and a complete admin dashboard for inventory, orders, customers, suppliers, reports, and settings.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Backend   | FastAPI (Python)                    |
| Database  | MySQL + SQLAlchemy ORM              |
| Migrations| Alembic                             |
| Auth      | JWT (python-jose) + bcrypt          |
| Frontend  | Vanilla JS, HTML, CSS               |
| Dev Server| Uvicorn (backend) + VS Code Live Server (frontend) |

---

## Project Structure

```
german-garage/
│
├── backend/
│   ├── app/
│   │   ├── main.py               # FastAPI app entry point
│   │   ├── database.py           # DB connection + session
│   │   ├── dependencies.py       # Auth dependency (get_current_admin)
│   │   ├── models/
│   │   │   ├── product.py
│   │   │   ├── order.py          # Order + OrderItem
│   │   │   ├── customer.py
│   │   │   ├── supplier.py
│   │   │   ├── admin.py
│   │   │   ├── settings.py
│   │   │   └── activity_log.py
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── products.py
│   │   │   ├── orders.py
│   │   │   ├── customers.py
│   │   │   ├── suppliers.py
│   │   │   ├── dashboard.py
│   │   │   ├── reports.py
│   │   │   ├── settings.py
│   │   │   └── logs.py
│   │   ├── schemas/
│   │   │   ├── auth.py
│   │   │   ├── product.py
│   │   │   ├── order.py
│   │   │   ├── customer.py
│   │   │   ├── supplier.py
│   │   │   └── settings.py
│   │   └── utils/
│   │       ├── security.py       # JWT + bcrypt
│   │       └── logger.py         # Activity log helper
│   ├── alembic/                  # DB migrations
│   ├── seed.py                   # Admin user + default settings
│   ├── dummy.py                  # Sample products, orders, customers
│   ├── .env                      # Environment variables (not committed)
│   └── requirements.txt
│
├── frontend/
│   ├── index.html                # Homepage
│   ├── parts-shop.html           # Customer parts shop
│   ├── admin-login.html          # Admin login page
│   ├── admin-dashboard.html      # Admin dashboard shell
│   ├── api.js                    # Centralised API client
│   ├── admin.js                  # Dashboard + inventory logic
│   ├── admin-sections.js         # Customers, suppliers, reports, settings, logs
│   ├── shop.js                   # Shop + cart + checkout logic
│   ├── style.css                 # Global styles
│   └── shop.css                  # Shop-specific styles
```

---

## Setup Instructions

### 1. Clone the repo

```bash
git clone <repo-url>
cd german-garage
```

### 2. Create and activate a virtual environment

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create the `.env` file

Create `backend/.env` with the following:

```env
DATABASE_URL=mysql+pymysql://root:yourpassword@localhost:3306/german_garage
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
FRONTEND_URL=http://127.0.0.1:5500
```

> ⚠️ Replace `yourpassword` with your MySQL root password.
> Generate a strong `SECRET_KEY` with: `python -c "import secrets; print(secrets.token_hex(32))"`

### 5. Create the MySQL database

```sql
CREATE DATABASE german_garage;
```

### 6. Run Alembic migrations

```bash
alembic upgrade head
```

### 7. Seed the database

```bash
# Creates admin user + default settings
python seed.py

# Loads sample products, suppliers, orders, customers (optional)
python dummy.py
```

### 8. Start the backend

```bash
uvicorn app.main:app --reload
```

Backend runs at: `http://127.0.0.1:8000`
API docs at: `http://127.0.0.1:8000/docs`

### 9. Start the frontend

Open the project folder in VS Code and click **Go Live** (Live Server extension).

Frontend runs at: `http://127.0.0.1:5500`

> ⚠️ Always use Live Server — opening HTML files directly via `file://` will cause CORS errors.

---

## Default Admin Credentials

| Field    | Value                  |
|----------|------------------------|
| Username | `admin`                |
| Password | `MercedesBMW2024!`     |
| Role     | `superadmin`           |

> ⚠️ Change these immediately in production via the Settings section in the admin dashboard.

---

## API Overview

All protected endpoints require:
```
Authorization: Bearer <token>
```

Get a token via `POST /api/auth/login`.

| Group      | Base Path           | Auth Required |
|------------|---------------------|---------------|
| Auth       | `/api/auth`         | No            |
| Products   | `/api/products`     | Yes           |
| Orders     | `/api/orders`       | Admin only (GET/PUT); Public (POST) |
| Customers  | `/api/customers`    | Yes           |
| Suppliers  | `/api/suppliers`    | Yes           |
| Dashboard  | `/api/dashboard`    | Yes           |
| Reports    | `/api/reports`      | Yes           |
| Settings   | `/api/settings`     | Yes           |
| Logs       | `/api/logs`         | Yes           |

Full interactive API docs: `http://127.0.0.1:8000/docs`

---

## Key Features

- **Parts Shop** — browse, filter by brand/category, add to cart, checkout with order confirmation
- **Inventory Management** — full CRUD, CSV export, stock level alerts
- **Order Management** — status tracking, payment status, delivery method
- **Customer Profiles** — auto-created on order, VIP flagging, order history
- **Supplier Management** — full CRUD
- **Sales Reports** — revenue, top products, brand breakdown, date filters, CSV export
- **Activity Logs** — all admin actions logged with timestamp and IP
- **Settings** — store info, pricing, delivery fees, payment methods
- **JWT Auth** — 8-hour sessions, bcrypt password hashing

---

## Postman Collection

A complete Postman collection with all endpoints and automated tests is included at:
```
GermanGarage.postman_collection.json
```

Import it into Postman, run **Login** first (auto-saves token), then **Run Collection**.

---

## Known Limitations & Future Improvements

- [ ] Image upload for products (currently URL-based)
- [ ] Server-side database backup endpoint
- [ ] Password reset flow for admin
- [ ] WhatsApp order notification integration (WHATSAPP_NUM placeholder in shop.js)
- [ ] Rate limiting on login endpoint
- [ ] Multi-admin support with role-based permissions
- [ ] Deployment guide (PythonAnywhere / Railway / VPS)