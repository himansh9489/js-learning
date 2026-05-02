# Redux and Zustand

---

## Why External State Libraries?

React's built-in tools (`useState`, `useReducer`, Context) work well for local and low-frequency shared state. They break down when:

- Many unrelated components need the **same piece of state**
- State updates happen **frequently** and Context's re-render-all-consumers behaviour becomes a bottleneck
- You need **time-travel debugging**, action logs, or strict audit trails
- Multiple developers need a **predictable, enforced pattern** for state mutations

External libraries solve these by providing a **single store** outside the React tree that components subscribe to selectively.

```
┌───────────────────────────────────────────────────────────────────┐
│               WHEN TO USE WHAT                                    │
│                                                                   │
│  useState / useReducer ──── one component's own data             │
│  Lift state ────────────── 2-3 closely related components        │
│  Context ───────────────── low-frequency app-wide values         │
│                             (theme, auth, locale)                │
│  Redux / Zustand ───────── complex, frequently-updated,          │
│                             cross-feature global state           │
└───────────────────────────────────────────────────────────────────┘
```

---

## Part 1 — Redux

---

### What is Redux?

Redux is a **predictable state container** for JavaScript apps. It enforces a strict unidirectional data flow:

```
  ┌──────────┐       dispatch(action)      ┌───────────┐
  │    UI    │ ──────────────────────────► │  Reducer  │
  │(React)   │                             │           │
  │          │ ◄──────────────────────── │  Store    │
  └──────────┘    re-render with new state └───────────┘
```

Three core principles:

1. **Single source of truth** — the entire app state lives in one store object
2. **State is read-only** — the only way to change state is to dispatch an action
3. **Changes are pure functions** — reducers take `(state, action) => newState` with no side effects

---

### Core Concepts

#### Action

A plain object describing **what happened**. Must have a `type` field.

```js
{ type: 'counter/increment' }
{ type: 'cart/addItem', payload: { id: 1, name: 'Gold Ring', price: 5000 } }
```

#### Reducer

A **pure function** that takes the current state and an action and returns the next state.

```js
function cartReducer(state = [], action) {
	switch (action.type) {
		case 'cart/addItem':
			return [...state, action.payload];
		case 'cart/removeItem':
			return state.filter((item) => item.id !== action.payload.id);
		default:
			return state;
	}
}
```

#### Store

Holds the state tree. You subscribe to it and dispatch actions to it.

#### Selector

A function that extracts a piece of state from the store.

```js
const selectCartItems = (state) => state.cart.items;
const selectCartTotal = (state) => state.cart.items.reduce((sum, i) => sum + i.price, 0);
```

---

### Redux Toolkit (RTK) — Modern Redux

Vanilla Redux required enormous boilerplate. **RTK is the official, recommended way** to write Redux today. It wraps Redux with:

- `createSlice` — generates action creators + reducer in one call
- `configureStore` — sets up the store with DevTools and middleware automatically
- `createAsyncThunk` — standardizes async (API call) patterns
- `RTK Query` — full data-fetching + caching layer (optional)

---

### Practical Example — Shopping Cart with RTK

**1. Create a slice**

```js
// store/cartSlice.js
import { createSlice } from '@reduxjs/toolkit';

const cartSlice = createSlice({
	name: 'cart',
	initialState: {
		items: [],
		isOpen: false,
	},
	reducers: {
		addItem(state, action) {
			// RTK uses Immer internally — you can "mutate" draft state directly
			const existing = state.items.find((i) => i.id === action.payload.id);
			if (existing) {
				existing.qty += 1;
			} else {
				state.items.push({ ...action.payload, qty: 1 });
			}
		},
		removeItem(state, action) {
			state.items = state.items.filter((i) => i.id !== action.payload);
		},
		clearCart(state) {
			state.items = [];
		},
		toggleCart(state) {
			state.isOpen = !state.isOpen;
		},
	},
});

// RTK auto-generates action creators from reducer names
export const { addItem, removeItem, clearCart, toggleCart } = cartSlice.actions;

// Selector functions
export const selectCartItems = (state) => state.cart.items;
export const selectCartCount = (state) => state.cart.items.reduce((n, i) => n + i.qty, 0);
export const selectCartTotal = (state) => state.cart.items.reduce((s, i) => s + i.price * i.qty, 0);
export const selectCartIsOpen = (state) => state.cart.isOpen;

export default cartSlice.reducer;
```

**2. Configure the store**

```js
// store/index.js
import { configureStore } from '@reduxjs/toolkit';

import cartReducer from './cartSlice';
import userReducer from './userSlice';

export const store = configureStore({
	reducer: {
		cart: cartReducer,
		user: userReducer,
	},
	// Redux DevTools Extension enabled automatically in development
});
```

**3. Provide the store**

```jsx
// main.jsx
import { Provider } from 'react-redux';

import { store } from './store';

ReactDOM.createRoot(document.getElementById('root')).render(
	<Provider store={store}>
		<App />
	</Provider>,
);
```

**4. Use in components**

```jsx
// CartIcon.jsx
import { useSelector, useDispatch } from 'react-redux';
import { selectCartCount, toggleCart } from './store/cartSlice';

function CartIcon() {
  const count    = useSelector(selectCartCount);
  const dispatch = useDispatch();

  return (
    <button onClick={() => dispatch(toggleCart())}>
      🛒 {count}
    </button>
  );
}

// ProductCard.jsx
import { useDispatch } from 'react-redux';
import { addItem } from './store/cartSlice';

function ProductCard({ product }) {
  const dispatch = useDispatch();

  return (
    <div>
      <h3>{product.name}</h3>
      <p>₹{product.price}</p>
      <button onClick={() => dispatch(addItem(product))}>Add to Cart</button>
    </div>
  );
}

// CartSidebar.jsx
import { useSelector, useDispatch } from 'react-redux';
import { selectCartItems, selectCartTotal, removeItem, clearCart } from './store/cartSlice';

function CartSidebar() {
  const items    = useSelector(selectCartItems);
  const total    = useSelector(selectCartTotal);
  const dispatch = useDispatch();

  return (
    <aside>
      <ul>
        {items.map(item => (
          <li key={item.id}>
            {item.name} × {item.qty}
            <button onClick={() => dispatch(removeItem(item.id))}>Remove</button>
          </li>
        ))}
      </ul>
      <p>Total: ₹{total}</p>
      <button onClick={() => dispatch(clearCart())}>Clear</button>
    </aside>
  );
}
```

---

### Async Actions with `createAsyncThunk`

API calls don't belong inside reducers (reducers must be pure). `createAsyncThunk` wraps an async function and auto-dispatches `pending`, `fulfilled`, and `rejected` actions.

```js
// store/productsSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

// 1. Define the async thunk
export const fetchProducts = createAsyncThunk('products/fetch', async (category, { rejectWithValue }) => {
	try {
		const res = await fetch(`/api/products?category=${category}`);
		if (!res.ok) throw new Error('Failed to fetch');
		return await res.json();
	} catch (err) {
		return rejectWithValue(err.message);
	}
});

// 2. Handle the three lifecycle actions in extraReducers
const productsSlice = createSlice({
	name: 'products',
	initialState: { items: [], status: 'idle', error: null },
	reducers: {},
	extraReducers: (builder) => {
		builder
			.addCase(fetchProducts.pending, (state) => {
				state.status = 'loading';
				state.error = null;
			})
			.addCase(fetchProducts.fulfilled, (state, action) => {
				state.status = 'succeeded';
				state.items = action.payload;
			})
			.addCase(fetchProducts.rejected, (state, action) => {
				state.status = 'failed';
				state.error = action.payload;
			});
	},
});

export const selectProducts = (state) => state.products.items;
export const selectProductStatus = (state) => state.products.status;
export const selectProductError = (state) => state.products.error;

export default productsSlice.reducer;
```

```jsx
// ProductList.jsx
function ProductList({ category }) {
	const dispatch = useDispatch();
	const products = useSelector(selectProducts);
	const status = useSelector(selectProductStatus);
	const error = useSelector(selectProductError);

	useEffect(() => {
		dispatch(fetchProducts(category));
	}, [dispatch, category]);

	if (status === 'loading') return <Spinner />;
	if (status === 'failed') return <p>Error: {error}</p>;

	return (
		<ul>
			{products.map((p) => (
				<ProductCard key={p.id} product={p} />
			))}
		</ul>
	);
}
```

---

### Redux Data Flow Visualization

```
  User clicks "Add to Cart"
           │
           ▼
  dispatch(addItem({ id: 1, name: 'Ring', price: 5000 }))
           │
           ▼
  ┌─────────────────────────────┐
  │         Redux Store         │
  │                             │
  │  Action reaches reducer:    │
  │  cartReducer(state, action) │
  │  → returns new state        │
  └──────────────┬──────────────┘
                 │ store.subscribe() notifies
                 ▼
  ┌─────────────────────────────┐
  │  useSelector(selectCartCount)│
  │  → new value: 1             │
  └──────────────┬──────────────┘
                 │
                 ▼
  CartIcon re-renders → shows "🛒 1"
```

---

## Part 2 — Zustand

---

### What is Zustand?

Zustand ("state" in German) is a **minimal, hook-based state library**. Instead of actions, reducers, and a provider, you define a store as a single hook using `create()`.

```
  useStore() ← reads state + gets setters in one call
```

No Provider needed. No boilerplate. The store lives outside React.

---

### Practical Example — Same Cart, Zustand Style

```js
// store/useCartStore.js
import { create } from 'zustand';

const useCartStore = create((set, get) => ({
	items: [],
	isOpen: false,

	addItem: (product) =>
		set((state) => {
			const existing = state.items.find((i) => i.id === product.id);
			if (existing) {
				return {
					items: state.items.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i)),
				};
			}
			return { items: [...state.items, { ...product, qty: 1 }] };
		}),

	removeItem: (id) =>
		set((state) => ({
			items: state.items.filter((i) => i.id !== id),
		})),

	clearCart: () => set({ items: [] }),

	toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),

	// Derived values as getters
	getTotal: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),
	getCount: () => get().items.reduce((n, i) => n + i.qty, 0),
}));

export default useCartStore;
```

```jsx
// CartIcon.jsx — subscribes to only the count
function CartIcon() {
	const count = useCartStore((state) => state.getCount());
	const toggleCart = useCartStore((state) => state.toggleCart);

	return <button onClick={toggleCart}>🛒 {count}</button>;
}

// ProductCard.jsx
function ProductCard({ product }) {
	const addItem = useCartStore((state) => state.addItem);
	return (
		<div>
			<h3>{product.name}</h3>
			<button onClick={() => addItem(product)}>Add to Cart</button>
		</div>
	);
}

// CartSidebar.jsx
function CartSidebar() {
	const items = useCartStore((state) => state.items);
	const getTotal = useCartStore((state) => state.getTotal);
	const removeItem = useCartStore((state) => state.removeItem);
	const clearCart = useCartStore((state) => state.clearCart);

	return (
		<aside>
			{items.map((item) => (
				<div key={item.id}>
					{item.name} × {item.qty}
					<button onClick={() => removeItem(item.id)}>Remove</button>
				</div>
			))}
			<p>Total: ₹{getTotal()}</p>
			<button onClick={clearCart}>Clear</button>
		</aside>
	);
}
```

No `Provider`. No `configureStore`. No `dispatch`. The store is ready to use anywhere.

---

### Zustand with Async

```js
const useProductStore = create((set) => ({
	products: [],
	status: 'idle',
	error: null,

	fetchProducts: async (category) => {
		set({ status: 'loading', error: null });
		try {
			const res = await fetch(`/api/products?category=${category}`);
			const data = await res.json();
			set({ products: data, status: 'succeeded' });
		} catch (err) {
			set({ status: 'failed', error: err.message });
		}
	},
}));

// Usage
function ProductList({ category }) {
	const { products, status, error, fetchProducts } = useProductStore();

	useEffect(() => {
		fetchProducts(category);
	}, [category]);

	if (status === 'loading') return <Spinner />;
	if (status === 'failed') return <p>{error}</p>;
	return (
		<ul>
			{products.map((p) => (
				<li key={p.id}>{p.name}</li>
			))}
		</ul>
	);
}
```

---

### Zustand Subscriptions — Preventing Unnecessary Re-renders

**Critical:** Always select a specific slice, not the whole store.

```jsx
// ❌ Subscribes to entire store — re-renders on ANY state change
const store = useCartStore();

// ✅ Subscribes only to items — re-renders only when items change
const items = useCartStore((state) => state.items);
```

---

## Redux vs Zustand — Full Comparison

```
┌────────────────────────┬────────────────────────┬────────────────────────┐
│ Dimension              │ Redux (RTK)             │ Zustand                │
├────────────────────────┼────────────────────────┼────────────────────────┤
│ Boilerplate            │ Medium (RTK reduces it) │ Minimal                │
│ Mental model           │ Action → Reducer →      │ Store = state +        │
│                        │ Store → UI              │ setters, use anywhere  │
│ Provider required      │ Yes (<Provider>)        │ No                     │
│ DevTools               │ Redux DevTools (excellent│ Zustand DevTools (good)│
│ Time-travel debugging  │ Yes                     │ Partial (with middleware│
│ Middleware             │ Built-in (thunk, saga)  │ Manual / lightweight   │
│ Async pattern          │ createAsyncThunk/RTK Q  │ Async functions in     │
│                        │                         │ store directly         │
│ Re-render control      │ useSelector with        │ Selector function in   │
│                        │ selector functions      │ useStore(state => ...)  │
│ TypeScript             │ Excellent               │ Excellent              │
│ Bundle size            │ ~45 KB (RTK)            │ ~3 KB                  │
│ Best for               │ Large apps, strict      │ Small–medium apps,     │
│                        │ patterns, big teams     │ fast setup, feature    │
│                        │                         │ stores                 │
└────────────────────────┴────────────────────────┴────────────────────────┘
```

---

## Immer — Why RTK "Mutation" Is Safe

RTK uses **Immer** internally. Inside `createSlice` reducers, you appear to mutate state directly, but Immer intercepts these mutations and produces a new immutable state object. You never actually mutate the real state.

```js
// Looks like mutation — but it's safe because of Immer
addItem(state, action) {
  state.items.push(action.payload); // ← Immer draft, not real state
}

// Equivalent immutable version (no Immer):
addItem(state, action) {
  return { ...state, items: [...state.items, action.payload] };
}
```

Outside `createSlice` (vanilla Redux), you must always return new state manually.

---

## Q&A

**Q: What problem does Redux solve that Context doesn't?**
Context re-renders every consumer when the value changes. Redux lets each component subscribe to a specific selector — only that component re-renders when that specific slice of state changes. Redux also adds time-travel debugging, middleware (logging, async), and strict action-based mutation tracing.

**Q: Explain the Redux data flow.**
UI dispatches an action → the action reaches the store → the store calls the root reducer → the reducer computes new state from `(oldState, action)` → the store notifies all subscribers → components using `useSelector` re-render with the new value.

**Q: What is a reducer and why must it be a pure function?**
A reducer takes `(state, action)` and returns the next state. It must be pure (no side effects, no async, no mutations) so that Redux can predict state changes deterministically — which is what enables time-travel debugging and action replay.

**Q: What is the difference between `useSelector` and `useStore`?**
`useSelector` accepts a selector function and returns only the selected slice. The component re-renders only when that slice changes. `useStore` returns the entire store object — subscribing components re-render on any state change. Always use `useSelector`.

**Q: What is `createAsyncThunk` and why is it needed?**
Reducers must be pure synchronous functions. `createAsyncThunk` is a utility that wraps an async function and automatically dispatches three actions: `pending` (started), `fulfilled` (succeeded), and `rejected` (failed). You handle these in `extraReducers` to update loading/error/data state.

**Q: What is Immer and how does RTK use it?**
Immer is a library that lets you write seemingly mutating code against a "draft" state and produces a new immutable state object behind the scenes. RTK uses it in `createSlice` reducers so you can write `state.items.push(x)` instead of `return { ...state, items: [...state.items, x] }`.

**Q: When would you choose Zustand over Redux?**
When you want minimal setup with no Provider, small bundle size, and a simpler mental model. Zustand is excellent for small-to-medium apps, feature-isolated stores (e.g., a modal store, a cart store), or projects where a full Redux architecture would be overkill. For large apps with multiple teams, strict patterns, and a need for robust DevTools, Redux is the better choice.

**Q: What is the difference between a Redux action and a Zustand setter?**
A Redux action is a plain object dispatched to the store; reducers interpret it to produce new state. In Zustand, you call setter functions directly — there is no action object, no dispatch, no reducer. Zustand is more like calling a method on a class instance.

**Q: Can Redux and Zustand be used together in the same app?**
Yes. A common pattern is to use Redux for core domain state (user, orders, products) and Zustand for UI-specific isolated state (modal open/closed, a wizard's step state) where Redux's boilerplate isn't justified.

**Q: What is RTK Query?**
RTK Query is a data-fetching and caching tool built into Redux Toolkit. You define API endpoints with `createApi`, and it auto-generates React hooks (`useGetProductsQuery`, `useAddItemMutation`) that handle loading, caching, invalidation, and re-fetching — similar to React Query but integrated directly into the Redux store.

**Q: What is a selector and why should you memoize it?**
A selector is a function that extracts a value from the Redux state. Without memoization, a selector that does a `filter` or `map` returns a new array reference on every call, even if the data didn't change — causing unnecessary re-renders. Use `createSelector` from `reselect` (bundled with RTK) to memoize:

```js
import { createSelector } from '@reduxjs/toolkit';

const selectAllItems = (state) => state.cart.items;
const selectCategory = (_, category) => category;

export const selectItemsByCategory = createSelector(
	[selectAllItems, selectCategory],
	(items, category) => items.filter((i) => i.category === category),
	// Only recomputes when items or category actually changes
);
```

**Q: What is the "single source of truth" principle in Redux?**
The entire application state is stored in a single JavaScript object inside one store. This means any component anywhere in the tree reads from the same state — there is no possibility of two parts of the app holding different versions of the same data. This makes the app predictable, debuggable, and easier to hydrate (e.g., for SSR).
