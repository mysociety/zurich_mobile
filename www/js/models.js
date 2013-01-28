;(function(FMS, Backbone, _, $) {
    _.extend( FMS, {
        User: Backbone.Model.extend({
            localStorage: new Backbone.LocalStorage('Users')
        })
    });
})(FMS, Backbone, _, $);


;(function(FMS, Backbone, _, $) {
    _.extend( FMS, {
        Users: Backbone.Collection.extend({
            model: FMS.User,
            localStorage: new Backbone.LocalStorage('Users')
        })
    });
})(FMS, Backbone, _, $);

;(function(FMS, Backbone, _, $) {
    _.extend( FMS, {
        Report: Backbone.Model.extend({
            urlRoot: CONFIG.FMS_URL + 'report/ajax',

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
                    case 'read':
                        Backbone.ajaxSync(method, model, options);
                        break;
                    default:
                        return true;
                }
            },

            parse: function(res) {
                if ( res.latitude ) {
                    return {
                        lat: res.latitude,
                        lon: res.longitude,
                        title: res.title,
                        details: res.detail,
                        photo: CONFIG.FMS_URL + res.photo.url,
                        meta: res.meta,
                        category: res.category,
                        state: res.state,
                        is_fixed: res.is_fixed,
                        used_map: res.used_map
                    };
                }
                return false;
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

                if ( FMS.currentUser ) {
                    params.name = FMS.currentUser.get('name');
                    params.email = FMS.currentUser.get('email');
                    params.phone = FMS.currentUser.get('phone');
                } else {
                    params.name = $('#form_name').val();
                    params.email = $('#form_email').val();
                    params.phone = $('#form_phone').val();

                    FMS.currentUser = new FMS.User( {
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
        })
    });
})(FMS, Backbone, _, $);
