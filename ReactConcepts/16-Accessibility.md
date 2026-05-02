# Accessibility (A11y) in React

---

## What Is Accessibility?

Accessibility (abbreviated **a11y** — 11 letters between 'a' and 'y') means building digital products that people with disabilities can perceive, understand, navigate, and interact with.

Disabilities that affect web use include:

- **Visual** — blindness, low vision, colour blindness
- **Motor** — limited fine motor control, unable to use a mouse
- **Cognitive** — ADHD, dyslexia, memory impairments
- **Auditory** — deafness (primarily affects video/audio content)

The standard is **WCAG** (Web Content Accessibility Guidelines), published by the W3C. Most products target **WCAG 2.1 Level AA**.

---

## Why It Matters (Beyond "Being Nice")

| Reason                        | Detail                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| **Legal compliance**          | ADA (US), EAA (EU 2025), RPwD Act (India) — inaccessible products can face litigation |
| **Market reach**              | ~1.3 billion people worldwide have some disability — 15–20% of any user base          |
| **Better UX for everyone**    | Captions help in noisy environments; keyboard nav helps power users                   |
| **SEO overlap**               | Semantic HTML, alt text, and heading structure directly improve search indexing       |
| **Code quality**              | Accessible code is usually better structured — forces correct semantics               |
| **RTL testing compatibility** | RTL's `getByRole` / `getByLabelText` only work on accessible markup                   |

---

## The Four WCAG Principles (POUR)

| Principle          | Meaning                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| **Perceivable**    | Information must be presentable in ways users can perceive (alt text, captions, colour contrast) |
| **Operable**       | UI must be operable by keyboard, not just mouse; no time limits without alternatives             |
| **Understandable** | UI and content must be understandable; error messages must be clear                              |
| **Robust**         | Content must be interpreted reliably by assistive technologies (proper HTML semantics)           |

---

## 1. Semantic HTML — The Foundation

### What

Semantic elements carry built-in meaning that browsers, screen readers, and search engines understand. They provide keyboard interaction, ARIA roles, and focus management for free.

### Why

A `<div>` with an `onClick` is invisible to screen readers and keyboard users. A `<button>` is focusable by `Tab`, activatable by `Enter`/`Space`, announced as "button" by screen readers, and receives `:focus` styles automatically.

### When / Where

Every time you reach for a `<div>` as an interactive element — stop and ask if a semantic element exists.

```tsx
// ❌ Inaccessible — div with click is invisible to screen readers and keyboard
<div onClick={handleBuy} className="ib-bg-primary ib-p-4">
  Buy Gold
</div>

// ✅ Accessible — button is focusable, activatable by Enter/Space, announced correctly
<button onClick={handleBuy} className="ib-bg-primary ib-p-4 ib-rounded-lg">
  Buy Gold
</button>
```

```tsx
// ❌ Non-semantic structure
<div>
  <div>Gold Investment</div>
  <div>
    <div>Buy</div>
    <div>Sell</div>
  </div>
</div>

// ✅ Semantic structure — screen readers understand the page hierarchy
<main>
  <h1>Gold Investment</h1>
  <nav aria-label="Gold actions">
    <ul>
      <li><a href="/gold/buy">Buy</a></li>
      <li><a href="/gold/sell">Sell</a></li>
    </ul>
  </nav>
</main>
```

### Semantic element reference

| Use case              | Correct element                       |
| --------------------- | ------------------------------------- |
| Page heading          | `<h1>` – `<h6>` (one `h1` per page)   |
| Navigation links      | `<nav>` containing `<a>`              |
| Main page content     | `<main>`                              |
| Supplementary content | `<aside>`                             |
| Clickable action      | `<button>`                            |
| Page section          | `<section aria-label="...">`          |
| Article/card          | `<article>`                           |
| Form field + label    | `<label>` + `<input>`                 |
| Data table            | `<table>`, `<th scope="col">`, `<td>` |
| List of items         | `<ul>` / `<ol>` + `<li>`              |

---

## 2. ARIA — Augmenting Semantics

### What

ARIA (Accessible Rich Internet Applications) is a set of HTML attributes that modify how elements are announced to assistive technologies. ARIA does not change visual appearance or add behaviour — it only affects the **accessibility tree** (what screen readers see).

### The First Rule of ARIA

> **Do not use ARIA if you can use a native HTML element instead.**

Native elements (`<button>`, `<input>`, `<select>`) have built-in ARIA semantics. Only reach for ARIA when no native element covers the pattern.

### Key ARIA attributes

| Attribute          | Purpose                                         | Example                                       |
| ------------------ | ----------------------------------------------- | --------------------------------------------- |
| `role`             | Declares element's semantic role                | `role="dialog"`, `role="alert"`, `role="tab"` |
| `aria-label`       | Provides an accessible name (invisible text)    | `aria-label="Close modal"`                    |
| `aria-labelledby`  | Points to element(s) that label this element    | `aria-labelledby="modal-title"`               |
| `aria-describedby` | Points to element(s) that describe this element | `aria-describedby="error-msg"`                |
| `aria-hidden`      | Hides element from accessibility tree           | `aria-hidden="true"` on decorative icons      |
| `aria-expanded`    | State of expandable element                     | `aria-expanded={isOpen}`                      |
| `aria-disabled`    | Communicates disabled state                     | `aria-disabled={isLoading}`                   |
| `aria-live`        | Announces dynamic content updates               | `aria-live="polite"`                          |
| `aria-required`    | Marks required form field                       | `aria-required="true"`                        |
| `aria-invalid`     | Marks invalid field                             | `aria-invalid={hasError}`                     |
| `aria-controls`    | Points to element this controls                 | `aria-controls="dropdown-menu"`               |
| `aria-selected`    | Selected state in lists/tabs                    | `aria-selected={isActive}`                    |

### Practical ARIA examples

```tsx
// Icon button with no visible text — needs aria-label
<button onClick={onClose} aria-label="Close gold details modal">
  <Icon src={CloseIcon} aria-hidden="true" /> {/* icon itself is hidden from AT */}
</button>

// Loading indicator
<div role="status" aria-live="polite" aria-label="Loading gold price">
  <Spinner />
</div>

// Tab navigation
<div role="tablist" aria-label="Gold transaction filters">
  <button
    role="tab"
    aria-selected={activeTab === 'buy'}
    aria-controls="buy-panel"
    id="buy-tab"
    onClick={() => setActiveTab('buy')}
  >
    Buy
  </button>
  <button
    role="tab"
    aria-selected={activeTab === 'sell'}
    aria-controls="sell-panel"
    id="sell-tab"
    onClick={() => setActiveTab('sell')}
  >
    Sell
  </button>
</div>
<div role="tabpanel" id="buy-panel" aria-labelledby="buy-tab" hidden={activeTab !== 'buy'}>
  {/* buy content */}
</div>
```

---

## 3. Keyboard Navigation

### What

Every interactive element must be reachable and operable with a keyboard alone. The standard keyboard model:

| Key           | Expected behaviour                                      |
| ------------- | ------------------------------------------------------- |
| `Tab`         | Move focus forward through focusable elements           |
| `Shift + Tab` | Move focus backward                                     |
| `Enter`       | Activate link or button                                 |
| `Space`       | Activate button, toggle checkbox                        |
| `Escape`      | Close modal, dropdown, dialog                           |
| Arrow keys    | Navigate within composite widgets (menu, listbox, tabs) |

### Focus management in React

```tsx
// ✅ Focus moves into modal when it opens; returns to trigger when it closes
import { useEffect, useRef } from 'react';

// ❌ Focus lost — modal opens but focus stays on the trigger button behind the overlay
function BadModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	return isOpen ? <div role="dialog">{/* content */}</div> : null;
}

function GoldModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
	const closeButtonRef = useRef<HTMLButtonElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null); // passed in or from context

	useEffect(() => {
		if (isOpen) {
			// Move focus inside the modal
			closeButtonRef.current?.focus();
		}
	}, [isOpen]);

	if (!isOpen) return null;

	return (
		<div role="dialog" aria-modal="true" aria-labelledby="modal-title">
			<h2 id="modal-title">Gold Purchase Details</h2>
			<button ref={closeButtonRef} onClick={onClose} aria-label="Close modal">
				✕
			</button>
			{/* content */}
		</div>
	);
}
```

### Focus trap — keep keyboard focus inside modal

```tsx
// Focus trap: Tab inside modal must cycle through modal elements only
function useFocusTrap(containerRef: React.RefObject<HTMLElement>, isActive: boolean) {
	useEffect(() => {
		if (!isActive || !containerRef.current) return;

		const focusableSelectors = [
			'a[href]',
			'button:not([disabled])',
			'input:not([disabled])',
			'select:not([disabled])',
			'textarea:not([disabled])',
			'[tabindex]:not([tabindex="-1"])',
		].join(', ');

		const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(focusableSelectors);
		const first = focusableElements[0];
		const last = focusableElements[focusableElements.length - 1];

		function handleKeyDown(e: KeyboardEvent) {
			if (e.key !== 'Tab') return;

			if (e.shiftKey) {
				if (document.activeElement === first) {
					e.preventDefault();
					last.focus();
				}
			} else {
				if (document.activeElement === last) {
					e.preventDefault();
					first.focus();
				}
			}
		}

		containerRef.current.addEventListener('keydown', handleKeyDown);
		return () => containerRef.current?.removeEventListener('keydown', handleKeyDown);
	}, [isActive, containerRef]);
}
```

### Skip navigation link

```tsx
// Lets keyboard users jump over repeated nav to main content
// Visually hidden until focused
<a
  href="#main-content"
  className="ib-sr-only focus:ib-not-sr-only focus:ib-fixed focus:ib-top-4 focus:ib-left-4 ib-bg-white ib-p-2 ib-z-50"
>
  Skip to main content
</a>
<main id="main-content">
  {/* page content */}
</main>
```

---

## 4. Forms and Error Handling

### What

Accessible forms connect labels to inputs, announce errors to screen readers, and never rely on colour alone to indicate validity.

```tsx
// ❌ Inaccessible form — placeholder-only label, error not announced
<input placeholder="Enter amount" />
<span style={{ color: 'red' }}>Amount is required</span>

// ✅ Accessible form — label associated, error announced, field marked invalid
function GoldAmountInput() {
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const inputId = 'gold-amount';
  const errorId = 'gold-amount-error';

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setValue(e.target.value);
    setError(e.target.value ? '' : 'Amount is required');
  }

  return (
    <div>
      {/* label is programmatically associated via htmlFor */}
      <label htmlFor={inputId}>
        Amount (₹) <span aria-hidden="true">*</span>
      </label>

      <input
        id={inputId}
        type="number"
        value={value}
        onChange={handleChange}
        aria-required="true"
        aria-invalid={!!error}           // announces "invalid" to screen readers
        aria-describedby={errorId}       // connects input to error message
        min={1}
      />

      {/* role="alert" causes screen reader to announce immediately */}
      <span id={errorId} role="alert" aria-live="assertive">
        {error}
      </span>
    </div>
  );
}
```

### Key form patterns

```tsx
// Group related radio buttons with fieldset + legend
<fieldset>
  <legend>Select payment method</legend>
  <label>
    <input type="radio" name="payment" value="upi" /> UPI
  </label>
  <label>
    <input type="radio" name="payment" value="netbanking" /> Net Banking
  </label>
</fieldset>

// Disabled vs aria-disabled — use aria-disabled to keep element focusable
// (so screen reader users can discover it and hear why it's disabled)
<button
  aria-disabled={!isKycComplete}
  onClick={isKycComplete ? handleBuy : undefined}
  aria-describedby="kyc-required-msg"
>
  Buy Gold
</button>
<span id="kyc-required-msg" className={isKycComplete ? 'ib-sr-only' : ''}>
  Complete KYC to enable buying
</span>
```

---

## 5. Colour and Visual Design

### Contrast ratios (WCAG AA)

| Element                          | Minimum contrast |
| -------------------------------- | ---------------- |
| Normal text (< 18px)             | 4.5:1            |
| Large text (≥ 18px bold, ≥ 24px) | 3:1              |
| UI components (borders, icons)   | 3:1              |

```tsx
// ❌ Light grey on white — fails contrast (ratio ~2:1)
<Text className="ib-text-neutral-300">Gold Price</Text>

// ✅ Dark text — passes contrast (ratio ~9:1)
<Text className="ib-text-neutral-800">Gold Price</Text>
```

### Never use colour as the only indicator

```tsx
// ❌ Only colour distinguishes success from error — fails for colour-blind users
<span className={isValid ? 'ib-text-green-500' : 'ib-text-red-500'}>
  {amount}
</span>

// ✅ Colour + icon + text — multiple cues
<span className={isValid ? 'ib-text-green-600' : 'ib-text-red-600'}>
  <span aria-hidden="true">{isValid ? '✓' : '✗'}</span>
  <span>{isValid ? 'Valid amount' : 'Amount too low'}</span>
</span>
```

---

## 6. Images and Media

```tsx
// Informative image — describe what it shows
<img src={goldBarUrl} alt="22-karat gold bar, 1 gram" />

// Decorative image — empty alt so screen readers skip it
<img src={bgPattern} alt="" role="presentation" />

// Functional image (logo link) — alt describes the destination
<a href="/gold">
  <img src={logoUrl} alt="Gold Invest — go to home" />
</a>

// Complex image (chart) — provide a text alternative
<figure>
  <img src={priceChartUrl} alt="Gold price trend chart" aria-describedby="chart-desc" />
  <figcaption id="chart-desc">
    Gold price rose from ₹5,800 to ₹6,200 per gram over the last 30 days.
  </figcaption>
</figure>
```

---

## 7. Live Regions — Announcing Dynamic Content

When content changes without a page reload, screen readers don't automatically announce it. `aria-live` regions fix this:

```tsx
// Toast / notification — polite (waits for user to finish current action)
<div role="status" aria-live="polite" aria-atomic="true">
  {toastMessage}
</div>

// Critical error — assertive (interrupts immediately)
<div role="alert" aria-live="assertive" aria-atomic="true">
  {criticalError}
</div>

// Gold price update ticker
function GoldPriceTicker({ price }: { price: number }) {
  return (
    <div>
      <Text>Current Price</Text>
      {/* aria-live="polite" announces price updates without interrupting */}
      <Text aria-live="polite" aria-atomic="true">
        ₹{price} / gram
      </Text>
    </div>
  );
}
```

**`aria-atomic="true"`** — announce the entire region as one unit when any part changes (not just the changed text node).

---

## 8. Route Changes and Focus in SPAs

In traditional multi-page apps, navigating to a new page resets focus to the top of the document. In SPAs, the URL changes but the DOM is not reloaded — focus stays wherever it was, which confuses screen reader users.

```tsx
// Solution: move focus to the page heading on route change
import { useEffect, useRef } from 'react';

import { useLocation } from 'react-router-dom';

function RouteAnnouncer() {
	const { pathname } = useLocation();
	const headingRef = useRef<HTMLHeadingElement>(null);

	useEffect(() => {
		// Move focus to the page title after navigation
		headingRef.current?.focus();
	}, [pathname]);

	return (
		// tabIndex={-1} makes it programmatically focusable without being in tab order
		<h1 ref={headingRef} tabIndex={-1} className="ib-sr-only">
			{getPageTitle(pathname)}
		</h1>
	);
}
```

---

## 9. `tabIndex` Usage

```tsx
// tabIndex={0}  — add element to the natural tab order
// tabIndex={-1} — allow programmatic focus but remove from tab order
// tabIndex > 0  — ❌ NEVER use — creates confusing, unexpected tab order

// Custom focusable widget that should be in tab order
<div role="button" tabIndex={0} onClick={handler} onKeyDown={handleKeyDown}>
  Custom Button
</div>

// Element that should receive programmatic focus but not be tab-reachable
<div ref={dialogRef} tabIndex={-1} role="dialog">
  {/* focus moved here programmatically; user tabs within */}
</div>
```

---

## 10. Testing Accessibility

### Automated tooling (catches ~30–40% of issues)

```tsx
// Install jest-axe for unit tests
// npm install --save-dev jest-axe @types/jest-axe
import { render } from '@testing-library/react';

import { axe, toHaveNoViolations } from 'jest-axe';
import { expect } from 'vitest';

expect.extend(toHaveNoViolations);

test('GoldBuyButton has no accessibility violations', async () => {
	const { container } = render(<button onClick={vi.fn()}>Buy Gold</button>);
	const results = await axe(container);
	expect(results).toHaveNoViolations();
});
```

```tsx
// RTL's getByRole implicitly validates accessibility
// If getByRole fails to find an element, your ARIA/semantic HTML is wrong
const buyButton = screen.getByRole('button', { name: /buy gold/i });
const amountInput = screen.getByRole('spinbutton', { name: /amount/i });
const modal = screen.getByRole('dialog', { name: /gold details/i });
```

### Browser extensions (manual review)

| Tool                         | What it checks                            |
| ---------------------------- | ----------------------------------------- |
| **axe DevTools** (Chrome)    | WCAG violations, ARIA correctness         |
| **Lighthouse** (Chrome)      | Accessibility score, specific failures    |
| **WAVE** (browser extension) | Visual overlay of a11y issues             |
| **Colour Contrast Analyzer** | Desktop app for measuring contrast ratios |

### Manual keyboard testing checklist

```
☐ Tab through every interactive element — can you reach them all?
☐ Tab order is logical (top-left to bottom-right, matches visual flow)
☐ Every interactive element has a visible focus indicator
☐ Modals: focus moves in, Tab cycles within, Escape closes, focus returns to trigger
☐ Dropdowns: Arrow keys navigate options, Enter selects, Escape closes
☐ Forms: Error messages announced on submit, invalid fields marked
☐ Route changes: Focus moves to page heading
☐ Dynamic content (toasts, alerts): Announced by screen reader
```

### Screen reader testing

| OS      | Screen Reader                    | Browser |
| ------- | -------------------------------- | ------- |
| macOS   | VoiceOver (built-in, `Cmd + F5`) | Safari  |
| Windows | NVDA (free)                      | Firefox |
| Windows | JAWS (industry standard)         | Chrome  |
| iOS     | VoiceOver (built-in)             | Safari  |
| Android | TalkBack (built-in)              | Chrome  |

---

## Common A11y Mistakes in React

| Mistake                                  | Why It's Wrong                                          | Fix                                                       |
| ---------------------------------------- | ------------------------------------------------------- | --------------------------------------------------------- |
| `<div onClick={...}>`                    | Not keyboard-accessible, not announced by screen reader | Use `<button>`                                            |
| Missing `alt` on `<img>`                 | Screen reader reads the file path                       | Add descriptive `alt` or `alt=""` for decorative          |
| `placeholder` as the only label          | Disappears on input; not reliably announced             | Use `<label htmlFor>`                                     |
| Colour-only error indication             | Fails for colour-blind users                            | Add icon + text alongside colour                          |
| `tabIndex > 0`                           | Breaks natural tab order                                | Only use `0` or `-1`                                      |
| Focus not managed in modals              | Screen reader users are stranded outside the modal      | Move focus on open, trap inside, return on close          |
| Suppressing focus outline globally       | `outline: none` makes keyboard navigation invisible     | Keep outlines; style them instead: `outline: 2px solid`   |
| `aria-label` on non-interactive elements | Adds noise with no benefit                              | Only label interactive or landmark elements               |
| Icon without text, no `aria-label`       | Screen reader reads nothing or the SVG title            | Add `aria-label` to the button, `aria-hidden` to the icon |

---

## Interview Q&A

**Q1. What is the difference between `aria-label`, `aria-labelledby`, and `aria-describedby`?**

All three provide text to assistive technologies, but serve different purposes:

- **`aria-label`**: Provides an accessible name directly as a string. Use when there is no visible text to reference (e.g., an icon-only button).
- **`aria-labelledby`**: References another element's text content by ID to serve as the label. Preferred over `aria-label` when visible text already exists — it stays in sync automatically if the text changes.
- **`aria-describedby`**: References supplementary information (description, not name) — announced after the label. Used for error messages, hints, and additional context.

```tsx
<button aria-label="Close">✕</button>                         // aria-label
<h2 id="title">Gold Details</h2>
<div role="dialog" aria-labelledby="title">...</div>           // aria-labelledby
<input aria-describedby="hint" />
<span id="hint">Enter amount between ₹1 and ₹10,000</span>    // aria-describedby
```

---

**Q2. When should you use `role="button"` on a `<div>` vs just using a `<button>`?**

Almost never. A `<button>` element gives you keyboard focus, `Enter`/`Space` activation, `:focus` styles, and correct ARIA role for free. `role="button"` on a `<div>` gives you the announcement but none of the behaviour — you also need `tabIndex={0}`, an `onKeyDown` handler for `Enter`/`Space`, and careful CSS for focus styles. The only legitimate use case is when the markup structure makes a `<button>` genuinely impossible (e.g., inside a `<table>` in a context where browser quirks prevent button children). In all other cases, use the native element.

---

**Q3. What is a focus trap and why is it necessary for modals?**

A focus trap constrains keyboard Tab navigation so it cycles only within a specified container. Modals require focus traps because:

1. The modal overlay is meant to be the exclusive interaction surface.
2. Without a trap, Tab would move focus to elements behind the overlay — elements the user cannot see or use.
3. WCAG 2.1 (Success Criterion 2.1.2) requires that focus not be "trapped" unintentionally, but also that dialogs manage focus correctly so keyboard users are not stranded.

Implementation: on `Tab`, if focus is on the last focusable element, wrap to the first. On `Shift+Tab`, if focus is on the first, wrap to the last.

---

**Q4. What is `aria-live` and when do you use `"polite"` vs `"assertive"`?**

`aria-live` marks a region whose content changes dynamically. Screen readers announce changes to live regions automatically.

- **`"polite"`**: Waits until the user is idle before announcing. Use for non-urgent updates — stock prices, success toasts, search results updating as you type.
- **`"assertive"`**: Interrupts whatever the screen reader is currently announcing. Use sparingly for critical, time-sensitive alerts — authentication failures, payment errors, session timeouts.

Overusing `"assertive"` is disruptive. Default to `"polite"` and only escalate when the information demands immediate attention.

---

**Q5. How do you handle focus management when navigating between routes in a React SPA?**

In a traditional MPA, the browser resets focus to the top of the page on navigation. In a SPA, the URL changes but the DOM persists — focus stays on the last focused element, which is often the navigation link that was just clicked. Screen reader users have no signal that a new page has loaded.

Fix: on every route change, programmatically move focus to the main page heading (`<h1>`) with `tabIndex={-1}` so it can receive focus without being in the tab order. Alternatively, use a visually hidden "route announcer" live region that updates with the new page title on navigation.

---

**Q6. What is the difference between `disabled` and `aria-disabled`?**

`disabled` (HTML attribute): the element is completely non-interactive — it cannot receive focus, it is skipped by Tab, and it is not submitted with forms. Screen reader users cannot discover it while keyboard navigating.

`aria-disabled="true"`: the element is announced as disabled but remains focusable. Screen reader users can Tab to it and hear why it is disabled. Use `aria-disabled` when the element carries contextual information that users need to discover (e.g., "Complete KYC to enable buying"). Pair it with a handler that prevents the action but does not fire when the element is "disabled".

---

**Q7. What does `tabIndex={-1}` do and when do you use it?**

`tabIndex={-1}` makes an element **programmatically focusable** (via `.focus()` in JavaScript) but **removes it from the natural Tab order** — the user cannot reach it by pressing Tab. Use cases:

- Modal containers: focus moves in programmatically on open, but users Tab between the modal's own interactive elements.
- Page headings for route announcements: `h1` receives focus programmatically on navigation, but is not Tab-reachable.
- Custom focus management patterns where you control focus explicitly.

Never use positive `tabIndex` values (e.g., `tabIndex={5}`) — they override the natural tab order and create confusing, unpredictable navigation.

---

**Q8. How do you make a custom dropdown/select accessible?**

A custom dropdown must implement the ARIA `combobox` or `listbox` pattern. At minimum:

1. The trigger button has `aria-expanded` (true/false) and `aria-controls` pointing to the list.
2. The option list has `role="listbox"` and each option has `role="option"`.
3. The selected option has `aria-selected="true"`.
4. Arrow keys navigate options, `Enter` selects, `Escape` closes and returns focus to the trigger.
5. The trigger announces the current value.

This is why native `<select>` is preferred — it provides all of this for free. Only build custom dropdowns when the design requires it (e.g., option items with images or complex layout).

---

**Q9. How does accessibility improve code quality?**

Accessible code forces better practices:

- **Semantic HTML** → better document outline, easier to maintain
- **Labels on form fields** → forces you to name inputs clearly
- **Error messages associated to fields** → forces structured error state
- **Keyboard navigability** → forces logical DOM order that matches visual layout
- **`aria-label` on icon buttons** → forces you to explicitly state what every action does
- **RTL test queries** → `getByRole` and `getByLabelText` only work on accessible markup, so writing accessible components naturally makes them testable

---

**Q10. What WCAG level should a production React app target, and what does it mean?**

**WCAG 2.1 Level AA** is the industry standard target and the level specified in most legal requirements (ADA, EAA, EN 301 549).

- **Level A** (minimum): Absolute must-haves — alt text, keyboard access, no content that flashes 3+ times per second.
- **Level AA**: Industry standard — colour contrast (4.5:1 normal, 3:1 large), no reliance on sensory characteristics alone, visible focus indicators, error identification and suggestion.
- **Level AAA** (enhanced): Stricter contrast (7:1), sign language for audio content — typically not achievable for all content on a general-purpose site.

Aim for AA compliance as the baseline. Audit with automated tools (catches ~30–40% of issues), browser extensions, and manual keyboard + screen reader testing.
