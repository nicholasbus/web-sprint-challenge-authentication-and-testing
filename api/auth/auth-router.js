const router = require("express").Router();
const User = require("../users/users-model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../secrets/index");
const checkUsernameExists = require("../middleware/checkUsernameExists");
const db = require("../../data/dbConfig");

router.post("/register", async (req, res, next) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.
    DO NOT EXCEED 2^8 ROUNDS OF HASHING!

    1- In order to register a new account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel", // must not exist already in the `users` table
        "password": "foobar"          // needs to be hashed before it's saved
      }

    2- On SUCCESSFUL registration,
      the response body should have `id`, `username` and `password`:
      {
        "id": 1,
        "username": "Captain Marvel",
        "password": "2a$08$jG.wIGR2S4hxuyWNcBf9MuoC4y0dNy7qC/LbmtuFBSdIhWks2LhpG"
      }

    3- On FAILED registration due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED registration due to the `username` being taken,
      the response body should include a string exactly as follows: "username taken".
  */
  if (req.body.username === undefined || req.body.password === undefined) {
    next({ status: 401, message: "username and password required" });
  }

  try {
    let user = req.body;
    const hash = bcrypt.hashSync(req.body.password, 8);
    user.password = hash;

    const userCheck = await db("users")
      .where({ username: req.body.username })
      .first();
    if (userCheck) {
      next({ status: 401, message: "username taken" });
    } else {
      const newUser = await User.create(user);
      if (!newUser) {
        next({ status: 401, message: "could not create new user" });
      } else {
        res.status(201).json(newUser);
      }
    }
  } catch (e) {
    next(e);
  }
});

router.post("/login", checkUsernameExists, (req, res, next) => {
  /*
    IMPLEMENT
    You are welcome to build additional middlewares to help with the endpoint's functionality.

    1- In order to log into an existing account the client must provide `username` and `password`:
      {
        "username": "Captain Marvel",
        "password": "foobar"
      }

    2- On SUCCESSFUL login,
      the response body should have `message` and `token`:
      {
        "message": "welcome, Captain Marvel",
        "token": "eyJhbGciOiJIUzI ... ETC ... vUPjZYDSa46Nwz8"
      }

    3- On FAILED login due to `username` or `password` missing from the request body,
      the response body should include a string exactly as follows: "username and password required".

    4- On FAILED login due to `username` not existing in the db, or `password` being incorrect,
      the response body should include a string exactly as follows: "invalid credentials".
  */
  const { username, password } = req.body;

  if (req.user && bcrypt.compareSync(password, req.user.password)) {
    const token = makeToken(req.user);
    res.status(200).json({ message: `welcome, ${username}`, token: token });
  } else {
    next({ status: 401, message: "invalid credentials" });
  }
});

router.use((err, req, res, next) => {
  res.status(err.status || 500).json({
    message: err.message,
  });
});

const makeToken = (user) => {
  const payload = {
    subject: user.id,
    username: user.username,
  };
  const options = {
    expiresIn: "1d",
  };

  return jwt.sign(payload, JWT_SECRET, options);
};

module.exports = router;
