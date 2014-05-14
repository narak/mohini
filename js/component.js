var drag = d3.behavior.drag()
    .origin(function(d) { return d.scaled; })
    .on('dragstart', function(d) {
        d3.event.sourceEvent.stopPropagation();
        d3.select(this).classed('dragging', true);
    })
    .on('drag', function(d) {
        d.scaled.x = d3.event.x;
        d.scaled.y = d3.event.y;

        // If you transform the group, all the group children take their
        // positions in relation to the group's position.
        d.el.group.attr('transform', 'translate(' + d.scaled.x + ', ' + d.scaled.y + ')');

        var component = getComponent(this.getAttribute('uuid'));
        component.connectors.startsAt.forEach(function(conn) {
            conn.startsAt({ update: true });
        });
        component.connectors.endsAt.forEach(function(conn) {
            conn.endsAt({ update: true });
        });

    })
    .on('dragend', function(d) {
        d3.select(this).classed('dragging', false);
    });

var compMap = {};

function getEndPointCoords() {
    var ep = this.el.box.node(),
        dim = ep.getBoundingClientRect(),
        xy = translateNScale({
            x: (dim.left + dim.right) / 2,
            y: (dim.top + dim.bottom) / 2
        });

    translateNScale(dim.left, dim.top, dim);
    dim.x1 = dim.x;
    dim.y1 = dim.y;

    translateNScale(dim.right, dim.bottom, dim);
    dim.x2 = dim.x;
    dim.y2 = dim.y;

    delete dim.x;
    delete dim.y;

    xy.push(dim);

    return xy;
}

function addComponent(data) {
    var uuid = generateUUID('comp');

    data.scaled = {};
    data.scaled.x = scaleToInitialZoom(data.x);
    data.scaled.y = scaleToInitialZoom(data.y);
    data.scaled.w = scaleToInitialZoom(data.w);
    data.scaled.h = scaleToInitialZoom(data.h);
    data.scaled.r = scaleToInitialZoom(data.r || 5);
    data.scaled.fs = scaleToInitialZoom(data.fs || 10);
    data.scaled.fdx = scaleToInitialZoom(data.w / 2);
    data.scaled.fdy = scaleToInitialZoom(20);
    data.scaled.cx = scaleToInitialZoom(25);
    data.scaled.cy = scaleToInitialZoom(35);
    data.scaled.cr = scaleToInitialZoom(data.cr || 5);
    data.connectors = { startsAt: [], endsAt: [] };
    data.getEndPointCoords = getEndPointCoords;

    var group = compContainer.append('g')
            .data([data])
            .attr('uuid', uuid)
            .attr('x', function(d) { return d.scaled.x; })
            .attr('y', function(d) { return d.scaled.y; })
            .attr('transform', function(d) { return 'translate(' + d.scaled.x + ', ' + d.scaled.y + ')'; })
            .call(ConnectorPlugin)
            .call(drag);

    group
            .on('click.moveToFront', function() {
                group.moveToFront();
            });

    data.el = {
        box: group.append('rect')
            .attr('class', 'component')
            .attr('width', function(d) { return d.scaled.w; })
            .attr('height', function(d) { return d.scaled.h; })
            .attr('rx', data.scaled.r)
            .style({
                'stroke-width': scaleToInitialZoom(1) + 'px'
            })
            .attr('ry', data.scaled.r),

        label: group.append('text')
            .attr('width', function(d) { return d.scaled.w; })
            .attr('height', function(d) { return d.scaled.h; })
            .attr('dx',  function(d) { return d.scaled.fdx; })
            .attr('dy',  function(d) { return d.scaled.fdy; })
            .attr('text-anchor', 'middle')
            .style('font', data.scaled.fs + 'px ' + (data.ff || 'sans-serif'))
            .text(function(d) { return d.l; }),

        endpoint: group.append('circle')
            .attr('class', 'connector-point')
            .attr('cx', function(d) { return d.scaled.cx; })
            .attr('cy', function(d) { return d.scaled.cy; })
            .attr('r',  function(d) { return d.scaled.cr; }),

        group: group
    };

    compMap[uuid] = data;
    return data;
}

function getComponent(uuid) {
    return compMap[uuid];
}