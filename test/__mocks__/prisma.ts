import { PrismaClient } from "../../src/generated/prisma/client.js";
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

export const prismaMock = mockDeep<PrismaClient>()

jest.mock('../../src/lib/prisma', () => ({
    prisma: prismaMock
}))

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn(() => prismaMock)
}))
