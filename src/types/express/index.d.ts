declare namespace Express {
    interface Request {
        user?: {
            id: string;
            firstName: string;
            lastName: string;
            email: string;
            phoneNumber: string;
            classLevel?: string | null;
            password?: string;
        };
    }
}