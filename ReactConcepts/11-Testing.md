# Testing in React

---

## Why Testing Matters

| Goal                              | How Tests Achieve It                                                     |
| --------------------------------- | ------------------------------------------------------------------------ |
| **Prevent regressions**           | A failing test tells you exactly what broke before it reaches production |
| **Confidence during refactoring** | Refactor implementation freely — tests prove behaviour hasn't changed    |
| **Document expected behaviour**   | A well-named test is the most up-to-date spec of what the code should do |
| **Force good architecture**       | Hard-to-test code is usually poorly designed — tests surface coupling    |
| **Faster code reviews**           | Reviewers trust a PR with passing tests more than one without            |

---

## The Testing Trophy (React's mental model)

React Testing Library author Kent C. Dodds advocates the **Testing Trophy** over the classic Testing Pyramid:

```
          /\
         /  \         ← E2E (few, slow, expensive — Playwright/Cypress)
        /----\
       /      \       ← Integration (most value — RTL)
      /--------\
     /          \     ← Unit (utilities, hooks, pure functions)
    /------------\
   /              \   ← Static (TypeScript, ESLint — free safety net)
  /________________\
```

**Integration tests** give the highest ROI in React because they test a real component tree with real interactions — mimicking what a user does — without the brittleness of E2E or the over-specification of unit tests.

---

## The Three Layers

### 1. Static Analysis (free tests)

TypeScript + ESLint catch entire categories of bugs before any test runs:

- Wrong prop types
- Missing null checks
- Unreachable code
- Unused variables

### 2. Unit Tests

Test a single function, hook, or utility in isolation.

**Use for:**

- Pure utility functions (`formatCurrency`, `calculateGoldGrams`)
- Custom hooks (with `renderHook`)
- Redux reducers and selectors
- Complex conditional logic extracted from components

### 3. Integration Tests (React Testing Library)

Test a component tree as the user experiences it — render, interact, assert on the DOM.

**Use for:**

- Form submission flows
- Loading / error / success states
- Conditional rendering (auth guards, feature flags)
- User interactions (clicks, keyboard input, async updates)

---

## Tools

| Tool                            | Purpose                                               |
| ------------------------------- | ----------------------------------------------------- |
| **Vitest**                      | Test runner (fast, Vite-native, Jest-compatible API)  |
| **React Testing Library (RTL)** | Renders components and queries the DOM like a user    |
| **@testing-library/user-event** | Realistic user interaction simulation                 |
| **@testing-library/jest-dom**   | Custom matchers (`toBeInTheDocument`, `toBeDisabled`) |
| **MSW (Mock Service Worker)**   | Intercepts real HTTP requests in tests                |
| **Playwright / Cypress**        | Browser-based E2E tests                               |

---

## Core RTL Philosophy

> **"The more your tests resemble the way your software is used, the more confidence they give you."** — Kent C. Dodds

RTL deliberately does NOT expose:

- Component internal state
- Refs
- Component instance methods

It only exposes what a user can observe: **rendered HTML, ARIA attributes, and text**.

```tsx
// ❌ Testing implementation detail — brittle
expect(wrapper.state('isLoading')).toBe(true);

// ✅ Testing what the user sees — resilient
expect(screen.getByText('Loading...')).toBeInTheDocument();
```

---

## Query Priority (RTL)

RTL provides multiple ways to find elements. Use them in this priority order:

| Priority | Query                  | Example                                    | When to use                |
| -------- | ---------------------- | ------------------------------------------ | -------------------------- |
| 1        | `getByRole`            | `getByRole('button', { name: /submit/i })` | Most accessible, preferred |
| 2        | `getByLabelText`       | `getByLabelText('Email')`                  | Form inputs with labels    |
| 3        | `getByPlaceholderText` | `getByPlaceholderText('Search...')`        | Inputs without labels      |
| 4        | `getByText`            | `getByText('Buy Gold')`                    | Non-interactive text       |
| 5        | `getByDisplayValue`    | `getByDisplayValue('John')`                | Current value of input     |
| 6        | `getByAltText`         | `getByAltText('Gold bar image')`           | Images                     |
| 7        | `getByTitle`           | `getByTitle('Close')`                      | Title attribute            |
| 8        | `getByTestId`          | `getByTestId('price-display')`             | **Last resort** only       |

---

## Practical Examples

### 1. Unit Test — Pure Utility Function

```ts
// src/utils/gold.utils.ts
export function calculateGoldGrams(amountInRs: number, pricePerGram: number): number {
	if (pricePerGram <= 0) throw new Error('Price must be positive');
	return parseFloat((amountInRs / pricePerGram).toFixed(4));
}
```

```ts
// src/utils/gold.utils.test.ts
import { describe, expect, it } from 'vitest';

import { calculateGoldGrams } from './gold.utils';

describe('calculateGoldGrams', () => {
	it('returns correct grams for valid inputs', () => {
		expect(calculateGoldGrams(1000, 6000)).toBe(0.1667);
	});

	it('rounds to 4 decimal places', () => {
		expect(calculateGoldGrams(100, 7000)).toBe(0.0143);
	});

	it('throws when price is zero', () => {
		expect(() => calculateGoldGrams(1000, 0)).toThrow('Price must be positive');
	});

	it('throws when price is negative', () => {
		expect(() => calculateGoldGrams(1000, -100)).toThrow('Price must be positive');
	});
});
```

---

### 2. Unit Test — Redux Reducer

```ts
// src/slices/gold-price.slice.test.ts
import { describe, expect, it } from 'vitest';

import GoldPriceSlice, { resetGoldPriceDetails, setGoldPriceDetails } from './gold-price.slice';

const initialState = { data: null, isLoading: false, isError: false };

describe('GoldPriceSlice', () => {
	it('sets gold price data', () => {
		const mockData = { buy: 6000, sell: 5900, unit: 'gram' };
		const state = GoldPriceSlice.reducer(initialState, setGoldPriceDetails(mockData));
		expect(state.data).toEqual(mockData);
	});

	it('resets state to initial values', () => {
		const loadedState = { data: { buy: 6000, sell: 5900 }, isLoading: false, isError: false };
		const state = GoldPriceSlice.reducer(loadedState, resetGoldPriceDetails());
		expect(state.data).toBeNull();
	});
});
```

---

### 3. Unit Test — Custom Hook

```tsx
// src/hooks/use-gold-amount.test.ts
import { act, renderHook } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import { useGoldAmount } from './use-gold-amount';

describe('useGoldAmount', () => {
	it('initialises with zero amount', () => {
		const { result } = renderHook(() => useGoldAmount());
		expect(result.current.amount).toBe(0);
	});

	it('updates amount when setAmount is called', () => {
		const { result } = renderHook(() => useGoldAmount());

		act(() => {
			result.current.setAmount(500);
		});

		expect(result.current.amount).toBe(500);
	});

	it('clamps amount to max allowed value', () => {
		const { result } = renderHook(() => useGoldAmount({ max: 10000 }));

		act(() => {
			result.current.setAmount(99999);
		});

		expect(result.current.amount).toBe(10000);
	});
});
```

---

### 4. Integration Test — Component Render and Interaction

```tsx
// src/components/molecules/buy-details-card/buy-details-card.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { describe, expect, it, vi } from 'vitest';

import BuyDetailsCard from './buy-details-card';

const defaultProps = {
	goldPrice: 6000,
	onAmountChange: vi.fn(),
	onConfirm: vi.fn(),
};

describe('BuyDetailsCard', () => {
	it('renders gold price correctly', () => {
		render(<BuyDetailsCard {...defaultProps} />);
		expect(screen.getByText(/₹6,000/)).toBeInTheDocument();
	});

	it('calls onAmountChange when user types in amount input', async () => {
		const user = userEvent.setup();
		render(<BuyDetailsCard {...defaultProps} />);

		const input = screen.getByRole('spinbutton', { name: /amount/i });
		await user.clear(input);
		await user.type(input, '500');

		expect(defaultProps.onAmountChange).toHaveBeenCalledWith(500);
	});

	it('disables confirm button when amount is zero', () => {
		render(<BuyDetailsCard {...defaultProps} />);
		expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled();
	});

	it('enables confirm button when valid amount is entered', async () => {
		const user = userEvent.setup();
		render(<BuyDetailsCard {...defaultProps} />);

		await user.type(screen.getByRole('spinbutton', { name: /amount/i }), '100');

		expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled();
	});
});
```

---

### 5. Integration Test — Async API States

```tsx
// src/components/screens/portfolio/portfolio.test.tsx
import { render, screen, waitFor } from '@testing-library/react';

import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { renderWithProviders } from '@/utils/test-utils';

// custom wrapper with Redux
import PortfolioScreen from './portfolio';

// MSW intercepts the actual HTTP call — no axios mocking needed
const server = setupServer(
	http.get('/api/gold/portfolio', () => {
		return HttpResponse.json({
			totalGrams: 1.5,
			totalValue: 9000,
			returns: 12.5,
		});
	}),
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PortfolioScreen', () => {
	it('shows loading state while fetching', () => {
		renderWithProviders(<PortfolioScreen />);
		expect(screen.getByRole('progressbar')).toBeInTheDocument();
	});

	it('renders portfolio data after successful fetch', async () => {
		renderWithProviders(<PortfolioScreen />);

		await waitFor(() => {
			expect(screen.getByText('1.5 grams')).toBeInTheDocument();
			expect(screen.getByText('₹9,000')).toBeInTheDocument();
		});
	});

	it('shows error state when API fails', async () => {
		server.use(http.get('/api/gold/portfolio', () => HttpResponse.error()));

		renderWithProviders(<PortfolioScreen />);

		await waitFor(() => {
			expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
		});
	});
});
```

---

### 6. Test — Conditional Rendering / Route Guard

```tsx
// src/components/hoc/with-auth/with-auth.test.tsx
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { render, screen } from '@testing-library/react';

import { describe, expect, it } from 'vitest';

import WithAuth from './with-auth';

const ProtectedPage = () => <div>Protected Content</div>;
const LoginPage = () => <div>Login Page</div>;

function renderWithRouter(isAuthenticated: boolean) {
	return render(
		<MemoryRouter initialEntries={['/dashboard']}>
			<Routes>
				<Route path="/login" element={<LoginPage />} />
				<Route
					path="/dashboard"
					element={
						<WithAuth isAuthenticated={isAuthenticated}>
							<ProtectedPage />
						</WithAuth>
					}
				/>
			</Routes>
		</MemoryRouter>,
	);
}

describe('WithAuth HOC', () => {
	it('renders protected content when authenticated', () => {
		renderWithRouter(true);
		expect(screen.getByText('Protected Content')).toBeInTheDocument();
	});

	it('redirects to login when not authenticated', () => {
		renderWithRouter(false);
		expect(screen.getByText('Login Page')).toBeInTheDocument();
		expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
	});
});
```

---

### 7. Custom Test Utility — `renderWithProviders`

Most React apps need Redux, Router, and other context providers in tests. Create a shared wrapper:

```tsx
// src/utils/test-utils.tsx
import React, { PropsWithChildren } from 'react';

import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';

import { configureStore } from '@reduxjs/toolkit';
import { RenderOptions, render } from '@testing-library/react';

import GoldPriceSlice from '@/slices/gold-price.slice';
import GoldUserSlice from '@/slices/gold-user.slice';

function buildStore(preloadedState = {}) {
	return configureStore({
		reducer: {
			goldPrice: GoldPriceSlice.reducer,
			goldUser: GoldUserSlice.reducer,
		},
		preloadedState,
	});
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
	preloadedState?: object;
	initialRoute?: string;
}

export function renderWithProviders(
	ui: React.ReactElement,
	{ preloadedState = {}, initialRoute = '/', ...renderOptions }: ExtendedRenderOptions = {},
) {
	const store = buildStore(preloadedState);

	function Wrapper({ children }: PropsWithChildren) {
		return (
			<Provider store={store}>
				<MemoryRouter initialEntries={[initialRoute]}>{children}</MemoryRouter>
			</Provider>
		);
	}

	return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
```

Usage:

```tsx
// Render with pre-populated Redux state
renderWithProviders(<BuyScreen />, {
	preloadedState: {
		goldPrice: { data: { buy: 6000 }, isLoading: false, isError: false },
	},
});
```

---

## What to Test vs What Not to Test

| Test this                                             | Skip this                                                            |
| ----------------------------------------------------- | -------------------------------------------------------------------- |
| User-visible behaviour (text, buttons, form outcomes) | Implementation details (state variable names, private methods)       |
| All async states: loading, success, error, empty      | Styling (use visual regression tools instead)                        |
| Edge cases: empty data, null, zero, max values        | Third-party library internals                                        |
| Conditional rendering based on props/state            | Things TypeScript already guarantees                                 |
| Custom hook return values and state transitions       | Component internal structure (don't test `render()` output directly) |

---

## Common Mistakes

| Mistake                                | Why It's Wrong                                                | Fix                                           |
| -------------------------------------- | ------------------------------------------------------------- | --------------------------------------------- |
| Using `getByTestId` everywhere         | Ties tests to implementation, not user experience             | Use `getByRole` / `getByText` first           |
| Not using `userEvent` for interactions | `fireEvent` skips browser event sequences (focus, blur, etc.) | Use `@testing-library/user-event`             |
| Mocking too much                       | Over-mocked tests don't catch integration bugs                | Use MSW to mock at the network layer          |
| Not wrapping async in `waitFor`        | Assertions run before async updates complete                  | Wrap with `await waitFor(() => ...)`          |
| Testing implementation state           | `component.state.isLoading` — breaks on refactor              | Test what's in the DOM instead                |
| One giant test file per component      | Hard to maintain, slow to run                                 | One describe per scenario, focused test files |

---

## Test File Naming and Location

```
src/
├── utils/
│   ├── gold.utils.ts
│   └── gold.utils.test.ts          ← colocated with source
├── hooks/
│   ├── use-gold-amount.ts
│   └── use-gold-amount.test.ts
├── slices/
│   ├── gold-price.slice.ts
│   └── gold-price.slice.test.ts
└── components/
    └── molecules/
        └── buy-details-card/
            ├── buy-details-card.tsx
            └── buy-details-card.test.tsx
```

Colocate tests with source files. This makes the relationship obvious and ensures tests are updated when the source changes.

---

## Interview Q&A

**Q1. What is the difference between React Testing Library and Enzyme?**

Enzyme (Airbnb, now deprecated) tested component internals — it could shallow-render a component, inspect its internal state, and call lifecycle methods directly. RTL takes the opposite philosophy: it only tests what a real user can see and interact with (rendered DOM, ARIA roles, text content). RTL tests are more resilient to refactors because they don't care about implementation details. Enzyme tests would break when you renamed a state variable; RTL tests only break when user-visible behaviour changes.

---

**Q2. What is the difference between `getBy`, `queryBy`, and `findBy`?**

|           | Element found   | Element missing       | Async   |
| --------- | --------------- | --------------------- | ------- |
| `getBy`   | Returns element | **Throws**            | No      |
| `queryBy` | Returns element | Returns `null`        | No      |
| `findBy`  | Returns Promise | Rejects after timeout | **Yes** |

- Use `getBy` when the element must be present — it gives a clear error if missing.
- Use `queryBy` to assert something is **not** present: `expect(queryByText('Error')).not.toBeInTheDocument()`.
- Use `findBy` for elements that appear after async operations: `await findByText('Success')`.

---

**Q3. Why use `userEvent` instead of `fireEvent`?**

`fireEvent` dispatches a single synthetic DOM event. `userEvent` simulates the full sequence of browser events a real user would trigger — for a click: `pointerover` → `pointerenter` → `mouseover` → `mouseenter` → `pointermove` → `mousemove` → `pointerdown` → `mousedown` → focus → `pointerup` → `mouseup` → `click`. This catches bugs in components that listen to hover, focus, or mousedown separately. `userEvent` is always preferred; `fireEvent` is acceptable only for uncommon events not covered by `userEvent`.

---

**Q4. What is MSW and why is it better than mocking axios directly?**

MSW (Mock Service Worker) intercepts HTTP requests at the network level using a service worker (in the browser) or Node.js interceptors (in tests). When you mock axios directly, you're testing that your code calls axios correctly — but you're not testing whether the request URL, method, and payload are correct. MSW lets you write tests that work exactly the same whether you use axios, fetch, or any other HTTP library. It also makes it easy to test error states, network delays, and partial failures without touching application code.

---

**Q5. How do you test a component that uses Redux?**

Wrap the component in a `<Provider>` with a real test store (not a mocked one). Use `configureStore` with the actual reducers and pass a `preloadedState` to set up the starting state. Then interact with the rendered component and assert on DOM output — not on Redux state directly. The test validates the full flow: user action → dispatch → reducer → re-render → DOM update.

```tsx
renderWithProviders(<GoldBuyForm />, {
	preloadedState: { goldPrice: { data: { buy: 6000 }, isLoading: false } },
});
```

---

**Q6. What is `renderHook` and when do you use it?**

`renderHook` from `@testing-library/react` renders a component whose only purpose is to call a hook and expose its return value. Use it to unit test custom hooks without building a full component around them. Use `act()` to wrap any state-updating calls so React can process them before you assert.

```tsx
const { result } = renderHook(() => useCounter(0));
act(() => result.current.increment());
expect(result.current.count).toBe(1);
```

---

**Q7. How do you test asynchronous behaviour (loading states, API calls)?**

Three key techniques:

1. **`waitFor`** — polls until the assertion passes or times out. Use for elements that appear after async operations.
2. **`findBy*`** — async version of `getBy*`; returns a promise that resolves when the element appears.
3. **`act`** — wraps state updates to ensure React processes them before you assert. RTL wraps most things automatically; you only need it explicitly for hook-level tests.

Always `await` async assertions; never assert synchronously on DOM that changes asynchronously.

---

**Q8. What makes a component easy to test?**

- **Separation of concerns** — business logic extracted into utilities or custom hooks, not inline in JSX.
- **Prop-driven** — receive data as props instead of fetching inside the component (makes it easy to inject test data).
- **No direct global side effects** — avoid reading `window.location` or `localStorage` directly; abstract behind a utility so tests can mock the abstraction.
- **Predictable output** — same props = same output, no hidden state.
- **Clear ARIA semantics** — elements have roles and labels that RTL's `getByRole` can target.

---

**Q9. What is the difference between unit tests and integration tests in a React context?**

A **unit test** tests a single unit in isolation with all dependencies mocked — e.g., testing a utility function or a Redux reducer without rendering any component. An **integration test** tests how multiple units work together — e.g., rendering a component tree, firing user events, and asserting on DOM output, with only network calls mocked (via MSW). Most React tests should be integration tests because they give the best ratio of coverage to confidence. Unit tests are reserved for complex pure logic (formatters, calculators, reducers).

---

**Q10. How do you decide what not to test?**

Avoid testing:

- **Implementation details** — state variable names, internal function calls. These break on valid refactors.
- **Third-party code** — libraries are tested by their authors. Mock them at the boundary.
- **Styling** — class names and CSS values are fragile and don't represent behaviour. Use visual regression tools (Chromatic, Percy) instead.
- **Things TypeScript guarantees** — if a wrong prop type is impossible at compile time, a test for it adds noise.
- **Trivial code** — a component that renders `<p>{text}</p>` doesn't need a test; the value is zero.

Focus your tests on **user flows and business rules** — the things that, if broken, would cause real user harm.
