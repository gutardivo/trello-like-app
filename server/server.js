const app = require("./server-config.js");
const routes = require("./server-routes.js");

const port = process.env.PORT || 5000;

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
app.post("/assign-todo", routes.assignTodo);
app.delete("/delete-assign/:user_id/:todo_id", routes.deleteAssign);

if (process.env.NODE_ENV !== "test") {
  app.listen(port, () => console.log(`Listening on port ${port}`));
}

module.exports = app;
