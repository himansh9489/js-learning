# Routing and RBAC in React

---

## Mental Model

```
Routing  = mapping a URL to a component
Auth     = verifying who the user is (login)
RBAC     = deciding what an authenticated user can access (permissions)

URL ──► Router ──► Auth check ──► Role check ──► Render component
                       │                │
                  Redirect /login   Redirect /forbidden
```

---

## Part 1 — React Router

---

### What

React Router is the standard client-side routing library for React. It maps URL paths to components and manages navigation without full page reloads.

### Why

SPAs (Single Page Applications) have one HTML file. React Router intercepts browser navigation events and swaps components in and out instead of fetching a new page from the server.

### Router Types

React Router ships four router components. Each handles the browser's history stack differently.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ROUTER TYPES COMPARISON                                                │
├──────────────────┬──────────────────────┬──────────────────────────────┤
│ Router           │ URL looks like       │ When to use                  │
├──────────────────┼──────────────────────┼──────────────────────────────┤
│ BrowserRouter    │ /dashboard           │ Standard web app with server │
│ HashRouter       │ /#/dashboard         │ Static hosts, WebViews       │
│ MemoryRouter     │ (no URL change)      │ Tests, React Native          │
│ StaticRouter     │ /dashboard (SSR)     │ Server-side rendering        │
└──────────────────┴──────────────────────┴──────────────────────────────┘
```

---

### Router Types — Full Differences

```
┌────────────────────────────┬───────────────┬───────────────┬───────────────┬───────────────┐
│ Dimension                  │ BrowserRouter │ HashRouter    │ MemoryRouter  │ StaticRouter  │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ History mechanism          │ HTML5 History │ URL fragment  │ In-memory     │ None (static) │
│                            │ API           │ (#)           │ array         │               │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ URL example                │ /dashboard    │ /#/dashboard  │ (no change)   │ /dashboard    │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ URL fragment sent to server│ Yes           │ No (# and     │ N/A           │ Yes (it IS    │
│                            │               │ after never   │               │ the server)   │
│                            │               │ sent)         │               │               │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Server config needed?      │ Yes — must    │ No            │ No            │ N/A           │
│                            │ redirect all  │               │               │               │
│                            │ paths →       │               │               │               │
│                            │ index.html    │               │               │               │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ 404 on hard refresh?       │ Yes, if server│ No            │ N/A           │ N/A           │
│                            │ not configured│               │               │               │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ SEO friendly?              │ Yes           │ No (crawlers  │ No            │ Yes (SSR)     │
│                            │               │ ignore #)     │               │               │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Works without a server?    │ No            │ Yes           │ Yes           │ N/A           │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Runs in the browser?       │ Yes           │ Yes           │ Yes           │ No (server    │
│                            │               │               │               │ only)         │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ URL visible / shareable?   │ Yes           │ Yes (with #)  │ No            │ Yes           │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Supports Back / Forward?   │ Yes           │ Yes           │ Yes           │ No            │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Works in React Native?     │ No            │ No            │ Yes           │ No            │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Works in WebView?          │ Risky         │ Yes ✅        │ Yes           │ No            │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Good for testing?          │ No            │ No            │ Yes ✅        │ No            │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Good for SSR?              │ No            │ No            │ No            │ Yes ✅        │
├────────────────────────────┼───────────────┼───────────────┼───────────────┼───────────────┤
│ Navigation triggers        │ pushState /   │ hashchange    │ Internal      │ None          │
│                            │ popstate      │ event         │ dispatch      │               │
└────────────────────────────┴───────────────┴───────────────┴───────────────┴───────────────┘
```

---

### How Each Router Handles Navigation Internally

```
BrowserRouter
  User clicks <Link to="/dashboard">
       │
       ▼
  history.pushState({}, '', '/dashboard')   ← writes to browser history
       │
       ▼
  React Router reads window.location.pathname = '/dashboard'
       │
       ▼
  Renders <Dashboard />
  URL bar: https://app.com/dashboard        ← clean URL, visible to server

────────────────────────────────────────────────────────────────────

HashRouter
  User clicks <Link to="/dashboard">
       │
       ▼
  window.location.hash = '#/dashboard'      ← only the fragment changes
       │
       ▼
  hashchange event fires
       │
       ▼
  React Router reads window.location.hash = '#/dashboard'
       │
       ▼
  Renders <Dashboard />
  URL bar: https://app.com/#/dashboard      ← server only ever sees "/"

────────────────────────────────────────────────────────────────────

MemoryRouter
  User clicks <Link to="/dashboard">
       │
       ▼
  Internal history stack: ['/home', '/dashboard']  ← no browser API called
       │
       ▼
  React Router reads from internal stack
       │
       ▼
  Renders <Dashboard />
  URL bar: (unchanged)                      ← zero effect on address bar

────────────────────────────────────────────────────────────────────

StaticRouter
  Express request: GET /dashboard
       │
       ▼
  <StaticRouter location="/dashboard">      ← location injected by server
       │
       ▼
  Renders <Dashboard /> synchronously once
       │
       ▼
  renderToString() → HTML string → sent to browser
  (no navigation ever happens — one-shot render)
```

---

### When the Same Route Definition Works Across All Routers

The inner `<Routes>` / `<Route>` tree is **identical regardless of which router you use**. The only change is the outermost wrapper:

```jsx
// The routes definition — never changes
function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Home />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/profile"   element={<Profile />} />
    </Routes>
  );
}

// Production web app
<BrowserRouter><AppRoutes /></BrowserRouter>

// Production WebView / static host
<HashRouter><AppRoutes /></HashRouter>

// Unit tests
<MemoryRouter initialEntries={['/dashboard']}><AppRoutes /></MemoryRouter>

// SSR server render
<StaticRouter location={req.url}><AppRoutes /></StaticRouter>
```

This is a key design principle — your route tree is portable. You swap only the outermost router to change the navigation strategy.

---

### 1. BrowserRouter

#### What

Uses the [HTML5 History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API) (`pushState`, `replaceState`, `popstate` event) to keep the UI in sync with the URL. The URL looks like a normal server URL — no `#`.

#### Why

Clean, shareable URLs. SEO-friendly. Works naturally with server-rendered HTML (Next.js) because each URL maps to a real server route.

#### When to use

- Any standard web application deployed behind a server (Node.js, Nginx, Apache)
- When you need clean URLs for sharing, bookmarking, or SEO

#### Where NOT to use

- Static file hosts that only serve `index.html` for `/` — visiting `/dashboard` directly returns a 404 because the server doesn't know about that path
- Android/iOS WebViews where there is no server at all

#### Server config requirement

The server must return `index.html` for **every path**, and let React Router take over from there.

```nginx
# Nginx config — serve index.html for all paths
location / {
  try_files $uri $uri/ /index.html;
}
```

```js
// Express config
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'build/index.html')));
```

#### Practical example

```jsx
// main.jsx
import { BrowserRouter } from 'react-router-dom';
// App.jsx
import { Link, Route, Routes } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
	<BrowserRouter>
		<App />
	</BrowserRouter>,
);

function App() {
	return (
		<>
			<nav>
				<Link to="/">Home</Link>
				<Link to="/dashboard">Dashboard</Link>
				<Link to="/profile">Profile</Link>
			</nav>

			<Routes>
				<Route path="/" element={<Home />} />
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="*" element={<NotFound />} />
			</Routes>
		</>
	);
}

// Navigating: /dashboard
// URL bar shows: https://example.com/dashboard    ← clean, no hash
```

---

### 2. HashRouter

#### What

Appends all routes after a `#` in the URL. The part after `#` is called the **fragment** — browsers never send it to the server. Navigation is handled entirely in the client.

#### Why

The server always receives a request for `/` (the part before `#`) and returns `index.html`. React Router reads the fragment and renders the correct component. **No server configuration needed.**

#### When to use

- Static file hosting (GitHub Pages, S3, Netlify without redirects)
- Android/iOS **WebViews** — there is no HTTP server; the app loads a local file
- Electron apps
- Situations where you cannot configure the server to redirect all paths to `index.html`

#### When NOT to use

- Public-facing web apps where SEO matters — search engine crawlers generally ignore the fragment
- Apps that need clean, shareable URLs

#### Practical example

```jsx
// main.jsx
import { HashRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')).render(
	<HashRouter>
		<App />
	</HashRouter>,
);

// App.jsx — routes are defined the same way
function App() {
	return (
		<Routes>
			<Route path="/gold" element={<GoldLanding />} />
			<Route path="/gold/buy" element={<BuyGold />} />
			<Route path="/gold/sell" element={<SellGold />} />
			<Route path="/gold/portfolio" element={<Portfolio />} />
		</Routes>
	);
}

// Navigating: /gold/buy
// URL bar shows: https://app.bharatpe.com/#/gold/buy
// Server always serves: index.html (because it only sees the request for /)
// React Router reads: #/gold/buy → renders <BuyGold />
```

> This codebase (`gold-invest`) uses `HashRouter` because it runs inside a native Android/iOS WebView. There is no HTTP server — the host app loads the bundle as a local file. The `#` ensures the WebView never issues a navigation request to an unknown URL.

---

### 3. MemoryRouter

#### What

Stores the routing history entirely **in memory** — the browser URL never changes. Useful when you need routing behaviour but have no DOM URL to work with.

#### When to use

- **Unit and integration tests** — you can set an initial URL without touching `window.location`
- **React Native** — no browser URL bar exists
- **Storybook** — render a routed component in isolation without side-effects on the address bar
- **Embedding** — a React widget loaded inside a third-party page where you cannot touch the host URL

#### Practical example — testing

```jsx
// UserProfile.test.jsx
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import UserProfile from './UserProfile';

test('renders user profile for given userId', () => {
	render(
		<MemoryRouter initialEntries={['/users/42']}>
			{' '}
			{/* set starting URL */}
			<Routes>
				<Route path="/users/:userId" element={<UserProfile />} />
			</Routes>
		</MemoryRouter>,
	);

	expect(screen.getByText('User 42')).toBeInTheDocument();
});

// Multiple navigation steps in a test
test('navigates from product list to detail page', async () => {
	render(
		<MemoryRouter initialEntries={['/products']}>
			<Routes>
				<Route path="/products" element={<ProductList />} />
				<Route path="/products/:id" element={<ProductDetail />} />
			</Routes>
		</MemoryRouter>,
	);

	fireEvent.click(screen.getByText('Gold Ring')); // navigate
	expect(await screen.findByText('Gold Ring Detail')).toBeInTheDocument();
});
```

#### Practical example — React Native

```jsx
// App.tsx (React Native)
import { MemoryRouter, Route, Routes } from 'react-router-native';

function App() {
	return (
		<MemoryRouter initialEntries={['/home']}>
			<Routes>
				<Route path="/home" element={<HomeScreen />} />
				<Route path="/profile" element={<ProfileScreen />} />
			</Routes>
		</MemoryRouter>
	);
}
```

---

### 4. StaticRouter

#### What

A router that **never changes location** — it takes a `location` prop and renders once, synchronously. Used on the **server side** during SSR to render the component tree for a given URL.

#### When to use

- Server-Side Rendering (Next.js custom server, Express + React SSR)
- Generating static HTML for each route at build time

#### Practical example — Express SSR

```jsx
// server.js (Node/Express)
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
// On the client — hydrate with BrowserRouter
// client.js
import { BrowserRouter } from 'react-router-dom';
import { StaticRouter } from 'react-router-dom/server';

import App from './App';

app.get('*', (req, res) => {
	const html = renderToString(
		<StaticRouter location={req.url}>
			{' '}
			{/* pass the current request URL */}
			<App />
		</StaticRouter>,
	);

	res.send(`
    <!DOCTYPE html>
    <html>
      <body>
        <div id="root">${html}</div>
        <script src="/bundle.js"></script>
      </body>
    </html>
  `);
});

hydrateRoot(
	document.getElementById('root'),
	<BrowserRouter>
		<App />
	</BrowserRouter>,
);
```

---

### Router Type Decision Guide

```
Is the app running inside a native WebView or Electron?
   YES → HashRouter

Is this a test or Storybook?
   YES → MemoryRouter

Is this SSR (server rendering HTML)?
   YES → StaticRouter (server) + BrowserRouter (client hydration)

Can you configure the server to redirect all paths to index.html?
   YES → BrowserRouter
   NO  → HashRouter
```

---

### Basic Setup

```jsx
// main.jsx
import { HashRouter } from 'react-router-dom';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')).render(
	<HashRouter>
		<App />
	</HashRouter>,
);
```

```jsx
// App.jsx
import { Navigate, Route, Routes } from 'react-router-dom';

function App() {
	return (
		<Routes>
			<Route path="/" element={<Home />} />
			<Route path="/about" element={<About />} />
			<Route path="/dashboard" element={<Dashboard />} />
			<Route path="*" element={<NotFound />} /> {/* catch-all 404 */}
		</Routes>
	);
}
```

---

### Dynamic Routes — `useParams`

A dynamic segment is prefixed with `:`. `useParams()` reads the value from the URL.

```jsx
// Component
import { useParams } from 'react-router-dom';

// Route definition
<Route path="/users/:userId/orders/:orderId" element={<OrderDetail />} />;

function OrderDetail() {
	const { userId, orderId } = useParams();

	return (
		<p>
			Order {orderId} for user {userId}
		</p>
	);
}

// URL: /users/42/orders/99
// userId = "42", orderId = "99"
```

---

### Query Parameters — `useSearchParams`

Query params (`?key=value`) are for optional filtering and don't change the route matched.

```jsx
import { useSearchParams } from 'react-router-dom';

function ProductList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const category = searchParams.get('category') ?? 'all';
  const page     = Number(searchParams.get('page') ?? 1);

  const setCategory = (cat: string) => {
    setSearchParams({ category: cat, page: '1' }); // resets page on category change
  };

  return (
    <div>
      <button onClick={() => setCategory('gold')}>Gold</button>
      <button onClick={() => setCategory('silver')}>Silver</button>
      <p>Showing: {category} — Page {page}</p>
    </div>
  );
}

// URL: /products?category=gold&page=2
```

---

### Nested Routes

Nested routes render a child component inside a parent layout. The parent must render `<Outlet />` where children should appear.

```jsx
// DashboardLayout.jsx
import { NavLink, Outlet } from 'react-router-dom';

// Routes definition — children of /dashboard share the DashboardLayout
<Routes>
	<Route path="/dashboard" element={<DashboardLayout />}>
		<Route index element={<DashboardHome />} /> {/* /dashboard */}
		<Route path="profile" element={<Profile />} /> {/* /dashboard/profile */}
		<Route path="settings" element={<Settings />} /> {/* /dashboard/settings */}
	</Route>
</Routes>;

function DashboardLayout() {
	return (
		<div className="layout">
			<nav>
				<NavLink to="/dashboard">Home</NavLink>
				<NavLink to="/dashboard/profile">Profile</NavLink>
				<NavLink to="/dashboard/settings">Settings</NavLink>
			</nav>
			<main>
				<Outlet /> {/* child route renders here */}
			</main>
		</div>
	);
}
```

---

### Programmatic Navigation — `useNavigate`

```jsx
import { useNavigate } from 'react-router-dom';
// Reading the state on the destination page
import { useLocation } from 'react-router-dom';

function PaymentSuccess() {
	const navigate = useNavigate();

	const handleGoBack = () => navigate(-1); // browser back
	const handleGoHome = () => navigate('/', { replace: true }); // replace history entry
	const handleGoOrder = () => navigate(`/orders/${orderId}`, { state: { from: 'payment' } });

	return (
		<div>
			<p>Payment successful!</p>
			<button onClick={handleGoOrder}>View Order</button>
			<button onClick={handleGoHome}>Go Home</button>
		</div>
	);
}

function OrderDetail() {
	const location = useLocation();
	const from = location.state?.from; // 'payment'
	return <p>Came from: {from}</p>;
}
```

---

### Lazy Loading Routes

Load route components only when the user navigates to them, reducing the initial bundle size.

```jsx
import { Suspense, lazy } from 'react';

import { Route, Routes } from 'react-router-dom';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const AdminPanel = lazy(() => import('./pages/AdminPanel'));

function App() {
	return (
		<Suspense fallback={<FullScreenSpinner />}>
			<Routes>
				<Route path="/dashboard" element={<Dashboard />} />
				<Route path="/profile" element={<Profile />} />
				<Route path="/admin" element={<AdminPanel />} />
			</Routes>
		</Suspense>
	);
}
```

---

## Part 2 — Protected Routes (Authentication)

### What

A Protected Route is a component that checks whether a user is authenticated before rendering a route. If not authenticated, it redirects to the login page.

### Why

Client-side protection prevents authenticated UI from rendering without a valid session. This is a UX guard — real security must always be enforced on the server.

### Pattern

```jsx
// ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) return <FullScreenSpinner />; // wait for auth check

  if (!user) {
    // Save where user was trying to go, redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

// After login — redirect back to where the user was headed
function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const from     = location.state?.from?.pathname ?? '/dashboard';

  const handleLogin = async (credentials) => {
    await login(credentials);
    navigate(from, { replace: true }); // go to the originally requested page
  };

  return <LoginForm onSubmit={handleLogin} />;
}

// Usage in routes
<Routes>
  <Route path="/login"     element={<LoginPage />} />
  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
  <Route path="/profile"   element={<ProtectedRoute><Profile /></ProtectedRoute>} />
</Routes>
```

---

### Cleaner Pattern — Layout Route as Auth Guard

Instead of wrapping every route individually, use a layout route that guards a whole group:

```jsx
// AuthGuard.jsx
function AuthGuard() {
	const { user, isLoading } = useAuth();
	const location = useLocation();

	if (isLoading) return <FullScreenSpinner />;
	if (!user) return <Navigate to="/login" state={{ from: location }} replace />;

	return <Outlet />; // render the matched child route
}

// Routes — cleaner grouping
<Routes>
	<Route path="/login" element={<LoginPage />} />
	<Route path="/signup" element={<SignupPage />} />

	{/* Everything inside AuthGuard is protected */}
	<Route element={<AuthGuard />}>
		<Route path="/dashboard" element={<Dashboard />} />
		<Route path="/profile" element={<Profile />} />
		<Route path="/orders" element={<Orders />} />
	</Route>
</Routes>;
```

---

## Part 3 — RBAC (Role-Based Access Control)

### What

RBAC restricts access to routes (and UI elements) based on the user's **role** or **permissions**, not just whether they are logged in.

### Authentication vs Authorization

```
Authentication  = "Who are you?"   → valid session / token
Authorization   = "What can you do?" → role / permission check

A logged-in user can fail authorization if they lack the required role.
```

### When to use

- Admin-only dashboards (settings, user management)
- Feature-flagged content visible only to certain user tiers
- Editor vs Viewer distinctions in a CMS
- Premium vs Free tier feature restrictions

---

### Role-Based Route Guard

```jsx
// RoleGuard.jsx
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RoleGuardProps {
  allowedRoles: string[];
}

function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/forbidden" replace />;

  return <Outlet />;
}

// Routes — group by required role
<Routes>
  <Route path="/login"    element={<LoginPage />} />
  <Route path="/forbidden" element={<ForbiddenPage />} />

  {/* Any logged-in user */}
  <Route element={<RoleGuard allowedRoles={['user', 'editor', 'admin']} />}>
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/profile"   element={<Profile />} />
  </Route>

  {/* Editor or admin only */}
  <Route element={<RoleGuard allowedRoles={['editor', 'admin']} />}>
    <Route path="/content/new"  element={<NewArticle />} />
    <Route path="/content/edit" element={<EditArticle />} />
  </Route>

  {/* Admin only */}
  <Route element={<RoleGuard allowedRoles={['admin']} />}>
    <Route path="/admin/users"    element={<UserManagement />} />
    <Route path="/admin/settings" element={<AdminSettings />} />
  </Route>
</Routes>
```

---

### Permission-Based RBAC (Granular)

Role-based works for simple apps. For large apps, individual **permissions** are more flexible — a user can have any combination of them.

```tsx
// type-definitions.ts
type Permission =
	| 'view:dashboard'
	| 'create:article'
	| 'edit:article'
	| 'delete:article'
	| 'view:admin'
	| 'manage:users';

interface User {
	id: string;
	name: string;
	role: 'user' | 'editor' | 'admin';
	permissions: Permission[];
}
```

```tsx
// usePermission.ts — custom hook
import { Permission } from '@/type-definitions';

import { useAuth } from './useAuth';

export function usePermission(required: Permission | Permission[]): boolean {
	const { user } = useAuth();
	if (!user) return false;

	const requiredArr = Array.isArray(required) ? required : [required];
	return requiredArr.every((p) => user.permissions.includes(p));
}

// PermissionGuard.tsx — reusable UI guard
function PermissionGuard({
	requires,
	children,
	fallback = null,
}: {
	requires: Permission | Permission[];
	children: React.ReactNode;
	fallback?: React.ReactNode;
}) {
	const hasPermission = usePermission(requires);
	return hasPermission ? <>{children}</> : <>{fallback}</>;
}

// Usage — hide UI elements based on permissions
function ArticlePage({ article }) {
	return (
		<article>
			<h1>{article.title}</h1>
			<p>{article.body}</p>

			{/* Only editors/admins see this button — no route redirect needed */}
			<PermissionGuard requires="edit:article">
				<button>Edit</button>
			</PermissionGuard>

			<PermissionGuard requires="delete:article">
				<button>Delete</button>
			</PermissionGuard>
		</article>
	);
}
```

---

### Full Combined Example — Auth + Role + Permission

```jsx
// Combining all three layers
<Routes>
	{/* Public */}
	<Route path="/login" element={<LoginPage />} />
	<Route path="/forbidden" element={<ForbiddenPage />} />

	{/* Authenticated only */}
	<Route element={<AuthGuard />}>
		{/* Any authenticated user */}
		<Route path="/dashboard" element={<Dashboard />} />
		<Route path="/profile" element={<Profile />} />

		{/* Admin role only */}
		<Route element={<RoleGuard allowedRoles={['admin']} />}>
			<Route path="/admin" element={<AdminLayout />}>
				<Route index element={<AdminHome />} />
				<Route path="users" element={<UserManagement />} />
				<Route path="analytics" element={<Analytics />} />
			</Route>
		</Route>
	</Route>
</Routes>
```

---

## Routing Hooks Reference

```
useNavigate()          — programmatic navigation, go back/forward
useParams()            — read dynamic segments (:id) from URL
useSearchParams()      — read/write query string (?key=value)
useLocation()          — current location object (pathname, state, search)
useMatch(pattern)      — test if current URL matches a pattern
useOutletContext()     — pass data from parent route to Outlet children
```

---

## Q&A

**Q: What is the difference between `BrowserRouter` and `HashRouter`?**
`BrowserRouter` uses the HTML5 History API — URLs look like `/dashboard`. This requires the server to return the same HTML for all deep links. `HashRouter` uses the URL hash — URLs look like `/#/dashboard`. The hash portion is never sent to the server, so it works with any static host or WebView that cannot handle arbitrary paths.

**Q: What is the difference between `<Link>` and `<NavLink>`?**
Both render anchor tags that navigate without a page reload. `NavLink` additionally applies an `active` class (or a custom `className` function) when its `to` prop matches the current URL — useful for highlighting active nav items.

**Q: What is the difference between `replace` and `push` navigation?**
`push` adds a new entry to the browser history stack (user can press Back to return). `replace` overwrites the current entry (user cannot go back to where they were). Use `replace: true` after login/logout or after redirecting from a protected route, so users don't navigate "back" into a logged-out state.

**Q: How do you redirect after login to the page the user originally requested?**
On redirect to `/login`, save the current location in router state: `<Navigate to="/login" state={{ from: location }} replace />`. After successful login, read `location.state?.from?.pathname` and call `navigate(from, { replace: true })`.

**Q: What is the difference between authentication and authorization (RBAC)?**
Authentication answers "Who are you?" — it verifies identity via credentials (login). Authorization answers "What can you do?" — it checks whether the authenticated user has the required role or permission to access a resource. A user can be authenticated but still unauthorized (e.g., a regular user trying to access an admin page).

**Q: Is client-side RBAC secure?**
No, on its own. Client-side RBAC is a **UX guard** — it prevents authorized content from rendering in the browser. But a user could manipulate the JavaScript or call APIs directly. Real security enforcement must happen on the server — every API endpoint must independently verify the user's role/permissions.

**Q: What is the `<Outlet />` component used for?**
`Outlet` is a placeholder in a parent route component that renders the matched child route. It is how nested routes work — the parent defines the layout, and `Outlet` is where the active child is injected.

**Q: How do you implement role-based access at the component level (not just route level)?**
Use a `PermissionGuard` component or a `usePermission` hook that reads the current user's permissions and conditionally renders its children. This is used to hide/show individual buttons, sections, or menu items — not just whole pages.

**Q: What is the purpose of `useLocation` and when would you use it?**
`useLocation` returns the current location object — `pathname`, `search` (query string), `hash`, and `state`. Uses include: reading state passed via `navigate(..., { state })`, knowing the current path to highlight nav items, or logging analytics page views when the pathname changes.

**Q: What is a "catch-all" route and when do you need one?**
A route with `path="*"` that matches any URL not matched by other routes. It renders a 404 Not Found page. Always put it last in your `<Routes>` block — React Router evaluates routes in order and the catch-all would match everything if placed first.

**Q: How do dynamic routes differ from query parameters?**
Dynamic route segments (`/users/:id`) represent a **required, identifying part of the resource** — they define which resource you are looking at. Query parameters (`?page=2&sort=name`) represent **optional filtering, pagination, or sorting** that don't change which resource is shown. Use `useParams` for dynamic segments and `useSearchParams` for query strings.

**Q: How does lazy loading work with React Router?**
Each route's component is wrapped in `React.lazy(() => import('./Page'))`. The component is only fetched when the user navigates to that route. A `<Suspense fallback={<Spinner />}>` wrapper around `<Routes>` shows a loading indicator while the chunk is being downloaded. This reduces the initial bundle — users only download code for pages they visit.

---

## Router Types — Q&A

**Q: What is the difference between BrowserRouter and HashRouter?**
`BrowserRouter` uses the HTML5 History API — the URL looks like `/dashboard` with no special character. The browser sends this path to the server on every hard refresh or direct visit, so the server must return `index.html` for all paths. `HashRouter` puts the route after a `#` — e.g., `/#/dashboard`. The browser never sends the fragment to the server, so any server returning `index.html` for `/` works without extra configuration.

**Q: Why does a BrowserRouter app show a 404 on page refresh but HashRouter does not?**
When you refresh `/dashboard` with `BrowserRouter`, the browser makes an HTTP GET request to `GET /dashboard`. If the server has no handler for that path and doesn't redirect to `index.html`, it returns a 404. With `HashRouter`, the browser requests `GET /` (everything after `#` is never sent to the server), the server returns `index.html`, and React Router reads `#/dashboard` from the fragment to render the right component.

**Q: How do you fix the BrowserRouter 404-on-refresh problem?**
Configure the server to return `index.html` for every unknown path. In Nginx: `try_files $uri $uri/ /index.html;`. In Express: `app.get('*', (req, res) => res.sendFile('index.html'))`. In `create-react-app` / Vite dev server this is handled automatically.

**Q: When would you use MemoryRouter?**
Three main scenarios: (1) **Tests** — you can set `initialEntries` to any URL without touching `window.location`, keeping tests isolated and fast. (2) **React Native** — there is no browser URL bar, so history must be kept in memory. (3) **Storybook / embedded widgets** — rendering a routed component in an environment where you must not change the host page's URL.

**Q: What is StaticRouter and why does it exist?**
`StaticRouter` is used on the **server** during SSR. It accepts the current request's URL as a `location` prop and renders the component tree synchronously once — it never navigates. The resulting HTML is sent to the browser. On the client, `BrowserRouter` takes over and React hydrates the pre-rendered HTML. `StaticRouter` never runs in the browser.

**Q: How does the History API work under the hood in BrowserRouter?**
The History API (`window.history`) provides `pushState(state, title, url)` and `replaceState()` to programmatically change the URL without triggering a server request. React Router wraps these calls. When the user clicks `<Link>`, React Router calls `history.pushState`, React re-renders the matching component, and the browser URL updates — all without a page reload. The `popstate` event fires when the user clicks Back/Forward, and React Router re-renders the component for the new URL.

**Q: Can you use multiple different routers in the same app?**
Yes, within limitations. A common pattern is using `MemoryRouter` only inside tests while the real app uses `BrowserRouter` or `HashRouter`. You cannot nest two `BrowserRouter` instances productively — nested routing should use `<Routes>` + `<Outlet>` within a single router.

**Q: What is `createBrowserRouter` (React Router v6.4+) and how is it different from `<BrowserRouter>`?**
`createBrowserRouter` is the data router API introduced in v6.4 that enables **loader** and **action** functions on routes — server-like data fetching and form mutation patterns co-located with route definitions. It also enables `defer` and `Await` for streaming. `<BrowserRouter>` is the simpler JSX-based router that doesn't support these data APIs. Both use the same History API under the hood.

```jsx
// createBrowserRouter — data router with loaders
const router = createBrowserRouter([
	{
		path: '/users/:id',
		element: <UserProfile />,
		loader: async ({ params }) => {
			return fetch(`/api/users/${params.id}`);
		},
		errorElement: <ErrorPage />,
	},
]);

// Component reads loader data via useLoaderData()
function UserProfile() {
	const user = useLoaderData();
	return <p>{user.name}</p>;
}
```

**Q: Why does this project (gold-invest) use HashRouter specifically?**
The app runs inside a native BharatPe Android/iOS WebView. The host app loads the JavaScript bundle as a local file — there is no HTTP server serving the app. Any URL the WebView navigates to that isn't explicitly handled by the native app could break the WebView. Using `HashRouter` means the WebView always loads the same base URL; only the fragment changes, which is invisible to the native layer. All route navigation stays entirely within React Router's fragment handling.
