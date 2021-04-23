// middleware to check if there is a valid provided username in the req body of the login route

const db = require("../../data/dbConfig");
module.exports = async (req, res, next) => {
  if (req.body.username === undefined || req.body.password === undefined) {
    next({ status: 401, message: "username and password required" });
  }
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
