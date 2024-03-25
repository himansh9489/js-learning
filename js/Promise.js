const cart = ["shoes", "pants", "kurta"];

// Disadvantages of call back
// -> callback hell
// -> inversion of controle
// eg :-

// createOrder(cart, function (orderId) {
//   proccedToPayment(orderId, function (paymentInfo) {
//     getOrderSummery(paymentInfo, function (orderDetails) {
//       updateWallet(orderDetails);
//     });
//   });
// });

// promises are way to deal with these disadvantages
// defination :-
// Promises are objects in JavaScript that represent
// the eventual completion or failure of an asynchronous
// operation

// const promise = createOrder(cart);

// //{data: undefined}
// promise.then(function (orderId) {
//   proccedToPayment(orderId);
// });

// Api's creation
const createOrder = function (cart) {
  return new Promise((resolve, reject) => {
    // create order
    // validate cart
    if (!Array.isArray(cart)) {
      reject(new Error("invalid cart"));
    }
    // logic for createOrder
    const orderId = 424;
    if (orderId) {
      // imitating api call by adding delay in response
      setTimeout(() => resolve(orderId), 1500);
    }
  });
};

const proccedToPayment = function (orderId) {
  return new Promise((resolve, reject) => {
    if (!orderId) {
      reject(new Error("could not proceed to payment"));
    }
    // logic for proceedToPayment
    const res = { msg: "payment successfull", status: "SUCCESS" };
    if (res) {
      // imitating api call by adding delay in response
      setTimeout(() => resolve(res), 1500);
    }
  });
};

const getOrderSummery = function (paymentInfo) {
  return new Promise((resolve, reject) => {
    if (paymentInfo["status"] !== "SUCCESS") {
      reject(new Error("sorry, could not placed order"));
    }
    // logic for proceedToPayment
    const res = { status: "ORDER_PLACED", placedOn: new Date() };
    if (res) {
      // imitating api call by adding delay in response
      setTimeout(() => resolve(res), 1500);
    }
  });
};
const updateWallet = function (orderDetails) {
  return new Promise((resolve, reject) => {
    if (orderDetails["status"] !== "ORDER_PLACED") {
      reject(new Error("sorry, could not update wallet"));
    }
    // logic for update wallet details
    const res = { accountBalance: 300 };
    if (res) {
      // imitating api call by adding delay in response
      setTimeout(() => resolve(res), 1500);
    }
  });
};

// Api's call
createOrder(cart)
  .then((orderId) => {
    console.log("orderId : ", orderId);
    return proccedToPayment(orderId);
  })
  .then((paymentInfo) => {
    console.log("msg : ", paymentInfo.msg);
    return getOrderSummery(paymentInfo);
  })
  .then((order) => {
    console.log(order.status, order.placedOn);
    return updateWallet(order);
  })
  .then((wallet) => {
    console.log(wallet.accountBalance);
  })
  .catch((err) => {
    console.log(err.message);
  });

// const GIT_HUB_API = "https://api.github.com/users/himansh9489";
// const GIT_HUB_API_1 = "https://api.github.com/users/himanshu9489";

// const user = fetch(GIT_HUB_API);
// user
//   .then(function (data) {
//     console.log("data", data);
//     return fetch(GIT_HUB_API_1);
//   })
//   .then(function (data) {
//     console.log("data1", data);
//   });

// console.log(user);
