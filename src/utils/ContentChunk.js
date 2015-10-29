var has = require("has");


module.exports = ContentChunk;


function ContentChunk(path) {
    this.path = path;
    this.content = "";
    this.sub = null;
}

ContentChunk.prototype.merge = function(chunk) {
    var localHas, thisSub, chunkSub, path;

    if (chunk && this.path === chunk.path) {
        this.content += chunk.content;

        localHas = has;
        thisSub = this.sub;
        chunkSub = chunk.sub;

        for (path in chunkSub) {
            if (localHas(chunkSub, path)) {
                thisSub = thisSub || (this.sub = {});

                if (thisSub[path]) {
                    thisSub[path].merge(chunkSub[path]);
                } else {
                    thisSub[path] = chunkSub[path];
                }
            }
        }
    }

    return this;
};
