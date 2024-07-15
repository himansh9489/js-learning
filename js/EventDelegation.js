// document.querySelector("#category").addEventListener("click", (e) => {
//   console.log(e.target);
//   if (e.target.tagName === "LI") {
//     window.location.href = "/" + e.target.id;
//   }
// });

document.querySelector("#form").addEventListener("keydown", (e) => {
  console.log(e);
  if (e.target.dataset.uppercase === "uppercase") {
    e.target.value = e.target.value.toUpperCase();
  }
});

// Event delegation is a JavaScript technique where you
// attach a single event listener to a parent element,
// rather than attaching multiple event listeners to
// individual child elements. This single event listener
// then handles events that bubble up from the child elements.
// Event delegation works because most events in the DOM bubble
// up from the target element to its ancestors.

// -> Improved Performance
// -> Dynamic Element Handling
// -> Simplified Code
// -> Memory Management

// -> Event Targeting needs to be accurately
// -> Not all events can be bubble up
// -> Needs additional conditional logic

// Not bubbling events ->
// focus, blur, input ,load,unload,play,pause,volumechange
// mouseenter mouseleave etc
