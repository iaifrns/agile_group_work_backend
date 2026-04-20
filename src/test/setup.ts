
import { PrismaClient } from "../generated/prisma/client.js";
import { mockDeep } from 'jest-mock-extended';

jest.mock('../../src/lib/prisma', () => ({
    prisma: mockDeep<PrismaClient>()
}))

export const prismaMock = mockDeep<PrismaClient>();