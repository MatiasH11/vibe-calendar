# Vibe Calendar - Gemini Context

This document provides a comprehensive overview of the Vibe Calendar project for the Gemini AI assistant.

## Project Overview

Vibe Calendar is a modern and efficient shift management system for businesses. It's a full-stack web application with a clear separation between the frontend and backend.

*   **Frontend:** A responsive and interactive user interface built with Next.js, React, and Tailwind CSS. It uses Zustand for state management and TanStack Query (React Query) for data fetching. The UI is built with shadcn/ui components.
*   **Backend:** A robust and scalable API built with Node.js, Express, and TypeScript. It uses Prisma as the ORM for a PostgreSQL database. Authentication is handled with JWT.
*   **Database:** A PostgreSQL database with a well-defined schema managed through Prisma migrations.

The project is under active development, with a clear roadmap outlined in `PLAN.md`.

## Building and Running

### Backend

The backend is located in the `backend/` directory.

*   **Install dependencies:** `npm install`
*   **Run in development mode:** `npm run dev`
*   **Build for production:** `npm run build`
*   **Run in production mode:** `npm start`
*   **Run tests:** `npm run test`
*   **Apply database migrations:** `npm run prisma:migrate`
*   **Generate Prisma client:** `npm run prisma:generate`
*   **Open Prisma Studio:** `npm run prisma:studio`

### Frontend

The frontend is located in the `frontend/` directory.

*   **Install dependencies:** `npm install`
*   **Run in development mode:** `npm run dev`
*   **Build for production:** `npm run build`
*   **Run in production mode:** `npm start`
*   **Run tests:** `npm run test`
*   **Lint the code:** `npm run lint`

## Development Conventions

*   **Code Style:** The project uses ESLint and Prettier for consistent code style.
*   **Testing:** The project uses Jest and React Testing Library for testing. The backend has a comprehensive test suite, including integration and unit tests. The frontend has a basic testing setup.
*   **Commits:** Commit messages should follow the Conventional Commits specification.
*   **Branching:** The project uses a Gitflow-like branching model. Feature branches should be created from the `develop` branch.
*   **API:** The backend exposes a RESTful API documented with OpenAPI (Swagger). The OpenAPI specification can be found at `backend/src/docs/openapi.yaml`.
*   **State Management:** The frontend uses Zustand for global UI state and TanStack Query (React Query) for server state.
*   **UI Components:** The frontend uses shadcn/ui for its component library, which is built on top of Radix UI and Tailwind CSS.
