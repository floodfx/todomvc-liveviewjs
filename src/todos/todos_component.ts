import { LiveViewTemplate, html, form_for, text_input, live_patch, createLiveView, LiveViewMeta } from "liveviewjs";
import { createTodo, emptyChangeset, getTodo, listTodos, removeTodo, Todo, updateTodo } from "./data";

// Define how we can filter the todos
const Filters = ["all", "active", "completed"] as const;
// Create a type based on the filters
type Filter = typeof Filters[number];

// Define the shape of liveview cotext
interface TodosContext {
  todos: Todo[];
  filter: Filter;
}

// Define the events that can be triggered by the user.
type TodosEvents =
  | { type: "addTodo"; id: string; text: string }
  | { type: "removeTodo"; id: string }
  | { type: "toggleTodo"; id: string }
  // tid is work around for known bug in morphdom with input[name=id]
  // https://elixirforum.com/t/i-had-the-weirdest-problem-with-liveviews-change-tracking-when-name-attribute-has-value-id/39008/3
  | { type: "editTodo"; tid: string; text: string }
  | { type: "completeAll" }
  | { type: "clearCompletedTodos" };

// Define the liveview
export const todosLiveView = createLiveView<TodosContext, TodosEvents>({
  // Define the initial state
  mount: (socket) => {
    const filter = "all";
    socket.assign({
      todos: filteredTodos(listTodos(), filter),
      filter,
    });
    socket.tempAssign({ todos: [] });
  },

  // Handle url changes for the filters
  handleParams: (url, socket) => {
    const filterParam = url.searchParams.get("filter") ?? "all";
    const filter: Filter = Filters.includes(filterParam as Filter) ? (filterParam as Filter) : "all";
    socket.assign({
      todos: filteredTodos(listTodos(), filter),
      filter,
    });
  },

  // Handle all the different events from user input
  handleEvent: (event, socket) => {
    switch (event.type) {
      case "addTodo":
        const newChangeset = createTodo({ text: event.text });
        if (newChangeset.valid) {
          socket.assign({ todos: listTodos(), filter: "all" });
          return;
        }
        break;
      case "toggleTodo":
        const todoToToggle = getTodo(event.id);
        if (todoToToggle) {
          updateTodo(todoToToggle, { completed: !todoToToggle.completed });
        }
        break;
      case "editTodo":
        const todoToEdit = getTodo(event.tid);
        if (todoToEdit) {
          updateTodo(todoToEdit, { text: event.text });
        }
        break;
      case "removeTodo":
        const { id } = event;
        const todoToRemove = getTodo(id);
        if (todoToRemove) {
          removeTodo(id);
        }
        break;
      case "completeAll":
        const todosToToggle = listTodos();
        todosToToggle.forEach((todo) => updateTodo(todo, { completed: true }));
        break;
      case "clearCompletedTodos":
        const todosToClear = listTodos();
        todosToClear.filter((todo) => todo.completed).forEach((todo) => removeTodo(todo.id));
        break;
    }
    const filter = socket.context.filter;
    socket.assign({
      todos: filteredTodos(listTodos(), filter),
      filter,
    });
  },

  // Render the liveview based on the state of the LiveView
  render: (context, meta) => {
    const { todos, filter } = context;
    const { csrfToken } = meta;
    return html`
      <header class="header">
        <h1>todos</h1>
        ${form_for("addTodo", csrfToken, { phx_submit: "addTodo" })}
          ${text_input<Todo>(emptyChangeset, "text", { placeholder: "What needs to be done?", className: "new-todo" })}
        </form>
      </header>
      ${todos.length > 0 ? renderMain(todos, meta) : ""}
      ${todos.length > 0 ? renderFooter(todos, filter) : ""}
    `;
  },
});

// Helper functions for rendering parts of the LiveView
function renderMain(todos: Todo[], meta: LiveViewMeta): LiveViewTemplate {
  const { csrfToken } = meta;
  return html`
      <section id="container" class="main">
        ${form_for("toggleAll", csrfToken, { id: `toggleAll`, phx_change: "completeAll" })}
          <input id="toggle-all" class="toggle-all" type="checkbox" />
          <label for="toggle-all">Mark all as complete</label>
        </form>
        <ul id="todo-list" class="todo-list">
          ${todos.map((todo) => renderTodo(todo, csrfToken))}
        </ul>
      </section>
    `;
}

function renderTodo(todo: Todo, csrfToken: string): LiveViewTemplate {
  return html`
      <li id="${todo.id}" phx-hook="EditTodo" class="${todo.completed ? "completed" : ""}">
        <div id="view_${todo.id}" class="view">
          <div>
            <input 
              phx-value-id="${todo.id}" 
              phx-click="toggleTodo"  
              name="completed" 
              type="checkbox"
              class="toggle"
              ${todo.completed ? "checked" : ""} 
            />
            <label id="label_${todo.id}">${todo.text}</label>            
          </div>
          <button 
            phx-value-id="${todo.id}" 
            phx-click="removeTodo" 
            class="destroy">
          </button>
        </div>
        ${form_for("editTodo", csrfToken, { phx_submit: "editTodo" })}
          <input name="tid" type="hidden" value="${todo.id}" />
          <input name="text" class="edit" value="${todo.text}" />
        </form>
      </li>
    `;
}

function renderFooter(todos: Todo[], filter: Filter): LiveViewTemplate {
  return html`
    <footer class="footer">
      <span class="todo-count">
        <strong>${todos.length}</strong>
        item${todos.length !== 1 ? "s" : ""} left
      </span>
      <ul class="filters">
        <li>
          ${live_patch("All", {
            to: { path: "/todos", params: { filter: "all" } },
            className: filter === "all" ? "selected" : "",
          })}
        </li>
        <li>
          ${live_patch("Active", {
            to: { path: "/todos", params: { filter: "active" } },
            className: filter === "active" ? "selected" : "",
          })}
        </li>
        <li>
          ${live_patch("Completed", {
            to: { path: "/todos", params: { filter: "completed" } },
            className: filter === "completed" ? "selected" : "",
          })}
        </li>
      </ul>
      <!--Hidden if no completed items are left ↓ -->
      <button phx-click="clearCompletedTodos" class="clear-completed">Clear completed</button>
    </footer>
  `;
}

function filteredTodos(todos: Todo[], filter: Filter): Todo[] {
  switch (filter) {
    case "active":
      return todos.filter((todo) => !todo.completed);
    case "completed":
      return todos.filter((todo) => todo.completed);
    default:
      return todos;
  }
}
