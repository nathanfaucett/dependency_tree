module.exports = isNodeModule;


function isNodeModule(path) {
    var ch = path.charAt(0);
    return ch !== "." && ch !== "/";
}
