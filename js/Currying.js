// Currying is a technique in functional programming where
// a function with multiple arguments is transformed into
// a sequence of functions, each taking a single argument.
// In JavaScript, you can achieve currying using closures
// and function chaining.

// by bind method and function chaining
// function multiply(x, y) {
//   console.log(x * y);
// }

// let multiplyByTwo = multiply.bind(this, 2);

// multiplyByTwo(4);

// let multiplyByThree = multiply.bind(this, 3);

// multiplyByThree(4);

// by using closer
let multiply1 = function (x) {
  return (y) => {
    console.log(x * y);
  };
};

let multiplyByTwo = multiply1(2);

multiplyByTwo(2);

let multiplyByThree = multiply1(3);

multiplyByThree(2);
