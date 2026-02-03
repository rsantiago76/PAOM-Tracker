# POAM Tracker

POAM Tracker is a modern, enterprise-grade web application designed to manage Plans of Action and Milestones (POAMs). It provides a comprehensive solution for tracking findings, managing approvals, and generating compliance reports.

## 🚀 Key Features

-   **Dashboard & Analytics**: Real-time overview of compliance status, visual metrics, and risk assessments.
-   **Findings Management**: Create, edit, and track findings with detailed metadata (security controls, risk levels, due dates).
-   **Milestone Tracking**: Break down findings into actionable milestones with individual progress tracking.
-   **Approval Workflows**: Role-based system for submitting and approving changes (e.g., Extension Requests, Closure Requests).
-   **Systems Management**: Organize findings by system or boundary.
-   **Automated Reporting**: Generate PDF reports for blocked findings, open items, and executive summaries.
-   **Demo Mode Setup**: Public demo access capability for showcasing the platform without live credentials.

## 🛠 Tech Stack

### Frontend Architecture
-   **Core Framework**: [React 18](https://react.dev/)
-   **Build Tool**: [Vite](https://vitejs.dev/) - For lightning-fast development and optimized production builds.
-   **Language**: JavaScript / [TypeScript](https://www.typescriptlang.org/)
-   **Styling**:
    -   [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework.
    -   [Radix UI](https://www.radix-ui.com/) - Unstyled, accessible UI primitives.
    -   [shadcn/ui](https://ui.shadcn.com/) - Reusable components built with Radix and Tailwind.
    -   **Lucide React**: Beautiful, consistent icons.
-   **State Management & Data Fetching**:
    -   [TanStack Query (React Query)](https://tanstack.com/query/latest) - Server state management, caching, and data synchronization.
    -   **Context API**: For global UI state and Authentication (AuthContext).
-   **Routing**: [React Router v6](https://reactrouter.com/)

### Backend & Cloud Infrastructure
-   **Platform**: [AWS Amplify Gen 2](https://aws.amazon.com/amplify/) - Fullstack app hosting and backend generation.
-   **Authentication**: AWS Cognito (via Amplify Auth) + Custom Demo Mode logic.
-   **Database / API**: AWS AppSync + DynamoDB (inferred from Amplify Data client).
-   **Hosting**: AWS Amplify Hosting (CI/CD via GitHub).

### Development Environment
-   **Linting**: ESLint (Flat Config)
-   **Formatting**: Prettier
-   **Package Manager**: npm

## 🏗 Architecture Overview

The application follows a **Modern Single Page Application (SPA)** architecture:

1.  **Client-Side Rendering**: The UI is fully rendered on the client, providing a snappy, app-like experience.
2.  **Serverless Backend**: Leverages AWS managed services (Cognito, DynamoDB, AppSync) to eliminate server management overhead.
3.  **Data Layer**:
    -   `src/api/amplifyClient.js`: Configures the Amplify Data Client.
    -   `src/lib/query-client.js`: Configures the QueryClient for global caching policies.
    -   **Optimistic UI**: React Query is used to pre-fetch data and handle background updates.
4.  **UI Component System**:
    -   `src/components/ui`: Atomic design primitives (Buttons, Inputs, Dialogs).
    -   `src/components/{feature}`: Feature-specific components (e.g., `findings`, `approvals`).
5.  **Authentication Flow**:
    -   Hybrid approach supporting both **AWS Cognito** for secure production access and a **Local Demo Mode** (via localStorage flags) for public previews.

## 💻 Getting Started

### Prerequisites
-   Node.js (v18 or higher)
-   npm

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/rsantiago76/PAOM-Tracker.git
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Start the development server:
    ```bash
    npm run dev
    ```

### Building for Production

To create a production build:
```bash
npm run build
```
This will compile the assets to the `dist` folder.

## 🧪 Demo Mode

The application includes a specialized "Demo Mode" for portfolio showcases:
-   **Access**: Click "View Demo (Public)" on the login screen.
-   **Mechanism**: Bypasses Cognito auth and injects a mock `ADMIN` user into the application context via `src/lib/auth.js`.
-   **Permissions**: Grants full read/write access to the UI (note: some backend operations may be mocked or restricted).

---
*Built by [Your Name] - 2026*
