# Higher-Order Components (HOC)

---

## What

A Higher-Order Component is a **function that takes a component and returns a new, enhanced component**.

```
const EnhancedComponent = withFeature(WrappedComponent);
```

It is not a React API — it is a **pattern** derived from higher-order functions in functional programming. HOCs do not modify the input component; they compose it inside a new wrapper component.

```jsx
// Shape of every HOC
function withSomething(WrappedComponent) {
	return function EnhancedComponent(props) {
		// inject extra behaviour, props, or guards
		return <WrappedComponent {...props} />;
	};
}
```

---

## Why

HOCs solve the **cross-cutting concern** problem: logic that many components need but that doesn't belong to any single one of them.

Without HOCs you would either:

- **Copy-paste** the same logic (auth check, loading spinner, logging) into every component, or
- **Prop-drill** configuration down through many layers

HOCs let you express "every component that uses this feature gets this behaviour automatically" — in one place.

Common use-cases:

- Authentication / authorization guards
- Loading / error state wrappers
- Analytics event tracking
- Injecting theme, locale, or feature-flag props
- Enforcing layout or scroll-reset on route changes
- Connecting to a global store (what Redux's `connect()` did)

---

## When to Use

| Situation                                                                        | Recommendation                                                |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Existing codebase already uses HOC pattern                                       | Stay consistent — add HOCs                                    |
| Class component codebase (pre hooks)                                             | HOC is the right tool                                         |
| Behaviour needs to wrap the _render tree_ (e.g., error boundary around a screen) | HOC is natural                                                |
| You need to conditionally render a different component entirely                  | HOC (hooks can't do `return <Redirect />` before other hooks) |
| Logic is pure stateful reuse with no render wrapping                             | Prefer a custom hook                                          |
| Multiple HOCs need to be chained                                                 | Consider hooks to avoid wrapper hell                          |

---

## When NOT to Use

- When a **custom hook** can express the same logic without wrapping the component tree
- When you control the component and can just add the logic directly
- When the HOC is only ever used once (no reuse = no benefit)

---

## How to Write a HOC Correctly

### The three obligations of a good HOC

1. **Forward all props** — `{...props}` so the wrapped component gets everything its caller passed
2. **Forward refs** — use `React.forwardRef` so `ref` is not lost
3. **Copy static methods** — use `hoist-non-react-statics` so class statics are preserved
4. **Set `displayName`** — makes the component readable in React DevTools

```jsx
import { forwardRef } from 'react';

function withFeature(WrappedComponent) {
	const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';

	const EnhancedComponent = forwardRef((props, ref) => {
		// your injected logic here
		return <WrappedComponent {...props} ref={ref} />;
	});

	EnhancedComponent.displayName = `withFeature(${displayName})`;
	return EnhancedComponent;
}
```

---

## Practical Examples

---

### 1. Auth Guard — `withAuth`

Redirects unauthenticated users before the wrapped component ever renders.

```jsx
import { Navigate } from 'react-router-dom';

function withAuth(Component) {
	function AuthenticatedComponent(props) {
		const token = localStorage.getItem('authToken');

		if (!token) {
			return <Navigate to="/login" replace />;
		}

		return <Component {...props} />;
	}

	AuthenticatedComponent.displayName = `withAuth(${Component.displayName || Component.name})`;
	return AuthenticatedComponent;
}

// Usage
const ProtectedDashboard = withAuth(Dashboard);

// In routes
<Route path="/dashboard" element={<ProtectedDashboard />} />;
```

---

### 2. Loading / Error State — `withAsyncState`

Wraps any data-displaying component with a loading spinner and error message.

```jsx
function withAsyncState(Component) {
	return function WithAsyncState({ isLoading, error, ...rest }) {
		if (isLoading) {
			return (
				<div className="flex items-center justify-center h-40">
					<span className="animate-spin w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent" />
				</div>
			);
		}

		if (error) {
			return (
				<div className="text-red-500 p-4 text-center">
					<p>Something went wrong.</p>
					<p className="text-sm">{error.message}</p>
				</div>
			);
		}

		return <Component {...rest} />;
	};
}

// Usage
function UserList({ users }) {
	return (
		<ul>
			{users.map((u) => (
				<li key={u.id}>{u.name}</li>
			))}
		</ul>
	);
}

const UserListWithState = withAsyncState(UserList);

function Page() {
	const { data, isLoading, error } = useFetchUsers();

	return <UserListWithState users={data} isLoading={isLoading} error={error} />;
}
```

---

### 3. Analytics Tracking — `withTracking`

Fires a tracking event every time the component mounts (page view / screen view).

```jsx
import { useEffect } from 'react';

function withTracking(Component, eventName) {
	function TrackedComponent(props) {
		useEffect(() => {
			analytics.track(eventName, { timestamp: Date.now() });
		}, []);

		return <Component {...props} />;
	}

	TrackedComponent.displayName = `withTracking(${Component.displayName || Component.name})`;
	return TrackedComponent;
}

// Usage — zero change to the original component
const TrackedCheckout = withTracking(Checkout, 'checkout_viewed');
```

---

### 4. Feature Flag — `withFeatureFlag`

Renders a fallback if a feature is disabled — configuration-driven.

```jsx
function withFeatureFlag(Component, flagKey, Fallback = null) {
	function FeatureFlagComponent(props) {
		const flags = useFeatureFlags(); // custom hook or context

		if (!flags[flagKey]) {
			return Fallback ? <Fallback {...props} /> : null;
		}

		return <Component {...props} />;
	}

	FeatureFlagComponent.displayName = `withFeatureFlag(${Component.displayName || Component.name}, ${flagKey})`;
	return FeatureFlagComponent;
}

// Usage
const NewPaymentFlow = withFeatureFlag(PaymentV2, 'new_payment_ui', PaymentV1);
```

---

### 5. Permissions — `withPermission`

Fine-grained role/permission check before rendering.

```jsx
function withPermission(Component, requiredRole) {
	return function PermissionGuard(props) {
		const { user } = useCurrentUser();

		if (!user?.roles?.includes(requiredRole)) {
			return <p className="text-gray-400 p-4">You do not have access to this section.</p>;
		}

		return <Component {...props} />;
	};
}

// Usage
const AdminPanel = withPermission(Panel, 'admin');
```

---

### 6. Composing (Chaining) Multiple HOCs

HOCs compose like function calls. This becomes unreadable quickly — use a `compose` utility.

```jsx
// Without compose — deeply nested, reads right-to-left
const Enhanced = withAuth(withTracking(withAsyncState(UserList), 'user_list_viewed'));

// With a compose helper — reads top-to-bottom
const compose = (...fns) => (x) => fns.reduceRight((v, f) => f(v), x);

const Enhanced = compose(
  withAuth,
  (C) => withTracking(C, 'user_list_viewed'),
  withAsyncState,
)(UserList);
```

---

## HOC vs Custom Hook — Decision Guide

| Concern                                          | HOC                           | Custom Hook                     |
| ------------------------------------------------ | ----------------------------- | ------------------------------- |
| Redirecting / rendering a different component    | ✅ Natural                    | ❌ Can't return JSX from a hook |
| Wrapping the entire render tree (error boundary) | ✅ Natural                    | ❌ Not possible                 |
| Injecting props automatically                    | ✅ Can inject                 | ✅ Can return values            |
| Logic reuse without render wrapping              | ⚠️ Overkill                   | ✅ Preferred                    |
| Using in class components                        | ✅ Works                      | ❌ Hooks don't work in classes  |
| DevTools visibility                              | ⚠️ Needs displayName          | ✅ Shows hook name              |
| Composability                                    | ⚠️ Wrapper hell               | ✅ Compose hooks inline         |
| TypeScript support                               | ⚠️ Prop types can get complex | ✅ Straightforward generics     |

**Rule of thumb:** If the behaviour wraps the _output_ (what renders), use a HOC. If the behaviour is purely about _logic_ (data, side effects), use a custom hook.

---

## HOC vs Render Props

Both solve the same problem — reusable logic. HOCs do it at the component definition level; render props do it at the JSX level.

```jsx
// HOC approach — wraps at definition time
const EnhancedList = withData(List);
<EnhancedList />

// Render prop approach — wraps at render time
<DataProvider render={(data) => <List items={data} />} />

// Modern equivalent with hooks — cleanest
function List() {
  const data = useData();
  return <ul>{data.map(...)}</ul>;
}
```

---

## Pitfalls

### 1. Prop Collision

If the HOC injects a prop with the same name as one passed by the caller, one silently overwrites the other.

```jsx
// HOC injects `user`, but caller also passes `user`
const Enhanced = withUser(Profile);
<Enhanced user={overrideUser} />; // which `user` does Profile receive?

// Fix: let caller override HOC's injected props
function withUser(Component) {
	return function (props) {
		const user = useCurrentUser();
		return <Component user={user} {...props} />; // caller's props win
	};
}
```

### 2. Don't Create HOCs Inside Render

A new component type is created on every render, causing React to unmount and remount the inner component every time.

```jsx
// ❌ WRONG — new component type on every Parent render
function Parent() {
  const Enhanced = withAuth(Child); // recreated every render
  return <Enhanced />;
}

// ✅ CORRECT — define outside the render function
const Enhanced = withAuth(Child);
function Parent() {
  return <Enhanced />;
}
```

### 3. Ref Forwarding

Plain HOCs swallow `ref`. Always wrap with `forwardRef` if the inner component needs to expose a ref.

```jsx
const Enhanced = forwardRef((props, ref) => <WrappedComponent {...props} ref={ref} />);
```

### 4. Wrapper Hell

Six HOCs deep produces six extra nodes in the DevTools tree:

```
withAuth(
  withTracking(
    withPermission(
      withFeatureFlag(
        withAsyncState(
          withTheme(MyComponent)
        )
      )
    )
  )
)
```

Use `compose` to flatten the visual code, and set `displayName` on each HOC so DevTools shows readable names.

---

## Q&A

**Q: What is a Higher-Order Component?**
A function that takes a component as input and returns a new component. It is a pure function — it doesn't mutate the original component, it wraps it. Used to add cross-cutting concerns like authentication, logging, or loading state.

**Q: How is a HOC different from a regular component?**
A regular component takes props and returns JSX. A HOC takes a _component_ (not props) and returns a _component_. It operates at the meta-level — it's a factory for components.

**Q: What are the main use-cases for HOCs?**
Authentication/authorization guards, loading/error boundaries, analytics tracking, feature flags, injecting context/store data (Redux `connect`), layout wrappers, scroll-to-top on route change.

**Q: What is "wrapper hell"?**
When many HOCs are composed together, each adds a level to the React component tree. In DevTools you see deeply nested anonymous components, making debugging hard. Mitigated by setting `displayName` on every HOC and using a `compose` helper.

**Q: What is the prop collision problem?**
A HOC might inject a prop (e.g., `user`) that the caller also passes. One value silently overwrites the other. Fix: document injected props clearly and decide on an explicit precedence (HOC-first or caller-first) by controlling spread order.

**Q: Why should you never define a HOC inside a render/component function?**
React uses referential equality to decide whether a component type changed. If you create the HOC inside render, a _new component type_ is created on every render, so React unmounts and remounts the inner component every time — destroying all its state and causing performance issues.

**Q: How do HOCs relate to React's `connect()` from Redux?**
`connect(mapStateToProps, mapDispatchToProps)(Component)` is a HOC. It reads from the Redux store and injects the mapped state and dispatch functions as props into the wrapped component. In modern Redux, `useSelector` and `useDispatch` hooks replace it.

**Q: When would you choose a HOC over a custom hook today?**

- When you need to _conditionally render a completely different component_ (e.g., redirect) — hooks can't return JSX
- When wrapping a class component that can't use hooks
- When the pattern is already established in the codebase
- When wrapping with an error boundary (error boundaries must be class components or wrapped that way)

**Q: Can a HOC use hooks internally?**
Yes. As long as the HOC returns a _function component_ (not a class), it can call any hooks inside that function component.

```jsx
function withData(Component) {
	return function WithData(props) {
		const data = useFetchData(); // hooks are fine here
		return <Component data={data} {...props} />;
	};
}
```

**Q: How do you handle TypeScript with HOCs?**
You need to type the input props, the injected props, and the output props separately.

```tsx
interface InjectedProps {
	user: User;
}

function withUser<TProps extends InjectedProps>(Component: React.ComponentType<TProps>) {
	type OuterProps = Omit<TProps, keyof InjectedProps>;

	return function WithUser(props: OuterProps) {
		const user = useCurrentUser();
		return <Component {...(props as TProps)} user={user} />;
	};
}
```

**Q: How do HOCs compare to render props?**
Both are patterns for reusing stateful logic. HOCs inject behaviour at _definition time_ (outside JSX). Render props inject behaviour at _render time_ (inside JSX via a function prop). Both are largely superseded by custom hooks, but HOCs are still useful when you need to wrap the render tree rather than just reuse logic.

**Q: What is the role of `displayName` in a HOC?**
React DevTools uses `displayName` to label components in the tree. Without it, wrapped components show as `Component` or the function name, making debugging hard. Convention is `withFeature(OriginalName)`.

```jsx
EnhancedComponent.displayName = `withAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
```
