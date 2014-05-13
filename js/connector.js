var isPoint = function(el) {
        return matchesSelector(el, '.connector-point');
    },

    line = null,
    lineMap = {};

function startsAt(component, coords) {
    if (component) {
        this._startComponent = component;
        coords = component.getEndPointCoords();
    }
    if (!coords) {
        coords = this._startComponent.getEndPointCoords();
    }

    if (!(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to start line at an invalid value.')
        return;
    }

    this.el
        .attr('x1', coords[0])
        .attr('y1', coords[1])
}

function endsAt(component, coords) {
    if (component) {
        this._endComponent = component;
        coords = component.getEndPointCoords();
    }
    if (!coords) {
        coords = this._endComponent.getEndPointCoords();
    }

    if (!coords || !(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to start line at an invalid value.')
        return;
    }

    this.el
        .attr('x2', coords[0])
        .attr('y2', coords[1])
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
                uuid;

            if (!line) {
                uuid = generateUUID('conn');
                line = { startsAt: startsAt, endsAt: endsAt };

                // Start connector.
                line.el = lineContainer.append('line')
                    .attr('uuid', uuid);

                d3.select('body').on('mousemove.connectorstart', function() {
                    line.endsAt(null, translateNScale(d3.event))
                });

                line.startsAt(component);
                line.endsAt(component);
                component.connectors.startsAt.push(line);
                lineMap[uuid] = line;
            } else {
                // End connector.
                line.endsAt(component);
                component.connectors.endsAt.push(line);

                d3.select('body').on('mousemove.connectorstart', null);
                line = null;
            }
        });
}
