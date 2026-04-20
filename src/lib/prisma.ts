import "dotenv/config"
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

// PostgreSQL connection string from environment variables
const connectionString = `${process.env.DATABASE_DEV_URL}`;

// Configure Prisma with PostgreSQL adapter
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

export { prisma };