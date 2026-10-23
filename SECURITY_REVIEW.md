# Security hardening checklist

This checklist records work needed before the survey platform is used with real users or payments.

## Secrets and configuration
- Keep Daraja credentials, Firebase service-account data, and API tokens in deployment environment variables or a secret manager.
- Do not commit `.env` files or real credentials.
- Rotate any credentials that have ever been committed; removing them from the current file does not remove them from Git history.
- Fail startup clearly when required production configuration is missing instead of silently using placeholder or real-looking defaults.

## Reward endpoint
- Require authentication and authorization on reward/payment initiation routes.
- Validate recipient phone numbers and amounts on the server; never trust client-supplied reward values.
- Add rate limiting and idempotency protection to prevent duplicate payouts.
- Avoid logging access tokens, consumer secrets, phone numbers, or payment payloads unnecessarily.

## Payment callbacks
- Verify callback authenticity using the provider's supported mechanism before trusting a result.
- Persist transaction state and handle duplicate, delayed, failed, and timed-out callbacks safely.
- Do not return a success state merely because a callback request reached the server.

## Firestore rules
- Test unauthenticated access, cross-user reads/writes, creates, updates, and deletes in the Firebase Emulator Suite.
- On create, validate ownership against `request.resource.data`; on update, validate both existing and incoming ownership.
- Keep privileged/admin writes restricted to a trusted, server-verified role.

## Release checks
- Run the project's tests and linting after each change.
- Review the complete diff before merging the `security-hardening` branch.
- Treat this checklist as outstanding until each item is verified in code and tests.
