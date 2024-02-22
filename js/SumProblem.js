const sum = function (a) {
  return function (b) {
    if (b) return sum(a + b);
    return a;
  };
};
const sum1 = (a) => (b) => b ? sum(a + b) : a;
console.log(sum1(2)(3)(5)());
