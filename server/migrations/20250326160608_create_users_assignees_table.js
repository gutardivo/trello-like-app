/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function (knex) {
  return knex.schema
    .createTable("users", (table) => {
      table.increments("id").primary();
      table.string("name").notNullable();
      table.string("email").notNullable().unique();
      table.timestamp("created_at").defaultTo(knex.fn.now());
    })
    .createTable("todos_assignees", (table) => {
      table.increments("id").primary();
      table.integer("user_id").notNullable();
      table.integer("todo_id").notNullable();
      table.timestamp("assigned_at").defaultTo(knex.fn.now());

      table.foreign("user_id").references("users.id").onDelete("CASCADE");
      table.foreign("todo_id").references("todos.id").onDelete("CASCADE");
    })
    .table("todos", function (table) {
      table.dropColumn("completed");
      table.integer("status").notNullable().defaultTo(0);
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("todos_assignees")
    .dropTableIfExists("users")
    .table("todos", function (table) {
      table.boolean("completed").defaultTo(false);
      table.dropColumn("status");
    });
};
