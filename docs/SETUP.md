# Project Two setup

Project Two is independent of Project One and does not use XAMPP/MySQL as its database. It uses Node.js/Express and PostgreSQL.

## 1. Prerequisites
- Node.js 20 or newer
- PostgreSQL installed and running
- Git
- VS Code

## 2. Create database and least-privilege account
Open the PostgreSQL SQL shell as a database administrator and run (choose a strong unique password; do not commit it):
```sql
CREATE ROLE project_two_app LOGIN PASSWORD 'REPLACE_WITH_A_LONG_UNIQUE_PASSWORD';
CREATE DATABASE project_two_db OWNER project_two_app;
```
If the database already exists, do not recreate or drop it. Instead grant the required access to the existing database and schema using your PostgreSQL administrator account.

Then apply `database/schema.sql` to `project_two_db` using pgAdmin or:
```powershell
psql -U project_two_app -d project_two_db -f database/schema.sql
```

## 3. Backend
```powershell
cd backend
npm install
Copy-Item .env.example .env
```
Edit `.env` locally. Set DATABASE_URL, JWT_SECRET, PASSWORD_PEPPER, CORS_ORIGIN. Use separate random secrets for JWT_SECRET and PASSWORD_PEPPER, each at least 32 characters. Keep .env out of Git. Never send secrets in chat or commit them.

Create the first administrator:
```powershell
npm run create-admin
```
To enable this script, add `"create-admin": "node scripts/create-admin.js"` to the backend package scripts if not present.
Start API:
```powershell
npm run dev
```
Health check: http://localhost:4000/api/health. It must report database connected.

## 4. Web frontend
In a second terminal:
```powershell
cd frontend
npm install
npm run dev
```
Open the local URL Vite prints (usually http://localhost:5173).

## 5. Multi-factor authentication
After the initial account is created, a protected account must enroll TOTP MFA. The current API provides `POST /api/auth/mfa/setup` and `POST /api/auth/mfa/verify`; setup returns a secret/otpauth URI for use with an authenticator app. Treat the secret like a password. After verification, sign-in requires the current six-digit code. In production, deliver enrollment material only over HTTPS and consider encrypting TOTP secrets at rest.

## 6. Mobile
```powershell
cd mobile
npm install
npx expo start
```
Set the API constant in `mobile/App.js` to your computer's LAN IP for local phone testing, or the deployed HTTPS API URL. A phone cannot normally use its own localhost to reach your PC.

## Roles
- admin: user management, record creation/update/deletion, reports
- manager: add users and manage records, no deletion of records
- inputer: create and view records
- viewer: view records only

## Backups and restore
Use PostgreSQL `pg_dump` for scheduled backups and `pg_restore`/psql for restoration into a separate staging database first. Test restore before production. Do not implement "restore settings" by overwriting live user/record data; separate configuration from business records.

## Deployment
Deploy API to a Node-capable host and PostgreSQL to a managed PostgreSQL service. Configure secrets in the host's environment settings, enforce HTTPS, restrict database network access, enable automated encrypted backups, and test recovery. Do not expose database ports publicly. AWS account creation, MFA, billing, and resource provisioning require the account owner.
