# Uncontrolled Components in React

---

## Table of Contents

1. [What is an Uncontrolled Component?](#1-what-is-an-uncontrolled-component)
2. [Controlled vs Uncontrolled — Side-by-Side](#2-controlled-vs-uncontrolled--side-by-side)
3. [How the DOM Owns the State](#3-how-the-dom-owns-the-state)
4. [useRef — The key tool](#4-useref--the-key-tool)
5. [defaultValue and defaultChecked](#5-defaultvalue-and-defaultchecked)
6. [Practical Examples](#6-practical-examples)
7. [When to Use Uncontrolled Components](#7-when-to-use-uncontrolled-components)
8. [When NOT to Use](#8-when-not-to-use)
9. [File Input — Always Uncontrolled](#9-file-input--always-uncontrolled)
10. [Integrating with Third-party Libraries](#10-integrating-with-third-party-libraries)
11. [React Hook Form — the modern middle ground](#11-react-hook-form--the-modern-middle-ground)
12. [Uncontrolled vs Controlled Decision Chart](#12-uncontrolled-vs-controlled-decision-chart)
13. [Q&A — Interview Prep](#13-qa--interview-prep)

---

## 1. What is an Uncontrolled Component?

In React there are two ways to handle form inputs:

| Approach | Who owns the value | How you read it |
|---|---|---|
| **Controlled** | React state (`useState`) | From state on every keystroke |
| **Uncontrolled** | The DOM itself | Via a `ref` when you need it |

An **uncontrolled component** is one where you do **not** bind a `value` prop to React state. The browser's native DOM element holds the current value, and React reads it via a `ref` only when required (e.g., on form submit).

```
Controlled flow:
  User types → onChange fires → setState → React re-renders → input value from state

Uncontrolled flow:
  User types → DOM updates itself → React does nothing
  On submit → ref.current.value → read DOM value once
```

---

## 2. Controlled vs Uncontrolled — Side-by-Side

```tsx
// ─── CONTROLLED ───────────────────────────────────────────────
function ControlledInput() {
  const [name, setName] = useState('');

  return (
    <input
      value={name}                          // React drives the value
      onChange={e => setName(e.target.value)} // every keystroke updates state
    />
  );
}
// Re-renders on every keystroke.
// React always knows the current value.


// ─── UNCONTROLLED ─────────────────────────────────────────────
function UncontrolledInput() {
  const nameRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    console.log(nameRef.current?.value); // read once, on demand
  };

  return (
    <>
      <input ref={nameRef} defaultValue="" /> {/* DOM owns the value */}
      <button onClick={handleSubmit}>Submit</button>
    </>
  );
}
// No re-renders while the user types.
// React only reads the value when explicitly asked.
```

---

## 3. How the DOM Owns the State

In a controlled component, React's VDOM and the real DOM are always in sync:

```
React state ──► renders ──► DOM input value
                  ▲
              onChange
                  │
              User types
```

In an uncontrolled component, the DOM manages itself. React has no knowledge of what is currently in the input:

```
DOM input ◄──── User types
    │
    └── ref.current.value  ← React reads when needed (e.g., submit)
```

There is no `value` prop binding, no `onChange` handler, no re-render on keystroke. The DOM does what browsers have always done — maintain form field state natively.

---

## 4. useRef — The Key Tool

`useRef` returns a mutable object `{ current: ... }` that persists across renders without causing re-renders when mutated. When attached to a DOM element via the `ref` prop, `ref.current` points directly to that DOM node.

```tsx
const inputRef = useRef<HTMLInputElement>(null);

// After mount, inputRef.current is the actual <input> DOM element
// You can call any native DOM API on it:
inputRef.current?.focus();
inputRef.current?.value;       // read current value
inputRef.current?.select();    // select all text
inputRef.current?.setCustomValidity('Invalid'); // native validation
```

### ref lifecycle

```
Mount   → ref.current = DOM node
Update  → ref.current stays the same DOM node (unchanged)
Unmount → ref.current = null
```

---

## 5. defaultValue and defaultChecked

`value` and `checked` are the **controlled** props — they lock the DOM to React's state.

`defaultValue` and `defaultChecked` are the **uncontrolled** props — they set the initial value and then step aside; the DOM takes over from there.

```tsx
// Controlled — React owns every keystroke
<input value={state} onChange={e => setState(e.target.value)} />

// Uncontrolled — DOM owns it after initial render
<input defaultValue="Initial text" ref={inputRef} />

// Checkbox (uncontrolled)
<input type="checkbox" defaultChecked={true} ref={checkRef} />

// Select (uncontrolled)
<select defaultValue="upi" ref={selectRef}>
  <option value="upi">UPI</option>
  <option value="card">Card</option>
</select>
```

**Important:** Never set both `value` and `defaultValue` on the same input. If you supply `value` without `onChange`, React will warn about a read-only field.

---

## 6. Practical Examples

### Example 1 — Simple login form (uncontrolled)

```tsx
import React, { useRef } from 'react';

function LoginForm() {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const email    = emailRef.current?.value ?? '';
    const password = passwordRef.current?.value ?? '';

    if (!email || !password) {
      alert('Please fill in all fields');
      return;
    }

    console.log('Login:', { email, password });
    // call API...
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        ref={emailRef}
        type="email"
        defaultValue=""
        placeholder="Email"
      />
      <input
        ref={passwordRef}
        type="password"
        defaultValue=""
        placeholder="Password"
      />
      <button type="submit">Login</button>
    </form>
  );
}
```

Zero re-renders while the user types. Email and password are read once on submit.

---

### Example 2 — Reading multiple fields with a single form ref

```tsx
function ProfileForm() {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // FormData reads all named fields from the DOM at once
    const data = new FormData(formRef.current!);
    const name  = data.get('name') as string;
    const phone = data.get('phone') as string;

    console.log({ name, phone });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <input name="name"  defaultValue="" placeholder="Full name" />
      <input name="phone" defaultValue="" placeholder="Phone"     />
      <button type="submit">Save</button>
    </form>
  );
}
```

`FormData` is a native browser API that reads all named inputs from a form element. A clean alternative to attaching individual `ref`s to each field.

---

### Example 3 — Auto-focus on mount

```tsx
function SearchBar() {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus(); // focus the input when the component mounts
  }, []);

  return <input ref={inputRef} type="search" placeholder="Search…" />;
}
```

---

### Example 4 — Imperative reset after submit

```tsx
function CommentBox() {
  const textRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    const comment = textRef.current?.value ?? '';
    submitComment(comment);

    // Imperative reset — no need to track state for this
    if (textRef.current) textRef.current.value = '';
  };

  return (
    <>
      <textarea ref={textRef} defaultValue="" placeholder="Write a comment…" />
      <button onClick={handleSubmit}>Post</button>
    </>
  );
}
```

---

### Example 5 — Mixed: uncontrolled field, controlled summary

Sometimes only one field needs live feedback; others can be uncontrolled:

```tsx
function BuyGoldForm() {
  // Only the amount needs live validation feedback — controlled
  const [amount, setAmount] = useState('');
  const error = Number(amount) < 10 && amount !== '' ? 'Minimum ₹10' : '';

  // Payment note is uncontrolled — no real-time feedback needed
  const noteRef = useRef<HTMLInputElement>(null);

  const handleSubmit = () => {
    const note = noteRef.current?.value ?? '';
    processBuy({ amount: Number(amount), note });
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="Amount (₹)"
      />
      {error && <span>{error}</span>}

      <input
        ref={noteRef}
        defaultValue=""
        placeholder="Note (optional)"
      />

      <button type="submit" disabled={!!error}>Buy Gold</button>
    </form>
  );
}
```

---

## 7. When to Use Uncontrolled Components

### ✅ Simple forms where you only need the value on submit

Login, search, feedback forms — if you have no real-time validation or dependent UI, there is no reason to track every keystroke in state.

### ✅ Performance-sensitive forms with many fields

A controlled 50-field form re-renders the entire form on every keystroke. Uncontrolled reads all values once at the end.

### ✅ Integrating with non-React (imperative) code

Libraries like D3, legacy jQuery plugins, or canvas editors that directly manipulate DOM nodes. `ref` gives you the DOM node to hand off.

### ✅ File inputs

`<input type="file">` **cannot** be controlled — the browser owns the file list for security reasons. Always use `ref` for file inputs.

### ✅ When you need to call native DOM APIs

Focus management, scroll, text selection, custom validity messages — all require a direct DOM node handle, which is what `ref` provides.

---

## 8. When NOT to Use

### ❌ Real-time validation or feedback

If you need to show an error as the user types, or update another part of the UI based on the current input value, you need controlled state.

```tsx
// Needs controlled — error message depends on current value
<input value={email} onChange={e => setEmail(e.target.value)} />
{!isValidEmail(email) && <span>Invalid email</span>}
```

### ❌ Derived or conditional fields

If field B's value, visibility, or options depend on field A's current value, you need to read A's value live — controlled.

### ❌ Multi-step forms sharing state across steps

If values need to be persisted in a shared store or passed between components, state is the right place — not scattered refs.

### ❌ When the value must be externally set or reset

If a parent component needs to programmatically clear or prefill a field, controlled components (via `value` prop) are cleaner. Resetting uncontrolled fields requires direct DOM mutation (`ref.current.value = ''`), which is imperative and harder to test.

---

## 9. File Input — Always Uncontrolled

The `<input type="file">` element is a special case. The browser deliberately prevents JavaScript from setting its `value` for security reasons (you cannot fake a file path). It is **always** uncontrolled.

```tsx
function FileUpload() {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    console.log('File name:', file.name);
    console.log('File size:', file.size);
    console.log('File type:', file.type);

    const formData = new FormData();
    formData.append('document', file);
    // fetch('/upload', { method: 'POST', body: formData })
  };

  return (
    <>
      {/* value prop cannot be set on file inputs — always use ref */}
      <input type="file" ref={fileRef} accept=".pdf,.jpg,.png" />
      <button onClick={handleUpload}>Upload</button>
    </>
  );
}
```

To "reset" a file input after upload, you must imperatively clear it:

```tsx
if (fileRef.current) fileRef.current.value = '';
```

---

## 10. Integrating with Third-party Libraries

Many non-React libraries (charts, rich-text editors, maps) need to own a DOM node. `ref` is the bridge:

```tsx
import { useRef, useEffect } from 'react';
import SignaturePad from 'signature_pad'; // hypothetical third-party lib

function SignatureCapture() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef    = useRef<SignaturePad | null>(null);

  useEffect(() => {
    if (canvasRef.current) {
      // Hand the DOM node to the third-party library
      padRef.current = new SignaturePad(canvasRef.current);
    }
    return () => padRef.current?.off(); // cleanup
  }, []);

  const getData = () => {
    return padRef.current?.toDataURL(); // read the signature as base64
  };

  return (
    <>
      <canvas ref={canvasRef} width={400} height={200} />
      <button onClick={getData}>Save Signature</button>
    </>
  );
}
```

The canvas element is the DOM node; the third-party library draws into it imperatively. React should not try to control this — the ref hands ownership to the library.

---

## 11. React Hook Form — The Modern Middle Ground

[React Hook Form](https://react-hook-form.com/) uses an **uncontrolled approach internally** (refs + native form APIs) but surfaces a clean, validation-friendly API. This gives you the performance of uncontrolled inputs with the power of controlled validation.

```tsx
import { useForm } from 'react-hook-form';

interface FormValues {
  amount: string;
  note: string;
}

function BuyForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>();

  const onSubmit = (data: FormValues) => {
    console.log(data); // { amount: '500', note: 'Monthly SIP' }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('amount', {
          required: 'Amount is required',
          min: { value: 10, message: 'Minimum ₹10' },
        })}
        type="number"
        placeholder="Amount (₹)"
      />
      {errors.amount && <span>{errors.amount.message}</span>}

      <input
        {...register('note')}
        placeholder="Note (optional)"
      />

      <button type="submit">Buy Gold</button>
    </form>
  );
}
```

Under the hood `register` attaches a `ref` to each input (uncontrolled). Validation runs on submit (or on blur/change, configurable). The form only re-renders when validation errors change — not on every keystroke.

---

## 12. Uncontrolled vs Controlled Decision Chart

```
Does the UI need to react to input value in real time?
  (live validation, conditional fields, character counter, dependent dropdowns)
  │
  ├─ YES → Controlled  (useState + value + onChange)
  │
  └─ NO
      │
      Is it a file input?
        ├─ YES → Uncontrolled (ref, always)
        │
        └─ NO
            │
            Is it a large form (10+ fields) or performance-sensitive?
              ├─ YES → Uncontrolled or React Hook Form
              │
              └─ NO
                  │
                  Does a parent/sibling need the value live?
                    ├─ YES → Controlled (lift state up)
                    └─ NO  → Either works; uncontrolled is simpler
```

---

## 13. Q&A — Interview Prep

---

**Q: What is an uncontrolled component in React?**

An uncontrolled component is a form input whose value is **owned by the DOM**, not React state. Instead of binding `value` and `onChange`, you attach a `ref` to the element and read its value imperatively (e.g., on form submit) via `ref.current.value`. React does not track the field's value between keystrokes.

---

**Q: What is the difference between a controlled and uncontrolled component?**

| | Controlled | Uncontrolled |
|---|---|---|
| Value owned by | React state | DOM |
| How value is set | `value` prop | `defaultValue` prop (initial only) |
| How value is read | From state directly | `ref.current.value` |
| Re-renders on keystroke | Yes | No |
| Real-time validation | Easy | Requires extra work |
| Imperative DOM ops | Not needed | Natural |

---

**Q: When would you choose an uncontrolled component over a controlled one?**

- You only need the value at submit time (simple forms, search bars, login forms)
- The form has many fields and you want to avoid re-renders on every keystroke
- You are integrating with a third-party library that needs to own the DOM node
- The input is a file input (which is always uncontrolled)
- You want to call native DOM APIs (focus, select, scrollIntoView)

---

**Q: What is `defaultValue` and how is it different from `value`?**

`value` is a controlled prop — it binds the input's value to React state and React re-renders are required to update it. `defaultValue` is an uncontrolled prop — it sets the initial value on mount and then the DOM manages subsequent changes. Changing `defaultValue` after mount has no effect (unlike `value`).

---

**Q: How do you reset an uncontrolled input?**

Imperatively, by mutating `ref.current.value`:

```tsx
const inputRef = useRef(null);
// ...
inputRef.current.value = ''; // direct DOM mutation
```

Or by changing the component's `key` prop, which causes React to unmount and remount the element, resetting all DOM state:

```tsx
const [formKey, setFormKey] = useState(0);
// ...
<input key={formKey} defaultValue="" ref={inputRef} />
<button onClick={() => setFormKey(k => k + 1)}>Reset</button>
```

---

**Q: Why can't you use a controlled `value` on a `<input type="file">`?**

The browser intentionally prevents JavaScript from setting the value of a file input for security reasons — it would allow a malicious page to fake a file path and silently send files. The file list is read-only from JavaScript's perspective. You can only read `inputRef.current.files` but never set `inputRef.current.value` to a file path. File inputs are therefore always uncontrolled.

---

**Q: What is `ref.current` and when is it populated?**

`ref.current` is the mutable property of the ref object returned by `useRef`. When a `ref` is attached to a JSX element, React sets `ref.current` to the actual DOM node after the component mounts. It remains the same DOM node through updates and is set back to `null` when the component unmounts.

---

**Q: Can you mix controlled and uncontrolled fields in the same form?**

Yes. It is common practice to control only the fields that require real-time feedback (e.g., an amount field with live validation) and leave others uncontrolled (e.g., an optional note field). Each field independently chooses its approach.

---

**Q: What is the problem with using both `value` and `defaultValue` on the same input?**

React will warn and the behaviour is undefined. `value` makes the field controlled; `defaultValue` is only relevant for uncontrolled fields. Use one or the other — never both.

---

**Q: What is React Hook Form and how does it relate to uncontrolled components?**

React Hook Form is a form library that uses the **uncontrolled** pattern internally — it attaches refs to inputs and reads values via the native DOM rather than tracking every keystroke in state. This makes it highly performant (minimal re-renders). It then layers a validation and error-reporting API on top, giving you the ergonomics of a controlled form without the re-render cost.

---

**Q: Does using `ref` to read a value make a component uncontrolled?**

Not necessarily. You can attach a `ref` to a controlled input too — for example, to call `focus()` on an input that is also controlled via `value`/`onChange`. What makes a component uncontrolled is the absence of the `value` prop binding to state, not the presence of a `ref`.

---

**Q: What are the risks of uncontrolled components?**

1. **Stale reads** — if you read `ref.current.value` at the wrong time, you might get an outdated value.
2. **Hard to test** — testing libraries (like React Testing Library) are designed around controlled inputs; uncontrolled inputs require firing native DOM events.
3. **Harder to sync** — if two parts of the UI need the same value, state is a better source of truth than a ref.
4. **No React-aware change history** — since React doesn't track the value, debugging with React DevTools shows nothing about the field's current value.
