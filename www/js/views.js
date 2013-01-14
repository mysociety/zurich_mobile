var ZurichView = Jr.View.extend({
  render: function(){
    console.log('calling render');
    template = _.template( tpl.get( this.template ) );
    console.log(this.model.toJSON());
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
    this.showMap();
  },

  showMap: function() {
      console.log( 'showMap' );
      show_map();
  },

  events: {
    'click .button-next': 'onClickButtonNext',
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
    this.model.set('latitude', position.lat );
    this.model.set('longitude', position.lon );

    console.log( position.lat + ', ' + position.lon );

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
  }
});

var SubmitView = ZurichView.extend({
  template: 'submit',
  prev: 'details',

  afterRender: function() {
  },

  events: {
    'click .button-prev': 'onClickButtonPrev'
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
