//const { createDefaultPreset } = require("ts-jest");
import { createDefaultPreset } from 'ts-jest';

// Get default TypeScript transform configuration
const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
export default {
  testEnvironment: "node", // Node.js environment for backend tests
  transform: {
    ...tsJestTransformCfg, // Use default ts-jest transforms
  },
  preset: 'ts-jest', // TypeScript preset for Jest
  roots: ['<rootDir>/src', '<rootDir>/src'], // Directories containing test files
  testMatch: ['**/?(*.)+(spec|test).ts'], // Test file pattern
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts', // Exclude TypeScript declaration files
    '!src/generated/**', // Exclude generated Prisma code
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Path alias for src directory
    '^@lib/(.*)$': '<rootDir>/src/lib/$1', 
  },
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'], // Test setup file
};