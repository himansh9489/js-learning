# Async Tasks in React

## Topics to Cover
- API calls
- `useEffect` in depth
- Event handling
- Promises / async-await
- `setTimeout` / scheduling

## API Calls Pattern
1. Set loading state.
2. Make async request.
3. Store response or error.
4. Cleanup/cancel if component unmounts.

## `useEffect` In Depth
- Runs after render.
- Dependency array controls re-run.
- Use cleanup to remove listeners, clear timers, abort requests.

## Promises and Events
- Handle errors with `try/catch`.
- Avoid stale closures by using latest state patterns.

## `setTimeout` Use Cases
- Debounce input.
- Delay non-critical updates.
- Simulate polling intervals (with cleanup).

## Interview Tip
Mention race-condition prevention (`AbortController`) and proper cleanup for robust async code.
