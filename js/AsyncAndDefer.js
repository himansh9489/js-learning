// Without async and defer:

// <script src="myscript.js"></script>
// In this case, the script is loaded and
// executed synchronously, blocking the
// HTML parsing until the script is fully
// downloaded and executed. If the script i
// s placed in the <head> section, it may
// delay the rendering of the page content.

// With async:
// <script src="myscript.js" async></script>

// The async attribute allows the script to be
// downloaded asynchronously while not blocking
// the HTML parsing. Once the script is downloaded,
// it will execute immediately, potentially
// interrupting the HTML parsing. This is useful
// for non-dependent scripts that can be executed
// out of order.

// With defer:
// <script src="myscript.js" defer></script>

// The defer attribute also allows asynchronous
// downloading of the script, but it defers the
// execution of the script until the HTML parsing
// is complete. Multiple scripts with defer will
// be executed in the order they appear in the HTML.
// This is useful when the script relies on the
//  DOM structure or other scripts.
