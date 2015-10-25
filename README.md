DependencyTree
=======

commonjs style dependency tree parser

```javascript
var DependencyTree = require("dependency_tree");


var tree = DependencyTree.create("path/to/index.js");


tree.parse(function onParse(error) {
    if (error) {
        // handle error
    } else {
        tree.chunks.forEach(function(chunk) {
            console.log(chunk.fullPath);

            chunk.dependencies.forEach(function(dependency) {
                console.log("\t" + dependency.fullPath);
            });
        });
    }
});
```
