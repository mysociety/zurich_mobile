/* 
 * Maps for FMZ using Zurich council's WMTS tile server 
 */

// From 'fullExtent' from http://www.gis.stadt-zuerich.ch/maps/rest/services/tiled95/LuftbildHybrid/MapServer?f=pjson
var layer_bounds = new OpenLayers.Bounds(
    2672499, // W
    1238999, // S
    2689999, // E
    1256999); // N

var matrix_ids = [
    {
        "matrixHeight": 7,
        "scaleDenominator": 241904.761905,
        "identifier": "0",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 13
      },
      {
        "matrixHeight": 14,
        "scaleDenominator": 120952.380952,
        "identifier": "1",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 25
      },
      {
        "matrixHeight": 28,
        "scaleDenominator": 60476.1904761,
        "identifier": "2",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 49
      },
      {
        "matrixHeight": 56,
        "scaleDenominator": 30238.0952382,
        "identifier": "3",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 97
      },
      {
        "matrixHeight": 111,
        "scaleDenominator": 15119.0476189,
        "identifier": "4",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 194
      },
      {
        "matrixHeight": 222,
        "scaleDenominator": 7559.52380964,
        "identifier": "5",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 388
      },
      {
        "matrixHeight": 443,
        "scaleDenominator": 3779.76190464,
        "identifier": "6",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 776
      },
      {
        "matrixHeight": 886,
        "scaleDenominator": 1889.8809525,
        "identifier": "7",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 1551
      },
      {
        "matrixHeight": 1772,
        "scaleDenominator": 944.940476071,
        "identifier": "8",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 3101
      },
      {
        "matrixHeight": 3544,
        "scaleDenominator": 472.470238214,
        "identifier": "9",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 6201
      },
      {
        "matrixHeight": 7087,
        "scaleDenominator": 236.235118929,
        "identifier": "10",
        "tileWidth": 512,
        "tileHeight": 512,
        "matrixWidth": 12402
      }
];

function fixmystreet_zurich_admin_drag() {
    var admin_drag = new OpenLayers.Control.DragFeature( fixmystreet.markers, {
        onComplete: function(feature, e) {
            var lonlat = feature.geometry.clone();
            lonlat.transform(
                fixmystreet.map.getProjectionObject(),
                new OpenLayers.Projection("EPSG:4326")
            );
            if (window.confirm( 'Richtiger Ort?' ) ) {
                // Store new co-ordinates
                document.getElementById('fixmystreet.latitude').value = lonlat.y;
                document.getElementById('fixmystreet.longitude').value = lonlat.x;
            } else {
                // Put it back
                var lat = document.getElementById('fixmystreet.latitude').value;
                var lon = document.getElementById('fixmystreet.longitude').value;
                lonlat = new OpenLayers.LonLat(lon, lat).transform(
                    new OpenLayers.Projection("EPSG:4326"),
                    fixmystreet.map.getProjectionObject()
                );
                fixmystreet.markers.features[0].move(lonlat);
            }
        }
    } );
    fixmystreet.map.addControl( admin_drag );
    admin_drag.activate();
}

$(function(){
    $('#map_layer_toggle').toggle(function(){
        $(this).text('Luftbild');
        fixmystreet.map.setBaseLayer(fixmystreet.map.layers[1]);
    }, function(){
        $(this).text('Stadtplan');
        fixmystreet.map.setBaseLayer(fixmystreet.map.layers[0]);
    });

    /* Admin dragging of pin */
    if (fixmystreet.page == 'admin') {
        if ($.browser.msie) {
            $(window).load(fixmystreet_zurich_admin_drag);
        } else {
            fixmystreet_zurich_admin_drag();
        }
    }
});

/* 
 * set_map_config() is called on dom ready in map-OpenLayers.js
 * to setup the way the map should operate.
 */
 function set_map_config(perm) {
    var on_mobile = $('html').hasClass('mobile');
    var in_app =  $("#app-container").length > 0;

    fixmystreet.controls = [
        new OpenLayers.Control.ArgParser(),
        new OpenLayers.Control.Navigation()
    ];

    if ( ( fixmystreet.page != 'report' || !on_mobile ) && !in_app ) {
        fixmystreet.controls.push( new OpenLayers.Control.PanZoomFMS({id: 'fms_pan_zoom' }) );
    }

    /* Linking back to around from report page, keeping track of map moves */
    if ( fixmystreet.page == 'report' && !in_app ) {
        fixmystreet.controls.push( new OpenLayers.Control.PermalinkFMS('key-tool-problems-nearby', '/around') );
    }

    setup_wmts_base_map();

    fixmystreet.area_format = { fillColor: 'none', strokeWidth: 4, strokeColor: 'black' };
}

function fms_marker_size_for_zoom(zoom) {
    if (zoom >= 6) {
        return 'normal';
    } else if (zoom >= 3) {
        return 'small';
    } else {
        return 'mini';
    }
}
