var tape = require("tape"),
    DependencyTree = require("..");


tape("parseDependencyTree(path[, options]) should parse dependency tree", function(assert) {
    var tree = DependencyTree.create(__dirname + "/lib/index.js");

    tree.parse(function(error) {
        if (error) {
            assert.end(error);
        } else {
            tree.chunks.forEach(function(chunk) {
                console.log(chunk.fullPath);

                chunk.dependencies.forEach(function(dependency) {
                    console.log("\t" + dependency.fullPath);
                });
            });

            assert.end();
        }
    });
});
