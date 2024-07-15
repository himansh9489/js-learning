const p1 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve("api 1");
  }, 5000);
});

const p2 = new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve(`api 2`);
  }, 2000);
});

async function handle1() {
  let time = Date.now();
  const val1 = await p1;
  let time1 = Date.now();
  console.log("val1 ", val1, time1 - time);

  const val2 = await p2;
  console.log("val2 ", val2, Date.now() - time1);
}

handle1(); // both promise reolve after 5sec

async function handle2() {
  const val2 = await p2;
  console.log("val2 ", val2);

  const val1 = await p1;
  console.log("val1 ", val1);
}
handle2(); // val2 print after 2s and val1 after 3s of p1

// console.log("Hello");
