# Project 2 — Technical Architecture

## Proposed technology stack
- **Web frontend:** React + Vite + TypeScript.
- **Mobile:** React Native + Expo + TypeScript, targeting Android and iOS.
- **Backend:** PHP 8.2+ REST API, using a maintained framework if the local environment supports it (Laravel is the preferred option).
- **Database:** MySQL/MariaDB for local development; managed MySQL-compatible database may be used in AWS production.
- **Local tools:** Git, GitHub, VS Code, XAMPP for local PHP/MySQL support, Node.js LTS, and Composer.
- **Security demonstration:** Kleopatra/OpenPGP.
- **Deployment:** AWS. Final services must be selected after checking account eligibility, current pricing, and budget.

## Logical request flow
Web frontend and mobile app -> HTTPS REST API -> authentication/authorization middleware -> service layer -> database.

Both clients use the same API. The clients must not connect directly to the database.

## Backend modules
- Authentication and 2FA
- Users and roles
- Application records
- Reports and audit events
- Configuration management
- Backup/restore management
- Health/system status

## Password design
Use the framework's maintained password hashing API (Argon2id where available, otherwise a supported secure PHP password hash). It generates/manages the per-password salt. Apply a server-side pepper from an environment secret before hashing, with a documented and consistent implementation. Never store the pepper in the database or repository. Avoid custom cryptography and do not expose hashes or salts in reports.

## Two-factor authentication
Use TOTP authenticator-app codes where practical, with single-use recovery codes stored only as hashes. Require verification after password authentication and protect enrollment/reset flows. Do not log OTP values.

## Roles and permissions
Use role-based access control enforced in API middleware/policies. UI navigation reflects the user's role but is not the security boundary.

## Configuration-only restore
Store configuration snapshots separately from business records. A configuration restore operation may restore approved settings only; it must not run database-wide rollback or import application-record tables. Take an audit entry before and after the operation. Validate the restored settings and preserve a copy of the pre-restore configuration.

## Backup approach
Keep configuration snapshots separate from record/database backups. Encrypt backups, restrict access, and retain backup metadata such as creator, time, type, status, and checksum. Production backup storage must not be publicly accessible. Test restoration instead of assuming a backup is valid.

## AWS deployment principles
- Use HTTPS for public traffic.
- Keep secrets in a managed secret store or protected environment configuration.
- Restrict database network access to the backend.
- Use least-privilege IAM permissions.
- Enable logging and monitoring without logging passwords, OTPs, tokens, or secrets.
- Review current AWS pricing and account eligibility before provisioning billable resources.
