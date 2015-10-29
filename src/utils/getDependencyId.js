var filePath = require("file_path");


module.exports = getDependencyId;


function getDependencyId(dependency, dependencyModule) {
    var pkg = dependencyModule.pkg;

    if (dependencyModule.pkgFullPath && (pkg && pkg.name)) {
        return filePath.join(
            pkg.name + (pkg.version ? "@" + pkg.version : ""),
            filePath.relative(filePath.dirname(dependencyModule.pkgFullPath), dependency.fullPath)
        );
    } else {
        return dependency.fullPath;
    }
}
