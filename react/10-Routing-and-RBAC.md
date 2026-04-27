# Routing and RBAC in React

## Routing Basics (`react-router`)
- Define route-to-component mapping.
- Support nested routes and dynamic routes.

## Protected Routes
Wrap private routes with auth checks.

## RBAC (Role-Based Access Control)
Authorize users based on role/permissions (admin, editor, user).

## Example Pattern
```jsx
function ProtectedRoute({ allowedRoles, user, children }) {
  if (!user) return <Navigate to="/login" replace />;
  if (!allowedRoles.includes(user.role)) return <Navigate to="/forbidden" replace />;
  return children;
}
```

## Query Params and Dynamic Routes
- Dynamic route: `/users/:id`
- Query params: `/search?q=react`
- Use `useParams` and `useSearchParams`.

## Interview Tip
Differentiate authentication (who you are) from authorization (what you can access).
