var ZurichView = Jr.View.extend({
  render: function(){
    console.log('calling render');
    template = tpl.get( this.template );
    this.$el.html(template);
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
    'click #mark-here': 'onClickMarkHere'
  },

  onClickMarkHere: function() {
      alert('mark!');
  },

  onClickButtonNext: function() {
    Jr.Navigator.navigate('photo',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
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
