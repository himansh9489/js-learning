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

Promise.all([p1, p2, p3])
  .then((res) => {
    console.log("all", res);
  })
  .catch((err) => {
    console.error("all", err);
  });

Promise.allSettled([p1, p2, p3])
  .then((res) => {
    console.log("allSettled", res);
  })
  .catch((err) => {
    console.error("allSettled", err);
  });

Promise.race([p1, p2, p3])
  .then((res) => {
    console.log("race", res);
  })
  .catch((err) => {
    console.error("race", err);
  });

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
