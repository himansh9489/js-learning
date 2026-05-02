# React Hooks — Complete Guide

Hooks are functions that let **function components** tap into React features: state, lifecycle, context, refs, and performance optimizations — without ever writing a class.

---

## Why Hooks Exist

Before hooks (pre React 16.8), you had to use class components for any stateful logic. This caused:

- **Boilerplate explosion** — `this.state`, `this.setState`, `componentDidMount`, `componentDidUpdate`, `componentWillUnmount`
- **Logic fragmentation** — related code (set up + teardown of a subscription) was split across lifecycle methods
- **No reuse** — stateful logic could only be shared via HOCs or render props, both of which bloat the component tree

Hooks solve all three by letting you extract stateful logic into plain functions (custom hooks) that compose naturally.

---

## Rules of Hooks (non-negotiable)

1. **Only call hooks at the top level** — never inside loops, conditions, or nested functions
2. **Only call hooks from React functions** — function components or custom hooks

```jsx
// ❌ WRONG — conditional hook
if (isLoggedIn) {
  const [data, setData] = useState(null); // breaks hook order
}

// ✅ CORRECT — condition goes inside the hook
const [data, setData] = useState(null);
if (!isLoggedIn) return null;
```

---

## 1. `useState`

### What

Stores a piece of **local component state**. Returns `[currentValue, setter]`.

### When to use

- Simple on/off toggles
- Form field values
- Counter, tabs, pagination index
- Any value that, when changed, should re-render the UI

### Where NOT to use

- State shared between many components → lift up or use Context/Redux
- Values that don't need to trigger re-renders → use `useRef`

### Practical examples

```jsx
// Basic counter
function Counter() {
	const [count, setCount] = useState(0);
	return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}

// Form input
function LoginForm() {
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');

	return (
		<form>
			<input value={email} onChange={(e) => setEmail(e.target.value)} />
			<input value={password} onChange={(e) => setPassword(e.target.value)} />
		</form>
	);
}

// Object state — always spread to avoid mutation
function Profile() {
	const [user, setUser] = useState({ name: 'Alice', age: 25 });

	const birthday = () => setUser((prev) => ({ ...prev, age: prev.age + 1 }));

	return (
		<button onClick={birthday}>
			{user.name} is {user.age}
		</button>
	);
}
```

### Pitfalls

- `setState` is **async** — you won't see the new value on the next line
- When new state depends on old state, always use the **functional updater** `setState(prev => ...)` to avoid stale closures
- Never mutate state directly: `state.items.push(x)` — React won't re-render

---

## 2. `useEffect`

### What

Runs **side effects** after the component renders. The optional cleanup function runs before the next effect or on unmount.

```
useEffect(setup, deps?)
```

### When to use

- Fetching data on mount
- Setting up event listeners / subscriptions
- Syncing with external systems (WebSocket, analytics, timers)
- Updating the document title or other DOM properties

### Dependency array behaviour

| deps     | Runs                    |
| -------- | ----------------------- |
| omitted  | After **every** render  |
| `[]`     | Once on **mount** only  |
| `[a, b]` | When `a` or `b` changes |

### Practical examples

```jsx
// Fetch on mount
function UserProfile({ userId }) {
	const [user, setUser] = useState(null);

	useEffect(() => {
		let cancelled = false;

		fetch(`/api/users/${userId}`)
			.then((r) => r.json())
			.then((data) => {
				if (!cancelled) setUser(data);
			});

		return () => {
			cancelled = true;
		}; // cleanup prevents stale update
	}, [userId]);

	return <div>{user?.name}</div>;
}

// Event listener with cleanup
function WindowWidth() {
	const [width, setWidth] = useState(window.innerWidth);

	useEffect(() => {
		const handler = () => setWidth(window.innerWidth);
		window.addEventListener('resize', handler);
		return () => window.removeEventListener('resize', handler); // cleanup
	}, []);

	return <p>Width: {width}px</p>;
}

// Sync document title
function PageTitle({ title }) {
	useEffect(() => {
		document.title = title;
		return () => {
			document.title = 'App';
		};
	}, [title]);

	return null;
}
```

### Pitfalls

- **Missing deps** → stale closure bugs (function reads old state/props)
- **Object/array as dep** → effect runs every render because `{} !== {}`. Use primitive values or memoize
- Avoid fetching data in `useEffect` for new code → prefer `useSuspense` or a data-fetching library

---

## 3. `useContext`

### What

Reads the nearest value of a React Context. When the context value changes, every consumer re-renders.

### When to use

- Theme (dark/light mode)
- Current authenticated user
- Locale / i18n settings
- Any app-level config shared by many components

### When NOT to use

- Frequently-changing state (every keystroke) → all consumers re-render on every change. Use state colocation or Zustand/Redux instead.

### Practical example

```jsx
// 1. Create context
const ThemeContext = React.createContext('light');

// 2. Provide value high in the tree
function App() {
	const [theme, setTheme] = useState('light');
	return (
		<ThemeContext.Provider value={{ theme, setTheme }}>
			<Toolbar />
		</ThemeContext.Provider>
	);
}

// 3. Consume anywhere in the subtree — no prop drilling
function ThemedButton() {
	const { theme, setTheme } = useContext(ThemeContext);
	return (
		<button
			style={{ background: theme === 'dark' ? '#333' : '#fff' }}
			onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>
			Toggle
		</button>
	);
}
```

---

## 4. `useReducer`

### What

An alternative to `useState` for **complex state logic**. Uses the `(state, action) => newState` reducer pattern (same as Redux).

### When to use

- Multiple sub-values that change together
- Next state depends on the previous state in a non-trivial way
- State transitions are better expressed as named actions
- The logic is complex enough to test in isolation

### Practical example

```jsx
const initialState = { count: 0, step: 1 };

function reducer(state, action) {
	switch (action.type) {
		case 'INCREMENT':
			return { ...state, count: state.count + state.step };
		case 'DECREMENT':
			return { ...state, count: state.count - state.step };
		case 'RESET':
			return initialState;
		case 'SET_STEP':
			return { ...state, step: action.payload };
		default:
			throw new Error(`Unknown action: ${action.type}`);
	}
}

function StepCounter() {
	const [state, dispatch] = useReducer(reducer, initialState);

	return (
		<div>
			<p>Count: {state.count}</p>
			<button onClick={() => dispatch({ type: 'INCREMENT' })}>+</button>
			<button onClick={() => dispatch({ type: 'DECREMENT' })}>-</button>
			<button onClick={() => dispatch({ type: 'RESET' })}>Reset</button>
			<input
				type="number"
				value={state.step}
				onChange={(e) => dispatch({ type: 'SET_STEP', payload: Number(e.target.value) })}
			/>
		</div>
	);
}
```

### `useState` vs `useReducer`

| Situation                                     | Use          |
| --------------------------------------------- | ------------ |
| 1–2 independent primitive values              | `useState`   |
| Multiple related values / complex transitions | `useReducer` |
| Logic should be testable in isolation         | `useReducer` |
| Logic fits in one line                        | `useState`   |

---

## 5. `useRef`

### What

Returns a mutable `{ current: value }` object that **persists across renders** without causing re-renders when mutated.

### When to use

- Accessing or manipulating a DOM element directly (focus, scroll, measure)
- Storing a previous value of a prop or state
- Storing a timer ID, subscription, or instance variable that shouldn't trigger renders

### Practical examples

```jsx
// DOM access — focus input on mount
function AutoFocusInput() {
	const inputRef = useRef(null);

	useEffect(() => {
		inputRef.current.focus();
	}, []);

	return <input ref={inputRef} placeholder="I get focus on mount" />;
}

// Store previous value
function PreviousValue({ value }) {
	const prevRef = useRef();

	useEffect(() => {
		prevRef.current = value;
	}); // no deps: runs after every render

	return (
		<p>
			Now: {value} | Before: {prevRef.current}
		</p>
	);
}

// Timer ID — avoid stale closure issues
function Stopwatch() {
	const [time, setTime] = useState(0);
	const timerRef = useRef(null);

	const start = () => {
		timerRef.current = setInterval(() => setTime((t) => t + 1), 1000);
	};
	const stop = () => clearInterval(timerRef.current);

	return (
		<>
			<p>{time}s</p>
			<button onClick={start}>Start</button>
			<button onClick={stop}>Stop</button>
		</>
	);
}
```

### `useRef` vs `useState`

| Need                              | Hook       |
| --------------------------------- | ---------- |
| Value change should re-render     | `useState` |
| Value change should NOT re-render | `useRef`   |
| DOM node access                   | `useRef`   |

---

## 6. `useMemo`

### What

Memoizes the **result of a computation**. Only recomputes when dependencies change.

```
const result = useMemo(() => expensiveCalc(a, b), [a, b]);
```

### When to use

- Expensive calculations (sorting/filtering large lists, heavy math)
- Deriving stable object/array references passed to memoized children

### When NOT to use

- Cheap operations (string concatenation, simple math) — memoization itself has overhead
- Every value "just in case" — measure first

### Practical example

```jsx
function ProductList({ products, filter }) {
	// Recomputes ONLY when products or filter changes
	const filtered = useMemo(() => products.filter((p) => p.category === filter), [products, filter]);

	return (
		<ul>
			{filtered.map((p) => (
				<li key={p.id}>{p.name}</li>
			))}
		</ul>
	);
}
```

---

## 7. `useCallback`

### What

Memoizes a **function reference**. The same function object is returned unless dependencies change.

```
const fn = useCallback(() => doSomething(a), [a]);
```

### Why it matters

In JavaScript, `() => {}` creates a new function object on every render. When you pass it as a prop to a `React.memo` child, the child re-renders every time the parent renders — even if nothing changed.

### When to use

- A function is passed as a prop to a `React.memo` wrapped child
- A function is a dependency of another hook (`useEffect`, `useMemo`)

### Practical example

```jsx
// Without useCallback: SearchResults re-renders every time Parent renders
// With useCallback: SearchResults only re-renders when query changes

const SearchResults = React.memo(({ onSelect }) => {
	console.log('SearchResults rendered');
	return <button onClick={() => onSelect('item')}>Select</button>;
});

function Parent() {
	const [query, setQuery] = useState('');
	const [other, setOther] = useState(0);

	const handleSelect = useCallback(
		(item) => {
			console.log('Selected:', item, 'for query:', query);
		},
		[query],
	); // stable as long as query doesn't change

	return (
		<>
			<input value={query} onChange={(e) => setQuery(e.target.value)} />
			<button onClick={() => setOther((o) => o + 1)}>Unrelated update</button>
			<SearchResults onSelect={handleSelect} />
		</>
	);
}
```

### `useMemo` vs `useCallback`

```js
useMemo(() => fn(), deps); // memoizes the RETURN VALUE of fn()
useCallback(fn, deps); // memoizes fn ITSELF (the function reference)

// They are equivalent:
useCallback(fn, deps) === useMemo(() => fn, deps);
```

---

## 8. `useLayoutEffect`

### What

Identical to `useEffect` but fires **synchronously after DOM mutations and before the browser paints**. This lets you read layout and make synchronous DOM changes without a visual flicker.

### When to use

- Reading DOM measurements (height, width, scroll position) right after a render
- Synchronously applying style changes that depend on layout

### When NOT to use

- Anything that doesn't need synchronous DOM access — use `useEffect` instead (`useLayoutEffect` blocks painting)

```jsx
function Tooltip({ children, targetRef }) {
	const tooltipRef = useRef(null);

	useLayoutEffect(() => {
		const target = targetRef.current.getBoundingClientRect();
		tooltipRef.current.style.top = `${target.bottom + 8}px`;
		tooltipRef.current.style.left = `${target.left}px`;
	}, [targetRef]);

	return (
		<div ref={tooltipRef} className="tooltip">
			{children}
		</div>
	);
}
```

---

## 9. `useImperativeHandle`

### What

Customizes the ref handle exposed to a parent when using `forwardRef`. Lets you **expose only specific methods**, not the whole DOM node.

### When to use

- Building reusable input/modal components that need to be imperatively controlled (focus, open, reset)

```jsx
const FancyInput = forwardRef((props, ref) => {
	const inputRef = useRef(null);

	useImperativeHandle(ref, () => ({
		focus: () => inputRef.current.focus(),
		clear: () => {
			inputRef.current.value = '';
		},
	}));

	return <input ref={inputRef} {...props} />;
});

function Form() {
	const inputRef = useRef(null);
	return (
		<>
			<FancyInput ref={inputRef} />
			<button onClick={() => inputRef.current.focus()}>Focus</button>
			<button onClick={() => inputRef.current.clear()}>Clear</button>
		</>
	);
}
```

---

## 10. `useDebugValue`

### What

Adds a **label to a custom hook** visible in React DevTools.

### When to use

- Only in custom hooks, only when the label would meaningfully help debugging.

```jsx
function useOnlineStatus() {
	const [isOnline, setIsOnline] = useState(navigator.onLine);

	useDebugValue(isOnline ? 'Online' : 'Offline');

	useEffect(() => {
		const handler = () => setIsOnline(navigator.onLine);
		window.addEventListener('online', handler);
		window.addEventListener('offline', handler);
		return () => {
			window.removeEventListener('online', handler);
			window.removeEventListener('offline', handler);
		};
	}, []);

	return isOnline;
}
```

---

## New Hooks (React 18+)

---

## 11. `useId` _(React 18)_

### What

Generates a **stable, unique ID** that is consistent between server and client renders (important for SSR hydration).

### When to use

- Associating `<label>` with `<input>` via `htmlFor`/`id`
- ARIA attributes (`aria-describedby`, `aria-labelledby`)

```jsx
function FormField({ label }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} />
    </div>
  );
}

// Safe to render multiple instances — each gets its own ID
<FormField label="Email" />
<FormField label="Phone" />
```

---

## 12. `useTransition` _(React 18)_

### What

Marks a state update as **non-urgent** (a "transition"). React can interrupt it to keep the UI responsive.

Returns `[isPending, startTransition]`.

### When to use

- Expensive re-renders triggered by user input (large lists, charts)
- Tab switches that re-render heavy content
- Filtering / searching large datasets

```jsx
function SearchPage() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const [isPending, startTransition] = useTransition();

	const handleChange = (e) => {
		setQuery(e.target.value); // urgent — update input immediately

		startTransition(() => {
			setResults(heavySearch(e.target.value)); // non-urgent — can be interrupted
		});
	};

	return (
		<>
			<input value={query} onChange={handleChange} />
			{isPending && <span>Loading...</span>}
			<ResultList items={results} />
		</>
	);
}
```

---

## 13. `useDeferredValue` _(React 18)_

### What

Returns a **deferred (stale) version** of a value. React renders with the old value first, then re-renders with the new one when idle — similar to debouncing but driven by React's scheduler.

### When to use

- You don't control the component that causes the expensive render (e.g., a third-party chart)
- The "slow" part is rendering, not fetching

```jsx
function App() {
	const [query, setQuery] = useState('');
	const deferred = useDeferredValue(query);

	return (
		<>
			<input value={query} onChange={(e) => setQuery(e.target.value)} />
			{/* SlowList will render with old `deferred` value first */}
			<SlowList query={deferred} />
		</>
	);
}
```

### `useTransition` vs `useDeferredValue`

|                          | `useTransition`                   | `useDeferredValue`             |
| ------------------------ | --------------------------------- | ------------------------------ |
| You own the state setter | ✅ Yes                            | ❌ No (or it comes from props) |
| Shows pending state      | ✅ `isPending` flag               | ❌ No built-in flag            |
| Use case                 | Wrapping your own `setState` call | Deferring a value you receive  |

---

## 14. `useSyncExternalStore` _(React 18)_

### What

The **correct way to subscribe to external stores** (browser APIs, third-party state managers) in React 18 with concurrent features.

### When to use

- Subscribing to `window.matchMedia`, `localStorage`, Zustand, Redux (they use this internally), or any non-React observable

```jsx
function useWindowWidth() {
	return useSyncExternalStore(
		(callback) => {
			window.addEventListener('resize', callback);
			return () => window.removeEventListener('resize', callback);
		},
		() => window.innerWidth, // client snapshot
		() => 1024, // server snapshot (SSR)
	);
}

function Layout() {
	const width = useWindowWidth();
	return <p>Window is {width}px wide</p>;
}
```

---

## 15. `useInsertionEffect` _(React 18)_

### What

Fires **before any DOM mutations** — even before `useLayoutEffect`. Intended exclusively for CSS-in-JS libraries to inject styles before the browser paints.

### When to use

- Almost never in application code. Only for library authors writing CSS-in-JS runtimes.

---

## New Hooks (React 19)

---

## 16. `useActionState` _(React 19, replaces `useFormState`)_

### What

Manages the **state of a form action** (loading, error, result). Works natively with React Server Actions and the HTML `<form action>` API.

```
const [state, dispatch, isPending] = useActionState(actionFn, initialState);
```

### When to use

- Form submissions that call an async server action
- Any async action where you want built-in pending + error state

```jsx
async function submitForm(prevState, formData) {
	const name = formData.get('name');
	if (!name) return { error: 'Name is required' };
	await saveToServer(name);
	return { success: true };
}

function ContactForm() {
	const [state, dispatch, isPending] = useActionState(submitForm, null);

	return (
		<form action={dispatch}>
			<input name="name" />
			{state?.error && <p style={{ color: 'red' }}>{state.error}</p>}
			{state?.success && <p>Saved!</p>}
			<button disabled={isPending}>{isPending ? 'Saving...' : 'Save'}</button>
		</form>
	);
}
```

---

## 17. `useFormStatus` _(React 19)_

### What

Reads the \*_pending status of the parent `<form>_`*. Must be used inside a component rendered within a `<form>`.

```
const { pending, data, method, action } = useFormStatus();
```

### When to use

- Building a reusable `<SubmitButton>` that automatically disables during submission

```jsx
import { useFormStatus } from 'react-dom';

function SubmitButton() {
	const { pending } = useFormStatus();
	return <button disabled={pending}>{pending ? 'Submitting...' : 'Submit'}</button>;
}

function Form() {
	return (
		<form action={serverAction}>
			<input name="email" />
			<SubmitButton /> {/* knows about the parent form's pending state */}
		</form>
	);
}
```

---

## 18. `useOptimistic` _(React 19)_

### What

Applies an **optimistic update** immediately while an async operation is in flight, then reverts to the real state once the server responds.

```
const [optimisticValue, addOptimistic] = useOptimistic(serverState, updateFn);
```

### When to use

- Likes, upvotes, toggles — any action where you want instant feedback before confirmation
- Cart additions, message sends

```jsx
function LikeButton({ postId, initialLikes }) {
	const [likes, setLikes] = useState(initialLikes);
	const [optimisticLikes, addOptimisticLike] = useOptimistic(likes, (current, increment) => current + increment);

	const handleLike = async () => {
		addOptimisticLike(1); // instant UI update
		const newLikes = await likePost(postId); // real server call
		setLikes(newLikes); // reconcile with real value
	};

	return <button onClick={handleLike}>❤️ {optimisticLikes}</button>;
}
```

---

## 19. `use` _(React 19)_

### What

A new primitive that lets you **read a Promise or Context inside any expression** — including inside conditionals and loops (unlike all other hooks).

```
const value = use(promise | context);
```

### When to use

- Unwrapping a Promise (works with Suspense — component suspends until resolved)
- Reading Context conditionally

```jsx
// Reading a promise — component suspends until resolved
function Message({ messagePromise }) {
	const message = use(messagePromise); // suspends here if still pending
	return <p>{message}</p>;
}

// Reading context conditionally
function Notification({ show }) {
	if (!show) return null;
	const theme = use(ThemeContext); // allowed inside an if block
	return <div style={{ background: theme.bg }}>Notification</div>;
}
```

---

## Custom Hooks

Extracting stateful logic into a custom hook makes it reusable and testable.

```jsx
// useLocalStorage.js
function useLocalStorage(key, defaultValue) {
	const [value, setValue] = useState(() => {
		try {
			return JSON.parse(localStorage.getItem(key)) ?? defaultValue;
		} catch {
			return defaultValue;
		}
	});

	useEffect(() => {
		localStorage.setItem(key, JSON.stringify(value));
	}, [key, value]);

	return [value, setValue];
}

// Usage
function Settings() {
	const [theme, setTheme] = useLocalStorage('theme', 'light');
	return <button onClick={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}>{theme}</button>;
}
```

### Rules for custom hooks

- Name must start with `use`
- Can call other hooks inside
- Each call to the hook gets its **own isolated state**

---

## Hook Reference Table

| Hook                   | React version | Purpose                                  |
| ---------------------- | ------------- | ---------------------------------------- |
| `useState`             | 16.8          | Local component state                    |
| `useEffect`            | 16.8          | Side effects + cleanup                   |
| `useContext`           | 16.8          | Read context                             |
| `useReducer`           | 16.8          | Complex state transitions                |
| `useMemo`              | 16.8          | Memoize computed value                   |
| `useCallback`          | 16.8          | Memoize function reference               |
| `useRef`               | 16.8          | Mutable ref / DOM access                 |
| `useLayoutEffect`      | 16.8          | Sync DOM read/write before paint         |
| `useImperativeHandle`  | 16.8          | Customize exposed ref API                |
| `useDebugValue`        | 16.8          | DevTools label for custom hooks          |
| `useId`                | 18            | Stable unique IDs (SSR-safe)             |
| `useTransition`        | 18            | Mark state update as non-urgent          |
| `useDeferredValue`     | 18            | Defer a value for background render      |
| `useSyncExternalStore` | 18            | Subscribe to external stores safely      |
| `useInsertionEffect`   | 18            | Inject styles before DOM mutations       |
| `useActionState`       | 19            | Form action state (loading/error/result) |
| `useFormStatus`        | 19            | Parent form pending state                |
| `useOptimistic`        | 19            | Optimistic UI updates                    |
| `use`                  | 19            | Read Promise/Context anywhere            |

---

## Common Pitfalls

| Pitfall                           | Problem                                       | Fix                                                  |
| --------------------------------- | --------------------------------------------- | ---------------------------------------------------- |
| Calling hook inside `if`/`loop`   | Breaks hook call order across renders         | Move condition inside the hook                       |
| Missing `useEffect` deps          | Stale closure reads old state                 | Add all referenced variables to deps array           |
| Object/array literal in deps      | New reference every render → infinite loop    | `useMemo` the object, or use primitives              |
| Mutating state directly           | React doesn't detect the change, no re-render | Always return new references: `[...arr]`, `{...obj}` |
| Overusing `useMemo`/`useCallback` | Complexity, memory cost, harder to read       | Only use when profiling shows a problem              |
| `useEffect` for derived state     | Unnecessary extra render                      | Compute inline during render instead                 |
| Forgetting cleanup                | Memory leaks, duplicate listeners             | Return cleanup from `useEffect`                      |
| `useState` for non-UI values      | Causes unnecessary re-renders                 | Use `useRef` for values that don't drive UI          |

---

## Q&A

**Q: Can I call a hook inside a condition?**
No. Hooks must be called in the same order every render. Put the condition _inside_ the hook body or handle it with early returns after all hooks are called.

**Q: What's the difference between `useEffect` and `useLayoutEffect`?**
`useEffect` fires asynchronously after the browser paints. `useLayoutEffect` fires synchronously after DOM mutations but before the paint — use it only when you need to read layout or make DOM changes that would otherwise cause a visible flicker.

**Q: When should I use `useReducer` instead of `useState`?**
When you have 3+ related state fields that change together, when the next state depends on the previous state in a complex way, or when you want to express transitions as named actions for clarity and testability.

**Q: Does every function in a component need `useCallback`?**
No. `useCallback` is only useful when (a) the function is passed as a prop to a `React.memo`-wrapped child, or (b) it's a dependency of another hook. Otherwise it adds overhead for no benefit.

**Q: What is the difference between `useMemo` and `useCallback`?**
`useMemo` caches the _return value_ of a function. `useCallback` caches the _function reference itself_. `useCallback(fn, deps)` is exactly `useMemo(() => fn, deps)`.

**Q: How is `useRef` different from a module-level variable?**
A module-level variable is shared across all instances of a component. A `useRef` value is **per-instance** — each component instance gets its own `ref.current`.

**Q: Can I use `useContext` to replace Redux?**
For small apps, yes. For large apps with frequent updates, be careful: every context value change re-renders _all_ consumers. Redux (and libraries like Zustand) use `useSyncExternalStore` internally to avoid this by subscribing only to the slice of state each component needs.

**Q: What is `useTransition` good for?**
Marking state updates as "interruptible". If a user types quickly while a heavy list is re-rendering, React can abandon the old render and start fresh with the latest input — keeping the text field responsive.

**Q: When does `useOptimistic` revert?**
After the async operation (server action) completes. If it succeeds, the real state from the server replaces the optimistic value. If it throws, React also reverts to the previous state.

**Q: What makes `use` different from other hooks?**
It's the only hook-like primitive that can be called **inside conditionals and loops**. It "unwraps" a Promise (suspending until resolved) or reads a Context — making it composable in ways that regular hooks aren't.

**Q: Should I always clean up `useEffect`?**
Any `useEffect` that sets up a subscription, event listener, timer, or network request should return a cleanup function. Not doing so causes memory leaks and bugs (e.g., calling `setState` on an unmounted component).

**Q: What is stale closure in `useEffect`?**
When a callback inside `useEffect` captures a variable (e.g., `count`) at the time the effect was created, and that variable changes later, the callback still uses the old value. Fix: include the variable in the deps array so the effect re-runs with the latest value.
