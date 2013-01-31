;(function (FMS, Backbone, _, $, Jr) {
    _.extend( FMS, {
        ZurichView: Jr.View.extend({
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
                if ( typeof device !== 'undefined' && device.platform == 'iPhone' ) {
                    this.$('.bar-title .button-prev').addClass('button-gradient');
                    this.$('.bar-title .button-next').addClass('button-gradient');
                }
            },

            afterRender: function() {},

            onClickButtonPrev: function() {
                Jr.Navigator.navigate(this.prev,{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.RIGHT
                    }
                });
            },

            onClickButtonNext: function() {
                Jr.Navigator.navigate(this.next,{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
            },

            displayError: function(msg) {
                console.log( 'displayError: ' + msg );
                $('#error #msg').html(msg);
                $('#errorOverlay').show();
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
                $.get("templates/" + this.template + ".html", function(template){
                    //var html = $(template);
                    that.$el.html(template);
                    that.fixNavButtons();
                    that.afterRender();
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

                if ( FMS.currentLocation ) {
                    this.showMap( { coordinates: { latitude: FMS.currentLocation.lat, longitude: FMS.currentLocation.lon } } );
                    FMS.currentLocation = null;
                } else if ( this.model.get('lat') && this.model.get('lon') ) {
                    this.showMap( { coordinates: { latitude: this.model.get('lat'), longitude: this.model.get('lon') } } );
                } else {
                    this.locate();
                }

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
                            url: CONFIG.FMS_URL + "/ajax/geocode",
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

            },

            locate: function() {
                var that = this;
                var l = new Locate();
                _.extend(l, Backbone.Events);
                l.on('located', this.showMap, this );
                l.on('failed', this.noMap, this );

                l.geolocate();
            },

            showMap: function( info ) {
                var coords = info.coordinates;
                fixmystreet.latitude = coords.latitude;
                fixmystreet.longitude = coords.longitude;
                if ( !fixmystreet.map ) {
                    show_map();
                } else {
                    var centre = new OpenLayers.LonLat( coords.longitude, coords.latitude );
                    centre.transform(
                        new OpenLayers.Projection("EPSG:4326"),
                        fixmystreet.map.getProjectionObject()
                    );
                    fixmystreet.map.panTo(centre);
                }
                this.positionMarkHere();
            },

            noMap: function( details ) {
                if ( details.msg ) {
                    this.displayError( details.msg );
                } else if ( details.locs ) {
                    this.displayError( STRINGS.multiple_locations );
                } else {
                    this.displayError( STRINGS.location_problem );
                }
            },

            positionMarkHere: function() {
                $('#mark-here').show();
                $('#saved-reports').show();
            },

            events: {
                'click .button-next': 'onClickButtonNext',
                'click #btn-search': 'onClickSearch',
                'submit #mapForm': 'onClickSearch',
                'click #mark-here': 'onClickMarkHere',
                'click #try_again': 'onClickTryAgain',
                'click #use-location': 'onClickButtonNext',
                'click #select-another': 'onClickSelectAnother',
                'click .report_pin': 'onClickReport',
                'click #closeError': 'hideError',
                'click .button-menu': 'onClickMenu'
            },

            onClickMarkHere: function() {
                $('#use-location').show();
                $('#select-another').show();
                $('.bar-tab').show();
                $('#mark-here').hide();
                $('#saved-reports').hide();
                $('#search').hide();
                fixmystreet.nav_control.deactivate();
            },

            onClickSelectAnother: function() {
                $('#use-location').hide();
                $('#select-another').hide();
                $('.bar-tab').hide();
                $('#mark-here').show();
                $('#saved-reports').show();
                $('#search').show();
                fixmystreet.nav_control.activate();
            },

            onClickButtonNext: function() {
                var position = this.getCrossHairPosition();

                var l = new Locate();
                _.extend(l, Backbone.Events);
                l.on('failed', this.noMap, this );
                l.on('located', this.goPhoto, this );
                l.check_location( { latitude: position.lat, longitude: position.lon } );
            },

            goPhoto: function(info) {
                this.model.set('lat', info.coordinates.latitude );
                this.model.set('lon', info.coordinates.longitude );
                this.model.set('categories', info.details.category );

                Jr.Navigator.navigate('photo',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
            },

            onClickTryAgain: function() {
                $('#mark-here').show();
                $('#saved-reports').show();
                $('#use-location').hide();
                $('.bar-tab').hide();
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
                var report_id = e.srcElement.id;
                report_id = report_id.replace('report_', '');

                var r = new FMS.Report( { id: report_id } );
                r.on('change', this.showReport, this);
                r.fetch();
            },

            showReport: function(r) {
                r.off('change');
                var position = this.getCrossHairPosition();
                FMS.currentLocation = position;
                FMS.reportToView = r;

                Jr.Navigator.navigate('report',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
            },

            getCrossHairPosition: function() {
                var cross = fixmystreet.map.getControlsByClass(
                "OpenLayers.Control.Crosshairs");

                var position = cross[0].getMapPosition();
                position.transform(
                    fixmystreet.map.getProjectionObject(),
                    new OpenLayers.Projection("EPSG:4326")
                );

                return position;
            },

            onClickMenu: function() {
                Jr.Navigator.navigate('settings',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
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
                show_map();
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
                'click .button-prev': 'onClickButtonPrev',
                'click .button-next': 'onClickButtonNext',
                'click #use-photo': 'onClickButtonNext',
                'click #skip-photo': 'onClickButtonNext',
                'click #add-photo': 'addPhoto',
                'click #del-photo': 'deletePhoto'
            },

            addPhoto: function() {
                var that = this;
                navigator.camera.getPicture( function(imgURI) { that.addPhotoSuccess(imgURI); }, function(error) { that.addPhotoFail(error); }, { saveToPhotoAlbum: true, quality: 49, destinationType: Camera.DestinationType.FILE_URI, bourceType: navigator.camera.PictureSourceType.CAMERA, correctOrientation: true });
            },

            addPhotoSuccess: function(imgURI) {
                $('#report-photo').attr('src', imgURI );
                this.model.set('file', imgURI);

                $('#del-photo').show().css('display', 'inline-block');
                $('#use-photo').show().css('display', 'inline-block');
                $('#add-photo').hide();
                $('#skip-photo').hide();
            },

            addPhotoFail: function() {
                alert('failed to take photo');
            },

            deletePhoto: function() {
                this.model.set('file', '');
                $('#report-photo').attr('src', 'img/placeholder-photo.png');
                $('#del-photo').hide();
                $('#use-photo').hide();
                $('#add-photo').show();
                $('#skip-photo').show();
            }
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
                return this;
            },

            events: {
                'click .button-prev': 'onClickButtonPrev',
                'click #send_report': 'onClickSubmit',
                'click #user-details': 'editUserDetails'
            },

            saveDetails: function() {
                this.model.set('category', $('#form_category').val());
                this.model.set('details', $('#form_detail').val());
            },

            editUserDetails: function() {
                this.saveDetails();

                Jr.Navigator.navigate('user',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
            },

            onClickButtonPrev: function() {
                this.saveDetails();

                Jr.Navigator.navigate('photo',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.RIGHT
                    }
                });
            },

            onClickSubmit: function() {
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

                if ( !error ) {
                    this.model.on('sync', this.onReportSync, this );
                    this.model.on('error', this.onReportError, this );

                    this.model.save();
                }
            },

            onReportSync: function(model, resp, options) {
                Jr.Navigator.navigate('sent',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
            },

            onReportError: function(model, err, options) {
                alert( STRINGS.sync_error + ': ' + err.errors);
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
                Jr.Navigator.navigate('home',{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
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

            saveDetails: function() {
                this.model.set('name', $('#form-name').val());
                this.model.set('phone', $('#form-phone').val());
                this.model.set('email', $('#form-email').val());

                var error = 0;
                if ( ! this.model.get('email') ) {
                    error = 1;
                    this.validation_error('form-email', STRINGS.required );
                // regexp stolen from jquery validate module
                } else if ( ! /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i.test(this.model.get('email')) ) {
                    error = 1;
                    this.validation_error('form-email', STRINGS.invalid_email);
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
                    Jr.Navigator.navigate(this.onsave,{
                        trigger: true,
                        animation: {
                            type: Jr.Navigator.animations.SLIDE_STACK,
                            direction: Jr.Navigator.directions.LEFT
                        }
                    });
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
                Jr.Navigator.navigate(target,{
                    trigger: true,
                    animation: {
                        type: Jr.Navigator.animations.SLIDE_STACK,
                        direction: Jr.Navigator.directions.LEFT
                    }
                });
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

