(function () {
    var script = '';
    if (navigator.userAgent.match(/(iPhone|iPod|iPad)/)) {
        script = 'cordova-ios-2.2.0.js';
    } else if (navigator.userAgent.match(/Android/)) {
        script = 'cordova-android-2.2.0.js';
    } else {
        alert("Unknown platform - userAgent is: " + navigator.userAgent);
        return false;
    }
    if ( typeof Zepto !== 'undefined' ) {
        /* we need to fetch and eval the script immediately otherwise it's not
         * ready when the JS->native bridge tries to do things. This idea mostly
         * stolen from the way jQuery handles appending elements with script
         * parts */
        $.ajax({
            url: script,
            dataType: 'text',
            global: false,
            async: false,
            success: function (data) {
                // indirect call to eval so it gets evaluated in a global scope
                var indirect = eval;
                if ( $.trim(data) ) {
                    indirect( data + ';' );
                }
            }
        });
    } else if ( typeof jQuery !== 'undefined' ) {
        var scriptElement = document.createElement("script");
        scriptElement.src = script;
        scriptElement.type = "text/javascript";
        $('head').prepend(scriptElement);
    } else {
        alert( 'Either jQuery or Zepto required' );
    }
})();
