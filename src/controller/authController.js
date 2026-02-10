const register = async (req, res) => {
  const { firstName, lastName, email, password, phoneNumber, classLevel } =
    req.body;
  res.json({ email, firstName, lastName });
};

export { register };
