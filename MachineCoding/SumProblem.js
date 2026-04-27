// Sum problem variations for machine coding practice.

// Variation 1: Infinite curry with terminal () call.
//  sum(1)(2)(3)...(n)()
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
