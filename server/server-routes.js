const _ = require("lodash");
const todos = require("./database/todo-queries.js");
const users = require("./database/user-queries.js");
const todosAssignees = require("./database/todos-assignees-queries.js");

const auth = require("./lib/firebase.js");

function createToDo(req, data) {
  const protocol = req.protocol,
    host = req.get("host"),
    id = data.id;

  return {
    title: data.title,
    order: data.order,
    status: data.status || 0,
    url: `${protocol}://${host}/${id}`,
  };
}

async function getAllTodos(req, res) {
  const allEntries = await todos.all();
  return res.send(allEntries.map(_.curry(createToDo)(req)));
}

async function getTodo(req, res) {
  const todo = await todos.get(req.params.id);
  return res.send(todo);
}

async function postTodo(req, res) {
  const created = await todos.create(req.body.title, req.body.order);
  return res.send(createToDo(req, created));
}

async function patchTodo(req, res) {
  const patched = await todos.update(req.params.id, req.body);
  return res.send(createToDo(req, patched));
}

async function deleteAllTodos(req, res) {
  const deletedEntries = await todos.clear();
  return res.send(deletedEntries.map(_.curry(createToDo)(req)));
}

async function deleteTodo(req, res) {
  const deleted = await todos.delete(req.params.id);
  return res.send(createToDo(req, deleted));
}

async function createUser(req, res) {
  const { name, email, password } = req.body;
  try {
    const userCredential = await auth.createUser({
      email,
      password,
      displayName: name,
    });

    const user = userCredential.uid;

    if (user) {
      const result = await users.create(name, email);
      res
        .status(201)
        .json({ message: "User registered successfully", result: result });
    }
  } catch (err) {
    console.error("ERROR:", err);
    res.status(400).json({ error: err.message });
  }
}

async function getAssignedUsers(req, res) {
  const users = await todosAssignees.get(req.params.todo_id);
  return res.status(201).json({ users });
}

async function assignTodo(req, res) {
  const { userId, todoId } = req.body;
  try {
    const result = await todosAssignees.create(userId, todoId);

    res.status(201).json({
      message: "Todo assigned successfully",
      assignee: result,
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(404).json({ error: "Todo not found" });
  }
}

async function deleteAssign(req, res) {
  const userId = req.params["user_id"];
  const todoId = req.params["todo_id"];

  try {
    const result = await todosAssignees.delete(userId, todoId);

    res.status(201).json({
      message: "Todo assignee deleted successfully",
      result: result,
    });
  } catch (err) {
    console.error("ERROR:", err);
    res.status(404).json({ error: "Todo not found" });
  }
}

async function getUsers(req, res) {
  const allUsers = await users.all();
  return res.status(201).json({ allUsers });
}

function addErrorReporting(func, message) {
  return async function (req, res) {
    try {
      return await func(req, res);
    } catch (err) {
      console.log(`${message} caused by: ${err}`);

      // Not always 500, but for simplicity's sake.
      res.status(500).send(`Opps! ${message}.`);
    }
  };
}

const toExport = {
  getAllTodos: {
    method: getAllTodos,
    errorMessage: "Could not fetch all todos",
  },
  getTodo: { method: getTodo, errorMessage: "Could not fetch todo" },
  postTodo: { method: postTodo, errorMessage: "Could not post todo" },
  patchTodo: { method: patchTodo, errorMessage: "Could not patch todo" },
  deleteAllTodos: {
    method: deleteAllTodos,
    errorMessage: "Could not delete all todos",
  },
  deleteTodo: { method: deleteTodo, errorMessage: "Could not delete todo" },
  createUser: { method: createUser, errorMessage: "Could not create user" },
  getAssignedUsers: {
    method: getAssignedUsers,
    errorMessage: "Could not get assigned users",
  },
  assignTodo: { method: assignTodo, errorMessage: "Could not assign todo" },
  deleteAssign: {
    method: deleteAssign,
    errorMessage: "Could not delete assign",
  },
  getUsers: { method: getUsers, errorMessage: "Could not retrieve users" },
};

for (let route in toExport) {
  toExport[route] = addErrorReporting(
    toExport[route].method,
    toExport[route].errorMessage
  );
}

module.exports = toExport;
