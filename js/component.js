/**
 * MohiniComponentFactory
 */
var MohiniComponentFactory = (function() {

    // Filters.
    var defsContainer = d3.select(document.body).append('svg')
        .attr('width', 0)
        .attr('height', 0)
        .append('defs');

    var filter = defsContainer.append('filter')
        .attr('id', 'dropshadow')
        .attr('height', '150%');
    filter.append('feGaussianBlur')
            .attr('in', 'SourceAlpha')
            .attr('stdDeviation', 3); //stdDeviation is how much to blur
    filter.append('feOffset') //how much to offset
            .attr('dx', 2)
            .attr('dy', 2)
            .attr('result', 'offsetblur');
    filter.append('feComponentTransfer')
        .append('feFuncA')
            .attr('type', 'linear')
            .attr('slope', 0.2);

    var feMerge = filter.append('feMerge');
    feMerge.append('feMergeNode'); //this contains the offset blurred image
    feMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');

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
                self = this,
                render = !!data.render;
            delete data.render;

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
            // Extend pubsub.
            extend(self, new PubSub);

            self._dirty = true;

            self.connectors = { startsAt: {}, endsAt: {} };

            var group = d3.select(createSVGElement('g'))
                    .data([self])
                    .attr('uuid', uuid)
                    .attr('class', 'component')
                    .attr('transform', function(d) { return 'translate(' + d.x + ', ' + d.y + ')'; })
                    .call(factory._drag);

            self.el = {
                box: group.append('rect')
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

            if (render) {
                this.render();
            }

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

        Component.prototype.render = function() {
            if (this._rendered) return this;

            var self = this;

            self.el.group.on('click.moveToFront', function() {
                self.el.group.moveToFront();
            });
            self.el.group.on('click.pubsub', function() {
                self.trigger('click', d3.event);
                Component.trigger('click', self, d3.event);
            });

            self.el.group.attr('opacity', 0);
            factory.container.node().appendChild(self.el.group.node());

            self.el.group.transition()
                .duration(500)
                .attr('opacity', 1);
            self._rendered = true;
        };

        Component.get = function(uuid) {
            return factory.components[uuid];
        }

        extend(Component, new PubSub);

        return Component;
    }

    return MohiniComponentFactory;
})();
