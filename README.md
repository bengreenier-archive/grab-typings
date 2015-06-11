# grab-typings

grab definitelyTyped typings for each module in package.json.

## Getting Started

just `npm install -g grab-typings` and then `grab-typings` from a project directory (anywhere with a `package.json`).

## Example output

```bash
404 | request-promise/request-promise.d.ts
404 | promise/promise.d.ts
200 | a:\vs_workspace\grab-typings\typings\node\node.d.ts
```

The format is really simple; `<http status code>` | `<path>`.

## License

MIT
