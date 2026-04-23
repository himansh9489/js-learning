function printName(...args) {
  console.log(this.name);
  console.log(...args);
}

const name1 = {
  name: "Himasnhu",
};

Function.prototype.myBind = function (context, ...args) {
  if (typeof fn !== "function") {
    throw new TypeError("myBing must be called on a function");
  }

  return function (...args2) {
    return this.apply(context, [...args, ...args2]);
  };
};

const printName1 = printName.myBind(null, "Gwalior", "MP");
printName1("Bharat");

// Polyfill for Function.prototype.apply
if (!Function.prototype.myApply) {
  Function.prototype.myApply = function (thisArg, argsArray) {
    if (typeof this !== "function") {
      throw new TypeError("myApply must be called on a function");
    }

    const context = thisArg == null ? globalThis : Object(thisArg);
    const fnKey = Symbol("fn");
    context[fnKey] = this;

    let result;
    if (argsArray == null) {
      result = context[fnKey]();
    } else {
      // apply accepts array-like/iterable values
      const args = Array.from(argsArray);
      result = context[fnKey](...args);
    }

    delete context[fnKey];
    return result;
  };
}
