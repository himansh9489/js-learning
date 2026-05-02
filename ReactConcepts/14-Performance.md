# React Performance

---

## The Golden Rule

**Measure before you optimise.** Every optimisation has a cost (complexity, bundle size, cognitive overhead). Without measurement you risk optimising code that isn't slow while leaving the real bottleneck untouched.

Tools to measure first:

- **React DevTools Profiler** — which components re-render and how long they take
- **Chrome DevTools Performance tab** — CPU flame chart, long tasks
- **Lighthouse** — Core Web Vitals, FCP, LCP, TTI, CLS
- **Rollup Visualizer / Webpack Bundle Analyzer** — chunk sizes and what's in them
- **web-vitals library** — real user Core Web Vitals in production

---

## 1. Rendering Efficiency

### What

React re-renders a component whenever its state or props change. Re-renders are cheap most of the time — the Virtual DOM diff is fast. The problem is **unnecessary re-renders**: a parent re-renders, causing every child to re-render even if none of their props changed.

### Why it matters

On a mobile WebView (this project's target), the main thread is shared with the OS and the native app. Even 5ms of unnecessary JS work during a gesture can drop frames and feel janky.

---

### `React.memo` — skip re-render when props haven't changed

**What:** A higher-order component that wraps a component. Before re-rendering, React does a shallow comparison of the new props against the previous props. If they are shallowly equal, the re-render is skipped.

**When to use:**

- The component renders frequently (it's high in the tree or inside a list)
- Its props are stable or change infrequently
- The render cost is non-trivial (complex JSX, calculations in render)

**When NOT to use:**

- The component almost always receives new props → the comparison overhead is wasted
- The component is trivially cheap to render
- Props contain objects/arrays created inline (they'll never be shallowly equal)

```tsx
// Without memo — re-renders every time parent re-renders
function GoldPriceTag({ price }: { price: number }) {
  return <Text>₹{price}</Text>;
}

// With memo — skips re-render if `price` hasn't changed
const GoldPriceTag = React.memo(function GoldPriceTag({ price }: { price: number }) {
  return <Text>₹{price}</Text>;
});
```

```tsx
// Parent re-renders every second (polling), but GoldPriceTag only re-renders
// when the actual price value changes
function GoldDashboard() {
	const { data } = useGoldPrice(); // polling every 30s

	return (
		<div>
			<GoldPriceTag price={data?.buy ?? 0} /> {/* stable between polls */}
			<LastUpdated /> {/* updates every second */}
		</div>
	);
}
```

**Custom comparator** — for deep equality or partial comparisons:

```tsx
const SipCard = React.memo(
	function SipCard({ sip }: { sip: SipSchedule }) {
		return <div>{sip.amount}</div>;
	},
	(prevProps, nextProps) => prevProps.sip.id === nextProps.sip.id && prevProps.sip.amount === nextProps.sip.amount,
	// true = skip re-render, false = allow re-render
);
```

---

### `useMemo` — memoize expensive computed values

**What:** Caches the result of a computation. React only re-runs the computation when the listed dependencies change.

**When to use:**

- The computation is genuinely expensive (sorting/filtering large arrays, complex derivations)
- The result is used in a `React.memo` child's props or another hook's deps
- Referential stability is required (computed object/array used in a dep array)

**When NOT to use:**

- The computation is trivial (string concatenation, simple arithmetic)
- The deps change every render — memoisation has zero benefit

```tsx
// ❌ Unnecessary — number addition is trivial
const total = useMemo(() => price * quantity, [price, quantity]);

// ✅ Justified — sorting a large list on every render is expensive
const sortedTransactions = useMemo(() => [...transactions].sort((a, b) => b.date - a.date), [transactions]);
```

```tsx
// ✅ Justified — computed object used as a prop to a memo'd child
// Without useMemo, chartConfig is a new object every render → memo is bypassed
const chartConfig = useMemo(
  () => ({ color: 'teal', unit: 'grams', data: portfolioHistory }),
  [portfolioHistory]
);

return <GoldChart config={chartConfig} />;  // GoldChart is wrapped in React.memo
```

---

### `useCallback` — memoize function references

**What:** Returns the same function reference across renders unless its dependencies change. Functions created in a component body are recreated on every render — a new reference means a `React.memo` child will always re-render even if the behaviour hasn't changed.

**When to use:**

- The function is passed as a prop to a `React.memo`-wrapped child
- The function is a dependency of another `useEffect` or `useMemo`

**When NOT to use:**

- The function is only used inline (not passed as a prop or dep)
- The child is not memoised — `useCallback` doesn't prevent re-render without `memo`

```tsx
// ❌ New function reference every render → GoldBuyButton always re-renders
function BuyPanel() {
  const handleBuy = () => placeBuyOrder(amount); // new ref each render
  return <GoldBuyButton onClick={handleBuy} />;   // memo is bypassed
}

// ✅ Stable reference — GoldBuyButton only re-renders if amount changes
function BuyPanel() {
  const handleBuy = useCallback(() => placeBuyOrder(amount), [amount]);
  return <GoldBuyButton onClick={handleBuy} />;
}
```

**The trio works together:**

```tsx
// Parent
const handleSelect = useCallback((id: string) => setSelectedId(id), []);

const filteredItems = useMemo(() => items.filter((i) => i.active), [items]);

// Child — won't re-render unless filteredItems or handleSelect reference changes
const ItemList = React.memo(({ items, onSelect }) => (
	<ul>
		{items.map((i) => (
			<li key={i.id} onClick={() => onSelect(i.id)}>
				{i.name}
			</li>
		))}
	</ul>
));
```

---

### Key Stability in Lists

React uses `key` to identify which list items changed, were added, or removed. Unstable keys cause React to unmount and remount items that could have been updated in place — destroying local state and triggering full re-renders.

```tsx
// ❌ Index as key — if items are reordered or deleted, keys shift
// React incorrectly reuses DOM nodes for the wrong items
{
	transactions.map((tx, i) => <TransactionRow key={i} tx={tx} />);
}

// ❌ Random key — new key every render → every item is unmounted and remounted
{
	transactions.map((tx) => <TransactionRow key={Math.random()} tx={tx} />);
}

// ✅ Stable, unique identifier from the data
{
	transactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />);
}
```

**When index as key is acceptable:**

- The list is static (never reordered or filtered)
- Items have no local state
- No items are ever inserted/removed in the middle

---

### List Virtualisation

**What:** Instead of rendering all items in a large list to the DOM, only render the items currently visible in the viewport. As the user scrolls, items scroll out are unmounted and new ones scroll in are mounted.

**Why:** 1000 DOM nodes is expensive. Attaching event listeners, computing layout, and painting all of them — even offscreen — wastes CPU and memory.

**When to use:** Lists with more than ~50–100 items, especially on mobile.

**Libraries:** `react-window` (lightweight), `react-virtual` (TanStack), `@shopify/flash-list` (React Native)

```tsx
import { FixedSizeList as List } from 'react-window';

interface Transaction {
	id: string;
	amount: number;
	date: string;
}

function TransactionRow({ index, style, data }: { index: number; style: React.CSSProperties; data: Transaction[] }) {
	const tx = data[index];
	return (
		<div style={style} className="ib-flex ib-justify-between ib-px-4 ib-py-3 ib-border-b">
			<Text>{tx.date}</Text>
			<Text>₹{tx.amount}</Text>
		</div>
	);
}

function TransactionList({ transactions }: { transactions: Transaction[] }) {
	return (
		<List
			height={600} // visible area height in px
			itemCount={transactions.length}
			itemSize={60} // each row height in px
			itemData={transactions}
			width="100%">
			{TransactionRow}
		</List>
	);
}
```

---

## 2. Lazy Loading and Code Splitting

Covered in depth in `07-Lazy-Loading.md`. Key recap:

```tsx
// Every route is a separate JS chunk — only fetched when navigated to
const BuyPage = lazy(() => import('@/components/screens/buy'));
const PortfolioPage = lazy(() => import('@/components/screens/portfolio'));

// Heavy modals split into their own chunk
const GoldDetailsModal = lazy(() => import('@/components/molecules/gold-details-modal'));
```

**Impact:** Reduces initial JS bundle → faster FCP → better Lighthouse TTI score.

**Vite chunk configuration** — force heavy deps into their own chunk:

```ts
// vite.config.ts
export default defineConfig({
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					'vendor-react': ['react', 'react-dom'],
					'vendor-redux': ['@reduxjs/toolkit', 'react-redux'],
					'vendor-lottie': ['@lottiefiles/dotlottie-react'],
				},
			},
		},
	},
});
```

---

## 3. Asset Optimisation

### Images

```
Format hierarchy (smallest → largest for photos):
AVIF > WebP > JPEG > PNG

Format hierarchy for icons:
SVG (inline/bundled) > WebP icon > PNG icon
```

```tsx
// ✅ Always specify width + height to prevent CLS (Cumulative Layout Shift)
<Image
  src={CDN_IMAGES['landing']['glittering-gold']}
  width={320}
  height={240}
  loading="lazy"    // defer offscreen images
  decoding="async"  // don't block main thread during decode
/>

// ✅ Eager load the LCP image (above the fold) — never lazy load it
<Image
  src={CDN_IMAGES['landing']['hero']}
  loading="eager"
  fetchpriority="high"
/>
```

### Fonts

```html
<!-- Preload critical fonts to prevent FOUT (Flash of Unstyled Text) -->
<link rel="preload" href="/fonts/face-medium.woff2" as="font" type="font/woff2" crossorigin />
```

```css
/* font-display: swap — show fallback font immediately, swap when ready */
@font-face {
	font-family: 'FaceMedium';
	src: url('/fonts/face-medium.woff2') format('woff2');
	font-display: swap;
}
```

### Lottie Animations

Lottie `.lottie` files (dotLottie format) are ~3–5× smaller than `.json` Lottie files. This project uses `@lottiefiles/dotlottie-react` which supports the compressed format:

```tsx
// ✅ .lottie format — compressed, smaller
<DotLottieReact src={CDN_LOTTIE['status']['success']} autoplay />

// ❌ .json format — uncompressed, larger
<LottiePlayer animationData={require('./success.json')} />
```

---

## 4. Bundle Optimisation

### Tree Shaking

Tree shaking removes exported code that is never imported. It only works with ES modules (`import`/`export`), not CommonJS (`require`).

```ts
// ✅ Named import — bundler can tree-shake unused exports from the library
import { FlexBox, Text } from '@bharatpe/invest-bharatpe-ui';
// ❌ Namespace import — bundler may include the entire library
import * as UI from '@bharatpe/invest-bharatpe-ui';
```

### Dead Code Elimination

```ts
// Constants that depend on NODE_ENV are eliminated at build time
if (process.env.NODE_ENV === 'development') {
	console.info('Debug info'); // this entire block is removed in production build
}
```

### Avoid Barrel File Pitfalls

Barrel files (`index.ts` re-exporting everything) can prevent tree shaking if the bundler can't statically analyse the re-exports:

```ts
// included even if never imported
// ✅ Import directly from the source file
import { Button } from '@/components/atoms/button';

// ❌ Barrel that re-exports everything — bundler may include unused components
// components/index.ts
export * from './atoms/button';
export * from './atoms/input';
export * from './molecules/card'; // included even if never imported
```

### Analysing the Bundle

```bash
# Install Rollup visualizer
npm install --save-dev rollup-plugin-visualizer

# vite.config.ts
import { visualizer } from 'rollup-plugin-visualizer';
plugins: [visualizer({ open: true, gzipSize: true })]

# Build — opens treemap in browser showing chunk sizes
npm run build
```

---

## 5. Network and Delivery

### CDN

Static assets (JS, CSS, images) should be served from a CDN — a geographically distributed network of servers that delivers files from the node closest to the user.

Benefits:

- Lower latency (physical proximity)
- High availability (redundancy)
- Edge caching (files cached at CDN node, not origin server)
- Offloads bandwidth from origin

This project serves all images from CloudFront (`d30gqtvesfc1d5.cloudfront.net`).

### HTTP Caching Headers

```
Cache-Control: public, max-age=31536000, immutable
```

This header tells browsers and CDN nodes to cache the file for 1 year. It works because Vite content-hashes filenames at build time:

```
app.a3f2c1d4.js   ← hash changes when content changes
```

A new deploy generates a new hash → new URL → cache miss (user gets latest code).
The old hash URL is still valid → cached → instant load for unchanged assets.

```
Cache-Control: no-cache
```

Use this for `index.html` — it must always be fresh so the browser fetches the latest hashed asset URLs.

### Resource Hints

```html
<!-- preload: fetch this resource at high priority, I'll use it soon -->
<link rel="preload" href="/fonts/face-medium.woff2" as="font" crossorigin />

<!-- prefetch: fetch this resource at low priority, I might need it later -->
<link rel="prefetch" href="/chunks/portfolio.abc123.js" as="script" />

<!-- preconnect: establish TCP/TLS connection early (for CDN, API domains) -->
<link rel="preconnect" href="https://d30gqtvesfc1d5.cloudfront.net" />
<link rel="preconnect" href="https://api.bharatpe.com" />
```

### Compression

Enable gzip or Brotli compression on the server/CDN. Brotli achieves ~15–25% better compression than gzip for JS/CSS:

```ts
// vite.config.ts — generate pre-compressed files at build time
import viteCompression from 'vite-plugin-compression';

plugins: [
	viteCompression({ algorithm: 'brotliCompress' }), // .br files
	viteCompression({ algorithm: 'gzip' }), // .gz files
];
```

---

## 6. Core Web Vitals and What Affects Them

| Metric                              | Measures                                   | Optimisations                                                             |
| ----------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------- |
| **LCP** (Largest Contentful Paint)  | When the largest above-fold element loads  | Preload hero image, reduce TTFB, use CDN, eager-load fonts                |
| **CLS** (Cumulative Layout Shift)   | Visual stability — elements jumping around | Always set width/height on images, no late-injected content               |
| **INP** (Interaction to Next Paint) | Responsiveness to clicks/taps              | Reduce JS execution on main thread, debounce handlers, virtualise lists   |
| **FCP** (First Contentful Paint)    | When first content appears                 | Smaller initial JS bundle, lazy load routes, no render-blocking resources |
| **TTI** (Time to Interactive)       | When the page is fully interactive         | Code split, tree shake, avoid large third-party scripts                   |

---

## 7. React-Specific Anti-Patterns That Kill Performance

```tsx
// ❌ Inline object prop — new reference every render → memo bypassed
<GoldCard style={{ margin: 8 }} />
// ✅ Move outside component or useMemo
const cardStyle = { margin: 8 }; // module-level constant

// ❌ Inline function prop — same problem
<Button onClick={() => handleBuy(id)} />
// ✅
const handleBuy = useCallback((id: string) => buy(id), []);

// ❌ State update inside render — infinite loop
function Bad() {
  const [x, setX] = useState(0);
  setX(1); // triggers re-render → setX again → infinite loop
}

// ❌ Derived state duplicated in useState — causes stale/double-update issues
const [filteredItems, setFilteredItems] = useState(items.filter(i => i.active));
// ✅ Derive during render (or useMemo if expensive)
const filteredItems = items.filter(i => i.active);

// ❌ Context with large, frequently-changing value — every consumer re-renders
const AppContext = createContext({ user, price, theme, notifications });
// ✅ Split contexts — consumers only re-render for relevant changes
const UserContext = createContext(user);
const PriceContext = createContext(price);
```

---

## 8. Profiling with React DevTools

```
1. Open React DevTools → Profiler tab
2. Click "Record"
3. Perform the interaction you want to optimise
4. Stop recording
5. Inspect the flame chart:
   - Wide bars = slow renders
   - Grey bars = component didn't re-render (memo working)
   - Coloured bars = component re-rendered
6. Click a bar to see:
   - Why it rendered (which prop/state changed)
   - How long it took
   - How many times it rendered during the recording
```

Use the **"Highlight updates"** checkbox (settings cog) to see all re-renders in real time as coloured flashes.

---

## Optimisation Checklist

| Area      | Action                                       | Impact                      |
| --------- | -------------------------------------------- | --------------------------- |
| Bundle    | Route-level lazy loading                     | High                        |
| Bundle    | Tree shaking via named imports               | Medium                      |
| Bundle    | Manual chunk splitting (vendor, lottie)      | Medium                      |
| Rendering | `React.memo` on expensive children           | Medium                      |
| Rendering | `useMemo` for expensive computations         | Medium                      |
| Rendering | `useCallback` for stable function props      | Low–Medium                  |
| Rendering | Virtualise long lists                        | High (for long lists)       |
| Rendering | Stable `key` props in lists                  | High (for list correctness) |
| Assets    | WebP/AVIF images from CDN                    | High                        |
| Assets    | `loading="lazy"` on offscreen images         | Medium                      |
| Assets    | Preload LCP image                            | High                        |
| Network   | CDN for all static assets                    | High                        |
| Network   | `Cache-Control: immutable` for hashed assets | High                        |
| Network   | Brotli/gzip compression                      | Medium                      |
| Network   | `preconnect` to API/CDN domains              | Low–Medium                  |
| Context   | Split large contexts                         | Medium                      |

---

## Interview Q&A

**Q1. What is the difference between `useMemo` and `useCallback`?**

Both memoise things across renders. `useMemo` memoises the **return value** of a function — use it when you have an expensive calculation and want to cache the result. `useCallback` memoises the **function itself** — use it when you need a stable function reference, typically to pass to a `React.memo` child or to use as a `useEffect` dependency. `useCallback(fn, deps)` is equivalent to `useMemo(() => fn, deps)`.

---

**Q2. When does `React.memo` NOT help?**

`React.memo` does a **shallow comparison** of props. It fails (re-renders anyway) when:

- Props include objects or arrays created inline — new reference on every render even if the content is the same.
- Props include functions created without `useCallback` — new reference every render.
- The parent passes different primitive values on every render.
  In these cases the memo comparison always returns `false` (not equal) and the re-render proceeds. The comparison itself then adds overhead for no benefit.

---

**Q3. What causes a `React.memo` component to still re-render?**

Three common causes:

1. **Unstable prop references** — inline objects `{}`, inline arrays `[]`, or inline functions `() => {}` passed as props. Each is a new reference every render.
2. **Context consumption** — if the component consumes a context value that changed, it re-renders regardless of memo.
3. **`forwardRef` or other HOC wrapping** — some wrapping patterns bypass memo's comparison.

---

**Q4. What is list virtualisation and when should you use it?**

Virtualisation renders only the DOM nodes that are currently visible in the viewport, unmounting offscreen rows and mounting new ones as the user scrolls. This keeps the DOM node count constant regardless of list length. Without it, rendering 1000 rows creates 1000 DOM nodes, 1000 event listener sets, and a large layout computation — all at once. Use virtualisation for any list with more than ~50–100 items, especially on mobile where memory and CPU are constrained. Libraries: `react-window`, `TanStack Virtual`.

---

**Q5. Why should you never use `Math.random()` or array index as a list `key`?**

React uses `key` to match elements between renders. With random keys, every render produces entirely new keys — React thinks every item is new, unmounts all existing items, and mounts fresh ones. This destroys local state, causes unnecessary DOM mutations, and is significantly slower than a diff. With index as key, if items are inserted or removed in the middle, keys shift — React reuses the wrong DOM nodes for the wrong items, causing incorrect rendering and lost state.

---

**Q6. What are Core Web Vitals and how does React performance affect them?**

Core Web Vitals are Google's user-centric performance metrics used in search ranking:

- **LCP** — how fast the main content loads. Affected by bundle size (reduce with lazy loading), image loading (preload hero), TTFB (use CDN).
- **CLS** — layout stability. Affected by images without dimensions, late-injected DOM, font loading without `font-display: swap`.
- **INP** — interaction responsiveness. Affected by long JS tasks on the main thread — avoid in React by virtualising lists, debouncing handlers, and avoiding synchronous expensive work in event handlers.

---

**Q7. What is tree shaking and how does it work with React component libraries?**

Tree shaking is the bundler's ability to remove exported code that is never imported. It relies on ES module static analysis — the bundler reads `import`/`export` statements at compile time and eliminates unreachable code. With component libraries, always use named imports (`import { Button } from 'lib'`) not namespace imports (`import * as lib from 'lib'`). If the library ships CommonJS (`require`), tree shaking is impossible — check the library's `package.json` `module` or `exports` field for an ESM build.

---

**Q8. How would you optimise a component that re-renders 60 times per second (e.g. a live price ticker)?**

1. **Isolate the fast-changing state** — move it to the smallest possible component so only that component re-renders, not its siblings.
2. **`React.memo`** on sibling/child components so they are not re-rendered by the parent's frequent updates.
3. **`useMemo`** for any derived values used in stable children.
4. **Avoid creating new objects/arrays in render** that are passed down — use stable references.
5. **Consider `useRef` instead of `useState`** for values that need to be current but don't need to trigger re-renders (e.g. the raw price for a canvas draw loop).
6. **`requestAnimationFrame`** for visual updates rather than `setState` on every data change — batch visual updates to 60fps.

---

**Q9. What is the difference between `preload`, `prefetch`, and `preconnect`?**

- **`preload`**: Fetch this resource immediately at high priority — I will use it in the current page load (e.g. LCP image, critical font). Browser downloads it before the parser would normally discover it.
- **`prefetch`**: Fetch this resource at low priority when idle — I might use it on the next navigation (e.g. the JS chunk for the next likely route). Browser fetches only when bandwidth is spare.
- **`preconnect`**: Establish the TCP + TLS handshake with this origin early — I'll make requests to it soon. Saves ~100–300ms per request by eliminating connection setup time. Use for CDN and API domains.

---

**Q10. How do you split a React Context to prevent unnecessary re-renders?**

When a context value changes, every component that calls `useContext` for that context re-renders — even if it only cares about one field. The fix is to split one large context into multiple smaller ones:

```tsx
// ❌ One context — price change re-renders user-profile consumers too
const AppContext = createContext({ user, goldPrice, theme });

// ✅ Split — each consumer only re-renders for its relevant data
const UserContext = createContext(user);
const GoldPriceContext = createContext(goldPrice);
const ThemeContext = createContext(theme);
```

Alternatively, use a state management library (Redux, Zustand) whose selectors are more granular than context — components only re-render when the specific slice of state they select changes.
