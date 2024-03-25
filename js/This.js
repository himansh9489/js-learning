"use strict";
console.log(this);

function x() {
  console.log(this);
}

x();
window.x();

const obj = {
  a: 10,
  x: () => {
    console.log(this);
    console.log(obj.a);
  },
};
obj.x();

const obj2 = {
  a: 20,
  x: function () {
    const y = () => {
      console.log(this);
    };
    y();
  },
};
obj2.x();
