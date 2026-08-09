# 🌊 FloodResponse EMS — Disaster Relief & Rescue Management Portal

A comprehensive, real-time emergency disaster relief management platform designed for flood disaster response, victim rescue dispatch, camp management, inventory tracking, and supply distributions.

---

## 📁 Repository Architecture

The project is structured into three main components:

```
flood-relief-portal/
├── 📁 frontend/     # React 18, TanStack Start/Router, Tailwind CSS, Google Maps API
├── 📁 backend/      # Node.js & Express REST API Server, Supabase Integration
├── 📁 database/     # Supabase PostgreSQL Schemas, RLS Policies, SQL Migrations & Seeders
├── 📄 package.json  # Root Monorepo Configuration
└── 📄 README.md     # Project Documentation
```

---

## 🎨 1. Frontend (`/frontend`)
The frontend is built using **React 18**, **TanStack Start & TanStack Router**, **Tailwind CSS**, and **Google Maps API**.

### Key Features:
- **⚡ 1-Click Instant Emergency SOS**: Trigger emergency rescue dispatch with 0s delay and locked GPS coordinates (`11.494867, 77.278934`).
- **🗺️ Interactive GIS Navigation & Route Finder**: Calculate safe evacuation routes between victims and relief camps using Google Maps.
- **⛺ Relief Camp Directory**: Monitor live occupancy, free beds, clean water, medical facilities, and generator power.
- **👥 Beneficiary Management**: Digital QR ID passes for survivors, family group registration, and medical condition tracking.
- **🛥️ Volunteer Rescue Operations**: Live resuer duty status, mission dispatch alerts, and motorboat routing.
- **📦 Ration & Inventory Supply Control**: Track incoming food, water bottles, chlorine tablets, flashlights, and medical kits.
- **💰 Financial Relief & Donations**: Track corporate, NGO, and individual financial contributions with chart visualizations.

---

## ⚙️ 2. Backend (`/backend`)
The backend is built using **Node.js**, **TypeScript**, **Express.js**, and **Supabase SDK**.

### Features:
- RESTful API endpoints for SOS dispatch, camp capacities, and volunteer management.
- Real-time event broadcasting and status tracking.
- CORS & Helmet security middleware.

---

## 🗄️ 3. Database (`/database`)
The database uses **Supabase PostgreSQL** with Row Level Security (RLS) policies.

### Folder Structure:
- `database/supabase/schema.sql` — Main PostgreSQL table definitions (`users`, `beneficiaries`, `relief_camps`, `sos_requests`, `inventory`, `donations`, `volunteers`, `flood_zones`).
- `database/supabase/policies.sql` — RLS policies for role-based security access control.
- `database/supabase/seed.sql` — Seed script for 15+ realistic sample records per module.

---

## 🚀 Getting Started

### Prerequisites:
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation & Setup:

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/MOHITBALAJI/flood-relief-portal.git
   cd flood-relief-portal
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Environment Setup**:
   Create a `.env` file in `frontend/` and `backend/`:
   ```env
   VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
   ```

4. **Run Locally**:
   ```bash
   npm run dev
   ```
   - **Frontend**: [http://localhost:8080](http://localhost:8080)
   - **Backend Server**: [http://localhost:3000](http://localhost:3000)

---

## 🔑 Quick Sandbox Credentials (Demo Access)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Super Admin** | `mohitbalaji2005@gmail.com` | `12345678` |
| **Volunteer** | `volunteer@floodresponse.in` | `Vol@123` |
| **Camp Officer** | `camp_officer@floodresponse.in` | `Camp@123` |

---

## 📜 License
This project is open-source under the MIT License.
