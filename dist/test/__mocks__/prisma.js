"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
// Create a deep mock of the PrismaClient for testing
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
