/*! matchMedia() polyfill - Test a CSS media type/query in JS. Authors & copyright (c) 2012: Scott Jehl, Paul Irish, Nicholas Zakas, David Knight. Dual MIT/BSD license */

window.matchMedia || (window.matchMedia = function() {
    "use strict";

    // For browsers that support matchMedium api such as IE 9 and webkit
    var styleMedia = (window.styleMedia || window.media);

    // For those that don't support matchMedium
    if (!styleMedia) {
        var style       = document.createElement('style'),
            script      = document.getElementsByTagName('script')[0],
            info        = null;

        style.type  = 'text/css';
        style.id    = 'matchmediajs-test';

        script.parentNode.insertBefore(style, script);

        // 'style.currentStyle' is used by IE <= 8 and 'window.getComputedStyle' for all other browsers
        info = ('getComputedStyle' in window) && window.getComputedStyle(style, null) || style.currentStyle;

        styleMedia = {
            matchMedium: function(media) {
                var text = '@media ' + media + '{ #matchmediajs-test { width: 1px; } }';

                // 'style.styleSheet' is used by IE <= 8 and 'style.textContent' for all other browsers
                if (style.styleSheet) {
                    style.styleSheet.cssText = text;
                } else {
                    style.textContent = text;
                }

                // Test if media query is true or false
                return info.width === '1px';
            }
        };
    }

    return function(media) {
        return {
            matches: styleMedia.matchMedium(media || 'all'),
            media: media || 'all'
        };
    };
}());

(function() {
    "use strict";

    if(window.matchMedia && window.matchMedia('all') === null) {
        // this is FF < 36 in a hidden iframe - fake calls until we get displayed
        var realMatchMedia = window.matchMedia;
        var log = function() { if(window.console && console.log){ console.log.apply(console, arguments);    }};
        var listeners = {};
        var handleResize = function handleResize() {
            if(realMatchMedia('all') === null) {
                return;
            }
            // ok, we're visible again, call and move the listeners we've cached over to the real thing
            log('got a non-null return from the browser matchMedia call - copying listeners over');
            var toRemove = [];
            var i;
            var removeHandler = true;
            for(var key in listeners) {
                var r = realMatchMedia(key);
                if(r !== null) {
                    for(i=0; i<listeners[key].length; i++) {
                        r.addListener(listeners[key][i]);
                        log('delegated for ' + key + ' to', listeners[key][i]);
                        listeners[key][i].call(window, r);
                    }
                    toRemove.push(key);
                } else {
                    removeHandler = false;
                }
            }
            for(i=0; i<toRemove.length; i++) {
                delete listeners[toRemove[i]];
            }

            if(removeHandler && isHandlingResize){
                window.removeEventListener('resize', handleResize, true);
                isHandlingResize = false;
                log('disabled resize handler');
            }
        };
        var isHandlingResize = false;

        window.matchMedia = function(media) {
            var r = realMatchMedia(media);
            if(r !== null) {
                return r;
            }
            log('faking matchMedia for ' + media);

            // ok, now our fix comes in...
            r = { matches: false };
            r.addListener = function(callback) {
                if(!isHandlingResize){
                    window.addEventListener('resize', handleResize, true);
                    isHandlingResize = true;
                    log('enabled resize handler');
                }

                listeners[media] = listeners[media] || [];
                listeners[media].push(callback);
            };
            r.removeListener = function(callback) {
                listeners[media] = listeners[media] || [];
                for(var i=listeners[media].length-1; i>=0; i--) {
                    if(listeners[media][i] === callback) {
                        listeners[media].splice(i, 1);
                    }
                }
            }
            return r;
        };
    }
})();

