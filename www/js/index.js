tpl = {

    // Hash of preloaded templates for the app
    templates:{},

    // Recursively pre-load all the templates for the app.
    // This implementation should be changed in a production environment. All the template files should be
    // concatenated in a single file.
    loadTemplates:function (names, callback) {

        var that = this;

        var loadTemplate = function (index) {
            var name = names[index];
            console.log('Loading template: ' + name + ', index: ' + index);
            $.get('templates/' + name + '.html', function (data) {
                that.templates[name] = data;
                index++;
                if (index < names.length) {
                    loadTemplate(index);
                } else {
                    callback();
                }
            });
        }

        loadTemplate(0);
    },

    // Get template by name from hash of preloaded templates
    get:function (name) {
        return this.templates[name];
    }

};

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

  setUpCarousel: function() {
    var after = function() {
      // Use the flickable plugin to setup our carousel with 3 segments
      this.$('.carousel-list').flickable({segments:3});
    };
    // We have to put this in a setTimeout so that it sets it up after the view is added to the DOM
    setTimeout(after,1);
  },

  events: {
    'click .button-next': 'onClickButtonNext',
    'click #mark-here': 'onClickMarkHere',
    'onScroll .carousel-list': 'onScrollCarousel',
    'click .carousel-navigation li': 'onClickCarouselNavigationItem'
  },

  onClickMarkHere: function() {
      alert('mark!');
  },

  onClickShowMoreButton: function() {
    // Jr.Navigator works like Backbone.history.navigate, but it allows you to add an animation in the mix.
    Jr.Navigator.navigate('ratchet',{
      trigger: true,
      animation: {
        // Do a stacking animation and slide to the left.
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
    return false;
  },

  onClickButtonNext: function() {
    Jr.Navigator.navigate('photo',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
  },

});

var PhotoView = ZurichView.extend({
  template: 'photo',
  prev: 'home',
  next: 'details',

  afterRender: function() {
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
    'click .button-next': 'onClickButtonNext',
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
    'click .button-next': 'onClickButtonNext',
  }
});

var SubmitView = ZurichView.extend({
  template: 'submit',
  prev: 'details',

  afterRender: function() {
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
  }
});


var AppRouter = Jr.Router.extend({
  routes: {
    'home': 'home',
    'photo': 'photo',
    'details': 'details',
    'submit': 'submit'
  },

  home: function(){
    var homeView = new HomeView();
    this.renderView(homeView);
  },

  photo: function() {
    var photoView = new PhotoView();
    this.renderView(photoView);
  },
  details: function() {
    var detailsView = new DetailsView();
    this.renderView(detailsView);
  },
  submit: function() {
    var submitView = new SubmitView();
    this.renderView(submitView);
  },

});

var appRouter;
var templates = [
    'photo', 'details', 'submit', 'around'
];

function start() {
    tpl.loadTemplates( templates, function() {
        appRouter = new AppRouter();
        Backbone.history.start();
        Jr.Navigator.navigate('home',{
          trigger: true
        });
    });
}

document.addEventListener('deviceready', start, false);
