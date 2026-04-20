import type { Response } from "express"
import jwt from "jsonwebtoken"

// Generate JWT token and set it as an HTTP-only cookie
const generator = (studentId: string, res: Response) => {
    const payload = { id: studentId }
    const token = jwt.sign(payload, process.env.SERVER_KEY!)

    // Set token in cookie for automatic inclusion in subsequent requests
    res.cookie('token', token, {
        httpOnly: true,  // Prevents client-side JavaScript access (XSS protection)
        secure: false,   // Set to true in production with HTTPS
        sameSite: 'lax'  // CSRF protection
    })
    return token
}

export { generator }