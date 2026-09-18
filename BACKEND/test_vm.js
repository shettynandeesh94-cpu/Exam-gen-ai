const vm = require('vm');

const code = `
function solve(arr) {
  return arr ? [...arr].reverse() : [];
}

const testCases = [{"input": [[1,2]], "expected": [2,1], "functionName": "solve"}];
const results = testCases.map((tc) => {
  try {
    const fn = eval(tc.functionName);
    if (typeof fn !== 'function') {
      return { passed: false, error: 'Function ' + tc.functionName + ' is not defined.' };
    }
    const got = fn(...tc.input);
    const isMatch = JSON.stringify(got) === JSON.stringify(tc.expected);
    return { passed: isMatch, got, expected: tc.expected, input: tc.input };
  } catch (err) {
    return { passed: false, error: err.message, input: tc.input, expected: tc.expected };
  }
});
console.log("__TEST_RUN_JSON__" + JSON.stringify(results));
`;

const consoleLogs = [];
const customSandbox = {
    console: {
        log: (...args) => {
            consoleLogs.push(args.map(arg => {
                if (arg === null) return 'null';
                if (arg === undefined) return 'undefined';
                if (typeof arg === 'object') {
                    try {
                        return JSON.stringify(arg);
                    } catch (e) {
                        return String(arg);
                    }
                }
                return String(arg);
            }).join(' '));
        },
        error: (...args) => {
            consoleLogs.push('[ERROR] ' + args.join(' '));
        },
        warn: (...args) => {
            consoleLogs.push('[WARN] ' + args.join(' '));
        }
    }
};

const context = vm.createContext(customSandbox);
const script = new vm.Script(code);
try {
    const result = script.runInContext(context, { timeout: 1500 });
    console.log("Result:", result);
    console.log("Logs:", consoleLogs);
} catch (e) {
    console.error("Error executing:", e);
}
