import jwt from "jsonwebtoken";
const generator = (studentId, res) => {
    const payload = { id: studentId };
    const token = jwt.sign(payload, process.env.SERVER_KEY);
    res.cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    });
    return token;
};
export { generator };
