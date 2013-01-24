var tpl = {

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
        };

        loadTemplate(0);
    },

    // Get template by name from hash of preloaded templates
    get:function (name) {
        return this.templates[name];
    }

};

var report = new Report();
var user = null;
var U = new Users();

var AppRouter = Jr.Router.extend({
    routes: {
        'home': 'home',
        'around': 'around',
        'report': 'report',
        'photo': 'photo',
        'details': 'details',
        'sent': 'sent',
        'user': 'user'
    },

    initialize: function() {
        U.fetch();
        user = U.get(1);
        $(document).on('ajaxStart', function() { $('#ajaxOverlay').show(); console.log('start') } );
        $(document).on('ajaxStop', function() { $('#ajaxOverlay').hide(); console.log('end'); } );
    },

    home: function(){
        if (user) {
            var homeView = new HomeView({ model: report });
            this.renderView(homeView);
        } else {
            user = new User({ id: 1 });
            var welcomeView = new WelcomeView({ model: user });
            this.renderView(welcomeView);
        }
    },

    around: function() {
        var homeView = new HomeView({ model: report });
        this.renderView(homeView);
    },

    report: function() {
        var reportView = new ReportView({ model: report });
        this.renderView(reportView);
    },

    photo: function() {
        var photoView = new PhotoView({ model: report });
        this.renderView(photoView);
    },

    details: function() {
        var detailsView = new DetailsView({ model: report, u: user });
        this.renderView(detailsView);
    },

    sent: function() {
        var sentView = new SentView({ model: report });
        this.renderView(sentView);
    },

    user: function() {
        var userView = new UserView({ model: user });
        this.renderView(userView);
    }

});

var appRouter;
var templates = [
    'photo', 'details', 'submit', 'around', 'sent', 'welcome', 'user', 'report'
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
