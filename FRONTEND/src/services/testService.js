import API from './api';
import documentService from './documentService';

// Fallback Mock Question Repository to generate very realistic questions
const mockQuestionBank = {
  java: {
    mcq: [
      { id: 'q_j1', type: 'mcq', question: 'Which of the following is NOT a core OOP principle in Java?', options: ['Inheritance', 'Polymorphism', 'Compilation', 'Encapsulation'], correctOption: 2, explanation: 'Compilation is a process of translating source code, whereas Inheritance, Polymorphism, and Encapsulation are core OOP principles.', marks: 2 },
      { id: 'q_j2', type: 'mcq', question: 'What is the default value of a boolean variable in Java?', options: ['true', 'false', 'null', '0'], correctOption: 1, explanation: 'In Java, the default value of instance boolean variables is false.', marks: 2 },
      { id: 'q_j3', type: 'mcq', question: 'Which keyword is used to inherit a class in Java?', options: ['implements', 'inherits', 'extends', 'super'], correctOption: 2, explanation: 'The "extends" keyword is used to inherit another class in Java. "implements" is used for interfaces.', marks: 2 }
    ],
    short: [
      { id: 'q_j4', type: 'short', question: 'Explain the difference between method overloading and method overriding in Java.', modelAnswer: 'Method overloading occurs within the same class when two methods have the same name but different signatures. Method overriding occurs in a subclass when it provides a specific implementation of a method already defined in its parent class, using the same name and signature.', marks: 5 },
      { id: 'q_j5', type: 'short', question: 'What is the purpose of the "final" keyword in Java?', modelAnswer: 'The final keyword can be applied to variables (making them constants), methods (preventing overriding), or classes (preventing inheritance).', marks: 5 }
    ],
    long: [
      { id: 'q_j6', type: 'long', question: 'Discuss the concept of Interface and Abstract Class in Java. When would you prefer one over the other? Provide architectural context.', modelAnswer: 'An abstract class can have instance fields and concrete methods, allowing shared state and shared implementation. Interfaces (prior to Java 8) could only have abstract methods, but can now have default/static methods. Choose an abstract class when creating a tight hierarchy with shared code. Choose an interface to define a contract that unrelated classes can implement (like Serializable or Comparable), allowing multiple inheritance of types.', marks: 10 }
    ],
    scenario: [
      {
        id: 'q_j7',
        type: 'scenario',
        scenarioText: 'A financial services startup is designing a payment processing gateway. The system must support various payment options (Credit Card, UPI, PayPal, Bank Transfer). The lead architect insists that adding new payment channels in the future should require zero modification to the existing transaction processing workflow.',
        subQuestions: [
          { id: 'q_j7_1', type: 'mcq', question: 'Which design pattern is most appropriate to decouple the transactions from payment providers?', options: ['Singleton Pattern', 'Strategy Pattern', 'Observer Pattern', 'Factory Pattern'], correctOption: 1, explanation: 'Strategy pattern allows swapping payment algorithms (credit card, UPI, PayPal) at runtime without altering the context processing transactions.', marks: 3 },
          { id: 'q_j7_2', type: 'short', question: 'Write a short Java interface declaration `PaymentMethod` that supports processing a payment with a given amount.', modelAnswer: 'public interface PaymentMethod { boolean processPayment(double amount); }', marks: 5 }
        ]
      }
    ]
  },
  ai: {
    mcq: [
      { id: 'q_a1', type: 'mcq', question: 'What is the primarily goal of regularization in training machine learning models?', options: ['Reduce training time', 'Prevent overfitting', 'Increase training accuracy', 'Eliminate bias completely'], correctOption: 1, explanation: 'Regularization adds a penalty term to the loss function to constrain weights, preventing the model from fitting noise in the training set and thus preventing overfitting.', marks: 2 },
      { id: 'q_a2', type: 'mcq', question: 'Which activation function is commonly used in the output layer of a binary classifier?', options: ['ReLU', 'Softmax', 'Sigmoid', 'Tanh'], correctOption: 2, explanation: 'Sigmoid squashes the output between 0 and 1, representing the probability of the positive class.', marks: 2 }
    ],
    short: [
      { id: 'q_a3', type: 'short', question: 'Explain the difference between supervised and unsupervised learning.', modelAnswer: 'Supervised learning trains models on labeled datasets (with target labels provided). Unsupervised learning identifies hidden patterns or structures in unlabeled datasets (e.g., clustering).', marks: 5 },
      { id: 'q_a4', type: 'short', question: 'What is gradient descent and how does it work?', modelAnswer: 'Gradient descent is an optimization algorithm that iteratively adjusts model parameters in the direction of steepest descent (negative gradient) of the cost function to minimize error.', marks: 5 }
    ],
    long: [
      { id: 'q_a5', type: 'long', question: 'Deeply evaluate the concept of transformer models. Explain self-attention mechanism and how it differs from traditional RNNs/LSTMs in sequence processing.', modelAnswer: 'Unlike RNNs/LSTMs that process tokens sequentially (which creates bottlenecks and vanishing gradients), Transformers process all tokens in parallel. The self-attention mechanism calculates dynamic weights representing how much attention each word should pay to other words in the sentence, capturing long-range dependencies effectively and scaling linearly with compute power.', marks: 10 }
    ],
    scenario: [
      {
        id: 'q_a6',
        type: 'scenario',
        scenarioText: 'A healthcare hospital group wants to deploy an AI diagnostics system to flag cancerous nodules in lung CT scans. The training data has 10,000 scans: 9,900 benign and 100 malignant. The developed prototype achieves 99% accuracy but fails to flag 90% of the actual cancers.',
        subQuestions: [
          { id: 'q_a6_1', type: 'mcq', question: 'What is the primary cause of this failure in prediction?', options: ['Underfitting', 'Class imbalance', 'Vanishing gradients', 'Incorrect learning rate'], correctOption: 1, explanation: 'Class imbalance. The model achieves 99% accuracy simply by predicting "benign" for everything, ignoring the minority malignant class.', marks: 3 },
          { id: 'q_a6_2', type: 'short', question: 'Name two metrics that are better than "accuracy" for assessing this model.', modelAnswer: 'Recall (Sensitivity), Precision, F1-Score, or Area Under ROC Curve (AUC).', marks: 5 }
        ]
      }
    ]
  },
  general: {
    mcq: [
      { id: 'q_g1', type: 'mcq', question: 'What is the main purpose of DNS (Domain Name System)?', options: ['Secure network packets', 'Translate domain names to IP addresses', 'Store website databases', 'Route emails across servers'], correctOption: 1, explanation: 'DNS acts as the phonebook of the internet, mapping human-readable hostnames to numeric IP addresses.', marks: 2 },
      { id: 'q_g2', type: 'mcq', question: 'Which protocol is used for secure communications over a computer network?', options: ['HTTP', 'FTP', 'HTTPS', 'SMTP'], correctOption: 2, explanation: 'HTTPS (Hypertext Transfer Protocol Secure) encrypts HTTP requests using SSL/TLS.', marks: 2 }
    ],
    short: [
      { id: 'q_g3', type: 'short', question: 'What is the MVC (Model-View-Controller) architecture?', modelAnswer: 'MVC is a software design pattern that separates application logic into three main components: Model (data), View (UI), and Controller (processes requests and orchestrates updates).', marks: 5 }
    ],
    long: [
      { id: 'q_g4', type: 'long', question: 'Explain the REST architectural style principles. Describe statelessness, cacheability, and layered systems, and explain how HTTP methods mapping is used.', modelAnswer: 'REST (Representational State Transfer) is a stateless client-server architecture. Statelessness means each request contains all information needed to process it. Cacheability allows clients to cache responses to improve speed. Layered systems mean clients do not know if they connect directly or via gateways. It maps resources using URIs and manipulates them with standard HTTP actions (GET, POST, PUT, DELETE).', marks: 10 }
    ],
    scenario: [
      {
        id: 'q_g5',
        type: 'scenario',
        scenarioText: 'An e-commerce app experiences massive spikes in traffic during holiday sales. The single relational database instance becomes a major bottleneck, resulting in timed-out checkout connections.',
        subQuestions: [
          { id: 'q_g5_1', type: 'mcq', question: 'Which horizontal scaling strategy will relieve database read congestion immediately?', options: ['Adding more CPU cores', 'Implementing read replicas', 'Migrating to NoSQL', 'Enabling gzip compression'], correctOption: 1, explanation: 'Read replicas allow duplicating the database, redirecting search/view queries to replicas while writing only to the primary database.', marks: 3 },
          { id: 'q_g5_2', type: 'short', question: 'How can caching layer help in this context?', modelAnswer: 'A caching layer (like Redis) can store frequently fetched items (like catalog data, user profiles) in memory, avoiding hitting the database for redundant requests.', marks: 5 }
        ]
      }
    ]
  }
};

const getLocalStorageTests = () => {
  const tests = localStorage.getItem('generated_tests');
  return tests ? JSON.parse(tests) : [];
};

const saveLocalStorageTests = (tests) => {
  localStorage.setItem('generated_tests', JSON.stringify(tests));
};

const testService = {
  // Generate a test using Document context
  generateTest: async ({ documentId, subject, difficulty, mcqCount, dsaCount, aptitudeCount, shortCount, longCount, scenarioCount, topic, questionSource, timeLimit }) => {
    try {
      // Try backend first
      const response = await API.post('/tests/generate', {
        documentId, subject, difficulty, mcqCount, dsaCount, aptitudeCount, shortCount, longCount, scenarioCount, topic, questionSource, timeLimit
      });
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }

      // ─── Local Mock Generation Engine ───
      // If we don't have the backend endpoint, build a test on the client!
      let docName = 'General Knowledge Base';
      let docSubject = subject || 'General';

      if (documentId) {
        try {
          const docData = await documentService.getDocument(documentId);
          if (docData.success && docData.document) {
            docName = docData.document.originalName;
            docSubject = docData.document.subject;
          }
        } catch (e) {
          console.warn("Could not load document details, using defaults.", e);
        }
      }

      // Map subject string to category
      let category = 'general';
      const subLower = docSubject.toLowerCase();
      if (subLower.includes('java') || subLower.includes('oop') || subLower.includes('programming') || subLower.includes('object')) {
        category = 'java';
      } else if (subLower.includes('ai') || subLower.includes('ml') || subLower.includes('machine') || subLower.includes('artificial') || subLower.includes('python')) {
        category = 'ai';
      }

      // Quick fallback dsa mock question definitions
      const localDsa = [
        {
          id: 'q_dsa_' + Math.random().toString(36).substr(2, 5),
          type: 'dsa',
          questionTitle: 'Invert Binary Tree',
          question: 'Given the root of a binary tree, invert the tree, and return its root.',
          constraints: '0 <= Node count <= 100\n-100 <= Node.val <= 100',
          inputFormat: 'Binary Tree Root (Node)',
          outputFormat: 'Inverted Binary Tree Root',
          sampleInput: 'root = [4,2,7,1,3,6,9]',
          sampleOutput: '[4,7,2,9,6,3,1]',
          explanation: 'Inverting left and right subtrees recursively.',
          javaSignature: 'public TreeNode invertTree(TreeNode root) {\n    // Write your code here\n}',
          starterCode: 'function solve(arr) {\n  // Write your JavaScript code here\n  // For testing, mock reversing items\n  return arr ? [...arr].reverse() : [];\n}',
          expectedTimeComplexity: 'O(N)',
          expectedSpaceComplexity: 'O(N)',
          testCases: JSON.stringify([
            { input: [[1, 2]], expected: [2, 1], functionName: 'solve' }
          ]),
          hiddenTestCases: JSON.stringify([
            { input: [[4, 2, 7]], expected: [7, 2, 4], functionName: 'solve' }
          ]),
          marks: 10,
          topic: topic || 'Trees'
        }
      ];

      const bank = mockQuestionBank[category] || mockQuestionBank.general;

      // Select questions based on counts requested
      const mcqs = [...bank.mcq].slice(0, Math.min(mcqCount || 2, bank.mcq.length));
      const dsas = dsaCount > 0 ? localDsa.slice(0, Math.min(dsaCount, localDsa.length)) : [];
      const aptitudes = [...(bank.aptitude || [])].slice(0, Math.min(aptitudeCount || 2, (bank.aptitude && bank.aptitude.length) || 0));
      const shorts = [...bank.short].slice(0, Math.min(shortCount || 2, bank.short.length));
      const longs = [...bank.long].slice(0, Math.min(longCount || 1, bank.long.length));
      const scenarios = [...bank.scenario].slice(0, Math.min(scenarioCount || 1, bank.scenario.length));

      // Calculate total duration (e.g. 2 min per MCQ/Aptitude, 15 min per DSA)
      let durationMin = (mcqs.length * 2) + (aptitudes.length * 2) + (dsas.length * 15) + (shorts.length * 5) + (longs.length * 10) + (scenarios.length * 12) || 30;

      if (timeLimit) {
        if (timeLimit === 'No Limit') {
          durationMin = 9999;
        } else {
          const parsed = parseInt(timeLimit);
          if (!isNaN(parsed)) durationMin = parsed;
        }
      }

      const newTest = {
        _id: 'test_' + Math.random().toString(36).substr(2, 9),
        documentId: documentId || null,
        documentName: docName,
        subject: docSubject,
        difficulty: difficulty || 'Medium',
        duration: durationMin,
        questions: {
          mcq: mcqs,
          dsa: dsas,
          aptitude: aptitudes,
          short: shorts,
          long: longs,
          scenario: scenarios
        },
        createdAt: new Date().toISOString()
      };

      // Save to local storage
      const existing = getLocalStorageTests();
      existing.push(newTest);
      saveLocalStorageTests(existing);

      return {
        success: true,
        message: 'Test generated successfully by ExamGen AI Engine (Client sandbox)',
        test: newTest
      };
    }
  },

  // Get all generated tests
  getTests: async () => {
    try {
      const response = await API.get('/tests');
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }
      return {
        success: true,
        tests: getLocalStorageTests()
      };
    }
  },

  // Get a single test by ID
  getTest: async (id) => {
    try {
      const response = await API.get(`/tests/${id}`);
      return response.data;
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        throw error;
      }
      const tests = getLocalStorageTests();
      const test = tests.find(t => t._id === id);
      if (!test) {
        throw new Error('Test not found');
      }
      return {
        success: true,
        test
      };
    }
  },

  // Run code sandbox execution
  runCode: async (code, language, testCases, functionName) => {
    try {
      const response = await API.post('/tests/run-code', { code, language, testCases, functionName });
      return response.data;
    } catch (error) {
      console.warn("API code run failed, executing code in browser sandbox", error);
      const consoleLogs = [];
      const originalLog = console.log;
      console.log = (...args) => {
        consoleLogs.push(args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' '));
      };

      let result = undefined;
      const startTime = Date.now();
      try {
        result = new Function(code)();
      } catch (e) {
        console.log = originalLog;
        return {
          success: true,
          error: e.message,
          logs: consoleLogs,
          executionTimeMs: Date.now() - startTime
        };
      }
      console.log = originalLog;
      return {
        success: true,
        result: result !== undefined ? String(result) : 'undefined',
        logs: consoleLogs,
        executionTimeMs: Date.now() - startTime
      };
    }
  }
};

export default testService;
