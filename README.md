Triumph JS Tools
----------------
This project is a set of command-line tools that work with the Triumph IDE
in order support JavaScript development. In particular, this project
contains command line scripts that parse JavaScript files and
store function declarations into a SQLite file.  This resulting SQLite
file is then used by Triumph during auto-completion for JavaScript files.


Project setup
-------------
To install the project's depenencies 

```
    npm install
```

To watch the source code for changes and run all tests on change

```
    npm run watch-test
```

To run all tests

```
    npm test
```

To run code style checker and linter. This should be on every commit / push.

```
    npm run lint
```
