/**
 * MohiniConnectorFactory
 */
var MohiniConnectorFactory = (function() {
    var body = d3.select(document.body);

    var defsContainer = body.append('svg')
        .attr('width', 0)
        .attr('height', 0)
        .append("defs");

    defsContainer.append("marker")
        .attr("id", "markerEnd")
        .attr("refX", 2)
        .attr("refY", 1.5)
        .attr("markerWidth", 3)
        .attr("markerHeight", 3)
        .attr("orient", "auto")
        .append("path")
            .attr("d", "M 0,0 V 3 L3,1.5 Z");

    // defsContainer.append("marker")
    //     .attr("id", "markerMid")
    //     .attr("refX", 10)
    //     .attr("refY", 10)
    //     .attr("markerWidth", 7)
    //     .attr("markerHeight", 7)
    //     .attr("orient", "auto")
    //     .attr("markerUnits", "strokeWidth")
    //     .style({
    //         'stroke': 'none',
    //         'fill': '#000000'
    //     })
    //     .append("circle")
    //         .attr("cx", 10)
    //         .attr('cy', 10)
    //         .attr('r', 10);

    defsContainer.append("marker")
        .attr("id", "markerStart")
        .attr("refX", 2.5)
        .attr("refY", 1.5)
        .attr("markerWidth", 7)
        .attr("markerHeight", 7)
        .attr("orient", "auto")
        .style({
            'stroke': 'none',
            'fill': '#000000'
        })
        .append("circle")
            .attr("cx", 1.5)
            .attr('cy', 1.5)
            .attr('r', 1.5);

    var lineEqn = function lineEqn(x, y, m, c) {
        if (!y) {
            return m * x + c;
        }
        if (!x) {
            return (y - c) / m;
        }
        if (!m) {
            return (y - c) / x;
        }
        if (!c) {
            return y - m * x;
        }
    }

    function MohiniConnectorFactory(mohini) {
        if (!(this instanceof MohiniConnectorFactory)) {
            throw new Error('Wrong usage of factory. Use `new MohiniConnectorFactory()`.');
        }

        var factory = this;
        factory.container = mohini.container.append('g');
        factory.connectors = {};

        var Connector = function Connector() {
            if (!(this instanceof Connector)) {
                throw new Error('Wrong usage of factory. Use `new Connector()`.');
            }
            var uuid = generateUUID('conn'),
                self = this;

            factory.connectors[uuid] = self;

            self.uuid = uuid;
            self._diagonal = d3.svg.diagonal()
                .projection(function(d) { return [d.y, d.x]; });

            // Start connector.
            self.el = factory.container.append('path')
                .attr('class', 'connector')
                .attr('uuid', uuid)
                .attr("marker-start", "url(#markerStart)")
                //.attr("marker-mid", "url(#markerMid)")
                .attr("marker-end", "url(#markerEnd)");

            return self;
        }

        Connector.prototype.startsAt = function(opts) {
            return this.updateAt.call(this, 'startsAt', 'source', opts);
        };

        Connector.prototype.endsAt = function(opts) {
            return this.updateAt.call(this, 'endsAt', 'target', opts);
        };

        Connector.prototype.updateAt = function(at, diagProp, opts) {
            opts = opts || {};

            var coords,
                thisProp = '_' + at;

            this[thisProp] = this[thisProp] || {};

            if (opts.component) {
                this[thisProp].component = opts.component;
                coords = this[thisProp].coords = opts.component.getCoords();
                opts.component.connectors[at][this.uuid] = this;
            } else if (opts.coords) {
                coords = this[thisProp].coords = opts.coords;
                delete this[thisProp].component;
            } else if (opts.update && this[thisProp].coords) {
                if (this[thisProp].component) {
                    coords = this[thisProp].coords = this[thisProp].component.getCoords();
                } else {
                    coords = this[thisProp].coords;
                }
            }

            if (!coords || !(coords instanceof Array) || coords.length === 0) {
                console.warn('Trying to create connector with an invalid value.')
                return;
            }

            this._diagonal = this._diagonal[diagProp]({
                x: coords[1],
                y: coords[0]
            });

            if (opts.render) {
                this.render();
            }
            return this;
        };

        Connector.prototype.refresh = function() {
            this.startsAt({ update: true })
                .endsAt({ update: true })
                .render();
        };

        mohini._drawConnector = true;
        mohini._edgeOffset = 4;
        Connector.prototype.centroidToEdge = function() {

            if (this._startsAt && this._endsAt
                && this._startsAt.component && this._endsAt.component
                && mohini._drawConnector) {

                // Calc slope
                var comp1 = this._startsAt.coords,
                    comp2 = this._endsAt.coords,
                    dx = comp1[0] - comp2[0],
                    dy = comp1[1] - comp2[1],
                    slope = dy / dx,
                    mdx = dx < 0 ? ~ dx + 1 : dx,
                    mdy = dy < 0 ? ~ dy + 1 : dy,
                    dirXWise = (mdx > mdy),
                    c, x1, x2, y1, y2, h, w, quart;

                if (slope === Infinity || slope === -Infinity || slope === 0) {
                    slope = undefined;
                }
                c = lineEqn(comp1[0], comp1[1], slope);

                // If direction is x wise, we need to find the y coordinates.
                if (dirXWise) {
                    // If dx ix -ve we use comp1's right edge and comp2's left edge.
                    if (dx < 0) {
                        x1 = comp1[2].x2 + mohini._edgeOffset;
                        x2 = comp2[2].x1 - mohini._edgeOffset;
                    // If dx ix +ve we use comp1's left edge and comp2's right edge.
                    } else {
                        x1 = comp1[2].x1 - mohini._edgeOffset;
                        x2 = comp2[2].x2 + mohini._edgeOffset;
                    }
                    y1 = slope ? lineEqn(x1, null, slope, c) : comp1[1];
                    y2 = slope ? lineEqn(x2, null, slope, c) : comp2[1];

                    // If the calculated y1 or y2 are too close to the rect top/bottom
                    // we snap it to a quarter of a way down or up from either of them
                    // so the connectors stay away from the corners.

                    h = comp1[2].y2 - comp1[2].y1;
                    quart = h / 4;
                    if (y1 > comp1[2].y2 - quart) {
                        y1 = comp1[2].y2 - quart;
                    } else if (y1 < comp1[2].y1 + quart) {
                        y1 = comp1[2].y1 + quart;
                    }

                    h = comp2[2].y2 - comp2[2].y1;
                    quart = h / 4;
                    if (y2 > comp2[2].y2 - quart) {
                        y2 = comp2[2].y2 - quart;
                    } else if (y1 < comp2[2].y1 + quart) {
                        y2 = comp2[2].y1 + quart;
                    }

                // If direction is y wise, we need to find the x coordinates.
                } else {
                    // If dy is +ve we use comp1's bottom edge and comp2's top edge.
                    if (dy > 0) {
                        y1 = comp1[2].y1 - mohini._edgeOffset;
                        y2 = comp2[2].y2 + mohini._edgeOffset;
                    // If dy is +ve we use comp1's top edge and comp2's bottom edge.
                    } else {
                        y1 = comp1[2].y2 + mohini._edgeOffset;
                        y2 = comp2[2].y1 - mohini._edgeOffset;
                    }
                    x1 = slope ? lineEqn(null, y1, slope, c) : comp1[0];
                    x2 = slope ? lineEqn(null, y2, slope, c) : comp2[0];

                    // If the calculated x1 or x2 are too close to the rect left/right
                    // we snap it to a quarter of a way left or right from either of them
                    // so the connectors stay away from the corners.

                    w = comp1[2].x2 - comp1[2].x1;
                    quart = w / 4;
                    if (x1 > comp1[2].x2 - quart) {
                        x1 = comp1[2].x2 - quart;
                    } else if (x1 < comp1[2].x1 + quart) {
                        x1 = comp1[2].x1 + quart;
                    }

                    w = comp2[2].x2 - comp2[2].x1;
                    quart = w / 4;
                    if (x2 > comp2[2].x2 - quart) {
                        x2 = comp2[2].x2 - quart;
                    } else if (x1 < comp2[2].x1 + quart) {
                        x2 = comp2[2].x1 + quart;
                    }
                }

                // Why the x and y attributes interchange is very confusing to explain
                // considering I barely understand it.
                // @see d3js diagonal examples.
                if (dirXWise) {
                    this._diagonal.source({
                        x: y1,
                        y: x1
                    }).target({
                        x: y2,
                        y: x2
                    })
                    .projection(function(d) { return [d.y, d.x]; });
                } else {
                    this._diagonal.source({
                        x: x1,
                        y: y1
                    }).target({
                        x: x2,
                        y: y2
                    })
                    .projection(function(d) { return [d.x, d.y]; });
                }
            }
        };

        Connector.prototype.render = function() {
            if (!mohini._drawConnector) return;
            this.centroidToEdge();
            this.el.attr('d', this._diagonal);
            return this;
        };

        Connector.prototype.remove = function() {
            this.el.remove();
            if (this._startsAt) {
                if (this._startsAt.component) {
                    delete this._startsAt.component.connectors.startsAt[this.uuid];
                }
                delete this._startsAt;
            }
            if (this._endsAt) {
                if (this._endsAt.component) {
                    delete this._endsAt.component.connectors.endsAt[this.uuid];
                }
                delete this._endsAt;
            }
            delete factory.connectors[self.uuid];
        };

        Connector.connect = function(component, dest) {
            if (!component) return;

            var connector;

            if (component && dest) {
                if (component !== dest) {
                    connector = new Connector()
                        .startsAt({ component: component })
                        .endsAt({ component: dest })
                        .render();
                }
            } else {
                // Start connector.
                if (!Connector._connector) {
                    connector = Connector._connector = new Connector()
                        .startsAt({ component: component});

                    body.on('mousemove.connectorPoint', function() {
                        Connector._connector.endsAt({
                            coords: mohini.transform(d3.event),
                            render: true
                        });
                    });

                // End connector.
                } else {
                    if (Connector._connector._startsAt.component != component) {
                        Connector._connector.endsAt({
                            component: component,
                            render: true
                        });
                        Connector._connector = null;

                        body.on('mousemove.connectorPoint', null);
                    } else {
                        Connector._connector.remove();
                    }
                }
            }
            return connector;
        }

        return Connector;
    }
    return MohiniConnectorFactory;
})();
