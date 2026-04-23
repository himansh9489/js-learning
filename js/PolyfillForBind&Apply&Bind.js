// Polyfill for bind method
let name1 = {
  firstName: "Himasnhu",
  lastName: "Kushwah",
};

let printFullName = function (hometown, state, country) {
  console.log(this.firstName + " " + this.lastName);
  console.log(hometown + " " + state + " " + country);
};
let printName = printFullName.bind(name1);
// console.log(printName);
// printName();

// create your own bind method
Function.prototype.myBind = function (...args) {
  //this == printFullName
  //this will point to printFullName fn
  let fn = this;
  // console.log("this",fn);
  // to get parems remove the 1st one from args
  let param = args.slice(1);
  // bind returns a function so
  return (...args2) => {
    //it should invoke printFullName function
    // printFullName();
    // but needs call with binding reference
    // printFullName.call(name1);
    // this.call(name1);
    fn.apply(args[0], [...param, ...args2]);
  };
};

// do not use call or apply
Function.prototype.myBind1 = function (context = {}, ...args) {
  if (typeof this !== "function")
    throw new Error(this + "cannot be bound as it's not callable");
  context.fn = this;
  return function (...args2) {
    context.fn(...args, ...args2);
  };
};

let printName1 = printFullName.myBind1(name1, "Gwalior");
printName1("MP", "Bharat");

let printName2 = printFullName.myBind1(name1, "Gwalior", "MP");
printName2("Bharat");

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

// Polyfill for Function.prototype.call
if (!Function.prototype.myCall) {
  Function.prototype.myCall = function (thisArg, ...args) {
    if (typeof this !== "function") {
      throw new TypeError("myCall must be called on a function");
    }

    const context = thisArg == null ? globalThis : Object(thisArg);
    const fnKey = Symbol("fn");
    context[fnKey] = this;

    const result = context[fnKey](...args);
    delete context[fnKey];

    return result;
  };
}
