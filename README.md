# Family Wealth Manager

An asset management system for families.

## Getting Started

### Prerequisites

- Node.js & npm/pnpm installed.

### Installation

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Initialize the database:
   ```bash
   pnpm exec drizzle-kit push
   ```

3. Run the development server:
   ```bash
   pnpm dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Features

- **Authentication**: Secure login and registration (first user becomes admin).
- **Dashboard**: Overview with total assets, statistics by bank and account type.
- **Account Management**: Manage bank accounts with balance tracking.
- **Member Management**: View family member list.
- **User Management**: Admin can manage users and roles.
- **Settings**: Update profile, change password.
- **Backup**: Export data to JSON file.

## Technology Stack

- **Framework**: Next.js 15
- **Database**: SQLite with Drizzle ORM
- **UI**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js (Auth.js)
