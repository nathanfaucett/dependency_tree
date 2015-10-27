var has = require("has"),
    filePath = require("file_path"),
    isArray = require("is_array"),
    isString = require("is_string"),
    emptyFunction = require("empty_function"),
    isFunction = require("is_function"),
    isNullOrUndefined = require("is_null_or_undefined"),
    createIncludeRegExp = require("./utils/createIncludeRegExp"),
    Chunk = require("./Chunk");


var DependencyTreePrototype;


module.exports = DependencyTree;


function DependencyTree(path, options) {
    this.path = path;
    this.fullPath = filePath.isAbsolute(path) ? path : filePath.join(process.cwd(), path);
    this.options = parseOptions(options || {});
    this.dependencyHash = null;
    this.dependencies = [];
    this.chunkHash = null;
    this.chunks = [];
}

DependencyTree.create = function(path, options) {
    return new DependencyTree(path, options);
};

DependencyTreePrototype = DependencyTree.prototype;

DependencyTreePrototype.clear = function() {
    this.dependencyHash = {};
    this.dependencies.length = 0;
    this.chunkHash = {};
    this.chunks.length = 0;
    return this;
};

DependencyTreePrototype.parse = function(callback) {
    this.clear().addChunk(Chunk.create(this, this.path, this.fullPath)).parse(callback);
    return this;
};

DependencyTreePrototype.hasChunk = function(fullPath) {
    return has(this.chunkHash, fullPath);
};

DependencyTreePrototype.getChunk = function(fullPath) {
    return this.chunkHash[fullPath];
};

DependencyTreePrototype.createOrGetChunk = function(path, fullPath) {
    if (this.hasChunk(fullPath)) {
        return this.getChunk(fullPath);
    } else {
        return this.addChunk(Chunk.create(this, path, fullPath));
    }
};

DependencyTreePrototype.addChunk = function(chunk) {
    var fullPath = chunk.fullPath,
        chunks;

    if (this.hasChunk(fullPath)) {
        throw new Error("Can not have two chunks with same name " + fullPath);
    } else {
        chunks = this.chunks;
        chunks[chunks.length] = chunk;
        this.chunkHash[fullPath] = chunk;
        return chunk;
    }
};

DependencyTreePrototype.addDependency = function(dependency) {
    var dependencies = this.dependencies,
        index = dependencies.length;

    dependency.index = index;
    dependencies[index] = dependency;
    this.dependencyHash[dependency.fullPath] = dependency;
};

DependencyTreePrototype.getDependency = function(fullPath) {
    return this.dependencyHash[fullPath];
};

DependencyTreePrototype.hasDependency = function(fullPath) {
    return !!this.dependencyHash[fullPath];
};

function parseOptions(options) {
    var results = {},
        beforeParse = options.beforeParse,
        afterParse = options.afterParse,
        useBraces = options.useBraces,
        parseAsync = options.parseAsync,
        functionNames = options.functionNames || options.functionName || "require",
        extensions = options.extensions || options.exts;

    results.beforeParse = isFunction(beforeParse) ? beforeParse : emptyFunction;
    results.afterParse = isFunction(afterParse) ? afterParse : emptyFunction;
    results.parseAsync = isNullOrUndefined(parseAsync) ? true : !!parseAsync;

    results.extensions = isArray(extensions) ? extensions : isString(extensions) ? [extensions] : ["js", "json"];

    results.functionNames = isArray(functionNames) ? functionNames : [functionNames];
    results.useBraces = isNullOrUndefined(useBraces) ? true : !!useBraces;

    results.reInclude = createIncludeRegExp(results.functionNames, results.useBraces);

    return results;
}
