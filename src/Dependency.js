var fs = require("fs"),
    has = require("has"),
    keys = require("keys"),
    isNull = require("is_null"),
    arrayForEach = require("array-for_each"),
    resolve = require("resolve"),
    reComment = require("./utils/reComment"),
    isNodeModule = require("./utils/isNodeModule"),
    parseChunk = require("./utils/parseChunk");


var DependencyPrototype;


module.exports = Dependency;


function Dependency() {

    this.index = null;
    this.content = null;

    this.path = null;
    this.fullPath = null;
    this.pkg = null;

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
            Dependency_parse(child, options, next);
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
                            Dependency_parseContent(dependency, subChunks[path], parent, options, next);
                        } else {
                            dependency.chunk = subChunk;
                            subChunk.addDependency(dependency);
                            Dependency_parseContent(dependency, subChunks[path], parent, options, next);
                        }
                    }
                });
            } else {
                next();
            }
        }
    }());
}

function Dependency_parseContent(_this, parsedChunk, requiredFrom, options, callback) {
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
            arrayForEach(children, function forEachDependency(dependency) {
                if (tree.hasDependency(dependency.fullPath)) {
                    dependency = tree.getDependency(dependency.fullPath);
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

function Dependency_parse(_this, options, callback) {
    fs.readFile(_this.fullPath, function onReadFile(error, buffer) {
        if (error) {
            callback(error);
        } else {
            _this.content = buffer.toString();

            options.beforeParse(_this);
            Dependency_parseContent(
                _this,
                parseChunk(_this.path, _this.content.replace(reComment, ""), options.reInclude, options.parseAsync),
                _this,
                options,
                function onParseContent(error) {
                    options.afterParse(_this);
                    callback(error);
                }
            );
        }
    });
}

DependencyPrototype.parse = function(callback) {
    var options;

    if (isNull(this.content)) {
        options = this.chunk.tree.options;
        Dependency_parse(this, options, callback);
    } else {
        callback(undefined);
    }
    return this;
};

DependencyPrototype.resolve = function(requiredFrom, options, callback) {
    var _this;

    if (isNull(this.fullPath)) {
        _this = this;

        resolve(this.path, requiredFrom.fullPath, options, function(error, dependency) {
            if (error) {
                callback(error);
            } else {
                _this.fullPath = dependency.fullPath;
                _this.pkg = dependency.pkg;
                callback(undefined, _this);
            }
        });
    } else {
        callback(undefined, this);
    }
    return this;
};
