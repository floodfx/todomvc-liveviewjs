import { LiveViewRouter, LiveViewServer } from "liveviewjs";
import path from "path";
import { TodosComponent } from "./todos/todos_component";

// create new LiveViewServer
const lvServer = new LiveViewServer({
  signingSecret: "my-secret",
  viewsPath: path.join(__dirname, "views"),
  rootView: "index.html.ejs",
  publicPath: path.join(__dirname, "..", "dist", "client"),
  port: 4455
});

// define your routes by mapping paths to LiveViewComponents
const lvRouter: LiveViewRouter = {
  "/todos": new TodosComponent()
}
// AND then passing the router to the server
lvServer.registerLiveViewRoutes(lvRouter);

// then start the server
lvServer.start();