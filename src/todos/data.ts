import { randomUUID } from "crypto";
import { LiveViewChangeset, newChangesetFactory } from "liveviewjs";
import { z } from "zod";

export const TodoSchema = z.object({
  id: z.string().default(randomUUID),
  text: z.string().nonempty(),
  completed: z.boolean().default(false),
});

export type Todo = z.infer<typeof TodoSchema>;

const todoChangeset = newChangesetFactory<Todo>(TodoSchema);

const todos: Record<string, Todo> = {};

export const listTodos = () => Object.values(todos).reverse();

export const emptyChangeset = todoChangeset({}, {});

export const getTodo = (id: string): Todo | undefined => todos[id];

export const removeTodo = (id: string): void => {
  delete todos[id];
};

export const createTodo = (newTodo: Partial<Todo>): LiveViewChangeset<Todo> => {
  const result = todoChangeset({}, newTodo, "create");
  if (result.valid) {
    const t = result.data as Todo;
    todos[t.id] = t;
  }
  return result;
};

export const updateTodo = (existing: Todo, updated: Partial<Todo>): LiveViewChangeset<Todo> => {
  const result = todoChangeset(existing, updated, "update");
  if (result.valid) {
    const t = result.data as Todo;
    todos[t.id] = t;
  }
  return result;
};
