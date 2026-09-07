# WorkHub — Attendance, Payroll & Vacation Management

Multi-tenant workforce management application built with Next.js 14, Prisma, and PostgreSQL.

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript + Tailwind CSS
- **Database**: PostgreSQL 16 (via Docker) — also supports Supabase
- **ORM**: Prisma 5
- **Auth**: NextAuth.js (credentials provider, JWT sessions)
- **UI**: Zoho-inspired design (custom Tailwind theme, lucide-react icons)

## Getting Started

### 1. Start PostgreSQL

```bash
docker compose up -d
```

This starts a PostgreSQL 16 container on port 5432 with:
- DB: `attendance_db`
- User: `attendance_admin`
- Password: `attendance_pass_2024`

### 2. Install dependencies

```bash
npm install
```

### 3. Run migrations & seed

```bash
npm run db:migrate   # apply schema migrations
npm run db:seed      # seed demo data
```

### 4. Start dev server

```bash
npm run dev
```

App runs at http://localhost:3000

## Demo Accounts

All accounts use password: `Password123!`

| Email | Role | Tenant |
|-------|------|--------|
| superadmin@attendance.app | SUPER_ADMIN | (global) |
| admin@gulftech.com | ADMIN | Gulf Tech LLC |
| manager@gulftech.com | MANAGER | Gulf Tech LLC |
| staff@gulftech.com | STAFF | Gulf Tech LLC |
| employee@gulftech.com | EMPLOYEE | Gulf Tech LLC |

## Roles & Permissions

- **SUPER_ADMIN**: Global access, manages all tenants (no tenant scope)
- **ADMIN**: Full access within their tenant (employees, payroll, settings, holidays)
- **MANAGER**: View/manage employees, approve leaves, view payroll
- **STAFF**: Manage employees, attendance, payroll, salary structures
- **EMPLOYEE**: View own profile, attendance, leaves, payslips

## Modules

1. **Employees** — Full HR profile with visa/Emirates ID/iqama/passport/work permit tracking, bank details, departments, reporting hierarchy
2. **Attendance** — Daily attendance marking (present/absent/late/remote), check-in/out times, work hours calculation
3. **Vacation/Leave** — Leave requests with approval workflow, leave balances, multiple leave types (annual, sick, casual, etc.)
4. **Salary** — Per-employee salary structures (basic, allowances, overtime rate, tax/insurance rates)
5. **Payroll** — Periodic payroll run generation with automatic payslip calculation, status workflow (draft → processing → approved → paid), printable payslips
6. **Super Admin** — Tenant CRUD with initial admin account creation, suspend/activate tenants, global user management across all tenants
11. **User Management** — Super admin manages all platform users (any tenant, any role including super_admin); tenant admins manage their own tenant users (no super_admin creation); create/edit/activate/deactivate/delete users; send activation emails and password reset links via SMTP and Telegram; search and filter by role, status, and tenant
7. **Performance & Reviews** — Review cycles (annual/quarterly/probation), self-assessments, manager assessments with competency scoring, 360° peer feedback (anonymous option), goals/KPIs/OKRs tracking with progress and weights, final calibration with recommendations (promotion/raise/PIP)
8. **Expenses** — Employee expense claims with itemized line items (travel, meals, equipment, training, etc.), approval workflow (submitted → approved → paid), rejection with reasons, admin/manager approval, employee self-service
9. **Advance Payments** — Salary advances, loans, petty cash, relocation, and medical advances with installment-based recovery tracking, monthly payroll deductions, disbursement tracking, recovery history, and progress visualization
10. **SMTP Email System** — Per-tenant SMTP configuration (host, port, auth, sender identity), notification preferences per category (leaves, expenses, advances, payroll, password reset, account activation), email logging with status tracking, test email functionality, password reset flow with token-based reset links, account activation flow with token-based activation, welcome emails, and automated notifications integrated into all approval workflows

## Email & SMTP Configuration

- **Developer Settings**: `/settings/developer` (ADMIN only) — configure SMTP server, sender identity, notification preferences, test connection, send test emails
- **SMTP API**: `GET/PUT /api/settings/smtp` — retrieve and update SMTP config, test connection, send test email
- **Email Logs API**: `GET /api/settings/email-logs` — retrieve email send history
- **Password Reset**: `POST /api/auth/reset-password` (request reset link), `POST /api/auth/reset-password/confirm` (set new password with token)
- **Account Activation**: `POST /api/auth/activate` (send activation email), `PATCH /api/auth/activate` (activate account with token + set password)
- **Public Pages**: `/forgot-password`, `/reset-password?token=...`, `/activate?token=...`
- **Email Service**: `src/lib/email.ts` — SMTP transport, email sending with logging, test connection, notification enablement checks
- **Email Templates**: `src/lib/email-templates.ts` — HTML email templates for all notification types
- **Notifications**: `src/lib/notifications.ts` — workflow-integrated notification helpers (leave approved/rejected, expense approved/rejected/paid, advance approved/rejected/disbursed, payroll paid)
- **Email Log Model**: Tracks all outgoing emails with type, status (PENDING/SENT/FAILED), recipient, subject, error messages, and timestamps

## Telegram Integration

- **Developer Settings**: `/settings/developer` (ADMIN only) — Telegram bot configuration section with bot token, username, welcome message, notification preferences, test connection, send test message, and Telegram message log
- **My Notifications**: `/notifications` (all users) — Users can link their Telegram chat ID, set username, and opt in/out of Telegram notifications
- **Telegram Bot Config API**: `GET/PUT /api/settings/telegram` — retrieve/update bot config, test connection, send test message (supports `__KEEP_EXISTING__` marker for token)
- **Telegram User Management API**: `GET/PUT/PATCH/POST /api/settings/telegram/users` — admin lists/sets user chat IDs, user self-updates, admin sends test to user
- **Telegram Logs API**: `GET /api/settings/telegram-logs` — retrieve Telegram message history
- **Telegram Service**: `src/lib/telegram.ts` — Bot API calls via fetch, message sending with logging, test connection, notification enablement checks, send to user/role helpers
- **Telegram Templates**: `src/lib/telegram-templates.ts` — HTML-formatted Telegram message templates for all notification types
- **Telegram Notifications**: `src/lib/telegram-notifications.ts` — workflow-integrated Telegram notification helpers (parallel to email notifications)
- **Telegram Log Model**: Tracks all outgoing Telegram messages with type, status (PENDING/SENT/FAILED), chat ID, message, error messages, and timestamps
- **User Telegram Fields**: `telegramChatId`, `telegramUsername`, `telegramNotify` (opt-in toggle) on User model
- **Dual-channel notifications**: All workflow events (leave approve/reject, expense approve/reject/pay, advance approve/reject/disburse, password reset, account activation, welcome) send both email and Telegram notifications when enabled

## User Management

- **Super Admin User Management**: `/super-admin/users` (SUPER_ADMIN only) — manage all platform users across all tenants, filter by tenant/role/status, create/edit/activate/deactivate/delete any user including super_admin
- **Tenant Admin User Management**: `/users` (ADMIN only) — manage users within the admin's tenant only, cannot create/modify super_admin users, same CRUD actions
- **Users API**: `GET/POST /api/users` (list/create), `GET/PATCH/DELETE /api/users/[id]` (retrieve/update/delete)
- **User Actions**: Create (with optional password or activation email), Edit (name, email, role, phone, password), Activate/Deactivate, Send Activation Email, Send Password Reset, Delete
- **Security**: Tenant admins cannot access users in other tenants, cannot create/modify super_admin users, cannot deactivate/delete their own account; employees/managers/staff cannot access user management at all
- **Activation Integration**: When creating a user without a password, an activation email/Telegram message is sent automatically with a token-based activation link (24h expiry); admin can also resend activation or password reset links from the user management UI
- **User Activation Helper**: `src/lib/user-activation.ts` — `sendActivationEmail()` and `sendPasswordResetByAdmin()` helpers that send via both SMTP and Telegram channels

## Database Configuration

### Local PostgreSQL (default)

`.env` is pre-configured for the Docker container. Both `DATABASE_URL` and `DIRECT_URL` point to the local Postgres.

### Supabase

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?schema=public&pgbouncer=true"
DIRECT_URL="postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres?schema=public"
DB_PROVIDER="supabase"
```

- `DATABASE_URL` → pooled connection (port 6543, pgbouncer)
- `DIRECT_URL` → direct connection (port 5432, used for migrations)

Then run `npm run db:migrate` to create tables on Supabase.

## Useful Commands

```bash
npm run dev          # start dev server
npm run build        # production build
npm run db:migrate   # create/apply migrations
npm run db:push      # push schema without migration history
npm run db:seed      # seed demo data
npm run db:studio    # open Prisma Studio (DB GUI at localhost:5555)
npm run lint         # run ESLint
```

## Project Structure

```
src/
├── app/
│   ├── (app)/              # protected route group (with AppShell layout)
│   │   ├── dashboard/
│   │   ├── employees/      # list, new, [id], [id]/edit
│   │   ├── attendance/     # list, me
│   │   ├── holidays/
│   │   ├── leaves/         # list, apply, me
│   │   ├── salary/
│   │   ├── payroll/        # list, [id], [id]/[itemId] (payslip), me
│   │   ├── departments/
│   │   ├── super-admin/tenants/
│   │   ├── settings/
│   │   ├── profile/
│   │   ├── performance/    # cycles, reviews, goals, feedback, my-review, my-goals, my-feedback
│   │   └── profile/
│   ├── api/                # REST API routes
│   │   ├── auth/[...nextauth]/
│   │   ├── employees/
│   │   ├── attendance/
│   │   ├── leaves/
│   │   ├── salary/
│   │   ├── payroll/
│   │   ├── holidays/
│   │   ├── tenants/
│   │   └── performance/    # cycles, reviews, goals, feedback
│   ├── login/
│   └── unauthorized/
├── components/
│   ├── layout/             # sidebar, topbar, app-shell
│   ├── ui/                 # page, status-badge, print-button
│   ├── employees/          # forms, list, detail tabs
│   ├── attendance/
│   ├── leaves/
│   ├── salary/
│   ├── payroll/
│   ├── super-admin/
│   ├── settings/
│   └── auth/
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # requireAuth/requireRole helpers
│   ├── auth-options.ts     # NextAuth config
│   ├── nav.ts              # role-based navigation config
│   └── utils.ts            # cn, formatCurrency, formatDate, etc.
└── types/
    └── next-auth.d.ts      # session type augmentation

prisma/
├── schema.prisma           # multi-tenant schema
├── seed.ts                 # demo data seed
└── migrations/             # migration history
```

## Multi-Tenancy

Every tenant-scoped table has a `tenantId` column. The `User` model links to a tenant (null for super admins). All API routes and pages enforce tenant isolation by filtering on `user.tenantId`. Prisma's cascade deletes ensure tenant data is removed when a tenant is deleted.
