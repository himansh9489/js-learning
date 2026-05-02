# Custom Hooks

---

## What

A custom hook is a **plain JavaScript function** whose name starts with `use` and that calls one or more React hooks internally. It extracts stateful or side-effect logic out of components so that logic can be **shared, tested, and reasoned about independently**.

```
Component = UI (JSX) + Logic
                        ↓
              Extract into a custom hook
                        ↓
Component = UI only     Custom Hook = Logic only
```

Custom hooks are not a React API — they are a **convention**. The `use` prefix tells React's linter that the function follows hook rules, and it tells readers that the function may contain state or side effects.

---

## Why

### Problem: logic scattered inside components

```jsx
// ❌ One component doing too much
function ProductSearch() {
	const [query, setQuery] = useState('');
	const [results, setResults] = useState([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState(null);

	useEffect(() => {
		if (!query) return;
		const id = setTimeout(async () => {
			setLoading(true);
			setError(null);
			try {
				const res = await fetch(`/api/search?q=${query}`);
				const data = await res.json();
				setResults(data);
			} catch (e) {
				setError(e.message);
			} finally {
				setLoading(false);
			}
		}, 300);
		return () => clearTimeout(id);
	}, [query]);

	return (
		<div>
			<input value={query} onChange={(e) => setQuery(e.target.value)} />
			{loading && <Spinner />}
			{error && <p>{error}</p>}
			<ul>
				{results.map((r) => (
					<li key={r.id}>{r.name}</li>
				))}
			</ul>
		</div>
	);
}
```

### Solution: extract the logic into hooks

```jsx
// ✅ Component only handles rendering
function ProductSearch() {
	const [query, setQuery] = useState('');
	const { results, loading, error } = useProductSearch(query);

	return (
		<div>
			<input value={query} onChange={(e) => setQuery(e.target.value)} />
			{loading && <Spinner />}
			{error && <p>{error}</p>}
			<ul>
				{results.map((r) => (
					<li key={r.id}>{r.name}</li>
				))}
			</ul>
		</div>
	);
}
```

Benefits:

- `useProductSearch` is **testable without mounting a component**
- The same hook can be reused in `MobileSearch`, `HeaderSearch`, `CategoryFilter`
- The component is easy to read — it only describes the UI

---

## When to Use

| Signal                                                           | Extract to a custom hook |
| ---------------------------------------------------------------- | ------------------------ |
| Same `useEffect` + `useState` block copy-pasted in 2+ components | ✅ Yes                   |
| Logic that has nothing to do with JSX                            | ✅ Yes                   |
| Component has 5+ `useState` / `useEffect` calls                  | ✅ Yes                   |
| You want to unit-test the logic in isolation                     | ✅ Yes                   |
| Logic only used once and is simple                               | ❌ No — keep inline      |
| Pure UI-only state (toggle open/closed in a single component)    | ❌ No — keep local       |

---

## Where

Custom hooks live in a dedicated folder:

```
src/hooks/
├── useDebounce.ts
├── useFetch.ts
├── useLocalStorage.ts
├── useWindowSize.ts
├── useForm.ts
├── useIntersectionObserver.ts
└── useOnlineStatus.ts
```

Or co-located in the feature folder if the hook is specific to one feature:

```
src/components/screens/search/
├── search.tsx
├── useProductSearch.ts   ← feature-specific hook
└── search.types.d.ts
```

---

## Practical Examples

---

### 1. `useDebounce` — delay expensive operations

Delays updating a value until the user stops changing it for `delay` ms.

```ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id); // reset timer on every change
  }, [value, delay]);

  return debouncedValue;
}

// Usage — only fires search when user pauses typing for 400ms
function SearchBar() {
  const [query, setQuery] = useState('');
  const debouncedQuery    = useDebounce(query, 400);

  useEffect(() => {
    if (debouncedQuery) fetchResults(debouncedQuery);
  }, [debouncedQuery]);

  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

---

### 2. `useFetch` — generic data fetching with loading/error state

```ts
import { useEffect, useState, useCallback } from 'react';

interface FetchState<T> {
  data:    T | null;
  loading: boolean;
  error:   string | null;
  refetch: () => void;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [data,    setData]    = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [tick,    setTick]    = useState(0); // increment to trigger refetch

  const refetch = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(json => { if (!cancelled) setData(json); })
      .catch(err  => { if (!cancelled) setError(err.message); })
      .finally(()  => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; }; // abort stale update on unmount / url change
  }, [url, tick]);

  return { data, loading, error, refetch };
}

// Usage
function UserProfile({ userId }: { userId: string }) {
  const { data: user, loading, error, refetch } = useFetch<User>(`/api/users/${userId}`);

  if (loading) return <Spinner />;
  if (error)   return <p>Error: {error} <button onClick={refetch}>Retry</button></p>;
  return <p>Hello, {user?.name}</p>;
}
```

---

### 3. `useLocalStorage` — persist state across page refreshes

```ts
import { useEffect, useState } from 'react';

export function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // localStorage may be unavailable (private mode, storage full)
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

// Usage — works exactly like useState but persists across reloads
function Settings() {
  const [theme, setTheme] = useLocalStorage<'light' | 'dark'>('theme', 'light');

  return (
    <button onClick={() => setTheme(t => t === 'light' ? 'dark' : 'light')}>
      Current theme: {theme}
    </button>
  );
}
```

---

### 4. `useWindowSize` — reactive viewport dimensions

```ts
import { useEffect, useState } from 'react';

interface WindowSize { width: number; height: number; }

export function useWindowSize(): WindowSize {
  const [size, setSize] = useState<WindowSize>({
    width:  window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handler = () => setSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  return size;
}

// Usage
function ResponsiveBanner() {
  const { width } = useWindowSize();
  return <img src={width > 768 ? '/banner-desktop.jpg' : '/banner-mobile.jpg'} alt="Banner" />;
}
```

---

### 5. `useForm` — form state + validation

```ts
import { useState, ChangeEvent } from 'react';

type ValidationRules<T> = Partial<Record<keyof T, (value: string) => string | null>>;

export function useForm<T extends Record<string, string>>(
  initialValues: T,
  validationRules: ValidationRules<T> = {}
) {
  const [values, setValues]   = useState<T>(initialValues);
  const [errors, setErrors]   = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setValues(prev => ({ ...prev, [name]: value }));

    const rule = validationRules[name as keyof T];
    if (rule) {
      const error = rule(value);
      setErrors(prev => ({ ...prev, [name]: error ?? undefined }));
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement>) => {
    setTouched(prev => ({ ...prev, [e.target.name]: true }));
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  const isValid = Object.values(errors).every(e => !e);

  return { values, errors, touched, handleChange, handleBlur, reset, isValid };
}

// Usage
function LoginForm() {
  const { values, errors, touched, handleChange, handleBlur, isValid } = useForm(
    { email: '', password: '' },
    {
      email:    v => (!v.includes('@') ? 'Enter a valid email' : null),
      password: v => (v.length < 8    ? 'Min 8 characters'    : null),
    }
  );

  return (
    <form>
      <input
        name="email"
        value={values.email}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.email && errors.email && <p>{errors.email}</p>}

      <input
        name="password"
        type="password"
        value={values.password}
        onChange={handleChange}
        onBlur={handleBlur}
      />
      {touched.password && errors.password && <p>{errors.password}</p>}

      <button disabled={!isValid}>Login</button>
    </form>
  );
}
```

---

### 6. `useIntersectionObserver` — detect when an element enters the viewport

Useful for infinite scroll, lazy-loading images, or firing analytics on scroll.

```ts
import { useEffect, useRef, useState } from 'react';

export function useIntersectionObserver(options?: IntersectionObserverInit) {
  const ref       = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      setIsVisible(entry.isIntersecting);
    }, options);

    observer.observe(el);
    return () => observer.disconnect();
  }, [options]);

  return { ref, isVisible };
}

// Usage — load more items when sentinel div scrolls into view
function InfiniteList() {
  const [items, setItems] = useState<string[]>([]);
  const { ref, isVisible } = useIntersectionObserver({ threshold: 1.0 });

  useEffect(() => {
    if (isVisible) {
      // load next page
      setItems(prev => [...prev, ...getNextPage()]);
    }
  }, [isVisible]);

  return (
    <ul>
      {items.map((item, i) => <li key={i}>{item}</li>)}
      <div ref={ref}>Loading more...</div>
    </ul>
  );
}
```

---

### 7. `useOnlineStatus` — react to network connectivity

```ts
import { useEffect, useState } from 'react';

export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return isOnline;
}

// Usage
function NetworkBanner() {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;
  return <div className="banner">You are offline. Some features may not work.</div>;
}
```

---

### 8. `usePrevious` — track the previous value of any variable

```ts
import { useEffect, useRef } from 'react';

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  useEffect(() => { ref.current = value; }); // runs after every render
  return ref.current; // returns last render's value
}

// Usage — show what changed
function PriceDisplay({ price }: { price: number }) {
  const prevPrice = usePrevious(price);
  const direction = prevPrice !== undefined
    ? price > prevPrice ? '▲' : price < prevPrice ? '▼' : '─'
    : '';

  return <p>₹{price} {direction}</p>;
}
```

---

## Anatomy of a Well-Written Custom Hook

```
┌───────────────────────────────────────────────────────┐
│  function useXxx(input?) {                            │
│                                                       │
│    1. State declarations (useState / useReducer)      │
│    2. Refs if needed (useRef)                         │
│    3. Side effects (useEffect) with cleanup           │
│    4. Derived values (useMemo / useCallback)          │
│    5. Return { state, actions, derivedValues }        │
│       ↑ return an object so consumers can name-pick   │
│  }                                                    │
└───────────────────────────────────────────────────────┘
```

---

## Custom Hooks vs HOC vs Render Props

```
┌─────────────────────┬────────────────────┬───────────────────────────┐
│                     │ Custom Hook        │ HOC / Render Prop         │
├─────────────────────┼────────────────────┼───────────────────────────┤
│ Renders extra nodes │ No                 │ Yes (wrapper component)   │
│ Composable          │ Inline in function │ Via compose / nesting     │
│ Works in classes    │ No                 │ Yes                       │
│ Access to props     │ Via arguments      │ Automatic                 │
│ DevTools visibility │ Hook name shown    │ Wrapper name shown        │
│ Preferred today?    │ ✅ Yes             │ When wrapping render only │
└─────────────────────┴────────────────────┴───────────────────────────┘
```

---

## Q&A

**Q: What is a custom hook?**
A custom hook is a function whose name starts with `use` that calls one or more React hooks internally. It is a convention for extracting reusable stateful logic out of components. It has no special React API — the `use` prefix is purely a signal to the linter and to readers.

**Q: Why must a custom hook's name start with `use`?**
React's ESLint plugin (`eslint-plugin-react-hooks`) uses the `use` prefix to identify hook calls and enforce the rules of hooks (no conditional calls, top-level only). Without the prefix, the linter won't enforce rules inside your function, and React won't know to warn you about misuse.

**Q: What is the difference between a custom hook and a utility function?**
A utility function is a pure function with no React dependency — it can be called anywhere. A custom hook calls React hooks (`useState`, `useEffect`, etc.) internally, which means it can only be called inside a React function component or another custom hook. If your "utility" needs state or lifecycle, it's a hook.

**Q: Does each component that calls a custom hook get its own state?**
Yes. Every call to a custom hook creates **isolated, independent state**. Calling `useLocalStorage('theme', 'light')` in two components gives each component its own copy of `storedValue`. The hook is a template — not a singleton.

**Q: How do you share state between components using a custom hook?**
You can't — not directly. Custom hooks are per-instance. To share state, the hook must read from a shared source: React Context, Redux store, Zustand store, or another external observable. The hook is then a thin accessor wrapper around that shared source.

```ts
// Shared via Context
function useCurrentUser() {
	return useContext(UserContext); // same context value for all callers
}
```

**Q: How do you test a custom hook?**
Use `@testing-library/react`'s `renderHook` utility, which renders the hook in a minimal wrapper without needing a real component.

```ts
import { act, renderHook } from '@testing-library/react';

import { useDebounce } from './useDebounce';

test('returns debounced value after delay', async () => {
	jest.useFakeTimers();
	const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
		initialProps: { value: 'hello' },
	});

	expect(result.current).toBe('hello');

	rerender({ value: 'world' });
	expect(result.current).toBe('hello'); // not yet debounced

	act(() => jest.advanceTimersByTime(300));
	expect(result.current).toBe('world'); // now debounced
});
```

**Q: What is the difference between `useDebounce` and `useThrottle`?**
`useDebounce` delays the update until the input has been stable for `delay` ms — fires once after a burst of changes (good for search inputs). `useThrottle` fires at most once per `delay` ms interval during a burst (good for scroll/resize handlers where you want regular updates but not on every event).

**Q: Can a custom hook return JSX?**
Technically yes, but it's a bad practice. Hooks should return data and actions, not UI. If you find yourself returning JSX from a hook, it should be a component instead.

**Q: When should you NOT create a custom hook?**

- When the logic is only used once and is short enough to be readable inline
- When it's purely UI state (a simple open/closed toggle in one component)
- When there is no stateful logic — just extract a plain utility function

**Q: What is a "derived value" inside a hook and how do you expose it?**
A derived value is something computed from state, not stored as state itself (e.g., `isValid`, `total`, `isEmpty`). Compute it inline (or with `useMemo` if expensive) and return it alongside state. Consumers get a clean API without needing to compute it themselves.

```ts
export function useCart() {
	const [items, setItems] = useState<CartItem[]>([]);
	const total = items.reduce((sum, i) => sum + i.price * i.qty, 0); // derived
	const isEmpty = items.length === 0; // derived
	return { items, total, isEmpty, addItem, removeItem };
}
```

**Q: How do custom hooks relate to the separation of concerns principle?**
Custom hooks enforce separation of concerns at the function level. The component is responsible for _rendering_ — it describes what the UI looks like. The custom hook is responsible for _behaviour_ — it manages state, side effects, and business logic. This separation makes both easier to understand, test, and change independently.
