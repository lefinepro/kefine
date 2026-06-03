# Screenshots

Generated current page captures for issue #126.

Regenerate from the repository root with:

```bash
node experiments/capture-project-pages.mjs
```

Set `START_SERVER=0 BASE_URL=http://127.0.0.1:5173` to use an already-running dev server.

| File | Route |
| --- | --- |
| home.png | `/` |
| profile.png | `/@api` |
| profile-search.png | `/@api?q=proxy%20server` |
| weather-widget.png | `/@api/weather` |
| translator-widget.png | `/@api/translate` |
| music-widget.png | `/@api/music` |
| task-detail.png | `/task/order-1` |
| shared-task.png | `/shared/tasks/order-1` |
| solutions.png | `/order/order-1?task=Document%20current%20workspace%20pages` |
| solver-detail.png | `/order/order-1/solver/1` |
| oauth-authorize.png | `/oauth/authorize?client_id=octra&redirect_uri=https%3A%2F%2Foctra.example%2Foauth&state=demo` |
| privacy.png | `/privacy` |
| terms.png | `/terms` |
