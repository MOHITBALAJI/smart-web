export function renderErrorPage(error?: unknown): string {
  const errorMessage = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const errorDetails = error instanceof Error && error.stack ? error.stack : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 32rem; width: 100%; text-align: center; padding: 2rem; background: #fff; border-radius: 0.75rem; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; }
      p { color: #4b5563; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; margin-bottom: 1rem; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      details { text-align: left; margin-top: 1.5rem; border-top: 1px solid #e5e7eb; padding-top: 1rem; font-size: 12px; color: #6b7280; }
      pre { background: #f3f4f6; padding: 0.75rem; border-radius: 0.375rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; color: #dc2626; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
      ${errorMessage ? `
      <details>
        <summary style="cursor: pointer; font-weight: 600;">Technical Details</summary>
        <pre>${errorMessage}\n\n${errorDetails}</pre>
      </details>
      ` : ''}
    </div>
  </body>
</html>`;
}
