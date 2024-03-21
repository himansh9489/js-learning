// a();
// b();

// Function Statement aka Function Declaration
function a() {
  console.log("a called");
}
//...

// Function Expression
var b = function () {
  console.log("b called");
};
//...

// Difference between Function Statment and Function Expression
// -> a can be called before its declaration (hoisting)
// -> b will through error bcz b is undefined at that moment (hoisting)
//...

// Anonymous Function
// function () {

// }
// -> acts like value, can be assigned to a variable
// -> can not be used in function statement
//...

// Named Function Expressions
var c = function xyz() {
  console.log("c called");
  console.log(xyz);
};
c();
//xyz();
// -> will through error bcz not part of global scope
// -> part of local scope
//...

// Difference between Parameters and Arguments
function d(param1, param2) {
  console.log(param1, param2); // parameters
}
d(1, 2); // arguments
//...

// First-Class Functions
// -> the ability to use function as values is known as first class funtions
// -> ex1 - passing a fun as argument int0 another function,
// -> ex2 - returning a func as output from another function.

// chatGPT
// In programming language design, a language feature is said to support "first-class functions"
// if it treats functions as "First-Class Citizens". This means functions can be treated like
// any other data type, such as numbers or strings. In languages with first-class functions,
// functions can be:

// Assigned to variables.
// Passed as arguments to other functions.
// Returned as values from other functions.
// Stored in data structures (like arrays or objects).
//....

// Info about Arrow Functions
// not here
