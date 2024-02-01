// Example of a function without memoization
function expensiveOperation(n) {
  console.log(`Performing expensive operation for ${n}`);
  return n * 2;
}

console.log(expensiveOperation(5)); // Output: Performing expensive operation for 5 \n 10
console.log(expensiveOperation(5)); // Output: Performing expensive operation for 5 \n 10 (operation is repeated)

// Memoization function wrapper
function memoize(func) {
  const cache = {};
  return (key) => {
    if (!(key in cache)) {
      console.log(`Calculating result for ${key}`);
      cache[key] = func(key);
      //cache[key] = func.apply(this, [key]);
    }
    return cache[key];
  };
}

// Applying memoization to the expensiveOperation function
const memoizedExpensiveOperation = memoize(expensiveOperation);

console.log(memoizedExpensiveOperation(5)); // Output: Calculating result for 5 \n Performing expensive operation for 5 \n 10
console.log(memoizedExpensiveOperation(5)); // Output: 10 (result is retrieved from cache)
