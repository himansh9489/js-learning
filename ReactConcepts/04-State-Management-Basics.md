# State Management — State, Props, Prop Drilling & Context

---

## Mental Model: Where Does Data Live?

```
┌─────────────────────────────────────────────────────────────────────┐
│                     DATA OWNERSHIP SPECTRUM                         │
│                                                                     │
│  Local State          Lifted State       Context      Redux/Zustand │
│  (one component)      (shared parent)    (subtree)    (entire app)  │
│                                                                     │
│  useState/            useState in        createContext  Redux        │
│  useReducer           parent             + Provider    Zustand       │
│                                                                     │
│  ◄──────────────────────────────────────────────────────────────►  │
│  Simple                                                   Complex   │
└─────────────────────────────────────────────────────────────────────┘
```

**Rule of thumb:** Start local. Lift only when you have to. Reach for Context only for app-level shared values. Use Redux/Zustand when you have complex, frequently-updated, cross-feature global state.

---

## 1. State

### What

State is **mutable data owned by a component**. When it changes, React re-renders that component (and its children).

### Why

The UI is a function of state: `UI = f(state)`. State is what makes React components dynamic — without it, every component would render the same output forever.

### When to use local state

- Toggle open/closed (modal, dropdown, accordion)
- Form field values before submission
- Pagination index, active tab
- Loading / error flags that only one component cares about
- Any value that only this component and its direct children need

### Where it lives

In the component that directly uses it. If a sibling also needs it → lift to their common parent.

```jsx
// Local state — only this component owns the count
function Counter() {
	const [count, setCount] = useState(0);

	return (
		<div>
			<p>Count: {count}</p>
			<button onClick={() => setCount((c) => c + 1)}>+</button>
			<button onClick={() => setCount((c) => c - 1)}>-</button>
			<button onClick={() => setCount(0)}>Reset</button>
		</div>
	);
}
```

### State is asynchronous

`setState` does not update the value immediately. Reads on the next line still see the old value.

```jsx
function BugExample() {
	const [count, setCount] = useState(0);

	const handleClick = () => {
		setCount(count + 1);
		console.log(count); // ❌ still 0 — state hasn't updated yet

		// ✅ Use functional updater when next value depends on previous
		setCount((prev) => prev + 1);
	};
}
```

### Never mutate state directly

```jsx
// ❌ WRONG — React doesn't detect mutation, no re-render
const [items, setItems] = useState([1, 2, 3]);
items.push(4); // mutation!

// ✅ CORRECT — return a new array
setItems((prev) => [...prev, 4]);

// ❌ WRONG — mutating a nested object
const [user, setUser] = useState({ name: 'Alice', address: { city: 'Delhi' } });
user.address.city = 'Mumbai'; // mutation!

// ✅ CORRECT — spread at every level
setUser((prev) => ({ ...prev, address: { ...prev.address, city: 'Mumbai' } }));
```

---

## 2. Props

### What

Props are **read-only inputs** passed from a parent component to a child. A child can never modify its own props.

### Why

Props are how components communicate downward. They make components **reusable** — the same `Button` component can render different text, colors, and click handlers based on what the parent passes.

### When to use

- Any data a component needs that it did not create itself
- Event callbacks (`onClick`, `onChange`, `onSubmit`) passed from parent to child
- Configuration values (variant, size, disabled)

```jsx
// Parent owns the state; child just displays and calls back
function ProductCard({ name, price, onAddToCart }) {
	return (
		<div className="card">
			<h3>{name}</h3>
			<p>₹{price}</p>
			<button onClick={() => onAddToCart({ name, price })}>Add to Cart</button>
		</div>
	);
}

function Shop() {
	const [cart, setCart] = useState([]);

	const handleAddToCart = (item) => setCart((prev) => [...prev, item]);

	return (
		<div>
			<ProductCard name="Gold Ring" price={5000} onAddToCart={handleAddToCart} />
			<ProductCard name="Gold Chain" price={12000} onAddToCart={handleAddToCart} />
			<p>Cart has {cart.length} items</p>
		</div>
	);
}
```

### Props vs State comparison

```
┌───────────────────────┬──────────────────────┬──────────────────────┐
│                       │       Props          │        State         │
├───────────────────────┼──────────────────────┼──────────────────────┤
│ Who owns it?          │ Parent component     │ The component itself │
│ Mutable?              │ No (read-only)       │ Yes (via setter)     │
│ Can change over time? │ Yes (parent updates) │ Yes (setState)       │
│ Triggers re-render?   │ Yes, when parent     │ Yes, when changed    │
│                       │ re-renders with new  │ via setter           │
│                       │ value                │                      │
└───────────────────────┴──────────────────────┴──────────────────────┘
```

---

## 3. One-Way Data Flow

React data flows in **one direction only: parent → child**.

```
         App (owns state)
          │
          │  props
          ▼
       Header
          │
          │  props
          ▼
       NavBar
          │
          │  props
          ▼
       NavItem
```

Children cannot push data back up — they call **callback functions** passed as props. This makes the flow predictable and debuggable.

```jsx
// Child calls a callback to "send data up"
function ChildInput({ onValueChange }) {
	return <input onChange={(e) => onValueChange(e.target.value)} />;
}

function Parent() {
	const [value, setValue] = useState('');
	return (
		<>
			<ChildInput onValueChange={setValue} />
			<p>Parent sees: {value}</p>
		</>
	);
}
```

---

## 4. Prop Drilling

### What

Passing props through **intermediate components that don't use them** just to reach a deeply nested component that does.

### Why it is a problem

```
App (owns `user`)
 └── Layout  ← doesn't use `user`, but passes it down
      └── Sidebar  ← doesn't use `user`, but passes it down
           └── UserAvatar  ← ACTUALLY uses `user`
```

Every intermediate component is now **coupled** to the `user` shape — even though it doesn't care about it. Rename a field in `user` and you have to update three files.

### Practical example of the problem

```jsx
// App.jsx — owns the user
function App() {
	const [user] = useState({ name: 'Alice', avatar: '/alice.jpg' });
	return <Layout user={user} />;
}

// Layout.jsx — doesn't use user, just passes it through
function Layout({ user }) {
	return (
		<div>
			<Sidebar user={user} /> {/* drilling */}
			<main>...</main>
		</div>
	);
}

// Sidebar.jsx — doesn't use user, just passes it through
function Sidebar({ user }) {
	return (
		<nav>
			<UserAvatar user={user} /> {/* drilling */}
		</nav>
	);
}

// UserAvatar.jsx — FINALLY uses user
function UserAvatar({ user }) {
	return <img src={user.avatar} alt={user.name} />;
}
```

### Signs you have a prop drilling problem

- A prop passes through 3+ components before being used
- Intermediate components have props they never reference in their JSX
- Adding a new field to the data model means updating 4+ files

---

## 5. Lifting State Up

Before reaching for Context, try **lifting state** — moving state to the closest common ancestor of the components that need it.

```jsx
// ❌ Before — two components each manage their own temperature
function Celsius() {
	const [temp, setTemp] = useState(0);
	return <input value={temp} onChange={(e) => setTemp(e.target.value)} />;
}

function Fahrenheit() {
	const [temp, setTemp] = useState(32); // out of sync with Celsius!
	return <p>{temp}°F</p>;
}

// ✅ After — lift to parent, keep one source of truth
function TemperatureConverter() {
	const [celsius, setCelsius] = useState(0);
	const fahrenheit = (celsius * 9) / 5 + 32;

	return (
		<div>
			<input value={celsius} onChange={(e) => setCelsius(Number(e.target.value))} placeholder="Celsius" />
			<p>{fahrenheit}°F</p>
		</div>
	);
}
```

---

## 6. React Context

### What

Context provides a way to **share a value across the entire component tree** without passing it through props at every level.

```
Context.Provider (value lives here)
 └── Any component in the tree
      └── Any component in the tree
           └── useContext(MyContext)  ← reads value directly
```

### When to use

- Current authenticated user
- Theme (dark/light mode)
- Locale / i18n language setting
- Feature flags
- Any app-wide configuration that changes rarely

### When NOT to use

- Frequently changing data (every keystroke, every second) — every consumer re-renders on every change
- Data needed by only 1–2 components — just lift state or prop-pass
- Complex cross-feature state — use Redux/Zustand

### How to create and use Context

```jsx
// 1. Create — give it a sensible default for testing outside a provider
const AuthContext = React.createContext(null);

// 2. Provide — wrap the subtree that needs access
function App() {
	const [user, setUser] = useState(null);

	const login = (credentials) => {
		// ... call API ...
		setUser({ name: 'Alice', role: 'admin' });
	};

	const logout = () => setUser(null);

	return (
		<AuthContext.Provider value={{ user, login, logout }}>
			<Router />
		</AuthContext.Provider>
	);
}

// 3. Custom hook — wrap useContext so consumers don't import the context object
function useAuth() {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error('useAuth must be used inside AuthContext.Provider');
	return ctx;
}

// 4. Consume anywhere in the tree — no prop drilling
function ProfileButton() {
	const { user, logout } = useAuth();
	if (!user) return null;
	return (
		<div>
			<span>Hi, {user.name}</span>
			<button onClick={logout}>Logout</button>
		</div>
	);
}
```

### Memoize the context value

Without memoization, a new object is created on every render of the Provider, causing **all consumers to re-render** even if nothing changed.

```jsx
// ❌ New object on every render — all consumers re-render
<AuthContext.Provider value={{ user, login, logout }}>

// ✅ Memoized — consumers only re-render when user changes
function App() {
  const [user, setUser] = useState(null);

  const login = useCallback((credentials) => { /* ... */ }, []);
  const logout = useCallback(() => setUser(null), []);

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout]);

  return (
    <AuthContext.Provider value={value}>
      <Router />
    </AuthContext.Provider>
  );
}
```

### Split large contexts

One big context re-renders everything. Split by update frequency.

```jsx
// ❌ One context — a theme change re-renders components that only care about user
const AppContext = createContext({ user, theme, language, featureFlags });

// ✅ Separate contexts — each consumer only re-renders for what it subscribed to
const UserContext = createContext(null);
const ThemeContext = createContext('light');
const LocaleContext = createContext('en');
```

---

## Full Example — Context Replacing Prop Drilling

```jsx
// ThemeContext.jsx
const ThemeContext = createContext('light');

export function ThemeProvider({ children }) {
	const [theme, setTheme] = useState('light');
	const toggle = useCallback(() => setTheme((t) => (t === 'light' ? 'dark' : 'light')), []);
	const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
	return useContext(ThemeContext);
}

// App.jsx
function App() {
	return (
		<ThemeProvider>
			<Page />
		</ThemeProvider>
	);
}

// Page.jsx — no longer needs to know about theme at all
function Page() {
	return (
		<main>
			<Sidebar />
			<Content />
		</main>
	);
}

// DeepButton.jsx — reads theme directly, no drilling
function DeepButton() {
	const { theme, toggle } = useTheme();
	return (
		<button
			style={{ background: theme === 'dark' ? '#333' : '#fff', color: theme === 'dark' ? '#fff' : '#333' }}
			onClick={toggle}>
			Switch to {theme === 'dark' ? 'light' : 'dark'} mode
		</button>
	);
}
```

---

## Decision Tree

```
Need to share data between components?
          │
          ▼
Is it used by only 1 component?
    YES → keep it as local state (useState)
    NO  ↓

Is it used by a parent + 1-2 direct children?
    YES → lift state to the common parent
    NO  ↓

Is it app-wide but changes rarely (theme, auth, locale)?
    YES → React Context
    NO  ↓

Is it complex, frequently-updated, or cross-feature?
    YES → Redux / Zustand / Jotai
```

---

## State Management Options Compared

```
┌───────────────┬──────────────┬────────────────┬────────────────────┐
│               │ Local State  │ Context        │ Redux / Zustand    │
├───────────────┼──────────────┼────────────────┼────────────────────┤
│ Scope         │ One component│ Subtree        │ Entire app         │
│ Setup cost    │ Zero         │ Low            │ Medium–High        │
│ Boilerplate   │ None         │ Low            │ Medium (RTK low)   │
│ DevTools      │ Basic        │ React DevTools │ Redux DevTools     │
│ Re-render ctrl│ Natural      │ Manual memo    │ Selector-based     │
│ Best for      │ UI-only state│ Theme/auth/i18n│ Complex domain data│
│ Time-travel   │ No           │ No             │ Yes (Redux)        │
└───────────────┴──────────────┴────────────────┴────────────────────┘
```

---

## Q&A

**Q: What is the difference between state and props?**
State is data a component owns and can change. Props are data passed in from a parent — they are read-only inside the child. Think of state as a component's internal memory and props as the parameters of a function call.

**Q: Can a child component modify its own props?**
No. Props are read-only. If a child needs to trigger a change in the parent's data, the parent must pass down a callback function as a prop, and the child calls it.

**Q: What is prop drilling and why is it bad?**
Prop drilling is passing a prop through intermediate components that don't use it, just to reach a deeply nested consumer. It is bad because: (1) intermediate components get unnecessarily coupled to data they don't need, (2) adding or renaming a field requires updating every component in the chain, (3) it makes refactoring harder.

**Q: When should you lift state up?**
When two sibling components need to share or stay in sync on the same piece of data. Move the state to their closest common ancestor and pass it down as props.

**Q: When should you use Context instead of props?**
When the same data is needed by many components at different nesting levels and passing it through props would require drilling through many intermediary components. Classic examples: current user, theme, locale.

**Q: What is the performance problem with Context?**
Every component that calls `useContext(MyContext)` re-renders whenever the context _value_ changes. If the value is an object created inline in the Provider (`value={{ a, b }}`), a new object reference is created on every render, triggering all consumers to re-render even if `a` and `b` haven't changed. Fix: `useMemo` the value object.

**Q: Should you use Context for everything to avoid prop drilling?**
No. Context has a cost (re-renders on change, harder to trace data flow). Use props for data that 1–2 components need. Only use Context when the data is genuinely shared across many distant components.

**Q: What is the difference between Context and Redux?**
Context is built into React and is ideal for low-frequency global values (theme, auth). Redux is an external library with a strict unidirectional data flow, a central store, time-travel debugging, and middleware support. Redux is better for complex state with many actors, frequent updates, or when you need traceability and DevTools. Context re-renders all consumers on every change; Redux lets components subscribe to only the slice they need.

**Q: Can you use `useReducer` + Context as a Redux replacement?**
For small apps, yes. But for large apps this can become difficult to manage — no middleware, no DevTools, manual performance optimization required. Redux Toolkit has removed most of Redux's boilerplate, making it the better choice at scale.

**Q: Why do you need a custom hook wrapping `useContext`?**
Three reasons: (1) consumers don't need to import both `useContext` and the context object — just the hook, (2) you can throw a helpful error if the hook is used outside the Provider, (3) the hook is a better abstraction boundary — you can swap the implementation (e.g., move from Context to Zustand) without changing any consumer.

**Q: What causes an infinite re-render loop with Context?**
Passing an unstable value reference to the Provider — e.g., creating a new object or array literal directly in the `value` prop. React sees a new reference on every render, triggers all consumers, which may trigger their own state updates, looping back to the Provider render. Fix: `useMemo` + `useCallback`.

**Q: How is state different from a regular JavaScript variable inside a component?**
A regular variable is reset on every render — its value is lost between renders. State persists across renders. Also, changing a regular variable doesn't tell React to re-render; calling the state setter does.
