# React Coding Practices — Reusability, Readability, Modularity, Testability

---

## The North Star Question

Before writing any code, ask:

> **"Will another developer — or me in six months — understand and extend this quickly?"**

Every practice below flows from this. Code is read far more often than it is written.

---

## 1. Reusability

### What

Reusability means building components, hooks, and utilities in a way that lets them be used in multiple places **without modification**.

### Why

- Fewer bugs — fix once, fixed everywhere
- Smaller codebase — less to read, test, and maintain
- Faster feature development — compose existing pieces

### When to extract for reuse

- The same JSX structure appears in 2+ places
- The same `useState` + `useEffect` logic appears in 2+ components
- A utility function is copy-pasted between files

### Where it lives

```
atoms/        ← smallest reusable UI pieces (Button, Badge, Avatar)
molecules/    ← composed reusable patterns (FormField, Card, Modal)
hooks/        ← reusable stateful logic
utils/        ← reusable pure functions
```

---

### Practical Example — From Copy-paste to Reusable

**Before — duplicated UI pattern**

```jsx
// BuyPage.jsx
<div className="info-row">
  <span className="label">Gold rate</span>
  <span className="value">₹6,200/gm</span>
</div>
<div className="info-row">
  <span className="label">You pay</span>
  <span className="value">₹500</span>
</div>

// SellPage.jsx — exact same structure
<div className="info-row">
  <span className="label">Gold rate</span>
  <span className="value">₹6,180/gm</span>
</div>
<div className="info-row">
  <span className="label">You receive</span>
  <span className="value">₹490</span>
</div>
```

**After — single reusable atom**

```tsx
// atoms/info-row/info-row.tsx
interface InfoRowProps {
  label: string;
  value: string | number;
  valueClassName?: string;
}

function InfoRow({ label, value, valueClassName }: InfoRowProps) {
  return (
    <div className="ib-flex ib-justify-between ib-py-2">
      <Text variant="body2" className="ib-text-neutral-500">{label}</Text>
      <Text variant="body2" className={cn('ib-text-neutral-800 ib-font-medium', valueClassName)}>
        {value}
      </Text>
    </div>
  );
}

// Usage — identical in both pages, consistent UI guaranteed
<InfoRow label="Gold rate" value="₹6,200/gm" />
<InfoRow label="You pay"   value="₹500" valueClassName="ib-text-teal-700" />
```

---

### Reusable Components — Props Design Rules

**1. Accept children for flexible composition**

```tsx
// ❌ Rigid — every variation needs a new prop
function Card({ title, subtitle, icon, footer }) { ... }

// ✅ Flexible — caller controls the interior
function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('ib-rounded-2xl ib-bg-white ib-p-4 ib-shadow-sm', className)}>
      {children}
    </div>
  );
}

// Usage — compose freely
<Card className="ib-border ib-border-neutral-200">
  <h3>Gold SIP</h3>
  <p>₹500/month</p>
</Card>
```

**2. Keep props flat and typed — no `any`**

```tsx
// ❌ Opaque
function Button({ config }: { config: any }) { ... }

// ✅ Explicit, typed, discoverable
interface ButtonProps {
  label:      string;
  onClick:    () => void;
  variant?:   'primary' | 'secondary' | 'ghost';
  disabled?:  boolean;
  isLoading?: boolean;
}
function Button({ label, onClick, variant = 'primary', disabled, isLoading }: ButtonProps) { ... }
```

**3. One responsibility per component**

```tsx
// ❌ Does too much — fetches, transforms, and renders
function UserDashboard() {
  const [user, setUser] = useState(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  const initials = user?.name.split(' ').map(n => n[0]).join('');
  return <div><Avatar initials={initials} /><p>{user?.email}</p></div>;
}

// ✅ Split by responsibility
function useUserProfile() {
  const [user, setUser] = useState<User | null>(null);
  useEffect(() => { fetchUser().then(setUser); }, []);
  return user;
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('');
}

function UserDashboard() {
  const user = useUserProfile(); // logic → hook
  if (!user) return <Skeleton />;
  return <div><Avatar initials={getInitials(user.name)} /><p>{user.email}</p></div>;
}
```

---

## 2. Readability

### What

Readable code communicates its intent clearly without requiring comments to explain _what_ it does.

### Why

- Reduces onboarding time for new team members
- Makes bugs easier to spot — code that reads like English is easier to reason about
- Reduces the cost of future changes

### Rules

---

**Rule 1 — Name things after what they mean, not what they do**

```tsx
// ❌ Describes mechanism, not intent
const x = user.status === 'kyc_approved';
const fn = () => navigate('/buy');
const data = useSelector((s) => s.goldPrice);

// ✅ Describes meaning
const isKycApproved = user.status === 'kyc_approved';
const goToBuyPage = () => navigate('/buy');
const goldPrice = useSelector((s) => s.goldPrice);
```

**Rule 2 — Keep components small — one screen of code**

A component that needs scrolling to read is doing too much. If you need to scroll, split it.

```tsx
// ❌ 200-line component — hard to scan
function BuyPage() {
  // 15 state declarations
  // 6 useEffects
  // 3 helper functions inline
  // 200 lines of JSX
}

// ✅ Split into focused sub-components
function BuyPage() {
  return (
    <div>
      <GoldPriceHeader />
      <AmountInput />
      <BuyDetailsSummary />
      <PaymentMethodSelector />
      <BuyFooter />
    </div>
  );
}
// Each sub-component is 20-40 lines and tells one story
```

**Rule 3 — Flatten nested JSX conditionals**

```tsx
// ❌ Nested ternaries — hard to parse at a glance
return (
  <div>
    {isLoading
      ? <Spinner />
      : hasError
        ? <ErrorMessage error={error} />
        : isEmpty
          ? <EmptyState />
          : <DataList items={items} />
    }
  </div>
);

// ✅ Early return pattern — each state is a separate, clear exit
function ProductList({ isLoading, error, items }) {
  if (isLoading) return <Spinner />;
  if (error)     return <ErrorMessage error={error} />;
  if (!items.length) return <EmptyState />;

  return (
    <ul>
      {items.map(item => <ProductItem key={item.id} item={item} />)}
    </ul>
  );
}
```

**Rule 4 — Use constants for magic values**

```tsx
// ❌ Magic numbers and strings — what do these mean?
if (user.kycStatus === 3) { ... }
setTimeout(poll, 5000);
if (goldWeight < 0.001) { ... }

// ✅ Named constants communicate intent
const KYC_STATUS = { PENDING: 1, IN_REVIEW: 2, APPROVED: 3, REJECTED: 4 };
const POLL_INTERVAL_MS  = 5_000;
const MIN_GOLD_WEIGHT_G = 0.001;

if (user.kycStatus === KYC_STATUS.APPROVED) { ... }
setTimeout(poll, POLL_INTERVAL_MS);
if (goldWeight < MIN_GOLD_WEIGHT_G) { ... }
```

**Rule 5 — Prefer positive condition names**

```tsx
// ❌ Double negatives require mental gymnastics
if (!isNotVerified) { ... }
const canNotProceed = !isKycApproved || !hasSufficientBalance;

// ✅ Positive names read naturally
if (isVerified) { ... }
const canProceed = isKycApproved && hasSufficientBalance;
```

---

## 3. Modularity

### What

Modularity means organizing code into **self-contained units** with clear responsibilities and minimal coupling. Each module does one thing and exposes a clean interface.

### Why

- Changes in one module don't ripple through the entire codebase
- Modules can be developed, tested, and replaced independently
- Large teams can work on different modules in parallel

### Folder Structure by Domain

```
src/
├── components/
│   ├── atoms/          ← stateless building blocks
│   ├── molecules/      ← composed presentational patterns
│   ├── screens/        ← full pages with their own logic
│   └── containers/     ← data-fetching wrappers
├── hooks/              ← reusable stateful logic
├── slices/             ← Redux state per domain
├── api/
│   ├── constants.ts    ← API endpoint strings
│   └── services.ts     ← typed service functions
├── utils/              ← pure helper functions
└── constants/          ← app-wide constants
```

**Each module has a barrel `index.ts` that defines its public API:**

```ts
// Consumers import from the barrel — never the internal file
import { InfoRow } from '@/components/atoms/info-row';

// components/atoms/info-row/index.ts
export { InfoRow } from './info-row';
export type { InfoRowProps } from './info-row.types';
```

This means you can refactor the internals without changing every import.

---

### Separation of Concerns in Practice

The Container → Screen pattern enforces separation in this codebase:

```
┌─────────────────────────────────────────────────────────┐
│  Container (buy.container.tsx)                          │
│  Responsibility: DATA                                   │
│  • Reads from Redux store via selector hooks            │
│  • Dispatches actions                                   │
│  • Passes data as props to the screen                   │
└───────────────────────┬─────────────────────────────────┘
                        │ props
                        ▼
┌─────────────────────────────────────────────────────────┐
│  Screen (buy.tsx)                                       │
│  Responsibility: UI + user interaction                  │
│  • Receives all data as props (no Redux here)           │
│  • Handles UI-level state (modal open, active tab)      │
│  • Renders JSX                                          │
└─────────────────────────────────────────────────────────┘
```

```tsx
// buy.container.tsx — data layer
const BuyContainer: FC = () => {
	const goldPrice = useGoldPriceDetails(); // selector hook
	const userDetails = useGoldUserDetails();
	const dispatch = useDispatch();

	const handleBuy = useCallback(
		(amount: number) => {
			dispatch(initiateBuy(amount));
		},
		[dispatch],
	);

	return <GoldBuy goldPrice={goldPrice} userDetails={userDetails} onBuy={handleBuy} />;
};

// buy.tsx — UI layer (no Redux, pure props)
const GoldBuy: FC<BuyProps> = ({ goldPrice, userDetails, onBuy }) => {
	const [amount, setAmount] = useState('');
	return (
		<div>
			<p>Rate: ₹{goldPrice.rate}/gm</p>
			<input value={amount} onChange={(e) => setAmount(e.target.value)} />
			<button onClick={() => onBuy(Number(amount))}>Buy</button>
		</div>
	);
};
```

---

### Co-locate Related Files

```
buy/
├── buy.tsx                ← UI component
├── buy.container.tsx      ← data wrapper
├── buy.types.d.ts         ← prop types
├── buy.constants.ts       ← static data, config
├── buy.module.scss        ← styles (only if needed)
└── index.ts               ← barrel export
```

This makes it obvious where everything for a feature lives. You don't hunt across the repo for related files.

---

## 4. Testability

### What

Testable code is structured so that units can be verified in isolation — without mounting a real browser, hitting a real API, or depending on a specific global state.

### Why

- Bugs caught earlier (unit test) cost less to fix than bugs caught later (production)
- Refactoring is safer — tests tell you if you broke something
- Tests document intended behaviour

### What makes code hard to test

```tsx
// ❌ Hard to test — tightly coupled to Redux, router, and a real API
function BuyPage() {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const goldRate = useSelector((s) => s.goldPrice.rate);

	useEffect(() => {
		fetch('/api/gold/price')
			.then((r) => r.json())
			.then((d) => dispatch(setGoldPriceDetails(d)));
	}, [dispatch]);

	return <button onClick={() => navigate('/status')}>Buy</button>;
}
// To test this you need: a Redux store, a Router, a mocked fetch, and a real component render
```

### The four levers of testability

---

**Lever 1 — Pure functions for logic**

```ts
// ❌ Logic buried in a component — cannot test without mounting
function BuyPage() {
  const goldGrams = 500 / 6200; // 0.0806...
  ...
}

// ✅ Extract to a pure function — testable with one line
export function calculateGoldGrams(amountRs: number, rateRsPerGm: number): number {
  return amountRs / rateRsPerGm;
}

// Test — no React needed
test('calculates gold grams correctly', () => {
  expect(calculateGoldGrams(500, 6200)).toBeCloseTo(0.0806);
});
```

**Lever 2 — Separate UI from data fetching (Container/Screen pattern)**

The screen component receives all data as props — it has no `useEffect`, no `dispatch`, no `useSelector`. You can test the UI with static props:

```tsx
// Testing the screen is trivial — no mocking needed
test('displays gold price', () => {
	render(<GoldBuy goldPrice={{ rate: 6200 }} userDetails={{ name: 'Alice' }} onBuy={vi.fn()} />);
	expect(screen.getByText('Rate: ₹6200/gm')).toBeInTheDocument();
});
```

**Lever 3 — Inject dependencies instead of importing them**

```tsx
// ❌ Hard to test — directly imports and calls a module
function SubmitButton() {
  const handleClick = () => {
    analytics.track('buy_clicked'); // directly calls global analytics
    navigate('/status');
  };
  return <button onClick={handleClick}>Buy</button>;
}

// ✅ Inject via props — test with a mock
function SubmitButton({ onTrack, onNavigate }: {
  onTrack:    (event: string) => void;
  onNavigate: (path: string) => void;
}) {
  return (
    <button onClick={() => { onTrack('buy_clicked'); onNavigate('/status'); }}>
      Buy
    </button>
  );
}

// Test
test('tracks analytics and navigates on click', async () => {
  const mockTrack    = vi.fn();
  const mockNavigate = vi.fn();

  render(<SubmitButton onTrack={mockTrack} onNavigate={mockNavigate} />);
  await userEvent.click(screen.getByRole('button', { name: 'Buy' }));

  expect(mockTrack).toHaveBeenCalledWith('buy_clicked');
  expect(mockNavigate).toHaveBeenCalledWith('/status');
});
```

**Lever 4 — Custom hooks are independently testable**

```ts
// useFetch.test.ts — no component needed
import { renderHook, waitFor } from '@testing-library/react';

import { useFetch } from './useFetch';

global.fetch = vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ name: 'Gold Ring' }) }));

test('fetches and returns data', async () => {
	const { result } = renderHook(() => useFetch('/api/products/1'));

	await waitFor(() => expect(result.current.loading).toBe(false));
	expect(result.current.data).toEqual({ name: 'Gold Ring' });
});
```

---

## SOLID Principles in React

The SOLID principles from OOP translate naturally into React patterns:

```
S — Single Responsibility  → One component/hook does one thing
O — Open/Closed            → Extend via props/composition, not modification
L — Liskov Substitution    → Components with the same prop interface are interchangeable
I — Interface Segregation  → Don't pass props a component doesn't need
D — Dependency Inversion   → Depend on abstractions (props/context), not concrete modules
```

**Single Responsibility**

```tsx
// ❌ Violates SRP — one component manages data, layout, and formatting
function OrderSummary() { /* fetches + transforms + renders */ }

// ✅ Each piece has one job
const useOrderData = () => { /* fetches */ };
const formatCurrency = (n: number) => `₹${n.toLocaleString('en-IN')}`;
function OrderSummary({ total }: { total: number }) { /* only renders */ }
```

**Open/Closed — extend via props, not modification**

```tsx
// ❌ Every new variant requires modifying the component
function Alert({ type }: { type: 'success' | 'error' | 'warning' | 'info' | 'purple' }) {
  if (type === 'purple') { ... } // keep adding cases
}

// ✅ Open to extension via className, closed to modification
function Alert({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('ib-rounded-lg ib-p-4', className)}>
      {children}
    </div>
  );
}

// Extend without touching Alert
<Alert className="ib-bg-green-50 ib-text-green-700">Success!</Alert>
<Alert className="ib-bg-red-50 ib-text-red-700">Error!</Alert>
```

---

## Code Smells to Avoid

```
┌────────────────────────────────────┬────────────────────────────────────┐
│  Smell                             │  Fix                               │
├────────────────────────────────────┼────────────────────────────────────┤
│ Component > 150 lines              │ Split by responsibility             │
│ Props list > 8 props               │ Group into objects or split component│
│ Nested ternaries in JSX            │ Early return / sub-components      │
│ useEffect with no dependency array │ Add deps — or question if needed   │
│ Copy-pasted JSX blocks             │ Extract to a component             │
│ Copy-pasted logic blocks           │ Extract to a custom hook           │
│ Direct store access in UI          │ Use selector hooks                 │
│ `any` type                         │ Define a proper interface          │
│ Magic strings/numbers              │ Named constants                    │
│ console.log left in code           │ Remove before commit               │
│ Component fetches AND renders      │ Container/Screen pattern           │
│ Import from deep internals         │ Import from barrel index.ts        │
└────────────────────────────────────┴────────────────────────────────────┘
```

---

## Q&A

**Q: What does "single responsibility" mean for a React component?**
A component should have one reason to change. If a component fetches data, transforms it, manages UI state, and renders — it has four reasons to change. Split it: a hook for fetching, a utility for transforming, local state for UI, and the component purely for rendering. Each piece changes only when its specific concern changes.

**Q: What is the Container/Screen (or Container/Presentational) pattern?**
Containers are Redux-connected components that own data fetching and dispatch. Screens (Presentational components) receive all data via props and only contain rendering logic and UI-level state. This separation makes screens trivially testable (pass props, assert output) and containers reusable across different UIs.

**Q: How does folder structure affect maintainability?**
Co-locating related files (component + types + constants + styles + tests in one folder) means a developer can understand and modify a feature without hunting across the codebase. A barrel `index.ts` in each folder defines the public API — internal refactoring never breaks outside imports.

**Q: What makes a component hard to test?**
Four things: (1) it imports and directly calls external modules (analytics, navigation, APIs) — inject them as props instead, (2) it reads from Redux directly — use the Container/Screen pattern so the screen gets plain props, (3) it has logic embedded in the render — extract to pure functions, (4) it has too many responsibilities — split it.

**Q: What is the difference between reusability and modularity?**
Reusability is about **using the same code in multiple places** — an `InfoRow` component used in 10 screens. Modularity is about **organising code so changes are isolated** — the buy feature's files are self-contained so you can modify buy without touching sell. You can have modular code that isn't reused, and reused code that's poorly modularized.

**Q: When should you NOT extract a reusable component?**
When it's used in only one place and is simple enough to read inline. Premature abstraction introduces indirection with no benefit. Extract when you feel actual duplication, not when you _think_ it might be reused someday ("rule of three" — extract after the third use).

**Q: What is dependency injection in the context of React?**
Passing dependencies (API clients, navigation functions, analytics trackers) as props or context values instead of importing and calling them directly inside a component. This allows tests to substitute mocks for the real implementations without module-level patching.

**Q: How do named constants improve both readability and testability?**
Readability: `KYC_STATUS.APPROVED` is self-documenting; `3` is not. Testability: a test can `import { KYC_STATUS }` and use the same constant as the implementation — if the value changes, both update together automatically.

**Q: What is the "rule of three" for extracting abstractions?**
Don't extract a reusable component or hook the first time you write something, or even the second. Wait until you write it a **third time**. By the third occurrence you understand the real requirements and can design a proper abstraction. Earlier abstractions often get it wrong and create inflexible APIs.

**Q: How do you keep JSX readable when there are many conditional branches?**
Use the early return pattern — check each loading/error/empty state at the top of the function and return early. The "happy path" render at the bottom is then clean and easy to read. Avoid nested ternaries in JSX — they are valid JavaScript but very hard to scan.

**Q: What is the Open/Closed principle and how does it apply to React components?**
Open/Closed means a module should be open to extension but closed to modification. In React: design components so callers can customize behaviour via props (especially `children`, `className`, render props, or callback props) without needing to modify the component's source code. Every new `if (type === 'new-variant')` branch inside a component violates this.

**Q: Why is `any` type considered a code smell in TypeScript/React?**
`any` disables type checking for that value — the entire point of TypeScript. A component or function that accepts `any` provides no contract — you can't know what it expects, and the compiler won't warn you if you pass the wrong thing. Every `any` is a potential runtime error that the compiler could have caught. Define explicit interfaces instead.
