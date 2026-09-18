const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const vm = require('vm');

const getGppPath = () => {
    if (process.platform !== 'win32') return 'g++';
    const paths = [
        'C:\\msys64\\mingw64\\bin\\g++.exe',
        'C:\\msys64\\ucrt64\\bin\\g++.exe',
        'C:\\MinGW\\bin\\g++.exe'
    ];
    for (const p of paths) {
        if (fs.existsSync(p)) return p;
    }
    return 'g++';
};

const getParameterCount = (userCodeStr, functionName, language = '') => {
    if (!userCodeStr) return null;
    const userCode = String(userCodeStr);
    const cleanCode = userCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const regex = new RegExp(`${functionName}\\s*\\(([^)]*)\\)`);
    const match = cleanCode.match(regex);
    if (match) {
        const paramsText = match[1].trim();
        if (!paramsText) return 0;
        let depth = 0;
        let count = 1;
        for (let i = 0; i < paramsText.length; i++) {
            const char = paramsText[i];
            if (char === '<' || char === '[' || char === '(') depth++;
            else if (char === '>' || char === ']' || char === ')') depth--;
            else if (char === ',' && depth === 0) count++;
        }
        if (language.toLowerCase() === 'c') {
            const rawParams = paramsText.toLowerCase().split(',').map(p => p.trim()).filter(Boolean);
            const sizeParamsCount = rawParams.filter(p => p.includes('size')).length;
            count -= sizeParamsCount;
        }
        return count;
    }
    return null;
};

const getReturnType = (userCodeStr, functionName) => {
    if (!userCodeStr) return null;
    const userCode = String(userCodeStr);
    const cleanCode = userCode.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
    const regex = new RegExp(`(?:public|static|final|synchronized|volatile|\\s)*([\\w\\[\\]<>*]+)\\s+${functionName}\\s*\\(`);
    const match = cleanCode.match(regex);
    if (match) {
        return match[1].trim();
    }
    return null;
};

/**
 * Executes user code against a set of test cases
 * Supports JavaScript, Python, Java, C++, and C
 */
const runDsaCode = async (userCode, language, testCasesStr, functionName = 'solve') => {
    let testCases = [];
    try {
        const parsed = JSON.parse(testCasesStr || '[]');
        const expectedCount = getParameterCount(userCode, functionName, language);
        testCases = parsed.map(tc => {
            let normalizedInput = tc.input;
            if (Array.isArray(normalizedInput) && expectedCount !== null && normalizedInput.length !== expectedCount) {
                if (normalizedInput.length === 1 && Array.isArray(normalizedInput[0]) && normalizedInput[0].length === expectedCount) {
                    normalizedInput = normalizedInput[0];
                }
            }
            return {
                ...tc,
                input: normalizedInput
            };
        });
    } catch (e) {
        return { success: false, error: 'Invalid test cases structure stored in database.' };
    }

    // Defer JS execution to VM
    if (language.toLowerCase() === 'javascript') {
        return runJsSandbox(userCode, testCases);
    }

    // Create temporary directory for compilation / execution
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'examgen-runner-'));

    try {
        if (language.toLowerCase() === 'python') {
            return await runPythonSandbox(userCode, testCases, functionName, tempDir);
        } else if (language.toLowerCase() === 'java') {
            return await runJavaSandbox(userCode, testCases, functionName, tempDir);
        } else if (language.toLowerCase() === 'cpp') {
            return await runCppSandbox(userCode, testCases, functionName, tempDir, false);
        } else if (language.toLowerCase() === 'c') {
            return await runCppSandbox(userCode, testCases, functionName, tempDir, true);
        } else {
            return { success: false, error: `Language ${language} is not supported.` };
        }
    } catch (err) {
        return { success: false, error: err.message };
    } finally {
        // Cleanup temp directory
        try {
            fs.rmSync(tempDir, { recursive: true, force: true });
        } catch (e) {
            console.error('Failed to cleanup temp directory:', e);
        }
    }
};

/**
 * JS local runner using Node VM module
 */
const runJsSandbox = (userCode, testCases) => {
    const runnerScript = `
${userCode}

const testCases = ${JSON.stringify(testCases)};
const results = testCases.map((tc) => {
  try {
    const fn = eval(tc.functionName);
    if (typeof fn !== 'function') {
      return { passed: false, error: 'Function ' + tc.functionName + ' is not defined.' };
    }
    let got = fn(...tc.input);
    if (got === undefined && tc.expected !== undefined && tc.input.length > 0) {
      got = tc.input[0];
    }
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
                        try { return JSON.stringify(arg); } catch (e) { return String(arg); }
                    }
                    return String(arg);
                }).join(' '));
            },
            error: (...args) => { consoleLogs.push('[ERROR] ' + args.join(' ')); },
            warn: (...args) => { consoleLogs.push('[WARN] ' + args.join(' ')); }
        }
    };

    const context = vm.createContext(customSandbox);
    const startTime = Date.now();
    try {
        const script = new vm.Script(runnerScript);
        script.runInContext(context, { timeout: 1500 });
        const executionTimeMs = Date.now() - startTime;

        const marker = '__TEST_RUN_JSON__';
        const markerLog = consoleLogs.find(l => l.startsWith(marker));
        let testResults = [];
        if (markerLog) {
            try {
                testResults = JSON.parse(markerLog.substring(marker.length));
            } catch (e) {
                console.error('Failed to parse JS VM output JSON', e);
            }
        }
        const userLogs = consoleLogs.filter(l => !l.startsWith(marker));

        return {
            success: true,
            results: testResults,
            logs: userLogs,
            executionTimeMs
        };
    } catch (e) {
        return {
            success: true,
            error: e.message,
            logs: consoleLogs,
            executionTimeMs: Date.now() - startTime
        };
    }
};

/**
 * Python subprocess runner
 */
const runPythonSandbox = (userCode, testCases, functionName, tempDir) => {
    return new Promise((resolve) => {
        // Generate script content
        const testCasesJson = JSON.stringify(testCases);
        const runnerContent = `
import json
import sys

# User solution code
${userCode}

# Test cases runner
test_cases = json.loads('''${testCasesJson}''')
results = []

for tc in test_cases:
    try:
        fn_name = tc.get('functionName', '${functionName}')
        fn = globals().get(fn_name)
        if not fn or not callable(fn):
            results.append({"passed": False, "error": f"Function {fn_name} is not defined.", "input": tc.get('input'), "expected": tc.get('expected')})
            continue
        
        args = tc.get('input', [])
        got = fn(*args)
        if got is None and tc.get('expected') is not None and len(args) > 0:
            got = args[0]
        
        # Match using JSON dumps comparison for exact structural identity
        is_match = json.dumps(got) == json.dumps(tc.get('expected'))
        results.append({
            "passed": is_match,
            "got": got,
            "expected": tc.get('expected'),
            "input": tc.get('input')
        })
    except Exception as e:
        results.append({
            "passed": False,
            "error": str(e),
            "input": tc.get('input'),
            "expected": tc.get('expected')
        })

print("__TEST_RUN_JSON__" + json.dumps(results))
`;

        const filePath = path.join(tempDir, 'solution.py');
        fs.writeFileSync(filePath, runnerContent);

        const startTime = Date.now();
        exec(`python "${filePath}"`, { timeout: 1500 }, (error, stdout, stderr) => {
            const executionTimeMs = Date.now() - startTime;
            const logs = [];
            let executionError = null;

            if (stderr) {
                logs.push('[STDERR] ' + stderr.trim());
                executionError = stderr.trim();
            }

            const rawLines = stdout.split('\n');
            let testResults = [];
            const marker = '__TEST_RUN_JSON__';

            for (const line of rawLines) {
                if (line.startsWith(marker)) {
                    try {
                        testResults = JSON.parse(line.substring(marker.length).trim());
                    } catch (e) {
                        console.error('Failed to parse python results json', e);
                    }
                } else if (line.trim()) {
                    logs.push(line.trim());
                }
            }

            if (error && error.killed) {
                executionError = 'Execution timed out (Limit: 1.5s).';
            }

            resolve({
                success: true,
                results: testResults,
                logs,
                error: executionError,
                executionTimeMs
            });
        });
    });
};

/**
 * Helper to build native static type representations (C++ & Java)
 */
const helperTypeMapping = (val) => {
    if (typeof val === 'number') {
        if (Number.isInteger(val)) return { type: 'int', val: String(val) };
        return { type: 'double', val: String(val) };
    }
    if (typeof val === 'string') return { type: 'std::string', val: `"${val}"`, javaType: 'String' };
    if (typeof val === 'boolean') return { type: 'bool', val: val ? 'true' : 'false', javaType: 'boolean' };
    if (Array.isArray(val)) {
        if (val.length === 0) return { type: 'std::vector<int>', val: '{}', javaType: 'int[]', javaVal: 'new int[]{}' };
        const sub = helperTypeMapping(val[0]);
        const elements = val.map(v => helperTypeMapping(v).val).join(', ');
        const javaElements = val.map(v => helperTypeMapping(v).javaVal || helperTypeMapping(v).val).join(', ');
        const cppInner = sub.type;
        const javaInner = sub.javaType || sub.type;
        return {
            type: `std::vector<${cppInner}>`,
            val: `{${elements}}`,
            javaType: `${javaInner}[]`,
            javaVal: `new ${javaInner}[]{${javaElements}}`
        };
    }
    return { type: 'int', val: '0', javaType: 'int' };
};

const getJavaCompilerPath = () => {
    const localJavac = path.join(__dirname, '..', 'bin', 'jdk17', 'bin', 'javac');
    if (fs.existsSync(localJavac)) {
        return `"${localJavac}"`;
    }
    return 'javac';
};

const getJavaRuntimePath = () => {
    const localJava = path.join(__dirname, '..', 'bin', 'jdk17', 'bin', 'java');
    if (fs.existsSync(localJava)) {
        return `"${localJava}"`;
    }
    return 'java';
};

/**
 * Java helper and execution sandbox
 */
const runJavaSandbox = (userCode, testCases, functionName, tempDir) => {
    return new Promise((resolve) => {
        // Generate Java file
        // We assume the user has written class Solution { ... }

        // Parse arguments and construct java calls
        let testInvocations = [];
        testCases.forEach((tc, idx) => {
            const argsText = [];
            const decls = [];
            tc.input.forEach((arg, argIdx) => {
                const item = helperTypeMapping(arg);
                const jType = item.javaType || item.type;
                const jVal = item.javaVal || item.val;
                decls.push(`${jType} test_${idx}_arg_${argIdx} = ${jVal};`);
                argsText.push(`test_${idx}_arg_${argIdx}`);
            });

            const expItem = helperTypeMapping(tc.expected);
            const expType = expItem.javaType || expItem.type;
            const expVal = expItem.javaVal || expItem.val;

            const retType = getReturnType(userCode, functionName);
            const isVoid = retType === 'void';

            const runCall = isVoid
                ? `solver.${functionName}(${argsText.join(', ')});\n          ${expType} gotObj = test_${idx}_arg_0;`
                : `${expType} gotObj = solver.${functionName}(${argsText.join(', ')});`;

            testInvocations.push(`
      // Test Case ${idx + 1}
      {
        try {
          ${decls.join('\n          ')}
          ${expType} expected = ${expVal};
          ${runCall}
          boolean passed = java.util.Objects.deepEquals(gotObj, expected);
          jsonOut.append(String.format("{\\\"passed\\\":%b,\\\"got\\\":%s,\\\"expected\\\":%s}", 
            passed, toJson(gotObj), toJson(expected)));
        } catch (Exception e) {
          jsonOut.append(String.format("{\\\"passed\\\":false,\\\"error\\\":\\\"%s\\\"}", e.getMessage()));
        }
      }
      `);
        });

        const runnerContent = `
${userCode}

import java.util.*;
import java.util.stream.*;

public class SolutionRunner {
    public static String toJson(Object obj) {
        if (obj == null) return "null";
        if (obj instanceof Integer || obj instanceof Double || obj instanceof Boolean) {
            return obj.toString();
        }
        if (obj instanceof String) {
            return "\\\"" + obj.toString() + "\\\"";
        }
        if (obj instanceof int[]) {
            return Arrays.toString((int[]) obj);
        }
        if (obj instanceof double[]) {
            return Arrays.toString((double[]) obj);
        }
        if (obj instanceof boolean[]) {
            return Arrays.toString((boolean[]) obj);
        }
        if (obj instanceof Object[]) {
            return "[" + Arrays.stream((Object[]) obj).map(SolutionRunner::toJson).collect(Collectors.joining(",")) + "]";
        }
        if (obj instanceof List) {
            return "[" + ((List<?>) obj).stream().map(SolutionRunner::toJson).collect(Collectors.joining(",")) + "]";
        }
        return "\\\"" + obj.toString() + "\\\"";
    }

    public static void main(String[] args) {
        Solution solver = new Solution();
        StringBuilder jsonOut = new StringBuilder();
        jsonOut.append("[");
        
        ${testInvocations.join('\n        jsonOut.append(",");\n        ')}
        
        jsonOut.append("]");
        System.out.println("__TEST_RUN_JSON__" + jsonOut.toString());
    }
}
`;

        // Handle compilation & execution
        fs.writeFileSync(path.join(tempDir, 'SolutionRunner.java'), runnerContent);

        // Write Solution class file if it's parsed, or just write a single file.
        // We extract user imports and wrap the code in 'class Solution' if it's just a raw method declaration.
        let imports = ['import java.util.*;', 'import java.util.stream.*;'];
        let cleanUserCode = userCode || '';

        // Extract any user-supplied imports
        const importRegex = /^\s*import\s+[^;]+;/gm;
        let match;
        while ((match = importRegex.exec(userCode || '')) !== null) {
            imports.push(match[0]);
        }
        // Remove those imports from user code to prevent syntax issues if wrapping
        cleanUserCode = cleanUserCode.replace(importRegex, '');

        // Wrap bare methods in class Solution if not already wrapped in a class
        if (!/class\s+\w+/i.test(cleanUserCode)) {
            cleanUserCode = `class Solution {\n${cleanUserCode}\n}`;
        } else {
            cleanUserCode = cleanUserCode.replace(/public\s+class\s+Solution/g, 'class Solution');
        }

        const uniqueImports = Array.from(new Set(imports)).join('\n');
        const finalFileContent = `${uniqueImports}\n\n${cleanUserCode}\n\n${runnerContent.substring(runnerContent.indexOf('public class SolutionRunner'))}`;

        fs.writeFileSync(path.join(tempDir, 'SolutionRunner.java'), finalFileContent);

        const javac = getJavaCompilerPath();
        const java = getJavaRuntimePath();

        const startTime = Date.now();
        // Compile
        exec(`${javac} -d "${tempDir}" "${path.join(tempDir, 'SolutionRunner.java')}"`, (compileErr, compileStdout, compileStderr) => {
            if (compileErr) {
                resolve({
                    success: true,
                    results: [],
                    logs: [],
                    error: 'Compilation Error:\n' + (compileStderr || compileStdout || compileErr.message),
                    executionTimeMs: Date.now() - startTime
                });
                return;
            }

            // Execute
            exec(`${java} -cp "${tempDir}" SolutionRunner`, { timeout: 2000 }, (error, stdout, stderr) => {
                const executionTimeMs = Date.now() - startTime;
                const logs = [];
                let executionError = null;

                if (stderr) {
                    logs.push('[STDERR] ' + stderr.trim());
                    executionError = stderr.trim();
                }

                const rawLines = stdout.split('\n');
                let testResults = [];
                const marker = '__TEST_RUN_JSON__';

                for (const line of rawLines) {
                    if (line.startsWith(marker)) {
                        try {
                            testResults = JSON.parse(line.substring(marker.length).trim());
                        } catch (e) {
                            console.error('Failed to parse java results json', e);
                        }
                    } else if (line.trim()) {
                        logs.push(line.trim());
                    }
                }

                if (error && error.killed) {
                    executionError = 'Execution timed out (Limit: 2s).';
                }

                resolve({
                    success: true,
                    results: testResults,
                    logs,
                    error: executionError,
                    executionTimeMs
                });
            });
        });
    });
};

/**
 * C++ & C runner via MSYS2 / MinGW g++ compiler
 */
const runCppSandbox = (userCode, testCases, functionName, tempDir, isC = false) => {
    return new Promise((resolve) => {
        // Generate compilable file
        let testInvocations = [];
        testCases.forEach((tc, idx) => {
            const argsText = [];
            const decls = [];

            tc.input.forEach((arg, argIdx) => {
                if (isC && Array.isArray(arg)) {
                    // Standard C array + size parameter passing
                    const item = helperTypeMapping(arg);
                    const rawType = item.type.replace('std::vector<', '').replace('>', '');
                    const ptrType = rawType === 'std::string' ? 'const char*' : rawType;

                    decls.push(`${ptrType} test_${idx}_arg_${argIdx}[] = ${item.val.replace('{', '{').replace('}', '}')};`);
                    decls.push(`int test_${idx}_arg_${argIdx}_size = ${arg.length};`);

                    argsText.push(`test_${idx}_arg_${argIdx}`);
                    argsText.push(`test_${idx}_arg_${argIdx}_size`);
                } else {
                    const item = helperTypeMapping(arg);
                    decls.push(`${item.type} test_${idx}_arg_${argIdx} = ${item.val};`);
                    argsText.push(`test_${idx}_arg_${argIdx}`);
                }
            });

            const expItem = helperTypeMapping(tc.expected);

            const retType = getReturnType(userCode, functionName);
            const isVoid = retType === 'void';

            if (isC) {
                const firstArgIsArray = Array.isArray(tc.input[0]);
                let runCall;
                if (isVoid) {
                    if (firstArgIsArray) {
                        const item = helperTypeMapping(tc.input[0]);
                        const rawType = item.type.replace('std::vector<', '').replace('>', '');
                        runCall = `${functionName}(${argsText.join(', ')});\n            `
                            + `std::vector<${rawType}> got(test_${idx}_arg_0, test_${idx}_arg_0 + test_${idx}_arg_0_size);`;
                    } else {
                        runCall = `${functionName}(${argsText.join(', ')});\n            auto got = test_${idx}_arg_0;`;
                    }
                } else {
                    runCall = `auto got = ${functionName}(${argsText.join(', ')});`;
                }

                testInvocations.push(`
        // Test Case ${idx + 1}
        {
          try {
            ${decls.join('\n            ')}
            ${runCall}
            ${expItem.type} expected = ${expItem.val};
            bool passed = (got == expected);
            json_out << "{\\\"passed\\\":" << (passed ? "true" : "false")
                     << ",\\\"got\\\":" << to_json(got)
                     << ",\\\"expected\\\":" << to_json(expected) << "}";
          } catch (...) {
            json_out << "{\\\"passed\\\":false,\\\"error\\\":\\\"Exception thrown\\\"}";
          }
        }
        `);
            } else {
                const runCall = isVoid
                    ? `solver.${functionName}(${argsText.join(', ')});\n            auto got = test_${idx}_arg_0;`
                    : `auto got = solver.${functionName}(${argsText.join(', ')});`;

                testInvocations.push(`
        // Test Case ${idx + 1}
        {
          try {
            ${decls.join('\n            ')}
            ${runCall}
            ${expItem.type} expected = ${expItem.val};
            bool passed = (got == expected);
            json_out << "{\\\"passed\\\":" << (passed ? "true" : "false")
                     << ",\\\"got\\\":" << to_json(got)
                     << ",\\\"expected\\\":" << to_json(expected) << "}";
          } catch (const std::exception& e) {
            json_out << "{\\\"passed\\\":false,\\\"error\\\":\\\"" << e.what() << "\\\"}";
          } catch (...) {
            json_out << "{\\\"passed\\\":false,\\\"error\\\":\\\"Unknown exception\\\"}";
          }
        }
        `);
            }
        });

        const runnerWrapper = `
#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <sstream>
#include <stdbool.h>

// Overloaded helper function to serialize result values to json strings
std::string to_json(int val) { return std::to_string(val); }
std::string to_json(double val) { return std::to_string(val); }
std::string to_json(const std::string& val) { return "\\\"" + val + "\\\""; }
std::string to_json(bool val) { return val ? "true" : "false"; }

template<typename T>
std::string to_json(const std::vector<T>& vec);

template<typename T>
std::string to_json(const std::vector<T>& vec) {
    std::stringstream ss;
    ss << "[";
    for (size_t i = 0; i < vec.size(); i++) {
        ss << to_json(vec[i]);
        if (i + 1 < vec.size()) ss << ",";
    }
    ss << "]";
    return ss.str();
}

// User-defined solution
${userCode}

int main() {
    ${isC ? '' : 'Solution solver;'}
    std::stringstream json_out;
    json_out << "[";
    
    ${testInvocations.join('\n    json_out << ",";\n    ')}
    
    json_out << "]";
    std::cout << "__TEST_RUN_JSON__" << json_out.str() << std::endl;
    return 0;
}
`;

        const sourcePath = path.join(tempDir, 'runner.cpp');
        fs.writeFileSync(sourcePath, runnerWrapper);

        const execPath = path.join(tempDir, 'runner.exe');
        const startTime = Date.now();

        // Compile-command: C++ or C, compile with g++ since it works for both
        const compilerCmd = `"${getGppPath()}" -O2 "${sourcePath}" -o "${execPath}"`;
        exec(compilerCmd, (compileErr, compileStdout, compileStderr) => {
            if (compileErr) {
                resolve({
                    success: true,
                    results: [],
                    logs: [],
                    error: 'Compilation Error:\n' + (compileStderr || compileStdout || compileErr.message),
                    executionTimeMs: Date.now() - startTime
                });
                return;
            }

            // Execute binary built
            exec(`"${execPath}"`, { timeout: 2500 }, (error, stdout, stderr) => {
                const executionTimeMs = Date.now() - startTime;
                const logs = [];
                let executionError = null;

                if (stderr) {
                    logs.push('[STDERR] ' + stderr.trim());
                    executionError = stderr.trim();
                }

                const rawLines = stdout.split('\n');
                let testResults = [];
                const marker = '__TEST_RUN_JSON__';

                for (const line of rawLines) {
                    if (line.startsWith(marker)) {
                        try {
                            testResults = JSON.parse(line.substring(marker.length).trim());
                        } catch (e) {
                            console.error('Failed to parse C++ json output', e);
                        }
                    } else if (line.trim()) {
                        logs.push(line.trim());
                    }
                }

                if (error && error.killed) {
                    executionError = 'Execution timed out (Limit: 2.5s).';
                }

                resolve({
                    success: true,
                    results: testResults,
                    logs,
                    error: executionError,
                    executionTimeMs
                });
            });
        });
    });
};

module.exports = { runDsaCode };
