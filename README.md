# grab-typings

grab definitelyTyped typings for each module in package.json.

## Getting Started

just `npm install -g grab-typings` and then `grab-typings` from a project directory (anywhere with a `package.json`).

# options

> You can view this yourself with `grab-typings --help`.

> `inject` is currently a beta feature.

```bash
  Usage: grab-typings|gt [options] [command]


  Commands:

    grab [modules...]  grab definitions for module(s)
    inject <glob>      inject reference paths into files that match <glob>

  Grab definitelyTyped typings for package.json dependencies. By Ben Greenier

  Options:

    -h, --help        output usage information
    -V, --version     output the version number
    -E, --no-success  Show errors only
    -S, --no-error    Show successes only
    -O, --outdir      Set the output directory. defaults to ./typings

```

## Example output

```bash
$ grab-typings grab
404 | request-promise/request-promise.d.ts
404 | promise/promise.d.ts
200 | a:\vs_workspace\grab-typings\typings\node\node.d.ts
```

The format is really simple; `<http status code>` | `<path>`.

## License

MIT
