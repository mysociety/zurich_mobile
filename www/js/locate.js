var Locate = ( function() { return {
    locating: 0,

    lookup: function(q) {
        var that = this;
        if (!q) {
            this.trigger('failed', { msg: STRINGS.missing_location } );
            return false;
        }

        var url = CONFIG.FMS_URL + 'ajax/lookup_location?term=' + q;

        var x = $.ajax( {
            url: url,
            dataType: 'json',
            timeout: 30000,
            success: function(data, status) {
                if ( status == 'success' ) {
                    if ( data.latitude ) {
                        that.trigger('located', { coordinates: { latitude: data.latitude, longitude: data.longitude } } );
                    } else if ( data.suggestions ) {
                        that.trigger( 'failed', { locs: data.suggestions } );
                    } else {
                        that.trigger( 'failed', { msg: data.error } );
                    }
                } else {
                    that.trigger( 'failed', { msg: STRINGS.location_problem } );
                }
            },
            error: function(data, status, errorThrown) {
                that.trigger( 'failed', { msg: STRINGS.location_problem } );
            }
        } );
    },

    geolocate: function() {
        this.locating = 1;

        var that = this;
        this.watch_id = navigator.geolocation.watchPosition(
            function(location) {
                if ( that.watch_id == undefined ) { console.log( 'no watch id' ); return; }
                that.locating = 0;
                navigator.geolocation.clearWatch( that.watch_id );
                that.check_location(location.coords);
            },
            function() {
                that.locating = 0;
                navigator.geolocation.clearWatch( that.watch_id );
                that.trigger('failed', { msg: STRINGS.geolocation_failed } );
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
                    that.trigger('failed', { msg: data.error } );
                    return;
                }
                that.trigger('located', { coordinates: coords, details: data } )
            },
            error: function (data, status, errorThrown) {
                that.trigger('failed', { msg: STRINGS.location_check_failed } );
            }
        } );
    }

}});
