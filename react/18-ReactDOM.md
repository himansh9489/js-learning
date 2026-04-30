# How React Works Behind the Scenes

React feels simple when writing components, but internally it follows a structured pipeline to keep the UI fast and predictable.

## 1) React Element Tree (Not the Real DOM Yet)

When you write JSX, React turns it into plain JavaScript objects called **React elements**.

```jsx
const el = <h1>Hello</h1>;
```

Conceptually becomes:

```js
{
  type: "h1",
  props: { children: "Hello" }
}
```

These elements describe *what the UI should look like*, not how to directly mutate the browser DOM.

## 2) Render Trigger: What Starts a Re-render?

React schedules work when:

- component `state` changes (`setState`, `useState` setter)
- parent re-renders with new props
- context value changes
- hooks like `useReducer` dispatch updates

React does **not** immediately mutate the DOM on every update. It first computes what should change.

## 3) Virtual Representation and Diffing

React keeps an in-memory representation of your UI tree. On update:

1. React builds a new tree for the affected subtree.
2. It compares old vs new tree (**diffing**).
3. It decides the minimal set of operations needed.

This avoids full page redraws.

### Diffing Heuristics

React uses practical rules (not a perfect minimum-edit algorithm):

- different element types => replace subtree
- same type => reuse node and update changed props
- list children depend on `key` for stable identity

Good keys let React preserve component state and reduce unnecessary remounts.

## 4) Reconciliation

**Reconciliation** is React deciding how to transform previous UI output into next UI output.

During reconciliation, React determines:

- which components should update
- which DOM nodes can be reused
- which nodes should be inserted/removed/reordered

This is where performance wins mostly happen.

## 5) Fiber Architecture (React 16+)

Fiber is React’s internal data structure + scheduling engine for reconciliation.

A **Fiber node** tracks:

- component type
- pending props/state
- effect flags (what work is needed)
- links to parent/child/sibling fibers

### Why Fiber Matters

Fiber allows React to:

- split rendering work into chunks
- prioritize urgent updates (like typing) over less urgent updates
- pause, resume, or restart render work before commit

This is a major reason modern React apps feel responsive under heavy UI updates.

## 6) Scheduling and Priorities

React assigns priorities (lanes) to updates:

- urgent: user input, interactions
- transition/background: non-blocking updates (for example with `startTransition`)

React can delay lower-priority work so the app remains interactive.

## 7) Render Phase vs Commit Phase

React update pipeline has two major phases:

### Render Phase (Pure Calculation)

- computes next tree
- can be interrupted in concurrent rendering
- should stay side-effect free

### Commit Phase (Applies Changes)

- updates real DOM
- applies refs
- runs lifecycle/effect hooks

Commit is synchronous and should be fast.

## 8) Effects and Lifecycle Timing

For function components:

- `useLayoutEffect`: runs after DOM mutation, before paint
- `useEffect`: runs after paint (non-blocking side effects)

For class components, lifecycle methods map to similar timing concepts.

## 9) Batching

React batches multiple state updates together to reduce unnecessary renders.

Example idea:

- several `setState` calls in one event loop turn into one render/commit cycle

This improves performance and avoids extra DOM work.

## 10) Component Model and State Isolation

React apps are component trees where each component:

- receives props from parent
- maintains local state (if needed)
- declares UI as a function of state/props

This modular model makes code reusable and easier to reason about.

## 11) Why React Is Fast in Practice

React performance is usually good because it:

- avoids direct manual DOM mutations by developers
- diffs and updates only changed parts
- uses keys to track list identity
- batches updates
- schedules work by priority via Fiber

## 12) Common Misconceptions

- React does **not** always re-render the entire page DOM.
- Virtual DOM itself is not magic speed; efficient reconciliation + scheduling are the real win.
- Re-rendering a component is not automatically expensive; expensive commits and heavy computations are.

## Quick Mental Model

Think of React as:

1. **Describe UI** (JSX)
2. **Detect updates** (state/props/context changes)
3. **Compute differences** (reconciliation)
4. **Apply minimal DOM updates** (commit)
5. **Run side effects** (`useEffect` / lifecycle)

That is the core behind-the-scenes loop.