/*
    Tests taken from the todo-backend spec located at:
    https://github.com/TodoBackend/todo-backend-js-spec/blob/master/js/specs.js
    
    And transcribed from Mocha/Chai to Jest with async/await/promises and other ES6+ features
    for ease of extension of this project (any additional testing).
*/
process.env.NODE_ENV = "test";
const _ = require("lodash");
const url = require("url");
const request = require("./util/httpRequests.js");

// Relative paths are used for supertest in the util file.
const urlFromTodo = (todo) => new URL(todo.url)["pathname"];
const getRoot = (_) => request.get("/");
const getBody = (response) => response.body;

const timestamp = Date.now();

describe(`Todo-Backend API residing at http://localhost:${process.env.PORT}`, () => {
  function createFreshTodoAndGetItsUrl(params) {
    var postParams = _.defaults(params || {}, { title: "blah" });
    return request.post("/", postParams).then(getBody).then(urlFromTodo);
  }

  describe("The pre-requsites", () => {
    it("the api root responds to a GET (i.e. the server is up and accessible, CORS headers are set up)", async () => {
      const response = await request.get("/");
      expect(response.status).toBe(200);
    });

    it("the api root responds to a POST with the todo which was posted to it", async () => {
      const starting = { title: "a todo" };
      const getRoot = await request.post("/", starting).then(getBody);
      expect(getRoot).toMatchObject(expect.objectContaining(starting));
    });

    it("the api root responds successfully to a DELETE", async () => {
      const deleteRoot = await request.delete("/");
      expect(deleteRoot.status).toBe(200);
    });

    it("after a DELETE the api root responds to a GET with a JSON representation of an empty array", async () => {
      var deleteThenGet = await request.delete("/").then(getRoot).then(getBody);
      expect(deleteThenGet).toEqual([]);
    });
  });

  describe("storing new todos by posting to the root url", () => {
    beforeEach(async () => {
      return await request.delete("/");
    });

    it("adds a new todo to the list of todos at the root url", async () => {
      const starting = { title: "walk the dog" };
      var getAfterPost = await request
        .post("/", starting)
        .then(getRoot)
        .then(getBody);
      expect(getAfterPost).toHaveLength(1);
      expect(getAfterPost[0]).toMatchObject(expect.objectContaining(starting));
    });

    function createTodoAndVerifyItLooksValidWith(verifyTodoExpectation) {
      return request
        .post("/", { title: "blah" })
        .then(getBody)
        .then(verifyTodoExpectation)
        .then(getRoot)
        .then(getBody)
        .then((todosFromGet) => {
          verifyTodoExpectation(todosFromGet[0]);
        });
    }

    it("sets up a new todo as initially not status 0", async () => {
      await createTodoAndVerifyItLooksValidWith((todo) => {
        expect(todo).toMatchObject(expect.objectContaining({ status: 0 }));
        return todo;
      });
    });

    it("each new todo has a url", async () => {
      await createTodoAndVerifyItLooksValidWith((todo) => {
        expect(todo).toHaveProperty("url");
        expect(typeof todo["url"]).toBe("string");
        return todo;
      });
    });

    it("each new todo has a url, which returns a todo", async () => {
      const starting = { title: "my todo" };
      const newTodo = await request.post("/", starting).then(getBody);
      const fetchedTodo = await request.get(urlFromTodo(newTodo)).then(getBody);
      expect(fetchedTodo).toMatchObject(expect.objectContaining(starting));
    });
  });

  describe("working with an existing todo", () => {
    beforeEach(async () => {
      return await request.delete("/");
    });

    it("can navigate from a list of todos to an individual todo via urls", async () => {
      const makeTwoTodos = Promise.all([
        request.post("/", { title: "todo the first" }),
        request.post("/", { title: "todo the second" }),
      ]);

      const todoList = await makeTwoTodos.then(getRoot).then(getBody);
      expect(todoList).toHaveLength(2);
      const getAgainstUrlOfFirstTodo = await request
        .get(urlFromTodo(todoList[0]))
        .then(getBody);
      expect(getAgainstUrlOfFirstTodo).toHaveProperty("title");
    });

    it("can change the todo's title by PATCHing to the todo's url", async () => {
      const initialTitle = { title: "initial title" };
      const todoUrl = await createFreshTodoAndGetItsUrl(initialTitle);
      const changedTitle = { title: "bathe the cat" };
      const patchedTodo = await request
        .patch(todoUrl, changedTitle)
        .then(getBody);
      expect(patchedTodo).toMatchObject(expect.objectContaining(changedTitle));
      expect(patchedTodo).not.toMatchObject(
        expect.objectContaining(initialTitle)
      );
    });

    it("can change the todo's completedness by PATCHing to the todo's url", async () => {
      const urlForNewTodo = await createFreshTodoAndGetItsUrl();
      const patchedTodo = await request
        .patch(urlForNewTodo, { status: 2 })
        .then(getBody);
      expect(patchedTodo).toHaveProperty("status", 2);
    });

    it("changes to a todo are persisted and show up when re-fetching the todo", async () => {
      const urlForNewTodo = await createFreshTodoAndGetItsUrl();
      const patchedTodo = await request
        .patch(urlForNewTodo, { title: "changed title", status: 2 })
        .then(getBody);

      function verifyTodosProperties(todo) {
        expect(todo).toHaveProperty("status", 2);
        expect(todo).toHaveProperty("title", "changed title");
      }

      const verifyRefetchedTodo = request
        .get(urlFromTodo(patchedTodo))
        .then(getBody)
        .then((refetchedTodo) => {
          verifyTodosProperties(refetchedTodo);
        });

      const verifyRefetchedTodoList = request
        .get("/")
        .then(getBody)
        .then((todoList) => {
          expect(todoList).toHaveLength(1);
          verifyTodosProperties(todoList[0]);
        });

      await Promise.all([verifyRefetchedTodo, verifyRefetchedTodoList]);
    });

    it("can delete a todo making a DELETE request to the todo's url", async () => {
      const urlForNewTodo = await createFreshTodoAndGetItsUrl();
      await request.delete(urlForNewTodo);
      const todosAfterCreatingAndDeletingTodo = await request
        .get("/")
        .then(getBody);
      expect(todosAfterCreatingAndDeletingTodo).toEqual([]);
    });
  });

  describe("tracking todo order", () => {
    it("can create a todo with an order field", async () => {
      const postResult = await request
        .post("/", { title: "blah", order: 523 })
        .then(getBody);
      expect(postResult).toHaveProperty("order", 523);
    });

    it("can PATCH a todo to change its order", async () => {
      const newTodoUrl = await createFreshTodoAndGetItsUrl({ order: 10 });
      const patchedTodo = await request
        .patch(newTodoUrl, { order: 95 })
        .then(getBody);
      expect(patchedTodo).toHaveProperty("order", 95);
    });

    it("remembers changes to a todo's order", async () => {
      const newTodoUrl = await createFreshTodoAndGetItsUrl({ order: 10 });
      const patchedTodo = await request
        .patch(newTodoUrl, { order: 95 })
        .then(getBody);
      const refetchedTodo = await request
        .get(urlFromTodo(patchedTodo))
        .then(getBody);
      expect(refetchedTodo).toHaveProperty("order", 95);
    });
  });

  describe("User Authentication and Todo Assignment", () => {
    // Test User Registration
    describe("User Registration", () => {
      it("should register a new user with email and password", async () => {
        const userData = {
          name: "Gustavo Tardivo",
          email: `gutardivo+${timestamp}@example.com`,
          password: "password123",
        };
        const response = await request.post("/create-user", userData);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("User registered successfully");
        expect(response.body.result).toHaveProperty("name", userData.name);
      });

      it("should return error for missing email or password during registration", async () => {
        const incompleteUserData = { name: "Gustavo Tardivo" };
        const response = await request.post("/create-user", incompleteUserData);
        expect(response.status).toBe(400);
        expect(response.body.error).toBeDefined();
      });
    });

    // Test for Todo Assignment
    describe("Todo Assignment", () => {
      let todoUrl;
      let userId = 1;

      beforeEach(async () => {
        const todoData = { title: "Completed assigment", order: 1 };
        const createdTodo = await request.post("/", todoData).then(getBody);
        todoUrl = urlFromTodo(createdTodo);
      });

      it("should assign a user to a todo", async () => {
        const assignmentData = { userId, todoId: todoUrl.split("/").pop() };
        const response = await request.post("/assign-todo", assignmentData);
        expect(response.status).toBe(201);
        expect(response.body.message).toBe("Todo assigned successfully");
        expect(response.body.assignee).toHaveProperty("user_id", userId);
      });
      it("should return error when assigning a non-existent todo", async () => {
        const invalidAssignmentData = { userId, todoId: "non-existent" };
        const response = await request.post(
          "/assign-todo",
          invalidAssignmentData
        );
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Todo not found");
      });

      it("should allow deleting the assignee from a todo", async () => {
        const assignmentData = { userId, todoId: todoUrl.split("/").pop() };
        await request.post("/assign-todo", assignmentData);

        const response = await request.delete(
          `/delete-assign/${userId}/${assignmentData.todoId}`
        );
        expect(response.status).toBe(201);
        expect(response.body.message).toBe(
          "Todo assignee deleted successfully"
        );
      });

      it("should return error when deleting an assignee from a non-existent todo", async () => {
        const response = await request.delete(
          `/delete-assign/${userId}/non-existent-todo-id`
        );
        expect(response.status).toBe(404);
        expect(response.body.error).toBe("Todo not found");
      });
    });
  });
});
