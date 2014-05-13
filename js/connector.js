var isPoint = function(el) {
        return matchesSelector(el, '.connector-point');
    },

    connector = null,
    connectorMap = {},
    body = d3.select(document.body);

function Connector() {
    var uuid = generateUUID('conn'),
        self = this,
        connector;

    connectorMap[uuid] = self;

    self._diagonal = d3.svg.diagonal();

    // Start connector.
    self.el = connectorContainer.append('path')
        .attr('class', 'connector')
        .attr('uuid', uuid);

    body.on('mousemove.connectorPoint', function() {
        self.endsAt({ coords: translateNScale(d3.event) })
    });

    return self;
}

Connector.prototype.startsAt = function(opts) {
    this.updateAt.call(this, '_startsAt', 'source', opts);
};

Connector.prototype.endsAt = function(opts) {
    this.updateAt.call(this, '_endsAt', 'target', opts);
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
};

Connector.prototype.render = function(render) {
    this.el.attr('d', this._diagonal);
};

function connectorPoint(group) {
    group.on('mousedown.connectorPoint', function() {
            if (!isPoint(d3.event.target)) return;
            // Prevent drag.
            d3.event.stopPropagation();
        })
        .on('click.connectorPoint', function(d) {
            if (!isPoint(d3.event.target)) return;

            var compUUID = d3.select(this).attr('uuid'),
                component = getComponent(compUUID);

            if (!connector) {
                connector = new Connector();
                connector.startsAt({ component: component, render: false });
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
