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
            .origin(function(d) { return d; })
            .on('dragstart', function(d) {
                d3.event.sourceEvent.stopPropagation();
                d3.select(this).classed('dragging', true);
            })
            .on('drag', function(d) {
                var component = Component.get(this.getAttribute('uuid'));
                component && component.moveTo(d3.event.x, d3.event.y)
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

            if (!data.x || !data.y) {
                var mid = mohini.getMidCoords();
                data.x = data.x || mid[0];
                data.y = data.y || mid[1];
            }

            // Extend self with defaults and then the input data.
            extend(self, {
                uuid: uuid,
                r: 5,
                fs: 10,
                fdx: data.w/2,
                fdy: 25,
                cx: 25,
                cy: 35,
                cr: 5,
                name: uuid
            }, data);

            self._dirty = true;

            self.connectors = { startsAt: {}, endsAt: {} };

            var group = factory.container.append('g')
                    .data([self])
                    .attr('uuid', uuid)
                    .attr('x', function(d) { return d.x; })
                    .attr('y', function(d) { return d.y; })
                    .attr('transform', function(d) { return 'translate(' + d.x + ', ' + d.y + ')'; })
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
                    .attr('width', function(d) { return d.w; })
                    .attr('height', function(d) { return d.h; })
                    .attr('rx', self.r)
                    .style({
                        'stroke-width': 1 + 'px'
                    })
                    .attr('ry', self.r),

                label: group.append('text')
                    .attr('width', function(d) { return d.w; })
                    .attr('height', function(d) { return d.h; })
                    .attr('dx',  function(d) { return d.fdx; })
                    .attr('dy',  function(d) { return d.fdy; })
                    .attr('text-anchor', 'middle')
                    .style('font', self.fs + 'px ' + (self.ff || 'sans-serif'))
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

        Component.prototype.remove = function() {
            each(this.connectors.startsAt, function(c) {
                c.remove();
            });
            each(this.connectors.endsAt, function(c) {
                c.remove();
            });
            each(this.el, function(ele) {
                ele.remove();
            });
            delete factory.components[self.uuid];
        };

        Component.prototype.moveTo = function(x, y) {
            // If you transform the group, all the group children take their
            // positions in relation to the group's position.
            this.x = x;
            this.y = y;
            this.el.group.attr('transform', 'translate(' + x + ', ' + y + ')');
            this._dirty = true;
            each(this.connectors.startsAt, function(c) { c.refresh(); });
            each(this.connectors.endsAt, function(c) { c.refresh(); });
        };

        Component.get = function(uuid) {
            return factory.components[uuid];
        }

        extend(Component, new PubSub);

        return Component;
    }

    return MohiniComponentFactory;
})();
