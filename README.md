# Byte Me — Local Setup & Run Guide

## Overview

Byte Me is a full-stack web application designed to reduce food waste by connecting sellers, organisations, and employees through surplus food bundle reservations.


### Key Features:

1. JWT-based authentication with role-based access (Seller / Employee)

2. Bundle management (create / activate / close bundles)

3. Reservation system with verification and no-show tracking

4. Analytics dashboard for sellers (sell-through)

5. Gamification (streaks / badges)

6. Issue reporting


---
## Setup Instructions

### 1) Clone the repository
```bash
git clone <repositoryURL>
```


### 2) Prerequisites

- **Git**
- **Java 17**
- **Maven**
- **Node.js 20** 
- **PostgreSQL**

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


### 4) Database setup

#### Create the Database `byte_me`
1) Start PostgreSQL
2) Create the database:
```sql
CREATE DATABASE byte_me;
```




-----

## Environment variables

### Backend .env variable explanations
|Variable	|Description|Example|
|---|---|---|
|SERVER_PORT|	Port the backend server runs on	|8080|
|DB_URL	PostgreSQL| JDBC connection URL|	jdbc:postgresql://localhost:5432/byteMe|
|DB_USERNAME	|PostgreSQL username	|postgres|
|DB_PASSWORD	|PostgreSQL password	|postgres|
|JWT_SECRET	|Secret key for signing JWT tokens (≥ 32 bytes)|change-me-to-a-random-string|
|JWT_EXPIRATION|	JWT expiration time (ms)|	86400000|


---


## Run locally

### 1) Start the backend
```bash
cd backend
mvn spring-boot:run
```
**The backend will start on: 
http://localhost:8000**


### 2) Start the frontend
```bash
cd frontend
npm run dev
```

**The frontend will start on: 
http://localhost:3000**

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
