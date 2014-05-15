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
    this._topics = {};
    return this;
}
(function() {
    /**
     * Publish an event.
     * @param topic - Event/topic to be published.
     * @param args - Arguments to be passed to the subscribers.
     */
    PubSub.prototype.trigger = function(topic, args) {
        if (this._topics[topic]) {
            var thisTopic = this._topics[topic],
                thisArgs = args || [];

            if (!(thisArgs instanceof Array)) {
                thisArgs = Array.prototype.slice.call(arguments, 1);
            }

            for (var i = thisTopic.length - 1; i >= 0; i--) {
                thisTopic[i].callback.apply(thisTopic[i].context, thisArgs);
            }
        }
    };
    /**
     * Subscribe to an event.
     * @param topic - Event/topic to be subscribed to.
     * @param callback - Function to subscribe to the topic/event.
     */
    var pubSubGuid = 0;
    PubSub.prototype.on = function(topic, context, callback) {
        // Shift params.
        if (callback === undefined) {
            callback = context;
            context = this;
        }
        callback.guid = pubSubGuid++;

        if (!this._topics[topic]) {
            this._topics[topic] = [];
        }
        this._topics[topic].push({
            context: context,
            callback: callback
        });
        return {
            topic: topic,
            callback: callback
        };
    };
    /**
     * Unsubscribe from an event.
     * @param handle - Handle for the subscription to be removed, returned
     *                 by subscribe.
     */
    PubSub.prototype.off = function(handle) {
        var topic = handle.topic;
        if (this._topics[topic]) {
            var thisTopic = this._topics[topic];
            for (var i = 0; i < thisTopic.length; i++) {
                if (thisTopic[i].callback === handle.callback) {
                    thisTopic.splice(i, 1);
                }
            }
        }
    };
})();