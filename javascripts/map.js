var colours = ['#001a66', '#0033cc', '#3366ff', '#99b3ff'];

var drawMap = function(url, div_id, centre, zoom, layer) {
    $.getJSON(url, function(data) {
        var osMap = new OpenSpace.Map(div_id);
        osMap.setCenter(centre, zoom);

        var ost = new OSThematic(osMap);

        ost.setData(data);

        ost.setColours(colours);
        ost.setOpacity(0.6);
        ost.setLayers([layer]);

        ost.drawMap();
    });
};

var drawLegend = function() {
    $('#legend').html(
        '<table><tbody>' +
        '<tr><td bgcolor="'+colours[0]+'">&nbsp;</td><td>Most Engaged</td></tr>' +
        '<tr><td bgcolor="'+colours[1]+'">&nbsp;</td><td>&nbsp;</td></tr>' +
        '<tr><td bgcolor="'+colours[2]+'">&nbsp;</td><td>&nbsp;</td></tr>' +
        '<tr><td bgcolor="'+colours[3]+'">&nbsp;</td><td>Least Engaged</td></tr>' +
        '</tbody></table>');
};
