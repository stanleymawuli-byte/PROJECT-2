# Project 2 — Implementation Plan

Work in small, verified stages. Keep Project 1 untouched.

## Phase 1 — Foundation
- Confirm local tools and versions.
- Keep development in the Project 2 folder and repository only.
- Establish project branches and documentation.
- Decide exact framework and AWS deployment design before provisioning cloud resources.

## Phase 2 — Database and backend
- Create schema and migrations.
- Implement health check, validation, database access, and API error handling.
- Add user and role management.
- Add authentication, password hashing with pepper, and 2FA.
- Add record management and audit events.
- Test permissions directly at API level.

## Phase 3 — Web frontend
- Build login and 2FA screens.
- Build role-specific dashboards and menus.
- Add records screens, user administration, reports, and system status.
- Handle loading, validation, errors, and session expiration.

## Phase 4 — Mobile app
- Create the Expo React Native app for Android and iOS.
- Add secure login/2FA flow and role-aware navigation.
- Connect to the shared API over HTTPS.
- Test on Android and iOS simulators/devices where available.

## Phase 5 — Backup, restore, and cryptography demonstration
- Add configuration snapshot and restore operations.
- Keep configuration restore separate from record-data backups.
- Run the record-preservation acceptance test in requirements.md.
- Generate an OpenPGP key pair with Kleopatra and document a safe public-key sharing/private-key protection demonstration.

## Phase 6 — Seed data and reports
- Create four non-production test accounts with distinct roles.
- Use temporary/demo credentials and require changing them on first use where feasible.
- Enter several sample records.
- Populate reporting tabs and verify each role sees only authorized data.

## Phase 7 — Deployment
- Review AWS account eligibility and pricing with the account owner.
- Provision only approved resources.
- Configure secrets outside Git.
- Deploy backend and web app, configure HTTPS and database access.
- Build and test the mobile app against the deployed API.
- Verify logs, backup access, restore behavior, and role permissions.

## Phase 8 — Submission evidence
- Architecture and database diagrams.
- Screenshots of all role interfaces.
- Evidence of 2FA and password hash storage (without revealing secrets).
- Records before/after configuration restore showing unchanged records.
- Backup history, system status, and report tabs.
- Kleopatra public/private key demonstration.
- Deployment URL and test results.

## Working rule
Before destructive operations, schema changes, account deletion, restore operations, or cloud resources that may incur costs, explain the effect and obtain confirmation. Never change Project 1.
