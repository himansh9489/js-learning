# Lazy Loading, Code Splitting, and Suspense

## What Is Lazy Loading
Lazy loading delays loading of code/components until they are needed.

## Why
- Reduces initial bundle size.
- Improves first load performance.
- Useful for route-based feature separation.

## Key Terms
- **Code Splitting**: break one big bundle into smaller bundles.
- **Chunking**: generated smaller JS files (chunks).
- **Suspense**: fallback UI while lazy component loads.

## Example
```jsx
import React, { Suspense, lazy } from "react";

const SettingsPage = lazy(() => import("./SettingsPage"));

export default function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <SettingsPage />
    </Suspense>
  );
}
```

## Best Practices
- Use route-level lazy loading first.
- Keep fallback UI meaningful.
- Preload critical routes if needed.

## Interview Tip
Mention lazy loading as a direct performance optimization and connect it to better Core Web Vitals.
