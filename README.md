# TuitionMasterWeb

> **A modern web application for managing tuition classes, schedules, and payments.**

---

## Table of Contents
1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [Features](#features)
4. [Prerequisites](#prerequisites)
5. [Installation & Setup](#installation--setup)
6. [Development Workflow](#development-workflow)
7. [Running the Application](#running-the-application)
8. [Testing](#testing)
9. [Architecture Overview](#architecture-overview)
10. [Configuration](#configuration)
11. [Contributing](#contributing)
12. [License](#license)
13. [Contact](#contact)

---

## Project Overview
TuitionMasterWeb is a full‑stack web application that helps tutors and educational institutions manage:
- **Class scheduling** with interactive calendars.
- **Student enrollment** and profile management.
- **Payment tracking** and invoicing.
- **Reporting** for attendance and revenue.

The project follows modern best‑practice patterns – component‑based UI, RESTful APIs, and a clean separation of concerns – making it easy to extend and maintain.

---

## Tech Stack
| Layer | Technology |
|-------|------------|
| **Frontend** | HTML5, CSS3 (TailwindCSS optional), JavaScript (ES6+), React (or vanilla JSX) |
| **Backend** | Node.js (v20+), Express.js |
| **Database** | PostgreSQL (via Sequelize ORM) |
| **Styling** | Vanilla CSS with CSS Modules / optional Tailwind for rapid design |
| **Build Tool** | Vite (dev server) – `npm run dev` |
| **Testing** | Jest + React Testing Library (frontend), Supertest (backend) |
| **Linting/Formatting** | ESLint, Prettier |

---

## Features
- **Responsive UI** with dark‑mode support.
- **Dynamic calendar** for creating, editing, and deleting classes.
- **Student portal** for viewing schedules, grades, and invoices.
- **Admin dashboard** with analytics charts (revenue, attendance).
- **Role‑based access control** (admin, tutor, student).
- **Email notifications** for upcoming classes and payment reminders.
- **Exportable CSV reports**.

---

## Prerequisites
- **Node.js** ≥ 20 (recommended LTS)
- **npm** (comes with Node) – version 10+.
- **PostgreSQL** installed and running (default port 5432).
- **Git** (optional, for version control).

---

## Installation & Setup
```bash
# 1. Clone the repository (if you haven't already)
git clone https://github.com/yourusername/TuitionMasterWeb.git
cd TuitionMasterWeb

# 2. Install dependencies
npm install

# 3. Create a .env file (copy from .env.example)
cp .env.example .env
# Edit .env with your PostgreSQL credentials and any secret keys.

# 4. Run database migrations (using Sequelize CLI)
npx sequelize db:create
npx sequelize db:migrate
```

---

## Development Workflow
| Command | Description |
|---------|-------------|
| `npm run dev` | Starts Vite dev server with hot‑reloading. |
| `npm run build` | Produces production‑ready bundle in `dist/`. |
| `npm test` | Executes unit and integration tests. |
| `npm run lint` | Runs ESLint checking. |
| `npm run format` | Formats code with Prettier. |

> **Tip:** Keep the dev server running while you edit files – changes appear instantly in the browser.

---

## Running the Application
1. **Start the backend API**
   ```bash
   npm run start:api   # or `node src/server.js`
   ```
2. **Start the frontend dev server** (already shown above with `npm run dev`).
3. Open your browser and navigate to `http://localhost:3000` (or the port shown in the console).

---

## Testing
```bash
# Run all test suites
npm test

# Run only unit tests (frontend)
npm run test:unit

# Run integration tests (API)
npm run test:api
```

Coverage reports are generated in the `coverage/` folder.

---

## Architecture Overview
```
┌─────────────────┐       ┌─────────────────────┐
│   Frontend UI   │ <---> │   Express API Server │
│ (React/Vite)   │       │   (Node.js)         │
└───────┬─────────┘       └───────┬─────────────┘
        │                       │
        │   HTTP/REST (JSON)   │
        ▼                       ▼
   ┌─────────────┐        ┌───────────────┐
   │  PostgreSQL │        │   Sequelize   │
   │   DB Layer  │        │   ORM Layer   │
   └─────────────┘        └───────────────┘
```
- **Frontend** handles routing (React Router), state management (Context API or Redux), and UI components.
- **API Server** exposes endpoints such as `/api/classes`, `/api/students`, `/api/payments`.
- **Database** stores normalized tables: `users`, `classes`, `enrollments`, `payments`, `roles`.
- **Service Layer** (inside `src/services`) contains business logic (e.g., payment processing, schedule conflict detection).

---

## Configuration
All configurable values live in the `.env` file:
```
# Server
PORT=4000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tuition_master
DB_USER=postgres
DB_PASSWORD=yourpassword

# JWT
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=7d

# Email (SendGrid example)
SENDGRID_API_KEY=SG.xxxxx
FROM_EMAIL=no-reply@tuitionmaster.com
```
Never commit the real `.env` file – it’s ignored via `.gitignore`.

---

## Contributing
1. Fork the repository.
2. Create a feature branch: `git checkout -b feature/awesome-feature`.
3. Make your changes, ensuring linting passes.
4. Write tests for new functionality.
5. Commit and push: `git push origin feature/awesome-feature`.
6. Open a Pull Request with a clear description and screenshots if UI changes.

### Code Style
- Use **Prettier** for formatting (`npm run format`).
- Follow **ESLint** rules (`npm run lint`).
- Write **JSDoc** comments for exported functions.

---

## License
This project is licensed under the **MIT License** – see the `LICENSE` file for details.

---

## Contact
**Maintainer:** Alhaj (GitHub: @alhaj1986)
**Email:** alhaj@example.com

Feel free to open an issue for bugs, feature requests, or questions.
