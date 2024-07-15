const p1 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("promise 1 resolved"), 3000);
});

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => resolve("promise 2 resolved"), 5000);
});

// async function always return promise
// async function data() {
//   // return "hello world"
//   return p;
// }
// const promise = data();
// promise.then((res) => {
//   console.log(res);
// });

// async and await are used for handling promises
// async function handlePromise() {
//   // await can only be used inside async function
//   console.log("Welcome");
//   const val1 = await p1;
//   console.log(val1);
//   console.log("hello world 1");

//   const val2 = await p2;
//   console.log(val2);
//   console.log("hello world 2");
// }
// handlePromise();

const API_URL = "https://api.github.com/users/himansh9489";

async function handlePromise() {
  // to handle error
  // try {
  let res = await fetch(API_URL);
  let data = await res.json();
  console.log(data);
  // } catch (err) {
  //   console.log(err);
  // }
}

handlePromise().catch((err) => {
  // another way to handle error
  console.log(err);
});
  