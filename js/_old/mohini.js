var Mohini;

(function(window, undefined) {
    if (!d3) {
        throw new Error('Could not find D3.js.');
    }

    Mohini = function(opts) {
        alf.util.extend(this, opts);
    };

    Mohini.prototype.getContainer = function() {
        return this.container;
    };

    Mohini.prototype.init = function() {
        var width, height;

        if (this.fullScreen) {
            width = window.innerWidth;
            height = window.innerHeight;
        } else {
            width = this.width;
            height = this.height;
        }

        var zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on('zoom', function() {
                container.attr('transform', 'translate(' + d3.event.translate + ')scale(' + d3.event.scale + ')');
            });

        this.svg = d3.select(this.container).append('svg')
                .attr('width', width)
                .attr('height', height)
                .call(zoom);
        this.container = svg.append('g');
    }
})(window);