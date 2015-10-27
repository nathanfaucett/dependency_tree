module.exports = getDependencyId;


function getDependencyId(dependency, isNodeModule) {
    var pkg = dependency.pkg;
    return (isNodeModule || dependency.isNodeModule) && pkg ? pkg.name : dependency.fullPath;
}
