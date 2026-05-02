# SSR vs CSR (and Beyond)

---

## The Core Question

When a user visits a URL, **where and when does the HTML get produced?**

That single question defines the rendering strategy. Everything else — SEO, performance, infrastructure cost, developer experience — flows from the answer.

---

## Rendering Strategies at a Glance

| Strategy          | Where HTML is built | When HTML is built                | Examples                        |
| ----------------- | ------------------- | --------------------------------- | ------------------------------- |
| **CSR**           | Browser             | On every visit, in JS             | Create React App, Vite SPA      |
| **SSR**           | Server              | On every request                  | Next.js default, Remix          |
| **SSG**           | Build machine       | At build time                     | Next.js `getStaticProps`, Astro |
| **ISR**           | Server              | At build + revalidated on request | Next.js ISR                     |
| **Streaming SSR** | Server (in chunks)  | On request, progressively         | Next.js App Router, React 18    |

---

## CSR — Client-Side Rendering

### What

The server sends a near-empty HTML shell (just `<div id="root">`). The browser downloads the JS bundle, executes React, fetches data, and renders the full UI — all on the client.

```
Browser → Server: GET /dashboard
Server → Browser: <html><body><div id="root"></div><script src="bundle.js"></script></body></html>
Browser executes bundle.js → React renders the UI → data fetch → final UI painted
```

### Why CSR exists

- Simple deployment — just a static file host (S3, Netlify, GitHub Pages).
- No server needed at runtime.
- Excellent for highly interactive apps where the same JS runs for all state changes.
- Full control in the browser; easy to implement client-side auth patterns.

### When to use CSR

| Use CSR when…                                       |
| --------------------------------------------------- |
| The app is behind a login wall (SEO doesn't matter) |
| The content is highly dynamic and user-specific     |
| You need minimal backend infrastructure             |
| It's an internal tool / admin panel / dashboard     |
| Offline capability (PWA) is a requirement           |

### CSR Timeline (what the user experiences)

```
0ms     → HTML shell arrives (blank page visible)
~500ms  → JS bundle parsed and executed
~800ms  → React renders skeleton / loading states
~1200ms → API calls complete, real content painted
```

The gap between HTML arrival and real content is where CSR hurts — especially on slow networks or low-end devices.

### Practical Example — Vite SPA

```html
<!-- index.html — what the server always returns -->
<!DOCTYPE html>
<html>
	<body>
		<div id="root"></div>
		<!-- empty shell -->
		<script type="module" src="/src/main.tsx"></script>
	</body>
</html>
```

```tsx
// main.tsx — React takes over entirely in the browser
import ReactDOM from 'react-dom/client';

import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(<App />);
```

Crawlers visiting this page see only the empty shell — no content. That's the core SEO limitation.

---

## SSR — Server-Side Rendering

### What

For each incoming request, the server runs React (Node.js), produces a complete HTML string with real content, and sends it to the browser. The browser paints immediately. React then **hydrates** — attaches event listeners to the existing HTML to make it interactive.

```
Browser → Server: GET /product/gold-bar
Server runs React → fetches data → renders HTML string → sends full HTML
Browser paints immediately (content visible)
React hydrates → page becomes interactive
```

### Why SSR exists

- **Faster First Contentful Paint (FCP)** — real HTML arrives, not a blank shell.
- **SEO** — crawlers read actual content without executing JS.
- **Social sharing** — Open Graph meta tags are present in the initial HTML.
- **Accessibility** — content is readable even if JS fails or is slow.

### When to use SSR

| Use SSR when…                                           |
| ------------------------------------------------------- |
| SEO matters (public-facing pages)                       |
| Content changes per request (user-specific pages)       |
| Fast first paint is critical (e-commerce product pages) |
| Social sharing previews need real meta tags             |
| The page is behind no auth wall                         |

### SSR Timeline

```
0ms     → Request hits server
~100ms  → Server fetches data + renders HTML
~200ms  → Full HTML sent; browser paints immediately (FCP)
~600ms  → React bundle downloads + hydration completes (TTI)
```

FCP is fast, but **TTI is delayed** until hydration completes. The page _looks_ interactive but clicks may not register during hydration — this is the "uncanny valley" of SSR.

### Practical Example — Next.js Page Router

```tsx
// pages/products/[id].tsx

interface Props {
	product: { name: string; price: number };
}

// Runs on the SERVER for every request
export async function getServerSideProps({ params }: { params: { id: string } }) {
	const product = await fetchProduct(params.id); // real DB/API call
	return { props: { product } };
}

// This component renders on both server (HTML) and client (hydration)
export default function ProductPage({ product }: Props) {
	return (
		<main>
			<h1>{product.name}</h1>
			<p>₹{product.price}</p>
			<button onClick={() => addToCart(product)}>Buy Now</button>
		</main>
	);
}
```

The HTML that reaches the browser already contains `product.name` and `product.price`. Crawlers and users see it immediately.

---

## Hydration — The Bridge Between SSR and CSR

### What is hydration?

After the browser receives server-rendered HTML and paints it, React downloads its JS bundle and "hydrates" the page — it walks the existing DOM, reconciles it with the virtual DOM it would have produced, and attaches event handlers.

```
Server HTML:  <button>Buy Now</button>   ← visible but not interactive
After hydrate: <button onClick={fn}>Buy Now</button>  ← fully interactive
```

### Hydration mismatch

If the server-rendered HTML differs from what React would render on the client, React logs a hydration error and re-renders the entire tree — effectively discarding the server HTML and falling back to CSR. Common causes:

```tsx
// ❌ Causes mismatch — Date().toString() differs between server and client
<p>Rendered at: {new Date().toString()}</p>;

// ✅ Fix — suppress hydration or use useEffect for client-only values
const [time, setTime] = useState('');
useEffect(() => setTime(new Date().toString()), []);
<p>Rendered at: {time}</p>;
```

### Hydration cost

Hydration requires React to parse and execute the full JS bundle even though the HTML already exists. On large pages with many components, hydration can block the main thread for hundreds of milliseconds — this is why SSR improves FCP but not always TTI.

---

## SSG — Static Site Generation

### What

HTML is generated **once at build time** and served as a static file. No server computation per request.

```tsx
// Next.js — runs only at build time
export async function getStaticProps() {
	const posts = await fetchAllBlogPosts();
	return { props: { posts } };
}
```

### When to use SSG

- Blog posts, documentation, marketing pages
- Content that changes infrequently (daily/weekly)
- Maximum performance + minimum server cost
- When you can afford a rebuild for content updates

---

## Streaming SSR (React 18+)

### What

Instead of waiting for the entire page to be ready before sending HTML, the server streams HTML in chunks. Shell content (header, nav) arrives first; slow sections (data-dependent content) stream in later as `<Suspense>` boundaries resolve.

```tsx
// app/page.tsx — Next.js App Router (React 18 streaming)
import { Suspense } from 'react';

async function SlowSection() {
	const data = await slowDatabaseQuery(); // takes 1s
	return <div>{data}</div>;
}

export default function Page() {
	return (
		<main>
			<header>Gold Invest</header> {/* streams immediately */}
			<Suspense fallback={<p>Loading prices...</p>}>
				<SlowSection /> {/* streams when ready */}
			</Suspense>
		</main>
	);
}
```

The browser receives and paints the header instantly. The slow section arrives ~1s later and slots into the DOM — no full-page wait.

---

## Side-by-Side Comparison

|                    | CSR                | SSR                     | SSG                    | Streaming SSR              |
| ------------------ | ------------------ | ----------------------- | ---------------------- | -------------------------- |
| **First paint**    | Slow (blank shell) | Fast                    | Fastest                | Fast + progressive         |
| **TTI**            | Depends on JS size | Slower (hydration cost) | Fastest                | Good                       |
| **SEO**            | Poor               | Excellent               | Excellent              | Excellent                  |
| **Server cost**    | None at runtime    | High (per request)      | None at runtime        | Medium                     |
| **Data freshness** | Always fresh       | Always fresh            | Stale until rebuild    | Always fresh               |
| **Complexity**     | Low                | High                    | Low                    | High                       |
| **Best for**       | Dashboards, SPAs   | Dynamic public pages    | Blogs, docs, marketing | Large pages with slow data |

---

## Decision Flowchart

```
Does the page need SEO?
├─ No  → Is the app behind auth?
│         ├─ Yes → CSR (SPA is fine)
│         └─ No  → Consider SSG for performance
└─ Yes → Does content change per request?
          ├─ Yes → SSR (or Streaming SSR if page is large/slow)
          └─ No  → SSG (+ ISR if content updates periodically)
```

---

## Where Each Strategy Appears in Real Products

| Product type                   | Recommended strategy       |
| ------------------------------ | -------------------------- |
| E-commerce product listing     | SSR or SSG + ISR           |
| Blog / documentation           | SSG                        |
| User dashboard / admin panel   | CSR                        |
| Social feed (user-specific)    | SSR or Streaming SSR       |
| Marketing / landing page       | SSG                        |
| Microfrontend in a WebView app | CSR (your current project) |
| News site                      | Streaming SSR              |

---

## Your Current Project Context

This `gold-invest` app is a **microfrontend rendered inside a native WebView**. It uses **pure CSR** (Vite + React SPA) — and that's the correct choice because:

- It runs inside BharatPe's native app, not a browser tab — SEO is irrelevant.
- There is no server to render HTML at request time within the WebView context.
- The host app (TP_CLUB) controls the shell; the MFE renders itself client-side.
- Static hosting for the JS bundle is sufficient.

---

## Interview Q&A

**Q1. What is the fundamental difference between SSR and CSR?**

In CSR, the browser receives an empty HTML shell and builds the UI entirely using JavaScript on the client. In SSR, the server executes React, fetches data, and sends complete HTML to the browser. The browser paints real content immediately, then React hydrates to add interactivity. The trade-off: CSR is simpler infrastructure but slower first paint and poor SEO; SSR gives fast FCP and good SEO but adds server complexity and hydration cost.

---

**Q2. What is hydration and what causes a hydration mismatch?**

Hydration is the process where React — running in the browser — attaches event listeners and internal state to the existing server-rendered HTML, without re-rendering the DOM from scratch. A hydration mismatch occurs when the HTML the server produced differs from what React would render on the client (e.g., using `Date.now()`, `Math.random()`, or browser-only APIs during render). React warns in the console and falls back to a full client re-render, defeating the SSR benefit. Fix: defer client-only values to `useEffect`.

---

**Q3. What is the difference between SSR and SSG?**

SSR generates HTML **per request** at runtime on the server — the data is always fresh. SSG generates HTML **once at build time** — the HTML is a static file, served instantly from a CDN, with no server computation per request. SSG is faster and cheaper but becomes stale if underlying data changes. ISR (Incremental Static Regeneration) bridges the gap: pages are generated statically but revalidated after a configurable time interval.

---

**Q4. Can SSR hurt performance?**

Yes. SSR improves FCP (first contentful paint) but can hurt TTI (time to interactive) because:

1. The browser must still download and execute the full JS bundle to hydrate.
2. During hydration the main thread is blocked; clicks on the page may appear to work but don't.
3. The server bears the cost of rendering on every request — under heavy load this can increase TTFB (time to first byte).

Streaming SSR (React 18) partially addresses this by sending the shell immediately and streaming slower sections progressively.

---

**Q5. What is Streaming SSR and how does React 18 enable it?**

Streaming SSR uses `renderToPipeableStream` (Node.js) instead of `renderToString`. Instead of waiting for all data to be fetched before sending HTML, React streams the shell (static parts) immediately and flushes `<Suspense>` boundaries as their data resolves. This means users see a meaningful shell within milliseconds and individual sections pop in as they're ready — no full-page blank wait. Next.js App Router uses this by default.

---

**Q6. How does Next.js decide between SSR, SSG, and CSR per page?**

In the Pages Router: export `getServerSideProps` → SSR; export `getStaticProps` → SSG; neither → CSR (client renders after hydration). In the App Router: all Server Components are SSR by default; add `'use client'` to opt into CSR; `export const dynamic = 'force-static'` → SSG. The decision is per-route/per-component.

---

**Q7. Why would you choose CSR for an authenticated dashboard?**

- SEO doesn't matter — the page is behind a login wall; crawlers won't reach it.
- Content is fully user-specific, so SSG (static, shared) offers no benefit.
- SSR would require the server to handle auth on every request — added latency.
- The JS bundle is already downloaded after login; subsequent navigations are instant.
- Client-side state management (Redux, Zustand) is simpler without hydration concerns.

---

**Q8. What is the "uncanny valley" of SSR?**

After SSR, the page looks fully rendered and clickable — but it isn't, because hydration hasn't completed yet. Users may click buttons that appear active but don't respond. This gap between FCP (page looks done) and TTI (page is actually interactive) is sometimes called the uncanny valley. Solutions: selective hydration (React 18 prioritises hydrating areas the user interacts with first), streaming SSR, and deferring non-critical hydration.

---

**Q9. What is selective hydration in React 18?**

React 18 introduced selective hydration: `<Suspense>` boundaries allow React to hydrate parts of the page independently and out of order. If the user clicks on a not-yet-hydrated section, React immediately prioritises hydrating that section before others. This makes the page interactive faster where users actually engage, rather than hydrating everything top-to-bottom sequentially.

---

**Q10. In a microfrontend architecture, how does rendering strategy work?**

Each MFE can choose its own rendering strategy independently. A host shell might be SSR (for SEO on the landing page) while individual MFEs loaded via Module Federation are CSR bundles hydrated after the shell loads. In WebView-based microfrontends (like this project), the host native app loads an MFE URL that serves a CSR bundle — the native shell handles "SSR-like" instant display via splash screens, while the MFE renders client-side. The key is that Module Federation remotes are always delivered as JS chunks, making them inherently CSR unless the host explicitly handles SSR for them.
