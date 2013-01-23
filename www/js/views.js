var ZurichView = Jr.View.extend({
    render: function(){
        template = _.template( tpl.get( this.template ) );
        this.$el.html(template(this.model.toJSON()));
        this.afterRender();
        return this;
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
        $('#error #msg').text(msg);
        $('#error').show();
    },

    hideError: function() {
        $('#error').hide();
    }
});

var HomeView = ZurichView.extend({
    template: 'around',
    next: 'photo',

    render: function(){
        var that = this;
        $.get("templates/" + this.template + ".html", function(template){
            //var html = $(template);
            that.$el.html(template);
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
        if ( this.model.get('lat') && this.model.get('lon') ) {
            this.showMap( { coordinates: { latitude: this.model.get('lat'), longitude: this.model.get('lon') } } );
        } else {
            this.locate();
        }
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
            console.log(fixmystreet.map.getCenter());
        }
        this.positionMarkHere();
    },

    noMap: function( details ) {
        if ( details.msg ) {
            this.displayError( 'location error: ' + details.msg );
        } else if ( details.locs ) {
            this.displayError( 'we found multiple locations' );
        } else {
            this.displayError( 'there was a problem looking up your location' );
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
        'click #closeError': 'hideError'
    },

    onClickMarkHere: function() {
        $('#use-location').show();
        $('.bar-tab').show();
        $('#mark-here').hide();
        $('#saved-reports').hide();
    },

    onClickButtonNext: function() {
        var cross = fixmystreet.map.getControlsByClass(
            "OpenLayers.Control.Crosshairs");

            var position = cross[0].getMapPosition();
            position.transform(
                fixmystreet.map.getProjectionObject(),
                new OpenLayers.Projection("EPSG:4326")
            );
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
        var l = new Locate();
        _.extend(l, Backbone.Events);
        l.on('located', this.showMap, this );
        l.on('failed', this.noMap, this );

        l.lookup( $('#pc').val() );
        return false;
    }
});

var PhotoView = ZurichView.extend({
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
});

var DetailsView = ZurichView.extend({
    template: 'details',
    prev: 'photo',
    next: 'submit',

    render: function() {
        template = _.template( tpl.get( this.template ) );
        this.$el.html(template({ report: this.model.toJSON(), user: user.toJSON() }));
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
                direction: Jr.Navigator.directions.RIGHT
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
        this.model.on('sync', this.onReportSync, this );
        this.model.on('error', this.onReportError, this );

        this.model.save();
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
        alert('sync error: ' + err.errors);
    }
});

var SentView = ZurichView.extend({
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
});

var WelcomeView = ZurichView.extend({
    template: 'welcome',

    events: {
        'click #save': 'onClickSave'
    },

    saveDetails: function() {
        this.model.set('name', $('#form-name').val());
        this.model.set('phone', $('#form-phone').val());
        this.model.set('email', $('#form-email').val());
        this.model.save();
        U.add(this.model);
        user = this.model;
    },

    onClickSave: function () {
        this.saveDetails();

        Jr.Navigator.navigate('around',{
            trigger: true,
            animation: {
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.LEFT
            }
        });
    }
});

var UserView = WelcomeView.extend( {
    template: 'user',

    onClickSave: function() {
        this.saveDetails();

        Jr.Navigator.navigate('details',{
            trigger: true,
            animation: {
                type: Jr.Navigator.animations.SLIDE_STACK,
                direction: Jr.Navigator.directions.RIGHT
            }
        });
    }
});
