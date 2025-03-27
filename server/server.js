const app = require("./server-config.js");
const routes = require("./server-routes.js");

const port = process.env.PORT || 5000;

// Get Users
app.get("/users", routes.getUsers);

// Todo Routes
app.get("/", routes.getAllTodos);
app.get("/:id", routes.getTodo);

app.post("/", routes.postTodo);
app.patch("/:id", routes.patchTodo);

app.delete("/", routes.deleteAllTodos);
app.delete("/:id", routes.deleteTodo);

// Authentication Routes
app.post("/create-user", routes.createUser);

// Todo Assignment Routes
app.get("/todos/:todo_id/assignees", routes.getAssignedUsers);
app.post("/assign-todo", routes.assignTodo);
app.delete("/delete-assign/:user_id/:todo_id", routes.deleteAssign);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = app;
