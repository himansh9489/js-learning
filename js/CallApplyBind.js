// call,apply,bind => all three bind the function to
// an object with some diffrences
let name1 = {
  firstName: "Himasnhu",
  lastName: "Kushwah",
};

let name2 = {
  firstName: "Vishwas",
  lastName: "Saini",
};

let printFullName = function (...args) {
  console.log(this.firstName + " " + this.lastName + " " + args[0]);
  console.log(args);
};
// call use case for print fullName form  for name1 and name2
printFullName.call(name1, "Gwalior", "MP");
printFullName.call(name2, "Bhopla", "Hariyana");

// apply use case for print  for name1 and name2
printFullName.apply(name1, ["Bhopla", "Hariyana"]);
printFullName.apply(name2, ["Bhopla", "Hariyana"]);

// call and apply -> funciton call happens immediately
// bind use case
// returns a function with the "this" reference binding.
// can be used later

let printName = printFullName.bind(name2, "Bhopla", "Hariyana");
console.log(printName);
printName();
