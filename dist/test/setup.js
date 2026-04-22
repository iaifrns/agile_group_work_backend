"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prismaMock = void 0;
const jest_mock_extended_1 = require("jest-mock-extended");
jest.mock('../../src/lib/prisma', () => ({
    prisma: (0, jest_mock_extended_1.mockDeep)()
}));
exports.prismaMock = (0, jest_mock_extended_1.mockDeep)();
