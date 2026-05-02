# Async Tasks in React

---

## Why Async Handling Is Hard in React

React's rendering model is synchronous — `render()` must return JSX immediately. But real apps constantly deal with asynchronous work: API calls, timers, event streams, and user input. The challenges:

| Challenge              | What Goes Wrong Without Proper Handling                                |
| ---------------------- | ---------------------------------------------------------------------- |
| **Race conditions**    | A slower request resolves after a newer one → stale data shown         |
| **Stale closures**     | A callback captures an old value of state/props → wrong behaviour      |
| **Memory leaks**       | Component unmounts but async work still runs and tries to update state |
| **Error swallowing**   | Unhandled promise rejections fail silently                             |
| **Double-fire in dev** | React 18 Strict Mode mounts components twice — cleanup must be correct |

Mastering async in React means addressing all five.

---

## `useEffect` In Depth

`useEffect` is the primary tool for synchronising React state with the outside world (APIs, timers, subscriptions). It is **not** a lifecycle method — it is a synchronisation mechanism.

### Execution timing

```
render → paint → useEffect runs
```

`useEffect` always runs _after_ the browser has painted. This means the user sees the initial render first. For tasks that must block paint (e.g. DOM measurements), use `useLayoutEffect`.

### Dependency array rules

```tsx
useEffect(() => {
	/* runs after every render */
});

useEffect(() => {
	/* runs once on mount */
}, []);

useEffect(() => {
	/* runs when userId changes */
}, [userId]);

useEffect(() => {
	/* runs when a or b change */
}, [a, b]);
```

**The rule:** every reactive value used inside the effect (state, props, context) must be in the dependency array. The `react-hooks/exhaustive-deps` ESLint rule enforces this.

### Cleanup function

The function returned from `useEffect` is the cleanup. React calls it:

1. Before re-running the effect (dependency changed)
2. When the component unmounts

```tsx
useEffect(() => {
	const subscription = stream.subscribe(handler);

	return () => {
		subscription.unsubscribe(); // cleanup on unmount or dep change
	};
}, [stream]);
```

---

## API Calls Pattern

### The standard async-in-effect pattern

```tsx
// ❌ Wrong — async function directly as the effect callback
useEffect(async () => {
	const data = await fetchGoldPrice(); // React ignores the returned Promise
}, []);

// ✅ Correct — define async function inside, call it immediately
useEffect(() => {
	async function loadGoldPrice() {
		try {
			const data = await fetchGoldPrice();
			setGoldPrice(data);
		} catch (err) {
			setError(err);
		}
	}

	loadGoldPrice();
}, []);
```

`useEffect` must either return a cleanup function or `undefined`. An `async` function implicitly returns a Promise — React would receive that Promise and not know what to do with it, so you'd miss cleanup entirely.

---

### Full production-grade API call with loading/error/cancel

```tsx
import { useEffect, useState } from 'react';

import { getGoldPrice } from '@/api/services';

interface GoldPriceState {
	data: GoldPriceData | null;
	isLoading: boolean;
	error: string | null;
}

function useGoldPrice() {
	const [state, setState] = useState<GoldPriceState>({
		data: null,
		isLoading: true,
		error: null,
	});

	useEffect(() => {
		const controller = new AbortController(); // for cancellation

		async function fetch() {
			setState((prev) => ({ ...prev, isLoading: true, error: null }));

			try {
				const data = await getGoldPrice({ signal: controller.signal });
				setState({ data, isLoading: false, error: null });
			} catch (err) {
				if ((err as Error).name === 'AbortError') return; // ignore cancellation
				setState({ data: null, isLoading: false, error: 'Failed to load price' });
			}
		}

		fetch();

		return () => controller.abort(); // cancel if component unmounts or effect re-runs
	}, []);

	return state;
}
```

```tsx
function GoldPriceDisplay() {
	const { data, isLoading, error } = useGoldPrice();

	if (isLoading) return <Spinner />;
	if (error) return <ErrorMessage message={error} />;
	if (!data) return null;

	return <Text>₹{data.buy} / gram</Text>;
}
```

---

## Race Conditions

A race condition occurs when two async operations are in flight and the slower one resolves last, overwriting the result of the faster one.

### The problem

```tsx
// ❌ Race condition — if userId changes quickly, older response may land last
useEffect(() => {
	fetchUserPortfolio(userId).then((data) => setPortfolio(data));
}, [userId]);

// Timeline:
// userId = "A" → request A sent (takes 500ms)
// userId = "B" → request B sent (takes 100ms)
// B resolves → setPortfolio(B_data)   ✓
// A resolves → setPortfolio(A_data)   ✗ — wrong! A overwrites B
```

### Fix 1: `AbortController` (cancel previous request)

```tsx
useEffect(() => {
	const controller = new AbortController();

	fetchUserPortfolio(userId, { signal: controller.signal })
		.then((data) => setPortfolio(data))
		.catch((err) => {
			if (err.name !== 'AbortError') setError(err);
		});

	return () => controller.abort(); // cancel A when userId changes to B
}, [userId]);
```

### Fix 2: Ignore stale results with a flag

```tsx
useEffect(() => {
	let active = true; // flag — false when effect is cleaned up

	fetchUserPortfolio(userId).then((data) => {
		if (active) setPortfolio(data); // only update if this effect is still current
	});

	return () => {
		active = false;
	};
}, [userId]);
```

`AbortController` is preferred because it actually cancels the network request, saving bandwidth. The flag approach only ignores the result but the request still completes.

---

## Stale Closures

A stale closure occurs when a function captures a value from a render cycle that is now outdated.

### The problem

```tsx
function Counter() {
	const [count, setCount] = useState(0);

	useEffect(() => {
		const id = setInterval(() => {
			// ❌ count is always 0 — the closure captures the initial render's value
			setCount(count + 1);
		}, 1000);

		return () => clearInterval(id);
	}, []); // [] means the closure never refreshes
}
```

### Fix 1: Functional updater (preferred for state)

```tsx
useEffect(() => {
	const id = setInterval(() => {
		setCount((prev) => prev + 1); // prev is always the latest value — no closure
	}, 1000);

	return () => clearInterval(id);
}, []);
```

### Fix 2: `useRef` to hold the latest value

```tsx
const countRef = useRef(count);
countRef.current = count; // always up to date — no stale closure

useEffect(() => {
	const id = setInterval(() => {
		console.info(countRef.current); // reads latest via ref, not closure
	}, 1000);

	return () => clearInterval(id);
}, []);
```

---

## Timers and Scheduling

### `setTimeout` — delay a one-time action

```tsx
useEffect(() => {
	const id = setTimeout(() => {
		setToastVisible(false); // auto-dismiss toast after 3s
	}, 3000);

	return () => clearTimeout(id); // cancel if component unmounts before 3s
}, []);
```

### `setInterval` — repeat on a schedule (polling)

```tsx
function useGoldPricePolling(intervalMs = 30_000) {
	const dispatch = useDispatch();

	useEffect(() => {
		const fetchPrice = () => getGoldPrice().then((data) => dispatch(setGoldPriceDetails(data)));

		fetchPrice(); // fetch immediately on mount

		const id = setInterval(fetchPrice, intervalMs);

		return () => clearInterval(id); // stop polling on unmount
	}, [dispatch, intervalMs]);
}
```

### Debounce — delay rapid input handling

```tsx
function SearchInput() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);

	useEffect(() => {
		if (!query) return;

		const id = setTimeout(async () => {
			const data = await searchGold(query);
			setResults(data);
		}, 300); // wait 300ms after last keystroke

		return () => clearTimeout(id); // cancel previous timer on each keystroke
	}, [query]); // re-runs on every keystroke, but cleanup cancels the previous timer

	return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
}
```

Each keystroke cancels the previous `setTimeout`. The API call only fires 300ms after the user _stops_ typing.

### `requestAnimationFrame` — smooth UI updates

```tsx
useEffect(() => {
	let rafId: number;

	function animate() {
		updateProgressBar();
		rafId = requestAnimationFrame(animate);
	}

	rafId = requestAnimationFrame(animate);
	return () => cancelAnimationFrame(rafId);
}, []);
```

---

## Event Handling Patterns

### DOM event listeners (non-React events)

```tsx
useEffect(() => {
	function handleScroll() {
		setScrollY(window.scrollY);
	}

	window.addEventListener('scroll', handleScroll, { passive: true });

	return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

Always remove listeners in cleanup. Missing this is the most common source of memory leaks.

### Native bridge / WebView messages

```tsx
// Listening for messages from the native BharatPe app
useEffect(() => {
	function handleNativeMessage(event: MessageEvent) {
		if (event.data?.type === 'PAYMENT_SUCCESS') {
			dispatch(setPaymentStatus('success'));
		}
	}

	window.addEventListener('message', handleNativeMessage);
	return () => window.removeEventListener('message', handleNativeMessage);
}, [dispatch]);
```

---

## Promise Patterns

### `Promise.all` — parallel requests, all must succeed

```tsx
useEffect(() => {
	async function loadDashboard() {
		setLoading(true);
		try {
			// Both requests fire in parallel — total time = max(t1, t2), not t1 + t2
			const [goldPrice, userPortfolio] = await Promise.all([getGoldPrice(), getUserPortfolio()]);

			dispatch(setGoldPriceDetails(goldPrice));
			dispatch(setPortfolioDetails(userPortfolio));
		} catch (err) {
			// If either fails, both results are discarded
			setError('Failed to load dashboard');
		} finally {
			setLoading(false);
		}
	}

	loadDashboard();
}, [dispatch]);
```

### `Promise.allSettled` — parallel requests, handle each outcome separately

```tsx
const [priceResult, portfolioResult] = await Promise.allSettled([getGoldPrice(), getUserPortfolio()]);

if (priceResult.status === 'fulfilled') dispatch(setGoldPriceDetails(priceResult.value));
if (portfolioResult.status === 'fulfilled') dispatch(setPortfolioDetails(portfolioResult.value));

// Each can fail independently — the other still shows its data
```

### `Promise.race` — take the fastest result

```tsx
// Useful for timeouts
const data = await Promise.race([
	fetchGoldPrice(),
	new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
]);
```

---

## React 18: Strict Mode Double-Effect

In React 18 development mode, Strict Mode intentionally:

1. Mounts the component
2. Unmounts it
3. Remounts it

This fires `useEffect` twice (with cleanup in between) to help you find missing cleanups. If your app breaks in dev but not in production, you have a cleanup bug.

```tsx
// ❌ Missing cleanup — subscribes twice in dev
useEffect(() => {
	socket.connect();
}, []);

// ✅ Correct cleanup — connect → disconnect → connect in dev; only one in prod
useEffect(() => {
	socket.connect();
	return () => socket.disconnect();
}, []);
```

The double-fire only happens in development. Production always runs effects once per mount.

---

## Custom Hook Abstraction

Encapsulate complex async logic in custom hooks to keep components clean:

```tsx
// hooks/use-async.ts — generic async state manager
import { useCallback, useState } from 'react';

type AsyncState<T> = {
	data: T | null;
	isLoading: boolean;
	error: string | null;
};

export function useAsync<T>(asyncFn: () => Promise<T>) {
	const [state, setState] = useState<AsyncState<T>>({
		data: null,
		isLoading: false,
		error: null,
	});

	const execute = useCallback(async () => {
		setState({ data: null, isLoading: true, error: null });
		try {
			const data = await asyncFn();
			setState({ data, isLoading: false, error: null });
		} catch {
			setState({ data: null, isLoading: false, error: 'Request failed' });
		}
	}, [asyncFn]);

	return { ...state, execute };
}
```

```tsx
// Usage
function BuyGoldButton() {
	const { isLoading, error, execute } = useAsync(() => goldAddMoney({ amount: 500 }));

	return (
		<>
			<button onClick={execute} disabled={isLoading}>
				{isLoading ? 'Processing...' : 'Buy Gold'}
			</button>
			{error && <Text>{error}</Text>}
		</>
	);
}
```

---

## Summary: Async Patterns and When to Use Them

| Pattern                                    | Use When                                                       |
| ------------------------------------------ | -------------------------------------------------------------- |
| `useEffect` + `async/await`                | Fetching data on mount or when deps change                     |
| `AbortController`                          | Request must be cancelled if component unmounts or deps change |
| Ignore flag (`let active`)                 | Can't use AbortController (e.g. non-fetch async work)          |
| Functional updater `setState(prev => ...)` | State update depends on previous value inside a timer/interval |
| `useRef` for latest value                  | Need latest state in a callback without re-running the effect  |
| `Promise.all`                              | Multiple independent requests that all must succeed            |
| `Promise.allSettled`                       | Multiple requests where partial success is acceptable          |
| `setTimeout` + cleanup                     | Debouncing, auto-dismiss, delayed actions                      |
| `setInterval` + cleanup                    | Polling, recurring tasks                                       |
| `requestAnimationFrame` + cleanup          | Smooth animations, canvas updates                              |

---

## Interview Q&A

**Q1. Why can't you pass an `async` function directly to `useEffect`?**

`useEffect` expects its callback to return either a cleanup function or `undefined`. An `async` function always returns a Promise — React receives that Promise and ignores it, which means any cleanup logic `return`ed from inside the async function is never registered. The fix is to define the async function inside the effect and call it immediately, returning cleanup from the outer (synchronous) effect callback.

---

**Q2. What is a race condition in `useEffect` and how do you fix it?**

A race condition occurs when a dependency changes before the previous async operation completes, and the earlier (slower) operation resolves after the newer one — overwriting correct data with stale data. Fix: use `AbortController` to cancel the previous request when the effect cleans up (dependency changes). Alternative: use an `active` flag set to `false` in cleanup — check it before calling `setState` so stale results are ignored. `AbortController` is preferred because it actually cancels the network request.

---

**Q3. What is a stale closure in React and when does it appear?**

A stale closure occurs when a function inside `useEffect` (or an event handler) captures a state or prop value from the render cycle when it was created, not the current one. It appears most often with `setInterval`, `setTimeout`, or event listeners registered with `[]` dependencies — the closure never refreshes. Fix with a functional updater (`setState(prev => prev + 1)`) when the new state depends on the previous value, or with a `useRef` that holds the latest value without causing a re-render.

---

**Q4. When would you use `useLayoutEffect` instead of `useEffect`?**

`useEffect` runs after the browser paints — the user sees the render before the effect fires. `useLayoutEffect` runs synchronously after DOM mutations but before paint — the user never sees the intermediate state. Use `useLayoutEffect` when the effect reads or writes to the DOM in a way that affects layout: measuring element dimensions, synchronising scroll positions, or preventing a flash of incorrect content. For everything else (API calls, subscriptions, timers) use `useEffect` because blocking paint is expensive.

---

**Q5. What is the `AbortController` and how does it work in React?**

`AbortController` is a browser API that produces a `signal` object. You pass the signal to `fetch` (or axios with `{ signal }`). When you call `controller.abort()`, the browser cancels the in-flight request and rejects the Promise with an `AbortError`. In `useEffect`, create a controller, pass its signal to your request, and return `controller.abort` as the cleanup. This way, when the component unmounts or a dependency changes, the request is cancelled and you avoid state updates on unmounted components.

---

**Q6. What is the difference between `Promise.all` and `Promise.allSettled`?**

`Promise.all` takes an array of promises and resolves with an array of results only when **all** resolve. If any one rejects, the entire `Promise.all` rejects immediately, discarding results from the others. Use when all requests are required and a single failure should abort the whole operation. `Promise.allSettled` always resolves (never rejects) with an array of `{ status, value | reason }` objects — one per input promise. Use when requests are independent and partial success is acceptable — you can show data for the ones that succeeded while handling the failures individually.

---

**Q7. Why does React 18 Strict Mode fire `useEffect` twice in development?**

React 18 Strict Mode deliberately mounts → unmounts → remounts every component in development to help surface bugs in cleanup logic. The expectation is that your effect + cleanup pair is idempotent: running connect/disconnect/connect should leave the app in the same state as just connect. If your effect breaks on double-fire, you have a missing cleanup. This behaviour only happens in development; production always mounts once.

---

**Q8. How do you debounce a search input without a third-party library?**

Use `useEffect` with a `setTimeout` inside. On every value change the effect re-runs: first, it returns a cleanup that clears the previous timer; then it sets a new one. If the user types again within the debounce window, the cleanup fires and the timer resets. Only after the user pauses (300ms) does the timer fire and the API call is made.

```tsx
useEffect(() => {
	const id = setTimeout(() => searchAPI(query), 300);
	return () => clearTimeout(id);
}, [query]);
```

---

**Q9. How do you safely update state after an async operation if the component might have unmounted?**

The modern approach is `AbortController`: cancel the operation in the cleanup so the async work stops entirely. For non-cancellable operations, use an `active` flag set to `false` in cleanup:

```tsx
useEffect(() => {
	let active = true;
	fetchData().then((data) => {
		if (active) setState(data);
	});
	return () => {
		active = false;
	};
}, []);
```

React does not automatically throw on setState-after-unmount in React 18 (it removed the warning), but it's still wasteful and can cause subtle bugs.

---

**Q10. How would you implement polling (refetch every N seconds) in React?**

Use `setInterval` inside `useEffect` with the interval ID stored for cleanup. Call the fetch immediately on mount (so the user doesn't wait the full interval for the first load), then repeat every N milliseconds. Return a cleanup that calls `clearInterval` so the polling stops when the component unmounts or dependencies change.

```tsx
useEffect(() => {
	const fetch = () => getGoldPrice().then((data) => dispatch(setGoldPriceDetails(data)));

	fetch(); // immediate first load

	const id = setInterval(fetch, 30_000);
	return () => clearInterval(id);
}, [dispatch]);
```

If the user navigates away, the cleanup fires and polling stops — no ghost intervals running in the background.
