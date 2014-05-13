var isPoint = function(el) {
        return matchesSelector(el, '.connector-point');
    },

    connector = null,
    connectorMap = {};

function startsAt(opts) {
    opts = opts || {};

    var coords;

    this._startsAt = this._startsAt || {};

    if (opts.component) {
        this._startsAt.component = opts.component;
        coords = this._startsAt.coords = opts.component.getEndPointCoords();
    } else if (opts.coords) {
        coords = this._startsAt.coords = opts.coords;
        delete this._startsAt.component;
    } else if (opts.update && this._startsAt.coords) {
        if (this._startsAt.component) {
            coords = this._startsAt.coords = this._startsAt.component.getEndPointCoords();
        } else {
            coords = this._startsAt.coords;
        }
    }

    if (!coords || !(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to start connector at an invalid value.')
        return;
    }

    this._diagonal = this._diagonal.source({
        x: coords[0],
        y: coords[1]
    });

    if (opts.render === undefined || opts.render) {
        this.el.attr('d', this._diagonal);
    }
}

function endsAt(opts) {
    opts = opts || {};

    var coords;

    this._endsAt = this._endsAt || {};

    if (opts.component) {
        this._endsAt.component = opts.component;
        coords = this._endsAt.coords = opts.component.getEndPointCoords();
    } else if (opts.coords) {
        coords = this._endsAt.coords = opts.coords;
        delete this._endsAt.component;
    } else if (opts.update && this._endsAt.coords) {
        if (this._endsAt.component) {
            coords = this._endsAt.coords = this._endsAt.component.getEndPointCoords();
        } else {
            coords = this._endsAt.coords;
        }
    }

    if (!coords || !(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to start connector at an invalid value.')
        return;
    }

    this._diagonal = this._diagonal.target({
        x: coords[0],
        y: coords[1]
    });

    if (opts.render === undefined || opts.render) {
        this.el.attr('d', this._diagonal);
    }
}

function connectorPoint(group) {
    group.on('mousedown', function() {
            if (!isPoint(d3.event.target)) return;
            // Prevent drag.
            d3.event.stopPropagation();
        })
        .on('click', function(d) {
            if (!isPoint(d3.event.target)) return;

            var tns = translateNScale(d3.event),
                compUUID = d3.select(this).attr('uuid'),
                component = getComponent(compUUID),
                ctns = component.getEndPointCoords(),
                uuid;

            if (!connector) {
                uuid = generateUUID('conn');
                connectorMap[uuid] = connector = {
                    _diagonal: d3.svg.diagonal(),
                    startsAt: startsAt,
                    endsAt: endsAt
                };

                // Start connector.
                connector.el = connectorContainer.append('path')
                    .attr('class', 'connector')
                    .attr('uuid', uuid);

                d3.select('body').on('mousemove.connectorstart', function() {
                    connector.endsAt({ coords: translateNScale(d3.event) })
                });

                connector.startsAt({ component: component, render: false });
                component.connectors.startsAt.push(connector);
            } else {
                // End connector.
                connector.endsAt({ component: component });
                component.connectors.endsAt.push(connector);

                d3.select('body').on('mousemove.connectorstart', null);
                connector = null;
            }
        });
}
