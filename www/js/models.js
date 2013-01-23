var User = Backbone.Model.extend({
    localStorage: new Backbone.LocalStorage('Users')
});

var Users = Backbone.Collection.extend({
    model: User,
    localStorage: new Backbone.LocalStorage('Users')
});

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
            var handlers = options;
            var fileUploadSuccess = function(r) {
                if ( r.response ) {
                    var data;
                    try {
                        data = JSON.parse( decodeURIComponent(r.response) );
                    }
                    catch(err) {
                        data = {};
                    }
                    handlers.success(data);
                } else {
                    handlers.error(STRINGS.report_send_error);
                }
            };

            var fileUploadFail = function() {
                handlers.error(STRINGS.report_send_error);
            };

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
                    console.log(STRINGS.report_send_error);
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
    }
});
