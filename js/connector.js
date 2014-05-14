// TODO: Arrow heads
var defsContainer = svg.append("defs");

defsContainer.append("marker")
    .attr("id", "markerEnd")
    .attr("refX", 1.5)
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
    // .attr("refX", 3)
    // .attr("refY", 1.5)
    // .attr("markerWidth", 3)
    // .attr("markerHeight", 3)
    // .attr("orient", "auto")
    // .append("path")
    //     .attr("d", "M 0,0 V 3 L3,1.5 Z");

defsContainer.append("marker")
    .attr("id", "markerMid")
    .attr("refX", 10)
    .attr("refY", 10)
    .attr("markerWidth", 7)
    .attr("markerHeight", 7)
    .attr("orient", "auto")
    .style({
        'stroke': 'none',
        'fill': '#000000'
    })
    .append("circle")
        .attr("cx", 10)
        .attr('cy', 10)
        .attr('r', 10);

defsContainer.append("marker")
    .attr("id", "markerStart")
    .attr("refX", 1.5)
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

function isPoint(el) {
    return matchesSelector(el, '.connector-point');
};

var connectorMap = {},
    body = d3.select(document.body);

function Connector() {
    var uuid = generateUUID('conn'),
        self = this;

    connectorMap[uuid] = self;

    self.uuid = uuid;
    self._diagonal = d3.svg.diagonal()
        .projection(function(d) { return [d.y, d.x]; });

    // Start connector.
    self.el = connectorContainer.append('path')
        .attr('class', 'connector')
        .attr('uuid', uuid)
        .attr("marker-start", "url(#markerStart)")
        .attr("marker-mid", "url(#markerMid)")
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

function lineEqn(x, y, m, c) {
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

var drawLine = true;
Connector.prototype.centroidToEdge = function() {

    if (this._startsAt.component && this._endsAt.component && drawLine) {
        // Calc slope
        var p1 = this._startsAt.coords,
            p2 = this._endsAt.coords,
            dx = p1[0] - p2[0],
            dy = p1[1] - p2[1],
            slope = dy / dx,
            mdx = dx < 0 ? ~ dx + 1 : dx,
            mdy = dy < 0 ? ~ dy + 1 : dy,
            dirXWise = (mdx > mdy),
            c, x1, x2, y1, y2, h, w, quart;

        if (slope === Infinity || slope === -Infinity || slope === 0) {
            slope = undefined;
        }
        c = lineEqn(p1[0], p1[1], slope);

        // If direction is x wise, we need to find the y coordinates.
        if (dirXWise) {
            // If dx ix -ve we use p1's right edge and p2's left edge.
            if (dx < 0) {
                x1 = p1[2].x2;
                x2 = p2[2].x1;
            // If dx ix +ve we use p1's left edge and p2's right edge.
            } else {
                x1 = p1[2].x1;
                x2 = p2[2].x2;
            }
            y1 = slope ? lineEqn(x1, null, slope, c) : p1[1];
            y2 = slope ? lineEqn(x2, null, slope, c) : p2[1];

            // If the calculated y1 or y2 are too close to the rect top/bottom
            // we snap it to a quarter of a way down or up from either of them
            // so the connectors stay away from the corners.

            h = p1[2].y2 - p1[2].y1;
            quart = h / 4;
            if (y1 > p1[2].y2 - quart) {
                y1 = p1[2].y2 - quart;
            } else if (y1 < p1[2].y1 + quart) {
                y1 = p1[2].y1 + quart;
            }

            h = p2[2].y2 - p2[2].y1;
            quart = h / 4;
            if (y2 > p2[2].y2 - quart) {
                y2 = p2[2].y2 - quart;
            } else if (y1 < p2[2].y1 + quart) {
                y2 = p2[2].y1 + quart;
            }

        // If direction is y wise, we need to find the x coordinates.
        } else {
            // If dy is +ve we use p1's bottom edge and p2's top edge.
            if (dy > 0) {
                y1 = p1[2].y1;
                y2 = p2[2].y2;
            // If dy is +ve we use p1's top edge and p2's bottom edge.
            } else {
                y1 = p1[2].y2;
                y2 = p2[2].y1;
            }
            x1 = slope ? lineEqn(null, y1, slope, c) : p1[0];
            x2 = slope ? lineEqn(null, y2, slope, c) : p2[0];

            // If the calculated x1 or x2 are too close to the rect left/right
            // we snap it to a quarter of a way left or right from either of them
            // so the connectors stay away from the corners.

            w = p1[2].x2 - p1[2].x1;
            quart = w / 4;
            if (x1 > p1[2].x2 - quart) {
                x1 = p1[2].x2 - quart;
            } else if (x1 < p1[2].x1 + quart) {
                x1 = p1[2].x1 + quart;
            }

            w = p2[2].x2 - p2[2].x1;
            quart = w / 4;
            if (x2 > p2[2].x2 - quart) {
                x2 = p2[2].x2 - quart;
            } else if (x1 < p2[2].x1 + quart) {
                x2 = p2[2].x1 + quart;
            }
        }

        this._diagonal.source({
            x: y1,
            y: x1
        }).target({
            x: y2,
            y: x2
        });
    }
};

Connector.prototype.render = function() {
    if (!drawLine) return;
    this.centroidToEdge();
    this.el.attr('d', this._diagonal);
    return this;
};

var connector;
function ConnectorPlugin(group) {
    group.on('mousedown.connectorPoint', function() {
            if (!isPoint(d3.event.target)) return;
            // Prevent drag.
            d3.event.stopPropagation();
        })
        .on('click.connectorPoint', function(d) {
            if (!isPoint(d3.event.target)) return;

            var component = Component.get(d3.select(this).attr('uuid'));

            if (!connector) {
                connector = new Connector()
                    .startsAt({ component: component});
                body.on('mousemove.connectorPoint', function() {
                    connector.endsAt({ coords: translateNScale(d3.event), render: true })
                });
            } else {
                // End connector.
                connector.endsAt({ component: component, render: true });
                body.on('mousemove.connectorPoint', null);
                connector = null;
            }
        });
}
