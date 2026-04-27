# React Hooks

## What
Hooks are functions that let function components use React features like state, lifecycle behavior, context, refs, and performance optimizations.

## Why
- Avoid class component complexity.
- Reuse stateful logic through custom hooks.
- Keep components smaller and easier to test.

## Core Hooks (prepare in this order)

### 1) `useState`
- Stores local component state.
- State updates are asynchronous and can be batched.
- Use functional updates when new value depends on previous value.

### 2) `useEffect`
- Runs side effects (API calls, subscriptions, timers, DOM listeners).
- Dependency array controls when effect runs.
- Return cleanup to prevent memory leaks.

### 3) `useContext`
- Reads data from React Context without prop drilling.
- Useful for theme, auth, locale, and app-level settings.

### 4) `useReducer`
- Best for complex state transitions.
- Uses `state + action -> newState` pattern.
- Often combined with Context for shared state.

### 5) `useMemo`
- Memoizes expensive computed values.
- Recomputes only when dependencies change.

### 6) `useCallback`
- Memoizes function references.
- Helps prevent unnecessary child re-renders (with `React.memo`).

### 7) `useRef`
- Stores mutable values without causing re-render.
- Commonly used for DOM access and instance-like variables.

## Common Interview Pitfalls
- Calling hooks conditionally (not allowed).
- Missing dependencies in `useEffect`.
- Overusing memoization for cheap operations.
- Mutating state directly.

## Quick Example
```jsx
import { useState, useEffect } from "react";

function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${count}`;
    return () => {
      // cleanup if needed
    };
  }, [count]);

  return <button onClick={() => setCount((c) => c + 1)}>{count}</button>;
}
```
