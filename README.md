# Project Two — Secure Records Platform

Project Two is a standalone web and mobile application built with React, Node.js/Express, and PostgreSQL. It is independent of Project One and does not use XAMPP/MySQL as its database.

## Architecture
- `backend/`: Express REST API, PostgreSQL access, authentication, MFA and role checks
- `database/schema.sql`: PostgreSQL tables and indexes
- `frontend/`: React/Vite administration and records interface
- `mobile/`: Expo React Native starter for Android and iOS
- `docs/`: setup, security baseline and delivery plan

## Implemented foundation
- Parameterized PostgreSQL queries
- bcrypt password hashing with a separate server-side pepper
- TOTP multi-factor authentication endpoints
- JWT authentication with short expiry
- Role checks for admin, manager, inputer and viewer
- User and record endpoints
- Audit events and summary reports
- Responsive web dashboard and mobile starter

## Quick start
Follow [docs/SETUP.md](docs/SETUP.md). Never commit `.env` or real credentials. Apply the schema to the intended PostgreSQL database only after confirming the target database. Existing database contents must not be dropped or replaced.

## Delivery status
This is an initial implementation foundation, not a claim of production readiness. Automated tests, full MFA enrollment UX, complete mobile flows, automated backup/restore, AWS provisioning and release validation remain to be completed. Do not use it with sensitive production data until the security checklist is complete.
