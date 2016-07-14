var has = require("@nathanfaucett/has"),
    Dependency = require("./Dependency");


var ChunkPrototype;


module.exports = Chunk;


function Chunk() {
    this.tree = null;
    this.id = null;
    this.path = null;
    this.fullPath = null;
    this.dependencyHash = {};
    this.dependencies = [];
}

Chunk.create = function(tree, path, fullPath, id) {
    var chunk = new Chunk();

    chunk.tree = tree;
    chunk.path = path;
    chunk.fullPath = fullPath;
    chunk.id = id;

    return chunk;
};

ChunkPrototype = Chunk.prototype;

ChunkPrototype.parse = function() {
    var dependency = Dependency.create(this, this.path, null);

    dependency.id = this.id;
    dependency.fullPath = this.fullPath;

    this.addDependency(dependency).parse();

    return this;
};

ChunkPrototype.hasDependency = function(id) {
    return has(this.dependencyHash, id);
};

ChunkPrototype.getDependency = function(id) {
    return this.dependencyHash[id];
};

ChunkPrototype.addDependency = function(dependency) {
    var dependencies;

    if (this.hasDependency(dependency.id)) {
        throw new Error("Can not have two dependencies with same id " + dependency.id);
    } else {
        dependencies = this.dependencies;
        dependencies[dependencies.length] = dependency;
        this.dependencyHash[dependency.id] = dependency;
        this.tree.addDependency(dependency);
        return dependency;
    }
};
