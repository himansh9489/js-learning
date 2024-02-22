// function formatPhoneNumber(phoneNumber, formatType, countryCode) {
//   // Remove any non-digit characters from the input phone number
//   const cleanedNumber = phoneNumber.replace(/\D/g, "");

//   // Define the format patterns for different format types
//   const formatPatterns = {
//     international: `+CC XXX XXXX XXXX`,
//     local: "(XXX) XXX-XXXX",
//     withCountryCode: `+CC XXX XXXX XXXX`,
//     withoutCountryCode: "XXX XXXX XXXX",
//     withAreaCodeAndSubscriberNumber: "(NDC) XXX-XXXX",
//     mobile: "0XXX XXX XXXX",
//     tollFree: "1-800-XXX-XXXX",
//     premiumRate: "1-900-XXX-XXXX",
//     emergency: "911",
//     shortCode: "1234",
//   };

//   // Get the format pattern based on the format type
//   const formatPattern = formatPatterns[formatType];

//   if (formatPattern) {
//     // Replace placeholders in the format pattern with actual values
//     let formattedNumber = formatPattern
//       .replace("CC", countryCode)
//       .replace("NDC", cleanedNumber.substring(0, 3));

//     // Iterate through each character in the format pattern
//     let index = 0;
//     for (let i = 0; i < formattedNumber.length; i++) {
//       // Replace X's in the format pattern with digits from the phone number
//       if (formattedNumber[i] === "X" && index < cleanedNumber.length) {
//         formattedNumber =
//           formattedNumber.slice(0, i) +
//           cleanedNumber[index] +
//           formattedNumber.slice(i + 1);
//         index++;
//       }
//     }

//     // Add parentheses, spaces, or hyphens according to the format
//     formattedNumber = formattedNumber.replace(/X/g, (match) => {
//       if (match === " ") return match;
//       if (match === "(" || match === ")") return match;
//       if (match === "-") return match;
//       return "";
//     });

//     return formattedNumber;
//   } else {
//     return "Invalid format type";
//   }
// }

// // Example usage:
// const phoneNumber = "8179387633454";
// const formatType = "mobile";
// const countryCode = "91";
// const formattedNumber = formatPhoneNumber(phoneNumber, formatType, countryCode);
// console.log(formattedNumber); // Output: (817) 938-7666

// document.getElementById("phone").addEventListener("input", function () {
//   formatPhoneNumber(this);
// });

// document.getElementById("phone").addEventListener("change", function () {
//   handleChange(this);
// });

// function formatPhoneNumber(input) {
//   // Remove all non-digit characters
//   var phoneNumber = input.value.replace(/\D/g, "");

//   // Check if the input is not empty
//   if (phoneNumber.length > 0) {
//     // Apply the phone number format
//     phoneNumber =
//       "(" +
//       phoneNumber.substring(0, 3) +
//       ") " +
//       phoneNumber.substring(3, 6) +
//       "-" +
//       phoneNumber.substring(6, 10);
//   }

//   // Update the input value
//   input.value = phoneNumber;
// }

// function handleChange(input) {
//   console.log("Value changed: " + input.value);
// }

document.getElementById("phone").addEventListener("input", function (event) {
  const inputElement = event.target;
  formatPhoneNumber(inputElement);
});

document.getElementById("phone").addEventListener("change", function (event) {
  const inputElement = event.target;
  handleChange(inputElement);
});

function formatPhoneNumber(input) {
  // Remove all non-digit characters
  let phoneNumber = input.value.replace(/\D/g, "");

  // Check if the input is not empty
  if (phoneNumber.length > 0) {
    // Apply the phone number format
    phoneNumber = `(${phoneNumber.substring(0, 3)}) ${phoneNumber.substring(
      3,
      6
    )}-${phoneNumber.substring(6, 10)}`;
  }

  // Update the input value
  input.value = phoneNumber;
}

function handleChange(input) {
  console.log("Value changed: " + input.value);
}
