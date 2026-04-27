# SSR vs CSR

## CSR (Client-Side Rendering)
Browser downloads JS and renders app mostly on client side.

## SSR (Server-Side Rendering)
Server renders HTML first and sends it to browser, then client hydrates for interactivity.

## Key Differences
- **Initial Load**: SSR often faster for first content.
- **SEO**: SSR generally better for crawlability.
- **Interactivity**: CSR can feel slower initially on weak devices.
- **Server Cost**: SSR increases server work/complexity.

## When to Choose
- Use SSR for SEO-heavy pages (landing, blogs, e-commerce listings).
- Use CSR for internal dashboards and highly interactive apps.

## Hydration
Process where React attaches event handlers to server-rendered HTML on client.

## Interview Tip
Mention trade-off clearly: SSR improves first paint and SEO, CSR can simplify infra for app-like experiences.
