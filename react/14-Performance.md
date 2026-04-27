# React Performance

## Main Areas
- Lazy loading
- Asset optimization
- Optimized code patterns
- Bundler configuration
- CDN and server caching
- Rendering efficiency

## App-Level Optimizations
- Use code splitting and route-based lazy loading.
- Minify/compress JS and CSS.
- Enable tree shaking and dead-code removal.

## Rendering Optimizations
- Avoid unnecessary re-renders.
- Use `React.memo`, `useMemo`, `useCallback` only when beneficial.
- Use stable keys in lists.
- Virtualize long lists.

## Network and Delivery
- Serve static assets through CDN.
- Use caching headers effectively.
- Preload critical resources carefully.

## Interview Tip
Always connect optimization to measurement (Lighthouse, bundle analyzer, Web Vitals).
