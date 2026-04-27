// Sum problem variations for machine coding practice.

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

// Variation 3: Fixed arity curry.
// sumN(4)(1)(2)(3)(4) -> 10
function sumN(totalArgs) {
  return (function collect(currentSum = 0, used = 0) {
    return function (next) {
      const newSum = currentSum + next;
      const newUsed = used + 1;
      if (newUsed === totalArgs) return newSum;
      return collect(newSum, newUsed);
    };
  })();
}

// Variation 4: Multiple numbers per call.
// sumMulti(1, 2)(3, 4)(5)() -> 15
function sumMulti(...initial) {
  let total = initial.reduce((acc, val) => acc + val, 0);

  function collector(...nextValues) {
    if (nextValues.length === 0) return total;
    total += nextValues.reduce((acc, val) => acc + val, 0);
    return collector;
  }

  return collector;
}

// Variation 5: Placeholder style (simple).
// const _ = hole;
// sumWithHole(_, 2)(1) -> 3
const hole = Symbol("hole");
function sumWithHole(a, b) {
  return function (x) {
    if (a === hole) return x + b;
    if (b === hole) return a + x;
    return a + b;
  };
}

console.log("V1:", sumUntilEmpty(1)(2)(3)(4)());
console.log("V2:", +sumNoTerminal(1)(2)(3)(4));
console.log("V3:", sumN(4)(1)(2)(3)(4));
console.log("V4:", sumMulti(1, 2)(3, 4)(5)());
console.log("V5:", sumWithHole(hole, 2)(10), sumWithHole(7, hole)(5));
