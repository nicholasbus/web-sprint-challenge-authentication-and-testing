// middleware to check if there is a valid provided username in the req body of the login route

const db = require("../../data/dbConfig");
module.exports = async (req, res, next) => {
  try {
    const user = await db("users")
      .where({ username: req.body.username })
      .first();
    if (!user) {
      next({ status: 404, message: "invalid credentials" });
    } else {
      req.user = user;
      next();
    }
  } catch (e) {
    next({ message: e.message });
  }
};
