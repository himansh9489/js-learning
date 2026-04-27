# Custom Hooks

## What
Custom hooks are reusable functions that use React hooks internally to share logic across components.

## Why
- Cleaner components.
- Reusable business logic.
- Better maintainability and testability.

## When to Use
- Repeated logic across components (fetching, form handling, debounce).
- Logic that is not tied to a specific UI element.

## Rules
- Name must start with `use`.
- Only call hooks at top level.
- Keep hooks focused on one responsibility.

## Example: `useDebounce`
```jsx
import { useEffect, useState } from "react";

export function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debouncedValue;
}
```

## Interview Tip
Explain that custom hooks separate "logic layer" from "view layer", making code more modular and test-friendly.
