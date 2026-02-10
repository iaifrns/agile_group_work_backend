import jwt from "jsonwebtoken"

const generator = (studentId) => {
    const payload = {id: studentId}
    const token = jwt.sign(payload, process.env.SERVER_KEY)

    return token
}

export {generator}