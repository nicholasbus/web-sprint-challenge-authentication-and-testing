const server = require("./server");
const request = require("supertest");
const db = require("../data/dbConfig");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("./secrets/index");

// users to test register with
const user1 = { username: "nick", password: "password1" };
const user2 = { username: "bob", password: "password2" };

// hashed users to test login against
const user1Hashed = {
  username: "nick",
  password: bcrypt.hashSync(user1.password),
};
const user2Hashed = {
  username: "bob",
  password: bcrypt.hashSync(user2.password),
};

// reset db before all tests
beforeAll(async () => {
  await db.migrate.rollback();
  await db.migrate.latest();
});

// truncate users table before each test
beforeEach(async () => {
  await db("users").truncate();
});

// disconnecting from db after all tests
afterAll(async () => {
  await db.destroy();
});

// Write your tests here
test("sanity", () => {
  expect(true).toBe(true);
});

describe("--- Auth tests ---", () => {
  describe("[POST] /api/auth/register", () => {
    it("responds with a 201", async () => {
      const res = await request(server).post("/api/auth/register").send(user1);
      expect(res.status).toBe(201);
    });
    it("responds with the newly created user", async () => {
      let res;
      res = await request(server).post("/api/auth/register").send(user1);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username");
      expect(res.body).toHaveProperty("password");

      res = await request(server).post("/api/auth/register").send(user2);
      expect(res.body).toHaveProperty("id");
      expect(res.body).toHaveProperty("username");
      expect(res.body).toHaveProperty("password");
    });
  });

  describe("[POST] /api/auth/login", () => {
    it("responds with a welcome message", async () => {
      // inserting users with hashed password
      await db("users").insert(user1Hashed);
      await db("users").insert(user2Hashed);

      let res;
      res = await request(server).post("/api/auth/login").send(user1);
      expect(res.body.message).toBe("welcome, nick");

      res = await request(server).post("/api/auth/login").send(user2);
      expect(res.body.message).toBe("welcome, bob");
    });
    it("responds with JWT token", async () => {
      // inserting users with hashed password
      await db("users").insert(user1Hashed);
      await db("users").insert(user2Hashed);

      let res;
      res = await request(server).post("/api/auth/login").send(user1);
      expect(res.body).toHaveProperty("token");

      res = await request(server).post("/api/auth/login").send(user2);
      expect(res.body).toHaveProperty("token");
    });
  });
});

describe("--- Jokes tests ---", () => {
  describe("[GET] /api/jokes/", () => {
    it("cannot access jokes without valid token", async () => {
      const res = await request(server).get("/api/jokes/");
      expect(res.status).toBe(401);
    });
    it("able to access jokes with valid token", async () => {
      // creating a token
      const payload = {
        subject: 1,
        username: "nick",
      };
      const options = {
        expiresIn: "1d",
      };
      const token = jwt.sign(payload, JWT_SECRET, options);

      // sending the token as Authorization header
      const res = await request(server)
        .get("/api/jokes")
        .set({ Authorization: token });
      expect(res.status).toBe(200);
    });
  });
});
