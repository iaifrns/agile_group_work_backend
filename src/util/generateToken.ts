import type { Response } from "express"
import jwt from "jsonwebtoken"

const generator = (studentId:string, res:Response) => {
    const payload = {id: studentId}
    const token = jwt.sign(payload, process.env.SERVER_KEY!)

    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'none'
    })
    return token
}

export {generator}