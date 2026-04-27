# Virtual DOM and Rendering Internals

## Virtual DOM
A lightweight in-memory representation of the real DOM used by React to decide efficient UI updates.

## Reconciliation
Process where React compares previous and next virtual DOM trees to decide what changed.

## Diff Algorithm
- React compares elements by type.
- Keys help identify list items correctly.
- Stable keys reduce unnecessary re-renders and UI bugs.

## React Fiber
Fiber is React's modern rendering engine.
- Enables scheduling and prioritization.
- Allows interruptible rendering for smoother UX.

## Render Flow
1. State/props change triggers render.
2. React computes new virtual DOM (render phase).
3. React applies minimal DOM updates (commit phase).

## Interview Tip
Say: "React does not update full DOM every time; it computes minimal updates using reconciliation and Fiber scheduling."
