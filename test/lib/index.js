var a = require("./a"),
    log;


require.async("./ab", function(ab) {
    var abc = require("./abc");

    if (ab() === "ab") {
        log(abc());
    }
});


log = require("./log");
log(a());
