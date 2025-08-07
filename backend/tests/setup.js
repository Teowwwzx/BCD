// Test setup file
process.env.NODE_ENV = 'test';
process.env.PORT = 5001; // Use different port for testing

// Mock console.log to reduce noise during tests
if (process.env.NODE_ENV === 'test') {
  console.log = jest.fn();
  console.warn = jest.fn();
}

// Global test timeout
jest.setTimeout(10000);

// Clean up after each test
afterEach(() => {
  jest.clearAllMocks();
});