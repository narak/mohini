// Add fn to d3.
d3.selection.prototype.moveToFront = function() {
    return this.each(function(){
        this.parentNode.appendChild(this);
    });
};

// The coordinates need to be translated and scaled because, presumably,
// the x, y coords are coming in relation to the window because it is a
// mouse event. We need to scale/translate this to our svg.
var translateNScale = function(xy, y, obj) {
    var svgDim = svg.node().getBoundingClientRect(),
        translate = zoom.translate(),
        scale = zoom.scale(),
        x, y;

    if (y) {
        x = xy;
    } else if (xy) {
        x = xy.x;
        y = xy.y;
    }

    x = ((x - translate[0]) / scale) - svgDim.left;
    y = ((y - translate[1]) / scale) - svgDim.top;

    if (obj) {
        obj.x = x;
        obj.y = y;
    }

    return [x, y];
};

var zoom = d3.behavior.zoom()
        .scaleExtent([.1, 10])
        .on('zoom', function() {
            container.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
        }),
    svg = d3.select('#svg-container').append('svg')
        .call(zoom),
    container = svg.append('g'),
    connectorContainer = container.append('g'),
    compContainer = container.append('g');

function zoomTo(val) {
    container.attr('transform', 'translate(0,0) scale(' + val + ')');
    zoom.translate([0, 0]).scale(val);
}