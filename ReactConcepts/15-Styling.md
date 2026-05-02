# Styling in React

Styling in React is not a single solution — it's a spectrum of approaches, each with trade-offs around performance, DX, scalability, and team size.

---

## 1. Plain CSS / SCSS

### What

Standard CSS or Sass (SCSS) stylesheets imported into components.

### Why

- Zero runtime overhead
- Full access to all CSS features (pseudo-selectors, keyframes, media queries, cascade)
- Familiar to every developer

### When to Use

- Small to medium projects where global styles are manageable
- When you need advanced CSS features (animations, `::before`/`::after`, complex selectors)
- Server-rendered apps (no JS needed for styles)

### Where It Falls Short

- Global scope — class names can collide across components
- Duplication grows as the project scales
- Hard to co-locate styles with component logic

### Practical Example

```scss
/* button.scss */
.btn {
	padding: 8px 16px;
	border-radius: 8px;
	font-size: 14px;
	cursor: pointer;

	&--primary {
		background: #007270;
		color: white;
	}

	&--disabled {
		opacity: 0.5;
		pointer-events: none;
	}
}
```

```tsx
import './button.scss';

const Button = ({ label, disabled }: { label: string; disabled?: boolean }) => (
	<button className={`btn ${disabled ? 'btn--disabled' : 'btn--primary'}`}>{label}</button>
);
```

---

## 2. CSS Modules

### What

CSS files where class names are locally scoped by default. The build tool generates unique identifiers so names never collide.

### Why

- Solves the global scope problem of plain CSS
- Works with SCSS syntax too
- Zero runtime overhead — still produces regular CSS

### When to Use

- Component-level styling in large codebases
- Teams that prefer CSS syntax over utility classes
- When you want isolation without a full CSS-in-JS setup

### Practical Example

```scss
/* card.module.scss */
.wrapper {
	border-radius: 12px;
	padding: 16px;
	background: #fff;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.title {
	font-size: 16px;
	font-weight: 600;
	color: #1a1a1a;
}
```

```tsx
import styles from './card.module.scss';

const Card = ({ title }: { title: string }) => (
	<div className={styles.wrapper}>
		<p className={styles.title}>{title}</p>
	</div>
);
```

The generated class name becomes something like `card_title__3xK2j` — unique, no collisions.

---

## 3. Tailwind CSS

### What

A utility-first CSS framework. Instead of writing `.btn { padding: 8px }`, you compose classes directly in JSX: `className="px-2 py-1 rounded"`.

### Why

- Extremely fast to build UI (no context-switching between files)
- No dead CSS — only classes you use are included in the bundle (purge/JIT)
- Built-in design tokens (spacing, color, typography scale)
- Easy responsive and dark-mode variants

### When to Use

- Rapid prototyping and product UIs
- Teams that want a consistent design language without a full component library
- Projects where design tokens matter (theming via config)

### Where It Falls Short

- JSX can look verbose with many utility classes
- Harder to express complex CSS (deeply nested pseudo-selectors, keyframes)
- Requires discipline to avoid duplication via `@apply`

### Practical Example

```tsx
const Button = ({ label, disabled }: { label: string; disabled?: boolean }) => (
	<button
		className={`px-4 py-2 rounded-lg text-sm font-medium transition-opacity
      ${disabled ? 'opacity-50 pointer-events-none bg-gray-400' : 'bg-teal-700 text-white hover:bg-teal-800'}`}
		disabled={disabled}>
		{label}
	</button>
);
```

**With `classnames` for clarity:**

```tsx
import cn from 'classnames';

const Button = ({ label, disabled }: { label: string; disabled?: boolean }) => (
	<button
		className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-opacity', {
			'opacity-50 pointer-events-none bg-gray-400': disabled,
			'bg-teal-700 text-white hover:bg-teal-800': !disabled,
		})}>
		{label}
	</button>
);
```

---

## 4. CSS-in-JS (styled-components / Emotion)

### What

Write CSS directly in JavaScript/TypeScript files, co-located with the component. Styles are injected at runtime via `<style>` tags.

### Why

- Dynamic styling based on props is trivial
- True component encapsulation (styles are deleted when the component unmounts)
- Full TypeScript support for style props

### When to Use

- Component libraries or design systems
- Heavy theming requirements (e.g., multiple white-label themes)
- When dynamic styles are tied to complex JS logic

### Where It Falls Short

- **Runtime cost**: Styles are generated and injected at runtime — slows initial render
- **Bundle size**: Adds 10–30 KB gzipped
- **SSR complexity**: Requires extra setup to avoid flash of unstyled content
- **Not recommended** in performance-critical mobile WebViews

### Practical Example (styled-components)

```tsx
import styled from 'styled-components';

const Button = styled.button<{ $disabled?: boolean }>`
	padding: 8px 16px;
	border-radius: 8px;
	font-size: 14px;
	cursor: ${({ $disabled }) => ($disabled ? 'not-allowed' : 'pointer')};
	background: ${({ $disabled }) => ($disabled ? '#9ca3af' : '#007270')};
	color: white;
	opacity: ${({ $disabled }) => ($disabled ? 0.5 : 1)};
`;

const MyButton = ({ label, disabled }: { label: string; disabled?: boolean }) => (
	<Button $disabled={disabled}>{label}</Button>
);
```

---

## 5. StyleX (Meta)

### What

A new CSS-in-JS approach by Meta (used in Facebook/Instagram) that moves all style computation to **build time**. No runtime style injection.

### Why

- Solves the runtime overhead problem of traditional CSS-in-JS
- Generates atomic CSS (each property becomes one class, heavily deduplicated)
- Strict TypeScript types for style values
- Works well with React Server Components

### When to Use

- Large-scale apps with hundreds of components
- Performance-critical surfaces where CSS-in-JS runtime cost is unacceptable
- Teams already on Meta infrastructure or React Server Components

### Where It Falls Short

- Steeper learning curve — API is different from CSS-in-JS and Tailwind
- Ecosystem is newer; fewer examples and community resources
- Does not support dynamic keyframes or complex CSS features easily

### Practical Example

```tsx
import * as stylex from '@stylexjs/stylex';

const styles = stylex.create({
	base: {
		padding: '8px 16px',
		borderRadius: '8px',
		fontSize: '14px',
		color: 'white',
	},
	primary: {
		backgroundColor: '#007270',
	},
	disabled: {
		opacity: 0.5,
		pointerEvents: 'none',
		backgroundColor: '#9ca3af',
	},
});

const Button = ({ label, disabled }: { label: string; disabled?: boolean }) => (
	<button {...stylex.props(styles.base, disabled ? styles.disabled : styles.primary)}>{label}</button>
);
```

---

## 6. Component Libraries (MUI / Ant Design / Chakra UI)

### What

Pre-built, themed React component libraries. Instead of styling individual HTML elements, you use pre-designed components (`<Button>`, `<Card>`, `<Modal>`) that follow a design system.

### Why

- Fastest path to a polished UI
- Accessibility (a11y) is built in
- Theming APIs allow consistent customisation
- Handles complex components (Date Pickers, Data Tables, etc.)

### When to Use

- Internal tools, dashboards, admin panels where UX polish matters but custom branding is not required
- Small teams without a dedicated designer
- Rapid MVPs

### Where It Falls Short

- **Bundle size**: Full libraries are large (MUI is ~90 KB gzipped for core)
- **Opinionated design**: Hard to deviate from the library's visual language
- **Over-engineering**: Unnecessary for simple landing pages or marketing sites

### Practical Example (MUI)

```tsx
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';

const Actions = () => (
	<Stack direction="row" spacing={2}>
		<Button variant="contained" color="primary">
			Buy Gold
		</Button>
		<Button variant="outlined" color="secondary">
			Cancel
		</Button>
	</Stack>
);
```

---

## Comparison Table

| Approach                      | Runtime Cost      | Bundle Impact  | Customisation  | Best For                   |
| ----------------------------- | ----------------- | -------------- | -------------- | -------------------------- |
| Plain CSS / SCSS              | None              | Minimal        | Full           | Simple apps, animations    |
| CSS Modules                   | None              | Minimal        | Full           | Medium apps, isolation     |
| Tailwind CSS                  | None (JIT)        | Very small     | High (config)  | Product UIs, speed         |
| CSS-in-JS (styled-components) | High              | Medium–High    | Full + dynamic | Design systems, theming    |
| StyleX                        | None (build-time) | Atomic (small) | High           | Large-scale, RSC           |
| MUI / Ant Design              | Low–Medium        | Large          | Medium         | Dashboards, internal tools |

---

## How to Choose

1. **Need speed + design tokens?** → Tailwind CSS
2. **Building a component library with complex theming?** → styled-components or StyleX
3. **Writing a dashboard with many ready-made components?** → MUI or Ant Design
4. **Need deep CSS control (animations, pseudo-elements)?** → SCSS or CSS Modules
5. **Optimizing for SSR and bundle size?** → CSS Modules or StyleX

---

## Best Practices

- **Use design tokens** (CSS variables, Tailwind config, MUI theme) instead of hardcoded values — ensures consistent color, spacing, and typography.
- **Co-locate styles with components** — whether via CSS Modules or utility classes in JSX, styles should live close to what they style.
- **Avoid global class name pollution** — prefer CSS Modules or scoped utilities over global `.btn`, `.card` etc.
- **Don't mix paradigms unnecessarily** — pick one primary approach per project and use a second only where the first genuinely cannot handle the need (e.g., Tailwind + SCSS Modules for complex animations).
- **Measure before optimising** — CSS-in-JS runtime cost is real but often negligible at small scale; profile first.

---

## Interview Q&A

**Q1. What is the difference between CSS Modules and CSS-in-JS?**

CSS Modules scope class names at **build time** — the CSS is still a static file, just with uniquified names. CSS-in-JS (like styled-components) generates and injects styles at **runtime** in JavaScript, which enables dynamic styling but adds runtime overhead. CSS Modules have zero runtime cost; CSS-in-JS trades performance for flexibility.

---

**Q2. Why would you choose Tailwind over styled-components?**

Tailwind has no runtime cost, results in a smaller bundle (JIT removes unused classes), and is faster to prototype with because there's no context switching between files. styled-components is preferable when styles need to be truly dynamic — driven by complex component state or prop logic — and when you're building a reusable component library that consumers can theme.

---

**Q3. What is "critical CSS" and why does it matter?**

Critical CSS is the minimal set of styles needed to render the above-the-fold content. Inlining it in `<head>` prevents a flash of unstyled content (FOUC). CSS-in-JS frameworks have to solve this for SSR by extracting styles server-side. CSS Modules and Tailwind make this easier because styles are static files that can be split and preloaded.

---

**Q4. How does Tailwind avoid bloating the bundle with unused styles?**

Tailwind v3+ uses JIT (Just-In-Time) compilation. It scans your source files for class names and generates only the CSS for classes actually used. The final production stylesheet is typically under 10 KB.

---

**Q5. What is StyleX and how does it differ from styled-components?**

StyleX is Meta's approach to CSS-in-JS at build time. Styles are defined as JavaScript objects but compiled into atomic CSS classes during the build — no runtime style injection. styled-components injects styles at runtime using `<style>` tags, which introduces overhead especially on mobile. StyleX gives you the DX of CSS-in-JS with the performance of static CSS.

---

**Q6. When would you NOT use a component library like MUI?**

- When you have a strong custom design system that doesn't match MUI's visual language — fighting the defaults costs more time than building from scratch.
- On mobile WebViews where bundle size directly impacts load time and MUI's ~90 KB gzipped is costly.
- On marketing/landing pages where you need pixel-perfect custom design.
- When you don't need complex pre-built components (date pickers, data grids) — Tailwind alone is lighter and faster.

---

**Q7. What are CSS custom properties (variables) and how do they help theming?**

```css
:root {
	--color-primary: #007270;
	--spacing-md: 16px;
}

.button {
	background: var(--color-primary);
	padding: var(--spacing-md);
}
```

CSS variables are resolved at runtime by the browser, not at build time. This means you can override them per theme (e.g., dark mode via `[data-theme="dark"] { --color-primary: #33a6a3; }`) without generating multiple stylesheets. Tailwind and MUI both support theming through a similar token layer.

---

**Q8. What causes "specificity wars" and how do you avoid them?**

Specificity wars happen when developers override styles by adding more specific selectors (`div .card .button`) instead of fixing the root cause. They arise from unscoped global CSS and poor architecture. Solutions:

- Use CSS Modules or utility classes (Tailwind) to avoid global scope.
- Adopt a naming methodology (BEM) if writing global CSS.
- Never use `!important` as a fix — it signals an architectural problem.

---

**Q9. How do you handle responsive design in Tailwind?**

Tailwind uses mobile-first breakpoint prefixes:

```tsx
<div className="text-sm md:text-base lg:text-lg">Responsive text</div>
```

`text-sm` applies by default (mobile), `md:text-base` overrides at `768px+`, `lg:text-lg` at `1024px+`. Since this project targets mobile WebViews exclusively, breakpoint variants are rarely needed.

---

**Q10. What is the performance difference between inline styles and Tailwind classes?**

Inline styles (`style={{ color: 'red' }}`) bypass the CSS cascade, can't be cached, and trigger style recalculation on every render if the object reference changes. Tailwind classes are static strings — the browser caches the stylesheet and applying/removing a class is a single DOM attribute update, much cheaper than recalculating inline styles. Always prefer utility classes over inline styles.
