const user = {
  name: "Himanshu",
  address: {
    personal: {
      city: "Gwalior",
      area: "Girwai",
    },
    office: {
      city: "Gurugram",
      area: {
        landmark: "CyberHub",
      },
    },
  },
};

const flattenUser = {};

const convertObject = function (prefix = "user", obj) {
  Object.entries(obj).map(([key, value]) => {
    const newKey = [prefix, key].join("_");
    if (typeof value !== "object") {
      flattenUser[newKey] = value;
    } else {
      convertObject(newKey, value);
    }
  });
};
convertObject("user", user);
console.log(flattenUser);

const convertObject1 = function (prefix = "user", obj) {
  let res = {};
  console.log({ obj });
  Object.entries(obj).map(([key, value]) => {
    const newKey = [prefix, key].join("_");
    if (typeof value !== "object") {
      res[newKey] = value;
    } else {
      const temp = convertObject1(newKey, value);
      res = { ...res, ...temp };
    }
  });
  return res;
};

const result = convertObject1("user", user);

console.log({ result });
