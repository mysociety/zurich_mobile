var ZurichView = Jr.View.extend({
  render: function(){
    template = _.template( tpl.get( this.template ) );
    this.$el.html(template(this.model.toJSON()));
    this.afterRender();
    //$.get("templates/" + this.template + ".html", function(template){
      //var html = $(template);
      //that.$el.html(template);
      //that.afterRender();
    //});
    return this;
  },

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
    this.locate();
  },

  locate: function() {
    var that = this;
    var l = new Locate();
    _.extend(l, Backbone.Events);
    l.on('located', this.showMap, this );
    l.on('failed', this.noMap, this );

    l.geolocate();
  },

  showMap: function( coords ) {
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

  noMap: function( msg ) {
      alert( 'no location: ' + msg );
  },

  positionMarkHere: function() {
    $('#mark-here').show();
  },

  events: {
    'click .button-next': 'onClickButtonNext',
    'click #btn-search': 'onClickSearch',
    'click #mark-here': 'onClickMarkHere',
    'click #try_again': 'onClickTryAgain',
    'click #mob_ok': 'onClickButtonNext'
  },

  onClickMarkHere: function() {
    $('#sub_map_links').hide();
    var $map_box = $('#map_box');
    $map_box.append(
        '<p id="mob_sub_map_links">' +
        '<a href="#" id="try_again">Try again</a>' +
        '<a href="#ok" id="mob_ok">Confirm</a>' +
        '</p>' );
    $('#mark-here').hide();
  },

  onClickButtonNext: function() {
    var cross = fixmystreet.map.getControlsByClass(
                "OpenLayers.Control.Crosshairs");

    var position = cross[0].getMapPosition();
    position.transform(
        fixmystreet.map.getProjectionObject(),
        new OpenLayers.Projection("EPSG:4326")
    );
    this.model.set('lat', position.lat );
    this.model.set('lon', position.lon );

    Jr.Navigator.navigate('photo',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
  },

  onClickTryAgain: function() {
    $('#sub_map_links').show();
    $('#mob_sub_map_links').remove();
    $('#mark-here').show();
  },

  onClickSearch: function() {
    var l = new Locate();
    _.extend(l, Backbone.Events);
    l.on('located', this.showMap, this );
    l.on('failed', this.noMap, this );

    l.lookup( $('#pc').val() );
  }

});

var PhotoView = ZurichView.extend({
  template: 'photo',
  prev: 'home',
  next: 'details',

  afterRender: function() {
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
    'click .button-next': 'onClickButtonNext'
  }
});

var DetailsView = ZurichView.extend({
  template: 'details',
  prev: 'photo',
  next: 'submit',

  afterRender: function() {
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
    'click .button-next': 'onClickButtonNext'
  },

  onClickButtonPrev: function() {
    this.model.set('category', $('#category').val());
    this.model.set('details', $('#form_detail').val());

    Jr.Navigator.navigate('photo',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.RIGHT
      }
    });
  },
  onClickButtonNext: function() {
    this.model.set('category', $('#category').val());
    this.model.set('details', $('#form_detail').val());

    Jr.Navigator.navigate('submit',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
  }
});

var SubmitView = ZurichView.extend({
  template: 'submit',
  prev: 'details',

  afterRender: function() {
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
    'click .button-submit': 'onClickSubmit'
  },

  onClickSubmit: function() {
      // register event here...
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

  afterRender: function() {
  },

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
