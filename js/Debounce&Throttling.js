// Debouning -> time Difference between two keypress events

// Throttling -> time Difference between two function calls
// it is similar to fun call at set time interval

// Debouncing function
function debounce(func, delay) {
  let timeoutId;

  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}
// Throttling function
function Throttling(func, delay) {
  let lastCall = 0;

  return (...args) => {
    let call = Date.now();
    if (call - lastCall >= delay) {
      console.log(`Throttling after ${delay}ms`);
      func.apply(this, args);
      lastCall = call;
    }
  };
}
// function Throttling(func, delay) {
//   let flag = true;
//   return function (...args) {
//     if (flag) {
//       console.log(`Throttling after ${delay}ms`);
//       func.apply(this, args);
//       flag = false;
//       setTimeout(() => (flag = true), delay);
//     }
//   };
// }
// Function to handle input1 change
function handleInputChange() {
  const textboxValue = document.getElementById("myInput").value;
  console.log(`Textbox value changed: ${textboxValue}`);
}
// Function to handle input2 change
function handleInputChange1() {
  const textboxValue = document.getElementById("myInput2").value;
  console.log(`Textbox value changed: ${textboxValue}`);
}
// Function to handle the window resize
function handleWindowResize() {
  console.log(window.innerWidth, window.innerHeight);
}

const debouncedInputChange = debounce(handleInputChange, 500);
const ThrottleInputChange = Throttling(handleInputChange1, 500);
const ThrottleWindowResize = Throttling(handleWindowResize, 1000);

// Attach the debounced function to the input event
document
  .getElementById("myInput")
  .addEventListener("input", debouncedInputChange);

// example of throttling with input event
// which is a bad example of throttling
document
  .getElementById("myInput2")
  .addEventListener("input", ThrottleInputChange);

// example of throttling with window resize
window.addEventListener("resize", ThrottleWindowResize);
