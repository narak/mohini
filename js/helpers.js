/**
 * @see http://stackoverflow.com/questions/384286/javascript-isdom-how-do-you-check-if-a-javascript-object-is-a-dom-object
 */
function isNode(o){
    return (
        typeof Node === "object" ? o instanceof Node :
        o && typeof o === "object" && typeof o.nodeType === "number" && typeof o.nodeName==="string"
    );
}
function isElement(o){
    return (
        typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
        o && typeof o === "object" && o !== null && o.nodeType === 1 && typeof o.nodeName==="string"
    );
}

// Add fn to d3.
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

function each(arr, cb) {
    for (var key in arr) {
        if (arr.hasOwnProperty(key)) cb(arr[key]);
    }
}

function extend(obj) {
    each(Array.prototype.slice.call(arguments, 1), function(source) {
        if (source) {
            for (var prop in source) {
                obj[prop] = source[prop];
            }
        }
    });
    return obj;
};

function compose() {
    var args = arguments,
        self = this;
    return function() {
        each(args, function(arg) {
            if (typeof arg === 'function') {
                arg.call(self, arguments);
            }
        });
    };
}

function createSVGElement(element) {
    return document.createElementNS('http://www.w3.org/2000/svg', element);
}

// Because d3 doesn't do event delagation... dafaq.
var matchesSelector = (function() {
    var el = document.documentElement,
        _matcher = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector ||
            el.msMatchesSelector || el.oMatchesSelector;

    return function(el, selector) {
        return _matcher.call(el, selector);
    };
})();

// UUID.
var generateUUID = (function() {
    var id = 0;
    return function(prefix) {
        prefix = prefix || 'uuid';
        return prefix + '-' + id++;
    };
})();

/**
 * Simple Pub / Sub Implementation.
 * Inspired by work from Peter Higgins
 * (https://github.com/phiggins42/bloody-jquery-plugins/blob/master/pubsub.js)
 */
function PubSub() {
    this._listeners = {};
    return this;
}
(function() {
    /**
     * Publish an event.
     * @param event - Event to be published.
     * @param args - Arguments to be passed to the subscribers.
     */
    PubSub.prototype.trigger = function(event, args) {
        if (this._listeners[event]) {
            var listeners = this._listeners[event],
                params;

            if (args) {
                // If args is not an array, we assume that it trigger was called
                // like trigger(<event>, arg1, arg2, ...) instead of
                // trigger(<event>, [arg1, arg2, ...]). So convert all but the
                // first argument into an array so it can be `apply`ed to the
                // callback.
                if (!(args instanceof Array)) {
                    params = Array.prototype.slice.call(arguments, 1);
                }
            }

            window.setTimeout(function() {
                each(listeners, function(listener) {
                    listener.callback.apply(listener.context, params);
                });
            }, 0);
        }
    };
    /**
     * Subscribe to an event.
     * @param event - Event/event to be subscribed to.
     * @param callback - Function to subscribe to the event/event.
     */
    var defaultNS = function(event) {
        return event + '_DEFAULT';
    };
    PubSub.prototype.on = function(eventNNS, callback, context) {
        context = context || this;

        // So null can be used to detach events.
        if (!callback) {
            this.off(eventNNS);
            return;
        }

        // Split event.namespace.
        eventNNS = eventNNS.split('.');
        var event = eventNNS[0],
            namespace = eventNNS[1] || defaultNS();

        if (!this._listeners[event]) {
            this._listeners[event] = {};
        }
        this._listeners[event][namespace] = {
            context: context,
            callback: callback
        };
    };
    /**
     * Unsubscribe from an event.
     * @param eventNNS - Event.namespace to be unsubscribed.
     */
    PubSub.prototype.off = function(eventNNS) {
        // Split event.namespace.
        eventNNS = eventNNS.split('.');
        var event = eventNNS[0],
            namespace = eventNNS[1] || defaultNS();

        if (this._listeners[event] && this._listeners[event][namespace]) {
            delete this._listeners[event][namespace];
        }
    };
})();
