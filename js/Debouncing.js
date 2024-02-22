// Debouning -> time Defference between
// two keypress events

// Debouncing function
function debounce(func, delay) {
  let timeoutId;
  // make use of closer to keep
  // track of setTimeout id
  return (...args) => {
    // clear the old timeout
    clearTimeout(timeoutId);
    // Set a new timeout
    timeoutId = setTimeout(() => {
      console.log(this);
      //   func(args); or
      func.apply(this, args);
      // here this = window (global object)
      // we are calling the func with reference to window
      // which even if we don't it will work bcz func
      // passed to debounce is wriitten in window only
    }, delay);
  };
}

// Function to handle the textbox change
function handleChange() {
  const textboxValue = document.getElementById("myInput").value;
  console.log(`Textbox value changed: ${textboxValue}`);
  // Your logic here
}
const debouncedInputChange = debounce(handleChange, 500);

// Attach the debounced function to the onchange event of the textbox
document
  .getElementById("myInput")
  .addEventListener("input", debouncedInputChange);
