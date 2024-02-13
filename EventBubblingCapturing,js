document.getElementById("grandparent").addEventListener(
  "click",
  (e) => {
    // e.stopPropagation();
    console.log("grand parent cliked");
  },
  true // capturing
);
document.getElementById("parent").addEventListener(
  "click",
  (e) => {
    console.log("parent cliked");
  },
  true
);
document.getElementById("child").addEventListener(
  "click",
  (e) => {
    console.log("child cliked");
  },
  true
);

// true -> means event capturing
// false or no prop -> means event bubbling

// Event bubbling -> is the process where an event
// triggered on the deepest element within the
// DOM hierarchy propagates upwards through its ancestors.

// Event Capturing (or Event Trickling) ->
// Event capturing is the reverse process of
// event bubbling.
// It involves capturing the event at the top
// of the DOM hierarchy and propagating
// downwards through its descendants.
