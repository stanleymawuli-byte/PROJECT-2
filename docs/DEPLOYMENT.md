# Deployment checklist

This repository does not contain cloud credentials and no live deployment has been performed yet.

## Before cloud deployment
- Complete MFA enrollment UI, authorization tests, and session revocation.
- Run backend syntax checks, frontend production build, dependency audit and secret scanning.
- Create an AWS account as the owner; enable MFA on root and admin identities, use least-privilege IAM, and configure billing alerts.
- Choose a managed PostgreSQL service and Node.js hosting; keep the database private and allow inbound access only from the API.
- Configure environment secrets in the hosting provider. Never commit .env files or use development secrets in production.
- Set CORS to the exact HTTPS web origin; enable TLS; configure health checks, logs, monitoring and alerts.
- Configure automated encrypted backups, retention, and restore tests in a separate staging database.
- Build mobile app against the deployed HTTPS API; test on Android and iOS devices before release.
- Store OpenPGP private keys offline and protect them with a strong passphrase. Never upload private keys to GitHub.
- Run end-to-end acceptance and independent security testing before handling real users' data.
