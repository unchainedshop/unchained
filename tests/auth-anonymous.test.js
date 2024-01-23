import {
  setupDatabase,
  createAnonymousGraphqlFetch,
  createLoggedInGraphqlFetch,
} from "./helpers.js";
import { User, ADMIN_TOKEN } from "./seeds/users.js";

let db;
let graphqlFetch;
let adminGraphqlFetch;

describe("Auth for anonymous users", () => {
  beforeAll(async () => {
    [db] = await setupDatabase();
    graphqlFetch = await createAnonymousGraphqlFetch();
    adminGraphqlFetch = await createLoggedInGraphqlFetch(ADMIN_TOKEN);
  });

  describe("Mutation.loginAsGuest", () => {
    it("login as guest", async () => {
      // ensure no e-mail verification gets sent
      const result = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginAsGuest {
              _id
            }
          }
        `,
      });

      const { data: { workQueue } = {} } = await adminGraphqlFetch({
        query: /* GraphQL */ `
          query {
            workQueue {
              _id
              type
              status
            }
          }
        `,
        variables: {},
      });

      const work = workQueue.filter(
        ({ type, status }) => type === "MESSAGE" && status === "SUCCESS"
      );
      expect(work).toHaveLength(0);

      expect(result.data.loginAsGuest).toMatchObject({});
    });

    it("user has guest flag", async () => {
      const Users = db.collection("users");
      const user = await Users.findOne({
        guest: true,
      });
      expect(user).toMatchObject({
        guest: true,
        emails: [
          {
            verified: false,
          },
        ],
      });
    });
  });

  describe("Mutation.createUser", () => {
    it("create a new user", async () => {
      const birthday = new Date().toISOString().split('T')[0];
      const {
        data,
      } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation createUser(
            $username: String
            $email: String
            $password: String
            $profile: UserProfileInput
          ) {
            createUser(
              username: $username
              email: $email
              password: $password
              profile: $profile
            ) {
              _id
              user {
                _id
                username
                primaryEmail {
                  address
                }
                profile {
                  birthday
                  displayName
                  phoneMobile
                  gender
                }
              }
            }
          }
        `,
        variables: {
          username: "newuser",
          email: "newuser@unchained.local",
          password: "password",
          profile: {
            displayName: "New User",
            birthday,
            phoneMobile: "+410000000",
            gender: "m",
            address: null,
          },
        },
      });
      expect(data.createUser).toMatchObject({
        user: {
          username: "newuser",
          primaryEmail: {
            address: "newuser@unchained.local",
          },
          profile: {
            displayName: "New User",
            birthday,
            phoneMobile: "+410000000",
            gender: "m",
          },
        },
      });
    });
  });

  describe("Mutation.loginWithPassword", () => {
    it("login via username and password", async () => {
      const { data: { loginWithPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            loginWithPassword(username: "admin", password: "password") {
              _id
              user {
                _id
                username
              }
            }
          }
        `,
      });
      expect(loginWithPassword).toMatchObject({
        user: {
          _id: 'admin',
          username: "admin",
        },
      });
    });
  });

  describe("Mutation.forgotPassword", () => {
    beforeAll(async () => {
      const Users = db.collection("users");
      const user = await Users.findOne({ _id: "userthatforgetspasswords" });
      if (!user) {
        await Users.insertOne({
          ...User,
          _id: "userthatforgetspasswords",
          username: `${User.username}${Math.random()}`,
          emails: [
            {
              address: "userthatforgetspasswords@unchained.local",
              verified: true,
            },
          ],
        });
      }
    });

    it("create a reset token", async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "userthatforgetspasswords@unchained.local") {
              success
            }
          }
        `,
      });
      expect(forgotPassword).toEqual({
        success: true,
      });
    });
  });

  describe("Mutation.resetPassword", () => {
    beforeAll(async () => {
      const Users = db.collection("users");
      const userCopy = {
        ...User,
        username: `${User.username}${Math.random()}`,
      };
      delete userCopy._id;
      await Users.findOneAndUpdate(
        { _id: "userthatforgetspasswords" },
        {
          $setOnInsert: {
            ...userCopy,
            emails: [
              {
                address: "userthatforgetspasswords@unchained.local",
                verified: true,
              },
            ],
          },
        },
        {
          returnDocument: "after",
          upsert: true,
        }
      );
    });

    it("create a reset token", async () => {
      const { data: { forgotPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation {
            forgotPassword(email: "userthatforgetspasswords@unchained.local") {
              success
            }
          }
        `,
      });
      expect(forgotPassword).toEqual({
        success: true,
      });
    });

    it("change password with token from forgotPassword call", async () => {
      // Reset the password with that token
      const Events = db.collection('events');
      const event = await Events.findOne({
        "payload.userId": 'userthatforgetspasswords',
        "payload.action": "reset-password"
      });

      const token = event.payload.token;

      const { data: { resetPassword } = {} } = await graphqlFetch({
        query: /* GraphQL */ `
          mutation resetPassword($newPassword: String, $token: String!) {
            resetPassword(newPassword: $newPassword, token: $token) {
              _id
              user {
                _id
              }
            }
          }
        `,
        variables: {
          newPassword: "password",
          token,
        },
      });
      expect(resetPassword).toMatchObject({
        user: {
          _id: "userthatforgetspasswords",
        },
      });
    });
  });
});
