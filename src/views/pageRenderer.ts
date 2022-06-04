import { html, LiveViewPageRenderer, LiveViewTemplate, live_title_tag, PageTitleDefaults, safe } from "liveviewjs";

/**
 * Render function for the "root" of the LiveView.  Expected that this function will
 * embed the LiveView inside and contain the necessary HTML tags to make the LiveView
 * work including the client javascript.
 * @param pageTitleDefaults the PageTitleDefauls that should be used for the title tag especially if it is a `live_title_tag`
 * @param csrfToken the CSRF token value that should be embedded into a <meta/> tag named "csrf-token". LiveViewJS uses this to validate socket requests
 * @param liveViewContent the content rendered by the LiveView
 * @returns a LiveViewTemplate that can be rendered by the LiveViewJS server
 */
export const pageRenderer: LiveViewPageRenderer = (
  pageTitleDefaults: PageTitleDefaults,
  csrfToken: string,
  liveViewContent: LiveViewTemplate
): LiveViewTemplate => {
  const pageTitle = pageTitleDefaults?.title ?? "";
  const pageTitlePrefix = pageTitleDefaults?.prefix ?? "";
  const pageTitleSuffix = pageTitleDefaults?.suffix ?? "";
  return html`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="csrf-token" content="${csrfToken}" />
        ${live_title_tag(pageTitle, { prefix: pageTitlePrefix, suffix: pageTitleSuffix })}
        <link rel="stylesheet" href="https://unpkg.com/nprogress@0.2.0/nprogress.css" />
        <link rel="stylesheet" href="app.css" />
      </head>
      <body>
        <section class="todoapp">${safe(liveViewContent)}</section>

        <footer class="info">
          <p>Double-click to edit a todo</p>
          <!-- Change this out with your name and url ↓ -->
          <p>Created by <a href="https://github.com/floodfx/todomvc-app-liveviewjs">Donnie Flood</a></p>
          <p>Part of <a href="http://todomvc.com">TodoMVC</a></p>
        </footer>
        <!-- Scripts here. Don't remove ↓ -->
        <script defer type="text/javascript" src="./liveview.js"></script>
      </body>
    </html>
  `;
};
