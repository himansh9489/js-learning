// Variation 1: Infinite curry with terminal () call.
// sumUntilEmpty(1)(2)(3)(4)() -> 10

function sumUntilEmpty(a) {
  return function (b) {
    if (b) {
      return sumUntilEmpty(a + b);
    }
    return a;
  };
}
const sum = (a) => (b) => (b ? sum(a + b) : a);

console.log(sum(1)(2)(3)(4)());

// Variation 2: Infinite curry without final ().
// Uses JS coercion via valueOf/toString.
// +sumNoTerminal(1)(2)(3) -> 6
function sumNoTerminal(a) {
  function inner(b) {
    return sumNoTerminal(a + b);
  }

  inner.valueOf = function () {
    return a;
  };

  inner.toString = function () {
    return String(a);
  };
  return inner;
}

console.log(+sumNoTerminal(1)(2)(3));
