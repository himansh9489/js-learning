# Higher Order Components (HOC)

## What
A Higher Order Component is a function that takes a component and returns a new enhanced component.

`const Enhanced = withFeature(WrappedComponent);`

## Why
- Reuse cross-cutting logic (auth, permissions, logging, loading states).
- Keep UI components focused on rendering.

## When
- In legacy codebases using class components.
- When existing architecture already follows HOC pattern.
- When you need wrapper-based behavior around components.

## How
1. Create a function that accepts a component.
2. Return a new component.
3. Pass through props and inject additional props/behavior.

## Example
```jsx
function withAuth(Component) {
  return function AuthenticatedComponent(props) {
    const isLoggedIn = true; // replace with real auth check
    if (!isLoggedIn) return <p>Access denied</p>;
    return <Component {...props} />;
  };
}
```

## HOC vs Hooks
- Hooks are preferred in modern React for logic reuse.
- HOCs are still useful in older code and some library patterns.

## Interview Points
- Mention prop collision risk.
- Mention display name/debugging challenges.
- Mention "wrapper hell" when multiple HOCs are chained.
