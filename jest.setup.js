// Import the jest-dom library for custom matchers
import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock next-auth/react
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { id: 1, email: 'admin@example.com', role: 'admin' } },
    status: 'authenticated',
  }),
  signIn: jest.fn(),
  signOut: jest.fn(),
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    loading: jest.fn(),
    dismiss: jest.fn(),
  },
}));

// Mock window.URL.createObjectURL
window.URL.createObjectURL = jest.fn();

// Mock FileReader
class MockFileReader {
  readAsDataURL() {
    this.onload({
      target: {
        result: 'data:image/png;base64,mock-base64-data',
      },
    });
  }
}

global.FileReader = MockFileReader;
