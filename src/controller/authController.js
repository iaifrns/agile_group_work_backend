import { prisma } from "../lib/prisma.js";
import { generator } from "../util/generateToken.js";

const register = async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber, classLevel } =
    req.body;

  console.log(email);
  const user = await prisma.student.findUnique({
    where: { email: email },
  });

  if (user) {
    return res.json({
      error: "This email is already present in the system",
    });
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const student = await prisma.student.create({
    data: {
      firstName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      classLevel,
    },
  });

  const token = generator(student.id);

  res.json({
    status: "success",
    data: {
      name: firstName + " " + lastName,
      email,
      id: student.id,
    },
    token,
  });
};

export { register };
