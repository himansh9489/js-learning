# Security in React Applications

## Key Security Areas
- XSS prevention
- Secure authentication handling
- Authorization checks
- Dependency safety

## XSS Prevention
- React escapes text by default.
- Avoid unsafe HTML injection with `dangerouslySetInnerHTML` unless sanitized.
- Never trust user input.

## Auth and Token Handling
- Prefer secure server-managed sessions or httpOnly cookies when possible.
- Avoid exposing sensitive tokens in insecure storage patterns.

## AuthN vs AuthZ
- **Authentication**: who the user is.
- **Authorization**: what the user can do.
- Enforce permissions on backend, not only frontend.

## API and App Hardening
- Validate/sanitize on server.
- Use HTTPS.
- Add rate limiting and proper CORS setup.
- Keep dependencies updated and scan vulnerabilities.

## Interview Tip
Say: "Frontend improves security posture, but real enforcement must happen on the backend."
