/**
 * MohiniComponentFactory
 */
var MohiniComponentFactory = (function() {
    // Component events.
    var Events = {
        DESTROY: 'destroy',
        MOVE: 'move'
    };

    var DEFAULTS = {
        border_radius: 5,
        font_size: 10,
        font_dy: -5
    };

    var MohiniComponentFactory = function MohiniComponentFactory(mohini) {
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
            self.uuid = uuid;

            if (!data.x || !data.y) {
                var mid = mohini.getMidCoords();
                data.x = data.x || mid[0];
                data.y = data.y || mid[1];
            }

            if (data.symbol) {
                data.symbol.padding = data.symbol.padding || 10;
                data.symbol.x = data.w/2 - data.symbol.w/2;
                data.symbol.y = data.symbol.padding;
            }

            if (!data.font_dx) {
                data.font_dx = data.w/2;
            }

            // Extend self with defaults and then the input data.
            extend(self, DEFAULTS, data);
            // Extend pubsub.
            extend(self, new PubSub);

            self._dirty = true;

            var group = d3.select(createSVGElement('g'))
                    .data([self])
                    .attr('uuid', uuid)
                    .attr('class', 'component')
                    .attr('transform', function(d) { return 'translate(' + d.x + ', ' + d.y + ')'; })

            if (self.draggable) {
                group.call(factory._drag);
            }

            self.el = {
                box: group.append('rect')
                    .attr('width', function(d) { return d.w; })
                    .attr('height', function(d) { return d.h; })
                    .attr('rx', self.border_radius)
                    .style({
                        'stroke-width': 1 + 'px'
                    })
                    .attr('ry', self.border_radius),

                label: group.append('text')
                    .attr('width', function(d) { return d.w; })
                    .attr('height', function(d) { return d.h; })
                    .attr('dx',  function(d) { return d.font_dx; })
                    .attr('dy',  function(d) { return d.font_dy; })
                    .attr('text-anchor', 'middle')
                    .style('font', self.font_size + 'px ' + (self.ff || 'sans-serif'))
                    .text(function(d) { return d.name || ''; }),

                group: group
            };

            if (data.symbol && data.symbol.url) {
                self.el.symbol = group.append('image')
                    .attr('y', function(d) { return d.symbol.y; })
                    .attr('x', function(d) { return d.symbol.x; })
                    .attr('width', data.symbol.w || data.w)
                    .attr('height', data.symbol.h || data.h)
                    .attr('xlink:href', data.symbol.url);
            }

            factory.components[uuid] = self;

            if (render) {
                this.render();
            }

            return self;
        }

        Component.prototype.getCoords = function CompGetCoords() {
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

        Component.prototype.destroy = function CompDestroy() {
            each(this.el, function(ele) {
                ele.remove();
            });
            delete factory.components[this.uuid];
            this.trigger(Events.DESTROY);
        };

        Component.prototype.moveTo = function CompMoveTo(x, y) {
            // If you transform the group, all the group children take their
            // positions in relation to the group's position.
            this.x = x;
            this.y = y;
            this.el.group.attr('transform', 'translate(' + x + ', ' + y + ')');
            this._dirty = true;
            this.trigger(Events.MOVE);
        };

        Component.prototype.render = function CompRender() {
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

        Component.prototype.isActive = function CompIsActive(val) {
            if (val !== undefined) {
                this._isActive = !!val;
            }
            return !!this._isActive;
        };

        Component.prototype.toggleActive = function CompToggleActive() {
            var ia = !this.isActive();
            this.el.group.classed('active', ia);
            this.isActive(ia);
        };

        Component.get = function CompGet(uuid) {
            return factory.components[uuid];
        };

        Component.setDefaults = function(defs) {
            extend(DEFAULTS, defs);
        };

        Component.Events = Events;
        // Extend pubsub.
        extend(Component, new PubSub);
        return Component;
    }

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

    return MohiniComponentFactory;
})();
