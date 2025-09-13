# Gemini Code Understanding

This document outlines the key aspects of the `email-explorer` project to facilitate understanding and future development.

## Project Overview

`email-explorer` is a full-stack email client built on Cloudflare Workers. It provides a web-based dashboard for managing emails, including sending, receiving, and organizing them into folders. The backend is a Hono-based API that interacts with Cloudflare's email routing, R2 for storage, and Durable Objects for managing individual mailboxes.

## Core Technologies

- **Backend:**
    - **Framework:** Hono - A lightweight, fast web framework for Cloudflare Workers.
    - **Language:** TypeScript
    - **API Specification:** OpenAPI (Swagger) - The API is defined in `openapi.json`.
    - **Database:** Cloudflare D1 (via `workers-qb`) - Used for storing email metadata, folders, and contacts within Durable Objects.
    - **Storage:** Cloudflare R2 - Used for storing mailbox settings and email attachments.
    - **Email Sending:** Cloudflare Email Routing - Used for both sending and receiving emails.
- **Frontend:**
    - **Framework:** Vue.js 3 - A progressive JavaScript framework for building user interfaces.
    - **Language:** TypeScript
    - **Build Tool:** Vite - A fast build tool for modern web development.
    - **Styling:** Tailwind CSS - A utility-first CSS framework.
    - **State Management:** Pinia - A modern state management library for Vue.js.
    - **Routing:** Vue Router - The official router for Vue.js.
- **Testing:**
    - **Framework:** Vitest - A fast unit testing framework.
    - **Integration Tests:** Cloudflare's `vitest-pool-workers` for integration testing against a real Cloudflare environment.

## Project Structure

The project is a monorepo with two main parts: the backend worker and the frontend dashboard.

- **`/` (Root):**
    - `wrangler.jsonc`: The configuration file for the Cloudflare Worker. It defines the worker's name, entry point, compatibility flags, and bindings to other Cloudflare services like R2, D1, and Durable Objects.
    - `package.json`: Defines the project's dependencies and scripts for the backend.
    - `tsconfig.json`: The TypeScript configuration for the backend.
    - `src/`: The source code for the Cloudflare Worker.
        - `index.ts`: The main entry point for the worker. It sets up the Hono router and defines the API endpoints.
        - `durableObject/`: Contains the implementation of the `MailboxDO` Durable Object.
            - `index.ts`: The `MailboxDO` class, which manages all data and operations for a single mailbox.
            - `migrations.ts`: The database schema and migrations for the D1 database used by the Durable Object.
    - `tests/`: Contains the integration tests for the API endpoints.
- **`/dashboard`:**
    - `package.json`: Defines the dependencies and scripts for the frontend dashboard.
    - `vite.config.ts`: The configuration for the Vite build tool.
    - `src/`: The source code for the Vue.js application.
        - `main.ts`: The entry point for the Vue application.
        - `App.vue`: The root Vue component.
        - `router/`: The Vue Router configuration.
        - `stores/`: The Pinia stores for managing application state.
        - `views/`: The different pages of the application.
        - `components/`: Reusable Vue components.
        - `services/`: The API client for communicating with the backend.

## Key Concepts

- **Mailbox Durable Object (`MailboxDO`):** This is the core of the backend. Each mailbox is represented by a `MailboxDO` instance, which is responsible for storing and managing all the data for that mailbox, including emails, folders, and contacts. This ensures that all data for a given mailbox is co-located and can be accessed efficiently.
- **Email Routing:** Cloudflare's Email Routing is used to receive incoming emails and forward them to the worker. The `email` function in `src/index.ts` is the entry point for handling incoming emails.
- **API:** The backend exposes a RESTful API for the frontend to interact with. The API is defined using OpenAPI in `openapi.json` and implemented using Hono in `src/index.ts`.
- **Frontend:** The frontend is a single-page application (SPA) built with Vue.js. It uses Pinia for state management and Vue Router for routing. The UI is built with Tailwind CSS.

## Getting Started

1.  **Install dependencies:**
    ```bash
    npm install
    cd dashboard && npm install
    ```
2.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Cloudflare Worker in development mode and the Vite development server for the frontend.
3.  **Deploy the worker:**
    ```bash
    npm run deploy
    ```
    This will deploy the worker to Cloudflare.

## Next Steps

- **Implement Authentication:** The application currently has no authentication. This is a critical next step to secure user data.
- **Improve UI/UX:** The current UI is functional but could be improved with better styling and user experience.
- **Add more features:** There are many features that could be added, such as:
    - Email threading
    - Rich text editing for composing emails
    - Support for multiple email accounts
    - Advanced search capabilities
    - Keyboard shortcuts
