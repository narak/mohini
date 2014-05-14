// Add fn to d3.
d3.selection.prototype.moveToFront = function() {
  return this.each(function(){
    this.parentNode.appendChild(this);
  });
};

// Because d3 doesn't do event delagation... dafaq.
var matchesSelector = (function() {
    var el = document.documentElement,
        _matcher = el.matches || el.webkitMatchesSelector || el.mozMatchesSelector ||
            el.msMatchesSelector || el.oMatchesSelector;

    return function(el, selector) {
        return _matcher.call(el, selector);
    };
})();

// UUID.
var generateUUID = (function() {
    var id = 0;
    return function(prefix) {
        prefix = prefix || 'uuid';
        return prefix + '-' + id++;
    };
})();

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

var defaultZoom = 1,
    zoom = d3.behavior.zoom()
    .scaleExtent([.1, 10])
    .on('zoom', function() {
        container.attr('transform', 'translate(' + d3.event.translate + ') scale(' + d3.event.scale + ')');
    });

var // width = window.innerWidth,
//     height = window.innerHeight - 5,
    svg = d3.select('#svg-container').append('svg')
        // .attr('width', width)
        // .attr('height', height)
        .call(zoom),
    container = svg.append('g'),
    connectorContainer = container.append('g'),
    compContainer = container.append('g');

// function updateWindow(){
//     width = window.innerWidth;
//     height = window.innerHeight - 5;
//     svg.attr('width', width).attr('height', height);
// }
// window.onresize = updateWindow;

// Set the initial visual zoom.
container.attr('transform', 'translate(0,0)scale(' + defaultZoom + ')');
// This sets the internal values for d3 so it doesn't jump when you do an actual zoom.
zoom.translate([0,0]).scale(defaultZoom);

function scaleToInitialZoom(val) {
    return (val / defaultZoom).toFixed(3);
}
