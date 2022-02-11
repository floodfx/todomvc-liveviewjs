import "phoenix_html"
import { Socket } from "phoenix"
import NProgress from "nprogress"
import { LiveSocket } from "phoenix_live_view"

const url = "/live"

let Hooks = {
  Todo: {
    mounted() {
      this.el.addEventListener("dblclick", e => {
        this.el.classList.add("editing");
        const edit = this.el.querySelector(".edit")
        edit.focus()
        edit.setSelectionRange(edit.value.length, edit.value.length);
        edit.addEventListener("blur", e => {
          this.el.classList.remove("editing");
        })
      })
    }
  }
}

// @ts-ignore - document will be present in browser
let csrfToken = document.querySelector("meta[name='csrf-token']").getAttribute("content")
let liveSocket = new LiveSocket(url, Socket, { params: { _csrf_token: csrfToken }, hooks: Hooks })

// Show progress bar on live navigation and form submits
window.addEventListener("phx:page-loading-start", info => NProgress.start())
window.addEventListener("phx:page-loading-stop", info => NProgress.done())

// connect if there are any LiveViews on the page
liveSocket.connect()

// expose liveSocket on window for web console debug logs and latency simulation:
liveSocket.enableDebug()
// >> liveSocket.enableLatencySim(1000)
// @ts-ignore - window will be present in the browser
window.liveSocket = liveSocket