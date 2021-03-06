var ContentChunk = require("./ContentChunk");


module.exports = parseChunk;


function parseChunk(path, string, reInclude, parseAsync) {
    var chunk = new ContentChunk(path);

    if (parseAsync) {
        parseAsyncChunk(chunk, path, string, reInclude);
    } else {
        chunk.content = string;
    }

    return chunk;
}

function parseAsyncChunk(chunk, path, string, reInclude) {
    var array = [],
        start = 0,
        end = 0,
        subChunks = null;

    string.replace(reInclude, function onReplace(match, include, fn, path, index) {
        var start, end, subChunk;

        if (fn === "async") {
            subChunk = new ContentChunk(path);

            start = index + match.length;
            end = getLastIndexOf(string, index);

            array[array.length] = index;
            array[array.length] = end;

            parseAsyncChunk(subChunk, path, string.substring(start, end), reInclude);
            subChunks = subChunks || (chunk.sub = {});

            if (subChunks[path]) {
                subChunks[path].merge(subChunk);
            } else {
                subChunks[path] = subChunk;
            }
        }
    });

    i = 0;
    il = array.length;

    if (il !== 0) {
        while (i < il) {
            end = array[i];
            chunk.content += string.substring(start, end);

            start = array[i + 1];
            if (i + 2 < il) {
                end = array[i + 2];
                chunk.content += string.substring(start, end);
            } else {
                chunk.content += string.substring(start, string.length);
            }
            i += 2;
        }
    } else {
        chunk.content = string;
    }
}

function getLastIndexOf(string, index) {
    var length = string.length,
        foundFirst = false,
        brackets = 0;

    while (index < length) {
        ch = string.charAt(index++);

        if (ch === "{") {
            if (foundFirst === false) {
                foundFirst = true;
            }
            brackets++;
        } else if (ch === "}") {
            brackets--;
        }

        if (foundFirst && brackets === 0) {
            break;
        }
    }

    return index;
}
