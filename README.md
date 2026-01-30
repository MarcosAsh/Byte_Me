# Byte Me — Local Setup & Run Guide



---
## Setup Instructions

### 1) Clone the repository (?)
```bash
git clone <repositoryURL>
```


### 2) Prerequisites

- **Git**
- **Java 17**
- **Maven**
- **Node.js 20** 

### 3) Install required tools (Optional)
- **macOS using (setup-mac.sh)**
  ```bash
  cd scripts
  chmod +x setup-mac.sh
  ./setup-mac.sh
  ```

- **Windows using (setup-windows.ps1)**
  ```powershell
  (Run in PowerShell as Administrator)
  cd scripts
  .\setup-windows.ps1
  ```

### 4) Database setup (Pending!)

#### Create the Database `byte_me`
1) Start PostgreSQL
2) Create the database:
```sql
CREATE DATABASE byte_me;
```

---

## Run locally

### 1) Start the backend
```bash
cd backend
mvn spring-boot:run
```


### 2) Start the frontend
```bash
cd frontend
npm run dev
```

**The frontend will start on: 
http://localhost:3000**


-----
## Environment variables (Pending!)


#### Database
....




---


## API Endpoints

### Auth
- `POST /api/auth/register` - Register
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user

### Bundles
- `GET /api/bundles` - List available
- `GET /api/bundles/{id}` - Get one
- `POST /api/bundles` - Create (seller)
- `PUT /api/bundles/{id}` - Update (seller)
- `POST /api/bundles/{id}/activate` - Activate
- `POST /api/bundles/{id}/close` - Close

### Reservations
- `POST /api/reservations` - Reserve
- `GET /api/reservations/org/{orgId}` - By org
- `GET /api/reservations/employee/{employeeId}` - By employee
- `POST /api/reservations/{id}/verify` - Verify claim code
- `POST /api/reservations/{id}/no-show` - Mark no-show
- `POST /api/reservations/{id}/cancel` - Cancel
- `POST /api/reservations/{id}/assign/{employeeId}` - Assign employee

### Analytics
- `GET /api/analytics/dashboard/{sellerId}` - Dashboard
- `GET /api/analytics/sell-through/{sellerId}` - Sell-through rates
- `GET /api/analytics/waste/{sellerId}` - Waste metrics

### Gamification
- `GET /api/gamification/streak/{employeeId}` - Get streak
- `GET /api/gamification/impact/{employeeId}` - Impact summary
- `GET /api/gamification/badges/{employeeId}` - Employee badges
- `GET /api/gamification/badges` - All badges

### Issues
- `GET /api/issues/seller/{sellerId}` - All issues
- `GET /api/issues/seller/{sellerId}/open` - Open issues
- `POST /api/issues` - Create issue
- `POST /api/issues/{id}/respond` - Respond
- `POST /api/issues/{id}/resolve` - Resolve

### Categories
- `GET /api/categories` - List all