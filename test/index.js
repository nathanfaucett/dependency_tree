var tape = require("tape"),
    filePath = require("file_path"),
    DependencyTree = require("..");


tape("DependencyTree(path[, options]) should parse dependency tree", function(assert) {
    var tree = DependencyTree.create(__dirname + "/lib/index.js"),
        chunks;

    tree.parse();

    chunks = tree.chunks;

    chunks.forEach(function(chunk) {
        console.log("chunk -> " + filePath.relative(__dirname, chunk.fullPath));
        chunk.dependencies.forEach(function(dependency) {
            console.log("\t" + filePath.relative(__dirname, dependency.fullPath));
        });
    });

    assert.equal(filePath.relative(__dirname, chunks[0].fullPath), filePath.slash("lib/index.js"));
    assert.equal(filePath.relative(__dirname, chunks[0].dependencies[1].fullPath), filePath.slash("lib/a.js"));
    assert.equal(filePath.relative(__dirname, chunks[0].dependencies[2].fullPath), filePath.slash("lib/log/index.js"));

    assert.equal(filePath.relative(__dirname, chunks[1].fullPath), filePath.slash("lib/ab/src/index.js"));
    assert.equal(filePath.relative(__dirname, chunks[1].dependencies[1].fullPath), filePath.slash("lib/ab/src/b.js"));
    assert.equal(filePath.relative(__dirname, chunks[1].dependencies[2].fullPath), filePath.slash("lib/abc.js"));

    assert.end();
});
