module.exports = ContentChunk;


function ContentChunk(path) {
    this.path = path;
    this.content = "";
    this.sub = {};
}
