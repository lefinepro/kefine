# Screenshots

Generated current page captures for issue #126.

Regenerate from the repository root with:

```bash
node experiments/capture-project-pages.mjs
```

Set `START_SERVER=0 BASE_URL=http://127.0.0.1:5173` to use an already-running dev server.

The created-task capture for issue #141 is regenerated separately with:

```bash
node experiments/capture-created-task.mjs
```

The profile-as-repository captures (issue #130) are regenerated separately with:

```bash
node experiments/capture-profile-repository.mjs
node experiments/capture-profile-owner.mjs
```

| File | Route |
| --- | --- |
| home.png | `/` |
| profile.png | `/@api` |
| profile-solver-profile.png | `/@api/solver` |
| profile-search.png | `/@api?q=proxy%20server` |
| weather-widget.png | `/@api/weather` |
| clock-widget.png | `/@api/time` |
| translator-widget.png | `/@api/translate` |
| music-widget.png | `/@api/music` |
| created-task.png | `/@api/order-1` |
| task-detail.png | `/task/order-1` |
| solutions.png | `/@api/order-1?task=Document%20current%20workspace%20pages` |
| solver-detail.png | `/order/order-1/solver/1` |
| oauth-authorize.png | `/oauth/authorize?client_id=octra&redirect_uri=https%3A%2F%2Foctra.example%2Foauth&state=demo` |
| privacy.png | `/privacy` |
| terms.png | `/terms` |

Profile-as-repository captures (issue #130):

| File | Description |
| --- | --- |
| profile-repository-public.png | Public profile rendered as a repository: README + task checklist + new-task row. No widgets are shown statically. |
| profile-repository-checklist.png | Close-up of the profile task checklist. |
| profile-widget-search.png | A declared widget (translator) surfaced from the command palette only when the visitor types a matching query. |
| profile-owner-editor.png | Owner view: the flat repository panel followed by the editor — public/private lock chip, social/secret columns, and the restored bonus card wired to `/api/profile/bin-lookup`. |
