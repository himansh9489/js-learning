# JavaScript Notes — Part 3

> Output-based questions, browser APIs, performance, and advanced concepts.

---

## Table of Contents

1. [Checking if a Property Exists in an Object](#1-checking-if-a-property-exists-in-an-object)
2. [Check If a Number Is Even (Without % or /)](#2-check-if-a-number-is-even-without--or-)
3. [NaN and typeof NaN](#3-nan-and-typeof-nan)
4. [Comparing Objects](#4-comparing-objects)
5. [Variable Hoisting & Scope (IIFE)](#5-variable-hoisting--scope-iife)
6. [`this` Keyword Gotchas](#6-this-keyword-gotchas)
7. [bind() Chaining](#7-bind-chaining)
8. [IIFE — `var` Variable Leaking](#8-iife--var-variable-leaking)
9. [`this` Inside Nested Functions](#9-this-inside-nested-functions)
10. [Automatic Semicolon Insertion (ASI) with `return`](#10-automatic-semicolon-insertion-asi-with-return)
11. [Floating Point Comparison](#11-floating-point-comparison)
12. [Promise Basics — Execution Order](#12-promise-basics--execution-order)
13. [Promise Chaining with `.then` and `.catch`](#13-promise-chaining-with-then-and-catch)
14. [Rewriting Promise Chains with Async/Await](#14-rewriting-promise-chains-with-asyncawait)
15. [Promise Recursion](#15-promise-recursion)
16. [Object Reference Equality](#16-object-reference-equality)
17. [try/catch Variable Scope](#17-trycatch-variable-scope)
18. [Prototype `valueOf` Override](#18-prototype-valueof-override)
19. [Type Coercion — Tricky Outputs](#19-type-coercion--tricky-outputs)
20. [`null` Comparisons](#20-null-comparisons)
21. [Method Chaining Pattern](#21-method-chaining-pattern)
22. [API Response Caching](#22-api-response-caching)
23. [AJAX with XMLHttpRequest](#23-ajax-with-xmlhttprequest)
24. [Axios Interceptors](#24-axios-interceptors)
25. [Axios vs Fetch](#25-axios-vs-fetch)
26. [Escape Characters in Strings](#26-escape-characters-in-strings)
27. [Meta Tags](#27-meta-tags)
28. [SSR vs CSR](#28-ssr-vs-csr)
29. [Asset Optimisation](#29-asset-optimisation)
30. [Writing Performant Code](#30-writing-performant-code)
31. [CORBS vs CORS](#31-corbs-vs-cors)
32. [Web Workers](#32-web-workers)
33. [Source Maps (.js.map)](#33-source-maps-jsmap)
34. [Generator Functions](#34-generator-functions)
35. [Enums in JavaScript](#35-enums-in-javascript)
36. [Proxy](#36-proxy)
37. [Flatten an Array](#37-flatten-an-array)
38. [Flatten an Object](#38-flatten-an-object)
39. [TypeScript](#39-typescript)
40. [Cookies](#40-cookies)
41. [localStorage vs Cookies](#41-localstorage-vs-cookies)
42. [WeakMap](#42-weakmap)
43. [requestAnimationFrame](#43-requestanimationframe)
44. [requestIdleCallback](#44-requestidlecallback)
45. [setTimeout Polyfill](#45-settimeout-polyfill)
46. [setInterval Polyfill](#46-setinterval-polyfill)
47. [DOM Traversal: childNodes vs children, parentNode vs parentElement](#47-dom-traversal)
48. [npm vs yarn vs pnpm](#48-npm-vs-yarn-vs-pnpm)

---

## 1. Checking if a Property Exists in an Object

Use the `in` operator to check whether a key exists on an object **or anywhere in its prototype chain**.

```js
const hero = { name: "Batman" };
console.log("name" in hero); // true
console.log("power" in hero); // false
```

> **Alternative:** Use `Object.hasOwn(obj, key)` (modern, preferred) or `obj.hasOwnProperty(key)` to check **own** properties only — i.e. skip the prototype chain.

```js
console.log(Object.hasOwn(hero, "name")); // true
```

---

## 2. Check If a Number Is Even (Without `%` or `/`)

This works by toggling a boolean on every iteration. After `n` flips, an even `n` brings it back to `true`.

```js
function isEven(n) {
  let isEven = true;
  for (let i = 1; i <= n; i++) {
    isEven = !isEven;
  }
  if (isEven) console.log(n + " is Even");
  else console.log(n + " is Odd");
}
```

> **How it works:** starts as `true`. Each flip alternates the flag. After an even number of flips it is back to `true`.

> **Simpler alternative:** `n & 1 === 0` (bitwise AND checks the last bit).

---

## 3. NaN and typeof NaN

```js
var result = 0 / 0;
console.log(result); // NaN
console.log(typeof result); // "number"
```

> **Key insight:** `NaN` stands for "Not a Number" but its `typeof` is `"number"`. This is a well-known JavaScript quirk.  
> To reliably check for NaN, use `Number.isNaN(value)` — **not** the global `isNaN()`, which coerces its argument first.

```js
Number.isNaN(NaN); // true
Number.isNaN("hello"); // false  ✅ correct
isNaN("hello"); // true   ❌ misleading
```

---

## 4. Comparing Objects

Objects are compared **by reference**, not by value. Two separate objects with identical keys and values are **not** equal.

```js
const a = { name: "Dionysia", age: 29 };
const b = { name: "Dionysia", age: 29 };

console.log(a === b); // false — different references
```

### Using `JSON.stringify` for Value Comparison

```js
console.log(JSON.stringify(a) === JSON.stringify(b)); // true — same key order
```

> **Caveat:** Key order matters! `JSON.stringify` serialises keys in insertion order.

```js
const c = { age: 29, name: "Dionysia" };
console.log(JSON.stringify(a) === JSON.stringify(c)); // false — different key order
```

> **Caveat:** `undefined` values are **stripped** by `JSON.stringify`.

```js
const d = { name: "Dionysia", age: undefined };
console.log(JSON.stringify({ name: "Dionysia" }) === JSON.stringify(d)); // true
```

> For deep equality in production code use a library like **Lodash `_.isEqual`**, which is key-order-agnostic and handles edge cases.

---

## 5. Variable Hoisting & Scope (IIFE)

```js
var x = 23;
(function () {
  var x = 43;
  (function random() {
    x++;
    console.log(x); // NaN
    var x = 21;
  })();
})();
```

### Why `NaN`?

- Inside `random()`, `var x` is **hoisted** to the top of that function, initialised as `undefined`.
- `x++` does `undefined + 1` → `NaN`.
- `console.log(x)` prints `NaN`.
- Then `x = 21` is assigned (too late to affect the log).

> **Rule:** `var` declarations are hoisted to the top of their enclosing function, but their **assignment** is not. Always prefer `let`/`const` to avoid this.

---

## 6. `this` Keyword Gotchas

### Example A — `bind` with an undefined reference

```js
function f() {
  console.log(this); // window / undefined (strict mode)
}

const user = {
  g: f.bind(user), // ⚠️ `user` is not yet defined here!
};

user.g();
```

> `user` is referenced during object literal creation — at that point it is `undefined`. So `f.bind(undefined)` is called, and `this` resolves to the global object (`window` in browsers) in sloppy mode.

### Example B — Arrow functions and `this`

```js
let status = "10";

setTimeout(() => {
  const status = "2";
  const data = {
    status: "3",
    getStatus() {
      return this.status;
    },
  };

  console.log(data.getStatus()); // "3" — `this` is `data`
  console.log(data.getStatus.call(this)); // "10" — arrow fn captures outer `this` (global)
}, 0);
```

---

## 7. bind() Chaining

Once a function is bound, **it cannot be re-bound**. Subsequent `bind()` calls are ignored.

```js
function f() {
  console.log(this.name);
}

f = f.bind({ name: "John" }).bind({ name: "Peter" });

f(); // "John"  — first bind wins
```

> **Why?** `bind()` returns a new function with a permanently fixed `this`. The second `bind()` wraps that new function, but `this` of the inner function is already locked.

---

## 8. IIFE — `var` Variable Leaking

```js
(function () {
  var a = (b = 3); // ⚠️ `b` is assigned without `var` — becomes global!
})();

console.log(typeof a !== "undefined"); // false — `a` is local
console.log(typeof b !== "undefined"); // true  — `b` leaked to global scope
```

> `var a = b = 3` is parsed as `b = 3; var a = b;`. Since `b` has no declaration keyword, it becomes a property of the global object. This is a common bug. Use `'use strict'` to prevent it.

---

## 9. `this` Inside Nested Functions

```js
var myObject = {
  foo: "bar",
  func: function () {
    var self = this;
    console.log("outer func: this.foo =", this.foo); // "bar"
    console.log("outer func: self.foo =", self.foo); // "bar"
    (function () {
      console.log("inner func: this.foo =", this.foo); // undefined (this = window)
      console.log("inner func: self.foo =", self.foo); // "bar" (closure)
    })();
  },
};
myObject.func();
```

> A regular nested function (IIFE) does **not** inherit `this` from the outer function. `self = this` is the classic workaround. The modern fix is to use an **arrow function**, which lexically inherits `this`.

---

## 10. Automatic Semicolon Insertion (ASI) with `return`

```js
function foo2() {
  return; // ← ASI inserts a semicolon here!
  {
    bar: "hello";
  }
}

console.log(foo2()); // undefined
```

> JavaScript's ASI inserts a semicolon after `return` when the next token is on a new line. `foo2` therefore returns `undefined`. Always place the opening brace `{` on the **same line** as `return`.

---

## 11. Floating Point Comparison

```js
console.log(0.1 + 0.2 === 0.3); // false!
```

> Floating-point arithmetic is imprecise in binary. Use `Number.EPSILON` to check near-equality:

```js
function areAlmostEqual(num1, num2) {
  return Math.abs(num1 - num2) < Number.EPSILON;
}
console.log(areAlmostEqual(0.1 + 0.2, 0.3)); // true
```

> `Number.EPSILON` is the smallest difference between two representable floating-point numbers (~2.22e-16).

---

## 12. Promise Basics — Execution Order

```js
console.log("start");

const promise = new Promise((resolve, reject) => {
  console.log(1); // runs synchronously
  resolve(2);
  console.log(3); // still runs — resolve doesn't stop execution
});

promise.then((res) => {
  console.log(res); // 2 — micro-task, runs after sync code
});

console.log("end");

// Output: start → 1 → 3 → end → 2
```

> The **Promise executor** runs synchronously. The `.then` callback is queued as a **microtask** and runs after the current synchronous call stack is empty, but before any macrotasks (setTimeout, etc.).

### Unresolved Promise

```js
const promise = new Promise((resolve, reject) => {
  console.log(1);
  // never resolves
});

promise.then((res) => {
  console.log(res); // ← never runs
});

// Output: start → 1 → end  (then callback never fires)
```

---

## 13. Promise Chaining with `.then` and `.catch`

`.catch` handlers can **recover** from rejections. Once caught, the chain continues with `.then`.

```js
function job(state) {
  return new Promise((resolve, reject) => {
    state ? resolve("success") : reject("error");
  });
}

job(true)
  .then((data) => {
    console.log(data); // "success"
    return job(false); // rejects
  })
  .catch((error) => {
    console.log(error); // "error"
    return "Error caught"; // recovers — chain continues
  })
  .then((data) => {
    console.log(data); // "Error caught"
    return job(true);
  });
```

> **Key rule:** A `.catch` that **returns a value** (not a rejected promise or throw) converts the rejection into a resolved state, allowing subsequent `.then` blocks to run.

> A `throw` inside `.then` is equivalent to returning a rejected promise.

---

## 14. Rewriting Promise Chains with Async/Await

```js
// Promise version
function loadJson(url) {
  return fetch(url).then((response) => {
    if (response.status === 200) return response.json();
    throw new Error(response.status);
  });
}

// Async/Await version
async function loadJson(url) {
  const res = await fetch(url);
  if (res.status === 200) {
    return res.json(); // returns a promise — awaited by caller
  }
  throw new Error(res.status);
}

loadJson("https://jsonplaceholder.typicode.com/posts").then(console.log);
```

> `async/await` is syntactic sugar over Promises. An `async` function always returns a Promise. `await` pauses execution inside the function without blocking the event loop.

---

## 15. Promise Recursion

Execute promises **sequentially** using recursion — each promise only starts after the previous one resolves.

```js
function rec(promises) {
  if (promises.length === 0) return;

  let curr = promises.shift(); // take first promise

  curr.then((res) => {
    console.log(res);
    rec(promises); // recurse with remaining
  });
}

rec([api1("Channel"), api2("video"), api3("video")]);
```

> Note: `Array.shift()` mutates the original array. Prefer slicing if immutability matters.

> **Alternative:** `async/await` with a `for...of` loop is cleaner for sequential promise execution.

---

## 16. Object Reference Equality

```js
const a = { x: 1 };
const b = { x: 1 };

console.log(a === b); // false — different objects in memory
```

> `===` checks reference identity for objects. `a` and `b` point to different memory addresses even though their contents are identical.

---

## 17. try/catch Variable Scope

```js
(function () {
  var x, y;
  try {
    throw new Error();
  } catch (x) {
    // `x` here is a NEW binding, local to the catch block
    x = 1; // modifies catch-block `x`, not outer `var x`
    y = 2; // modifies outer `y` — no catch-local `y`
    console.log(x); // 1
  }
  console.log(x); // undefined — outer `x` untouched
  console.log(y); // 2
})();
```

> The catch parameter (`x`) creates a **new scope** that shadows the outer `var x`. Assignments to `x` inside `catch` only affect the catch-local binding.

---

## 18. Prototype `valueOf` Override

`valueOf()` is called when an object is used in a primitive context (arithmetic, string concatenation, etc.).

```js
function Temp(n) {
  this.number = n;
}

Temp.prototype.valueOf = function () {
  return this.number;
};

const s = new Temp(10);

console.log(s); // Temp { number: 10 }
console.log(s + 1); // 11 — valueOf() is called, returns 10
console.log(`${s}`); // "10" — toString falls back to valueOf
```

---

## 19. Type Coercion — Tricky Outputs

JavaScript performs **implicit type conversion** in mixed-type operations.

```js
console.log(1 < 2 < 3); // true  — (1<2)=true → true<3 → 1<3 → true
console.log(3 > 2 > 1); // false — (3>2)=true → true>1 → 1>1 → false

console.log(1 + "2" + "2"); // "122"  — 1 coerced to string
console.log(1 + +"2" + "2"); // "32"   — unary + converts "2" to 2; 1+2=3, then "3"+"2"
console.log(1 + -"1" + "2"); // "02"   — 1+(-1)=0, then "0"+"2"
console.log(+"1" + "1" + "2"); // "112"  — unary + converts "1" to 1, then string concat
console.log("A" - "B" + "2"); // "NaN2" — NaN + "2" = string concat
console.log("A" - "B" + 2); // NaN    — NaN + 2 = NaN
console.log("    4" - "1"); // 3      — whitespace is trimmed, strings coerced to numbers
```

> **Rule of thumb:**
>
> - `+` with any string → string concatenation
> - Unary `+` before a value → number conversion
> - `-`, `*`, `/` always attempt numeric conversion

---

## 20. `null` Comparisons

```js
console.log(null >= false); // true  — null coerced to 0, false to 0 → 0 >= 0
console.log(null > false); // false — 0 > 0
console.log(null < false); // false — 0 < 0
console.log(null <= false); // true  — 0 <= 0
console.log(null == false); // false — null only == undefined (abstract equality)
```

> `null` is **only loosely equal** to `undefined`, not to `false`, `0`, or `""`. But in relational comparisons (`>`, `<`, `>=`, `<=`) it is coerced to `0`.

---

## 21. Method Chaining Pattern

Return `this` (or the parent object) from each method to enable fluent chaining.

```js
function compute() {
  const temp = {
    total: 0,
    lacs(val) {
      this.total += val * 100000;
      return temp;
    },
    thousand(val) {
      this.total += val * 1000;
      return temp;
    },
    crore(val) {
      this.total += val * 10000000;
      return temp;
    },
    value() {
      return this.total;
    },
  };
  return temp;
}

const ans = compute()
  .lacs(15)
  .crore(5)
  .crore(2)
  .lacs(20)
  .thousand(45)
  .crore(7)
  .value();
console.log(ans); // 145045000
```

> This pattern is used heavily in libraries like jQuery, Lodash, and query builders. Each method returns the same object, allowing indefinite chaining.

---

## 22. API Response Caching

Cache API responses for a configurable duration to avoid redundant network calls.

```js
const cache = {};

function apiCache(url, method, ttlMs) {
  return async function () {
    const entry = cache[url];
    if (entry && Date.now() < entry.expiry) {
      return entry.response; // serve from cache
    }
    try {
      let res = await fetch(url, { method });
      res = await res.json();
      cache[url] = { response: res, expiry: Date.now() + ttlMs };
    } catch (err) {
      console.error("Fetch error:", err.message);
    }
    return cache[url]?.response;
  };
}
```

> **How it works:**
>
> - First call fetches from the network and stores the result with an expiry timestamp.
> - Subsequent calls within `ttlMs` milliseconds return the cached result.
> - After the TTL expires, the next call fetches fresh data.

> **Use case:** Reducing API rate limit hits, improving perceived performance for repeated identical requests.

---

## 23. AJAX with XMLHttpRequest

AJAX allows web pages to send/receive data from a server **asynchronously** without a full page reload.

```js
const xhr = new XMLHttpRequest();

xhr.open("GET", "https://api.example.com/data", true); // true = async

xhr.onreadystatechange = function () {
  if (xhr.readyState === XMLHttpRequest.DONE) {
    if (xhr.status === 200) {
      console.log(JSON.parse(xhr.responseText));
    } else {
      console.error("Request failed:", xhr.status);
    }
  }
};

xhr.send();
```

> `readyState` values: `0` (UNSENT) → `1` (OPENED) → `2` (HEADERS_RECEIVED) → `3` (LOADING) → `4` (DONE)

> In modern code, `fetch()` is preferred over XHR for its cleaner Promise-based API.

---

## 24. Axios Interceptors

Interceptors allow you to run logic **before a request is sent** or **before a response is handled**.

```js
// Request interceptor
axios.interceptors.request.use(
  (config) => {
    config.headers.Authorization = `Bearer ${getToken()}`;
    return config; // must return the config
  },
  (error) => Promise.reject(error),
);

// Response interceptor
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response.status === 401) {
      // redirect to login
    }
    return Promise.reject(error);
  },
);
```

> **Common use cases:**
>
> - Attach auth tokens to every request
> - Refresh access tokens on 401 responses
> - Log requests/responses globally
> - Transform response data shape

---

## 25. Axios vs Fetch

| Feature              | Axios                             | Fetch                                 |
| -------------------- | --------------------------------- | ------------------------------------- |
| JSON parsing         | Automatic                         | Requires `.json()` call               |
| Request body (POST)  | Plain object                      | Must use `JSON.stringify()`           |
| Error on 4xx/5xx     | Yes (throws)                      | No (only rejects on network error)    |
| Interceptors         | Built-in                          | No (need wrapper)                     |
| Request cancellation | `CancelToken` / `AbortController` | `AbortController`                     |
| Timeout support      | Built-in (`timeout` option)       | Manual (AbortController + setTimeout) |
| XSRF protection      | Built-in                          | Manual                                |
| Browser support      | Wide (polyfills XHR)              | Modern browsers only                  |
| Bundle size          | ~14KB                             | Native (0KB)                          |

---

## 26. Escape Characters in Strings

### Using Backslash `\`

```js
let quote = 'He said, "I learned from freeCodeCamp!"';
let apos = "It's a beautiful day";
```

### Using Template Literals `` ` ``

```js
let quote = `He said, "I learned from freeCodeCamp!"`;
```

### Using Opposite Quote Style

```js
let quote = 'He said, "I learned from freeCodeCamp!"';
let apos = "It's a beautiful day";
```

> Template literals (backticks) are the most flexible — they support multiline strings, embedded expressions (`${}`), and avoid most escaping.

---

## 27. Meta Tags

Meta tags provide metadata about an HTML document to browsers, search engines, and crawlers. They go inside `<head>`.

```html
<!-- Control search engine indexing -->
<meta name="robots" content="noindex, nofollow" />

<!-- Viewport for responsive design -->
<meta name="viewport" content="width=device-width, initial-scale=1.0" />

<!-- Page description for SEO -->
<meta name="description" content="A concise page summary for search results." />

<!-- Character encoding -->
<meta charset="UTF-8" />

<!-- Open Graph (social sharing) -->
<meta property="og:title" content="My Page Title" />
<meta property="og:image" content="https://example.com/image.jpg" />
```

> Clients (browsers, crawlers) ignore meta tags they don't understand — they are purely informational.

---

## 28. SSR vs CSR

### Server-Side Rendering (SSR)

- The server generates the **full HTML** on each request and sends it to the browser.
- Browser receives ready-to-display HTML — **faster initial paint (FCP)**.
- Better for **SEO** — crawlers see complete content immediately.
- More server load per request.
- Examples: Next.js (`getServerSideProps`), PHP, Rails.

### Client-Side Rendering (CSR)

- Server sends a minimal HTML shell + JavaScript bundle.
- Browser executes JS to build and render the page.
- **Slower initial load** (JS must be parsed and run first).
- Subsequent navigations are fast (no full page reload).
- SEO requires extra effort (pre-rendering, dynamic rendering).
- Examples: Create React App, Vue CLI (default mode).

|                          | SSR                    | CSR                       |
| ------------------------ | ---------------------- | ------------------------- |
| First load speed         | Fast                   | Slower                    |
| SEO                      | Excellent              | Needs extra work          |
| Server cost              | Higher                 | Lower                     |
| Interactivity after load | Immediate              | After JS hydration        |
| Security                 | More server-controlled | More client-side exposure |

---

## 29. Asset Optimisation

### Images

- **Compress** images before serving (tools: Squoosh, ImageOptim).
- Prefer modern formats: `AVIF > WebP > PNG/JPEG`.
- Use **Device Pixel Ratio (DPR)** responsive images:
  ```html
  <img
    src="img-1x.jpg"
    srcset="img-1x.jpg 1x, img-2x.jpg 2x, img-3x.jpg 3x"
    alt="..."
  />
  ```
- **CSS Sprites:** Combine many small icons into one image to reduce HTTP requests.
- Use **lazy loading**: `<img loading="lazy" src="...">`.

### Fonts

- **Preload** critical fonts: `<link rel="preload" as="font">`.
- Prefer system/native fonts to avoid font download entirely.
- Use `font-display: swap` to show fallback text while custom font loads.

### CSS

- **Async-load** non-critical CSS.
- **Code-split** CSS per route/component.
- Avoid render-blocking CSS by inlining critical styles.

### JavaScript

- Use `async` / `defer` attributes on `<script>` tags.
- Use **Web Workers** for heavy computation off the main thread.
- **Code-split** with dynamic `import()` for lazy loading.

---

## 30. Writing Performant Code

- **Batch DOM updates:** Reading then writing the DOM causes reflows. Group all writes together to minimise layout thrashing.
- **Reduce loops:** Avoid nested loops on large datasets where possible.
- **Avoid blocking the main thread:**
  - Use `async/await` or Promises for I/O.
  - Move heavy computation to **Web Workers**.
  - Use **WebGPU** for GPU-accelerated computation in the browser.
- **Debounce/Throttle** event handlers (scroll, resize, input).
- **Memoize** expensive pure functions.

---

## 31. CORBS vs CORS

### CORS (Cross-Origin Resource Sharing)

An HTTP-header-based mechanism allowing a server to indicate which origins are permitted to read its responses.

- Browser sends a **preflight `OPTIONS` request** to check permissions.
- Server responds with `Access-Control-Allow-Origin` and related headers.
- If approved, the actual request is sent.

### CORB (Cross-Origin Read Blocking)

A browser-level security feature (part of Site Isolation) that **silently blocks** certain cross-origin responses from being delivered to a renderer process.

- Example: A `<script>` tag requesting a `text/html` response from another origin gets an empty response.
- Protects against Spectre-class side-channel attacks.
- Operates automatically — no server configuration needed.

> **Difference:** CORS is about _server policy_ (what the server permits). CORB is about _browser enforcement_ (what the browser will allow even if CORS says OK).

---

## 32. Web Workers

Web Workers run JavaScript in a **background thread**, separate from the main UI thread.

```js
// main.js
const worker = new Worker("worker.js");
worker.postMessage({ data: [1, 2, 3, 4, 5] });

worker.onmessage = (event) => {
  console.log("Result from worker:", event.data);
};

// worker.js
self.onmessage = (event) => {
  const result = event.data.data.reduce((a, b) => a + b, 0);
  self.postMessage(result);
};
```

> **Key properties:**
>
> - Runs in a separate thread — no access to `window`, `document`, or DOM.
> - Communicates via `postMessage` / `onmessage` (structured clone algorithm).
> - Ideal for: image processing, large data sorting, cryptography, parsing large JSON.
> - Does not block the UI while running.

---

## 33. Source Maps (.js.map)

Source maps are files generated during the build process that map **minified/bundled code** back to the original source files and line numbers.

```
bundle.min.js      ← shipped to browser (minified)
bundle.min.js.map  ← maps positions back to original source
```

> **Use case:** When an error is thrown in `bundle.min.js`, error-reporting tools (Sentry, browser DevTools) use the `.map` file to show you the exact **original file and line number** where the error occurred.

> Source maps are typically **not served in production** for security reasons (they expose source code). They are uploaded to error-monitoring services privately.

---

## 34. Generator Functions

A generator is a function that can **pause and resume** execution using `yield`.

```js
function* generator() {
  yield 1;
  yield 2;
  yield 3;
}

const gen = generator(); // returns a Generator object — does NOT run the body yet

console.log(gen.next()); // { value: 1, done: false }
console.log(gen.next()); // { value: 2, done: false }
console.log(gen.next()); // { value: 3, done: false }
console.log(gen.next()); // { value: undefined, done: true }
```

> **Use cases:**
>
> - Lazy evaluation of infinite sequences
> - Custom iterators
> - Cooperative multitasking (basis of `async/await` before it was native)
> - Paginated data fetching

---

## 35. Enums in JavaScript

JavaScript has no native `enum` type, but you can simulate one with `Object.freeze()`.

```js
const DaysOfWeek = Object.freeze({
  SUNDAY: 0,
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
});

console.log(DaysOfWeek.MONDAY); // 1
DaysOfWeek.MONDAY = 99; // silently fails — object is frozen
console.log(DaysOfWeek.MONDAY); // still 1
```

> `Object.freeze()` makes the object **immutable** at the top level. TypeScript's `enum` is the idiomatic solution in typed codebases.

---

## 36. Proxy

A `Proxy` wraps an object and intercepts fundamental operations on it (get, set, delete, function calls, etc.) via **traps**.

```js
const target = { name: "Alice", age: 25 };

const handler = {
  get(target, property) {
    if (property in target) {
      return `Value: ${target[property]}`;
    }
    return `Property "${property}" not found`;
  },
  set(target, property, value) {
    if (typeof value !== "string") throw new TypeError("Only strings allowed");
    target[property] = value;
    return true; // must return true to indicate success
  },
};

const proxy = new Proxy(target, handler);

console.log(proxy.name); // "Value: Alice"
console.log(proxy.email); // "Property "email" not found"
```

### Common Proxy Traps

| Trap             | Intercepts                        |
| ---------------- | --------------------------------- |
| `get`            | Property read (`obj.prop`)        |
| `set`            | Property write (`obj.prop = val`) |
| `has`            | `in` operator                     |
| `deleteProperty` | `delete obj.prop`                 |
| `apply`          | Function call                     |
| `construct`      | `new` operator                    |

> **Use cases:** Validation, logging, reactive data (Vue 3 reactivity system uses Proxy), access control, caching.

---

## 37. Flatten an Array

```js
function flatten(arr, depth) {
  let result = [];
  for (let i = 0; i < arr.length; i++) {
    if (Array.isArray(arr[i]) && depth > 0) {
      result.push(...flatten(arr[i], depth - 1));
    } else {
      result.push(arr[i]);
    }
  }
  return result;
}

console.log(
  flatten(
    [
      [1, 2, 3],
      [1, [2, [4, [5]]]],
    ],
    3,
  ),
);
// [1, 2, 3, 1, 2, 4, [5]]  — depth 3 flattens 3 levels deep
```

> **Native alternative:** `Array.prototype.flat(depth)` — `[1,[2,[3]]].flat(Infinity)` flattens completely.

---

## 38. Flatten an Object

Converts a nested object into a flat object with compound keys.

```js
function flatten(obj, prefix = "") {
  let result = {};
  if (typeof obj === "object" && obj !== null && !Array.isArray(obj)) {
    for (let key in obj) {
      const val = obj[key];
      const newKey = prefix ? `${prefix}_${key}` : key;
      if (typeof val === "object" && val !== null && !Array.isArray(val)) {
        Object.assign(result, flatten(val, newKey));
      } else {
        result[newKey] = val;
      }
    }
  }
  return result;
}

console.log(flatten({ a: { b: { c: 3 }, d: 4 } }));
// { a_b_c: 3, a_d: 4 }
```

---

## 39. TypeScript

TypeScript is a **statically typed superset** of JavaScript that compiles to plain JavaScript.

**Key benefits:**

- **Type safety:** Catch type errors at **compile time**, before the code runs.
- **Static binding:** Types are checked at compile time rather than runtime.
- **IntelliSense:** Better editor autocompletion, refactoring, and navigation.
- **Self-documenting code:** Types act as inline documentation.

```ts
// TypeScript
function add(a: number, b: number): number {
  return a + b;
}

add(1, "2"); // ❌ Compile-time error: Argument of type 'string' not assignable to 'number'
```

> TypeScript does not change JavaScript's runtime behaviour — it is purely a compile-time tool.

---

## 40. Cookies

Cookies are small key-value data pieces stored in the browser, **sent automatically** with every HTTP request to the matching domain.

```js
// Set a cookie
document.cookie =
  "username=Alice; expires=Fri, 31 Dec 2025 23:59:59 GMT; path=/";

// Read cookies
console.log(document.cookie); // "username=Alice"

// Delete a cookie (set expiry in the past)
document.cookie = "username=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
```

> Cookies are primarily used for **session management** (auth tokens), **personalisation**, and **tracking**.

---

## 41. localStorage vs Cookies

| Feature                 | localStorage                      | Cookies                                   |
| ----------------------- | --------------------------------- | ----------------------------------------- |
| Storage size            | ~5 MB                             | ~4 KB                                     |
| Sent with HTTP requests | No                                | Yes (automatically)                       |
| Expiry                  | Never (persists until cleared)    | Configurable expiry date                  |
| Accessible from JS      | Yes                               | Yes (unless `HttpOnly`)                   |
| Security                | No `HttpOnly`/`Secure` flags      | Supports `HttpOnly`, `Secure`, `SameSite` |
| Scope                   | Origin (protocol + domain + port) | Domain + path                             |

> **Best practice:** Store auth tokens in **`HttpOnly` cookies** (inaccessible to JS, preventing XSS theft) rather than `localStorage`.

---

## 42. WeakMap

A `WeakMap` is like a `Map` but:

- Keys **must be objects or functions** (not primitives).
- Keys are held **weakly** — if no other reference to the key object exists, it can be garbage-collected (along with its WeakMap entry).
- **Not iterable** — no `.forEach`, no `.keys()`, no `.size`.

```js
let user = { name: "Alice" };
const wm = new WeakMap();
wm.set(user, { role: "admin" });

console.log(wm.get(user)); // { role: "admin" }

user = null; // key object has no more strong references → GC can reclaim it
// wm entry for the old user object is automatically removed
```

> **Use cases:**
>
> - Caching computed data tied to DOM nodes without causing memory leaks.
> - Storing private data for class instances.
> - Metadata storage where the lifetime of the metadata should match the lifetime of the key object.

---

## 43. requestAnimationFrame

`requestAnimationFrame(callback)` schedules a callback to run **just before the browser repaints** the screen — typically 60 times per second (matching the monitor's refresh rate).

```js
let xPos = 0;

function animate(timestamp) {
  xPos += 2;
  box.style.transform = `translateX(${xPos}px)`;

  if (xPos < 500) {
    requestAnimationFrame(animate); // schedule next frame
  }
}

requestAnimationFrame(animate); // kick off the loop
```

> **`timestamp`** is a high-resolution `DOMHighResTimeStamp` indicating when the frame started. Use it to calculate delta time for frame-rate-independent animations.

> **vs `setInterval`:** `rAF` synchronises with the display refresh rate, pauses when the tab is hidden, and produces smoother animations. `setInterval` fires independently of rendering.

---

## 44. requestIdleCallback

`requestIdleCallback(callback)` schedules a callback during the **browser's idle periods** — times when no critical tasks are running.

```js
requestIdleCallback((idleDeadline) => {
  while (idleDeadline.timeRemaining() > 0) {
    // do a small chunk of non-urgent work
    processNextQueueItem();
  }
});
```

> **`IdleDeadline`** object:
>
> - `.timeRemaining()` — milliseconds left before the browser needs to handle higher-priority work.
> - `.didTimeout` — `true` if the callback was invoked because the optional `timeout` was hit.

> **Use cases:** Analytics logging, pre-fetching, background sync, low-priority UI updates.

---

## 45. setTimeout Polyfill

Implements `setTimeout` using `requestIdleCallback` instead of the native timer.

```js
const timerMap = {};

function setTimeoutPoly(cb, delay, ...args) {
  const timerId = Math.random();
  timerMap[timerId] = true;

  const start = Date.now();

  function helper() {
    if (!timerMap[timerId]) return; // was cleared

    if (Date.now() - start >= delay) {
      cb.apply(null, args);
      delete timerMap[timerId];
    } else {
      requestIdleCallback(helper); // check again when browser is idle
    }
  }

  requestIdleCallback(helper);
  return timerId;
}

function clearTimeoutPoly(id) {
  delete timerMap[id];
}
```

> **How it works:** Repeatedly schedules itself via `requestIdleCallback` until the elapsed time exceeds `delay`, then fires the callback.

> **Note:** This is less precise than the native `setTimeout` because `requestIdleCallback` only runs during idle periods.

---

## 46. setInterval Polyfill

Implements `setInterval` using `setTimeout` (real or polyfilled).

```js
function createSetIntervalPolyfill() {
  const intervalMap = {};

  function setIntervalPolyfill(callback, delay = 0, ...args) {
    const id = Math.random();

    function repeat() {
      intervalMap[id] = setTimeout(() => {
        if (!intervalMap[id]) return; // was cleared
        callback.apply(null, args);
        repeat(); // schedule next tick
      }, delay);
    }

    repeat();
    return id;
  }

  function clearIntervalPolyfill(intervalId) {
    clearTimeout(intervalMap[intervalId]);
    delete intervalMap[intervalId];
  }

  return { setIntervalPolyfill, clearIntervalPolyfill };
}
```

> **Key insight:** Each interval tick schedules the **next** tick only after completing the current one. This avoids drift and stack buildup that can happen with naive implementations.

---

## 47. DOM Traversal

### `childNodes` vs `children`

|                             | `childNodes`           | `children`                            |
| --------------------------- | ---------------------- | ------------------------------------- |
| Returns                     | `NodeList` (all nodes) | `HTMLCollection` (element nodes only) |
| Includes text/comment nodes | Yes                    | No                                    |
| Live?                       | Yes                    | Yes                                   |

```js
// Prefer .children — it skips whitespace text nodes
const el = document.getElementById("list");
console.log(el.childNodes); // includes text nodes for whitespace
console.log(el.children); // only <li> elements etc.
```

### `parentNode` vs `parentElement`

- `parentNode` — returns the parent **node** (could be a `Document` or `DocumentFragment`).
- `parentElement` — returns the parent only if it's an **Element** node; otherwise `null`.

```js
document.documentElement.parentNode; // #document
document.documentElement.parentElement; // null
```

> In most cases they return the same result. Prefer `parentElement` when you need to be sure you're working with an actual DOM element.

---

## 48. npm vs yarn vs pnpm

| Feature                  | npm                 | yarn              | pnpm                                         |
| ------------------------ | ------------------- | ----------------- | -------------------------------------------- |
| Speed                    | Moderate            | Fast (v1 caching) | Fastest                                      |
| Disk usage               | High (copies)       | High (copies)     | Low (hard links / content-addressable store) |
| `node_modules` structure | Flat                | Flat              | Symlinked (strict)                           |
| Lockfile                 | `package-lock.json` | `yarn.lock`       | `pnpm-lock.yaml`                             |
| Workspaces (monorepo)    | Yes (v7+)           | Yes               | Excellent                                    |
| Plug'n'Play              | No                  | Yes (yarn berry)  | No                                           |
| Security (phantom deps)  | Vulnerable          | Vulnerable        | Protected                                    |

> **pnpm** is increasingly popular for large monorepos due to its efficient shared store — packages are stored once globally and hard-linked into projects, saving significant disk space.

> **Phantom dependencies** are packages that your code uses but didn't explicitly declare. pnpm's strict `node_modules` structure prevents this, making dependency graphs explicit and reliable.

---

_End of JavaScript Notes — Part 3_
