// create new LiveViewServer
import WebSocket from "ws";
import express from "express";
import { Server } from "http";
import { nanoid } from "nanoid";
import { LiveViewRouter, SingleProcessPubSub, SessionFlashAdaptor } from "liveviewjs";
import { todosLiveView } from "./todos/todos_component";
import { NodeExpressLiveViewServer, NodeJwtSerDe, NodeWsAdaptor, RedisPubSub } from "@liveviewjs/express";
import { pageRenderer } from "./views/pageRenderer";
import session, { MemoryStore } from "express-session";
import path from "path";

// you'd want to set this to some secure, random string in production
const signingSecret = "MY_VERY_SECRET_KEY";

// map request paths to LiveViews
const router: LiveViewRouter = {
  "/todos": todosLiveView,
};

// configure your express app
const app = express();

// serve static files from the public directory
app.use(express.static(path.join(__dirname, "client")));

// setup express-session middleware
app.use(
  session({
    secret: signingSecret,
    resave: false,
    rolling: true,
    saveUninitialized: true,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    },
    store: new MemoryStore(),
  })
);

// initialize the LiveViewServer
const liveView = new NodeExpressLiveViewServer(
  router,
  new NodeJwtSerDe(signingSecret),
  new SingleProcessPubSub(),
  pageRenderer,
  { title: "TodoMVC", suffix: " · LiveViewJS" },
  new SessionFlashAdaptor()
);

// setup the LiveViewJS middleware
app.use(liveView.httpMiddleware());

// redirect / to /todos
app.get("/", (_, res) => res.redirect("/todos"));

// configure express to handle both http and websocket requests
const httpServer = new Server();
const wsServer = new WebSocket.Server({
  server: httpServer,
});

// send http requests to the express app
httpServer.on("request", app);

// initialize the LiveViewJS websocket message router
const liveViewRouter = liveView.wsRouter();

// send websocket requests to the LiveViewJS message router
wsServer.on("connection", (ws) => {
  const connectionId = nanoid();
  ws.on("message", async (message) => {
    // pass websocket messages to LiveViewJS
    await liveViewRouter.onMessage(connectionId, message.toString(), new NodeWsAdaptor(ws));
  });
  ws.on("close", async () => {
    // pass websocket close events to LiveViewJS
    await liveViewRouter.onClose(connectionId);
  });
});

// listen for requests
const port = process.env.PORT || 4001;
httpServer.listen(port, () => {
  console.log(`TodoMVC LiveViewJS is listening on port ${port}!`);
});
