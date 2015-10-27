var has = require("has"),
    isString = require("is_string"),
    filePath = require("file_path");


module.exports = parsePackageMappings;


function parsePackageMappings(dependency, dirname, type) {
    var localHas = has,
        pkg = dependency.pkg,
        mappings = pkg && pkg[type],
        out = dependency.mappings,
        key, value;

    if (mappings) {
        for (key in mappings) {
            if (localHas(mappings, key)) {
                value = mappings[key];

                if (isString(value)) {
                    out[key] = filePath.join(dirname, value);
                }
            }
        }
    }
}
