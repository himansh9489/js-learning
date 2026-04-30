# JavaScript Concepts — Comprehensive Notes

---

## Table of Contents

1. [Functional Programming](#1-functional-programming)
2. [async vs defer](#2-async-vs-defer)
3. [ES6 Features](#3-es6-features)
4. [Shallow Copy vs Deep Copy](#4-shallow-copy-vs-deep-copy)
5. [Object.is()](#5-objectis)
6. [Execution Context](#6-execution-context)
7. [var, let & const](#7-var-let--const)
8. [Scope, Block & Shadowing](#8-scope-block--shadowing)
9. [Hoisting](#9-hoisting)
10. [Temporal Dead Zone (TDZ)](#10-temporal-dead-zone-tdz)
11. [Closures](#11-closures)
12. [Garbage Collection & Mark-and-Sweep](#12-garbage-collection--mark-and-sweep)
13. [Scope Chain & Lexical Environment](#13-scope-chain--lexical-environment)
14. [Event Loop, Micro-task & Macro-task Queue](#14-event-loop-micro-task--macro-task-queue)
15. [this Keyword](#15-this-keyword)
16. [call(), apply(), bind()](#16-call-apply-bind)
17. [Prototype & Prototype Chain](#17-prototype--prototype-chain)
18. [Functions — Types & Concepts](#18-functions--types--concepts)
19. [Currying](#19-currying)
20. [Memoization](#20-memoization)
21. [Debouncing & Throttling](#21-debouncing--throttling)
22. [Promises & async/await](#22-promises--asyncawait)
23. [Array Methods & Polyfills](#23-array-methods--polyfills)
24. [DOM & BOM](#24-dom--bom)
25. [Type Coercion & Conversion](#25-type-coercion--conversion)
26. [Symbol](#26-symbol)
27. [Classes, Inheritance & OOP](#27-classes-inheritance--oop)
28. [Miscellaneous Tips](#28-miscellaneous-tips)

---

## 1. Functional Programming

Functional programming (FP) is a **programming paradigm** focused on building software by composing **pure functions**, avoiding shared state and mutable data.

### Key Characteristics

| Characteristic      | Description                                                            |
| ------------------- | ---------------------------------------------------------------------- |
| **Pure Functions**  | Always return the same output for the same input, with no side effects |
| **Declarative**     | Describes _what_ to do, not _how_ to do it (vs. imperative)            |
| **Method Chaining** | Functions are composed together in a pipeline                          |
| **Immutability**    | Data is not mutated; new data structures are created                   |

### Example

```js
// Imperative approach
const result = [];
for (let i = 0; i < arr.length; i++) {
  if (arr[i] % 2 === 0) result.push(arr[i] * 2);
}

// Functional / Declarative approach
const result = arr.filter((n) => n % 2 === 0).map((n) => n * 2);
```

> **Tip:** `.map()`, `.filter()`, `.reduce()` are the backbone of functional programming in JavaScript.

---

## 2. async vs defer

When browsers encounter a `<script>` tag, how and when the script is fetched/executed differs based on attributes.

### Comparison

| Mode                 | HTML Parsing          | Script Fetch | Script Execute               | Order Guarantee         |
| -------------------- | --------------------- | ------------ | ---------------------------- | ----------------------- |
| `<script>` (default) | Pauses                | After pause  | Immediately after fetch      | Yes                     |
| `<script async>`     | Continues in parallel | Parallel     | Pauses HTML to execute       | No (first-to-load wins) |
| `<script defer>`     | Continues in parallel | Parallel     | After HTML parsing completes | Yes (DOM order)         |

### When to use which

- **Default:** Simple inline scripts with no dependencies.
- **`async`:** Independent scripts (e.g., analytics, ads) — do NOT use when scripts depend on each other.
- **`defer`:** Scripts that need the full DOM or have inter-dependencies. **Preferred for most cases.**

```html
<script src="analytics.js" async></script>
<!-- Independent -->
<script src="app.js" defer></script>
<!-- Needs DOM -->
```

---

## 3. ES6 Features

ES6 (ECMAScript 2015) introduced a large set of modern features:

| Feature                   | Description                                       |
| ------------------------- | ------------------------------------------------- |
| **Destructuring**         | Extract values from arrays/objects into variables |
| **Arrow Functions**       | Shorter syntax; lexically bind `this`             |
| **Template Literals**     | String interpolation with backticks `` ` ``       |
| **Promises**              | Handle async operations cleanly                   |
| **`let` & `const`**       | Block-scoped alternatives to `var`                |
| **Spread Operator `...`** | Expand iterables into individual elements         |
| **Default Parameters**    | Assign defaults to function parameters            |
| **Classes**               | Syntactic sugar over prototype-based OOP          |
| **Modules**               | Import/export code between files                  |

### Modules Example

```js
// utils.js
export const add = (a, b) => a + b;
export function greet(name) {
  return `Hello, ${name}`;
}

// main.js
import { add, greet } from "./utils.js";
```

---

## 4. Shallow Copy vs Deep Copy

### Shallow Copy

Only the **first level** of the object is copied. Nested objects are still **referenced** (not duplicated).

```js
const original = { name: "Alice", address: { city: "Delhi" } };
const shallow = { ...original }; // or Object.assign({}, original)

shallow.name = "Bob"; // Does NOT affect original
shallow.address.city = "Mumbai"; // DOES affect original (reference!)

console.log(original.address.city); // "Mumbai"
```

**Methods:** Spread operator `{...obj}`, `Object.assign({}, obj)`

### Deep Copy

**All levels** are copied — a true independent clone.

```js
const deep = JSON.parse(JSON.stringify(original));
deep.address.city = "Chennai"; // Does NOT affect original
```

**Limitation of JSON method:** Does not handle `undefined`, functions, `Date`, `Map`, `Set`, circular references.

**Better alternative:** Use `structuredClone(obj)` (modern browsers) or libraries like Lodash `_.cloneDeep()`.

---

## 5. Object.is()

`Object.is()` is a strict equality check that handles edge cases that `===` does not.

```js
Object.is(0, -0); // false  ← === returns true
Object.is(NaN, NaN); // true   ← === returns false
Object.is(1, 1); // true
```

| Comparison    | `==`    | `===`   | `Object.is()` |
| ------------- | ------- | ------- | ------------- |
| `0 == -0`     | `true`  | `true`  | `false`       |
| `NaN === NaN` | `false` | `false` | `true`        |

---

## 6. Execution Context

The **Execution Context** is the environment in which JavaScript code is evaluated and executed.

### Types

- **Global Execution Context (GEC):** Created when the script first runs. The global object (`window` in browsers) is created here. There is only **one** GEC.
- **Function Execution Context (FEC):** Created every time a function is invoked.

### Phases

Each execution context has two phases:

1. **Creation Phase (Memory Phase):**
   - Variables declared with `var` are hoisted and initialized to `undefined`.
   - Function declarations are fully hoisted (stored in memory).
   - `let` and `const` are hoisted but placed in the **Temporal Dead Zone**.

2. **Execution Phase (Code Phase):**
   - Code runs line by line.
   - Variable assignments happen.
   - Functions create their own execution contexts when called.

### Call Stack

All execution contexts are managed via the **Call Stack** (LIFO — Last In, First Out).

```
| FEC: greet()         |
| FEC: main()          |
| Global EC (anonymous)|
```

> The global execution context name is **`anonymous`**.

---

## 7. var, let & const

| Feature            | `var`                            | `let`                      | `const`                    |
| ------------------ | -------------------------------- | -------------------------- | -------------------------- |
| Scope              | Function / Global                | Block                      | Block                      |
| Hoisting           | Yes (initialized to `undefined`) | Yes (TDZ — not accessible) | Yes (TDZ — not accessible) |
| Re-declaration     | Allowed                          | Not allowed                | Not allowed                |
| Re-assignment      | Allowed                          | Allowed                    | Not allowed                |
| On `window` object | Yes                              | No                         | No                         |

```js
var x = 10;
console.log(window.x); // 10

let y = 20;
console.log(window.y); // undefined
```

### `const` with Objects/Arrays

`const` prevents **re-assignment** but not **mutation**:

```js
const car = { type: "Fiat" };
car.type = "Volvo"; // ✅ Allowed (mutation)
car = { type: "BMW" }; // ❌ Error (re-assignment)

const arr = [1, 2, 3];
arr.push(4); // ✅ Allowed
arr = [1, 2]; // ❌ Error
```

---

## 8. Scope, Block & Shadowing

### Block Scope

A **block** is a group of statements enclosed in `{}`. `let` and `const` are scoped to the nearest block.

```js
{
  let blockVar = "I'm block scoped";
  var globalVar = "I'm function/global scoped";
}
console.log(globalVar); // Works
console.log(blockVar); // ReferenceError
```

> **Why use blocks?** To hide data from the global scope without wrapping everything in a function.

### Shadowing

A variable in an inner scope **shadows** (hides) a variable of the same name in the outer scope.

```js
let a = 10;
{
  let a = 20; // shadows outer `a`
  console.log(a); // 20
}
console.log(a); // 10
```

### ⚠️ Illegal Shadowing

`var` **cannot** shadow a `let` or `const` variable from the outer scope:

```js
let a = 10;
{
  var a = 20; // ❌ SyntaxError — var leaks to function/global scope
}
```

---

## 9. Hoisting

Hoisting is JavaScript's behavior of moving **declarations** (not initializations) to the top of their scope before execution.

```js
console.log(x); // undefined (var is hoisted)
var x = 5;

console.log(y); // ReferenceError (let is in TDZ)
let y = 10;

greet(); // "Hello!" — function declaration is fully hoisted
function greet() {
  console.log("Hello!");
}

hello(); // TypeError — only the variable is hoisted, not the function
var hello = function () {
  console.log("Hello!");
};
```

---

## 10. Temporal Dead Zone (TDZ)

The **TDZ** is the period between the start of a block scope and the line where a `let` or `const` variable is declared. Accessing the variable during this time throws a `ReferenceError`.

```js
{
  // TDZ for `name` starts here
  console.log(name); // ❌ ReferenceError
  let name = "Alice"; // TDZ ends here
  console.log(name); // "Alice"
}
```

> `let` and `const` exist in the TDZ — they are **hoisted** but **not initialized**. They are NOT on the `window` object.

---

## 11. Closures

A **closure** is a function that **remembers** the variables from its **lexical scope** even after the outer function has finished executing.

```js
function outer() {
  let count = 0;
  return function inner() {
    count++;
    console.log(count);
  };
}

const increment = outer();
increment(); // 1
increment(); // 2
increment(); // 3
```

The `inner` function closes over `count` — it retains access to `count` even though `outer` has returned.

### Advantages

- **Encapsulation** — hides implementation details.
- **Data Privacy** — create private variables inaccessible from outside.

### Applications

- Currying
- Memoization (Higher-Order Functions)
- `setTimeout` callbacks
- Module design pattern
- React `useState` (conceptually)

### ⚠️ Memory Consideration

Closures keep a reference to outer variables, which can prevent garbage collection — use carefully in performance-sensitive code.

---

## 12. Garbage Collection & Mark-and-Sweep

### Garbage Collector

JavaScript automatically frees memory for variables that are **unreachable** (no longer accessible by any running code).

```js
function a() {
  var x = 0;
  var z = 10; // Once the closure is returned, z is unreachable → GC'd
  return function b() {
    console.log(x); // x is still reachable via closure
  };
}
const y = a();
```

### Mark-and-Sweep Algorithm

1. Start from **roots** (global objects, currently executing functions).
2. **Mark** all objects reachable from roots.
3. **Sweep** (free) all unmarked (unreachable) objects.

This handles circular references that simple reference counting cannot.

---

## 13. Scope Chain & Lexical Environment

### Lexical Environment

Every execution context creates a **Lexical Environment** containing:

1. **Environment Record** — stores variable and function declarations.
2. **Reference to Outer Environment** — a link to the parent lexical scope.

### Scope Chain

When a variable is not found in the current scope, JavaScript traverses up through parent lexical environments until it either finds the variable or reaches the global scope.

```js
const global = "I'm global";

function outer() {
  const outerVar = "I'm outer";

  function inner() {
    // inner → outer → global (scope chain)
    console.log(outerVar); // Found in outer scope
    console.log(global); // Found in global scope
  }
  inner();
}
outer();
```

---

## 14. Event Loop, Micro-task & Macro-task Queue

JavaScript is **single-threaded** but achieves non-blocking behavior via the **Event Loop**.

### How It Works

1. **Call Stack** executes synchronous code.
2. Async callbacks are offloaded to Web APIs (browser/Node.js).
3. When async tasks complete, their callbacks are placed in a queue.
4. The **Event Loop** constantly checks if the Call Stack is empty — if so, it pushes the next callback from the queue.

### Task Queues

| Queue                | Contains                                                 | Priority                       |
| -------------------- | -------------------------------------------------------- | ------------------------------ |
| **Micro-task Queue** | Promise callbacks (`.then`/`.catch`), `MutationObserver` | Higher (runs first)            |
| **Macro-task Queue** | `setTimeout`, `setInterval`, I/O callbacks               | Lower (runs after micro-tasks) |

### Example

```js
const p = new Promise((resolve) => {
  setTimeout(() => resolve("Promise resolved"), 3000);
});

setTimeout(() => console.log("setTimeout"), 3000); // Macro-task

p.then((res) => console.log(res)); // Micro-task

// Output order (after 3s):
// "Promise resolved"  ← Micro-task runs first
// "setTimeout"        ← Macro-task runs second
```

> **Rule:** All micro-tasks are drained before the next macro-task begins.

---

## 15. this Keyword

`this` refers to the **object that is currently executing the code**.

### Rules

| Context                    | `this` refers to                                 |
| -------------------------- | ------------------------------------------------ |
| Global scope (non-strict)  | `window` (browser)                               |
| Regular function call      | `window` (non-strict) / `undefined` (strict)     |
| Method call `obj.method()` | `obj`                                            |
| Arrow function             | Enclosing lexical `this` (inherited from parent) |
| `new` constructor call     | Newly created object                             |
| DOM event handler          | The element that triggered the event             |

### Regular vs Arrow Function `this`

```js
const user = {
  name: "Alice",
  hobbies: ["coding", "gaming"],

  // Regular function — `this` is lost in forEach callback
  listBad() {
    this.hobbies.forEach(function (h) {
      console.log(this.name, h); // undefined — `this` is window
    });
  },

  // Arrow function — inherits `this` from listGood
  listGood() {
    this.hobbies.forEach((h) => {
      console.log(this.name, h); // "Alice" — correct!
    });
  },
};
```

### ⚠️ Arrow Functions & `this`

Arrow functions do **not** have their own `this`. You **cannot** change their `this` using `call()`, `apply()`, or `bind()`.

```js
const obj = {
  name: "arfat",
  printName: () => {
    console.log(this.name); // undefined — arrow has no own `this`
  },
};
```

---

## 16. call(), apply(), bind()

These methods explicitly set the value of `this` for a function.

### `call(context, arg1, arg2, ...)`

Invokes the function immediately with a specified `this` and individual arguments.

```js
function greet(city, country) {
  console.log(`${this.name} from ${city}, ${country}`);
}
const person = { name: "Alice" };
greet.call(person, "Delhi", "India"); // "Alice from Delhi, India"
```

### `apply(context, [arg1, arg2, ...])`

Same as `call()`, but arguments are passed as an **array**.

```js
greet.apply(person, ["Mumbai", "India"]);

// Useful trick:
Math.max.apply(null, [1, 5, 2, 6]); // 6
```

### `bind(context, arg1, ...)`

Returns a **new function** with `this` permanently bound. Does not invoke immediately.

```js
const boundGreet = greet.bind(person, "Chennai");
boundGreet("India"); // "Alice from Chennai, India"
```

### Polyfills

<details>
<summary>bind() Polyfill</summary>

```js
Function.prototype.mybind = function (context = {}, ...args) {
  if (typeof this !== "function") {
    throw new Error(this + " cannot be bound as it's not callable");
  }
  context.fn = this;
  return function (...args2) {
    context.fn(...args, ...args2);
  };
};
```

</details>

<details>
<summary>call() Polyfill</summary>

```js
Function.prototype.myCall = function (context = {}, ...args) {
  if (typeof this !== "function") {
    throw new Error(this + " is not callable");
  }
  context.fn = this;
  context.fn(...args);
};
```

</details>

<details>
<summary>apply() Polyfill</summary>

```js
Function.prototype.myApply = function (context = {}, argsArray) {
  if (typeof this !== "function") {
    throw new Error(this + " is not callable");
  }
  if (!Array.isArray(argsArray)) {
    throw new TypeError("CreateListFromArrayLike called on non-object");
  }
  context.fn = this;
  context.fn(...argsArray);
};
```

</details>

---

## 17. Prototype & Prototype Chain

### Prototype

Every JavaScript object has a built-in hidden property `[[Prototype]]` (accessible via `__proto__` or `Object.getPrototypeOf()`). It points to another object from which it **inherits** properties and methods.

```js
const arr = [1, 2, 3];
// arr → Array.prototype → Object.prototype → null
```

### Prototype Chain

When you access a property on an object, JavaScript looks:

1. On the object itself.
2. Up the prototype chain.
3. Until it finds it or reaches `null`.

```js
function Person(name) {
  this.name = name;
}
Person.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

const alice = new Person("Alice");
alice.greet(); // Found on Person.prototype
```

### Key APIs

```js
Object.getPrototypeOf(obj); // Get prototype (recommended over __proto__)
Object.setPrototypeOf(obj, proto); // Set prototype
Object.create(null); // Create object with NO prototype
Object.create(proto); // Create object with given prototype
```

### Custom Array Method via Prototype

```js
Array.prototype.includesOneOf = function (array) {
  return array.some((item) => this.includes(item));
};

[1, 2, 3].includesOneOf([5, 2]); // true
```

### `hasOwnProperty` vs `in`

```js
const arr = [1];
arr.hasOwnProperty("0"); // true — own property
arr.hasOwnProperty("map"); // false — inherited
"map" in arr; // true — checks prototype chain too
```

---

## 18. Functions — Types & Concepts

### Function Types

| Type                          | Hoisted?                 | Notes                              |
| ----------------------------- | ------------------------ | ---------------------------------- |
| **Function Declaration**      | Fully hoisted            | Can be called before definition    |
| **Function Expression**       | Variable only (if `var`) | Not callable before definition     |
| **Arrow Function**            | No                       | No own `this`, `arguments`         |
| **Anonymous Function**        | No                       | Used as values/callbacks           |
| **Named Function Expression** | Variable only            | Name only accessible inside itself |

```js
// 1. Declaration — fully hoisted
function add(a, b) {
  return a + b;
}

// 2. Expression
const add = function (a, b) {
  return a + b;
};

// 3. Arrow
const add = (a, b) => a + b;

// 4. Named function expression
const factorial = function fact(n) {
  return n <= 1 ? 1 : n * fact(n - 1); // `fact` accessible here only
};
```

### First-Class Functions

In JavaScript, functions are **first-class citizens** — they can be:

- Passed as arguments to other functions.
- Returned from functions.
- Assigned to variables.

### Higher-Order Functions (HOF)

A function that takes a function as an argument **or** returns a function.

```js
// Takes a function
[1, 2, 3].map((n) => n * 2);

// Returns a function
function multiplier(factor) {
  return (n) => n * factor;
}
const double = multiplier(2);
double(5); // 10
```

### Callback Functions

A function passed into another function to be **called later**.

```js
setTimeout(() => console.log("Delayed"), 1000); // Arrow function as callback
[1, 2, 3].forEach(function (n) {
  console.log(n);
}); // Regular function as callback
```

### Pure Functions

A function that:

1. Returns the same output for the same input.
2. Has **no side effects** (no mutation, no I/O).

```js
// Pure
const add = (a, b) => a + b;
const addToArray = (arr, item) => [...arr, item]; // Returns new array

// Impure
let count = 0;
const increment = () => count++; // Side effect: modifies outer variable
Math.random(); // Impure — different output each call
```

### The `arguments` Object

Available inside **regular functions** (not arrow functions). Array-like object of all passed arguments.

```js
function sum() {
  let total = 0;
  for (let arg of arguments) total += arg;
  return total;
}
sum(1, 2, 3, 4); // 10
```

> Prefer **rest parameters** `...args` (modern):

```js
const sum = (...args) => args.reduce((a, b) => a + b, 0);
```

---

## 19. Currying

Currying transforms a function with multiple arguments into a sequence of functions each taking **one argument at a time**.

```js
// Normal
function sum(a, b, c) {
  return a + b + c;
}
sum(1, 2, 3); // 6

// Curried manually
function curriedSum(a) {
  return function (b) {
    return function (c) {
      return a + b + c;
    };
  };
}
curriedSum(1)(2)(3); // 6
```

### Generic Curry Implementation

```js
const curry = (fn) => {
  const helper = (...args) => {
    if (args.length >= fn.length) {
      return fn(...args); // All args received — call original
    }
    return (...moreArgs) => helper(...args, ...moreArgs); // Collect more args
  };
  return helper;
};

function sum(a, b, c, d, e) {
  return a + b + c + d + e;
}

const curriedSum = curry(sum);
curriedSum(1)(2, 3)(4, 5); // 15
curriedSum(1, 2, 3, 4, 5); // 15
curriedSum(1)(2)(3)(4)(5); // 15
```

> `fn.length` returns the number of **declared parameters** of a function.

### Use Cases

- Reusing functions with pre-filled arguments.
- Creating **partial application**.
- Composing functions in a pipeline.

---

## 20. Memoization

Memoization is an optimization technique that **caches** the result of expensive function calls and returns the cached result when the same inputs occur again.

```js
const memoize = (fn) => {
  const cache = {};
  return function (...args) {
    const key = JSON.stringify(args);
    if (cache[key] !== undefined) {
      return cache[key]; // Return cached result
    }
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
};

function square(n) {
  console.log("Computing...");
  return n * n;
}

const memoizedSquare = memoize(square);
memoizedSquare(5); // "Computing..." → 25
memoizedSquare(5); //               → 25 (from cache, no log)
memoizedSquare(6); // "Computing..." → 36
```

### When to Use

- **Pure functions** only (same input → same output).
- Computationally expensive operations (e.g., factorial, Fibonacci, API-response caching).

> Lodash provides `_.memoize(fn)` out of the box.

---

## 21. Debouncing & Throttling

Both are techniques to **control the rate** at which a function is executed — critical for performance on events like scroll, resize, keyup, etc.

### Debouncing

Executes the function **only after** a specified delay since the last call. Good for: search input, form validation.

```
User types: a → b → c → d → (pause 500ms) → API call
```

```js
const debounce = (fn, delay) => {
  let timer;
  return function (...args) {
    clearTimeout(timer); // Reset the timer on every call
    timer = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
};

const search = debounce((query) => {
  console.log("Searching:", query);
}, 500);

// In an input handler:
input.addEventListener("input", (e) => search(e.target.value));
```

### Throttling

Executes the function **at most once** per specified interval, regardless of how many times it's called. Good for: scroll events, button spam prevention.

```
User scrolls: event → execute → (ignore for 500ms) → execute → ...
```

```js
const throttle = (fn, limit) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      return fn.apply(this, args);
    }
  };
};

const onScroll = throttle(() => {
  console.log("Scroll event handled");
}, 500);

window.addEventListener("scroll", onScroll);
```

### Debounce vs Throttle

|                        | Debounce               | Throttle                   |
| ---------------------- | ---------------------- | -------------------------- |
| **When fires**         | After inactivity       | At regular intervals       |
| **Use case**           | Search, resize-end     | Scroll, drag, button click |
| **Fires during burst** | No (resets every call) | Yes (once per interval)    |

---

## 22. Promises & async/await

### Promises

A `Promise` represents the **eventual result** of an async operation. It can be in one of three states:

- **Pending** — initial state
- **Fulfilled** — operation succeeded (`resolve`)
- **Rejected** — operation failed (`reject`)

```js
const fetchData = new Promise((resolve, reject) => {
  setTimeout(() => resolve("Data loaded"), 2000);
});

fetchData
  .then((data) => console.log(data)) // "Data loaded"
  .catch((err) => console.error(err));
```

### Promise Chaining

```js
fetch("/api/user")
  .then((res) => res.json())
  .then((user) => fetch(`/api/posts/${user.id}`))
  .then((res) => res.json())
  .then((posts) => console.log(posts))
  .catch((err) => console.error("Error:", err));
```

### async/await

`async/await` is **syntactic sugar** over Promises — makes async code look synchronous.

- `async` before a function makes it always return a Promise.
- `await` pauses execution **inside** the async function until the Promise settles. Other code outside continues to run.

```js
async function loadData() {
  try {
    const res = await fetch("/api/data");
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error("Error:", err);
  }
}
```

### Parallel vs Sequential

```js
// Sequential — p2 waits for p1 to finish
const val1 = await p1;
const val2 = await p2;

// Parallel — both start immediately
const [val1, val2] = await Promise.all([p1, p2]);
```

### Micro-task behavior

```js
const p1 = new Promise((resolve) => setTimeout(() => resolve("P1"), 5000));
const p2 = new Promise((resolve) => setTimeout(() => resolve("P2"), 2000));

async function handle() {
  const v1 = await p1; // Waits 5s
  console.log(v1); // Prints at 5s
  const v2 = await p2; // p2 already resolved, prints immediately
  console.log(v2);
}
handle();
```

---

## 23. Array Methods & Polyfills

### Common Array Methods

| Method                         | Description                               | Mutates? |
| ------------------------------ | ----------------------------------------- | -------- |
| `map(cb)`                      | Transform each element, returns new array | No       |
| `filter(cb)`                   | Keep elements matching condition          | No       |
| `reduce(cb, init)`             | Accumulate values to single result        | No       |
| `forEach(cb)`                  | Iterate, returns undefined                | No       |
| `find(cb)`                     | First element matching condition          | No       |
| `findIndex(cb)`                | Index of first matching element           | No       |
| `some(cb)`                     | True if any element matches               | No       |
| `every(cb)`                    | True if all elements match                | No       |
| `includes(val)`                | Checks existence                          | No       |
| `splice(start, del, ...items)` | Add/remove elements                       | **Yes**  |
| `slice(start, end)`            | Extract sub-array                         | No       |
| `concat(...arrays)`            | Merge arrays                              | No       |
| `sort(compareFn)`              | Sort in place                             | **Yes**  |
| `flat(depth)`                  | Flatten nested arrays                     | No       |
| `Array.from(iterable)`         | Create array from iterable                | —        |

### map() Polyfill

```js
Array.prototype.myMap = function (callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    result.push(callback(this[i], i, this));
  }
  return result;
};
```

### filter() Polyfill

```js
Array.prototype.myFilter = function (callback) {
  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (callback(this[i], i, this)) {
      result.push(this[i]);
    }
  }
  return result;
};
```

### reduce() Polyfill

```js
Array.prototype.myReduce = function (callback, initialValue) {
  let accumulator = initialValue;
  for (let i = 0; i < this.length; i++) {
    accumulator = callback(accumulator, this[i], i, this);
  }
  return accumulator;
};
```

### forEach() Polyfill

```js
Array.prototype.myForEach = function (callback) {
  for (let i = 0; i < this.length; i++) {
    callback(this[i], i, this);
  }
};
```

### Chaining Example

```js
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 35 },
  { name: "Charlie", age: 22 },
];

// Get names of users under 30
const youngNames = users.filter((u) => u.age < 30).map((u) => u.name);
// ["Alice", "Charlie"]
```

### `forEach` skips holes

```js
const arr = [];
arr[0] = "A";
arr[2] = "C";
arr.length; // 3
arr.forEach((el) => console.log(el)); // "A" then "C" — index 1 is skipped
```

### Sorting

```js
// Lexicographic (default — only use for strings)
["banana", "apple", "cherry"].sort();

// Numeric ascending
[10, 3, 5, 1].sort((a, b) => a - b);

// Numeric descending
[10, 3, 5, 1].sort((a, b) => b - a);

// Shuffle
arr.sort(() => Math.random() - 0.5);
```

### Removing Falsy Values

```js
const arr = [0, 1, false, 2, "", 3, null, undefined, NaN];
arr.filter(Boolean); // [1, 2, 3]
```

---

## 24. DOM & BOM

### DOM (Document Object Model)

The DOM is a **tree of JavaScript objects** representing the HTML structure of a page. Browsers parse HTML into this tree, allowing JavaScript to read and modify it dynamically.

```
document
  └── html
        ├── head
        │     └── title
        └── body
              ├── h1
              └── div
```

### Key DOM Properties

| Property                       | Description                                |
| ------------------------------ | ------------------------------------------ |
| `element.textContent`          | All text within element (including hidden) |
| `element.innerText`            | Visible rendered text                      |
| `element.innerHTML`            | HTML markup inside element                 |
| `element.getAttribute("name")` | Get attribute value                        |
| `element.style.color`          | Inline style                               |
| `element.tagName`              | Tag name (uppercase)                       |

### `textContent` vs `innerText` vs `innerHTML`

```html
<div id="el">Hello <b>World</b></div>
```

```js
el.textContent; // "Hello World"       — raw text, ignores tags
el.innerText; // "Hello World"       — rendered text
el.innerHTML; // "Hello <b>World</b>" — includes HTML tags
```

### DOM Manipulation

```js
// Create
const div = document.createElement("div");
div.textContent = "Hello";

// append() — can accept strings and nodes
parent.append("Text", childNode);

// appendChild() — only accepts nodes
parent.appendChild(childNode);
parent.appendChild("text"); // ❌ TypeError

// Remove
element.remove();
```

### Event Handling

```js
element.addEventListener("click", handler);
element.removeEventListener("click", handler);
```

| Event property               | Description                         |
| ---------------------------- | ----------------------------------- |
| `event.target`               | Element that triggered the event    |
| `event.currentTarget`        | Element the listener is attached to |
| `event.preventDefault()`     | Prevent default browser action      |
| `event.stopPropagation()`    | Stop event from bubbling up         |
| `event.isDefaultPrevented()` | Check if preventDefault was called  |

### BOM (Browser Object Model)

BOM provides JavaScript access to **browser-level** features outside the DOM.

```js
window.innerWidth / window.innerHeight; // Viewport dimensions
window.screen.width / window.screen.height;

// Navigation
window.location.pathname;
window.location.href;
window.location.assign("https://example.com"); // Navigate
window.location.replace("https://example.com"); // No history entry
window.location.reload();

// Timers (part of BOM)
setTimeout(fn, 1000);
setInterval(fn, 1000);
clearTimeout(id);
clearInterval(id);

// Open new window/tab
window.open("https://example.com");
```

### `localStorage`

```js
localStorage.setItem("key", JSON.stringify(data));
const data = JSON.parse(localStorage.getItem("key"));
localStorage.removeItem("key");
localStorage.clear();
```

---

## 25. Type Coercion & Conversion

### Type Coercion (Implicit)

JavaScript **automatically** converts types when operators are applied to mismatched types.

```js
"5" - 3; // 2   (string → number)
"5" + 3; // "53" (number → string via +)
true + 1; // 2
false + 1; // 1
null + 5; // 5
undefined + 5; // NaN
"5" * "3"; // 15  (both → number)
"Bruce" - "Wayne"; // NaN

Number(""); // 0
Number(null); // 0
Number(undefined); // NaN
```

### Type Conversion (Explicit)

```js
Number("42"); // 42
String(42); // "42"
Boolean(0); // false
Boolean("hi"); // true
parseInt("42px"); // 42
parseFloat("3.14abc"); // 3.14
4.67 | 0; // 4  — bitwise OR truncates to integer
(4.67).toFixed(2); // "4.67"
(255).toString(16); // "ff" — convert to hex
(10).toString(2); // "1010" — convert to binary
```

### `!!` (Double Negation)

Converts any value to its boolean equivalent:

```js
!!0; // false
!!"hello"; // true
!!null; // false
!![]; // true
```

---

## 26. Symbol

`Symbol` is a **primitive data type** that creates a guaranteed unique value. No two symbols are ever equal.

```js
const a = Symbol("description");
const b = Symbol("description");

a === b; // false — always unique
a == b; // false
```

### Use Case: Unique Object Keys

```js
const id = Symbol("id");
const user = {
  name: "Alice",
  [id]: 123, // Symbol as key — won't clash with other "id" keys
};

user[id]; // 123
user.name; // "Alice"
// Symbols don't appear in for...in or Object.keys()
```

---

## 27. Classes, Inheritance & OOP

### Class Syntax

A **class** is a blueprint/template for creating objects. It is syntactic sugar over JavaScript's prototype-based system.

```js
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }

  greet() {
    return `Hi, I'm ${this.name}`;
  }

  get info() {
    return `${this.name} (${this.age})`;
  }

  set info(value) {
    [this.name, this.age] = value.split(",");
  }
}

const alice = new Person("Alice", 25);
alice.greet(); // "Hi, I'm Alice"
alice.info; // "Alice (25)"
```

### Inheritance

```js
class Animal {
  constructor(name) {
    this.name = name;
  }
  speak() {
    return `${this.name} makes a sound.`;
  }
}

class Dog extends Animal {
  constructor(name) {
    super(name); // Must call super() before using `this`
  }
  speak() {
    return `${this.name} barks.`; // Override parent method
  }
}

const d = new Dog("Rex");
d.speak(); // "Rex barks."
```

### Object.seal() vs Object.freeze()

| Method            | Add Props | Delete Props | Modify Values |
| ----------------- | --------- | ------------ | ------------- |
| `Object.seal()`   | ❌        | ❌           | ✅            |
| `Object.freeze()` | ❌        | ❌           | ❌            |

```js
const obj = { a: 1, b: 2 };
Object.freeze(obj);
obj.a = 99; // Silently ignored (or throws in strict mode)
console.log(obj.a); // 1
```

### Freezing a Specific Property

```js
Object.defineProperty(user, "dob", {
  value: "29-01-2000",
  writable: false,
});
user.dob = "01-01-1990"; // Silently fails or throws in strict mode
```

### Library vs Framework

|                          | Library               | Framework                                  |
| ------------------------ | --------------------- | ------------------------------------------ |
| **Control**              | You call the library  | Framework calls your code                  |
| **Inversion of control** | No                    | Yes                                        |
| **Examples**             | Lodash, Axios, jQuery | React (technically), Angular, Vue, Next.js |

---

## 28. Miscellaneous Tips

### Convert Float to Integer

```js
let x = 4.67;
let z = x | 0; // 4 — bitwise OR truncation
Math.floor(4.67); // 4
Math.trunc(4.67); // 4
parseInt(4.67); // 4
```

### Useful Object Methods

```js
Object.keys(obj); // ["key1", "key2"]
Object.values(obj); // [val1, val2]
Object.entries(obj); // [["key1", val1], ["key2", val2]]
Object.assign(target, src); // Shallow merge
Object.create(proto); // Create with given prototype
Object.create(null); // Create with NO prototype
```

### String Methods

```js
str.match(/pattern/); // Extract matches
str.test(/pattern/); // Test if pattern exists (use on RegExp)
/pattern/.test(str); // Preferred way to test
String.fromCharCode(65); // "A"
str.indexOf("sub"); // Position of substring
str.includes("sub"); // true/false
str.split(","); // Split to array
str.trim(); // Remove whitespace
```

### `for...in` vs `for...of`

```js
const arr = [3, 5, 7];
arr.foo = "hello";

for (let x in arr) {
  console.log(x); // "0", "1", "2", "foo" — iterates keys
}

for (let x of arr) {
  console.log(x); // 3, 5, 7 — iterates values only
}
```

### `delete` from Array

```js
let a = [1, 2, 3];
delete a[1];
console.log(a); // [1, empty, 3] — creates a hole, length unchanged
```

### `splice` vs `slice`

```js
// splice — MUTATES original
const arr = [1, 2, 3, 4, 5];
arr.splice(1, 2); // Removes 2 elements at index 1 → [1, 4, 5]
arr.splice(1, 0, 10, 11); // Inserts at index 1 → [1, 10, 11, 4, 5]

// slice — returns NEW array
const arr2 = [1, 2, 3, 4, 5];
arr2.slice(1, 3); // [2, 3] — original unchanged
```

### `map` vs `forEach`

|           | `map()`           | `forEach()`  |
| --------- | ----------------- | ------------ |
| Returns   | New array         | `undefined`  |
| Chainable | Yes               | No           |
| Use for   | Transforming data | Side effects |

### `append()` vs `appendChild()`

```js
parent.append(childNode); // ✅ Accepts both nodes and strings
parent.append("text"); // ✅

parent.appendChild(node); // ✅
parent.appendChild("text"); // ❌ TypeError
```

---

> **Note:** This document was generated from learning notes and covers fundamental to intermediate JavaScript concepts. For deeper dives, refer to [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript).
