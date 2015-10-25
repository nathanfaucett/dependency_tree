var isArray = require("is_array");


module.exports = createIncludeRegExp;


function createIncludeRegExp(functionNames, useBraces) {
    var functionName = isArray(functionNames) ? functionNames.join("|") : functionNames;

    if (useBraces) {
        return new RegExp(
            "(" + functionName + ")(?:\\.([a-zA-Z_$]+))?\\s*\\(\\s*[\"']([^'\"\\s]+)[\"']\\s*[\\,\\)]", "g"
        );
    } else {
        return new RegExp(
            "(" + functionName + ")(?:\\.([a-zA-Z_$]+))?\\s*[\"']([^'\"\\s]+)[\"']\\s*[\\;\\n]", "g"
        );
    }
}
