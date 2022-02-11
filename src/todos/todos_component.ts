import { BaseLiveViewComponent, LiveViewMountParams, LiveViewSocket, LiveViewTemplate, html, form_for, LiveViewExternalEventListener, StringPropertyValues, text_input, LiveViewChangeset, live_patch } from "liveviewjs";
import { createTodo, emptyChangeset, getTodo, listTodos, removeTodo, Todo, updateTodo } from "./data";
import { SessionData } from "express-session";

type TodosEvents = "addTodo" | "removeTodo" | "toggleTodo" | "editTodo" | "completeAll" | "clearCompletedTodos";

type Filter = "all" | "active" | "completed";

interface FilterOption {
  filter: Filter;
}

interface TodosContext {
  todos: Todo[];
  filterOption: FilterOption
}

export class TodosComponent extends BaseLiveViewComponent<TodosContext, FilterOption> implements
  LiveViewExternalEventListener<TodosContext, TodosEvents, Partial<Todo>> {

  mount(params: LiveViewMountParams, session: Partial<SessionData>, socket: LiveViewSocket<TodosContext>): TodosContext {
    const filterOption: FilterOption = { filter: "all" };
    return {
      todos: this.filteredTodos(listTodos(), filterOption),
      filterOption,
    }
  }

  handleParams(params: FilterOption, url: string, socket: LiveViewSocket<TodosContext>): TodosContext {
    const filterOption: FilterOption = params || { filter: "all" };
    return {
      todos: this.filteredTodos(listTodos(), filterOption),
      filterOption,
    };
  }

  handleEvent(event: TodosEvents, params: StringPropertyValues<Pick<Todo, "id" | "text" | "completed">>, socket: LiveViewSocket<TodosContext>): TodosContext {
    const { id, text } = params;
    switch (event) {
      case "addTodo":
        createTodo({ text });
        break;
      case "toggleTodo":
        const todoToToggle = getTodo(id);
        if (todoToToggle) {
          updateTodo(todoToToggle, { completed: !todoToToggle.completed });
        }
        break;
      case "editTodo":
        const todoToEdit = getTodo(id);
        if (todoToEdit) {
          updateTodo(todoToEdit, { text });
        }
        break;
      case "removeTodo":
        const todoToRemove = getTodo(id);
        if (todoToRemove) {
          removeTodo(id);
        }
        break;
      case "completeAll":
        const todosToToggle = listTodos();
        todosToToggle.forEach(todo => updateTodo(todo, { completed: true }));
        break;
      case "clearCompletedTodos":
        const todosToClear = listTodos();
        todosToClear.filter(todo => todo.completed).forEach(todo => removeTodo(todo.id));
        break;
    }
    const filterOption: FilterOption = socket.context.filterOption;
    return {
      todos: this.filteredTodos(listTodos(), filterOption),
      filterOption
    }
  }

  render(context: TodosContext): LiveViewTemplate {
    const { todos, filterOption } = context;
    return html`
      <header class="header">
        <h1>todos</h1>
        ${form_for("addTodo", { phx_submit: "addTodo" })}
          ${text_input<Todo>(emptyChangeset, "text", { placeholder: "What needs to be done?", className: "new-todo" })}
        </form>
      </header>
      <!-- This section should be hidden by default and shown when there are todos -->
      ${todos.length > 0 ? this.renderMain(todos) : ""}

      <!-- This footer should be hidden by default and shown when there are todos -->
      ${todos.length > 0 ? this.renderFooter(todos, filterOption) : ""}
    `
  }

  renderMain(todos: Todo[]): LiveViewTemplate {
    return html`
      <section class="main">
        ${form_for("toggleAll", { id: `toggleAll`, phx_change: "completeAll" })}
          <input id="toggle-all" class="toggle-all" type="checkbox" />
          <label for="toggle-all"> Mark all as complete</label>
        </form>
        <ul class="todo-list">
        <!--These are here just to show the structure of the list items-- >
          ${todos.map(todo => this.renderTodo(todo))}
        </ul>
      </section>
    `
  }

  renderTodo(todo: Todo): LiveViewTemplate {
    return html`
      <!--List items should get the class "editing" when editing and "completed" when marked as completed -->
      <li id="li_${todo.id}" phx-hook="Todo" phx-value-id="${todo.id}" class="${todo.completed ? "completed" : ""}">
        <div id="view_${todo.id}" class="view">
          ${form_for("toggleTodo", { id: `toggle_${todo.id}`, phx_change: "toggleTodo" })}
            <input id="input_id_${todo.id}" name="id" type="hidden" value="${todo.id}" />
            <input id="input_completed_${todo.id}" name="completed" class="toggle" type="checkbox" ${todo.completed ? "checked" : ""} />
            <label id="label_${todo.id}">${todo.text}</label>
          </form>
          <button phx-value-id="${todo.id}" phx-click="removeTodo" class="destroy"></button>
        </div>
        ${form_for("editTodo", { id: `edit_${todo.id}`, phx_submit: "editTodo" })}
          <input name="id" type="hidden" value="${todo.id}" />
          <input name="text" class="edit" value="${todo.text}" />
        </form>
      </li>
    `
  }

  renderFooter(todos: Todo[], filterOption: FilterOption): LiveViewTemplate {
    return html`
      <footer class="footer" >
      <!--This should be "0 items left" by default -->
        <span class="todo-count"> <strong>${todos.length}</strong> item${todos.length === 1 ? "s" : ""} left</span>
          <!--Remove this if you don't implement routing -->
        <ul class="filters" >
          <li>
            ${live_patch("All", { to: { path: "/todos", params: { filter: "all" } }, className: filterOption.filter === "all" ? "selected" : "" })}
          </li>
          <li>
            ${live_patch("Active", { to: { path: "/todos", params: { filter: "active" } }, className: filterOption.filter === "active" ? "selected" : "" })}
          </li>
          <li>
            ${live_patch("Completed", { to: { path: "/todos", params: { filter: "completed" } }, className: filterOption.filter === "completed" ? "selected" : "" })}
          </li>
        </ul>
        <!--Hidden if no completed items are left ↓ -->
        <button phx-click="clearCompletedTodos" class="clear-completed">Clear completed</button>
      </footer>
    `
  }

  filteredTodos(todos: Todo[], filterOption: FilterOption): Todo[] {
    switch (filterOption.filter) {
      case "active":
        return todos.filter(todo => !todo.completed);
      case "completed":
        return todos.filter(todo => todo.completed);
      default:
        return todos;
    }
  }

}