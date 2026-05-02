# React Component Lifecycle

---

## The Big Picture

Every React component goes through three phases. Understanding these phases tells you _exactly_ when your code will run.

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPONENT LIFECYCLE                             │
├──────────────┬──────────────────────┬──────────────────────────────┤
│   MOUNTING   │      UPDATING        │         UNMOUNTING           │
│  (born)      │  (prop/state change) │         (removed)            │
├──────────────┼──────────────────────┼──────────────────────────────┤
│ constructor  │ getDerivedState...   │ componentWillUnmount         │
│ getDerived.. │ shouldComponentUpd.. │                              │
│ render       │ render               │                              │
│ [DOM update] │ [DOM update]         │                              │
│ componentDid │ getSnapshotBefore..  │                              │
│   Mount      │ componentDidUpdate   │                              │
└──────────────┴──────────────────────┴──────────────────────────────┘
```

---

## Phase 1 — Mounting

The component is created and inserted into the DOM for the first time.

```
  constructor()
       │
       ▼
  static getDerivedStateFromProps(props, state)
       │
       ▼
  render()              ← pure: returns JSX, no side effects here
       │
       ▼
  [React updates the DOM]
       │
       ▼
  componentDidMount()   ← DOM is ready, safe to fetch data / set up subscriptions
```

### `constructor(props)`

**What:** Called before the component is mounted. The only place to initialize `this.state` directly and bind event handlers.

**When to use:** Initializing local state, binding methods.

**When NOT to use:** Never call `setState()` or trigger side effects here.

```jsx
class Counter extends React.Component {
	constructor(props) {
		super(props); // must call super before using `this`
		this.state = { count: props.initialCount ?? 0 };
		this.handleClick = this.handleClick.bind(this);
	}

	handleClick() {
		this.setState((prev) => ({ count: prev.count + 1 }));
	}

	render() {
		return <button onClick={this.handleClick}>{this.state.count}</button>;
	}
}
```

---

### `static getDerivedStateFromProps(props, state)`

**What:** A static method called before every render (both mount and update). Returns an object to merge into state, or `null` to change nothing.

**When to use:** When state needs to be derived from props — e.g., a controlled input that resets when a prop changes.

**When NOT to use:** Most of the time. This method causes subtle bugs. Prefer `key` prop to reset or memoize derivation in render.

```jsx
class TemperatureDisplay extends React.Component {
	static getDerivedStateFromProps(props, state) {
		if (props.unit !== state.prevUnit) {
			return {
				prevUnit: props.unit,
				displayValue: props.unit === 'F' ? (props.celsius * 9) / 5 + 32 : props.celsius,
			};
		}
		return null; // no state change needed
	}

	state = { displayValue: this.props.celsius, prevUnit: this.props.unit };

	render() {
		return (
			<p>
				{this.state.displayValue}°{this.props.unit}
			</p>
		);
	}
}
```

---

### `render()`

**What:** The only required method. Returns JSX (or `null`, arrays, portals). Must be a **pure function** — same props + state = same output, every time.

**When to use:** Always — it's mandatory.

**When NOT to use:** Never trigger side effects, call `setState`, or access the DOM here.

```jsx
render() {
  const { isLoading, items } = this.props;
  if (isLoading) return <Spinner />;
  return (
    <ul>
      {items.map(item => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

---

### `componentDidMount()`

**What:** Called once, immediately after the component is inserted into the DOM. The DOM is ready and refs are populated.

**When to use:**

- Fetch initial data from an API
- Set up subscriptions, WebSocket connections, event listeners
- Initialize third-party DOM libraries (charts, maps)
- Start timers

```jsx
class WeatherWidget extends React.Component {
	state = { weather: null, error: null };

	componentDidMount() {
		fetch(`/api/weather?city=${this.props.city}`)
			.then((r) => r.json())
			.then((data) => this.setState({ weather: data }))
			.catch((err) => this.setState({ error: err.message }));
	}

	render() {
		const { weather, error } = this.state;
		if (error) return <p>Error: {error}</p>;
		if (!weather) return <p>Loading...</p>;
		return (
			<p>
				{weather.city}: {weather.temp}°C
			</p>
		);
	}
}
```

---

## Phase 2 — Updating

Re-renders happen when props or state change.

```
  New props arrive  OR  setState() called
       │
       ▼
  static getDerivedStateFromProps(props, state)
       │
       ▼
  shouldComponentUpdate(nextProps, nextState)   ← return false to bail out
       │ true (default)
       ▼
  render()
       │
       ▼
  getSnapshotBeforeUpdate(prevProps, prevState)  ← capture DOM before update
       │
       ▼
  [React updates the DOM]
       │
       ▼
  componentDidUpdate(prevProps, prevState, snapshot)
```

---

### `shouldComponentUpdate(nextProps, nextState)`

**What:** Return `false` to skip the render and DOM update entirely. Default is `true`. This is React's primary manual performance optimization for class components.

**When to use:** When you know a re-render is unnecessary based on a simple comparison.

**When NOT to use:** Don't implement complex logic here. For most cases use `React.PureComponent` instead.

```jsx
class ExpensiveList extends React.Component {
  shouldComponentUpdate(nextProps) {
    // Only re-render if the items array reference changed
    return nextProps.items !== this.props.items;
  }

  render() {
    return (
      <ul>
        {this.props.items.map(item => <li key={item.id}>{item.name}</li>)}
      </ul>
    );
  }
}

// Shortcut: React.PureComponent does shallow comparison automatically
class ExpensiveList extends React.PureComponent {
  render() { ... }
}
```

---

### `getSnapshotBeforeUpdate(prevProps, prevState)`

**What:** Called right before the DOM is updated. Whatever it returns is passed as the third argument to `componentDidUpdate`. Used to capture information (like scroll position) before it is potentially changed by the update.

**When to use:** Maintaining scroll position in a chat window when new messages arrive.

```jsx
class ChatWindow extends React.Component {
	listRef = React.createRef();

	getSnapshotBeforeUpdate(prevProps) {
		if (prevProps.messages.length < this.props.messages.length) {
			const list = this.listRef.current;
			// How far the user has scrolled from the bottom
			return list.scrollHeight - list.scrollTop;
		}
		return null;
	}

	componentDidUpdate(prevProps, prevState, snapshot) {
		if (snapshot !== null) {
			const list = this.listRef.current;
			// Restore the scroll position after the new message is added
			list.scrollTop = list.scrollHeight - snapshot;
		}
	}

	render() {
		return (
			<div ref={this.listRef} style={{ overflowY: 'scroll', height: 400 }}>
				{this.props.messages.map((msg) => (
					<div key={msg.id}>{msg.text}</div>
				))}
			</div>
		);
	}
}
```

---

### `componentDidUpdate(prevProps, prevState, snapshot)`

**What:** Called after every update (not after the initial mount). Receives the _previous_ props and state so you can compare.

**When to use:**

- Fetch new data when a prop changes (e.g., user navigates to a different profile)
- Trigger animations based on state changes
- Update a third-party library when data changes

**Critical rule:** Always compare with previous values before calling `setState` or you will create an infinite loop.

```jsx
class UserProfile extends React.Component {
	state = { user: null };

	componentDidUpdate(prevProps) {
		// Only re-fetch when userId prop actually changes
		if (prevProps.userId !== this.props.userId) {
			fetch(`/api/users/${this.props.userId}`)
				.then((r) => r.json())
				.then((user) => this.setState({ user }));
		}
	}

	render() {
		const { user } = this.state;
		return user ? <p>{user.name}</p> : <p>Loading...</p>;
	}
}
```

---

## Phase 3 — Unmounting

The component is removed from the DOM.

```
  Parent removes component from the tree
       │
       ▼
  componentWillUnmount()   ← clean up everything you set up in componentDidMount
       │
       ▼
  [React removes DOM node]
```

### `componentWillUnmount()`

**What:** Called once, immediately before the component is destroyed. The DOM is still present but will be removed right after.

**When to use:** Cancel timers, clear intervals, unsubscribe from WebSockets, remove DOM event listeners, cancel pending API calls.

**What NOT to do:** Don't call `setState` here — the component is about to be destroyed.

```jsx
class Ticker extends React.Component {
	state = { time: new Date() };

	componentDidMount() {
		this.timerId = setInterval(() => this.setState({ time: new Date() }), 1000);
	}

	componentWillUnmount() {
		clearInterval(this.timerId); // prevent memory leak
	}

	render() {
		return <p>{this.state.time.toLocaleTimeString()}</p>;
	}
}
```

---

## Phase 4 — Error Handling

Catches JavaScript errors anywhere in the child component tree.

```
  Child throws during render / lifecycle
       │
       ▼
  static getDerivedStateFromError(error)   ← update state to show fallback UI
       │
       ▼
  render()  ← renders the fallback UI
       │
       ▼
  componentDidCatch(error, info)           ← log the error to a service
```

### `static getDerivedStateFromError(error)`

Called during rendering after a descendant throws. Return a state update to display a fallback UI. Must not have side effects.

### `componentDidCatch(error, info)`

Called after the error is committed to the DOM. Use this for logging to an error service.

```jsx
class ErrorBoundary extends React.Component {
	state = { hasError: false, errorMessage: '' };

	static getDerivedStateFromError(error) {
		return { hasError: true, errorMessage: error.message };
	}

	componentDidCatch(error, info) {
		// Log to Sentry, Datadog, etc.
		console.error('Caught by ErrorBoundary:', error, info.componentStack);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div style={{ padding: 16, background: '#fee', color: '#c00' }}>
					<h2>Something went wrong</h2>
					<p>{this.state.errorMessage}</p>
					<button onClick={() => this.setState({ hasError: false })}>Try again</button>
				</div>
			);
		}

		return this.props.children;
	}
}

// Usage — wraps any subtree
<ErrorBoundary>
	<PaymentFlow />
</ErrorBoundary>;
```

---

## Hook Equivalents (Function Components)

Error boundaries still require class components, but everything else maps to hooks.

```
┌─────────────────────────────────────┬──────────────────────────────────────────┐
│  Class Lifecycle Method             │  Hooks Equivalent                        │
├─────────────────────────────────────┼──────────────────────────────────────────┤
│ constructor                         │ useState / useReducer initializer        │
│ static getDerivedStateFromProps     │ Compute inline during render             │
│ render                              │ The function body itself                 │
│ componentDidMount                   │ useEffect(() => { ... }, [])             │
│ shouldComponentUpdate               │ React.memo / useMemo                     │
│ getSnapshotBeforeUpdate             │ useLayoutEffect (partial)                │
│ componentDidUpdate                  │ useEffect(() => { ... }, [dep])          │
│ componentWillUnmount                │ useEffect(() => { return cleanup }, [])  │
│ static getDerivedStateFromError     │ ❌ No hook — must use class component     │
│ componentDidCatch                   │ ❌ No hook — must use class component     │
└─────────────────────────────────────┴──────────────────────────────────────────┘
```

### The three `useEffect` patterns

```jsx
// 1. componentDidMount equivalent — runs once after mount
useEffect(() => {
	fetchData();
}, []);

// 2. componentDidUpdate equivalent — runs when dep changes
useEffect(() => {
	fetchUser(userId);
}, [userId]);

// 3. componentWillUnmount equivalent — return a cleanup function
useEffect(() => {
	const id = setInterval(tick, 1000);
	return () => clearInterval(id); // cleanup = unmount
}, []);

// 4. All three combined — mount + update + unmount
useEffect(() => {
	const subscription = subscribe(topic);
	return () => subscription.unsubscribe();
}, [topic]); // re-subscribes when topic changes, cleans up old subscription first
```

---

## Complete Timeline Visualization

```
NEW COMPONENT CREATED
        │
        ▼
┌──────────────────────────────────┐
│           MOUNTING               │
│                                  │
│  1. constructor()                │
│     └─ initialize state          │
│                                  │
│  2. getDerivedStateFromProps()   │
│     └─ sync state from props     │
│                                  │
│  3. render()                     │
│     └─ returns JSX               │
│                                  │
│  4. [DOM is updated]             │
│                                  │
│  5. componentDidMount()          │
│     └─ fetch data                │
│     └─ set up subscriptions      │
│     └─ set up timers             │
└──────────────┬───────────────────┘
               │
    props or setState called
               │
               ▼
┌──────────────────────────────────┐
│           UPDATING               │
│  (repeats for every change)      │
│                                  │
│  1. getDerivedStateFromProps()   │
│                                  │
│  2. shouldComponentUpdate()      │
│     └─ false → skip render ──┐   │
│     └─ true  → continue      │   │
│                              │   │
│  3. render()          ◄──────┘   │
│                                  │
│  4. getSnapshotBeforeUpdate()    │
│     └─ capture scroll position  │
│                                  │
│  5. [DOM is updated]             │
│                                  │
│  6. componentDidUpdate()         │
│     └─ fetch if prop changed     │
│     └─ update third-party lib    │
└──────────────┬───────────────────┘
               │
   Component removed from tree
               │
               ▼
┌──────────────────────────────────┐
│          UNMOUNTING              │
│                                  │
│  1. componentWillUnmount()       │
│     └─ clear timers              │
│     └─ unsubscribe               │
│     └─ cancel fetch              │
│                                  │
│  2. [DOM node removed]           │
└──────────────────────────────────┘

─── If any render/lifecycle throws ───

┌──────────────────────────────────┐
│        ERROR HANDLING            │
│                                  │
│  1. getDerivedStateFromError()   │
│     └─ set hasError = true       │
│                                  │
│  2. render() → shows fallback    │
│                                  │
│  3. componentDidCatch()          │
│     └─ log to Sentry / Datadog   │
└──────────────────────────────────┘
```

---

## Deprecated Methods (Do Not Use)

These were removed or renamed in React 17+ due to incompatibility with concurrent rendering:

| Old method                  | Problem                                      | Replacement                              |
| --------------------------- | -------------------------------------------- | ---------------------------------------- |
| `componentWillMount`        | Runs twice in Strict Mode, unsafe with async | `constructor` or `useEffect`             |
| `componentWillReceiveProps` | Easy to write infinite loops                 | `getDerivedStateFromProps` or `key` prop |
| `componentWillUpdate`       | Unsafe with concurrent features              | `getSnapshotBeforeUpdate`                |

They were prefixed with `UNSAFE_` in React 16.3 (`UNSAFE_componentWillMount` etc.) and should not appear in new code.

---

## Q&A

**Q: What is the order of lifecycle methods when a component first renders?**
`constructor` → `getDerivedStateFromProps` → `render` → DOM update → `componentDidMount`.

**Q: Why can't you call `setState` in `render`?**
`setState` triggers another render, which would call `render` again, triggering another `setState` — an infinite loop. `render` must be a pure function.

**Q: What is the difference between `componentDidMount` and `componentDidUpdate`?**
`componentDidMount` runs only once, after the first render. `componentDidUpdate` runs after every subsequent re-render. Both have access to the DOM.

**Q: How do you prevent infinite loops in `componentDidUpdate`?**
Always wrap `setState` calls in a condition that compares `prevProps` or `prevState` to the current values.

```jsx
componentDidUpdate(prevProps) {
  if (prevProps.id !== this.props.id) { // guard
    this.fetchData(this.props.id);
  }
}
```

**Q: Why does `componentWillUnmount` exist? What happens if you skip it?**
Without cleanup, you get memory leaks. Event listeners pile up, timers keep firing, and WebSocket handlers try to call `setState` on an unmounted component — React warns about this and it can cause subtle bugs.

**Q: What is `getSnapshotBeforeUpdate` used for?**
Capturing a value from the DOM (like scroll position) right before React applies the new update. The return value is passed to `componentDidUpdate` so you can use the before-and-after values together. Classic use case: keeping a chat window's scroll position stable when new messages arrive at the top.

**Q: Can you use hooks to replace error boundaries?**
No. As of React 19, `getDerivedStateFromError` and `componentDidCatch` have no hook equivalents. Error boundaries must be class components. Libraries like `react-error-boundary` wrap the class pattern in a reusable component so you don't have to write the class yourself.

**Q: What does `shouldComponentUpdate` do and when should you use it?**
It lets you return `false` to skip a re-render. Use it when a component receives new props/state that you know won't change the output. Modern shortcut: `React.PureComponent` does a shallow comparison automatically. In function components, `React.memo` is the equivalent.

**Q: What is `React.PureComponent` and how does it relate to lifecycle methods?**
It is a base class that auto-implements `shouldComponentUpdate` with a shallow comparison of props and state. If none of the top-level values changed, the render is skipped.

**Q: What happens to lifecycle methods in React 18 Strict Mode (development only)?**
React intentionally double-invokes `constructor`, `render`, and `getDerivedStateFromProps` to help detect side effects. `componentDidMount` is also called, then `componentWillUnmount`, then `componentDidMount` again — simulating a remount. This is development-only behavior to surface bugs early.

**Q: How does the hook `useEffect` with `[]` differ from `componentDidMount`?**
They behave the same in most cases. One difference: in Strict Mode (development), React 18 runs `useEffect` cleanup + setup twice on mount (simulating unmount/remount), while `componentDidMount` is also double-fired. In production, both run once.

**Q: What is `getDerivedStateFromError` vs `componentDidCatch`?**
`getDerivedStateFromError` is called during rendering (synchronously) and is used to update state to show a fallback UI. `componentDidCatch` is called after the DOM is committed (asynchronously) and is used for logging side effects. You almost always need both: one to show the fallback, one to report the error.
