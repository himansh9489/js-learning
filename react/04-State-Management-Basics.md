# State Management (State, Props, Props Drilling, Context)

## State vs Props
- **State**: mutable data owned by a component.
- **Props**: read-only inputs passed from parent to child.

## Data Flow in React
React follows one-way data flow: parent -> child.

## Props Drilling
Passing props through many intermediate components that do not directly use them.

## Why Props Drilling Is a Problem
- Harder to maintain.
- More boilerplate.
- Components become tightly coupled.

## Solutions
- Lift state only where needed.
- Use Context for shared app-level data.
- Use Redux/Zustand for larger global state needs.

## Context Best Practices
- Keep context focused (auth, theme, language).
- Split large context into smaller ones.
- Memoize context value to reduce re-renders.

## Interview Tip
Say: "I choose local state first, then Context, then external store when complexity grows."
