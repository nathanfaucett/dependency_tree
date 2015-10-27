var a = require("./a"),
    log;


require.async("./ab", function(ab) {
    var abc = require("./abc");

    if (ab() === "ab") {
        log(abc());
    }
});

process.nextTick(function() {
    log(a());
});

log = require("./log");
log(a());
