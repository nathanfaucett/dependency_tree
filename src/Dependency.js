var fs = require("fs"),
    has = require("has"),
    isNull = require("is_null"),
    arrayForEach = require("array-for_each"),
    resolve = require("resolve"),
    mixin = require("mixin"),
    filePath = require("file_path"),
    reComment = require("./utils/reComment"),
    parseChunk = require("./utils/parseChunk"),
    getDependencyId = require("./utils/getDependencyId"),
    parsePackageMappings = require("./utils/parsePackageMappings");


var DependencyPrototype;


module.exports = Dependency;


function Dependency() {

    this.id = null;

    this.index = null;
    this.content = null;

    this.path = null;
    this.fullPath = null;
    this.pkg = null;
    this.pkgFullPath = null;
    this.mappings = {};

    this.chunk = null;
    this.parent = null;

    this.childHash = {};
    this.children = [];
    this.module = this;

    this.isParsed = false;
    this.isResolved = false;
}
DependencyPrototype = Dependency.prototype;

Dependency.create = function(chunk, path, parent) {
    var dependency = new Dependency();

    dependency.chunk = chunk;
    dependency.path = path;
    dependency.parent = parent;

    return dependency;
};

DependencyPrototype.addDependency = function(dependency) {
    var id = dependency.id,
        children = this.children;

    if (!this.hasDependency(id)) {
        children[children.length] = dependency;
        this.childHash[id] = dependency;
    }

    return dependency;
};

DependencyPrototype.getDependency = function(id) {
    return this.childHash[id];
};

DependencyPrototype.hasDependency = function(id) {
    return !!this.childHash[id];
};

function parseSubChunks(parent, tree, subChunks, options) {
    var localHas = has,
        path, dependency;

    for (path in subChunks) {
        if (localHas(subChunks, path)) {
            dependency = Dependency.create(null, path, parent).resolve(parent, options);

            subChunk = tree.createOrGetChunk(path, dependency.fullPath, dependency.id);

            if (tree.hasDependency(dependency.id)) {
                dependency = tree.getDependency(dependency.id);
            } else {
                dependency.chunk = subChunk;
                subChunk.addDependency(dependency);
            }

            if (!parent.hasDependency(dependency.id)) {
                parent.addDependency(dependency);
            }

            dependency.parse();

            Dependency_parse(dependency, parent, subChunks[path], options);
        }
    }
}

function Dependency_parse(_this, requiredFrom, parsedChunk, options) {
    var chunk = _this.chunk,
        tree = chunk.tree,
        children = [];

    parsedChunk.content.replace(options.reInclude, function onReplace(match, include, fn, path) {
        children[children.length] = Dependency.create(chunk, path, _this);
    });

    arrayForEach(children, function forEachDependency(dependency) {
        dependency.resolve(requiredFrom, options);

        if (tree.hasDependency(dependency.id)) {
            dependency = tree.getDependency(dependency.id);
        } else {
            chunk.addDependency(dependency);
        }

        _this.addDependency(dependency);
    });

    arrayForEach(_this.children, function forEachDependency(dependency) {
        dependency.parse();
    });

    if (!isNull(parsedChunk.sub)) {
        parseSubChunks(_this, tree, parsedChunk.sub, options);
    }

    return _this;
}

DependencyPrototype.parse = function() {
    var options, buffer, contentChunk;

    if (this.isParsed === false) {
        this.isParsed = true;

        buffer = fs.readFileSync(this.fullPath);
        this.content = buffer.toString();

        options = this.chunk.tree.options;
        options.beforeParse(this);
        contentChunk = parseChunk(this.path, this.content.replace(reComment, ""), options.reInclude, options.parseAsync);
        Dependency_parse(this, this, contentChunk, options);
        options.afterParse(this);
    }

    return this;
};

DependencyPrototype.resolve = function(requiredFrom, options) {
    var parent, dependency;

    if (this.isResolved === false) {
        this.isResolved = true;

        parent = this.parent;
        options.mappings = requiredFrom.mappings;
        dependency = resolve(this.path, requiredFrom.fullPath, options);

        this.fullPath = dependency.fullPath;
        this.pkgFullPath = dependency.pkgFullPath;
        this.pkg = dependency.pkg;
        this.module = (this.pkg || !parent) ? this : parent.module;

        this.id = getDependencyId(this, this.module);

        if (this.pkg) {
            parsePackageMappings(
                this,
                filePath.dirname(this.fullPath),
                options.packageType
            );
        }

        if (parent) {
            mixin(this.mappings, parent.mappings);
        }
    }

    return this;
};
