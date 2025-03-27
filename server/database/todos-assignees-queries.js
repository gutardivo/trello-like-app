const knex = require("./connection.js");

async function get(id) {
  const results = await knex("todos_assignees").where({ id });
  return results[0];
}

async function getUsers(todo_id) {
  const results = await knex("todos_assignees").where({ todo_id });
  return results[0];
}

async function create(user_id, todo_id) {
  const results = await knex("todos_assignees")
    .insert({ user_id, todo_id })
    .returning("*");
  return results[0];
}

async function update(id, properties) {
  const results = await knex("todos_assignees")
    .where({ id })
    .update({ ...properties })
    .returning("*");
  return results[0];
}

// delete is a reserved keyword
async function del(user_id, todo_id) {
  const results = await knex("todos_assignees")
    .where({ user_id, todo_id })
    .del()
    .returning("*");
  return results[0];
}

module.exports = {
  get,
  getUsers,
  create,
  update,
  delete: del,
};
