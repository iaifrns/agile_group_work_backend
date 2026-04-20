import { PrismaClient } from "../../generated/prisma/client.js";
import { mockDeep } from 'jest-mock-extended';

// Create a deep mock of the PrismaClient for testing
export const prismaMock = mockDeep<PrismaClient>()

