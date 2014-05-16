// [TODO]
// Figure out how mid markers aren't working.
// - Apparently unless you have straight lines marker-mids don't work. dafaq.
//   SO fuck them. Fixed marker ends with funky orientation changes in calcEdgeCoords.
//
// Grouping - Complicated logic, will take time.
//
// Meta information on a component/connector - ?
// Image support for components - ?
//
// Events -
// - DOM Events: Components and connectors should redirect DOM events on their
//   elements through PubSub so that other can listen to them on the Objects
//   instead of being aware of its elements and listening on that.
// - Events[connect, destroy, move, add, etc.]: These events should be used to
//   communicate between components and connectors, and avoid talking directly.


/**
 * Creates an instance of Mohini.
 * @param {object} opts Options object used to configure the mohini instance.
 *                      Example: {
 *                          container: {string|Element|D3 Element}
 *                          width:     {string|number}
 *                          height:    {string|number}
 *                      }
 * @return {object} Instance of mohini.
 */
var Mohini = (function() {
    var Mohini;

    Mohini = function Mohini(opts) {
        if (!(this instanceof Mohini)) {
            throw new Error('Wrong usage of factory. Use `new Mohini()`.');
        }

        opts = opts || {};

        var self = this;

        extend(self, new PubSub);

        self._zoom = d3.behavior.zoom()
            .on('zoom', function() {
                self.container.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
            });

        if (opts.container) {
            self.mainContainer = typeof container === 'string' || isElement(opts.container) ?
                d3.select(opts.container) :
                opts.container;
        } else {
            throw new Error('Cannot create instance of Mohini without a container.');
        }

        // Sort out mainContainer, svg and container.
        if (self.mainContainer.node() instanceof SVGElement) {
            var div = document.createElement('div');
            self.mainContainer.node().parentNode.insertBefore(div, self.mainContainer.node());
            div.appendChild(self.mainContainer.node());
            self.svg = self.mainContainer;
            self.mainContainer = d3.select(div);
        } else {
            self.svg = self.mainContainer.append('svg');
        }
        self.container = self.svg.append('g');

        // Plugin d3js zoom behaviour.
        self.svg.call(self._zoom);

        opts.width && self.svg.attr('width', opts.width);
        opts.height && self.svg.attr('height', opts.height);

        // Add factories.
        self.Connector = new MohiniConnectorFactory(self);
        self.Component = new MohiniComponentFactory(self);

        // Alias.
        self.connect = self.Connector.connect;

        return self;
    }

    /**
     * Transforms and scales the coordinates from the window coordinate space
     * to the svg coordinate space.
     * @param  {object|number} xy  Object containinig x and y attributes to be
     *                             transformed or x coordinate as number.
     * @param  {number} y   y coordinate as number.
     * @param  {object} obj Object to which the transformed x and y values will
     *                      added as attributes.
     * @return {array}      Transformed values as [x, y].
     */
    Mohini.prototype.transform = function(xy, y, obj) {
        var self = this,
            svgDim = self.svg.node().getBoundingClientRect(),
            translate = self._zoom.translate(),
            scale = self._zoom.scale(),
            x, y;

        if (y) {
            x = xy;
        } else if (xy) {
            x = xy.x;
            y = xy.y;
        }
        if (x === undefined || y === undefined) {
            return null;
        }

        // x             : Take the coord from window coord space.
        // - translate[0]: Move coord by current translate from SVG coord space.
        //  - svgDim.left: Move coord by current SVG position in window coord space.
        //        / scale: Scale the coord by the SVG coord space.
        x = ((x - translate[0] - svgDim.left) / scale);
        y = ((y - translate[1] - svgDim.top) / scale);

        if (obj) {
            obj.x = x;
            obj.y = y;
        }

        return [x, y];
    };

    /**
     * Set the zoom programmatically.
     * @param  {val} val Zoom scale.
     */
    Mohini.prototype.zoom = function(val) {
        this.container.attr('transform', 'translate(0,0) scale(' + val + ')');
        this._zoom.translate([0, 0]).scale(val);
        return this;
    };

    /**
     * Gets the mid x, y of the Mohini canvas regardless of the transform/scale.
     * @return {array} [x, y]
     */
    Mohini.prototype.getMidCoords = function() {
        var dim = this.svg.node().getBoundingClientRect(),
            w = dim.right - dim.left,
            h = dim.bottom - dim.top;
        return this.transform.apply(this, [w/2, h/2]);
    };

    extend(Mohini, new PubSub);
    return Mohini;
})();
