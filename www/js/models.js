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

    sync: function(method, model, options) {
        console.log('sync: ' + method);
        console.log(options);
        switch (method) {
            case 'create':
                this.post(model,options);
                break;
            default:
                return true;
        }
    },

    post: function(model,options) {

        var params = {
            service: device.platform,
            detail: model.get('details'),
            category: model.get('category'),
            lat: model.get('lat'),
            lon: model.get('lon'),
            pc: model.get('pc')
        };

        if ( user ) {
            params.name = user.get('name');
            params.email = user.get('email');
            params.phone = user.get('phone');
        } else {
            params.name = $('#form_name').val();
            params.email = $('#form_email').val();
            params.phone = $('#form_phone').val();

            user = new User( {
                name: params.name,
                email: params.email,
                phone: params.phone
            });
        }

        if ( model.get('file') && model.get('file') !== '' ) {
            fileURI = model.get('file');

            var options = new FileUploadOptions();
            options.fileKey="photo";
            options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
            options.mimeType="image/jpeg";
            options.params = params;
            options.chunkedMode = false;

            var ft = new FileTransfer();
            ft.upload(fileURI, CONFIG.FMS_URL + "report/new/mobile", fileUploadSuccess, fileUploadFail, options);
        } else {
            $.ajax( {
                url: CONFIG.FMS_URL + "report/new/mobile",
                type: 'POST',
                data: params,
                dataType: 'json',
                timeout: 30000,
                success: function(data) {
                    if ( data.success ) {
                        options.success( data );
                    } else {
                        options.error( data );
                    }
                },
                error: function (data, status, errorThrown ) {
                    console.log( 'There was a problem submitting your report, please try again (' + status + '): ' + JSON.stringify(data), function(){}, 'Submit report' );
                    options.error( data );
                }
            } );
        }
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
