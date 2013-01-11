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

  onScrollCarousel: function() {
    // Set the active dot when the user scrolls the carousel
    var index = this.$('.carousel-list').flickable('segment');
    this.$('.carousel-navigation li').removeClass('active');
    this.$('.carousel-navigation li[data-index="'+index+'"]').addClass('active');
  },

  onClickCarouselNavigationItem: function(e) {
    // Scroll the carousel when the user clicks on a dot.
    var index = $(e.currentTarget).attr('data-index');
    this.$('.carousel-list').flickable('segment',index);
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


// ### RatchetTemplate
// This is just a template that shows different UI elements that you can use from the Ratchet project

var RatchetTemplate = [
  '<header class="bar-title">',
  ' <div class="header-animated">',
// If you want the contents of the header to be animated as well, put those elements inside a div
// with a 'header-animated' class.
  '   <div class="button-prev">Back</div>',
  '   <h1 class="title">Ratchet CSS</h1>',
  '   <div class="button-next">Next</div>',
  '</header>',
  '<div class="content ratchet-content">',
  ' <p>Jr. was inspired by Ratchet and pulls in their gorgeous styles.</p>',
  ' <p>Here are some examples:</p>',
  ' <div class="ratchet-examples">',
  '  <ul class="list inset">',
  '   <li>',
  '     <a href="#">',
  '       List item 1',
  '       <span class="chevron"></span>',
  '       <span class="count">4</span>',
  '     </a>',
  '   </li>',
  '  </ul>',
  '  <div class="button-block button-main">Block button</div>',
  '  <a class="button">Mini</a> <a class="button-main">buttons</a> <a class="button-positive">are</a> <a class="button-negative">awesome!</a>',
  '  <div class="toggle active example-toggle"><div class="toggle-handle"></div></div>',
  '  <div class="example-cnts"><span class="count">1</span><span class="count-main">2</span><span class="count-positive">3</span><span class="count-negative">4</span></div>',
  '  <input type="search" placeholder="Search">',
  ' </div>',
  ' <p>For more examples checkout the <a href="http://maker.github.com/ratchet/">ratchet project.</a></p>',
  '</div>'
].join('\n');

// ### RatchetView

var RatchetView = Jr.View.extend({
  render: function(){
    this.$el.html(RatchetTemplate);
    return this;
  },

  events: {
    'click .button-prev': 'onClickButtonPrev',
    'click .button-next': 'onClickButtonNext',
    'click .example-toggle': 'onClickExampleToggle'
  },

  onClickButtonPrev: function() {
    // Trigger the animation for the back button on the toolbar

    Jr.Navigator.navigate('home',{
      trigger: true,
      animation: {
        // This time slide to the right because we are going back
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.RIGHT
      }
    });
  },

  onClickButtonNext: function() {
    Jr.Navigator.navigate('pushstate',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.LEFT
      }
    });
  },

  onClickExampleToggle: function() {
    // Simple example of how the on/off toggle switch works.
    this.$('.example-toggle').toggleClass('active');
  }
});

// ## PushStateTemplate
// Nothing new here

var PushStateTemplate = [
  '<header class="bar-title">',
  ' <div class="header-animated">',
  '   <div class="button-prev">Back</div>',
  '   <h1 class="title">Pushstate API</h1>',
  '</header>',
  '<div class="content pushstate-content">',
  '  <summary>In combination with backbone\'s routing and the pushstate api, Jr. maintains animations when you use pushstate.</summary>',
  '  <i class="icon-umbrella"></i>',
  '  <p>Push the browser back button to watch it work.</p>',
  '</div> '
].join('\n');

// ## PushStateView

var PushStateView = Jr.View.extend({
  render: function() {
    this.$el.html(PushStateTemplate);
    return this;
  },

  events: {
    'click .button-prev': 'onClickButtonPrev'
  },

  onClickButtonPrev: function() {
    Jr.Navigator.navigate('home',{
      trigger: true,
      animation: {
        type: Jr.Navigator.animations.SLIDE_STACK,
        direction: Jr.Navigator.directions.RIGHT
      }
    });
  }

});

//## Routing to your Views
// Jr.Router is just like a Backbone.Router except we provide a renderView
// that will automatically add the view to the dom and do the animation if
// one is specified.  It will also automatically handle doing an opposite animation
// if the back button is pressed.

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
