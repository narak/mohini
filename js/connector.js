var isPoint = function(el) {
        return matchesSelector(el, '.connector-point');
    },

    line = null,
    lineMap = {},

    diagonal = d3.svg.diagonal();

function startsAt(opts) {
    var coords;

    this._startsAt = this._startsAt || {};

    if (opts.component) {
        this._startsAt.component = opts.component;
        coords = this._startsAt.coords = opts.component.getEndPointCoords();
    } else if (opts.coords) {
        coords = this._startsAt.coords = opts.coords;
        delete this._startsAt.component;
    }

    if (!coords || !(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to start line at an invalid value.')
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
    var coords;

    this._endsAt = this._endsAt || {};

    if (opts.component) {
        this._endsAt.component = opts.component;
        coords = this._endsAt.coords = opts.component.getEndPointCoords();
    } else if (opts.coords) {
        coords = this._endsAt.coords = opts.coords;
        delete this._endsAt.component;
    }

    if (!coords || !(coords instanceof Array) || coords.length === 0) {
        console.warn('Trying to start line at an invalid value.')
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

            if (!line) {
                uuid = generateUUID('conn');
                lineMap[uuid] = line = {
                    _diagonal: diagonal,
                    startsAt: startsAt,
                    endsAt: endsAt
                };

                // Start connector.
                line.el = lineContainer.append('path')
                    .attr('class', 'connector')
                    .attr('uuid', uuid);

                d3.select('body').on('mousemove.connectorstart', function() {
                    line.endsAt({ coords: translateNScale(d3.event) })
                });

                line.startsAt({ component: component, render: false });
                component.connectors.startsAt.push(line);
            } else {
                // End connector.
                line.endsAt({ component: component });
                component.connectors.endsAt.push(line);

                d3.select('body').on('mousemove.connectorstart', null);
                line = null;
            }
        });
}

function genLinks() {
    var links = [],
        sctns, ectns, line;

    for (var uuid in lineMap) {
        if (!lineMap.hasOwnProperty(uuid)) continue;

        line = lineMap[uuid];
        sctns = line._startComponent.getEndPointCoords();
        ectns = line._endComponent.getEndPointCoords();

        links.push({
            source: {
                x: sctns[0],
                y: sctns[1]
            },
            target: {
                x: ectns[0],
                y: ectns[1]
            }
        });
    }

    console.log(linkContainer);
    linkContainer
        .selectAll(".link").remove()
    linkContainer
        .selectAll(".link")
        .data(links)
        .enter().append("path")
        .attr("class", "link")
        .attr("d", diagonal);
}
