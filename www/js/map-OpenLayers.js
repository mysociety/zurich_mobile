OpenLayers.ImgPath = "../www/jslib/OpenLayers-2.10/img/";

function fixmystreet_activate_drag() {
    fixmystreet.drag = new OpenLayers.Control.DragFeature( fixmystreet.markers, {
        onComplete: function(feature, e) {
            fixmystreet_update_pin( feature.geometry.clone() );
        }
    } );
    fixmystreet.map.addControl( fixmystreet.drag );
    fixmystreet.drag.activate();
}

function fms_markers_list(pins, transform) {
    var markers = [];
    for (var i=0; i<pins.length; i++) {
        var pin = pins[i];
        var loc = new OpenLayers.Geometry.Point(pin[1], pin[0]);
        if (transform) {
            // The Strategy does this for us, so don't do it in that case.
            loc.transform(
                new OpenLayers.Projection("EPSG:4326"),
                fixmystreet.map.getProjectionObject()
            );
        }
        var marker = new OpenLayers.Feature.Vector(loc, {
            colour: pin[2],
            size: pin[5] || 'normal',
            id: pin[3],
            title: pin[4] || ''
        });
        markers.push( marker );
    }
    return markers;
}

function fixmystreet_onload() {
    var pin_layer_style_map = new OpenLayers.StyleMap({
        'default': new OpenLayers.Style({
            graphicTitle: "${title}",
            graphicOpacity: 1,
            graphicZIndex: 11,
            backgroundGraphicZIndex: 10
        })
    });
    pin_layer_style_map.addUniqueValueRules('default', 'size', {
        'normal': {
            externalGraphic: "img/pin-${colour}.png",
            graphicWidth: 48,
            graphicHeight: 64,
            graphicXOffset: -24,
            graphicYOffset: -64,
            backgroundGraphic: "img/pin-shadow.png",
            backgroundWidth: 60,
            backgroundHeight: 30,
            backgroundXOffset: -7,
            backgroundYOffset: -30
        },
        'big': {
            externalGraphic: "img/pin-${colour}-big.png",
            graphicWidth: 78,
            graphicHeight: 105,
            graphicXOffset: -39,
            graphicYOffset: -105,
            backgroundGraphic: "img/pin-shadow-big.png",
            backgroundWidth: 88,
            backgroundHeight: 40,
            backgroundXOffset: -10,
            backgroundYOffset: -35
        }
    });
    var pin_layer_options = {
        rendererOptions: {
            yOrdering: true
        },
        styleMap: pin_layer_style_map
    };
    if (fixmystreet.page == 'around') {
        fixmystreet.bbox_strategy = fixmystreet.bbox_strategy || new OpenLayers.Strategy.BBOX({ ratio: 1 });
        pin_layer_options.strategies = [ fixmystreet.bbox_strategy ];
        pin_layer_options.protocol = new OpenLayers.Protocol.HTTP({
            url: CONFIG.FMS_URL + 'ajax',
            params: fixmystreet.all_pins ? { all_pins: 1 } : { },
            format: new OpenLayers.Format.FixMyStreet()
        });
    }
    fixmystreet.markers = new OpenLayers.Layer.Vector("Pins", pin_layer_options);
    fixmystreet.markers.events.register( 'loadend', fixmystreet.markers, function(evt) {
        if (fixmystreet.map.popups.length) fixmystreet.map.removePopup(fixmystreet.map.popups[0]);
    });

    var markers = fms_markers_list( fixmystreet.pins, true );
    fixmystreet.markers.addFeatures( markers );
    if (fixmystreet.page == 'around' || fixmystreet.page == 'reports' || fixmystreet.page == 'my') {
        fixmystreet.select_feature = new OpenLayers.Control.SelectFeature( fixmystreet.markers );
        var selectedFeature;
        function onPopupClose(evt) {
            fixmystreet.select_feature.unselect(selectedFeature);
            OpenLayers.Event.stop(evt);
        }
        fixmystreet.markers.events.register( 'featureunselected', fixmystreet.markers, function(evt) {
            var feature = evt.feature, popup = feature.popup;
            fixmystreet.map.removePopup(popup);
            popup.destroy();
            feature.popup = null;
        });
        fixmystreet.markers.events.register( 'featureselected', fixmystreet.markers, function(evt) {
            var feature = evt.feature;
            selectedFeature = feature;
            var popup = new OpenLayers.Popup.FramedCloud("popup",
                feature.geometry.getBounds().getCenterLonLat(),
                null,
                feature.attributes.title + "<br><a class=\"report_pin\" id=\"report_" + feature.attributes.id + "\" href=/report/" + feature.attributes.id + ">More details</a>",
                { size: new OpenLayers.Size(0,0), offset: new OpenLayers.Pixel(0,-40) },
                true, onPopupClose);
            feature.popup = popup;
            fixmystreet.map.addPopup(popup);
        });
        fixmystreet.map.addControl( fixmystreet.select_feature );
        fixmystreet.select_feature.activate();
    } else if (fixmystreet.page == 'new') {
        fixmystreet_activate_drag();
    }
    fixmystreet.map.addLayer(fixmystreet.markers);

    fixmystreet.map.addControl( new OpenLayers.Control.Crosshairs(null) );
}

function show_map(){
    // Set specific map config - some other JS included in the
    // template should define this
    set_map_config(); 

    // Create the basics of the map
    fixmystreet.map = new OpenLayers.Map(
        "map", OpenLayers.Util.extend({
            controls: fixmystreet.controls,
            displayProjection: new OpenLayers.Projection("EPSG:4326")
        }, fixmystreet.map_options)
    );

    if ($('html').hasClass('mobile') && fixmystreet.page == 'around') {
        $('#fms_pan_zoom').css({ top: '2.75em !important' });
    }

    // Set it up our way
    fixmystreet.layer_options = OpenLayers.Util.extend({
        zoomOffset: fixmystreet.zoomOffset,
        transitionEffect: 'resize',
        numZoomLevels: fixmystreet.numZoomLevels
    }, fixmystreet.layer_options);

    var layer;
    if (fixmystreet.layer_options.matrixIds) {
        layer = new fixmystreet.map_type(fixmystreet.layer_options);
    } else {
        layer = new fixmystreet.map_type("", fixmystreet.layer_options);
    }
    fixmystreet.map.addLayer(layer);

    if (!fixmystreet.map.getCenter()) {
        var centre = new OpenLayers.LonLat( fixmystreet.longitude, fixmystreet.latitude );
        centre.transform(
            new OpenLayers.Projection("EPSG:4326"),
            fixmystreet.map.getProjectionObject()
        );
        fixmystreet.map.setCenter(centre, fixmystreet.zoom || 3);
    }

    if (fixmystreet.state_map && fixmystreet.state_map == 'full') {
        // TODO Work better with window resizing, this is pretty 'set up' only at present
        var $content = $('.content'), mb = $('#map_box'),
            q = ( $content.offset().left - mb.offset().left + $content.width() ) / 2;
        if (q < 0) { q = 0; }
        // Need to try and fake the 'centre' being 75% from the left
        fixmystreet.map.pan(-q, -25, { animate: false });
        fixmystreet.map.events.register("movestart", null, function(e){
            fixmystreet.map.moveStart = { zoom: this.getZoom(), center: this.getCenter() };
        });
        fixmystreet.map.events.register("zoomend", null, function(e){
            if ( fixmystreet.map.moveStart && !fixmystreet.map.moveStart.zoom && fixmystreet.map.moveStart.zoom !== 0 ) {
                return true; // getZoom() on Firefox appears to return null at first?
            }
            if ( !fixmystreet.map.moveStart || !this.getCenter().equals(fixmystreet.map.moveStart.center) ) {
                // Centre has moved, e.g. by double-click. Same whether zoom in or out
                fixmystreet.map.pan(-q, -25, { animate: false });
                return;
            }
            var zoom_change = this.getZoom() - fixmystreet.map.moveStart.zoom;
            if (zoom_change == -1) {
                // Zoomed out, need to re'centre'
                fixmystreet.map.pan(-q/2, 0, { animate: false });
            } else if (zoom_change == 1) {
                // Using a zoom button
                fixmystreet.map.pan(q, 0, { animate: false });
            }
        });
    }

    fixmystreet_onload();

    crosshairsControls = fixmystreet.map.getControlsByClass(
        "OpenLayers.Control.Crosshairs");
    for (i = 0; i < crosshairsControls.length; ++i) {
        crosshairsControls[i].reposition();
    }

    $('#mark-here').show();
    markHere = $('#mark-here');
    var newX = $(window).width() / 2 - markHere.width() / 2;
    var newY = $(window).height() * 4 / 6 - markHere.height() / 2;
    markHere.css({
        top: newY + "px"
    });
    $('#use-location').css({
        top: newY + "px"
    });
    var savedY = newY + 40;
    $('#saved-reports').css({
        top: savedY + "px"
    });
    $('#select-another').css({
        top: savedY + "px"
    });
}

/* Overridding the buttonDown function of PanZoom so that it does
   zoomTo(0) rather than zoomToMaxExtent()
*/
OpenLayers.Control.PanZoomFMS = OpenLayers.Class(OpenLayers.Control.PanZoom, {
    buttonDown: function (evt) {
        if (!OpenLayers.Event.isLeftClick(evt)) {
            return;
        }

        switch (this.action) {
            case "panup":
                this.map.pan(0, -this.getSlideFactor("h"));
                break;
            case "pandown":
                this.map.pan(0, this.getSlideFactor("h"));
                break;
            case "panleft":
                this.map.pan(-this.getSlideFactor("w"), 0);
                break;
            case "panright":
                this.map.pan(this.getSlideFactor("w"), 0);
                break;
            case "zoomin":
                this.map.zoomIn();
                break;
            case "zoomout":
                this.map.zoomOut();
                break;
            case "zoomworld":
                this.map.zoomTo(0);
                break;
        }

        OpenLayers.Event.stop(evt);
    }
});

/* Overriding Permalink so that it can pass the correct zoom to OSM */
OpenLayers.Control.PermalinkFMS = OpenLayers.Class(OpenLayers.Control.Permalink, {
    updateLink: function() {
        var separator = this.anchor ? '#' : '?';
        var href = this.base;
        if (href.indexOf(separator) != -1) {
            href = href.substring( 0, href.indexOf(separator) );
        }

        href += separator + OpenLayers.Util.getParameterString(this.createParams(null, this.map.getZoom()+fixmystreet.zoomOffset));
        // Could use mlat/mlon here as well if we are on a page with a marker
        if (this.anchor && !this.element) {
            window.location.href = href;
        }
        else {
            this.element.href = href;
        }
    }
});

/* Pan data handler */
OpenLayers.Format.FixMyStreet = OpenLayers.Class(OpenLayers.Format.JSON, {
    read: function(json, filter) {
        if (typeof json == 'string') {
            obj = OpenLayers.Format.JSON.prototype.read.apply(this, [json, filter]);
        } else {
            obj = json;
        }
        var current, current_near;
        if (typeof(obj.current) != 'undefined' && (current = document.getElementById('current'))) {
            current.innerHTML = obj.current;
        }
        if (typeof(obj.current_near) != 'undefined' && (current_near = document.getElementById('current_near'))) {
            current_near.innerHTML = obj.current_near;
        }
        var markers = fms_markers_list( obj.pins, false );
        return markers;
    },
    CLASS_NAME: "OpenLayers.Format.FixMyStreet"
});

OpenLayers.Control.Crosshairs = OpenLayers.Class.create();
OpenLayers.Control.Crosshairs.CROSSHAIR_SIDE = 100;
OpenLayers.Control.Crosshairs.DIV_ID = "OpenLayers_Control_Crosshairs_crosshairs";
OpenLayers.Control.Crosshairs.prototype =
  OpenLayers.Class.inherit( OpenLayers.Control, {
    element: null,
    position: null,

    initialize: function(element) {
        OpenLayers.Control.prototype.initialize.apply(this, arguments);
        this.element = OpenLayers.Util.getElement(element);
        this.imageSize = new OpenLayers.Size(OpenLayers.Control.Crosshairs.CROSSHAIR_SIDE,
                                             OpenLayers.Control.Crosshairs.CROSSHAIR_SIDE);
    },

    draw: function() {
        var position;
        OpenLayers.Control.prototype.draw.apply(this, arguments);
        position = this.getIdealPosition();
        this.buttons = new Array();
        var imgLocation = OpenLayers.Util.getImagesLocation() + "crosshairs-100.png";
        return OpenLayers.Util.createAlphaImageDiv(OpenLayers.Control.Crosshairs.DIV_ID,
                 position, this.imageSize, imgLocation, "absolute");
    },

    getIdealPosition: function() {
        this.map.updateSize();
        var mapSize = this.map.getSize();
        var center = this.map.getCenter();
        var px = this.map.getPixelFromLonLat( center );
        return new OpenLayers.Pixel( px.x - ( this.imageSize.w / 2 ),
                                     px.y - ( this.imageSize.h / 2 ) );
    },

    getMapPosition: function() {
        var left = parseInt( $('#' + OpenLayers.Control.Crosshairs.DIV_ID).css('left') );
        var top = parseInt( $('#' + OpenLayers.Control.Crosshairs.DIV_ID).css('top') );

        left += ( this.imageSize.w / 2 );
        top += ( this.imageSize.h / 2 );

        var pos = this.map.getLonLatFromViewPortPx( new OpenLayers.Pixel( left, top ) );
        return pos;
    },

    reposition: function() {
        var position = this.getIdealPosition();
        $('#' + OpenLayers.Control.Crosshairs.DIV_ID).css({
            left: position.x,
            top: position.y});
    },

    CLASS_NAME: "OpenLayers.Control.Crosshairs"
});

