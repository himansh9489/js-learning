const personPrototype = {
  greet() {
    console.log(`hello, my name is ${this.name}!`);
  },
};

function Person(name) {
  this.name = name;
}

// Object.assign(Person.prototype, personPrototype);
// or
// Person.prototype.greet = personPrototype.greet;
Person.prototype = {
  greet() {
    console.log(`fuck you ${this.name}`);
  },
};
const reuben = new Person("Reuben");
reuben.greet(); // hello, my name is Reuben!
