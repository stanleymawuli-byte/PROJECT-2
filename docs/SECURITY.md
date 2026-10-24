# Security baseline and known work

Implemented in this foundation:
- PostgreSQL parameterized queries for API database access
- bcrypt password hashing (cost 12) with a separately configured server-side pepper
- JWTs with issuer, audience, algorithm restriction and 30-minute expiry
- TOTP MFA required at login for enrolled accounts; login blocks accounts not yet enrolled
- role middleware for users and record operations
- login rate limiting, Helmet, request body size limit, Zod validation
- audit events for login, MFA enablement, user creation/disable and record create/update/delete
- generic production error responses

Before production:
- Add automated tests for authentication, role boundaries, and record lifecycle
- Encrypt TOTP secrets at rest and implement MFA reset/recovery policy
- Add secure refresh-token/session revocation strategy
- Add CSRF controls if switching to cookie-based auth; keep tokens out of localStorage in production web builds
- Add audit log export and tamper-evident retention
- Add scheduled encrypted database backups and restore drills
- Add dependency scanning, CI, secret scanning and security headers/CSP review
- Configure TLS, production CORS allowlist, log redaction, monitoring and alerts
- Validate backup restore in staging before any production restore
- Perform independent security review before handling sensitive or regulated data

Never commit real credentials, JWT secrets, pepper values, TOTP seeds, private keys, or database backups to Git.
