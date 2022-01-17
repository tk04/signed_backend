const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  try {
    const token = req.cookies.token;
    // const token = req.header("Authorization").replace("Bearer ", "");
    const decoded = jwt.verify(token, "testing123123_fzxasszxc");
    const user = await User.findOne({ username: decoded.username });
    if (!user) {
      throw new Error();
    }
    req.user = user;
    next();
  } catch (e) {
    res.status(401).send({ error: "Please authenticate" });
  }
};

module.exports = auth;
