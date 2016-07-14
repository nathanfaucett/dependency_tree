DependencyTree
=======

commonjs style dependency tree parser

```javascript
var DependencyTree = require("@nathanfaucett/dependency_tree");


var tree = DependencyTree.create("./path/to/index.js");


tree.parse();

tree.chunks.forEach(function(chunk) {
    console.log(chunk.fullPath);

    chunk.dependencies.forEach(function(dependency) {
        console.log("\t" + dependency.fullPath);
    });
});
```
