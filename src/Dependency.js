var fs = require("fs"),
    has = require("has"),
    keys = require("keys"),
    isNull = require("is_null"),
    arrayForEach = require("array-for_each"),
    resolve = require("resolve"),
    mixin = require("mixin"),
    filePath = require("file_path"),
    reComment = require("./utils/reComment"),
    isNodeModule = require("./utils/isNodeModule"),
    parseChunk = require("./utils/parseChunk"),
    parsePackageMappings = require("./utils/parsePackageMappings");


var DependencyPrototype;


module.exports = Dependency;


function Dependency() {

    this.index = null;
    this.content = null;

    this.path = null;
    this.fullPath = null;
    this.pkg = null;
    this.mappings = {};

    this.chunk = null;
    this.parent = null;

    this.children = [];
    this.module = this;
}
DependencyPrototype = Dependency.prototype;

Dependency.create = function(chunk, path, parent) {
    var dependency = new Dependency();

    dependency.chunk = chunk;
    dependency.path = path;
    dependency.parent = parent;
    dependency.module = (isNull(parent) || isNodeModule(path)) ? dependency : parent.module;

    return dependency;
};

function resolveChildren(children, requiredFrom, options, callback) {
    var called = false,
        index = 0,
        length = children.length;

    (function next(error) {
        if (error || index === length) {
            if (!called) {
                called = true;
                callback(error);
            }
        } else {
            children[index++].resolve(requiredFrom, options, next);
        }
    }());
}

function parseChildren(children, options, callback) {
    var called = false,
        index = 0,
        length = children.length;

    (function next(error) {
        var child;

        if (error || index === length) {
            if (!called) {
                called = true;
                callback(error);
            }
        } else {
            child = children[index++];
            child.parse(next);
        }
    }());
}

function parseSubChunks(parent, tree, subChunks, options, callback) {
    var called = false,
        subChunksKeys = keys(subChunks),
        index = 0,
        length = subChunksKeys.length;

    (function next(error) {
        var path;

        if (error || index === length) {
            if (!called) {
                called = true;
                callback(error);
            }
        } else {
            path = subChunksKeys[index++];

            if (has(subChunks, path)) {
                Dependency.create(null, path, parent).resolve(parent, options, function onResolve(error, dependency) {
                    var children, subChunk;

                    if (error) {
                        next(error);
                    } else {
                        subChunk = tree.createOrGetChunk(path, dependency.fullPath);

                        if (tree.hasDependency(dependency.fullPath)) {
                            children = parent.children;
                            children[children.length] = tree.getDependency(dependency.fullPath);
                        } else {
                            dependency.chunk = subChunk;
                            subChunk.addDependency(dependency);
                        }

                        Dependency_parse(dependency, dependency, options, function onParse(error) {
                            if (error) {
                                next(error);
                            } else {
                                Dependency_parseContent(dependency, parent, subChunks[path], options, next);
                            }
                        });
                    }
                });
            } else {
                next();
            }
        }
    }());
}

function Dependency_parseContent(_this, requiredFrom, parsedChunk, options, callback) {
    var chunk = _this.chunk,
        tree = chunk.tree,
        children = _this.children;

    parsedChunk.content.replace(options.reInclude, function onReplace(match, include, fn, path) {
        children[children.length] = Dependency.create(chunk, path, _this);
    });

    resolveChildren(children, requiredFrom, options, function onResolveChildren(error) {
        if (error) {
            callback(error);
        } else {
            arrayForEach(children, function forEachDependency(dependency, index) {
                if (tree.hasDependency(dependency.fullPath)) {
                    children[index] = tree.getDependency(dependency.fullPath);
                } else {
                    chunk.addDependency(dependency);
                }
            });

            parseSubChunks(_this, tree, parsedChunk.sub, options, function onParseSubChunks(error) {
                if (error) {
                    callback(error);
                } else {
                    parseChildren(children, options, callback);
                }
            });
        }
    });

    return _this;
}

function Dependency_parse(_this, requiredFrom, options, callback) {
    if (isNull(_this.content)) {
        fs.readFile(_this.fullPath, function onReadFile(error, buffer) {
            var contentChunk;

            if (error) {
                callback(error);
            } else {
                _this.content = buffer.toString();

                options.beforeParse(_this);
                contentChunk = parseChunk(_this.path, _this.content.replace(reComment, ""), options.reInclude, options.parseAsync);
                Dependency_parseContent(_this, requiredFrom, contentChunk, options, function onParseContent(error) {
                    options.afterParse(_this);
                    callback(error);
                });
            }
        });
    } else {
        callback(undefined);
    }
}

DependencyPrototype.parse = function(callback) {
    Dependency_parse(this, this, this.chunk.tree.options, callback);
    return this;
};

DependencyPrototype.resolve = function(requiredFrom, options, callback) {
    var _this;

    if (isNull(this.fullPath)) {
        _this = this;

        options.mappings = requiredFrom.mappings;
        resolve(this.path, requiredFrom.fullPath, options, function(error, dependency) {
            if (error) {
                callback(error);
            } else {
                _this.fullPath = dependency.fullPath;
                _this.pkg = dependency.pkg;
                parsePackageMappings(
                    _this,
                    filePath.dirname(_this.fullPath),
                    options.packageType
                );
                if (_this.parent) {
                    mixin(_this.mappings, _this.parent.mappings);
                }
                callback(undefined, _this);
            }
        });
    } else {
        callback(undefined, this);
    }
    return this;
};
