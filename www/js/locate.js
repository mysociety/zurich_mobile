var Locate = ( function() { return {
    lookup: function(q) {
        var that = this;
        if (!q) {
            this.trigger('failed', { msg: "Please enter location" } );
            return false;
        }

        var url = CONFIG.FMS_URL + '/ajax/lookup_location?term=' + q;

        var x = $.ajax( {
            url: url,
            dataType: 'json',
            timeout: 30000,
            success: function(data, status) {
                if ( status == 'success' ) {
                    if ( data.latitude ) {
                        that.trigger('located', { latitude: data.latitude, longitude: data.longitude } );
                    } else if ( data.suggestions ) {
                        that.trigger( 'failed', { locs: data.suggestions } );
                    } else {
                        that.trigger( 'failed', { msg: data.error } );
                    }
                } else {
                    that.trigger( 'failed', { msg: 'Location not found: ' + status } );
                }
            },
            error: function(data, status, errorThrown) {
                that.trigger( 'failed', { msg: 'Location not found, error: ' + status } );
            }
        } );
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

                this.trigger('failed', { msg: 'Could not determine your location' } );
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
                that.trigger('located', coords)
            },
            error: function (data, status, errorThrown) {
                that.trigger('failed', { msg: 'Could not check your location' } );
            }
        } );
    }

}});
