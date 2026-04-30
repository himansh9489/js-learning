# JavaScript Notes — Part 2: AJAX, Promises, Destructuring & Modern JS Tricks

---

## Table of Contents

1. [Promises](#1-promises)
2. [fetch() API](#2-fetch-api)
3. [Promise API Methods](#3-promise-api-methods)
4. [Callback Hell & Promise Chaining](#4-callback-hell--promise-chaining)
5. [Destructuring](#5-destructuring)
6. [Rest & Spread Operators](#6-rest--spread-operators)
7. [Object Utilities](#7-object-utilities)
8. [Array Utilities](#8-array-utilities)
9. [JSON.stringify — Advanced Usage](#9-jsonstringify--advanced-usage)
10. [Optional Chaining](#10-optional-chaining)
11. [Console Debugging Tricks](#11-console-debugging-tricks)
12. [Miscellaneous Modern JS Tips](#12-miscellaneous-modern-js-tips)

---

## 1. Promises

### What is a Promise?

A **Promise** is a built-in JavaScript object that represents the **eventual completion or failure** of an asynchronous operation. Before Promises, asynchronous code was handled with nested callbacks, which led to messy, hard-to-read code (known as "Callback Hell" or "Pyramid of Doom"). Promises solve this by giving you a cleaner, chainable API.

**Key characteristics:**

- It is an object with a `.then()` method.
- It waits for an async task to complete and then delivers the result via a callback.
- It gives you **inversion of control** — you decide what happens next, not the external library.
- It allows access to future values.

### Promise States

A Promise is always in one of three states:

| State         | Description                                         |
| ------------- | --------------------------------------------------- |
| **Pending**   | Initial state — the operation has not completed yet |
| **Fulfilled** | The operation completed successfully                |
| **Rejected**  | The operation failed                                |

Once a Promise settles (fulfilled or rejected), it cannot change state again.

### Creating a Promise

```js
var flag = true;

function checkUserStatus() {
  var promise = new Promise((resolve, reject) => {
    setTimeout(() => {
      if (flag) {
        resolve("User Logged in");
      } else {
        reject("User not logged in");
      }
    }, 1000);
  });
  return promise;
}

checkUserStatus()
  .then((msg) => {
    console.log(msg); // "User Logged in"
  })
  .catch(() => console.log("User not logged in"));
```

> `resolve` is called when the async task succeeds; `reject` is called when it fails. `.catch()` handles any rejection in the chain.

---

## 2. fetch() API

`fetch()` is the modern, Promise-based way to make HTTP requests in the browser. It replaces the older `XMLHttpRequest`.

### How it works

1. `fetch(url)` returns a Promise that resolves to a **Response** object (a readable stream).
2. You must call `.json()` on the Response to parse the body — and `.json()` also returns a Promise.

```js
fetch("https://api.example.com/data")
  .then(function (response) {
    return response.json(); // parse the stream into JSON
  })
  .then(function (data) {
    console.log(data); // actual data
  })
  .catch(function (err) {
    console.error("Error:", err);
  });
```

### Simple Promise with setTimeout

```js
function test() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(Math.random());
    }, 1000);
  });
}

test().then(function (data) {
  console.log(data); // a random number after 1 second
});
```

---

## 3. Promise API Methods

JavaScript provides four static Promise methods for running multiple async operations:

### `Promise.all()`

Runs all promises **in parallel**. Resolves when **all** of them fulfill. **Rejects immediately** if any one fails (fail-fast behaviour).

```js
Promise.all([p1(), p2(), p3()]).then((results) => {
  console.log(results); // array of all results
});
```

> Use when you need **all** results and cannot proceed if any fails.

---

### `Promise.allSettled()`

Runs all promises in parallel and waits for **all** of them to settle (either fulfill or reject). Never short-circuits.

Each result is an object:

- `{ status: "fulfilled", value: ... }`
- `{ status: "rejected", reason: ... }`

```js
Promise.allSettled([p1(), p2(), p3()]).then((results) => {
  results.forEach((result) => {
    if (result.status === "fulfilled") {
      console.log("Value:", result.value);
    } else {
      console.log("Reason:", result.reason);
    }
  });
});
```

> Use when you want to know the outcome of **every** promise regardless of failures.

---

### `Promise.race()`

Resolves or rejects as soon as the **first** promise settles (whichever is fastest wins).

```js
Promise.race([p1(), p2(), p3()]).then((firstResult) => {
  console.log(firstResult); // result of whichever resolved/rejected first
});
```

> Use for timeout patterns — race your actual request against a timeout promise.

---

### `Promise.any()`

Resolves with the **first fulfilled** promise. If **all** promises reject, it throws an `AggregateError`.

```js
Promise.any([p1(), p2(), p3()])
  .then((firstSuccess) => {
    console.log(firstSuccess);
  })
  .catch((err) => {
    console.log(err.errors); // array of all rejection reasons
  });
```

> Use when you need at least one success (e.g., trying multiple CDN endpoints).

### Comparison Table

| Method               | Resolves when                     | Rejects when                 |
| -------------------- | --------------------------------- | ---------------------------- |
| `Promise.all`        | All fulfill                       | Any one rejects              |
| `Promise.allSettled` | All settle (never rejects)        | —                            |
| `Promise.race`       | First settles (fulfill or reject) | First settles with rejection |
| `Promise.any`        | First fulfills                    | All reject                   |

---

## 4. Callback Hell & Promise Chaining

### Callback Hell (Pyramid of Doom)

Before Promises, async operations were chained through nested callbacks. This leads to deeply indented, unreadable code:

```js
doStep1(function (result1) {
  doStep2(result1, function (result2) {
    doStep3(result2, function (result3) {
      doStep4(result3, function (result4) {
        // ... impossible to maintain
      });
    });
  });
});
```

The key problem is **loss of inversion of control** — you hand your callback to an external function and trust it will be called correctly.

### Promise Chaining — The Solution

Each `.then()` returns a new Promise, so you can chain them flat instead of nesting them. You also retain control over what happens next.

```js
let cart = ["one", "two", "three"];

function validate(cart) {
  return true;
}

function createOrder(cart) {
  return new Promise((resolve, reject) => {
    if (!validate(cart)) {
      reject("Cart is not valid");
    }
    let orderId = "1234";
    if (orderId) {
      setTimeout(() => {
        resolve(orderId);
      }, 1000);
    }
  });
}

function proceedToPayment(orderId) {
  return new Promise((resolve, reject) => {
    if (orderId) {
      setTimeout(() => {
        resolve("success");
      }, 1000);
    }
  });
}

function showOrderSummary(paymentStatus) {
  return new Promise((resolve, reject) => {
    if (paymentStatus === "success") {
      resolve({ orders: cart });
    }
  });
}

// Clean flat chain — no nesting!
createOrder(cart)
  .then((orderId) => {
    console.log("orderId", orderId);
    return proceedToPayment(orderId); // return the next promise
  })
  .then((paymentStatus) => {
    console.log("paymentStatus", paymentStatus);
    return showOrderSummary(paymentStatus);
  })
  .then((orderDetails) => {
    console.log("orderDetails", orderDetails);
  })
  .catch((err) => {
    console.log("error", err); // catches any rejection in the chain
  });
```

> **Key rule:** Always `return` the next Promise inside `.then()` so the chain works correctly.

---

## 5. Destructuring

Destructuring lets you unpack values from arrays or properties from objects into distinct variables. It works with: **arrays, strings, maps, objects** and more.

### Object Destructuring

The variable name must match the object's key.

```js
const obj = { name: "arfat", lastname: "salman", dob: "jan" };

const { lastname, name } = obj;
console.log(name); // arfat
console.log(lastname); // salman
```

### Property Renaming in Destructuring

You can rename a property while destructuring using the `key: newName` syntax.

```js
const obj = { id: 1, name: "tarun" };

const { id: empId, name: firstName } = obj;
console.log(empId); // 1
console.log(firstName); // tarun
```

You can even extract the same property into two different variable names:

```js
const { name: empName, name: aliasName } = obj;
console.log(empName); // tarun
console.log(aliasName); // tarun
```

### Nested Object Destructuring

```js
const obj = {
  id: 1,
  name: "tarun",
  address: {
    city: "Surat",
    state: "Gujarat",
    country: "India",
  },
};

const {
  address: { country, state },
} = obj;

console.log(country); // India
console.log(state); // Gujarat
```

> Note: `address` itself is not available as a variable here — only `country` and `state` are extracted.

### Array Destructuring

```js
const arr = [10, 20, 30, 40, 50];
const [first, second] = arr;
console.log(first); // 10
console.log(second); // 20
```

### Skipping Values in Array Destructuring

Use commas to skip elements you don't need.

```js
const arr = [10, 20, 30, 40, 50];
const [, , ...restArr] = arr; // skip first two
console.log(restArr); // [30, 40, 50]
```

### Object Destructuring on an Array

Arrays are objects under the hood, so you can use object destructuring with numeric keys (indices).

```js
const colors = ["#dfaffa", "#9942ds", "#lao355", "#lsdf93"];

const { 0: firstColor, 3: lastColor } = colors;
console.log(firstColor); // "#dfaffa"
console.log(lastColor); // "#lsdf93"
```

---

## 6. Rest & Spread Operators

Both use the `...` syntax but serve opposite purposes.

### Spread Operator (`...`)

Expands an iterable (array, object, string) into individual elements. Can appear **anywhere** on the right-hand side.

```js
// Shallow copy an array
const arr = [10, 30, 20, 40];
const newArr = [...arr];

// Shallow copy an object
const obj = { id: 1, name: "" };
const newObj = { ...obj };

// Merge an object with extra properties
const obj3 = { name: "arfat", lastname: "jangra", dob: "jan" };
const { name, ...rest } = { ...obj3, age: 21 };

console.log(name); // arfat
console.log(rest); // { lastname: 'jangra', dob: 'jan', age: 21 }
```

**Spreading primitives:** Only strings produce enumerable own properties when spread into an object.

```js
const obj = { ...true, ..."test", ...10 };
console.log(obj); // { '0': 't', '1': 'e', '2': 's', '3': 't' }
// booleans and numbers spread to empty objects; strings spread character by character
```

### Rest Operator (`...`)

Collects the **remaining** elements into a new array or object. **Must be last** in a destructuring pattern.

```js
const obj = { name: "arfat", lastname: "salman", dob: "jan" };
const { lastname, ...restabc } = obj;

console.log(lastname); // salman
console.log(restabc); // { name: 'arfat', dob: 'jan' }
```

> **Rule:** You cannot have two rest elements in one destructuring: `const { ...a, ...b } = obj` — this throws a SyntaxError.

### Conditionally Add a Property to an Object

```js
const includeSalary = true;

const obj = {
  id: 1,
  name: "",
  ...(includeSalary && { salary: 4904395 }), // only added if includeSalary is true
};
```

---

## 7. Object Utilities

### Check if a Property Exists — `in` vs `hasOwnProperty`

| Method                      | Checks prototype chain?                            |
| --------------------------- | -------------------------------------------------- |
| `'key' in obj`              | Yes — returns `true` even for inherited properties |
| `obj.hasOwnProperty('key')` | No — only checks the object itself                 |

```js
const obj = { id: 1, name: "", salary: 459395 };

console.log("salary" in obj); // true
console.log(obj.hasOwnProperty("salary")); // true

// Inherited property example:
console.log("toString" in obj); // true  (from prototype)
console.log(obj.hasOwnProperty("toString")); // false (not own property)
```

### Delete a Property

```js
const obj = { id: 1, name: "", salary: 459395 };

// With the delete keyword (mutates the original)
delete obj.salary;

// Without delete keyword (non-mutating, uses destructuring)
const { salary, ...newEmployee } = obj;
// newEmployee = { id: 1, name: "" }
// original obj is unchanged
```

### Object.freeze() — Lock an Object

Prevents any modifications (add, delete, or update properties) to an object.

```js
const config = { apiUrl: "https://api.example.com" };
Object.freeze(config);

config.apiUrl = "https://other.com"; // silently fails in non-strict mode
console.log(config.apiUrl); // "https://api.example.com"
```

> Note: `Object.freeze()` is **shallow** — nested objects are not frozen.

### Object.entries() — Get Key-Value Pairs

Returns a 2D array of `[key, value]` pairs.

```js
const obj = { id: 1, name: "tarun" };
console.log(Object.entries(obj));
// [["id", 1], ["name", "tarun"]]
```

### Object.fromEntries() — Create an Object from Key-Value Pairs

The inverse of `Object.entries()`. Converts a 2D array (or any iterable of `[key, value]` pairs) into an object.

```js
const arr = [
  ["id", 1],
  ["name", "tarun"],
  ["age", 20],
];

const obj = Object.fromEntries(arr);
console.log(obj); // { id: 1, name: "tarun", age: 20 }
```

> Powerful combo: `Object.entries(obj).map(...).then(Object.fromEntries)` to transform object values.

### Nullish Coalescing (`??`)

Returns the **right-hand side** only when the left-hand side is `null` or `undefined` (not for `0`, `""`, or `false`).

```js
const value = null ?? "default";
console.log(value); // "default"

const value2 = 0 ?? "default";
console.log(value2); // 0  ← unlike ||, which would return "default"
```

---

## 8. Array Utilities

### Check if a Variable is an Array

```js
let arr = [];
console.log(Array.isArray(arr)); // true
console.log(typeof arr); // "object" — typeof alone is not reliable for arrays
```

### Filter Falsy Values (Falsy Bouncer)

`Boolean` can be passed directly as a filter predicate to remove all falsy values (`null`, `undefined`, `false`, `0`, `NaN`, `""`).

```js
const arr = [4, 5, null, undefined, false, 7, NaN];
const newArr = arr.filter(Boolean);
console.log(newArr); // [4, 5, 7]
```

### Check Occurrence with `Array.some()`

Returns `true` if **at least one** element matches the condition.

```js
const arr = [
  { id: 1, name: "abc" },
  { id: 2, name: "efg" },
  { id: 2, name: "jkl" },
];

const hasName = arr.some((item) => item.name === "jkl");
console.log(hasName); // true
```

### Check All Elements with `Array.every()`

Returns `true` only if **every** element matches the condition.

```js
const arr = [
  { id: 1, isActive: true },
  { id: 2, isActive: false },
  { id: 3, isActive: true },
];

const isAllActive = arr.every((item) => item.isActive === true);
console.log(isAllActive); // false — because id:2 is not active
```

### Flatten Nested Arrays with `Array.flat()`

Flattens nested arrays up to the specified depth. Pass `Infinity` to fully flatten.

```js
const arr = [0, 1, [2, [3, [4, 5]]]];

arr.flat(1); // [0, 1, 2, [3, [4, 5]]]
arr.flat(2); // [0, 1, 2, 3, [4, 5]]
arr.flat(Infinity); // [0, 1, 2, 3, 4, 5]
```

### Swap Two Variables (Destructuring Trick)

```js
let a = 10;
let b = 20;

[b, a] = [a, b];
console.log(a); // 20
console.log(b); // 10
```

### Mask Sensitive Numbers

```js
const cardNumber = "93459399458939859";
const last4Digits = cardNumber.slice(-4); // "9859"
const masked = last4Digits.padStart(cardNumber.length, "*");
console.log(masked); // "****************9859"
```

### Convert String to Number

Use the unary `+` operator as a quick conversion.

```js
const str = "42";
const num = +str;
console.log(typeof num); // "number"
console.log(num); // 42
```

---

## 9. JSON.stringify — Advanced Usage

`JSON.stringify(value, replacer, space)` accepts three arguments.

### With a Spacer (Formatting)

The third argument controls indentation — a number for spaces, or a string.

```js
const obj = { id: 1, name: "tarun", salary: "44859" };

JSON.stringify(obj); // '{"id":1,"name":"tarun","salary":"44859"}' — compact
JSON.stringify(obj, null, 2); // pretty-printed with 2-space indent
// {
//   "id": 1,
//   "name": "tarun",
//   "salary": "44859"
// }
```

### With a Replacer Function

A function that is called for each key-value pair. Return `undefined` to exclude a property.

```js
function replacer(key, value) {
  if (typeof value === "string") {
    return undefined; // exclude all string values
  }
  return value;
}

const obj = { foundation: "Mozilla", model: "box", week: 45, month: 7 };
JSON.stringify(obj, replacer); // '{"week":45,"month":7}'
```

### With a Replacer Array (Whitelist)

Pass an array of key names — only those keys will be included in the output.

```js
const obj = {
  id: 1,
  name: "tarun",
  address: { city: "Surat", state: "Gujarat", country: "India" },
};

const filters = ["name", "address", "city", "country"];
const result = JSON.stringify(obj, filters, 2);
// {
//   "name": "tarun",
//   "address": {
//     "city": "Surat",
//     "country": "India"
//   }
// }
// "state" is excluded because it's not in the filters array
```

---

## 10. Optional Chaining

### On Properties and Methods

```js
const user = null;
console.log(user?.address?.city); // undefined — no error thrown
```

### On Function Calls

Use `?.()` to safely call a function that might not exist.

```js
// Old pattern (incorrect approach)
fn && fn();

// Correct modern approach
fn?.();
```

This is especially useful for callbacks that may or may not be provided.

---

## 11. Console Debugging Tricks

### Measure Performance with `console.time()`

```js
console.time("myTimer");
// ... code to measure ...
console.timeEnd("myTimer"); // logs: "myTimer: 12.34ms"
```

### Group Logs with `console.group()`

Organize related logs into a collapsible group in DevTools.

```js
console.group("User Details");
console.log("Name: tarun");
console.log("Age: 25");
console.groupEnd();
```

### Conditional Logging with `console.assert()`

Only logs if the condition is **false** (i.e., it asserts the condition is true).

```js
const age = 15;
console.assert(age >= 18, "User is under 18!"); // logs the message because condition is false
```

### Table View with `console.table()`

Displays arrays or objects in a neat table format.

```js
const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
console.table(users);
```

---

## 12. Miscellaneous Modern JS Tips

### Large Number Literals with Numeric Separators

Use `_` as a visual separator in large numbers — it has no effect on the value but greatly improves readability.

```js
const num = 45000000000; // hard to read
const num1 = 45_000_000_000; // clear: 45 billion
const num2 = 45e9; // scientific notation
```

### Default Assignment for Required Arguments

Instead of checking inside the function, throw an error at the default parameter level.

```js
const isRequired = () => {
  throw new Error("Argument is required");
};

const greet = (name = isRequired()) => {
  console.log(`Hello, ${name}`);
};

greet("tarun"); // Hello, tarun
greet(); // Error: Argument is required
greet(null); // Hello, null — null is an explicit value, not "missing"
greet(""); // Hello,    — empty string is also explicit
```

### Problems with Default Exports

Named exports are generally preferred over default exports for the following reasons:

- **Poor discoverability** — IDEs and tools can't easily know what a module exports.
- **Difficult for tree-shaking** — automated tools struggle to analyze default exports.
- **CommonJS compatibility issues** — interop with `require()` becomes tricky.
- **TypeScript auto-import struggles** — named exports are far easier to auto-import.
- **Impossible large-scale refactoring** — you can rename a default export locally to anything, causing inconsistency across the codebase.

```js
// Preferred
export const myFunction = () => {};

// Avoid
export default () => {};
```

### Avoid Automatic Semicolon Insertion (ASI) Bugs

JavaScript auto-inserts semicolons in some positions, which can cause subtle bugs.

```js
function abc() {
  return       // ← ASI inserts a semicolon here!
  {
    id: "324",
  };
}

console.log(abc()); // undefined — the object is never returned!

// Fix: keep the opening brace on the same line as return
function abc() {
  return {
    id: "324",
  };
}
```

### `transitionend` Event

Fires when a CSS transition has fully completed. Useful for triggering logic after CSS animations.

```js
element.addEventListener("transitionend", () => {
  console.log("Transition completed!");
});
```

### Smooth Scroll to an Element

```js
element.scrollIntoView({
  behavior: "smooth",
});
```

### Check Object Property — `in` vs `hasOwnProperty` (Reminder)

```js
const obj = { id: 1 };

"id" in obj; // true — checks own + prototype chain
obj.hasOwnProperty("id"); // true — checks own property only

"toString" in obj; // true  — exists on prototype
obj.hasOwnProperty("toString"); // false — not an own property
```

### `Array.concat()`

Merges two or more arrays (or values) into a new array without mutating the originals.

```js
const a = [1, 2];
const b = [3, 4];
const c = a.concat(b, 5, 6);
console.log(c); // [1, 2, 3, 4, 5, 6]
```

---

> **Summary:** This document covers async JavaScript with Promises and fetch, modern destructuring patterns, essential array/object utilities, JSON serialisation techniques, and common JavaScript pitfalls to avoid. Master these to write cleaner, more professional JavaScript code.
