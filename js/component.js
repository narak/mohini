/**
 * MohiniComponentFactory
 */
var MohiniComponentFactory = (function() {

    function MohiniComponentFactory(mohini) {
        if (!(this instanceof MohiniComponentFactory)) {
            throw new Error('Wrong usage of factory. Use `new MohiniComponentFactory()`.');
        }

        var factory = this;
        factory.container = mohini.container.append('g');
        factory.components = {};

        factory._drag = d3.behavior.drag()
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
            });

        var Component = function Component(data) {
            if (!(this instanceof Component)) {
                throw new Error('Wrong usage of factory. Use `new Component()`.');
            }

            var uuid = generateUUID('comp'),
                self = this;

            // Give components local event capability.
            extend(self, new PubSub);

            self.scaled = {};
            self.uuid = uuid;
            self.scaled.x = data.x;
            self.scaled.y = data.y;
            self.scaled.w = data.w;
            self.scaled.h = data.h;
            self.scaled.r = data.r || 5;
            self.scaled.fs = data.fs || 10;
            self.scaled.fdx = data.fdx || data.w / 2;
            self.scaled.fdy = data.fdy || 25;
            self.scaled.cx = data.cx || 25;
            self.scaled.cy = data.cy || 35;
            self.scaled.cr = data.cr || 5;
            self.name = data.name || uuid;
            self._dirty = true;

            self.connectors = { startsAt: {}, endsAt: {} };

            var group = factory.container.append('g')
                    .data([self])
                    .attr('uuid', uuid)
                    .attr('x', function(d) { return d.scaled.x; })
                    .attr('y', function(d) { return d.scaled.y; })
                    .attr('transform', function(d) { return 'translate(' + d.scaled.x + ', ' + d.scaled.y + ')'; })
                    .call(factory._drag);

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

            factory.components[uuid] = self;
            return self;
        }

        Component.prototype.getCoords = function() {
            if (this._dirty) {
                var ep = this.el.box.node(),
                    dim = ep.getBoundingClientRect();

                this._xy = mohini.transform({
                    x: (dim.left + dim.right) / 2,
                    y: (dim.top + dim.bottom) / 2
                });

                mohini.transform(dim.left, dim.top, dim);
                dim.x1 = dim.x;
                dim.y1 = dim.y;

                mohini.transform(dim.right, dim.bottom, dim);
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
            return factory.components[uuid];
        }

        extend(Component, new PubSub);

        return Component;
    }

    return MohiniComponentFactory;
})();
