var tape = require("tape"),
    filePath = require("file_path"),
    DependencyTree = require("..");


tape("parseDependencyTree(path[, options]) should parse dependency tree", function(assert) {
    var tree = DependencyTree.create(__dirname + "/lib/index.js");

    tree.parse(function(error) {
        var chunks = tree.chunks;

        if (error) {
            assert.end(error);
        } else {

            assert.equal(filePath.relative(__dirname, chunks[0].fullPath), "lib/index.js");
            assert.equal(filePath.relative(__dirname, chunks[0].dependencies[1].fullPath), "lib/a.js");
            assert.equal(filePath.relative(__dirname, chunks[0].dependencies[2].fullPath), "lib/log/index.js");

            assert.equal(filePath.relative(__dirname, chunks[1].fullPath), "lib/ab/src/index.js");
            assert.equal(filePath.relative(__dirname, chunks[1].dependencies[1].fullPath), "lib/abc.js");

            assert.end();
        }
    });
});
