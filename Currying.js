// // Non-curried function
// function add(x, y, z) {
//   return x + y + z;
// }

// console.log(add(2, 3, 4)); // Output: 9

// // Curried version of the add function
// function curryAdd(x) {
//   return function (y) {
//     return function (z) {
//       return x + y + z;
//     };
//   };
// }

// const curriedAdd = curryAdd(2);

// console.log(curriedAdd(3)(4)); // Output: 9
