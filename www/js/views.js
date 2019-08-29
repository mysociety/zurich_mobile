;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        ZurichView: Jr.View.extend({
            is_android: -1,

            check_if_android: function() {
                if ( this.is_android == -1 ) {
                    if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                        this.is_android = parseInt(device.version,10);
                    } else {
                        this.is_android = 0;
                    }
                }
                return this.is_android;
            },

            render: function(){
                if ( !this.template ) {
                    console.log('no template to render');
                    return;
                }
                template = _.template( tpl.get( this.template ) );
                if ( this.model ) {
                    this.$el.html(template(this.model.toJSON()));
                } else {
                    this.$el.html(template());
                }
                this.fixNavButtons();
                this.afterRender();
                return this;
            },

            fixNavButtons: function() {
                // android doesn't support gradients in image mask so we need to
                // add them dynamically
                if ( typeof device !== 'undefined' && ( device.platform.contains('iPhone') || device.platform.contains('iPad') || device.platform.contains('iOS') ) ) {
                    this.$('.bar-title .button-prev').addClass('button-gradient');
                    this.$('.bar-title .button-next').addClass('button-gradient');
                } else {
                    this.$('.bar-title .button-prev').hide();
                    this.$('.bar-title .button-next').hide();
                    if ( typeof device !== 'undefined' && device.platform == 'Android' && parseInt(device.version,10) < 3 ) {
                        this.$('.bar-title').css('height', '34px');
                    }
                }
            },

            fixContentPosition: function() {
                // Android displays slightly odd behaviour with the
                // 'position: fixed !important' that's applied to the .content
                // element - it doesn't render when the page is loaded. This
                // workaround removes the .content class and immediately puts
                // it back, which seems to solve the problem.
                if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                    var $content = this.$el.find(".content");
                    if ($content.length) {
                        $content.removeClass('content');
                        setTimeout(function() {
                            $content.addClass('content');
                        }, 0);
                    }
                }
            },

            preventScroll: function(e) { e.preventDefault(); return false; },

            disableScrolling: function() {
                if ( typeof cordova !== 'undefined' ) {
                    cordova.plugins.Keyboard.disableScroll(true);
                }
            },

            enableScrolling: function() {
                if ( typeof cordova !== 'undefined' ) {
                    cordova.plugins.Keyboard.disableScroll(false);
                }
            },

            afterRender: function() {
                this.fixContentPosition();
            },

            navigate: function( target, direction ) {
                var opts = { trigger: true };

                /* On android the css transitions involved can cause form inputs
                 * to appear in the wrong place so we disable these, particularly
                 * as they did nothing in the first place */
                if ( this.check_if_android() === 0 ) {
                    var dir = Jr.Navigator.directions.RIGHT;
                    if ( direction == 'left' ) {
                        dir = Jr.Navigator.directions.LEFT;
                    }

                    opts.animation = {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: dir
                    };
                }

                Jr.Navigator.navigate(target, opts);
            },

            onClickButtonPrev: function() {
                this.navigate( this.prev, 'right' );
            },

            onClickButtonNext: function() {
                this.navigate( this.next, 'left' );
            },

            displayError: function(msg) {
                console.log( 'displayError: ' + msg );
                /* There seems to be some issue with the event for the button of the
                 * faux alerts on android so use the system alert instead */
                if ( typeof device !== 'undefined' && ( device.platform.contains('iPhone') || device.platform.contains('iPad') || device.platform.contains('iOS') ) ) {
                    $('#error #msg').html(msg);
                    $('#errorOverlay').show();
                } else {
                    // we're using an alert box which on some android versions does not display entities
                    // properly so we use this quick hack to decode them
                    var decoded = $('<div/>').html(msg).text();
                    if ( navigator.notification ) {
                        navigator.notification.alert( decoded, null, 'Züri wie neu' );
                    } else {
                        alert( decoded );
                    }
                }
            },

            hideError: function() {
                $('#errorOverlay').hide();
            },

            validation_error: function( id, error ) {
                var el_id = '#' + id + '_label';
                var err_id = '#' + id + '_error';
                var el = $('label[for='+id+']');
                var err = '<span id="' + err_id + '" for="' + id + '" class="form-error"> ' + error + '</span>';
                if ( $('span[for='+id+']').length === 0 ) {
                    el.append(err);
                }
            },

            _disableUI: function() {
                this.$("input, textarea, button").prop("disabled", true);
                this.undelegateEvents();
            },

            _enableUI: function() {
                this.$("input, textarea, button").prop("disabled", false);
                this.delegateEvents();
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        HomeView: FMS.ZurichView.extend({
            template: 'around',
            next: 'photo',

            render: function(){
                var that = this;

                // Recent iOS versions appear to suffer a bug where the
                // DOM elements are all rendered offset from where they
                // should be (and where the DOM inspector thinks they are!)
                // when this view is shown immediately after the keyboard is
                // dismissed (for example the first time the app is run)
                // and the user details are captured.
                // This hack re-renders the view to combat this problem.
                if (FMS.firstRun) {
                    setTimeout(function() {
                        FMS.firstRun = false;
                        that.render();
                    }, 1000);
                    return this;
                }

                $.get("templates/" + this.template + ".html", function(template){
                    //var html = $(template);
                    that.$el.html(template);
                    that.fixNavButtons();
                    that.afterRender();
                    // This needs to be set up as its own event handler, not using
                    // Backbone .events, as it's a jQuery event.
                    $(fixmystreet).on("clickmap", function(e, lonlat) {
                        that.setReportPosition(lonlat);
                    });
                });
                return this;
            },

            afterRender: function() {
                var viewHeight = $(window).height(),
                contentHeight = viewHeight - 40; // - footer.outerHeight();
                $('#map_box').css({
                    position: 'absolute',
                    top: 0, left: 0, right: 0, bottom: 0,
                    height: contentHeight,
                    margin: 0
                });

                var that = this;
                this.$( "#pc" ).autocomplete({
                    minLength: 3,
                    select: function(event, ui) {
                        $(this).val(ui.item.value);
                        that.onClickSearch();
                        return true;
                    },
                    source: function( request, response ) {
                        if ( that.xhr ) {
                            that.xhr.abort();
                        }
                        that.xhr = $.ajax({
                            url: CONFIG.FMS_URL + "ajax/geocode",
                            global: false,
                            data: request,
                            dataType: "json",
                            success: function( data ) {
                                response( data );
                            },
                            error: function() {
                                response( [] );
                            }
                        });
                    }
                });

                if ( FMS.currentLocation ) {
                    this.showMap( { coordinates: { latitude: FMS.currentLocation.lat, longitude: FMS.currentLocation.lon }, set_marker_position: true } );
                } else if ( this.model.get('lat') && this.model.get('lon') ) {
                    this.showMap( { coordinates: { latitude: this.model.get('lat'), longitude: this.model.get('lon') }, set_marker_position: true } );
                } else {
                    // this is because on android the timing is such that the ajaxStop event
                    // on the call to get the template can fire after locate is called and so
                    // dismisses the wait dialog and the user is left staring at a blank map
                    // while geolocation whirs away
                    var that = this;
                    window.setTimeout( function() { that.locate(null, true); }, 20 );
                }

                if (FMS.seen_welcome) {
                    $("#welcome_wrapper").hide();
                }
                this.fixContentPosition();
            },

            locate: function(e, initial) {
                if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                    navigator.notification.activityStart('', STRINGS.please_wait);
                } else {
                    $('#ajaxOverlay').show();
                }

                var that = this;
                var l = new Locate();
                _.extend(l, Backbone.Events);
                l.on('located', function(info) {
                    if (!initial) {
                        // We're being called as a result of the user clicking the 'locate' button,
                        // and don't want to set the green marker position for the report.
                        info.set_marker_position = false;
                    }
                    that.showMap(info);
                });
                l.on('failed', this.noMap, this );

                l.geolocate();
            },

            showMap: function( info ) {
                if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                    navigator.notification.activityStop();
                } else {
                    $('#ajaxOverlay').hide();
                }
                var coords = info.coordinates;
                var centre = new OpenLayers.LonLat( coords.longitude, coords.latitude );
                if (info.set_marker_position) {
                    fixmystreet.latitude = coords.latitude;
                    fixmystreet.longitude = coords.longitude;
                    this.setReportPosition(centre);
                }
                if ( !fixmystreet.map ) {
                    show_map(centre);
                } else {
                    centre.transform(
                        new OpenLayers.Projection("EPSG:4326"),
                        fixmystreet.map.getProjectionObject()
                    );
                    fixmystreet.map.panTo(centre);
                    if (info.set_marker_position && fixmystreet.new_marker) {
                        fixmystreet.new_marker.features[0].move(centre);
                    }
                }
                this.positionMarkHere();
            },

            noMap: function( details ) {
                if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                    // set a timeout here as if GPS is disabled then there seems to be a timing/thread issue
                    // with when this and it doesn't dismiss the activity indicator on Android 4.1.x
                    window.setTimeout( function() { navigator.notification.activityStop(); }, 1000 );
                } else {
                    $('#ajaxOverlay').hide();
                }
                if ( details.msg ) {
                    this.displayError( details.msg );
                } else if ( details.locs ) {
                    this.displayError( STRINGS.multiple_locations );
                } else {
                    this.displayError( STRINGS.location_problem );
                }
            },

            positionMarkHere: function() {
                if (FMS.currentLocation) {
                    $('#mark-here').show();
                    $('#tap-the-map').hide();
                } else {
                    $('#mark-here').hide();
                    $('#tap-the-map').show();
                }
                $('#relocate').show();
            },

            events: {
                'touchmove #home-header': 'preventScroll',
                'touchmove .page-title': 'preventScroll',
                'touchmove #map_box': 'preventScroll',
                'touchmove #relocate': 'preventScroll',
                'touchmove #mark-here': 'preventScroll',
                'touchmove #swap-map': 'preventScroll',
                'touchmove #search': 'preventScroll',
                'click .button-next': 'onClickButtonNext',
                'click #btn-search': 'onClickSearch',
                'submit #mapForm': 'onClickSearch',
                'click #mark-here': 'onClickButtonNext',
                'click .report_pin': 'onClickReport',
                'click #closeError': 'hideError',
                'click .button-menu': 'onClickMenu',
                'click #swap-map': 'onSwapMap',
                'click #relocate': 'locate',
                'click #dismiss_welcome': 'onClickDismissWelcome'
            },

            setReportPosition: function(lonlat) {
                FMS.currentLocation = {
                    lon: lonlat.lon,
                    lat: lonlat.lat
                };
                this.positionMarkHere();
            },

            onClickDismissWelcome: function(e) {
                e.preventDefault();
                FMS.seen_welcome = true;
                $("#welcome_wrapper").hide();
                this.positionMarkHere();
            },

            onClickButtonNext: function() {
                var l = new Locate();
                _.extend(l, Backbone.Events);
                l.on('failed', this.noMap, this );
                l.on('located', this.goPhoto, this );
                l.check_location( { latitude: FMS.currentLocation.lat, longitude: FMS.currentLocation.lon } );
            },

            goPhoto: function(info) {
                this.model.set('lat', info.coordinates.latitude );
                this.model.set('lon', info.coordinates.longitude );
                this.model.set('categories', info.details.category );

                this.navigate( 'photo', 'left' );
            },

            onClickSearch: function() {
                $('input:focus').blur();
                var l = new Locate();
                _.extend(l, Backbone.Events);
                l.on('located', this.showMap, this );
                l.on('failed', this.noMap, this );

                l.lookup( $('#pc').val() );
                return false;
            },

            onClickReport: function(e) {
                e.preventDefault();
                var report_id = e.currentTarget.id;
                report_id = report_id.replace('report_', '');

                var r = new FMS.Report( { id: report_id } );
                r.on('change', this.showReport, this);
                r.fetch();
                return false;
            },

            showReport: function(r) {
                r.off('change');
                FMS.reportToView = r;

                this.navigate( 'report', 'left' );
            },

            onClickMenu: function() {
                this.navigate( 'settings', 'left' );
            },

            onSwapMap: function(e) {
                e.preventDefault(); // Stop the map click handler being fired
                var el = $('#swap-map');
                var s = el.text();
                var layer;
                if ( s == 'Luftbild' ) {
                    el.text('Stadtplan');
                    layer = fixmystreet.HYBRID_LAYER_INDEX;
                } else {
                    el.text('Luftbild');
                    layer = fixmystreet.STADTPLAN_LAYER_INDEX;
                }
                fixmystreet.map.setBaseLayer(fixmystreet.map.layers[layer]);

                // I don't know why this is required but for some reason all
                // the child divs of the layer end up with display: none set
                // so we have to manually show them :/
                $(fixmystreet.map.layers[layer].div).children().show();
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        ReportView: FMS.ZurichView.extend({
            template: 'report',
            prev: 'around',

            events: {
                'click .button-prev': 'onClickButtonPrev'
            },

            render: function(){
                var that = this;
                $.get("templates/" + this.template + ".html", function(template){
                    template_c = _.template(template);
                    that.$el.html(template_c(that.model.toJSON()));
                    that.fixNavButtons();
                    that.afterRender();
                });
                return this;
            },

            afterRender: function() {
                show_map(new OpenLayers.LonLat( fixmystreet.longitude, fixmystreet.latitude ));
                this.fixContentPosition();
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        PhotoView: FMS.ZurichView.extend({
            template: 'photo',
            prev: 'home',
            next: 'details',

            events: {
                'click #closeError': 'hideError',
                'click .button-prev': 'onClickButtonPrev',
                'click .button-next': 'onClickButtonNext',
                'click #use-photo': 'onClickButtonNext',
                'click #skip-photo': 'onClickButtonNext',
                'click #take-photo': 'takePhoto',
                'click #add-photo': 'addPhoto',
                'click .del-photo': 'deletePhoto'
            },

            renameFile: function(src, callback) {
                var d = new Date();
                //find the FileEntry for the file on the device
                window.resolveLocalFileSystemURL(src, function(fileEntry) {
                    //get the parent directory (callback gives a DirectoryEntry)
                    fileEntry.getParent(function(parent) {
                        //rename the file, prepending a timestamp.
                        fileEntry.moveTo(parent, d.getTime() + fileEntry.name, function(s) {
                            //Callback with the new URL of the file.
                            callback(s.nativeURL);
                        }, function(error) {
                            callback(src); //Fallback, use the src given
                        });
                    }, function(error) {
                        callback(src); //Fallback
                    });
                }, function(error) {
                    callback(src); //Fallback
                });
            },

            takePhoto: function() {
                var that = this;
                navigator.camera.getPicture( function(imgURI) { that.addPhotoSuccess(imgURI); }, function(error) { that.addPhotoFail(error); }, { saveToPhotoAlbum: true, quality: 49, targetHeight: 768, targetWidth: 1024, destinationType: Camera.DestinationType.FILE_URI, sourceType: navigator.camera.PictureSourceType.CAMERA, correctOrientation: true });
            },

            addPhoto: function() {
                var that = this;
                navigator.camera.getPicture(
                    function(imgURI) {
                        // Because we've asked for a resized version of the
                        // image, Android will create a temporary file for us.
                        // Unfortunately, it'll use the same filename for any
                        // number of files we request, so if we add more than
                        // one, it'll overwrite the previous images with the
                        // latest one, meaning we upload multiple copies of
                        // the same file.
                        // Instead, we create our own temporary file and then
                        // pass that into our normal success function.
                        if (that.check_if_android()) {
                            that.renameFile(imgURI, function(imgURI) {that.addPhotoSuccess(imgURI)});
                        } else {
                            that.addPhotoSuccess(imgURI);
                        }
                    },
                    function(error) {
                        that.addPhotoFail(error);
                    },
                    {
                        saveToPhotoAlbum: false,
                        quality: 49,
                        targetHeight: 768,
                        targetWidth: 1024,
                        destinationType: Camera.DestinationType.FILE_URI,
                        sourceType: navigator.camera.PictureSourceType.PHOTOLIBRARY,
                        correctOrientation: true
                    });
            },

            addPhotoSuccess: function(imgURI) {
                var files = this.model.get('files');
                files.push(imgURI);
                this.model.set('files', files);
                this.render();
            },

            addPhotoFail: function(message) {
                if ( message != 'no image selected' &&
                    message != 'No Image Selected' &&
                    message != 'Selection cancelled.' &&
                    message != 'Camera cancelled.' &&
                    message != 'has no access to assets'
                    ) {
                    this.displayError(STRINGS.photo_failed);
                }
            },

            deletePhoto: function(event) {
                var files = this.model.get('files');
                var index = parseInt($(event.target).data('fileIndex'));
                files.splice(index, 1);
                this.model.set('files', files);
                this.render();
            },
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        DetailsView: FMS.ZurichView.extend({
            template: 'details',
            prev: 'photo',
            next: 'submit',

            render: function() {
                template = _.template( tpl.get( this.template ) );
                this.$el.html(template({ report: this.model.toJSON(), user: FMS.currentUser.toJSON() }));
                this.fixNavButtons();
                if ( this.model.get('category') ) {
                    this.$('#form_category').val(this.model.get('category'));
                } else {
                    this.$('#form_category').val('');
                }

                // This makes sure the textarea takes up enough and unused screen estate
                // do this after any animation has happend which takes 400ms as otherwise it's not properly
                // part of the DOM so the heights get messed up.
                var that = this;
                window.setTimeout( function() {
                    // -50 to take account of the top margin plus a bit to leave a gap
                    var details_height = $('.content').height() - $('#form_category_row').height() - $('#bottom').height() - $('header').height() - $('.bar-tab').height() - 50;

                    var details = $('#form_detail');
                    details.height( details_height );
                    that.afterRender();
                }, 450 );
                return this;
            },

            events: {
                'click .button-prev': 'onClickButtonPrev',
                'click #closeError': 'hideError',
                'click #send_report': 'onClickSubmit',
                'click #user-details': 'editUserDetails'
            },

            afterRender: function() {
                this.enableScrolling();
                this.fixContentPosition();
            },

            saveDetails: function() {
                this.model.set('category', $('#form_category').val());
                this.model.set('details', $('#form_detail').val());
            },

            editUserDetails: function() {
                this.saveDetails();

                this.navigate( 'user', 'left' );
            },

            onClickButtonPrev: function() {
                this.disableScrolling();
                this.saveDetails();

                this.navigate( 'photo', 'right' );
            },

            onClickSubmit: function() {
                this.disableScrolling();
                this._disableUI();
                this.saveDetails();

                var error = 0;
                $('.error').remove();
                if ( ! this.model.get('details') ) {
                    error = 1;
                    this.validation_error('form_detail', STRINGS.required );
                }
                if ( ! this.model.get('category') ||
                       this.model.get('category') == STRINGS.select_category
                   ) {
                    error = 1;
                    this.validation_error('form_category', STRINGS.required );
                }

                if ( navigator && navigator.connection &&
                    navigator.connection.type !== Connection.UKNOWN &&
                    navigator.connection.type !== Connection.NONE ) {
                    if ( !error ) {
                        // Check if the selected category requires
                        // extra data from the user before submitting.
                        var that = this;
                        $.ajax( {
                            url: CONFIG.FMS_URL + 'report/new/category_extras',
                            type: 'POST',
                            data: {
                                category: this.model.get('category'),
                                latitude: this.model.get('lat'),
                                longitude: this.model.get('lon')
                            },
                            dataType: 'json',
                            timeout: 30000,
                            success: function( data, status ) {
                                if ( data && data.category_extra && data.category_extra.length > 0 ) {
                                    that.model.set('category_extras', data.category_extra);
                                    that.navigate('details_extra', 'left');
                                } else {
                                    that.model.on('sync', that.onReportSync, that );
                                    that.model.on('error', that.onReportError, that );
                                    that.model.save();
                                }
                            },
                            error: function() {
                                that._enableUI();
                                that.enableScrolling();
                                that.displayError(STRINGS.category_extra_check_error);
                            }
                        } );
                    } else {
                        this._enableUI();
                        this.enableScrolling();
                    }
                } else {
                    this._enableUI();
                    this.enableScrolling();
                    this.displayError(STRINGS.no_connection);
                }
            },

            onReportSync: function(model, resp, options) {
                this.model.off('sync', this.onReportSync);
                this.navigate( 'sent', 'left' );
            },

            onReportError: function(model, err, options) {
                this._enableUI();
                this.enableScrolling();
                this.model.off('error', this.onReportError);
                var message = STRINGS.sync_error + ':\n';
                for (var field in err.errors) {
                    message += err.errors[field] + "\n";
                }
                this.displayError(message);
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        DetailsExtraView: FMS.ZurichView.extend({
            template: 'details_extra',
            id: 'details-extra-page',
            prev: 'details',
            next: 'submit',

            events: {
                'click .button-prev': 'onClickButtonPrev',
                'click #send_report': 'onClickSubmit',
                'blur textarea': 'updateCurrentReport',
                'change select': 'updateCurrentReport',
                'blur input': 'updateCurrentReport'
            },

            afterRender: function() {
                this.populateFields();
                this.enableScrolling();
                this.fixContentPosition();
            },

            onClickButtonPrev: function() {
                this.disableScrolling();
                this.model.set('hasExtras', 0);
                this.updateCurrentReport();
                this.navigate( this.prev );
            },

            onClickSubmit: function() {
                this.disableScrolling();
                this._disableUI();
                this.clearValidationErrors();
                var valid = 1;
                var that = this;

                var isRequired = function(index) {
                    var el = $(this);
                    if ( el.attr('required') && el.val() === '' ) {
                        valid = 0;
                        that.validationError(el.attr('id'), FMS.strings.required);
                    }
                };
                // do validation
                $('#category_extras input').each(isRequired);
                $('#category_extras textarea').each(isRequired);
                $('#category_extras select').each(isRequired);
                this.model.set('hasExtras', 1);

                if ( valid ) {
                    this.clearValidationErrors();
                    this.updateCurrentReport();
                    this.model.on('sync', this.onReportSync, this );
                    this.model.on('error', this.onReportError, this );
                    this.model.save();
                } else {
                    this._enableUI();
                    this.enableScrolling();
                }
            },

            onReportSync: function(model, resp, options) {
                this.model.off('sync', this.onReportSync);
                this.navigate( 'sent', 'left' );
            },

            onReportError: function(model, err, options) {
                this.model.off('error', this.onReportError);
                this._enableUI();
                this.enableScrolling();
                var message = STRINGS.sync_error + ':\n';
                for (var field in err.errors) {
                    message += err.errors[field] + "\n";
                }
                this.displayError(message);
            },

            validationError: function(id, error) {
                var el_id = '#' + id;
                var el = $(el_id);

                el.addClass('error');
                if ( el.val() === '' ) {
                    el.attr('orig-placeholder', el.attr('placeholder'));
                    el.attr('placeholder', error);
                }
            },

            clearValidationErrors: function() {
                $('.error').removeClass('error');
                $('.error').each(function(el) { if ( el.attr('orig-placeholder') ) { el.attr('placeholder', el.attr('orig-placeholder') ); } } );
            },

            updateSelect: function() {
                this.updateCurrentReport();
            },

            updateCurrentReport: function() {
                var fields = [];
                var that = this;
                var update = function(index) {
                    var el = $(this);
                    if ( el.val() !== '' ) {
                        that.model.set(el.attr('name'), el.val());
                        fields.push(el.attr('name'));
                    } else {
                        that.model.set(el.attr('name'), '');
                    }

                };

                $('#category_extras input').each(update);
                $('#category_extras select').each(update);
                $('#category_extras textarea').each(update);

                this.model.set('extra_details', fields);
            },

            populateFields: function() {
                var that = this;
                var populate = function(index) {
                    that.$(this).val(that.model.get(that.$(this).attr('name')));
                };
                this.$('#category_extras input').each(populate);
                this.$('#category_extras select').each(populate);
                this.$('#category_extras textarea').each(populate);
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        SentView: FMS.ZurichView.extend({
            template: 'sent',

            events: {
                'click #button-done': 'onClickDone'
            },

            onClickDone: function() {
                FMS.currentReport = new FMS.Report();

                // Clear the green pin location from the map
                FMS.currentLocation = null;
                fixmystreet.latitude = null;
                fixmystreet.longitude = null;

                this.navigate( 'home', 'left' );
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        WelcomeView: FMS.ZurichView.extend({
            template: 'welcome',
            onsave: 'around',

            events: {
                'submit #userForm': 'onClickSave',
                'click #save': 'onClickSave'
            },

            afterRender: function() {
                this.enableScrolling();
                this.fixContentPosition();
            },

            saveDetails: function() {
                this.model.set('name', $('#form-name').val());
                this.model.set('phone', $('#form-phone').val());
                this.model.set('email', $('#form-email').val());

                var error = 0;

                // Validate email address is present and formatted correctly.
                if ( ! this.model.get('email') ) {
                    error = 1;
                    this.validation_error('form-email', STRINGS.required );
                // regexp stolen from jquery validate module
                } else if ( ! /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(this.model.get('email')) ) {
                    error = 1;
                    this.validation_error('form-email', STRINGS.invalid_email);
                }

                // Validate phone number is present.
                if ( ! this.model.get('phone') ) {
                    error = 1;
                    this.validation_error('form-phone', STRINGS.required );
                }

                if ( error ) {
                    return false;
                }

                this.model.save();
                FMS.users.add(this.model);
                FMS.currentUser = this.model;

                return true;
            },

            onClickSave: function () {
                if ( this.saveDetails() ) {
                    this.disableScrolling();
                    this.navigate( this.onsave, 'left' );
                }
                return false;
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        UserView: FMS.WelcomeView.extend( {
            template: 'user',
            onsave: 'details',
            prev: 'details',

            events: {
                'submit #userForm': 'onClickSave',
                'click #save': 'onClickSave',
                'click .button-prev': 'onClickButtonPrev'
            }

        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        SettingsUserView: FMS.UserView.extend( {
            template: 'user',
            onsave: 'settings',
            prev: 'settings'
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        SettingsView: FMS.ZurichView.extend({
            template: 'settings',
            prev: 'around',

            events: {
                'click .button-prev': 'onClickButtonPrev',
                'click #settings': 'onClickSettings',
                'click #help': 'onClickHelp',
                'click #licence': 'onClickLicence',
                'click #privacy': 'onClickPrivacy',
                'click #about': 'onClickAbout'
            },

            onClickItem: function(target) {
                this.navigate( target, 'left' );
            },

            onClickSettings: function() { this.onClickItem('settings-user'); },
            onClickHelp: function() { this.onClickItem('help'); },
            onClickLicence: function() { this.onClickItem('licence'); },
            onClickPrivacy: function() { this.onClickItem('privacy'); },
            onClickAbout: function() { this.onClickItem('about'); }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        TextView: FMS.ZurichView.extend({
            prev: 'settings',

            initialize: function() {
                if ( this.options.t ) {
                    this.template = this.options.t;
                } else {
                    console.log('no template option defined');
                }
            },

            events: {
                'click .button-prev': 'onClickButtonPrev'
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

