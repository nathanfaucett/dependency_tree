var filePath = require("file_path");


module.exports = getDependencyId;


function getDependencyId(dependency, dependencyModule) {
    if (dependencyModule.pkgFullPath && (dependencyModule.pkg && dependencyModule.pkg.name)) {
        return filePath.join(
            dependencyModule.pkg.name,
            filePath.relative(filePath.dirname(dependencyModule.pkgFullPath), dependency.fullPath)
        );
    } else {
        return dependency.fullPath;
    }
}
