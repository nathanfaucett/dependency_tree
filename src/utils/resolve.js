var fs = require("fs"),
    isNull = require("is_null"),
    isArray = require("is_array"),
    isString = require("is_string"),
    filePath = require("file_path"),
    isNodeModule = require("./isNodeModule");


module.exports = resolve;


function resolve(dependency, requiredFrom, options, callback) {
    if (isNodeModule(dependency.path)) {
        resolveNodeModule(dependency, requiredFrom, options, callback);
    } else {
        resolveModule(dependency, requiredFrom, options, callback);
    }
}

function resolveNodeModule(dependency, requiredFrom, options, callback) {
    callback(new Error("Node modules not supported"));
}

function resolveModule(dependency, requiredFrom, options, callback) {
    var path = dependency.path,
        requiredFromDirname = filePath.dirname(requiredFrom.fullPath),
        exts = options.extensions,
        fullPath = filePath.isAbsolute(path) ? path : filePath.join(requiredFromDirname, path);

    fs.stat(fullPath, function(error, stat) {
        var tmpFullPath, pkg;

        if (stat && stat.isDirectory()) {
            tmpFullPath = findExt(filePath.join(fullPath, "index"), exts);

            if (tmpFullPath) {
                dependency.fullPath = tmpFullPath;
                callback(undefined, dependency);
            } else if ((tmpFullPath = findExt(fullPath, exts))) {
                dependency.fullPath = tmpFullPath;
                callback(undefined, dependency);
            } else {
                pkg = findPackageJSON(fullPath);

                if (isNull(pkg)) {
                    callback(createError(path, requiredFrom.fullPath));
                } else {
                    tmpFullPath = findExt(filePath.join(fullPath, getPackagePath(pkg, options.packageType)), exts);

                    if (tmpFullPath) {
                        dependency.fullPath = tmpFullPath;
                        dependency.pkg = pkg;
                        callback(undefined, dependency);
                    } else {
                        callback(createError(path, requiredFrom.fullPath));
                    }
                }
            }
        } else {
            fullPath = findExt(fullPath, exts);

            if (fullPath) {
                dependency.fullPath = fullPath;
                callback(undefined, dependency);
            } else {
                callback(createError(path, requiredFrom.fullPath));
            }
        }
    });
}

function createError(path, requiredFromFullPath) {
    return new Error("failed to find file " + path + " required from " + requiredFromFullPath);
}

function readFile(path) {
    return fs.readFileSync(path).toString("utf-8");
}

function readJSONFile(path) {
    return JSON.parse(readFile(path));
}

function findPackageJSON(dirname) {
    var tmp = filePath.join(dirname, "package.json"),
        pkg;

    if (fs.existsSync(tmp)) {
        try {
            pkg = readJSONFile(tmp);
        } catch (e) {
            return null;
        }

        return pkg;
    } else {
        return null;
    }
}

function hasExt(path, exts) {
    var str;

    if (isArray(exts)) {
        str = exts.join("|");
    } else {
        str = exts + "";
    }

    return (new RegExp("\\.(" + str + ")$")).test(path);
}

function baseFindExt(path, exts) {
    var i = -1,
        il = exts.length - 1,
        tmp;

    while (i++ < il) {
        tmp = path + "." + exts[i];

        if (fs.existsSync(tmp)) {
            return tmp;
        }
    }
    return false;
}

function findExt(path, exts) {
    return hasExt(path, exts) ? path : baseFindExt(path, exts);
}

function getPackagePath(pkg, type) {
    return (
        isString(pkg[type]) ? pkg[type] : (
            isString(pkg.main) ? pkg.main : "index"
        )
    );
}
