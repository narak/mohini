(function() {
    if (!Mohini) {
        throw new Error('Could not find Mohini. I has a sad.');
    }

    var config = {
            container: null,
            pathContainer: null,
            componentContainer: null,
            width: 50,
            height: 50
        },
        compHash = {};

    var drag = d3.behavior.drag()
        .origin(function(d) { return d; })
        .on('dragstart', function(d) {
            d3.event.sourceEvent.stopPropagation();
            d3.select(this).classed('dragging', true);
        })
        .on('drag', function(d) {
            d.x = d3.event.x;
            d.y = d3.event.y;
            d3.select(this)
                .attr('transform', 'translate(' + d.x + ',' + d.y + ')');
        })
        .on('dragend', function(d) {
            d3.select(this).classed('dragging', false);
            compHash[this.id].calc();;
        });

    Mohini.prototype.Component = function(opts) {
        if (!opts) {
            throw new Error('Insufficient parameters to initialize Component.');
        }

        var drawNow = !!opts.draw;
        delete opts.draw;

        this.data = opts;
        this.id = 'id-' + alf.util.guid();
        this.connectors = {};

        compHash[this.id] = this;

        if (drawNow) {
            this.draw();
        }

        this.calc();
    };

    Component.setContainer = function(container) {
        config.container = container;
        container.empty();

        // config.pathContainer = container.append('g').attr('class', 'pathContainer');
        if ()
        config.componentContainer = container.append('g').attr('class', 'componentContainer');
    };

    Mohini.prototype.Component.prototype.calc = function() {
        this.center = {
            x: this.data.x + ( this.data.w / 2 ),
            y: this.data.y + ( this.data.h / 2 )
        };
    };

    Mohini.prototype.Component.prototype.draw = function() {
        if (!config.container) {
            throw new Error('Container not set.');
        }

        this.g = config.componentContainer.append('g')
            .data([this.data])
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('id', this.id)
            .call(drag);

        this.rect = this.g.append('rect')
            .attr('class', 'component')
            .attr('width', function(d) { return d.w; })
            .attr('height', function(d) { return d.h; })
            .attr('x', function(d) { return d.x; })
            .attr('y', function(d) { return d.y; })
            .attr('rx', 5)
            .attr('ry', 5);

        this.label = this.g.append('text')
            .attr('width', function(d) { return d.w; })
            .attr('height', function(d) { return d.h; })
            .attr('x', function(d) { return d.x + (d.w / 2); })
            .attr('y', function(d) { return d.y + 10; })
            .attr('text-anchor', 'middle')
            .text(function(d) { return d.l; });
    };

    Component.prototype.connect = function(dest) {
        if (!dest) {
            throw new Error('Cannot connect to undefined destination.');
        }

        var line = config.pathContainer.append('line')
            .attr('x1', this.center.x)
            .attr('y1', this.center.y)
            .attr('x2', dest.center.x)
            .attr('y2', dest.center.y)
            .attr("stroke", "blue")
            .attr("stroke-width", 2);

        this.connectors[dest.id] = {
            component: dest,
            line: line
        };
    };

})();