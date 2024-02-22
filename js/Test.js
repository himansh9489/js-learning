class TreeNode {
  constructor(value, children) {
    this.value = value;
    this.children = children || [];
  }
}

// a little hack I put together so it prints out in a readable
TreeNode.prototype.toString = function (count) {
  if (this.children.length === 0)
    return this.value + "\t=>null\n" + Array(count + 1).join("\t") + "=>null";
  var count = count || 1;
  count++;
  return (
    this.value +
    "\t=>" +
    this.children[0].toString(count) +
    "\n" +
    Array(count).join("\t") +
    "=>" +
    this.children[1].toString(count)
  );
};

const exp = "3 + 4 * 2 ÷ ( 1 - 5 ) ^ 2 ^ 3";
const tokens = [
  "3",
  "+",
  "4",
  "*",
  "2",
  "/",
  "(",
  "1",
  "-",
  "5",
  ")",
  "^",
  "2",
  "^",
  "3",
];
const tokens1 = ["1", "-", "4", "-", "4"];
const operator = ["^", "*", "/", "+", "-"];
const prec = { "^": 4, "*": 3, "/": 3, "+": 2, "-": 2 };
const assoc = {
  "^": "right",
  "*": "left",
  "/": "left",
  "+": "left",
  "-": "left",
};

Array.prototype.peek = function () {
  return this[this.length - 1];
};

// const outQueue = [];
// const opStake = [];

// function evaluatePostfix(tokens) {
//   tokens.forEach((token) => {
//     if (token >= "0" && token <= "9") {
//       outQueue.push(token);
//     } else if (operator.some((el) => el === token)) {
//       console.log("operator", token);
//       console.log(opStake.peek());
//       if (
//         (opStake.length != 0 &&
//           assoc[token] == "left" &&
//           prec[token] <= prec[opStake.peek()]) ||
//         (opStake.length != 0 &&
//           assoc[token] == "right" &&
//           prec[token] < prec[opStake.peek()])
//       ) {
//         outQueue.push(opStake.peek());
//         opStake.pop();
//         opStake.push(token);
//       } else {
//         opStake.push(token);
//       }
//     } else if (token === "(") {
//       opStake.push(token);
//     } else if (token === ")") {
//       while (opStake.peek() != "(") {
//         outQueue.push(opStake.peek());
//         opStake.pop();
//       }
//       opStake.pop();
//     }
//   });
//   while (opStake.length != 0) outQueue.push(opStake.pop());

//   console.log(outQueue.reduce((a, c) => a + c, ""));
//   console.log(outQueue);
// }

const outStakeTree = [];
const opStakeTree = [];

//Shunting yard algorithm//

function createPostfixTree(tokens) {
  tokens.forEach((token) => {
    // switch (token) {
    //   case token >= "0" && token <= "9":
    //     outStakeTree.push(new TreeNode(token));
    //     break;
    //   case operator.some((el) => el === token):
    //     if (
    //       (opStakeTree.length != 0 &&
    //         assoc[token] == "left" &&
    //         prec[token] <= prec[opStakeTree.peek()]) ||
    //       (opStakeTree.length != 0 &&
    //         assoc[token] == "right" &&
    //         prec[token] < prec[opStakeTree.peek()])
    //     ) {
    //       let op = opStakeTree.pop();
    //       let rightChild = outStakeTree.pop();
    //       let leftChild = outStakeTree.pop();
    //       outStakeTree.push(new TreeNode(op, [leftChild, rightChild]));
    //       opStakeTree.push(token);
    //     } else {
    //       opStakeTree.push(token);
    //     }
    //     break;
    //   case token === "(":
    //     opStakeTree.push(token);
    //     break;
    //   case token === ")":
    //     while (opStakeTree.peek() != "(") {
    //       let op = opStakeTree.pop();
    //       let rightChild = outStakeTree.pop();
    //       let leftChild = outStakeTree.pop();
    //       outStakeTree.push(new TreeNode(op, [leftChild, rightChild]));
    //     }
    //     opStakeTree.pop();
    //     break;
    // }

    if (token >= "0" && token <= "9") {
      outStakeTree.push(new TreeNode(token));
    } else if (operator.includes(token)) {
      if (
        (opStakeTree.length != 0 &&
          assoc[token] == "left" &&
          prec[token] <= prec[opStakeTree.peek()]) ||
        (opStakeTree.length != 0 &&
          assoc[token] == "right" &&
          prec[token] < prec[opStakeTree.peek()])
      ) {
        let op = opStakeTree.pop();
        let rightChild = outStakeTree.pop();
        let leftChild = outStakeTree.pop();
        outStakeTree.push(new TreeNode(op, [leftChild, rightChild]));
        opStakeTree.push(token);
      } else {
        opStakeTree.push(token);
      }
    } else if (token === "(") {
      opStakeTree.push(token);
    } else if (token === ")") {
      while (opStakeTree.peek() != "(") {
        let op = opStakeTree.pop();
        let rightChild = outStakeTree.pop();
        let leftChild = outStakeTree.pop();
        outStakeTree.push(new TreeNode(op, [leftChild, rightChild]));
      }
      opStakeTree.pop();
    }
  });
  while (opStakeTree.length != 0) {
    let op = opStakeTree.pop();
    let rightChild = outStakeTree.pop();
    let leftChild = outStakeTree.pop();
    outStakeTree.push(new TreeNode(op, [leftChild, rightChild]));
  }
  return outStakeTree[0];
}

const ast = createPostfixTree(tokens1);

console.log(ast.toString());

const opertion = {
  "+": (a, b) => a + b,
  "-": (a, b) => a - b,
  "/": (a, b) => a / b,
  "*": (a, b) => a * b,
  "^": (a, b) => a ** b,
};

function evaluatePostfixTree(root) {
  console.log("root", root);
  if (!root) return;
  let l_val, r_val;
  if (root?.children.length === 0) {
    return parseInt(root.value);
  }
  l_val = evaluatePostfixTree(root.children[0]);
  r_val = evaluatePostfixTree(root.children[1]);
  console.log("l_val", l_val);
  console.log("r_val", r_val);
  console.log(root.value, opertion[root.value](l_val, r_val));
  return opertion[root.value](l_val, r_val);
}

console.log("result = ", evaluatePostfixTree(ast));
