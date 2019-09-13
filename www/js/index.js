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
            currentView: null,

            routes: {
                'home': 'home',
                'around': 'around',
                'report': 'report',
                'photo': 'photo',
                'details': 'details',
                'details_extra': 'details_extra',
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
                if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                    $(document).on('ajaxStart', function() { navigator.notification.activityStart('', STRINGS.please_wait); } );
                    $(document).on('ajaxStop', function() { navigator.notification.activityStop(); } );
                } else {
                    $(document).on('ajaxStart', function() { $('#ajaxOverlay').show(); } );
                    $(document).on('ajaxStop', function() { $('#ajaxOverlay').hide(); } );
                }
            },

            back: function() {
                if (this.currentView && this.currentView.prev) {
                    this.currentView.onClickButtonPrev();
                } else if ( typeof device !== 'undefined' && device.platform == 'Android' ) {
                    setTimeout( function() { navigator.app.exitApp(); } );
                }
            },

            home: function(){
                if (FMS.currentUser) {
                    // Users are now required to have a phone number, so we
                    // redirect to the welcome view if they haven't got one.
                    if ( ! FMS.currentUser.get('phone') ) {
                        var welcomeView = new FMS.WelcomeView({ model: FMS.currentUser });
                        this.renderView(welcomeView);
                    } else {
                        var homeView = new FMS.HomeView({ model: FMS.currentReport });
                        this.renderView(homeView);
                    }
                } else {
                    FMS.currentUser = new FMS.User({ id: 1 });
                    var welcomeView = new FMS.WelcomeView({ model: FMS.currentUser });
                    FMS.firstRun = true;
                    this.renderView(welcomeView);
                }
            },

            around: function() {
                var homeView = new FMS.HomeView({ model: FMS.currentReport });
                this.changeView(homeView);
            },

            report: function() {
                var reportView = new FMS.ReportView({ model: FMS.reportToView });
                this.changeView(reportView);
            },

            photo: function() {
                var photoView = new FMS.PhotoView({ model: FMS.currentReport });
                this.changeView(photoView);
            },

            details: function() {
                var detailsView = new FMS.DetailsView({ model: FMS.currentReport, u: FMS.currentUser });
                this.changeView(detailsView);
            },

            details_extra: function(){
                var detailsExtraView = new FMS.DetailsExtraView({ model: FMS.currentReport });
                this.changeView(detailsExtraView);
            },

            sent: function() {
                var sentView = new FMS.SentView({ model: FMS.currentUser });
                this.changeView(sentView);
            },

            user: function() {
                var userView = new FMS.UserView({ model: FMS.currentUser });
                this.changeView(userView);
            },

            settings: function() {
                var settingsView = new FMS.SettingsView({ model: FMS.currentUser });
                this.changeView(settingsView);
            },

            settingsuser: function() {
                var settingsView = new FMS.SettingsUserView({ model: FMS.currentUser });
                this.changeView(settingsView);
            },

            help: function() {
                var textView = new FMS.TextView({ t: 'help' });
                this.changeView(textView);
            },

            licence: function() {
                var textView = new FMS.TextView({ t: 'licence' });
                this.changeView(textView);
            },

            privacy: function() {
                var textView = new FMS.TextView({ t: 'privacy' });
                this.changeView(textView);
            },

            about: function() {
                var textView = new FMS.TextView({ t: 'about' });
                this.changeView(textView);
            },

            changeView: function(view) {
                this.currentView = view;
                this.renderView(view);
            }
        })
    });
})(FMS, Backbone, _, $, Jr);

;(function (FMS, Backbone, _, $, Jr) {
    _.extend(FMS, {
        templates: [
            'photo', 'details', 'details_extra', 'around', 'sent', 'welcome', 'user', 'report', 'settings', 'help', 'licence', 'privacy', 'about'
        ],

        initialized: 0,
        currentReport: new FMS.Report(),
        currentUser: null,
        currentLocation: null,

        seen_welcome: false,

        reportToView: null,

        users: new FMS.Users(),

        initialize: function () {
            if ( this.initialized == 1 ) {
                return this;
            }
            // Stop iOS scrolling the webview when it shows the keyboard
            if ( typeof cordova !== 'undefined' ) {
                cordova.plugins.Keyboard.disableScroll(true);
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar(false);
            }
            // Rough-and-ready iPhone X detection so CSS can stop things
            // obscuring the home indicator at the bottom of the screen.
            if (window.screen.width == 375 && window.screen.height == 812) {
                $("body").addClass("iphone-x");
            }
            FMS.initialized = 1;
            tpl.loadTemplates( FMS.templates, function() {
                _.extend(FMS, {
                    router: new FMS.appRouter()
                });

                $(document).on('touchmove', '.ui-autocomplete', function(e) {
                    var $target = $(e.target);
                    if ($target.is(".ui-autocomplete")) {
                        e.preventDefault();
                        return;
                    }
                    var $list = $target.closest(".ui-autocomplete");
                    if ($list.length == 0) {
                        return;
                    }
                    if (!($target.is("li.ui-menu-item, a") && $list.find("li.ui-menu-item").length > 4)) {
                        e.preventDefault();
                    }
                } );

                document.addEventListener('backbutton', function() { FMS.router.back(); }, true);

                Backbone.history.start();
                Jr.Navigator.navigate('home',{
                    trigger: true
                });
                navigator.splashscreen.hide();
            });
        }
    });
})(FMS, Backbone, _, $, Jr);

var androidStartUp = function() {
    // deviceready does not fire on some android versions very reliably so
    // we do this instead

    if (FMS.initialized === 1) {
        return;
    }

    if ( typeof device != 'undefined' ) {
        if ( device.platform == 'Android' ) {
            FMS.initialize();
        }
    } else {
        window.setTimeout( androidStartUp, 1000 );
    }
}

document.addEventListener('deviceready', FMS.initialize, false);
window.setTimeout( androidStartUp, 2000 );
