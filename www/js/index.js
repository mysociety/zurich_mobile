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


;(function (FMS, Backbone, _, $, Jr) {
    _.extend(FMS, {
        appRouter: Jr.Router.extend({
            routes: {
                'home': 'home',
                'around': 'around',
                'report': 'report',
                'photo': 'photo',
                'details': 'details',
                'sent': 'sent',
                'user': 'user',
                'settings-user': 'settingsuser',
                'settings': 'settings',
                'about': 'about',
                'help': 'help',
                'licence': 'licence',
                'privacy': 'privacy',
                'about': 'about'
            },

            initialize: function() {
                FMS.users.fetch();
                FMS.currentUser = FMS.users.get(1);
                $(document).on('ajaxStart', function() { $('#ajaxOverlay').show(); } );
                $(document).on('ajaxStop', function() { $('#ajaxOverlay').hide(); } );
            },

            home: function(){
                if (FMS.currentUser) {
                    var homeView = new FMS.HomeView({ model: FMS.currentReport });
                    this.renderView(homeView);
                } else {
                    FMS.currentUser = new FMS.User({ id: 1 });
                    var welcomeView = new FMS.WelcomeView({ model: FMS.currentUser });
                    this.renderView(welcomeView);
                }
            },

            around: function() {
                var homeView = new FMS.HomeView({ model: FMS.currentReport });
                this.renderView(homeView);
            },

            report: function() {
                var reportView = new FMS.ReportView({ model: FMS.reportToView });
                this.renderView(reportView);
            },

            photo: function() {
                var photoView = new FMS.PhotoView({ model: FMS.currentReport });
                this.renderView(photoView);
            },

            details: function() {
                var detailsView = new FMS.DetailsView({ model: FMS.currentReport, u: FMS.currentUser });
                this.renderView(detailsView);
            },

            sent: function() {
                var sentView = new FMS.SentView({ model: FMS.currentUser });
                this.renderView(sentView);
            },

            user: function() {
                var userView = new FMS.UserView({ model: FMS.currentUser });
                this.renderView(userView);
            },

            settings: function() {
                var settingsView = new FMS.SettingsView({ model: FMS.currentUser });
                this.renderView(settingsView);
            },

            settingsuser: function() {
                var settingsView = new FMS.SettingsUserView({ model: FMS.currentUser });
                this.renderView(settingsView);
            },

            help: function() {
                var textView = new FMS.TextView({ t: 'help' });
                this.renderView(textView);
            },

            licence: function() {
                var textView = new FMS.TextView({ t: 'licence' });
                this.renderView(textView);
            },

            privacy: function() {
                var textView = new FMS.TextView({ t: 'privacy' });
                this.renderView(textView);
            },

            about: function() {
                var textView = new FMS.TextView({ t: 'about' });
                this.renderView(textView);
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend(FMS, {
        templates: [
            'photo', 'details', 'around', 'sent', 'welcome', 'user', 'report', 'settings', 'help', 'licence', 'privacy', 'about'
        ],

        currentReport: new FMS.Report(),
        currentUser: null,
        currentLocation: null,

        reportToView: null,

        users: new FMS.Users(),

        initialize: function () {
            tpl.loadTemplates( FMS.templates, function() {
                _.extend(FMS, {
                    router: new FMS.appRouter()
                });
                Backbone.history.start();
                Jr.Navigator.navigate('home',{
                    trigger: true
                });
            });
        }
    });
})(FMS, Backbone, _, $, Jr);

document.addEventListener('deviceready', FMS.initialize, false);
