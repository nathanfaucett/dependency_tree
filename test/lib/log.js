module.exports = log;


function log() {
    console.log.apply(console, arguments);
}
