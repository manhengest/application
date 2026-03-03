# Event Management System

A full-stack Proof of Concept for an Event Management Application built with NestJS, React, and PostgreSQL.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Zustand, react-big-calendar
- **Backend:** NestJS, TypeORM, PostgreSQL, JWT authentication
- **Deployment:** Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Run with Docker (recommended)

```bash
docker-compose up --build
```

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Swagger API docs:** http://localhost:3000/api
- **pgAdmin:** http://localhost:5050

### pgAdmin (Database UI)

pgAdmin is included for browsing and querying the PostgreSQL database. After starting the stack:

1. Open http://localhost:5050
2. Log in with default credentials: `admin@admin.com` / `admin` (or set `PGADMIN_EMAIL` and `PGADMIN_PASSWORD` in `.env`)
3. Add a new server connection:
   - **Host:** `db`
   - **Port:** `5432`
   - **Username:** `postgres`
   - **Password:** `postgres`
   - **Database:** `event_management`

### Local Development

1. **Database:** Start PostgreSQL (or use Docker for DB only):
   ```bash
   docker-compose up db -d
   ```

2. **Backend:**
   ```bash
   cd backend
   cp .env.example .env
   npm install
   npm run start:dev
   ```

3. **Frontend:**
   ```bash
   cd frontend
   cp .env.example .env
   npm install
   npm run dev
   ```

### Seed the database

Ensure PostgreSQL is running (e.g. `docker-compose up db -d`). Then from the project root:

```bash
cd backend
npm run seed
```

This seeds 2 users and 3 sample events. Default credentials:
- `eduard@example.com` / `password123`
- `jane@example.com` / `password456`

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                    | Default                          |
|----------------|--------------------------------|----------------------------------|
| DATABASE_URL   | PostgreSQL connection string   | postgresql://postgres:postgres@localhost:5432/event_management |
| JWT_SECRET     | Secret for JWT signing         | (required)                       |
| PORT           | Server port                    | 3000                             |

### Frontend (`frontend/.env`)

| Variable       | Description                    | Default                          |
|----------------|--------------------------------|----------------------------------|
| VITE_API_URL   | Backend API base URL           | http://localhost:3000            |

### Docker Compose (root `.env`)

| Variable        | Description                    | Default                          |
|-----------------|--------------------------------|----------------------------------|
| PGADMIN_EMAIL   | pgAdmin login email            | admin@admin.com                  |
| PGADMIN_PASSWORD| pgAdmin login password         | admin                            |

## Project Structure

```
├── frontend/     # React + Vite app
├── backend/      # NestJS API
├── docker-compose.yml
└── README.md
```

## API Endpoints

| Method | Path                  | Description              |
|--------|-----------------------|--------------------------|
| POST   | /auth/register        | Register user            |
| POST   | /auth/login           | Login, returns JWT       |
| GET    | /events               | List events              |
| GET    | /events/:id           | Event details            |
| POST   | /events               | Create event (auth)      |
| PATCH  | /events/:id           | Edit event (organizer)   |
| DELETE | /events/:id           | Delete event (organizer) |
| POST   | /events/:id/join      | Join event (auth)        |
| POST   | /events/:id/leave     | Leave event (auth)       |
| GET    | /users/me/events      | User's calendar events  |

## Version Control

- Main branch: `master`
