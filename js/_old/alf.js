/**
 * Alf.
 */
(function(document, window, undefined) {
    'use strict';
    var alf, util, dom, event, http, url;
    alf = {};
    alf.util = util = {},
    alf.dom = dom = {},
    alf.event = event = {},
    alf.http = http = {},
    alf.url = url = {};

    /**
     * Extends the dest object with the properties of the src object.
     */
    util.extend = function(dest, src) {
        for (var key in src) {
            if (src.hasOwnProperty(key)) {
                dest[key] = src[key];
            }
        }
        return dest;
    };

    /**
     * Clones an object.
     */
    util.clone = function(obj) {
        return JSON.parse(JSON.stringify(obj));
    };

    /**
     * Truncates the string if it excedes the maxLen without breaking words.
     */
    util.ellipsis = function(str, maxLen) {
        if (!str) return '';
        // Adding ellipsis logically.
        str = str.replace(/[\r\n]/g, ' ');
        if (str.length > maxLen) {
            return str.substring(0, str.substring(0, maxLen-3).lastIndexOf(' ')) + '...';
        } else {
            return str;
        }
    };

    /**
     * Generates GUID.
     * @see http://stackoverflow.com/a/105074/762192
     */
    var _s4 = function() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    };
    util.guid = function() {
        return _s4() + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() + '-' + _s4() +
            _s4() + _s4();
    };

    /**
     * Simple method that executes the test code and calculates the time
     * it took to execute it X number of times.
     */
    util.bench = function(test, X) {
        var x_st, x_et, i=0;
        X = X || 100;
        x_st = new Date();
        for (; i < X; i++) {
            test();
        }
        x_et = new Date();
        return x_et.getTime() - x_st.getTime();
    };

    /**
     * Loads google fonts asynchronously.
     */
    util.loadWebFontAsync = function(fonts) {
        window.WebFontConfig = { google: { families: fonts } };
        (function() {
            var wf = document.createElement('script');
            wf.src = ('https:' === document.location.protocol ? 'https' : 'http') +
                '://ajax.googleapis.com/ajax/libs/webfont/1/webfont.js';
            wf.type = 'text/javascript';
            wf.async = 'true';
            var s = document.getElementsByTagName('script')[0];
            s.parentNode.insertBefore(wf, s);
        })();
    };

    /**
     * Checks if parameter passed is an array.
     */
    util.isArray = function(obj) {
        if (Object.prototype.toString.call(obj) === '[object Array]')
            return true;
        else
            return false;
    };

    /**
     * Creates DOM elements from an HTML string efficiently.
     * From SO (http://stackoverflow.com/questions/494143/creating-a-new-dom-element-from-an-html-string-using-built-in-dom-methods-or-pro)
     */
    dom.parseHTML = function(html, parentEl) {
        var parent = document.createElement(parentEl || 'div');
        parent.innerHTML = html.trim();
        return parent.children;
    };

    /**
     * Checks if element is part of the DOM tree or is an orphan.
     */
    dom.elementInDocument = function(element) {
        if (document.contains) {
            return document.contains(element);
        }
        while (element = element.parentNode) {
            if (element === document) {
                return true;
            }
        }
        return false;
    };

    /**
     * Operate on the siblings of the el.
     */
    dom.siblings = function(el, selector, callback) {
        // Adjust params.
        if (!callback) {
            callback = selector;
            selector = undefined;
        }
        var children = el.parentNode.children,
            len = children.length,
            i, child;
        for (i = 0; i < len; i++) {
            child = children[i];
            if (child !== el) {
                if (selector) {
                    if (alf.dom.matchesSelector(child, selector)) {
                        callback(child);
                    }
                } else {
                    callback(child);
                }
            }
        }
    };

    /**
     * Loop over an array of Elements.
     */
    dom.each = function(els, callback) {
        if (els) {
            var e = 0, len = els.length;
            // Tricksy way to convert a LiveNodeList to static, just in case.
            els = Array.prototype.slice.call(els);
            for (; e < len; e++) {
                callback(els[e]);
            }
        }
    };

    /**
     * Remove all contents of an Element.
     */
    dom.empty = function(el) {
        el.innerHTML = '';
    };

    /**
     * Simple class removal using wildcards.
     */
    dom.removeClass = function(el, expr) {
        if (!el) return;
        expr = expr.replace('*', '\\b[^\\s]*\\b');
        var re = new RegExp(expr, 'g'),
            classes = el.className;
        classes = classes.replace(re, '');
        el.className = classes;
    };

    /**
     * Finds the first parent matching the selector.
     */
    dom.closestParent = function(el, selector) {
        while(el = el.parentNode) {
            if (dom.matchesSelector(el, selector))
                return el;
        }
    };

    /**
     * Tests the selector against the passed Element. If it matches, returns true
     * else false.
     */
    dom._matcher = (function() {
        var el = document.documentElement;
        return el.matches || el.webkitMatchesSelector || el.mozMatchesSelector ||
            el.msMatchesSelector || el.oMatchesSelector;
    })();
    dom.matchesSelector = function(el, selector) {
        return dom._matcher.call(el, selector);
    };

    (function() {
        /**
         * Add dom event listener.
         */
        var listenerWrapperId = 0;
        var listenerCache = {};
        event.on = function(attachTo, type, selector, listener) {
            var listenerWrapper, capture, typeToLower;
            // Adjust params for (attachTo, type, listener) call.
            if (!listener) {
                listener = selector;
                selector = undefined;
            }
            if (selector) {
                listenerWrapper = function(evt) {
                    var target = evt.target;
                    if (dom.matchesSelector(target, selector)) {
                        listener.call(target, evt);
                    // In case the event has originated from a child element of
                    // the actual target, we should ideally catch that as a real event.
                    // So we add the tagName of the current target to the selector
                    // to match.
                    // An easy way to check if this has happened is just check if
                    // the evt.target === target inside the listener.
                    } else if (dom.matchesSelector(target, selector + ' ' + target.tagName)) {
                        listener.call(dom.closestParent(target, selector), evt);
                    }
                };
                listener._listenerWrapperId = ++listenerWrapperId;
                listenerCache[listener._listenerWrapperId] = listenerWrapper;
            } else {
                listenerWrapper = listener;
            }

            typeToLower = type.toLowerCase();
            capture = typeToLower === 'focus' || typeToLower === 'blur' || typeToLower === 'change';
            // Check if nodelist.
            if (!attachTo.tagName && attachTo !== window && attachTo !== document) {
                alf.dom.each(attachTo, function(el) {
                    el.addEventListener(type, listenerWrapper, capture);
                });
            } else {
                attachTo.addEventListener(type, listenerWrapper, capture);
            }
        };

        event.off = function(attachTo, type, listener) {
            var capture = false;
            type = type.toLowerCase();
            if (listener._listenerWrapperId) {
                listener = listenerCache[listener._listenerWrapperId];
            }
            if (type === 'focus' || type === 'blur' || type === 'change') {
                capture = true;
            }
            // Check if nodelist.
            if (!attachTo.tagName && attachTo !== window && attachTo !== document) {
                alf.dom.each(attachTo, function(el) {
                    el.removeEventListener(type, listener, capture);
                });
            } else {
                attachTo.removeEventListener(type, listener, capture);
            }
        };

        /**
         * Checks if only the left button was click without any modifiers.
         */
        event.isOnlyLeftBtnClick = function(evt) {
            return !evt.ctrlKey && !evt.altKey && !evt.shiftKey && evt.button === 0;
        }
    })();

    /**
     * alf Animate. YEAH!!!!
     */
    (function() {
        var animationEnd = (function() {
            var t;
            var el = document.createElement('div');
            var animations = {
              'animation':'animationend',
              'OAnimation':'oAnimationEnd',
              'MozAnimation':'animationend',
              'WebkitAnimation':'webkitAnimationEnd'
            };

            for (t in animations) {
                if (el.style[t] !== undefined) {
                    return animations[t];
                }
            }
        })();
        alf.animate = function(el, className, callback) {
            var options = {}, doAnimation = true, handler;
            if (typeof className !== 'string') {
                options = className;
                className = options.effect;
                doAnimation = options.afterAnimated && !el.dataset.wasAnimated ?
                    false :
                    true;
            }
            if (doAnimation) {
                handler = function(evt) {
                    event.off(el, animationEnd, handler);
                    el.dataset.wasAnimated = true;
                    el.classList.remove(className);
                    if (callback) callback(evt);
                };
                el.classList.add(className);
                event.on(el, animationEnd, handler);
            } else {
                if (callback) callback();
            }
        };
    })();

    /**
     * URL Helper classes.
     */
    (function() {
        /**
         * Builds querystring.
         */
        url.buildQuery = function(params) {
            var str = [];
            for(var p in params) {
                if (params[p])
                    str.push(encodeURIComponent(p) + "=" + encodeURIComponent(params[p]));
            }
            return str.join("&");
        };

        /**
         * Parses a URL.
         */
        url.parseQuery = function(url) {
            var re = /([^&=]+)=?([^&]*)/g,
                match,
                params = {},
                decode = function(s) {
                    return decodeURIComponent(s.replace('+', ' '));
                };
            url = url.substring(url.indexOf('?') + 1);
            while (match = re.exec(url))
               params[decode(match[1])] = decode(match[2]);
           return params;
       };
    })();

(function() {
        // Simple JavaScript Templating
        // John Resig - http://ejohn.org/ - MIT Licensed
        var cache = {};
        alf.template = function(str, data) {
            /* jshint evil: true */
            // Figure out if we're getting a template, or if we need to
            // load the template - and be sure to cache the result.
            try {
                var fn = !/\W/.test(str) ?
                    cache[str] = cache[str] || template(document.getElementById(str).innerHTML) :
                    // Generate a reusable function that will serve as a template
                    // generator (and which will be cached).
                    new Function("obj",
                    "var p=[];" +
                    // Introduce the data as local variables using with() {}
                    "with(obj) {p.push('" +
                    // Convert the template into pure JavaScript
                    str.replace(/[\r\t\n]/g, " ")
                      .split("{{").join("\t")
                      .replace(/((^|}})[^\t]*)'/g, "$1\r")
                      .replace(/\t=(.*?)}}/g, "',$1,'")
                      .split("\t").join("');")
                      .split("}}").join("p.push('")
                      .split("\r").join("\\'")
                    + "');}return p.join('');");
                // Provide some basic currying to the user
                return data ? fn( data ) : fn;
            }
            catch(e) {
                throw new Error('Error while processing template, check template format and try again.');
            }
        };
    })();

    /**
     * Javascript inheritance.
     * (http://ejohn.org/blog/simple-javascript-inheritance/)
     * MIT Licensed.
     */
    (function() {
        var initializing = false,
            fnTest = (/xyz/.test(function() {xyz;})) ? /\b_super\b/ : /.*/;

        // The base Class implementation (does nothing)
        alf.Class = function() {};
        // Classes array to debug.
        //alf.ClassInstances = [];

        /**
         * Create a new Class that inherits from this class
         * @param  {String} _id  Used to identify the class.
         * @param  {Object} prop Properties to be added to the class.
         * @return New class.
         */
        alf.Class.extend = function(_id, prop) {
            var _super = this.prototype;

            if (_id === undefined ||
                typeof _id !== 'string')
                throw new Error('Cannot instantiate class without _id.');
            prop._id = _id;
            // Instantiate a base class (but only create the instance,
            // don't run the init constructor)
            initializing = true;
            var prototype = new this();
            initializing = false;

            // Copy the properties over onto the new prototype
            for (var name in prop) {
                // Check if we're overwriting an existing function
                prototype[name] = typeof prop[name] === 'function' &&
                    typeof _super[name] === 'function' &&
                    fnTest.test(prop[name]) ?
                        (function(name, fn) {
                            return function() {
                                var tmp = this._super;
                                // Add a new ._super() method that is the same method
                                // but on the super-class
                                this._super = _super[name];
                                // The method only need to be bound temporarily, so we
                                // remove it when we're done executing
                                var ret = fn.apply(this, arguments);
                                this._super = tmp;
                                return ret;
                            };
                        })(name, prop[name]) :
                        prop[name];
            }

            // The dummy class constructor
            var alfObj = function(options) {
                if (this.defaults)
                    util.extend(this, this.defaults);
                util.extend(this, options);
                // All construction is actually done in the init method
                if (!initializing && this.init)
                    this.init.apply(this, [options]);
                //for debug uncomment
                //alf.ClassInstances.push(this);
            };

            // Populate our constructed prototype object
            alfObj.prototype = prototype;

            // Enforce the constructor to be what we expect
            alfObj.prototype.constructor = alfObj;

            // And make this class extendable
            alfObj.extend = alf.Class.extend;
            return alfObj;
        };
    })();

    /**
     * View Class.
     */
    alf.View = alf.Class.extend('znV', {
        // If set to true, requires event handlers to call release() when event
        // is complete.
        blockRapidEvents: false,

        // Checks if its a valid view and does the event subscriptions call.
        init: function() {
            if (this.el === undefined)
                throw new Error(this._id + ' View: DOM Element not specified.');
            // If events exist, do the subs.
            if (this.events !== undefined)
                this._doEventSubs();
        },

        // Destroys stuff. ANNIHILATION!!!
        destroy: function() {
            if (this.events !== undefined)
                this._undoEventSubs();
        },

        /**
         * Does the event substitutions.
         */
        _doEventSubs: function() {
            var eventEl, that = this;
            // If eventEl is specified use it to attach events. If not fall back
            // to widget El.
            that.eventEl = that.eventEl || that.el;

            this.eventCallbackWrappers = {};
            for (var key in this.events) {
                var eventInProgress = false;
                // IIFE for maintaining closure during event callback.
                (function(key) {
                    // Event key format is event_type:selector
                    var eventSelect = key.split(':');
                    // Get callback from context.
                    var callback = that[that.events[key]];
                    if (!callback)
                        throw new Error(that._id + ': Could not find callback ' + that.events[key] +
                            ' for ' + key);

                    that.eventCallbackWrappers[eventSelect[0] + eventSelect[1]] =
                        function(evt) {
                        // Process event only if no other event is in progress.
                        // Used in conjunction with blockRapidEvents.
                        if (!eventInProgress) {
                            if (that.blockRapidEvents) {
                                eventInProgress = true;
                                setTimeout(function() {
                                    eventInProgress = false;
                                }, 5000);
                            }

                            try {
                                var retVal = callback.call(that, this, evt, function() {
                                    eventInProgress = false;
                                });
                            } catch(e) {
                                console.error(key + ' -', e.message);
                            }
                            // If callback returns something, we assume they know
                            // what they are doing.
                            if (retVal !== undefined) {
                                return retVal;
                            // Else, we stop event right here.
                            } else {
                                evt.preventDefault();
                                evt.stopPropagation();
                            }
                        }
                        return false;
                    };

                    // Delegate events to eventEl.
                    event.on(that.eventEl, eventSelect[0], eventSelect[1],
                        that.eventCallbackWrappers[eventSelect[0] + eventSelect[1]]);
                })(key);
            }
        },

        /**
         * Undoes the event substitutions.
         */
        _undoEventSubs: function() {
            var that = this;
            for (var key in this.events) {
                // Event key format is event_type:selector
                var eventSelect = key.split(':');
                // Delegate events to eventEl.
                event.off(that.eventEl, eventSelect[0],
                    that.eventCallbackWrappers[eventSelect[0] + eventSelect[1]]);
            }
        }
    });

    /**
     * Live value nodes with 2 way data binding.
     */
    (function() {
        var LiveDataProps = function() {},
            formTags = ['INPUT', 'TEXTAREA', 'SELECT'],
            createGetterSetter = function(el, prop) {
                var that = this;
                // Special case to account for bootstrap radio toggles.
                var accessor;
                // For form fields, use value.
                if (formTags.indexOf(el.tagName) >= 0) accessor = 'value';
                // For all else use innerHtml.
                else accessor = 'innerHTML';

                return {
                    get: function() {
                        return that.els[prop][accessor];
                    },
                    set: function(val) {
                        that.els[prop][accessor] = val;
                    }
                };
            };

        LiveDataProps.prototype.add = function(prop) {
            var that = this,
                el = this.elCont.querySelector('[data-prop="' + prop + '"]');
            this.els[prop] = el;
            Object.defineProperty(this, prop, createGetterSetter.call(this, el, prop));
        };

        alf.LiveDataProps = function(elCont) {
            var that = this,
                elDataProps = elCont.querySelectorAll('[data-prop]'),
                ldp;

            if (elDataProps.length > 0) {
                ldp = new LiveDataProps();
                ldp.elCont = elCont;
                ldp.els = {};
                dom.each(elDataProps, function(el) {
                    var prop = el.dataset.prop;
                    ldp.els[prop] = el;

                    Object.defineProperty(ldp, prop, createGetterSetter.call(ldp, el, prop));
                });
                return ldp;
            } else {
                throw new Error('No data props bound.');
            }
        };
    })();


    /**
     * Simple Pub / Sub Implementation.
     * Inspired by work from Peter Higgins
     * (https://github.com/phiggins42/bloody-jquery-plugins/blob/master/pubsub.js)
     */
    (function() {
        var topics = {};
        /**
         * Publish an event.
         * @param topic - Event/topic to be published.
         * @param args - Arguments to be passed to the subscribers.
         */
        alf.publish = function(topic, args) {
            if (topics[topic]) {
                var thisTopic = topics[topic],
                    thisArgs = args || [],
                    callOrApply = util.isArray(thisArgs) ? 'apply' : 'call';
                for (var i = thisTopic.length - 1; i >= 0; i--) {
                    thisTopic[i].callback[callOrApply](thisTopic[i].context, thisArgs);
                }
            }
        };
        /**
         * Subscribe to an event.
         * @param topic - Event/topic to be subscribed to.
         * @param callback - Function to subscribe to the topic/event.
         */
        var pubSubGuid = 0;
        alf.subscribe = function(topic, context, callback) {
            // Shift params.
            if (callback === undefined) {
                callback = context;
                context = alf;
            }
            callback.guid = pubSubGuid++;

            if (!topics[topic]) {
                topics[topic] = [];
            }
            topics[topic].push({
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
        alf.unsubscribe = function(handle) {
            var topic = handle.topic;
            if (topics[topic]) {
                var thisTopic = topics[topic];
                for (var i = 0; i < thisTopic.length; i++) {
                    if (thisTopic[i].callback === handle.callback) {
                        thisTopic.splice(i, 1);
                    }
                }
            }
        };
    })();

    // Make it available globally, for console experimentation purposes.
    window.alf = alf;
    // Make AMD compatible.
    if (typeof define === 'function' && define.amd)
        define(function() { return alf; });
})(document, window);