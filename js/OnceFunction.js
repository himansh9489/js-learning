function once(func) {
  let result;
  let executed = false;

  return function (...args) {
    if (!executed) {
      result = func(...args);
      executed = true;
    }
    return result;
  };
}

// Example usage:
function add(a, b) {
  console.log("Adding...");
  return a + b;
}

const addOnce = once(add);

console.log(addOnce(1, 2)); // Output: Adding... 3
console.log(addOnce(3, 4)); // Output: 3 (No "Adding..." because it's already executed)

// A once function is a higher-order function that takes another function as an argument
// and returns a new function. The new function, when called for the first time, will
// execute the original function and return its result. On subsequent calls, it will not
// execute the original function again but instead return the result that was computed on the first call.
