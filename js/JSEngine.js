// Learn about JS Engine
// https://www.freecodecamp.org/news/how-javascript-works-behind-the-scenes/

// -> Abstract syntax tree (AST)
//  https://astexplorer.net/

//---- optimiztion technic ----- //
// -> mark and sweep algo for garbage collection
// https://www.geeksforgeeks.org/mark-and-sweep-garbage-collection-algorithm/

// -> inlining function's
// a manual or compiler optimization that replaces a function call site
// with the body of the called function.

// function square(i) {
//   return i * i;
// }

// function f(x) {
//   var sum = 0;
//   for (var i = 0; i < x; i++) {
//     sum += square(i);
//   }
//   return sum;
// }
// If x is a large number, invoking f(x) will cause a lot of function call to square.
// Even if the overhead is small, it can become significant when accumulated over
// a bazillion calls. This promotes the best practice of avoiding function calls
// within such a loop.

// code after inline optimization
// function f(x) {
//   var sum = 0;
//   for (var i = x; i < x; i++) {
//     sum += i * i;
//   }
//   return sum;
// }
//....

// -> copy elision
// Copy elision in JavaScript is an optimization technique that
// prevents the unnecessary copying of objects. It is implemented
// by the V8 engine, which is used by Chrome and other browsers.

// Copy elision can be used in a number of situations,
// such as when passing an object as an argument to a function,
// or when returning an object from a function.

// function foo(obj) {
//   // ...
// }
// const obj = {};
// foo(obj);

//   function foo() {
//     const obj = {};
//     return obj;
//   }
//   const obj = foo();

//....

// -> Inline caching
// Inline caching is an optimization technique used in JavaScript
// engines to speed up property lookups. It works by caching the
// results of a previous property lookup at the call site, so that
// subsequent lookups can be performed without having to go through
// the entire lookup process again.
//eg :-
// function getPropertyValue(obj, propertyName) {
//     // Check the hidden class of the object to see if the property is present.
//     if (obj.hiddenClass.hasProperty(propertyName)) {
//       // The property is present, so return its value.
//       return obj[propertyName];
//     } else {
//       // The property is not present, so perform a full lookup.
//       return obj[propertyName];
//     }
//   }
