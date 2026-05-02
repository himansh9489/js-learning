# Pure Components in React

---

## Table of Contents

1. [What is a Pure Component?](#1-what-is-a-pure-component)
2. [Why Pure Components Exist](#2-why-pure-components-exist)
3. [React.PureComponent — Class-based](#3-reactpurecomponent--class-based)
4. [React.memo — Functional equivalent](#4-reactmemo--functional-equivalent)
5. [When to Use](#5-when-to-use)
6. [Where to Use in a Real App](#6-where-to-use-in-a-real-app)
7. [When NOT to Use](#7-when-not-to-use)
8. [Shallow Comparison Explained](#8-shallow-comparison-explained)
9. [Common Pitfalls](#9-common-pitfalls)
10. [Complete Practical Example](#10-complete-practical-example)
11. [PureComponent vs memo vs shouldComponentUpdate](#11-purecomponent-vs-memo-vs-shouldcomponentupdate)
12. [Q&A — Interview Prep](#12-qa--interview-prep)

---

## 1. What is a Pure Component?

A **Pure Component** is a component that **only re-renders when its props or state actually change** — not every time the parent re-renders.

The name comes from the concept of a **pure function** in functional programming:

```
// Pure function: same inputs → always same output, no side effects
function add(a, b) { return a + b; }

// Pure component: same props/state → same render output
// React can safely skip re-rendering if nothing changed
```

React provides two mechanisms to create pure components:

| Mechanism             | Used with           | How it works                                                   |
| --------------------- | ------------------- | -------------------------------------------------------------- |
| `React.PureComponent` | Class components    | Auto shallow-compares props & state in `shouldComponentUpdate` |
| `React.memo`          | Function components | Wraps component with a shallow props comparison                |

---

## 2. Why Pure Components Exist

### The default problem

By default, React re-renders a child **every time its parent re-renders**, regardless of whether the child's props changed:

```
Parent renders
  └─ ChildA re-renders  ← even if its props are identical
  └─ ChildB re-renders  ← even if its props are identical
  └─ ChildC re-renders  ← even if its props are identical
```

This is intentional — React prefers correctness over performance by default. But it means many renders are **wasted work**: the component function runs, React creates a new VDOM, diffs it… only to find nothing changed.

### What pure components fix

A pure component inserts a **fast equality guard** before the component function runs:

```
Parent renders
  └─ ChildA: props changed? YES → re-render
  └─ ChildB: props changed? NO  → skip ✓ (previous output reused)
  └─ ChildC: props changed? NO  → skip ✓
```

The guard is cheap (shallow comparison). The render is expensive (DOM diffing, layout, etc.). If a component renders frequently with the same props, the savings compound.

---

## 3. React.PureComponent — Class-based

### Syntax

Extend `React.PureComponent` instead of `React.Component`:

```tsx
import React from 'react';

// Regular component — re-renders on every parent render
class GoldPrice extends React.Component<{ price: number }> {
  render() {
    console.log('GoldPrice rendered');
    return <div>₹{this.props.price}</div>;
  }
}

// Pure component — skips re-render if price prop is the same
class GoldPrice extends React.PureComponent<{ price: number }> {
  render() {
    console.log('GoldPrice rendered');
    return <div>₹{this.props.price}</div>;
  }
}
```

### What it does internally

`React.PureComponent` overrides `shouldComponentUpdate` with a shallow comparison:

```ts
// This is effectively what PureComponent does for you:
shouldComponentUpdate(nextProps, nextState) {
  return (
    shallowNotEqual(this.props, nextProps) ||
    shallowNotEqual(this.state,  nextState)
  );
}

// shallowNotEqual: checks if any top-level key has a different reference/value
function shallowNotEqual(objA, objB) {
  if (objA === objB) return false;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);
  if (keysA.length !== keysB.length) return true;
  for (let key of keysA) {
    if (objA[key] !== objB[key]) return true;
  }
  return false;
}
```

### Full class example

```tsx
import React from 'react';

interface SipCardProps {
	amount: number;
	date: string;
	isActive: boolean;
}

class SipCard extends React.PureComponent<SipCardProps> {
	render() {
		console.log('SipCard rendered'); // only logs when props actually change
		const { amount, date, isActive } = this.props;
		return (
			<div className={isActive ? 'active' : 'inactive'}>
				<span>₹{amount}</span>
				<span>{date}</span>
			</div>
		);
	}
}

// Parent
class SipList extends React.Component {
	state = { refresh: 0, selectedId: null };

	render() {
		return (
			<div>
				{/* Clicking "refresh" re-renders SipList but SipCard props haven't
            changed — PureComponent will skip SipCard's render */}
				<button onClick={() => this.setState((s) => ({ refresh: s.refresh + 1 }))}>
					Refresh ({this.state.refresh})
				</button>
				<SipCard amount={500} date="1st every month" isActive={true} />
			</div>
		);
	}
}
```

---

## 4. React.memo — Functional Equivalent

`React.memo` is the **function component equivalent** of `React.PureComponent`. It wraps a component and memoizes its output, re-rendering only when props change.

### Basic usage

```tsx
import React from 'react';

interface GoldTileProps {
  label: string;
  value: string;
}

// Without memo — re-renders whenever parent re-renders
function GoldTile({ label, value }: GoldTileProps) {
  console.log('GoldTile rendered');
  return (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// With memo — re-renders ONLY when label or value changes
const GoldTile = React.memo(function GoldTile({ label, value }: GoldTileProps) {
  console.log('GoldTile rendered');
  return (
    <div>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
});
```

### With custom comparison

When you need deep equality or custom logic:

```tsx
interface Product {
	id: number;
	name: string;
	price: number;
}

const ProductRow = React.memo(
	function ProductRow({ product }: { product: Product }) {
		return (
			<div>
				{product.name} — ₹{product.price}
			</div>
		);
	},
	// Second argument: arePropsEqual(prevProps, nextProps)
	// return true  → props are "equal" → SKIP re-render
	// return false → props changed    → RE-RENDER
	(prevProps, nextProps) =>
		prevProps.product.id === nextProps.product.id && prevProps.product.price === nextProps.product.price,
);
```

---

## 5. When to Use

Use a pure component when **all three** conditions are true:

### ✅ Condition 1 — The component renders frequently

The parent re-renders often (e.g., on user input, polling, frequent state changes), and this child is inside that render path.

```tsx
// Parent updates every 500ms with a live gold price ticker
function LiveTicker() {
	const [price, setPrice] = useState(4800);
	// ...polling logic

	return (
		<>
			<PriceDisplay price={price} /> {/* changes often — no memo needed */}
			<GoldInfo info={staticInfo} /> {/* never changes — perfect for memo */}
		</>
	);
}
```

### ✅ Condition 2 — The component's props stay the same most of the time

If props change on every render anyway, the comparison cost produces zero benefit.

### ✅ Condition 3 — The component's render is non-trivial

The component does meaningful work: renders a list, performs calculations, renders child components. For a `<span>Hello</span>`, the memo overhead exceeds the render cost.

---

## 6. Where to Use in a Real App

```
┌─────────────────────────────────────────────────────┐
│  Use React.memo / PureComponent for:                │
│                                                     │
│  ✓ List items (mapped components)                   │
│  ✓ Sidebar / nav that rarely changes               │
│  ✓ Expensive chart / table components              │
│  ✓ Shared UI atoms used in many places             │
│  ✓ Components receiving stable primitive props      │
└─────────────────────────────────────────────────────┘
```

### Real-world placement guide

```
App
├── Header ← memo (logo, user name rarely change)
├── Sidebar ← memo (nav links rarely change)
└── Dashboard
    ├── LivePriceWidget ← NO memo (price changes every second)
    ├── SipSummary ← memo (only updates on SIP events)
    └── TransactionList
        └── TransactionRow × N ← memo (individual rows rarely change)
```

### Code example — transaction list

```tsx
// Without memo: every row re-renders when any state in TransactionList changes
// With memo: only the row whose data changed re-renders

interface Transaction {
	id: string;
	amount: number;
	status: 'pending' | 'success' | 'failed';
	date: string;
}

const TransactionRow = React.memo(function TransactionRow({
	tx,
	onRetry,
}: {
	tx: Transaction;
	onRetry: (id: string) => void;
}) {
	console.log(`Row ${tx.id} rendered`);
	return (
		<div>
			<span>{tx.date}</span>
			<span>₹{tx.amount}</span>
			<span>{tx.status}</span>
			{tx.status === 'failed' && <button onClick={() => onRetry(tx.id)}>Retry</button>}
		</div>
	);
});

function TransactionList({ transactions }: { transactions: Transaction[] }) {
	// ✅ useCallback so TransactionRow's memo is not bypassed
	const handleRetry = useCallback((id: string) => {
		console.log('Retrying', id);
	}, []);

	return (
		<div>
			{transactions.map((tx) => (
				<TransactionRow key={tx.id} tx={tx} onRetry={handleRetry} />
			))}
		</div>
	);
}
```

---

## 7. When NOT to Use

### ❌ Component always receives new props

```tsx
// Pointless — parent creates new object every render
const Chart = React.memo(({ config }) => { ... });

function Parent() {
  return <Chart config={{ color: 'teal', width: 300 }} />;
  //                  ↑ new object reference every render → memo never skips
}
```

Fix: move the object outside the component or use `useMemo`.

### ❌ The component is trivially cheap

```tsx
// Overkill — the comparison costs more than just rendering
const Label = React.memo(({ text }: { text: string }) => <span>{text}</span>);
```

### ❌ Props include frequently-changing complex objects

If the prop changes on nearly every render, the shallow comparison does no good — it just adds latency.

### ❌ When using Context directly

`React.memo` only guards against prop changes. If the component consumes a context value that changes often, it will still re-render regardless.

---

## 8. Shallow Comparison Explained

Both `PureComponent` and `React.memo` use **shallow equality** — they compare each prop's **reference**, not its deep value.

```
shallowEqual({ a: 1, b: 2 }, { a: 1, b: 2 })
  → compares a: 1 === 1 ✓ and b: 2 === 2 ✓ → EQUAL → skip render
```

### Primitives — works perfectly

```tsx
// number, string, boolean are compared by value
<Button disabled={false} label="Buy Gold" />
// false === false ✓ and "Buy Gold" === "Buy Gold" ✓ → skip
```

### Objects — compared by reference

```tsx
// PROBLEM: new object every render
<ProductCard details={{ id: 1, name: 'Ring' }} />;
// { id: 1 } !== { id: 1 }  (different reference) → always re-renders

// FIX: stabilize reference with useMemo
const details = useMemo(() => ({ id: 1, name: 'Ring' }), []);
<ProductCard details={details} />;
```

### Functions — compared by reference

```tsx
// PROBLEM: new function every render
<Button onClick={() => handleBuy(id)} />;
// () => {} !== () => {}  (new reference) → always re-renders

// FIX: stabilize with useCallback
const handleBuy = useCallback(() => {
	buy(id);
}, [id]);
<Button onClick={handleBuy} />;
```

### Arrays — compared by reference

```tsx
// PROBLEM: new array every render
<TagList tags={['gold', 'SIP']} />;

// FIX: define outside component or use useMemo
const TAGS = ['gold', 'SIP']; // stable reference
<TagList tags={TAGS} />;
```

---

## 9. Common Pitfalls

### Pitfall 1 — Inline object props break memo

```tsx
// ❌ New object on every parent render — memo is useless
const Card = React.memo(({ style }) => <div style={style} />);
<Card style={{ margin: 8 }} />;

// ✅ Stable reference
const CARD_STYLE = { margin: 8 };
<Card style={CARD_STYLE} />;

// ✅ Or useMemo inside parent
const cardStyle = useMemo(() => ({ margin: 8 }), []);
<Card style={cardStyle} />;
```

### Pitfall 2 — Inline callbacks break memo

```tsx
// ❌ New function reference every render
<TransactionRow onRetry={() => retry(tx.id)} />;

// ✅ useCallback stabilizes the reference
const onRetry = useCallback(() => retry(tx.id), [tx.id]);
<TransactionRow onRetry={onRetry} />;
```

### Pitfall 3 — Mutating state instead of replacing it

```tsx
// ❌ PureComponent/memo will NOT detect this change
const items = this.state.items;
items.push(newItem); // same array reference!
this.setState({ items }); // PureComponent sees same reference → skips render

// ✅ Always return a new reference for state
this.setState((s) => ({ items: [...s.items, newItem] }));
```

### Pitfall 4 — Wrapping everything

Memoizing every single component adds comparison overhead everywhere and makes the code harder to read. Profile first, then apply targeted memoization.

### Pitfall 5 — Forgetting that memo doesn't affect internal state

`React.memo` guards against prop changes from the parent. If the component has its own `useState`/`useReducer`, state changes will still cause re-renders regardless.

```tsx
const Counter = React.memo(function Counter() {
	const [count, setCount] = useState(0);
	// memo has no effect on this — own state update always triggers re-render
	return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
});
```

---

## 10. Complete Practical Example

A gold portfolio dashboard where multiple child components should not re-render when only the live price changes.

```tsx
import React, { useCallback, useMemo, useState } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PortfolioSummary {
	totalGrams: number;
	totalInvested: number;
	currentValue: number;
}

interface SipInfo {
	amount: number;
	nextDate: string;
	active: boolean;
}

// ─── Child Components (Pure) ─────────────────────────────────────────────────

// Renders expensive summary — memo so it skips re-render when only price ticks
const PortfolioCard = React.memo(function PortfolioCard({ summary }: { summary: PortfolioSummary }) {
	console.log('PortfolioCard rendered');
	return (
		<div className="card">
			<p>{summary.totalGrams}g of gold</p>
			<p>Invested: ₹{summary.totalInvested}</p>
			<p>Current value: ₹{summary.currentValue}</p>
		</div>
	);
});

// SIP widget — rarely changes; memo prevents re-render on price ticks
const SipWidget = React.memo(function SipWidget({ sip, onPause }: { sip: SipInfo; onPause: () => void }) {
	console.log('SipWidget rendered');
	return (
		<div className="card">
			<p>
				SIP: ₹{sip.amount} on {sip.nextDate}
			</p>
			<button onClick={onPause}>{sip.active ? 'Pause' : 'Resume'}</button>
		</div>
	);
});

// Live price — always changes, memo would be pointless here
function LivePriceDisplay({ price }: { price: number }) {
	console.log('LivePriceDisplay rendered'); // renders every tick — expected
	return <div className="price-ticker">₹{price.toFixed(2)} / g</div>;
}

// ─── Parent Dashboard ────────────────────────────────────────────────────────

export function GoldDashboard() {
	// Ticks every second — causes GoldDashboard to re-render frequently
	const [livePrice, setLivePrice] = useState(5500);

	// These rarely change
	const [summary] = useState<PortfolioSummary>({
		totalGrams: 2.5,
		totalInvested: 12000,
		currentValue: 13750,
	});

	const [sip, setSip] = useState<SipInfo>({
		amount: 1000,
		nextDate: '5 May',
		active: true,
	});

	// ✅ useCallback so SipWidget's memo is not bypassed on every GoldDashboard render
	const handlePause = useCallback(() => {
		setSip((prev) => ({ ...prev, active: !prev.active }));
	}, []);

	// Simulate price ticking
	// useEffect(() => {
	//   const id = setInterval(() => setLivePrice(p => p + (Math.random() - 0.5) * 10), 1000);
	//   return () => clearInterval(id);
	// }, []);

	return (
		<div>
			{/* Updates every tick — no memo, intentional */}
			<LivePriceDisplay price={livePrice} />

			{/* summary reference is stable — PortfolioCard will not re-render on price ticks */}
			<PortfolioCard summary={summary} />

			{/* sip reference only changes when user pauses/resumes */}
			<SipWidget sip={sip} onPause={handlePause} />
		</div>
	);
}
```

**What happens on each price tick:**

```
GoldDashboard re-renders (livePrice changed)
  ├─ LivePriceDisplay: re-renders ✓ (price always new)
  ├─ PortfolioCard: memo check — summary reference unchanged → SKIP ✓
  └─ SipWidget: memo check — sip unchanged, onPause stable → SKIP ✓
```

**What happens when user pauses SIP:**

```
GoldDashboard re-renders (sip state changed)
  ├─ LivePriceDisplay: re-renders ✓
  ├─ PortfolioCard: SKIP ✓ (summary unchanged)
  └─ SipWidget: re-renders ✓ (sip changed)
```

---

## 11. PureComponent vs memo vs shouldComponentUpdate

| Feature                  | `React.PureComponent` | `React.memo`         | `shouldComponentUpdate`  |
| ------------------------ | --------------------- | -------------------- | ------------------------ |
| **Component type**       | Class                 | Function             | Class                    |
| **Comparison**           | Shallow (auto)        | Shallow (auto)       | Custom (manual)          |
| **Covers state changes** | ✅ Yes                | ❌ No (props only)   | ✅ Yes                   |
| **Custom comparison**    | ❌ (use SCU instead)  | ✅ (second argument) | ✅ (you write the logic) |
| **Modern usage**         | Rarely                | ✅ Preferred         | Rarely                   |
| **Overhead**             | Minimal               | Minimal              | Depends on your logic    |

```tsx
// All three achieve the same outcome for this case:

// 1. Class — PureComponent
class A extends React.PureComponent<{ value: number }> {
	render() {
		return <span>{this.props.value}</span>;
	}
}

// 2. Class — manual shouldComponentUpdate
class B extends React.Component<{ value: number }> {
	shouldComponentUpdate(next) {
		return next.value !== this.props.value;
	}
	render() {
		return <span>{this.props.value}</span>;
	}
}

// 3. Function — React.memo (preferred in modern React)
const C = React.memo(function C({ value }: { value: number }) {
	return <span>{value}</span>;
});
```

---

## 12. Q&A — Interview Prep

---

**Q: What is a Pure Component in React?**

A Pure Component is a component that implements **shallow equality checking** on its props (and state, for class components) before deciding whether to re-render. If neither props nor state have changed, the render is skipped. For class components this is `React.PureComponent`; for function components it's `React.memo`.

---

**Q: What is the difference between `React.Component` and `React.PureComponent`?**

`React.Component` re-renders every time `setState` is called or the parent re-renders, regardless of whether anything actually changed. `React.PureComponent` overrides `shouldComponentUpdate` with a shallow comparison of the previous and next props and state. If they are shallowly equal, re-rendering is skipped.

```tsx
// Component — always re-renders
class A extends React.Component { ... }

// PureComponent — skips re-render if props/state shallowly equal
class B extends React.PureComponent { ... }
```

---

**Q: What is shallow comparison and where does it fall short?**

Shallow comparison checks if each top-level property of the props object has the same **reference** (for objects/arrays/functions) or **value** (for primitives). It does NOT recurse into nested objects.

Falls short when:

- You pass new object literals as props (same value, different reference → comparison says "changed")
- You mutate state in place (same reference → comparison says "unchanged" even though data changed)

---

**Q: `React.memo` is used but the component still re-renders. Why?**

Three common causes:

1. **New reference props** — parent passes `{}` or `[]` or `() => {}` inline on every render. Shallow comparison sees a new reference every time.
2. **Own state changes** — memo only guards props from parent, not the component's own `useState`/`useReducer`.
3. **Context changes** — if the component consumes a changing context value, it re-renders regardless of memo.

---

**Q: What is the relationship between `React.memo` and `useCallback`/`useMemo`?**

They are typically used together. `React.memo` memoizes the rendered output based on props. But if a parent passes a function or object as a prop, a new reference is created on every parent render — bypassing memo's check. `useCallback` stabilizes function references and `useMemo` stabilizes object/array references, so that memo's shallow comparison actually has something stable to compare.

```tsx
// Without useCallback — memo is pointless
<List onSelect={() => setSelected(id)} />; // new fn every render

// With useCallback — memo works
const handleSelect = useCallback(() => setSelected(id), [id]);
<List onSelect={handleSelect} />;
```

---

**Q: How do you write a custom comparison for `React.memo`?**

Pass a second argument — a function `(prevProps, nextProps) => boolean`. Return `true` if props are "equal" (skip re-render), return `false` if they are "different" (re-render).

```tsx
const Row = React.memo(
  function Row({ item }) { ... },
  (prev, next) => prev.item.id === next.item.id && prev.item.price === next.item.price
);
```

Note: the semantics are **inverted** compared to `shouldComponentUpdate` — `shouldComponentUpdate` returns `true` to allow rendering; the `areEqual` function in `memo` returns `true` to **prevent** rendering.

---

**Q: Does `React.memo` compare state?**

No. `React.memo` only compares **props** passed from the parent. A component's own internal state changes will always trigger a re-render regardless of `React.memo`.

---

**Q: Can you use `React.PureComponent` with mutable state?**

You technically can, but it will break. If you mutate an object in state and call `setState` with the same reference, `PureComponent` will see `prevState.items === nextState.items` → equal → skip render — even though the data actually changed. Always return new state objects/arrays (immutable update pattern).

```tsx
// ❌ Breaks PureComponent
this.state.items.push(newItem);
this.setState({ items: this.state.items }); // same reference → skipped!

// ✅ Correct
this.setState((s) => ({ items: [...s.items, newItem] }));
```

---

**Q: Is `React.memo` free? Should you wrap every component?**

No, it has a cost. Every render of the parent triggers the comparison function. For trivially cheap components (e.g., `<span>{text}</span>`), the comparison overhead can exceed the render cost. Wrap components in `memo` only when profiling shows they are re-rendering unnecessarily and the render itself is non-trivial.

---

**Q: What is the difference between `React.memo` and `useMemo`?**

|                      | `React.memo`                          | `useMemo`                            |
| -------------------- | ------------------------------------- | ------------------------------------ |
| **What it memoizes** | A component's rendered output         | A computed value inside a component  |
| **Level**            | Component level                       | Value level (inside a component)     |
| **Usage**            | Wraps a component definition          | Called inside a component            |
| **Purpose**          | Skip re-rendering an entire component | Avoid recomputing an expensive value |

```tsx
// React.memo — memoizes the whole component
const Chart = React.memo(function Chart({ data }) { ... });

// useMemo — memoizes a value inside a component
function Dashboard({ rawData }) {
  const processedData = useMemo(() => heavyProcess(rawData), [rawData]);
  return <Chart data={processedData} />;
}
```

---

**Q: In what order should you think about optimization?**

1. **Identify first** — profile with React DevTools Profiler. Don't optimize blindly.
2. **Fix state structure** — unnecessary re-renders often come from state being too high in the tree.
3. **Stabilize references** — `useCallback`, `useMemo` for props passed to children.
4. **Apply `React.memo`** — on components that are expensive and receive stable props.
5. **Split context** — if a context re-renders too many consumers, split it into smaller contexts.
6. **`useTransition` / `useDeferredValue`** — for deferring expensive non-urgent renders.

---

**Q: What happens if you accidentally return `false` from `shouldComponentUpdate` when you should return `true`?**

The component will not re-render, so the UI will show stale data. This is a dangerous bug — the component's props/state change but the screen does not update. Always ensure `shouldComponentUpdate` (and the `areEqual` function in `memo`) correctly reflect whether the output would change.
