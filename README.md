Triumph JS Tools
----------------
This project is a set of command-line tools that work with the Triumph IDE
in order support JavaScript development. In particular, this project
contains command line scripts that parse JavaScript files and
store function declarations into a SQLite file.  This resulting SQLite
file is then used by Triumph during auto-completion for JavaScript files.


Project setup
-------------
You will need to install the node package manager NPM. This can be done in several ways; in Mac OS X you install NPM via homebrew. On linux, it is available in most package managers. In Windows, you can use chocolatey to install NPM.

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

To run code style checker and linter (jshint). This should be on every commit / push.

```
    npm run lint
```
