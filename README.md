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
  -s, --source  Specify a source  [string] [default: "https://github.com/borisyankov/DefinitelyTyped/raw/master"]

  -d, --dir     Specify typings directory to save to                                [string] [default: "typings"]

  -i, --inject  Inject references into files that match [glob]                           [string] [default: null]

  -h, --help    Show help                                                                               [boolean]

  --version     Show version number                                                                     [boolean]


Made with <3 by @bengreenier
```

# Output

Here's some sample output (generated by running from this project directory):

```
$ gt
11/11
✓ node
✓ es6-promise
✓ mkdirp
✓ yargs
✓ request
✓ del
✓ optimist
✓ gulp
✓ gulp-mocha
✓ gulp-typescript
✓ mocha
```

# API

> Are you a __developer__?! Oh boy! You can use the `grab-typings` API.

Three easy steps!

+ `npm install grab-typings`
+ `var GrabTypings = require('grab-typings')`
+ `new GrabTypings().run(['array','of','args'])` which will return a promise

That's it.

## Typescript

Oh you use typescript too? Cool. You'll want to follow these steps:

+ get the typings file from [dist/def/grab-typings](./dist/def/grab-typings)
    - oh hey, there's a tool for that `npm install -g grab-typings`
    - `gt -r https://github.com/bengreenier/grab-typings/raw/master/dist/def grab-typings`
+ `npm install grab-typings`
+ `import {GrabTypings} from 'grab-typings'`
+ `new GrabTypings().run(['array','of','args'])` which will return a promise

That's it. see [lib/grab-typings.ts](./lib/grab-typings.js) for an example.

# License

MIT
