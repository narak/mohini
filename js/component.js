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
            component._dirty = true;

            for (uuid in component.connectors.startsAt) {
                component.connectors.startsAt[uuid].refresh();
            }
            for (uuid in component.connectors.endsAt) {
                component.connectors.endsAt[uuid].refresh();
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
    self.scaled.x = data.x;
    self.scaled.y = data.y;
    self.scaled.w = data.w;
    self.scaled.h = data.h;
    self.scaled.r = data.r || 5;
    self.scaled.fs = data.fs || 10;
    self.scaled.fdx = data.w / 2;
    self.scaled.fdy = 25;
    self.scaled.cx = 25;
    self.scaled.cy = 35;
    self.scaled.cr = data.cr || 5;
    self.name = data.l;
    self._dirty = true;

    self.connectors = { startsAt: {}, endsAt: {} };

    var group = compContainer.append('g')
            .data([self])
            .attr('uuid', uuid)
            .attr('x', function(d) { return d.scaled.x; })
            .attr('y', function(d) { return d.scaled.y; })
            .attr('transform', function(d) { return 'translate(' + d.scaled.x + ', ' + d.scaled.y + ')'; })
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
                'stroke-width': 1 + 'px'
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

        group: group
    };

    compMap[uuid] = self;
    return self;
}

Component.prototype.getCoords = function() {
    if (this._dirty) {
        var ep = this.el.box.node(),
            dim = ep.getBoundingClientRect();

        this._xy = translateNScale({
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

        this._xy.push(dim);
        this._dirty = false;
    }

    return this._xy;
};

Component.get = function(uuid) {
    return compMap[uuid];
}

extend(Component, new PubSub);