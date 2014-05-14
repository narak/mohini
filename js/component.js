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

            var component = Component.get(this.getAttribute('uuid')),
                uuid;

            for (uuid in component.connectors.startsAt) {
                component.connectors.startsAt[uuid]
                    .startsAt({ update: true, render: true });
            }
            for (uuid in component.connectors.endsAt) {
                component.connectors.endsAt[uuid]
                    .endsAt({ update: true, render: true });
            }
        })
        .on('dragend', function(d) {
            d3.select(this).classed('dragging', false);
        }),
    compMap = {};

function Component(data) {
    var uuid = generateUUID('comp'),
        self = this;

    extend(self, new PubSub);

    self.scaled = {};
    self.uuid = uuid;
    self.scaled.x = scaleToInitialZoom(data.x);
    self.scaled.y = scaleToInitialZoom(data.y);
    self.scaled.w = scaleToInitialZoom(data.w);
    self.scaled.h = scaleToInitialZoom(data.h);
    self.scaled.r = scaleToInitialZoom(data.r || 5);
    self.scaled.fs = scaleToInitialZoom(data.fs || 10);
    self.scaled.fdx = scaleToInitialZoom(data.w / 2);
    self.scaled.fdy = scaleToInitialZoom(25);
    self.scaled.cx = scaleToInitialZoom(25);
    self.scaled.cy = scaleToInitialZoom(35);
    self.scaled.cr = scaleToInitialZoom(data.cr || 5);
    self.name = data.l;

    self.connectors = { startsAt: {}, endsAt: {} };

    var group = compContainer.append('g')
            .data([self])
            .attr('uuid', uuid)
            .attr('x', function(d) { return d.scaled.x; })
            .attr('y', function(d) { return d.scaled.y; })
            .attr('transform', function(d) { return 'translate(' + d.scaled.x + ', ' + d.scaled.y + ')'; })
            //.call(ConnectorPlugin)
            .call(drag);

    group.on('click.moveToFront', function() {
        group.moveToFront();
    });
    group.on('click.pubsub', function() {
        self.trigger('click', d3.event);
        Component.trigger('click', self, d3.event);
    });

    self.el = {
        box: group.append('rect')
            .attr('class', 'component')
            .attr('width', function(d) { return d.scaled.w; })
            .attr('height', function(d) { return d.scaled.h; })
            .attr('rx', self.scaled.r)
            .style({
                'stroke-width': scaleToInitialZoom(1) + 'px'
            })
            .attr('ry', self.scaled.r),

        label: group.append('text')
            .attr('width', function(d) { return d.scaled.w; })
            .attr('height', function(d) { return d.scaled.h; })
            .attr('dx',  function(d) { return d.scaled.fdx; })
            .attr('dy',  function(d) { return d.scaled.fdy; })
            .attr('text-anchor', 'middle')
            .style('font', self.scaled.fs + 'px ' + (self.ff || 'sans-serif'))
            .text(function(d) { return d.name || self.uuid; }),

        // endpoint: group.append('circle')
        //     .attr('class', 'connector-point')
        //     .attr('cx', function(d) { return d.scaled.cx; })
        //     .attr('cy', function(d) { return d.scaled.cy; })
        //     .attr('r',  function(d) { return d.scaled.cr; }),

        group: group
    };

    compMap[uuid] = self;
    return self;
}

Component.prototype.getCoords = function() {
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
};

Component.get = function(uuid) {
    return compMap[uuid];
}

extend(Component, new PubSub);