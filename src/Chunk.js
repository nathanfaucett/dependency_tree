var has = require("has"),
    Dependency = require("./Dependency");


var ChunkPrototype;


module.exports = Chunk;


function Chunk() {
    this.tree = null;
    this.path = null;
    this.fullPath = null;
    this.dependencyHash = {};
    this.dependencies = [];
}

Chunk.create = function(tree, path, fullPath) {
    var chunk = new Chunk();

    chunk.tree = tree;
    chunk.path = path;
    chunk.fullPath = fullPath;

    return chunk;
};

ChunkPrototype = Chunk.prototype;

ChunkPrototype.parse = function(callback) {
    var dependency = Dependency.create(this, this.path, null);

    dependency.fullPath = this.fullPath;
    this.addDependency(dependency).parse(callback);

    return this;
};

ChunkPrototype.hasDependency = function(fullPath) {
    return has(this.dependencyHash, fullPath);
};

ChunkPrototype.getDependency = function(fullPath) {
    return this.dependencyHash[fullPath];
};

ChunkPrototype.addDependency = function(dependency) {
    var fullPath = dependency.fullPath,
        dependencies;

    if (this.hasDependency(fullPath)) {
        throw new Error("Can not have two dependencies with same name " + fullPath);
    } else {
        dependencies = this.dependencies;
        dependencies[dependencies.length] = dependency;
        this.dependencyHash[fullPath] = dependency;
        this.tree.addDependency(dependency);
        return dependency;
    }
};
