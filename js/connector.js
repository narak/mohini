// TODO: Arrow heads
svg.append("defs").append("marker")
    .attr("id", "arrowhead")
    .attr("refX", 0.1) /*must be smarter way to calculate shift*/
    .attr("refY", 2)
    .attr("markerWidth", 2)
    .attr("markerHeight", 4)
    .attr("orient", "auto")
    .append("path")
        .attr("d", "M0,0 C45,45 45,-45 90,0"); //this is actual shape for arrowhead

function isPoint(el) {
    return matchesSelector(el, '.connector-point');
};

var connectorMap = {},
    body = d3.select(document.body);

function Connector() {
    var uuid = generateUUID('conn'),
        self = this;

    connectorMap[uuid] = self;

    self._diagonal = d3.svg.diagonal();

    // Start connector.
    self.el = connectorContainer.append('path')
        .attr('class', 'connector')
        .attr('uuid', uuid)
        .attr("marker-end", "url(#arrowhead)");

    body.on('mousemove.connectorPoint', function() {
        self.endsAt({ coords: translateNScale(d3.event) })
    });

    return self;
}

Connector.prototype.startsAt = function(opts) {
    return this.updateAt.call(this, '_startsAt', 'source', opts);
};

Connector.prototype.endsAt = function(opts) {
    return this.updateAt.call(this, '_endsAt', 'target', opts);
};

Connector.prototype.updateAt = function(thisProp, diagProp, opts) {
    opts = opts || {};

    var coords;

    this[thisProp] = this[thisProp] || {};

    if (opts.component) {
        this[thisProp].component = opts.component;
        coords = this[thisProp].coords = opts.component.getEndPointCoords();
    } else if (opts.coords) {
        coords = this[thisProp].coords = opts.coords;
        delete this[thisProp].component;
    } else if (opts.update && this[thisProp].coords) {
        if (this[thisProp].component) {
            coords = this[thisProp].coords = this[thisProp].component.getEndPointCoords();
        } else {
            coords = this[thisProp].coords;
        }
    }

    if (!coords || !(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to create connector with an invalid value.')
        return;
    }

    this._diagonal = this._diagonal[diagProp]({
        x: coords[0],
        y: coords[1]
    });

    if (opts.render === undefined || opts.render) {
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
            c, x1, x2, y1, y2;

        if (slope === Infinity || slope === 0) {
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
                x1 = p1[2].x2;
                x2 = p2[2].x1;
            }
            y1 = slope ? lineEqn(x1, null, slope, c) : p1[1];
            y2 = slope ? lineEqn(x2, null, slope, c) : p2[1];

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
        }

        this._diagonal.source({
            x: x1,
            y: y1
        }).target({
            x: x2,
            y: y2
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
function connectorPoint(group) {
    group.on('mousedown.connectorPoint', function() {
            if (!isPoint(d3.event.target)) return;
            // Prevent drag.
            d3.event.stopPropagation();
        })
        .on('click.connectorPoint', function(d) {
            if (!isPoint(d3.event.target)) return;

            var component = getComponent(d3.select(this).attr('uuid'));

            if (!connector) {
                connector = new Connector()
                    .startsAt({ component: component, render: false });
                component.connectors.startsAt.push(connector);
            } else {
                // End connector.
                connector.endsAt({ component: component });
                component.connectors.endsAt.push(connector);

                d3.select('body').on('mousemove.connectorPoint', null);
                connector = null;
            }
        });
}
