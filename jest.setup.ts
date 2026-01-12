import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

// Add TextEncoder/TextDecoder to global scope (needed for jose)
Object.assign(global, { TextEncoder, TextDecoder });

// Add structuredClone polyfill if not available (needed for jose SignJWT)
if (typeof structuredClone === "undefined") {
  (global as Record<string, unknown>).structuredClone = <T>(obj: T): T => {
    return JSON.parse(JSON.stringify(obj));
  };
}

// Mock Next.js router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

// Mock crypto for tests
Object.defineProperty(global, "crypto", {
  value: {
    randomUUID: () => "test-uuid-" + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  },
});

// Mock fetch
global.fetch = jest.fn();

// Reset mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
