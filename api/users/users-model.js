const db = require("../../data/dbConfig");

const create = async (user) => {
  const [id] = await db("users").insert(user);
  return db("users").where({ id }).first();
};

module.exports = {
  create,
};
