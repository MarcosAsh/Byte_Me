<p align="center">
  <img src="docs/logo.png" alt="Byte Me" width="400">
</p>

<p align="center">
  A marketplace that connects food sellers with organisations to rescue surplus food, reduce waste, and track environmental impact.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Java-17-orange" alt="Java 17">
  <img src="https://img.shields.io/badge/Spring%20Boot-3.2-green" alt="Spring Boot 3.2">
  <img src="https://img.shields.io/badge/Next.js-16-black" alt="Next.js 16">
  <img src="https://img.shields.io/badge/PostgreSQL-16-blue" alt="PostgreSQL">
  <img src="https://img.shields.io/badge/license-MIT-lightgrey" alt="MIT License">
</p>

---

## What is Byte Me?

Byte Me is a full-stack web application where food sellers list surplus bundles at discounted prices and charitable organisations reserve them for collection. The platform tracks environmental impact (meals rescued, CO2e saved), provides demand forecasting for sellers, and uses gamification (streaks, badges) to keep organisations engaged.

### For Sellers
- Create and manage surplus food bundles with pickup windows
- View analytics dashboards: sell-through rates, pricing effectiveness, popular categories
- Get demand forecasts with model comparison and quantity recommendations
- Handle issue reports from organisations

### For Organisations
- Browse and reserve surplus bundles from local sellers
- Collect orders using claim codes with pickup time reminders
- Track impact stats: meals rescued, CO2e saved, streaks
- Earn badges through consistent food rescue activity
- Report quality or availability issues

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4, Recharts, Zustand |
| Backend | Java 17, Spring Boot 3.2, Spring Security, Spring Data JPA |
| Database | PostgreSQL with Flyway migrations |
| Auth | JWT tokens with role-based access (Seller / Org Admin) |
| CI | GitHub Actions (backend tests + frontend build) |

---

## Getting Started

### Prerequisites

- Java 17
- Maven
- Node.js 20+
- PostgreSQL

### 1. Clone the repo

```bash
git clone https://github.com/MarcosAsh/Byte_Me.git
cd Byte_Me
```

### 2. Set up the database

```sql
CREATE DATABASE byte_me;
```

### 3. Configure environment variables

Create `backend/.env` with:

| Variable | Description | Example |
|----------|-------------|---------|
| `SERVER_PORT` | Backend server port | `8080` |
| `DB_URL` | PostgreSQL JDBC URL | `jdbc:postgresql://localhost:5432/byte_me` |
| `DB_USERNAME` | Database username | `postgres` |
| `DB_PASSWORD` | Database password | `postgres` |
| `JWT_SECRET` | Secret for signing JWTs (32+ bytes) | `change-me-to-a-random-string` |
| `JWT_EXPIRATION` | Token expiry in milliseconds | `86400000` |

### 4. Start the backend

```bash
cd backend
mvn spring-boot:run
```

Runs on **http://localhost:8080**

### 5. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on **http://localhost:3000**

### Optional: automated setup scripts

```bash
# macOS
cd scripts && chmod +x setup-mac.sh && ./setup-mac.sh

# Windows (PowerShell as Administrator)
cd scripts; .\setup-windows.ps1
```

---
### 3) Run the whole test 
```bash 
cd backend
mvn clean test 
```

** Maven will output the results to the terminal. Detailed reports can be found in: target/surefire-reports/

### 4) Run specific test class
```bash
cd backend  
mvn test -Dtest=AnytestInsideOfTestfiles
```

### 5) Run specific test method
```bash 
cd backend 
mvn test -Dtest=BundleControllerTest#testGetById_Success
```

## Project Structure

```
Byte_Me/
  backend/             Spring Boot API
    src/main/java/     Controllers, entities, repositories, services
    src/main/resources/ application.properties, Flyway migrations
    src/test/java/     Unit tests (JUnit 5, Mockito, MockMvc)
  frontend/            Next.js app
    src/app/           Pages grouped by role: (public), (seller), (org)
    src/components/    Shared UI components
    src/lib/api/       API client and TypeScript types
    src/store/         Zustand auth store
  .github/workflows/   CI pipelines
  scripts/             Setup scripts for macOS and Windows
```

---

## API Overview

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new seller or org |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Get current user |

### Bundles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bundles` | List all active bundles |
| GET | `/api/bundles/{id}` | Get bundle details |
| POST | `/api/bundles` | Create a bundle (seller) |
| PUT | `/api/bundles/{id}` | Update a bundle (seller) |
| POST | `/api/bundles/{id}/activate` | Activate a draft bundle |
| POST | `/api/bundles/{id}/close` | Close a bundle |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/orders` | Reserve a bundle (org) |
| GET | `/api/orders/org/{orgId}` | Reservations by org |
| GET | `/api/orders/seller/{sellerId}` | Orders for a seller |
| POST | `/api/orders/{id}/collect` | Collect with claim code |
| POST | `/api/orders/{id}/cancel` | Cancel a reservation |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard/{sellerId}` | Seller dashboard stats |
| GET | `/api/analytics/sell-through/{sellerId}` | Sell-through rates |
| GET | `/api/analytics/pricing/{sellerId}` | Pricing effectiveness |
| GET | `/api/analytics/popular-windows/{sellerId}` | Best pickup windows |
| GET | `/api/analytics/popular-categories/{sellerId}` | Top categories |

### Forecasting
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/forecast/history/{sellerId}` | Historical demand data |
| GET | `/api/forecast/{sellerId}` | Forecast predictions |
| GET | `/api/forecast/comparison/{sellerId}` | Model comparison |
| GET | `/api/forecast/recommendations/{sellerId}` | Quantity recommendations |
| POST | `/api/forecast/run/{sellerId}` | Trigger a forecast run |

### Gamification
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/gamification/streak/{orgId}` | Org rescue streak |
| GET | `/api/gamification/stats/{orgId}` | Impact stats |
| GET | `/api/gamification/badges/{orgId}` | Org badges |
| GET | `/api/gamification/badges` | All available badges |

### Issues
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/issues` | Report an issue (org) |
| GET | `/api/issues/seller/{sellerId}` | Issues for a seller |
| GET | `/api/issues/org/{orgId}` | Issues by org |
| POST | `/api/issues/{id}/respond` | Seller responds |
| POST | `/api/issues/{id}/resolve` | Resolve an issue |

---

## License

This project is licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.
