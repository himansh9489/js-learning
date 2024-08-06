const p1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("api 1 resolved"), 2000);
  //   setTimeout(() => reject("api 1 rejected"), 2000);
});

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("api 2 resolved"), 3000);
  //   setTimeout(() => reject("api 2 rejected"), 3000);
});

const p3 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("api 3 resolved"), 1000);
  //   setTimeout(() => reject("api 3 rejected"), 1000);
});

// Promise Api's

// Promise.all is a method that takes an iterable of promises (e.g., an array) 
// and returns a single promise that resolves when all of the promises in the 
// iterable have resolved or rejects when any promise in the iterable rejects. 
// The returned promise resolves with an array of the resolved values from the 
// input promises, in the same order as the input. 
// If any promise in the iterable rejects, the entire Promise.all rejects 
// immediately with that rejection reason.
Promise.all([p1, p2, p3])
  .then((res) => {
    console.log("all", res);
  })
  .catch((err) => {
    console.error("all", err);
  });

// The Promise.allSettled method returns a promise that resolves after all of the 
// given promises have either resolved or rejected, with an array of objects that 
// each describe the outcome of each promise.
Promise.allSettled([p1, p2, p3])
  .then((res) => {
    console.log("allSettled", res);
  })
  .catch((err) => {
    console.error("allSettled", err);
  });

// The Promise.race method returns a promise that resolves or rejects
// as soon as one of the promises in the iterable resolves or rejects.
Promise.race([p1, p2, p3])
  .then((res) => {
    console.log("race", res);
  })
  .catch((err) => {
    console.error("race", err);
  });

  
// The Promise.any method returns a promise that resolves as soon as one
// of the promises in the iterable resolves. If none of the promises resolve,
// it rejects with an AggregateError, a new type of error object that groups
// together individual errors.
Promise.any([p1, p2, p3])
  .then((res) => {
    console.log("any", res);
  })
  .catch((err) => {
    // when all promise fail it gives the AggregateError
    // to get list of errors do err.errors
    console.log("any", err.errors);
  });

console.log("hello world");
