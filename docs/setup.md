# CARGOFLIGHT Setup & Quickstart Guide

This guide describes how to configure, run, and test the **CARGOFLIGHT Airport Cargo-Flight & Baggage Tracking System**.

---

## 1. Prerequisites

- **Java JDK 21+** (`java -version`)
- **Apache Maven 3.9+** (`mvn -v`)
- **Node.js 18+ & npm** (`node -v`, `npm -v`)
- **Docker & Docker Compose** (for PostgreSQL and Neo4j)
- **MongoDB Atlas Account** (or local Docker MongoDB 7.0 fallback)

---

## 2. Environment Configuration (`.env`)

In the project root (`E:\DBMS\aero` or `D:\aero`), create or verify `.env`:

```env
# Dedicated MongoDB Atlas Cluster (Cloud Telemetry)
SPRING_DATA_MONGODB_URI=mongodb+srv://cargoflight_app:<PASSWORD>@cargoflight-cluster.nvm22jt.mongodb.net/aerotrace_telemetry?retryWrites=true&w=majority

# Primary PostgreSQL 17 (Operational + cargoflight_dw Warehouse Schema)
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/aerotrace_india
SPRING_DATASOURCE_USERNAME=aerotrace_app
SPRING_DATASOURCE_PASSWORD=aerotrace_secure_password_2026

# Neo4j 5.20 Graph (Airport Route Optimization)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=aerotrace_neo4j_2026
NEO4J_ENABLED=true

# Security & Demo Settings
AEROTRACE_DEMO_MODE=true
JWT_SECRET=404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970
```

> **Security Note:** `.env` is listed in `.gitignore` and must never be committed to Git. Keep real passwords out of shared repositories.

---

## 3. Starting the Databases

Start PostgreSQL and Neo4j via Docker Compose:

```bash
docker compose up -d postgres neo4j
```

Verify running containers:
- PostgreSQL 17: `localhost:5432` (`cargoflight-postgres`)
- Neo4j 5.20: `bolt://localhost:7687` and `http://localhost:7474` (`cargoflight-neo4j`)
- MongoDB Atlas: Cloud-hosted on `cargoflight-cluster.nvm22jt.mongodb.net`

---

## 4. Starting the Backend

From `backend/`:

```powershell
cd backend
mvn spring-boot:run
```

- **Port:** `http://localhost:8080`
- **Health Check:** `http://localhost:8080/actuator/health`
- **Database Center Status:** `http://localhost:8080/api/v1/database-center/status`

---

## 5. Starting the Frontend

From `frontend/`:

```powershell
cd frontend
npm install
npm run dev
```

- **Web Dashboard:** `http://localhost:5173`
- The application automatically opens to the CARGOFLIGHT operations dashboard.

---

## 6. Running Tests

### Backend Full Test Suite
```powershell
cd backend
mvn test
```

### Live MongoDB Atlas Integration Test
```powershell
cd backend
mvn test -Dtest=AtlasIntegrationTest
```

### Frontend Build Verification
```powershell
cd frontend
npm run build
```

---

## 7. Port Conflict Troubleshooting

If port `8080` is in use:

```powershell
# Identify process owning port 8080
Get-NetTCPConnection -LocalPort 8080 -ErrorAction SilentlyContinue | Select-Object OwningProcess, State

# Stop the process if it is a stale backend instance
Stop-Process -Id <PID> -Force
```
