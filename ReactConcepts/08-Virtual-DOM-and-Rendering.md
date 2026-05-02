# Virtual DOM and Rendering Internals

---

## The Core Problem React Solves

Direct DOM manipulation is expensive. Every time you call `document.getElementById(...).textContent = '...'`, the browser may:

1. Recalculate styles
2. Reflow (recalculate layout geometry)
3. Repaint (redraw pixels)

Doing this for 50 elements on every keystroke would freeze the UI. React solves this by **batching and minimizing real DOM writes** through a virtual representation computed in JavaScript first.

---

## 1. Virtual DOM

### What

The Virtual DOM (VDOM) is a **plain JavaScript object tree** that mirrors the structure of the real DOM. It is cheap to create and throw away because it lives in memory — it has no connection to browser rendering APIs.

```
Real DOM node:                Virtual DOM equivalent:
<div class="card">    →       { type: 'div',
  <h2>Title</h2>               props: { className: 'card' },
  <p>Body</p>                  children: [
</div>                           { type: 'h2', props: {}, children: ['Title'] },
                                 { type: 'p',  props: {}, children: ['Body']  }
                               ]
                             }
```

React's `createElement` (what JSX compiles to) creates these objects:

```jsx
// JSX
const element = <button className="btn" onClick={handleClick}>Buy</button>;

// Compiled to:
const element = React.createElement(
  'button',
  { className: 'btn', onClick: handleClick },
  'Buy'
);

// Resulting object:
// { type: 'button', props: { className: 'btn', onClick: handleClick, children: 'Buy' } }
```

### Why it exists

The VDOM lets React compute **what the UI should look like** entirely in JavaScript (fast), then figure out **the minimum set of real DOM operations** needed to make the browser match that description (minimal and batched).

---

## 2. Reconciliation

### What

Reconciliation is the process of **comparing the previous VDOM tree with the next VDOM tree** (produced after a state/prop change) to determine exactly what changed.

```
Before state update:          After state update:
┌─────────────────┐           ┌─────────────────┐
│  <div>          │           │  <div>          │
│    <h1>Old</h1> │   diff    │    <h1>New</h1> │  ← text changed
│    <p>Hello</p> │  ──────►  │    <p>Hello</p> │  ← unchanged
│  </div>         │           │  </div>         │
└─────────────────┘           └─────────────────┘
                                        │
                                        ▼
                         Only update: h1.textContent = 'New'
                         Skip: p (unchanged)
                         Skip: div (unchanged)
```

### The Diffing Rules

React's diff algorithm makes two assumptions that let it run in O(n) instead of O(n³):

**Rule 1 — Element type determines the subtree**

If the element type changes, React **tears down the old subtree** and mounts a fresh one. It does not try to diff children across a type change.

```jsx
// Before
<div><Counter /></div>

// After — type changed from div to span
<span><Counter /></span>

// React unmounts Counter inside div, mounts a brand new Counter inside span
// Counter loses all its state!
```

**Rule 2 — Keys identify list items**

Without keys React matches elements by position. With keys it matches by identity.

```jsx
// List before update:      List after removing "Alice":

// Without keys (position-based matching):
// Position 0: Alice → Bob     ← React updates text (unnecessary)
// Position 1: Bob   → Carol   ← React updates text (unnecessary)
// Position 2: Carol → [gone]  ← React removes last item
// 2 unnecessary DOM updates!

// With keys (identity-based matching):
<li key="alice">Alice</li>   // key="alice" → removed
<li key="bob">Bob</li>       // key="bob" → unchanged ✓
<li key="carol">Carol</li>   // key="carol" → unchanged ✓
// 1 correct removal, 0 unnecessary updates
```

```jsx
// ❌ Bad keys — index changes every time the list is sorted/filtered
{
	items.map((item, index) => <li key={index}>{item.name}</li>);
}

// ✅ Good keys — stable identity tied to the data
{
	items.map((item) => <li key={item.id}>{item.name}</li>);
}
```

**Why index keys are dangerous:**

```jsx
// Controlled inputs with index keys — ordering breaks state
const [items, setItems] = useState(['Alice', 'Bob', 'Carol']);

// Rendered with key=0,1,2
// User types in the "Alice" input (index 0)
// We sort the list — now "Bob" is index 0
// React REUSES the DOM node at index 0 (Bob's label, Alice's input state) → 🐛
```

---

## 3. React Fiber

### What

Fiber is React's **reimplementation of the reconciliation engine** (introduced in React 16). Before Fiber, reconciliation was a single synchronous recursive traversal — it would lock up the main thread until the entire tree was diffed.

Fiber makes the work **incremental and interruptible**.

```
Old (Stack) Reconciler:           Fiber Reconciler:

Render entire tree                Render in small chunks
─────────────────────             (work units called "fibers")
█████████████████████             ██ pause ██ pause ██ done
                                  ↓         ↓
Blocks for 300ms                  Check: is there higher-priority work?
User input frozen 🥶               YES → pause, handle input, resume
                                  NO  → continue
```

### Key concepts

**Work unit (Fiber node)**
Every element in the React tree has a corresponding fiber object. The fiber stores:

- Component type and props
- Its state (for class components and hooks)
- Pointers to parent, child, sibling fibers
- The "effect" (what DOM change needs to happen)

**Priority lanes**
React 18 introduced "lanes" — categories of priority:

```
SyncLane          ← discrete user input (click, key press) — must be instant
InputContinuous   ← continuous input (drag, scroll)
Default           ← normal state updates
Transition        ← useTransition / useDeferredValue — can be interrupted
Idle              ← lowest priority, runs when browser is idle
```

**Two phases**

```
┌─────────────────────────────────────────────────────────────────┐
│  RENDER PHASE (interruptible)                                   │
│  • React traverses the fiber tree                               │
│  • Calls component functions / render methods                   │
│  • Computes what the new VDOM looks like                        │
│  • Diffs old vs new fibers                                      │
│  • Builds a list of "effects" (mutations to apply)              │
│  • Can be paused, aborted, restarted                            │
│  • NO side effects, NO real DOM changes here                    │
├─────────────────────────────────────────────────────────────────┤
│  COMMIT PHASE (synchronous, non-interruptible)                  │
│  • Applies all collected effects to the real DOM at once        │
│  • Runs useLayoutEffect                                         │
│  • Runs useEffect (scheduled asynchronously after paint)        │
│  • Cannot be interrupted — must finish in one pass              │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Full Render Lifecycle — Step by Step

```
  User clicks "Add to Cart"
           │
           ▼
  dispatch / setState called
           │
           ▼
  ┌──────────────────────────────────────────┐
  │          RENDER PHASE                    │
  │                                          │
  │  1. React schedules work                 │
  │     (priority: SyncLane — click event)   │
  │                                          │
  │  2. Component function re-executes       │
  │     → returns new JSX / VDOM tree        │
  │                                          │
  │  3. Fiber diff: compare old vs new       │
  │     → finds changed fiber nodes          │
  │     → tags them with effects:            │
  │       "Update", "Insert", "Delete"       │
  │                                          │
  │  ↕ Can pause here if higher-priority     │
  │    work arrives (e.g., user typing)      │
  └─────────────────┬────────────────────────┘
                    │ effects list ready
                    ▼
  ┌──────────────────────────────────────────┐
  │          COMMIT PHASE                    │
  │                                          │
  │  4. Apply DOM mutations                  │
  │     (insertions, updates, removals)      │
  │                                          │
  │  5. Run useLayoutEffect callbacks        │
  │     (synchronous, before paint)          │
  │                                          │
  │  6. Browser paints the screen            │
  │                                          │
  │  7. Run useEffect callbacks              │
  │     (asynchronous, after paint)          │
  └──────────────────────────────────────────┘
```

---

## 5. React.memo — Skipping Re-renders

By default, when a parent re-renders, **all its children re-render** too — even if their props haven't changed. `React.memo` wraps a component with a shallow-equality check on props. If props are the same, the component's render is skipped.

```jsx
// Without memo — re-renders every time Parent updates
function ProductCard({ name, price }) {
  console.log('ProductCard rendered');
  return <div>{name} - ₹{price}</div>;
}

// With memo — only re-renders when name or price actually changes
const ProductCard = React.memo(function ProductCard({ name, price }) {
  console.log('ProductCard rendered');
  return <div>{name} - ₹{price}</div>;
});

function Shop() {
  const [count, setCount] = useState(0);
  return (
    <>
      <button onClick={() => setCount(c => c + 1)}>Click: {count}</button>
      {/* Without memo: re-renders on every click */}
      {/* With memo: does NOT re-render — name/price unchanged */}
      <ProductCard name="Gold Ring" price={5000} />
    </>
  );
}
```

**Custom comparison function:**

```jsx
const ProductCard = React.memo(
  function ProductCard({ product }) { ... },
  (prevProps, nextProps) => prevProps.product.id === nextProps.product.id
  // return true → skip re-render (props considered equal)
  // return false → re-render
);
```

**Important:** `React.memo` only does a **shallow comparison**. If you pass an object or function as a prop, use `useMemo` / `useCallback` to stabilize those references, otherwise `React.memo` is bypassed.

---

## 6. Batching

React batches multiple `setState` calls into a single re-render to avoid redundant work.

```jsx
// React 17 — batching only inside React event handlers
function handleClick() {
	setCount((c) => c + 1); // ← batched
	setName('Alice'); // ← batched
	// One re-render total ✓
}

// React 17 — NO batching inside async callbacks
setTimeout(() => {
	setCount((c) => c + 1); // re-render 1
	setName('Alice'); // re-render 2
	// Two re-renders ❌
}, 0);

// React 18 — Automatic Batching everywhere
setTimeout(() => {
	setCount((c) => c + 1); // ← batched
	setName('Alice'); // ← batched
	// One re-render total ✓ (React 18+)
}, 0);
```

If you need to force a synchronous, un-batched update in React 18, use `flushSync`:

```jsx
import { flushSync } from 'react-dom';

flushSync(() => setCount((c) => c + 1)); // DOM updated immediately
flushSync(() => setName('Alice')); // DOM updated immediately
```

---

## 7. Concurrent Rendering (React 18)

Concurrent Mode allows React to work on **multiple versions of the UI simultaneously**, pausing low-priority work to handle urgent updates.

```
Without Concurrent Mode:
  Slow list update starts ─────────────────────────► done (300ms blocked)
  User types            ──────── waiting ──────────► handled (late)

With Concurrent Mode:
  Slow list update starts ─── paused ─── resumed ──► done
  User types            ──────────────► handled immediately (in the gap)
```

The key APIs that opt into concurrent behaviour:

- `useTransition` — marks a `setState` as interruptible (non-urgent)
- `useDeferredValue` — defers a value to a background render
- `Suspense` — shows a fallback while async content loads

```jsx
function SearchPage() {
	const [query, setQuery] = useState('');
	const [isPending, startTransition] = useTransition();

	const handleChange = (e) => {
		setQuery(e.target.value); // urgent — updates input instantly
		startTransition(() => {
			setSearchResults(search(e.target.value)); // non-urgent — can be interrupted
		});
	};

	return (
		<>
			<input onChange={handleChange} />
			{isPending && <span>Searching…</span>}
			<ResultList query={query} />
		</>
	);
}
```

---

## 8. When Does a Component Re-render?

```
┌──────────────────────────────────────────────────┐
│  A component re-renders when:                    │
│                                                  │
│  1. Its own state changes (useState/useReducer)  │
│  2. Its props change (new reference or value)    │
│  3. Its parent re-renders (even with same props) │
│     → unless wrapped in React.memo               │
│  4. A context it consumes changes                │
│  5. forceUpdate() is called (class components)   │
└──────────────────────────────────────────────────┘

  A component does NOT re-render when:
  • A sibling re-renders
  • A useRef value changes
  • A variable outside the component changes
  • React.memo is used and props are shallowly equal
```

---

## Q&A

**Q: What is the Virtual DOM and why does React use it?**
The Virtual DOM is a lightweight JavaScript object tree that represents the real DOM. React uses it to compute what changed after a state update entirely in memory (cheap), then applies only the minimal set of real DOM mutations (expensive) needed. This avoids unnecessary browser reflows and repaints.

**Q: Is the Virtual DOM always faster than direct DOM manipulation?**
Not always. For very simple updates (changing one text node), direct DOM manipulation can be faster because there's no diffing overhead. The VDOM pays off when many things could change at once — React's batching and diffing produce fewer total DOM operations than naive imperative updates would.

**Q: What is reconciliation?**
The process of comparing the previous VDOM tree with the new one after a render to determine the minimum set of DOM operations needed. React's diff algorithm runs in O(n) by making two heuristic assumptions: element type changes mean full subtree replacement, and keys identify list items across renders.

**Q: Why should you not use array index as a key?**
Keys are how React tracks which list item maps to which fiber (DOM node + state). If you use index, and the list is reordered or filtered, the index of an item changes — React will match the wrong fiber to the wrong item. This causes incorrect state (e.g., a text input retaining the previous item's typed value) and unnecessary DOM mutations.

**Q: What is React Fiber?**
Fiber is React's reimplemented reconciliation engine (React 16+). It breaks rendering work into small units ("fibers") that can be paused, prioritized, and resumed. This enables concurrent rendering — React can interrupt a low-priority render to handle urgent user input, then resume where it left off.

**Q: What are the two phases of a React render?**
The **render phase** (interruptible): React calls component functions, builds the new VDOM, diffs old vs new, and collects effects. No DOM changes happen here. The **commit phase** (synchronous, non-interruptible): React applies all collected effects to the real DOM, runs `useLayoutEffect`, lets the browser paint, then runs `useEffect`.

**Q: What is batching in React?**
Batching is React's optimization of combining multiple `setState` calls triggered in the same event loop tick into a single re-render. React 17 only batched inside React event handlers. React 18 introduced Automatic Batching — all `setState` calls everywhere (including inside `setTimeout`, `Promise.then`, and native event handlers) are batched by default.

**Q: What is the difference between the render phase and commit phase?**
The render phase is pure computation — React works out what the UI should look like by calling component functions and diffing. It can be interrupted and restarted. No visible side effects occur here. The commit phase is where React actually writes to the DOM. It is always synchronous and uninterruptible — React completes the entire commit in one pass so the browser never sees a partial update.

**Q: What does React.memo do and when should you use it?**
`React.memo` wraps a component with a shallow prop comparison. If props haven't changed, the component skips re-rendering. Use it for components that: render often, receive the same props most of the time, and have a non-trivial render cost. Avoid it for components that always receive new props or have trivial renders — the comparison itself has a small cost.

**Q: Why does `React.memo` sometimes not prevent re-renders even when data hasn't changed?**
Because `React.memo` uses shallow equality. If a parent passes a new object literal `{ id: 1 }` or an inline function `() => {}` as a prop on every render, the reference changes even if the value is the same. `React.memo` sees a new reference and re-renders. Fix: use `useMemo` for object props and `useCallback` for function props to stabilize their references.

**Q: What is Concurrent Mode and how does it improve UX?**
Concurrent Mode is a set of React 18 features that allow React to render multiple versions of the UI in memory simultaneously. React can pause a low-priority render mid-flight, handle urgent work (like a user keystroke), and resume or discard the paused work. This keeps the UI responsive during expensive renders.

**Q: What is `flushSync` and when would you use it?**
`flushSync` forces React to synchronously flush all state updates inside its callback to the DOM immediately, bypassing batching. Use it when you need the DOM to be updated before the next line of code runs — for example, measuring a DOM element's size immediately after setting state that changes its layout.
