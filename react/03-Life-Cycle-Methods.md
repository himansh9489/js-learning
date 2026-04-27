# Life Cycle Methods of Components

## Class Component Lifecycle

### Mounting
- `constructor()`
- `static getDerivedStateFromProps()`
- `render()`
- `componentDidMount()`

### Updating
- `static getDerivedStateFromProps()`
- `shouldComponentUpdate()`
- `render()`
- `getSnapshotBeforeUpdate()`
- `componentDidUpdate()`

### Unmounting
- `componentWillUnmount()`

### Error Handling
- `static getDerivedStateFromError()`
- `componentDidCatch()`

## Why It Matters
- Helps understand old React projects.
- Builds strong understanding of render/update flow.
- Makes hook migration easier.

## Hook Mapping (Modern React)
- Mount/update side effects -> `useEffect`.
- Cleanup/unmount -> return cleanup from `useEffect`.
- Error boundaries still use class components (or framework wrappers).

## Interview Tip
Explain lifecycle as:
1) Component appears (mount),
2) React responds to changes (update),
3) Component is removed (unmount).
