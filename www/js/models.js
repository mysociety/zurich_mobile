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

            defaults: function(){
                return {
                    lat: 0,
                    lon: 0,
                    title: '',
                    details: '',
                    may_show_name: '',
                    category: '',
                    phone: '',
                    pc: '',
                    files: [],
                };
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
                if ( res.report && res.report.latitude ) {
                    return {
                        lat: res.report.latitude,
                        lon: res.report.longitude,
                        title: res.report.title,
                        details: res.report.detail,
                        photo: res.report.photo && res.report.photo.url ? CONFIG.FMS_URL + res.report.photo.url : null,
                        meta: res.report.meta,
                        confirmed_pp: res.report.confirmed_pp,
                        created_pp: res.report.created_pp,
                        category: res.report.category,
                        state: res.report.state,
                        state_t: res.report.state_t,
                        is_fixed: res.report.is_fixed,
                        used_map: res.report.used_map,
                        update_time: res.updates ? res.updates.update_pp : null,
                        update: res.updates ? res.updates.details : null
                    };
                }
                return false;
            },

            _readFileAsBase64String: function(file, success, error) {
                return this._readFileAsBinaryString(file, function(data) {
                    var b64 = btoa(data);
                    success(b64);
                }, error);
            },

            _readFileAsBinaryString: function(file, success, error) {
                var reader = new FileReader();
                reader.onloadend = function() {
                    success(this.result);
                };
                reader.onerror = error;
                return reader.readAsBinaryString(file);
            },

            _getParamName: function(field, encoding, length) {
                // The FileTransfer plugin technically only supports a single
                // file in each upload. However, we can force other files to
                // be added with a little workaround.
                // FileTransfer allows extra parameters to be sent with the
                // HTTP POST request, each of which is its own part of the
                // multipart-encoded request.
                // For a part to be treated as a file by the backend we need
                // to provide a 'filename' value in the Content-Disposition
                // header. The FileTransfer code doesn't escape the names of
                // extra POST parameters[0][1], so we can take advantage of this
                // and essentially inject our own header lines and filename
                // value with a carefully-crafted HTTP POST field name that's
                // passed to FileTransfer.upload.
                // FIXME: This is basically a hack, and needs a better
                // solution at some point.
                // [0]: https://github.com/apache/cordova-plugin-file-transfer/blob/49c21f951f51381d887646b38823222ed11c60c1/src/ios/CDVFileTransfer.m#L208
                // [1]: https://github.com/apache/cordova-plugin-file-transfer/blob/49c21f951f51381d887646b38823222ed11c60c1/src/android/FileTransfer.java#L369
                var name = field + '"; filename="' + field + '.jpg"\r\n';
                name += "Content-Type: image/jpeg\r\n";
                name += "Content-Transfer-Encoding: " + encoding + "\r\n";
                name += "Content-Length: " + length + "\r\n";
                name += 'X-Ignore-This-Header: "'; // to close the open quotes
                return name;
            },

            _addExtraPhotos: function(files, options, success, error) {
                var photos = [];
                for (var i = 0; i < files.length; i++) {
                    var uri = files[i];
                    photos.push({field: "photo"+(i+2), uri: uri});
                }
                this._addNextExtraPhoto(photos, options, success, error);
            },

            _addNextExtraPhoto: function(photos, options, success, error) {
                var photo = photos.shift();
                if (photo === undefined) {
                    success();
                    return;
                }
                var self = this;
                resolveLocalFileSystemURL(photo.uri, function(fileentry) {
                    fileentry.file(function(file) {
                        self._readFileAsBase64String(file, function(data) {
                            options.params[self._getParamName(photo.field, "base64", data.length)] = data;
                            self._addNextExtraPhoto(photos, options, success, error);
                        }, error);
                    }, error);
                }, error);
            },

            post: function(model,options) {

                var params = {
                    service: device.platform,
                    detail: model.get('details'),
                    category: model.get('category'),
                    lat: model.get('lat'),
                    lon: model.get('lon'),
                    pc: model.get('pc'),
                    used_map: 1
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

                if ( model.get('files') && model.get('files').length > 0 ) {
                    var handlers = options;
                    var fileUploadSuccess = function(r) {
                        $('#ajaxOverlay').hide();
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
                        $('#ajaxOverlay').hide();
                        handlers.error(STRINGS.report_send_error);
                    };

                    files = model.get('files').slice();
                    fileURI = files.shift();

                    var options = new FileUploadOptions();
                    options.fileKey="photo";
                    options.fileName=fileURI.substr(fileURI.lastIndexOf('/')+1);
                    options.mimeType="image/jpeg";
                    options.params = params;
                    options.chunkedMode = false;

                    // If file2 or file3 have been set on this model we need to
                    // add the photos to the file upload request manually
                    // as FileTransfer only supports a single file upload.
                    this._addExtraPhotos(
                        files,
                        options,
                        function() {
                            $('#ajaxOverlay').show();
                            var ft = new FileTransfer();
                            ft.upload(fileURI, CONFIG.FMS_URL + "report/new/mobile", fileUploadSuccess, fileUploadFail, options);
                        },
                        fileUploadFail
                    );
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
