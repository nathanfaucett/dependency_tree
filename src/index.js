var has = require("@nathanfaucett/has"),
    filePath = require("@nathanfaucett/file_path"),
    isArray = require("@nathanfaucett/is_array"),
    isString = require("@nathanfaucett/is_string"),
    emptyFunction = require("@nathanfaucett/empty_function"),
    isFunction = require("@nathanfaucett/is_function"),
    isNullOrUndefined = require("@nathanfaucett/is_null_or_undefined"),
    resolve = require("@nathanfaucett/resolve"),
    createIncludeRegExp = require("./utils/createIncludeRegExp"),
    getDependencyId = require("./utils/getDependencyId"),
    Chunk = require("./Chunk");


var DependencyTreePrototype;


module.exports = DependencyTree;


function DependencyTree(path, options) {
    var rootDependency;

    options = parseOptions(options || {});

    rootDependency = resolve(path, filePath.isAbsolute(path) ? filePath.root(path) : (filePath.join(process.cwd(), "comn.js")), options);

    this.path = path;
    this.id = getDependencyId(rootDependency, rootDependency);
    this.fullPath = rootDependency.fullPath;
    this.dirname = filePath.dirname((rootDependency.pkgFullPath ? rootDependency.pkgFullPath : rootDependency.fullPath));
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

DependencyTreePrototype.parse = function() {
    this.clear().addChunk(Chunk.create(this, this.path, this.fullPath, this.id)).parse();
    return this;
};

DependencyTreePrototype.hasChunk = function(id) {
    return has(this.chunkHash, id);
};

DependencyTreePrototype.getChunk = function(id) {
    return this.chunkHash[id];
};

DependencyTreePrototype.createOrGetChunk = function(path, fullPath, id) {
    if (this.hasChunk(id)) {
        return this.getChunk(id);
    } else {
        return this.addChunk(Chunk.create(this, path, fullPath));
    }
};

DependencyTreePrototype.addChunk = function(chunk) {
    var id = chunk.id,
        chunks;

    if (this.hasChunk(id)) {
        throw new Error("DependencyTree.addChunk(chunk) Can not have two chunks with same id " + id);
    } else {
        chunks = this.chunks;
        chunks[chunks.length] = chunk;
        this.chunkHash[id] = chunk;
        return chunk;
    }
};

DependencyTreePrototype.addDependency = function(dependency) {
    var id = dependency.id,
        dependencies, index;

    if (this.hasDependency(id)) {
        throw new Error("DependencyTree.addDependency(dependency) Can not have two dependencies with same id " + id);
    } else {
        dependencies = this.dependencies;
        index = dependencies.length;
        dependency.index = index;
        dependencies[index] = dependency;
        this.dependencyHash[id] = dependency;
        return dependency;
    }
};

DependencyTreePrototype.getDependency = function(id) {
    return this.dependencyHash[id];
};

DependencyTreePrototype.hasDependency = function(id) {
    return !!this.dependencyHash[id];
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
    results.builtin = options.builtin || {};
    results.mappings = options.mappings || {};
    results.packageType = options.packageType || "main";

    results.functionNames = isArray(functionNames) ? functionNames : [functionNames];
    results.useBraces = isNullOrUndefined(useBraces) ? true : !!useBraces;

    results.reInclude = createIncludeRegExp(results.functionNames, results.useBraces);
    results.throwError = true;

    return results;
}
