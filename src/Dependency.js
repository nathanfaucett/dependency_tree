var fs = require("fs"),
    has = require("has"),
    keys = require("keys"),
    isNull = require("is_null"),
    filePath = require("file_path"),
    arrayForEach = require("array-for_each"),
    isNodeModule = require("./utils/isNodeModule"),
    parseChunk = require("./utils/parseChunk");


var DependencyPrototype;


module.exports = Dependency;


function Dependency() {

    this.index = null;
    this.content = null;

    this.path = null;
    this.fullPath = null;

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

function resolveChildren(children, callback) {
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
            children[index++].resolve(next);
        }
    }());
}

function parseChildren(children, callback) {
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
            children[index++].parse(next);
        }
    }());
}

function parseSubChunks(parent, tree, subChunks, callback) {
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
                Dependency.create(null, path, parent).resolve(function onResolve(error, dependency) {
                    var children, subChunk;

                    if (error) {
                        next(error);
                    } else {
                        children = dependency.children;
                        subChunk = tree.createOrGetChunk(path, dependency.fullPath);

                        if (tree.hasDependency(dependency.fullPath)) {
                            children[children.length] = tree.getDependency(dependency.fullPath);
                        } else {
                            dependency.chunk = subChunk;
                            subChunk.addDependency(dependency);
                            dependency.parse(function onParse(error) {
                                if (error) {
                                    next(error);
                                } else {
                                    Dependency_parseChunkedContent(dependency, subChunks[path], next);
                                }
                            });
                        }
                    }
                });
            } else {
                next();
            }
        }
    }());
}

function Dependency_parseChunkedContent(_this, parsedChunk, callback) {
    var chunk = _this.chunk,
        tree = chunk.tree,
        options = tree.options,
        children = _this.children;

    parsedChunk.content.replace(options.reInclude, function(match, include, fn, path) {
        children[children.length] = Dependency.create(chunk, path, _this);
    });

    resolveChildren(children, function onResolveChildren(error) {
        if (error) {
            callback(error);
        } else {
            arrayForEach(children, function forEachDependency(dependency) {
                if (tree.hasDependency(dependency.fullPath)) {
                    dependency = tree.getDependency(dependency.fullPath);
                } else {
                    chunk.addDependency(dependency);
                }
            });

            parseChildren(children, function onParseChildren(error) {
                if (error) {
                    callback(error);
                } else {
                    parseSubChunks(_this, tree, parsedChunk.sub, callback);
                }
            });
        }
    });

    return _this;
}

function Dependency_parse(_this, callback) {
    var options = _this.chunk.tree.options;

    options.beforeParse(_this);
    Dependency_parseChunkedContent(_this, parseChunk(_this.path, _this.content, options.reInclude, options.parseAsync), callback);
    options.afterParse(_this);

    return _this;
}

DependencyPrototype.parse = function(callback) {
    var _this = this;

    fs.readFile(this.fullPath, function(error, buffer) {
        if (error) {
            callback(error);
        } else {
            _this.content = buffer.toString();
            Dependency_parse(_this, callback);
        }
    });

    return this;
};

DependencyPrototype.resolve = function(callback) {
    if (isNodeModule(this.path)) {
        Dependency_resolveNodeModule(this, callback);
    } else {
        Dependency_resolve(this, callback);
    }
};

function Dependency_resolveNodeModule(_this, callback) {
    callback(new Error("node modules not supported yet."));
}

function Dependency_resolve(_this, callback) {
    var parent = _this.parent,
        parentDirname = filePath.dirname(parent.fullPath),
        fullPath = filePath.join(parentDirname, _this.path) + ".js";

    fs.stat(fullPath, function(error) {
        if (error) {
            callback(error);
        } else {
            _this.fullPath = fullPath;
            callback(undefined, _this);
        }
    });
}
