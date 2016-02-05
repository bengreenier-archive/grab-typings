# grab-typings

[![Build Status](https://travis-ci.org/bengreenier/grab-typings.svg?branch=master)](https://travis-ci.org/bengreenier/grab-typings)

grab definitelyTyped typings

## Getting Started

just `npm install -g grab-typings` and then `grab-typings` or `gt` (for short)
from a project directory (anywhere with a `package.json`).

# Options

> You can view this yourself with `gt --help`.

Passing __no options__ will attempt to parse `packages` from `package.json#dependencies` and `package.json#devDependencies`
and if entries are found, we'll try to get typings for those.

```
$ gt --help
Usage: grab-typings||gt -s [source] -i [glob] -d [dir] [package(s)]

Options:
  -s, --source  Specify a source       [string] [default: "https://github.com/borisyankov/DefinitelyTyped/raw/master"]

  -d, --dir     Specify typings directory to save to                                     [string] [default: "typings"]

  -i, --inject  Inject references into files that match [glob]                                [string] [default: null]

  -h, --help    Show help                                                                                    [boolean]

  --version     Show version number                                                                          [boolean]


Made with <3 by @bengreenier
```

## License

MIT
