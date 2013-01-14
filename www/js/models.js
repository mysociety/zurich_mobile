var User = Backbone.Model.extend();

var Report = Backbone.Model.extend({
    defaults: {
        lat: 0,
        lon: 0,
        title: '',
        details: '',
        may_show_name: '',
        category: '',
        phone: '',
        pc: ''
    },

        getLastUpdate: function(time) {
            if ( time ) {
                props.time = time;
            }

            if ( !props.time ) {
                return '';
            }

            var t;
            if ( typeof props.time === 'String' ) {
                t = new Date( parseInt(props.time, 10) );
            } else {
                t = props.time;
            }
        },
        old_load: function(load_id) {
            var reports = localStorage.getObject('reports');
            props = reports[load_id];
            my_id = load_id;
        },
        old_save: function() {
            var reports = localStorage.getObject('reports');
            if ( ! reports ) {
                reports = [];
            }
            props.time = new Date().getTime();
            if ( my_id != -1 ) {
                reports[my_id] = props;
            } else {
                reports.push( props );
                my_id = reports.length - 1;
            }
            localStorage.setObject('reports', reports);
        },
        old_update: function(spec) {
            props = spec;
        },
        old_remove: function(del_id) {
            if ( del_id ) {
                this.load(del_id);
            }
            var reports = localStorage.getObject('reports');
            delete reports[my_id];
            localStorage.setObject('reports', reports);
        },
        old_reset: function() {

        }
    });
