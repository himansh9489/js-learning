# Security in React Applications

Security in frontend is a **defence-in-depth layer** — the backend is the real gatekeeper, but a careless frontend can expose tokens, execute attacker scripts, or leak sensitive data. Understanding both is mandatory.

---

## 1. XSS — Cross-Site Scripting

### What

XSS is an attack where malicious JavaScript is injected into a page and executed in the victim's browser. The attacker can steal cookies, tokens, keystrokes, or perform actions on the user's behalf.

Three variants:

- **Stored XSS** — malicious script is saved in the database and served to every user who views that content (e.g., a comment field).
- **Reflected XSS** — script is embedded in a URL and reflected back in the response (e.g., a search query rendered raw).
- **DOM-based XSS** — script is injected through client-side DOM manipulation without a server round-trip.

### Why React is Safer by Default

React **automatically escapes** all string values before rendering them. If a user submits `<script>alert('xss')</script>`, React renders it as the literal text string — not executable HTML.

```tsx
const userInput = '<script>alert("xss")</script>';

// React renders this as plain text — safe ✅
const Safe = () => <div>{userInput}</div>;
```

### When You Break React's Protection: `dangerouslySetInnerHTML`

The only React API that bypasses escaping. Use it only with **sanitized HTML** — never with raw user input.

```tsx
// ✅ SAFE — sanitize first with DOMPurify
import DOMPurify from 'dompurify';

// ❌ DANGEROUS — executes attacker script
const Dangerous = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: html }} />;

const SafeHtml = ({ html }: { html: string }) => <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
```

### Practical Example — Blog Post Renderer

```tsx
import DOMPurify from 'dompurify';

interface PostProps {
	title: string;
	htmlContent: string; // Rich text from a CMS — may contain <b>, <em>, <a>
}

const BlogPost = ({ title, htmlContent }: PostProps) => {
	const clean = DOMPurify.sanitize(htmlContent, {
		ALLOWED_TAGS: ['b', 'em', 'a', 'p', 'ul', 'li'],
		ALLOWED_ATTR: ['href', 'target'],
	});

	return (
		<article>
			<h1>{title}</h1>
			<div dangerouslySetInnerHTML={{ __html: clean }} />
		</article>
	);
};
```

### Where Else XSS Can Sneak In

```tsx
// ❌ Never construct href from user input without validation
const Link = ({ url }: { url: string }) => <a href={url}>Click</a>;
// Attacker passes: javascript:alert('xss')

// ✅ Validate the protocol
const SafeLink = ({ url }: { url: string }) => {
	const isSafe = url.startsWith('https://') || url.startsWith('http://');
	return isSafe ? <a href={url}>Click</a> : <span>Invalid link</span>;
};
```

---

## 2. Authentication — Token Handling

### What

Authentication proves identity. In SPAs, this is typically a JWT or session token that must be stored client-side and sent with every API request.

### Storage Options and Trade-offs

| Storage              | XSS Risk | CSRF Risk | Notes                                                            |
| -------------------- | -------- | --------- | ---------------------------------------------------------------- |
| `localStorage`       | High     | None      | JS-accessible, persists across tabs and sessions                 |
| `sessionStorage`     | High     | None      | JS-accessible, cleared on tab close                              |
| Memory (JS variable) | Low      | None      | Lost on refresh — must re-authenticate                           |
| `httpOnly` cookie    | None     | High      | Not accessible to JS — best for tokens; requires CSRF protection |

### Why `httpOnly` Cookies Are Preferred for Tokens

An `httpOnly` cookie is set by the server and is **invisible to JavaScript** — `document.cookie` cannot read it. This completely eliminates the XSS → token theft attack vector.

```
Set-Cookie: session=abc123; HttpOnly; Secure; SameSite=Strict
```

### Practical Example — JWT in Memory (SPA pattern)

```tsx
// auth.ts — store token in module-level memory, not localStorage
let accessToken: string | null = null;

export const setToken = (token: string) => {
	accessToken = token;
};
export const getToken = () => accessToken;
export const clearToken = () => {
	accessToken = null;
};
```

```tsx
// api.ts — inject token into every request
import axios from 'axios';

import { getToken } from './auth';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use((config) => {
	const token = getToken();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});
```

The token lives only in memory — a page refresh requires re-login (or a silent refresh using an `httpOnly` refresh-token cookie).

### Refresh Token Flow

```
[User Logs In]
      ↓
Server sends: accessToken (short-lived, 15 min) in JSON body
              refreshToken (long-lived, 7 days) in httpOnly cookie
      ↓
[accessToken stored in memory]
      ↓
[API call fails with 401]
      ↓
[Interceptor calls /refresh — browser sends httpOnly cookie automatically]
      ↓
[Server validates refreshToken, issues new accessToken]
      ↓
[Retry original request]
```

```tsx
api.interceptors.response.use(
	(res) => res,
	async (error) => {
		if (error.response?.status === 401 && !error.config._retry) {
			error.config._retry = true;
			const { data } = await axios.post('/auth/refresh'); // cookie sent automatically
			setToken(data.accessToken);
			error.config.headers.Authorization = `Bearer ${data.accessToken}`;
			return api(error.config);
		}
		return Promise.reject(error);
	},
);
```

---

## 3. Authorization — Who Can See What

### What

Authorization controls what an authenticated user is **permitted to do**. A logged-in user should not be able to access another user's data or admin-only routes.

### AuthN vs AuthZ

- **Authentication (AuthN)**: "Are you who you say you are?" → login, JWT validation
- **Authorization (AuthZ)**: "Are you allowed to do this?" → role checks, permission gates

### Critical Rule: Frontend AuthZ is UX, Not Security

Never rely solely on hiding a button or route to enforce permissions. The backend API must validate every request independently.

```tsx
// ❌ Security by obscurity — an attacker can call the API directly
const Dashboard = () => {
	if (!user.isAdmin) return null; // hides UI, but /api/admin is still accessible
	return <AdminPanel />;
};

// ✅ Frontend hides UI for UX; backend enforces via middleware
// Backend: app.get('/api/admin', requireRole('admin'), handler)
```

### Practical Example — Role-Based Route Guard

```tsx
// ProtectedRoute.tsx
import { Navigate } from 'react-router-dom';

interface Props {
	children: React.ReactNode;
	requiredRole: 'admin' | 'user' | 'merchant';
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
	const { user, isAuthenticated } = useAuth();

	if (!isAuthenticated) return <Navigate to="/login" replace />;
	if (user.role !== requiredRole) return <Navigate to="/unauthorized" replace />;

	return <>{children}</>;
};

// Routes
<Route
	path="/admin"
	element={
		<ProtectedRoute requiredRole="admin">
			<AdminDashboard />
		</ProtectedRoute>
	}
/>;
```

### Practical Example — Permission-Based UI

```tsx
// permissions.ts
export const can = (user: User, action: string): boolean => {
	const permissions: Record<string, string[]> = {
		admin: ['read', 'write', 'delete', 'manage_users'],
		user: ['read', 'write'],
		guest: ['read'],
	};
	return permissions[user.role]?.includes(action) ?? false;
};

// Component
const PostActions = ({ post }: { post: Post }) => {
	const { user } = useAuth();

	return (
		<div>
			<button>View</button>
			{can(user, 'write') && <button>Edit</button>}
			{can(user, 'delete') && <button>Delete</button>}
		</div>
	);
};
```

---

## 4. CSRF — Cross-Site Request Forgery

### What

CSRF tricks a logged-in user's browser into making an unintended request to your server (e.g., transferring money) by exploiting the fact that browsers automatically send cookies with every request.

### Why SPAs Are Less Vulnerable to CSRF

If your SPA stores tokens in memory and sends them via `Authorization: Bearer` header, CSRF is not a concern — the attacker's site cannot read the token and cannot set custom headers cross-origin.

CSRF only applies if you use **cookies** for auth (including `httpOnly` cookies).

### CSRF Protection Patterns

1. **SameSite cookie flag** — most effective modern defence:

```
 Set-Cookie: session=abc; SameSite=Strict; Secure
```

`Strict` prevents the cookie from being sent on cross-site requests entirely. `Lax` allows top-level navigation (GET) but blocks POST/PUT/DELETE. 2. **CSRF token** — server generates a random token, embeds it in the page, and requires it in a custom header:

```tsx
// Read CSRF token from meta tag (injected by server)
const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');

axios.defaults.headers.common['X-CSRF-Token'] = csrfToken;
```

---

## 5. Content Security Policy (CSP)

### What

CSP is an HTTP response header that tells the browser which sources of scripts, styles, and other resources are trusted. It is the strongest XSS mitigation at the infrastructure level.

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.trusted.com; style-src 'self' 'unsafe-inline'
```

### What Each Directive Does

| Directive         | Controls                                                               |
| ----------------- | ---------------------------------------------------------------------- |
| `default-src`     | Fallback for all resource types                                        |
| `script-src`      | Which origins can serve `<script>`                                     |
| `style-src`       | Which origins can serve `<style>` / `<link>`                           |
| `img-src`         | Image sources                                                          |
| `connect-src`     | XHR / fetch / WebSocket destinations                                   |
| `frame-ancestors` | Which pages can embed this page in an `<iframe>` (blocks clickjacking) |

### Practical Example — React SPA with CDN Assets

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'nonce-{random}';
  style-src 'self' 'unsafe-inline';
  img-src 'self' https://d30gqtvesfc1d5.cloudfront.net data:;
  connect-src 'self' https://api.yourdomain.com;
  frame-ancestors 'none';
```

`'nonce-{random}'` — each inline script must include the matching nonce attribute to execute.

---

## 6. Dependency Security

### What

Third-party npm packages can introduce vulnerabilities — either through bugs or supply chain attacks (a maintainer's account gets compromised and publishes malicious code).

### Practical Hygiene

```bash
# Audit for known vulnerabilities
npm audit

# Fix automatically where possible
npm audit fix

# Force-fix (may introduce breaking changes — test after)
npm audit fix --force
```

### Tools

- `**npm audit**` — built-in, checks against npm advisory database
- **Snyk** — more thorough, integrates into CI/CD pipelines
- **Dependabot** (GitHub) — auto-creates PRs to update vulnerable dependencies
- **Socket.dev** — detects supply chain attacks (unusual behavior in new package versions)

### Principles

- Audit in CI on every PR — block merges if high-severity vulnerabilities are found.
- Pin exact versions in `package-lock.json` / `yarn.lock` and commit the lock file.
- Review what you install — `npm install leftpad` for a one-liner is not worth the supply chain risk; write it yourself.
- Prefer packages with active maintenance and many dependents (less likely to be abandoned or hijacked).

---

## 7. Environment Variables and Secret Leakage

### What

In Vite/CRA, any variable prefixed `VITE_` or `REACT_APP_` is **bundled into the client-side JavaScript** and readable by anyone who opens DevTools.

### What to Put in `VITE_`\* Variables

- Public API base URLs
- Feature flag keys
- Analytics/monitoring IDs (Sentry DSN, etc.)

### What Never to Put in `VITE_*` Variables

- API secret keys
- Database credentials
- Private keys / signing secrets
- Third-party service secret tokens

```tsx
// ✅ Safe — public base URL
const API_URL = import.meta.env.VITE_API_BASE_URL;

// ❌ Never — this ends up in your JS bundle, visible to all users
const SECRET_KEY = import.meta.env.VITE_STRIPE_SECRET_KEY;
```

**Rule:** If a key has "secret" in its name, it lives on the server only.

---

## 8. Secure HTTP Headers (Beyond CSP)

Set these headers on every response from your server/CDN:

| Header                            | Purpose                                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `Strict-Transport-Security`       | Forces HTTPS — prevents protocol downgrade attacks           |
| `X-Frame-Options: DENY`           | Prevents clickjacking via `<iframe>` embedding               |
| `X-Content-Type-Options: nosniff` | Prevents MIME-type sniffing attacks                          |
| `Referrer-Policy: strict-origin`  | Limits how much URL info leaks to third parties              |
| `Permissions-Policy`              | Disables browser features (camera, mic) the app doesn't need |

---

## Best Practices Summary

- React escapes JSX by default — don't break it with `dangerouslySetInnerHTML` unless sanitized.
- Never trust the frontend for authorization — the backend enforces all permissions.
- Store tokens in memory or `httpOnly` cookies, not `localStorage`.
- Use `SameSite=Strict` on session cookies to prevent CSRF.
- Set a strong CSP header at the infrastructure level.
- Audit dependencies in CI with `npm audit` or Snyk.
- Never put secrets in `VITE_*` env vars — they are public.

---

## Interview Q&A

**Q1. How does React prevent XSS by default?**

React escapes all values interpolated in JSX before inserting them into the DOM. If you write `{userInput}`, React calls `textContent` under the hood (not `innerHTML`), so `<script>` tags are rendered as literal text. The only escape hatch is `dangerouslySetInnerHTML`, which signals to the developer that they are opting out of this protection and must sanitize the content themselves.

---

**Q2. What is the difference between XSS and CSRF?**

- **XSS** — attacker injects and runs JavaScript in _your_ site's context, stealing data or hijacking sessions.
- **CSRF** — attacker tricks a user into making an _unintended request_ to your site (e.g., by loading an image `<img src="https://bank.com/transfer?to=attacker&amount=1000">`). The browser auto-sends the cookie, so the server sees a valid authenticated request.

XSS is a client-side code injection attack. CSRF is an unauthorized action triggered via the victim's authenticated session.

---

**Q3. Where should you store JWT tokens in a browser?**

The options and trade-offs:

- `**localStorage`\*\* — persistent but accessible to JS, vulnerable to XSS token theft.
- **Memory (JS variable)** — not accessible via XSS after page load but lost on refresh.
- `**httpOnly` cookie\*\* — invisible to JS (safest from XSS), but requires CSRF protection.

Best practice for high-security apps: **access token in memory + refresh token in an `httpOnly` cookie**. On refresh, the silent refresh endpoint uses the cookie to issue a new access token without exposing the refresh token to JavaScript.

---

**Q4. Can you secure a route purely on the frontend?**

No. A frontend route guard (`<ProtectedRoute>`) improves UX by redirecting unauthorized users, but it is not a security control. An attacker can bypass it by calling the API directly with `curl` or Postman. All authorization must be enforced in the backend via middleware that validates the token and checks permissions on every request.

---

**Q5. What is Content Security Policy and why is it important?**

CSP is an HTTP header that instructs the browser to only execute scripts, load styles, and fetch resources from trusted origins. It is the strongest available XSS mitigation because even if an attacker injects a `<script>` tag into the DOM, the browser will refuse to execute it if it doesn't match the CSP allowlist. Without CSP, the browser executes anything in the DOM regardless of how it got there.

---

**Q6. What is a supply chain attack in the context of npm?**

A supply chain attack targets your dependencies rather than your code directly. For example, an attacker could compromise a maintainer's npm account and publish a new version of a popular package that includes malicious code. Every project that runs `npm install` or upgrades that package pulls in the malicious code. Defence strategies include: auditing with `npm audit` or Snyk, reviewing changelogs before major upgrades, using lockfiles, and tools like Socket.dev that detect behavioral anomalies in new package versions.

---

**Q7. What is clickjacking and how do you prevent it?**

Clickjacking embeds your site in an invisible `<iframe>` on an attacker's page. The attacker overlays their UI on top so the user thinks they're clicking on the attacker's page but is actually clicking on your site's buttons (e.g., "Confirm Transfer"). Prevention:

- `X-Frame-Options: DENY` — older header, prevents all iframe embedding.
- CSP `frame-ancestors 'none'` — modern equivalent, more flexible.

---

**Q8. How do you prevent sensitive data from leaking via console logs or error messages?**

- Never log tokens, passwords, PII (names, emails, phone numbers) to the console — use `console.warn/error` for operational data only.
- Configure error boundaries to log to a monitoring service (e.g., Sentry) with PII scrubbing enabled.
- Ensure API error responses don't return stack traces or internal paths in production.
- Use `no-console` ESLint rules to prevent raw `console.log` in production code.

---

**Q9. What is the `SameSite` cookie attribute and what are its values?**

`SameSite` controls when cookies are sent on cross-site requests:

- `Strict` — cookie is never sent on cross-site requests, even on top-level navigation. Maximum CSRF protection but may break OAuth flows that redirect back to your site.
- `Lax` — cookie is sent on top-level GET navigation (clicking a link) but not on cross-site POST/PUT/DELETE. The practical default.
- `None` — cookie is sent on all cross-site requests; must be combined with `Secure` (HTTPS only). Required for third-party cookie use cases.

---

**Q10. What is the difference between authentication and authorization? Give a real example.**

Authentication = proving identity. Authorization = verifying permission.

Real example in a fintech app:

- A user logs in with phone + OTP → **authenticated** (we know who they are).
- They try to view another user's portfolio → the backend checks their user ID against the resource owner → **not authorized** (they are blocked).
- They try to access the admin dashboard → the backend checks their role (`user` vs `admin`) → **not authorized**.

The frontend can hide the admin link for UX, but only the backend can enforce the authorization. A user can always open DevTools, modify the UI, and send requests manually — the backend must reject unauthorized requests regardless of what the frontend shows.
