function useState(initalValue) {
  let _val = initalValue;
  const state = () => _val;
  const setState = (newVal) => {
    _val = newVal;
  };
  return [state, setState];
}
console.log("hello");
const [count, setCount] = useState(1);
console.log(count());
setCount(2);
console.log(count());

function fun(num) {
  var a = num;
  return (b) => a + b;
}
const sum = fun(5);
console.log(sum(6));

let arr = [3, 2, 6, 4, 9, 1, 8, 12, 20, 19];
console.log(arr.sort((a, b) => (a < b ? -1 : 1)).reverse());
