# Lazy Loading, Code Splitting, and Suspense

---

## What Is Lazy Loading?

Lazy loading is a performance strategy that **defers the loading of a module, component, or asset until it is actually needed** — instead of bundling and shipping everything upfront.

In React, `React.lazy()` enables component-level lazy loading. The bundler (Webpack/Vite) automatically splits the code at the dynamic `import()` boundary and emits a separate JS chunk. That chunk is only fetched from the network when the component is first rendered.

---

## Why Use It?

| Problem Without Lazy Loading                        | How Lazy Loading Solves It                          |
| --------------------------------------------------- | --------------------------------------------------- |
| Entire app JS ships in one large bundle             | Code is split into smaller chunks fetched on demand |
| Slow initial page load (high TTI/FCP)               | Only critical code loads first; rest deferred       |
| Users download code for routes they may never visit | Each route's code is fetched only when navigated to |
| Poor Core Web Vitals scores                         | Smaller initial payload → faster LCP, better CLS    |

---

## When to Use It

| Scenario                                      | Use Lazy Loading?              |
| --------------------------------------------- | ------------------------------ |
| Route-level components (pages)                | ✅ Always                      |
| Heavy modals / bottom sheets                  | ✅ Yes                         |
| Third-party libraries (charts, editors)       | ✅ Yes                         |
| Small, always-visible atoms (buttons, inputs) | ❌ No — overhead not worth it  |
| Components in the critical render path        | ❌ No — will delay first paint |
| Admin-only / rarely used features             | ✅ Yes                         |

---

## Where to Use It

1. **Route level** — most impactful; each page route becomes its own chunk.
2. **Heavy modals** — dialogs that are rarely opened and contain rich UI.
3. **Feature flags** — conditionally loaded features for A/B tests.
4. **Third-party widgets** — rich text editors, chart libraries, PDF viewers.
5. **Below-the-fold sections** — content not visible until the user scrolls.

---

## Key Terms

| Term               | Meaning                                                                              |
| ------------------ | ------------------------------------------------------------------------------------ |
| **Code Splitting** | Breaking one monolithic bundle into multiple smaller bundles                         |
| **Dynamic Import** | `import('./Module')` — the syntax that signals a split boundary                      |
| **Chunk**          | A separate JS file produced by the bundler at a split point                          |
| **Suspense**       | React's mechanism to show a fallback UI while a lazy chunk loads                     |
| **Waterfall**      | Sequential network requests — a pitfall to avoid when lazy loading nested components |
| **Preloading**     | Fetching a chunk early (before navigation) to eliminate perceived delay              |

---

## Practical Examples

### 1. Route-Level Lazy Loading (most common pattern)

```tsx
// routes/AppRoutes.tsx
import React, { Suspense, lazy } from 'react';

import { Route, Routes } from 'react-router-dom';

import PageSpinner from '@/components/atoms/page-spinner';

// Each lazy() call = a separate JS chunk emitted by Vite/Webpack
const LandingPage = lazy(() => import('@/components/screens/landing'));
const BuyPage = lazy(() => import('@/components/screens/buy'));
const PortfolioPage = lazy(() => import('@/components/screens/portfolio'));
const SettingsPage = lazy(() => import('@/components/screens/settings'));

export default function AppRoutes() {
	return (
		// Suspense must wrap all lazy components; fallback renders while chunk fetches
		<Suspense fallback={<PageSpinner />}>
			<Routes>
				<Route path="/gold" element={<LandingPage />} />
				<Route path="/gold/buy" element={<BuyPage />} />
				<Route path="/gold/portfolio" element={<PortfolioPage />} />
				<Route path="/gold/settings" element={<SettingsPage />} />
			</Routes>
		</Suspense>
	);
}
```

**What happens under the hood:**

- On app start → only `LandingPage` chunk is fetched (user is on `/gold`).
- When user navigates to `/gold/buy` → `BuyPage` chunk is fetched on demand.
- Subsequent visits to `/gold/buy` → chunk is cached; no re-fetch.

---

### 2. Lazy Loading a Heavy Modal

```tsx
// components/screens/portfolio/portfolio.tsx
import React, { Suspense, lazy, useState } from 'react';

// This entire modal (and its dependencies, e.g. a chart library) is excluded
// from the main bundle and loaded only when the user taps "View Details"
const GoldDetailsModal = lazy(() => import('@/components/molecules/gold-details-modal'));

export default function Portfolio() {
	const [showModal, setShowModal] = useState(false);

	return (
		<div>
			<button onClick={() => setShowModal(true)}>View Details</button>

			{showModal && (
				<Suspense fallback={<div className="ib-flex ib-justify-center ib-py-8">Loading...</div>}>
					<GoldDetailsModal onClose={() => setShowModal(false)} />
				</Suspense>
			)}
		</div>
	);
}
```

> **Why `{showModal &&`?** The lazy component is only mounted (and its chunk fetched) after `showModal` becomes `true`. If you render `<GoldDetailsModal>` unconditionally inside Suspense, the chunk is fetched on first render regardless of user interaction.

---

### 3. Named Export with Lazy (workaround)

`React.lazy()` only works with **default exports**. For named exports, wrap them:

```tsx
// Option A: re-export as default in the source file
// gold-chart.tsx
export default function GoldChart() { ... }

// Option B: wrap at the import site
const GoldChart = lazy(() =>
  import('@/components/molecules/gold-chart').then((mod) => ({ default: mod.GoldChart }))
);
```

---

### 4. Preloading a Route on Hover

Eliminate the chunk-fetch delay by preloading the chunk before navigation:

```tsx
import React, { Suspense, lazy } from 'react';

const BuyPage = lazy(() => import('@/components/screens/buy'));

// Trigger the fetch early — before the user actually clicks
function preloadBuy() {
	import('@/components/screens/buy'); // fire-and-forget; browser caches the chunk
}

function LandingCTA() {
	return (
		<button
			onMouseEnter={preloadBuy} // desktop: hover intent
			onTouchStart={preloadBuy} // mobile: touch intent
			onClick={() => navigate('/gold/buy')}>
			Buy Gold
		</button>
	);
}
```

---

### 5. Error Boundary + Suspense (production pattern)

Network requests can fail. Wrap lazy components with an error boundary so chunk load failures are caught gracefully:

```tsx
import React, { Suspense, lazy } from 'react';

import { ErrorBoundary } from 'react-error-boundary';

const HeavyReport = lazy(() => import('./HeavyReport'));

function ErrorFallback({ resetErrorBoundary }: { resetErrorBoundary: () => void }) {
	return (
		<div>
			<p>Failed to load this section.</p>
			<button onClick={resetErrorBoundary}>Retry</button>
		</div>
	);
}

export default function Dashboard() {
	return (
		<ErrorBoundary FallbackComponent={ErrorFallback}>
			<Suspense fallback={<p>Loading report...</p>}>
				<HeavyReport />
			</Suspense>
		</ErrorBoundary>
	);
}
```

---

### 6. Vite Bundle Analysis (verify your splits)

```bash
# Install the visualizer plugin
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';
export default { plugins: [visualizer({ open: true })] };

# Run build — opens an interactive treemap of all chunks
npm run build
```

Use this to confirm that heavy dependencies (e.g. chart libraries) are in their own chunks and not leaking into the main bundle.

---

## How Suspense Works Internally

```
1. React renders <Suspense fallback={<Spinner />}>
       └─ tries to render <LazyComponent />
2. LazyComponent throws a Promise (React's internal protocol)
3. React catches the Promise at the nearest <Suspense> boundary
4. React renders the fallback UI instead
5. When the Promise resolves (chunk loaded), React re-renders LazyComponent
6. Fallback is replaced by the real component
```

This is why any component inside `<Suspense>` that "suspends" (throws a Promise) will show the fallback — not just lazy-loaded components. React Query and Relay use the same mechanism for data fetching.

---

## Common Mistakes

| Mistake                                     | Why It's Wrong                                              | Fix                                           |
| ------------------------------------------- | ----------------------------------------------------------- | --------------------------------------------- |
| Defining `lazy()` inside a component        | Creates a new reference on every render → infinite re-fetch | Always define lazy components at module scope |
| No `<Suspense>` wrapper                     | React throws an error                                       | Always wrap lazy components in `<Suspense>`   |
| Using lazy for tiny components              | Network overhead > size savings                             | Only use for components > ~20 KB minified     |
| No error boundary                           | Failed chunk loads crash the app silently                   | Wrap with `<ErrorBoundary>` in production     |
| Wrapping the entire app in one `<Suspense>` | All lazy loads share one fallback → poor UX                 | Use per-section Suspense boundaries           |

---

## Best Practices Summary

- Apply lazy loading at the **route level first** — highest impact, lowest effort.
- Use **meaningful fallback UIs** (skeleton screens > spinners > "Loading...").
- **Preload** critical next-step routes on hover/touch to eliminate perceived latency.
- Always pair `Suspense` with an `ErrorBoundary` in production.
- Define `lazy()` calls at **module scope**, never inside components or hooks.
- Use **bundle analysis** (Rollup visualizer / Webpack Bundle Analyzer) to verify splits.
- Avoid lazy loading components in the **critical render path** (above-the-fold content).

---

## Interview Q&A

**Q1. What is `React.lazy()` and how does it work?**

`React.lazy()` accepts a function that returns a dynamic `import()` promise. When React first renders the lazy component, it throws the promise internally, which is caught by the nearest `<Suspense>` boundary. The boundary renders the fallback while the promise is pending. Once resolved, React re-renders with the actual component. The bundler (Vite/Webpack) sees the dynamic import and emits a separate JS chunk.

---

**Q2. What is the difference between lazy loading and code splitting?**

Code splitting is the **build-time process** — the bundler breaks the output into multiple chunks based on dynamic import boundaries. Lazy loading is the **runtime behaviour** — those chunks are fetched on demand rather than upfront. `React.lazy()` leverages code splitting to achieve lazy loading. You can code-split without lazy loading (e.g. manual chunk configuration in Vite), but `React.lazy()` does both at once.

---

**Q3. Why must lazy components be defined outside the component function?**

```tsx
// ❌ Wrong — re-creates LazyA on every render → re-fetches chunk every render
function App() {
  const LazyA = lazy(() => import('./A'));
  return <LazyA />;
}

// ✅ Correct — stable reference across renders
const LazyA = lazy(() => import('./A'));
function App() {
  return <LazyA />;
}
```

Defining inside the function creates a new function reference on every render, which React treats as a different component, causing it to unmount and remount — triggering a fresh chunk fetch each time.

---

**Q4. Can you lazy load a component with a named export?**

`React.lazy()` requires a **default export**. For named exports, use a `.then()` transform:

```tsx
const MyChart = lazy(() => import('./charts').then((mod) => ({ default: mod.BarChart })));
```

---

**Q5. What happens if the chunk fails to load (network error)?**

React propagates the error to the nearest error boundary. Without an error boundary, the app crashes with an unhandled error. In production, always wrap lazy components with `<ErrorBoundary>` so you can show a retry UI instead of a blank screen.

---

**Q6. How would you preload a lazy route before the user navigates to it?**

Call the dynamic `import()` early — on hover, on touch, or after a delay — without assigning the result. The browser fetches and caches the chunk. When React later needs to render the lazy component, the chunk is already in cache and resolves immediately.

```tsx
const preload = () => import('./HeavyPage'); // returns a promise; discard it

<Link onMouseEnter={preload} to="/heavy">
	Go Heavy
</Link>;
```

---

**Q7. How does lazy loading improve Core Web Vitals?**

- **LCP (Largest Contentful Paint)**: Smaller initial JS bundle → browser parses and executes less code → page content paints sooner.
- **TTI (Time to Interactive)**: Less JS to execute on load → main thread is free sooner.
- **FID / INP**: Fewer long tasks during startup → better input responsiveness.

---

**Q8. Can `Suspense` be used for data fetching too?**

Yes. React's Suspense mechanism is not limited to `React.lazy()`. Libraries like React Query (with `suspense: true`), Relay, and SWR can throw promises during data fetching, which Suspense catches in the same way. This enables "render-as-you-fetch" patterns where data and component code are fetched in parallel.

---

**Q9. What is the difference between `Suspense` and a loading state managed with `useState`?**

|                             | `useState` loading flag | `Suspense`                      |
| --------------------------- | ----------------------- | ------------------------------- |
| Who controls fallback       | The component itself    | React's scheduler               |
| Works with lazy loading     | ❌ No                   | ✅ Yes                          |
| Works with data fetching    | ✅ Yes (manual)         | ✅ Yes (library support)        |
| Nested loading coordination | Manual / complex        | React coordinates automatically |
| Code complexity             | Higher (boilerplate)    | Lower once set up               |

`Suspense` is declarative — you describe _what_ to show while waiting; React decides _when_. `useState` loading flags are imperative and require manual management.

---

**Q10. In a microfrontend architecture, where does lazy loading fit?**

Each remote MFE is already a separate bundle fetched on demand via Module Federation — that's macro-level code splitting. Within a remote, you still apply `React.lazy()` for route-level splitting so that individual pages inside the MFE are also chunked. This gives you two levels of deferral: the MFE itself loads on demand, and within it, each route's code loads on navigation.
