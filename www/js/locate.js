var Locate = ( function() { return {
    valid_postcode: function(pc) {
        var out_pattern = '[A-PR-UWYZ]([0-9]{1,2}|([A-HIK-Y][0-9](|[0-9]|[ABEHMNPRVWXY]))|[0-9][A-HJKSTUW])';
        var in_pattern = '[0-9][ABD-HJLNP-UW-Z]{2}';
        var full_pattern = '^' + out_pattern + in_pattern + '$';
        var postcode_regex = new RegExp(full_pattern);

        pc = pc.toUpperCase().replace(/\s+/, '');
        if ( postcode_regex.test(pc) ) {
            return true;
        }

        return false;
    },

    lookup_string: function(q, successCallback, failureCallBack ) {
        var i;
        q = q.toLowerCase();
        q = q.replace(/[^\-&\w ']/, ' ');
        q = q.replace(/\s+/, ' ');

        if (!q) {
            failureCallBack( { msg: "Please enter location" } );
            return false;
        }

        var url = "http://dev.virtualearth.net/REST/v1/Locations?q=" + escape(q);
        url += '&c=en-GB&key=' + CONFIG.BING_API_KEY;
        var x = jQuery.ajax( {
            url: url,
            dataType: 'json',
            timeout: 30000,
            success: function(data, status) {
                if ( status == 'success' ) {
                    var valid_locations = 0;
                    var latitude = 0;
                    var longitude = 0;
                    var multiple = [];

                    for ( i = 0; i < data.resourceSets[0].resources.length; i++ ) {
                        var details = data.resourceSets[0].resources[i];
                        if ( details.address.countryRegion != 'United Kingdom' ) { continue; }
                        var address = details.name;

                        latitude = details.point.coordinates[0];
                        longitude = details.point.coordinates[1];
                        latitude = latitude.toPrecision(6);
                        longitude = longitude.toPrecision(6);

                        multiple.push( { 'address': address, 'latitude': latitude, 'longitude': longitude } );
                        valid_locations += 1;
                    }

                    if ( valid_locations == 1 ) {
                        successCallback( latitude, longitude );
                    } else if ( valid_locations === 0 ) {
                        failureCallBack({ msg: 'Location not found' } );
                    } else {
                        failureCallBack( { msg: "Multiple locations found, please select one", locs: multiple } );
                    }
                } else {
                    failureCallBack({ msg: "Could not find your location" });
                }
            },
            error: function (data, status, errorThrown) {
                failureCallBack({ msg: "Could not find your location" });
            }
        });
        return false;
    },

    locate_by_pc: function( pc, successCallback, failureCallBack) {
        if (!pc) {
            failureCallBack( { msg: "Please enter your location" } );
            return false;
        }

        if ( this.valid_postcode( pc ) ) {
            jQuery.ajax( {
                    url: CONFIG.MAPIT_URL + 'postcode/' + pc + '.json',
                    dataType: 'json',
                    timeout: 30000,
                    success: function(data, status) {
                        if ( status == 'success' ) {
                           successCallback( data.wgs84_lat, data.wgs84_lon );
                       } else {
                           failureCallBack({ msg: 'Could not locate postcode' } );
                       }
                    },
                    error: function (data, status, errorThrown) {
                        if ( data.status == 404 ) {
                            failureCallBack({ msg: 'Please enter a valid UK postcode' } );
                        } else {
                            failureCallBack({ msg: 'Could not locate postcode' } );
                        }
                    }
            } );
        } else {
            this.lookup_string(pc, successCallback, failureCallBack);
        }
        return false;
    },

    geolocate: function() {
        var that = this;
        this.watch_id = navigator.geolocation.watchPosition(
            function(location) {
                if ( that.watch_id == undefined ) { console.log( 'no watch id' ); return; }
                navigator.geolocation.clearWatch( that.watch_id );

                that.check_location(location.coords);
            },
            function() {
                if ( that.watch_id == undefined ) { return; }
                navigator.geolocation.clearWatch( that.watch_id );

                this.trigger('failed', 'Could not determine your location');
            },
            { timeout: 7000, enableHighAccuracy: true }
        );
    },

    check_location: function(coords) {
        var that = this;
        $.ajax( {
            url: CONFIG.FMS_URL + 'report/new/ajax',
            dataType: 'json',
            data: {
                latitude: coords.latitude,
                longitude: coords.longitude
            },
            timeout: 10000,
            success: function(data) {
                if (data.error) {
                    that.trigger('failed', data.error);
                    return;
                }
                that.trigger('located', coords)
            },
            error: function (data, status, errorThrown) {
                that.trigger('failed', 'Could not check your location');
            }
        } );
    }

}});
