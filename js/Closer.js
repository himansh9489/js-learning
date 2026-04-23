// function along with its lexical scope form a closure.
// closer is the combination of function along with its lexical scope.

function x() {
  var a = 10;
  function y() {
    console.log(a);
  }
  return y;
}

let y = x();
console.log(y);
y();

// Uses of closures :
// A. Module Design Pattern
// B. Currying
// C. Functions like once
// D. Memoize
// E. Maintaining state in async world
// F. setTimeouts
// G. Iterators
