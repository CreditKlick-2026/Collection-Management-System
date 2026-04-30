# DebtRecover Pro Next.js Migration

This project is a migration of `debtrecover_v6.html` to a full-stack Next.js application with a PostgreSQL backend (Neon).

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Database**: PostgreSQL (Neon)
- **ORM**: Prisma
- **Styling**: Vanilla CSS (global variables matching original UI)
- **Auth**: Custom JWT-style session auth (using local storage for mock persistence)

## Setup Instructions

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Variables**:
   The Prisma schema is already configured with your Neon connection string. You may want to move this to an `.env` file:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_jBHmp0hl3JrT@ep-empty-tree-angbicxg-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
   ```

3. **Database Migration**:
   Run the following to push the schema to your database:
   ```bash
   npx prisma db push
   ```

4. **Seed Initial Data**:
   The script `prisma/seed.ts` contains the initial users and customers from the HTML file.
   ```bash
   npx prisma db seed
   ```
   *(Note: You may need to add `"prisma": { "seed": "ts-node prisma/seed.ts" }` to your `package.json` if it's not there, or just run it with `npx ts-node`)*.

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

## Key Files
- `app/layout.tsx`: Root layout with global styles.
- `app/page.tsx`: Main entry point (Login/Dashboard).
- `app/api/auth/login/route.ts`: Login API using Prisma.
- `app/api/leads/route.ts`: Leads management API.
- `components/`: UI components (Sidebar, Topbar).
- `styles/globals.css`: Theme variables and utility classes.
- `prisma/schema.prisma`: Database models.

## Note on Implementation
The UI has been kept identical to the original HTML, using the same CSS variables and structure. Most pages (Leads, Payments, etc.) are structured to be easily expanded in `app/page.tsx` or moved to their own route files.
