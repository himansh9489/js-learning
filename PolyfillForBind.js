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
  let obj = this;
  // console.log("this",obj);
  // to get parems remove the 1st one from args
  let parem = args.slice(1);
  // bind returns a function so
  return (...args2) => {
    //it should invoke printFullName function
    // printFullName();
    // but needs call with binding reference
    // printFullName.call(name1);
    // this.call(name1);
    obj.apply(args[0], [...parem, ...args2]);
  };
};
let printName1 = printFullName.myBind(name1, "Gwalior");
printName1("MP", "Bharat");

let printName2 = printFullName.myBind(name1, "Gwalior", "MP");
printName2("Bharat");
