var fotosClass = function(){
    this.tbName   = null;
    this.tbPK     = null;
    this.tbFields = {};

    this.fileURI  = config.appDevice == "android" ? cordova.file.externalApplicationStorageDirectory : (config.appDevice != 'browser' ? cordova.file.dataDirectory : '');

    this.is_sync = false;

    this.init = function(){
        var deferred = $.Deferred();

        this.loadTableInfo();

        this.setupView();

        deferred.resolve();

        return deferred.promise();
    }

    this.getCodigosFotosEnviadas = function(){
        var arrAlvos = [];
        var arrFotos     = [];

        var deferred = $.Deferred();

        var sql = "SELECT a.vloc_codigo, f.codigo " +
                  "FROM alvo AS a " + 
                  "LEFT JOIN fotos AS f ON f.vloc_codigo = a.vloc_codigo AND " + 
                  "                        (f.codigo IS NOT NULL OR f.codigo <> '') " + 
                  "ORDER BY a.id ASC";

        control.db.query(sql).done(function(itens){
            for(i in itens){
                arrAlvos.push(itens[i]['vloc_codigo']);
                if(itens[i]['codigo'] && $.inArray(itens[i]['codigo'], arrFotos) == -1) arrFotos.push(itens[i]['codigo']);
            }

            deferred.resolve(arrAlvos, arrFotos);
        }).fail(function(msg){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100058', { classe: 'fotos.class.js', metodo: 'getCodigosFotosEnviadas'},{mensagem_padrao:  msg+' - SQL: '+sql});  
            deferred.reject();
        });

        return deferred.promise();
    }

    this.getCodigosFotosRemovidas = function(){
        var arrFotos = [];

        var deferred = $.Deferred();

        control.db.selectRows(this, 'remover', 1).done(function(itens){
            for(i in itens) arrFotos.push(itens[i]['codigo']);

            deferred.resolve(arrFotos);
        }).fail(function(){
            deferred.reject();
        });

        return deferred.promise();
    }

    this.getFotosAlvo = function(id){
        var deferred = $.Deferred();

        var sql = "SELECT f.id, f.codigo, f.arquivo " + 
                  "FROM fotos AS f, " + 
                  "     alvo AS a " + 
                  "WHERE f.vloc_codigo = a.vloc_codigo AND " + 
                  "      a.id = ? AND " + 
                  "      f.remover = 0 " + 
                  "ORDER BY f.dt_inc DESC";

        control.db.query(sql, [ id ]).done(function(itens){
            deferred.resolve(itens);
        }).fail(function(msg){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100059', { classe: 'fotos.class.js', metodo: 'getFotosAlvo'},{mensagem_padrao:  msg+' - SQL: '+sql}); 
            deferred.reject();
        });
        return deferred.promise();
    }

    this.getFotosParaEnviar = function(){
        var deferred = $.Deferred();

        var sql = "SELECT id, vloc_codigo, arquivo " + 
                  "FROM fotos " + 
                  "WHERE codigo IS NULL AND " + 
                  "      dt_sync_out IS NULL AND " + 
                  "      remover = 0";

        control.db.query(sql).done(function(itens){
            deferred.resolve(itens);
        }).fail(function(msg){
            console.log(msg);
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100060', { classe: 'fotos.class.js', metodo: 'getFotosParaEnviar'},{mensagem_padrao:  msg+' - SQL: '+sql});   
            deferred.reject();
        });
        return deferred.promise();
    }


    this.getDtSyncFoto = function(id){
        var deferred = $.Deferred();

        var sql = "SELECT id, codigo, vloc_codigo, arquivo, dt_sync_out " + 
                  "FROM fotos " + 
                  "WHERE id = ? ";

        control.db.query(sql,[id]).done(function(item){
            deferred.resolve((item[0]!=null && item[0]!=undefined ? item[0] : null));
        }).fail(function(msg){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100060', { classe: 'fotos.class.js', metodo: 'getFotosParaEnviar'},{mensagem_padrao:  msg+' - SQL: '+sql});   
            deferred.reject();
        });
        return deferred.promise();
    }

    this.limpaFotos = function(){
        var me = this;

        var deferred = $.Deferred();

        control.db.selectRows(me, 1, 1).done(function(item){
            for(i in item) me.deleteFoto(item[i].id);
            deferred.resolve();
        }).fail(function(){
            deferred.reject();
        });

        return deferred.promise();
    }

    this.removeFoto = function(id){
        var me = this;

        var deferred = $.Deferred();

        control.db.selectRows(me, 'id', id, 1).done(function(item){
            control.db.updateRow(me, { remover: 1 }, 'id', id).always(function(){
                me.deletePic(item.arquivo).always(function(){
                    deferred.resolve();
                }).fail(function(m){
                    console.log(m);
                });
            }).fail(function(){
                deferred.reject();
            });
        }).fail(function(){
            deferred.reject();
        });

        return deferred.promise();
    }

    this.deleteFoto = function(id){
        var me = this;

        var deferred = $.Deferred();

        control.db.selectRows(me, 'id', id, 1).done(function(item){
            control.db.deleteRow(me, 'id', id).always(function(){
                me.deletePic(item.arquivo).always(function(){
                    deferred.resolve();
                }).fail(function(m){
                    console.log(m);
                });
            }).fail(function(){
                deferred.reject();
            });
        }).fail(function(){
            deferred.reject();
        });

        return deferred.promise();
    }    

    this.openPicture = function(origin) {
        var me = this;

        // Retrieve image file location from specified source
        if(origin == 'camera'){
            var options = { quality:            50, 
                            targetWidth:        1280, 
                            targetHeight:       720, 
                            correctOrientation: true, 
                            encodingType:        Camera.EncodingType.JPEG };
        } else {
            var options = { quality:            50, 
                            targetWidth:        1280, 
                            targetHeight:       720, 
                            correctOrientation: true, 
                            destinationType:    Camera.DestinationType.FILE_URI, 
                            sourceType:         Camera.PictureSourceType.PHOTOLIBRARY };
        }

        navigator.camera.getPicture(function(imageURI){
            if(config.appDevice != "browser") window.plugins.insomnia.keepAwake();

            if (imageURI.substring(0,21)=="content://com.android") {
                photo_split = imageURI.split("%3A");
                imageURI = "content://media/external/images/media/" + photo_split[1];
            }        

            me.movePhoto(imageURI, control.alvo.objSel.vloc_codigo).done(function(entry_path, newFileName){
                control.alvo.setupGallery();
                setTimeout(function(){ control.sync.syncSendFotos(false); }, 2000);
            }).fail(function(message){
                console.log(message);
            });
        }, function(message) {
            if(config.appDevice != "browser") window.plugins.insomnia.keepAwake();
            console.log('get picture failed: ' + message);
        }, options);
    }

    this.movePhoto = function(file, codigo){
        var me = this;
        
        var deferred = $.Deferred();
        
        console.log('chamada');
        window.resolveLocalFileSystemURI(file, function(entry) {
            var d = new Date();
            var n = d.getTime();

            //new file name
            var newFileName = codigo + "_" + n + ".jpg";
            var myFolderApp = control.appAlias;

            window.resolveLocalFileSystemURL(me.fileURI, function(entry_path){
                entry_path.getDirectory(myFolderApp, { create:true, exclusive: false }, function(directory){
                    entry.copyTo(directory, newFileName, function(entry_path) {
                        var item = { "id":          null, 
                                     "vloc_codigo": codigo, 
                                     "arquivo":     entry_path.toURL(), 
                                     "remover":     0,
                                     "dt_inc":      curTime() };

                        control.db.insertRow(me, item).done(function(){
                            deferred.resolve(entry_path, newFileName);
                        }).fail(function(m){
                            //Adicionar erro nao fatal ao fabric
                            ErrorClass.parseError('database','100070', { classe: 'fotos.class.js', metodo: 'movePhoto'},{mensagem_padrao: m});                   
                            deferred.reject('[100070]Erro: ' + m);
                        });
                    }, function(error) {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('media','500012', { classe: 'fotos.class.js', metodo: 'movePhoto', arquivo: newFileName, diretorio: directory },{mensagem_padrao: error});        
                        deferred.reject('[500012]Erro: ' + error.code);
                    });
                }, function(error) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('media','500013', { classe: 'fotos.class.js', metodo: 'movePhoto', diretorio: myFolderApp },{mensagem_padrao: error});  
                    deferred.reject('[500013]Erro: ' + error.code);
                });
            },  function(error) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('media','500014', { classe: 'fotos.class.js', metodo: 'movePhoto', diretorio: me.fileURI },{mensagem_padrao: error});     
                deferred.reject('[500014]Erro: ' + error.code);    
            });
        }, function(error) {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('media','500015', { classe: 'fotos.class.js', metodo: 'movePhoto', diretorio: file },{mensagem_padrao: error});     
            deferred.reject('[500015]Erro: ' + error.code);
        });

        return deferred.promise();
    } 

    this.writePic = function(file_name, data) {
        var me = this;

        var deferred = $.Deferred();
        
        console.log("Writing photo...");

        try {
            window.resolveLocalFileSystemURL(me.fileURI, function(entry_path) {
                entry_path.getDirectory(control.appAlias, { create:true, exclusive: false }, function(directory){
                    console.log("Open directory...");

                    directory.getFile(file_name, {create: true, exclusive: false}, function(fileEntry) {
                        console.log("Open file to write...");

                        fileEntry.createWriter(function(writer) {
                            var arrName = file_name.split('.');
                            var extension = arrName.pop();
                            
                            var content_type = 'image/' + (extension == 'jpg' ? 'jpeg' : extension);

                            var newData = Base64.to_blob(data, content_type);
                            writer.write(newData);

                            data = null;
                            newData = null;

                            console.log("Writing file...");

                            deferred.resolve(fileEntry.toURL(), file_name);
                        }, function(error) {
                            //Adicionar erro nao fatal ao fabric
                            ErrorClass.parseError('media','500016', { classe: 'fotos.class.js', metodo: 'writePic' },{mensagem_padrao: "Error Writing photo...createWriter: " + error});     
                            console.log("Error Writing photo...createWriter: " + error.code);
                            deferred.reject('[500016]Erro createWriter: ' + error.code);    
                        });
                    }, function(error) {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('media','500017', { classe: 'fotos.class.js', metodo: 'writePic', arquivo: file_name },{mensagem_padrao: "Error Writing photo...getFile: " + error});        
                        console.log("Error Writing photo...getFile: " + error.code);
                        deferred.reject('[500017]Erro getFile: ' + error.code);    
                    });
                }, function(error) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('media','500018', { classe: 'fotos.class.js', metodo: 'writePic', diretorio: directory },{mensagem_padrao: "Error Writing photo...getDirectory: " + error});        
                    console.log("Error Writing photo...getDirectory: " + error.code);
                    deferred.reject('[500018]Erro getDirectory: ' + error.code);    
                });
            }, function(error) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('media','500019', { classe: 'fotos.class.js', metodo: 'writePic', file: me.fileURI },{mensagem_padrao: error});           
                console.log("Error Writing photo...resolveLocalFileSystemURL: " + error.code);
                deferred.reject('[500019]Erro resolveLocalFileSystemURL: ' + error.code);
            });
        } catch(err){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('media','500020', { classe: 'fotos.class.js', metodo: 'writePic', file: me.fileURI },{mensagem_padrao: err});          
            console.log('Erro cordova: ' + err);
            deferred.reject('[500020]Erro cordova: ' + err);
        }    

        return deferred.promise();
    }

    this.readPic = function(name) {
        var me = this;

        var deferred = $.Deferred();

        var localFile = control.appAlias + '/' + name.split("/").pop();

        window.resolveLocalFileSystemURL(me.fileURI, function(entry_path) {
            entry_path.getFile(localFile, {create: false, exclusive: false}, function(fileEntry) {
                fileEntry.file(function (file) {
                    reader = new FileReader();

                    reader.onloadend = function(evt) {
                        deferred.resolve(evt.target.result);
                    };

                    reader.readAsDataURL(file);
                }, function(error) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('media','500021', { classe: 'fotos.class.js', metodo: 'readPic', file: file },{mensagem_padrao:'Erro file: ' +  error});          
                    deferred.reject('[500021]Erro file: ' + error.code);    
                });
            }, function(error) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('media','500022', { classe: 'fotos.class.js', metodo: 'readPic', file: localFile },{mensagem_padrao:'Erro getFile: ' + error});          
                deferred.reject('[500022]Erro getFile: ' + error.code + ' ' + name);
            });
        }, function(error) {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('media','500023', { classe: 'fotos.class.js', metodo: 'readPic', file: me.fileURI },{mensagem_padrao:'Erro resolveLocalFileSystemURL: '+ error});          
            deferred.reject('[500023]Erro resolveLocalFileSystemURL: ' + error.code);    
        });

        return deferred.promise();
    }

    this.deletePic = function(name) {
        var me = this;
        
        var deferred = $.Deferred();

        var localFile = control.appAlias + '/' + name.split("/").pop();

        window.resolveLocalFileSystemURL(me.fileURI, function(entry_path) {
            entry_path.getFile(localFile, {create: false, exclusive: false}, function(fileEntry) {
                fileEntry.remove(function() {
                    console.log('Arquivo removido')
                    deferred.resolve();
                }, function(error) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('media','500024', { classe: 'fotos.class.js', metodo: 'deletePic', file: me.fileURI },{mensagem_padrao: error});          
                    deferred.reject('[500024]Erro file: ' + error.code);    
                });
            }, function(error) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('media','500025', { classe: 'fotos.class.js', metodo: 'deletePic', file: me.fileURI },{mensagem_padrao: 'Erro getFile: ' + error + ' ' + localFile});             
                deferred.reject('[500025]Erro getFile: ' + error.code + ' ' + localFile);
            });
        }, function(error) {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('media','500026', { classe: 'fotos.class.js', metodo: 'deletePic', file: me.fileURI },{mensagem_padrao: error});                 
            deferred.reject('[500026]Erro resolveLocalFileSystemURL: ' + error.code);    
        });

        return deferred.promise();
    }


    this.renderFotosTab = function(obj, id){
        var me = this;

        var deferred = $.Deferred();

        obj.html('');

        this.getFotosAlvo(id).done(function(fotos){
            for(i in fotos){
                var item = '<div class="xcol-25"><a href="#" class="foto" data-id="' + fotos[i]['id'] + '" data-url="' + fotos[i]['arquivo'] + '" style="background-image: url(' + fotos[i]['arquivo'] + ')">&nbsp;<span class="sync-state ' + (fotos[i]['codigo'] ? 'yes' : 'no') + '"></span></a></div>';
                obj.append(item);
            }

            item = null;

            deferred.resolve();
        });

        return deferred.promise();
    }

    this.setupView = function(){
        var me = this;
    }





    this.processNovasFotos = function(itens, atual, deferred){
        var me = this;

        if(typeof itens[atual] != "undefined"){
            me.writePic(itens[atual]["arquivo"], itens[atual]["arquivo_base64"]).done(function(fullpath, filename){
                var values = { 'id':          null, 
                               'codigo':      itens[atual]["codigo"], 
                               'vloc_codigo': itens[atual]["vloc_codigo"], 
                               'arquivo':     fullpath, 
                               'remover':     0, 
                               'dt_inc':      formataDataDb(itens[atual]["dt_inc"]), 
                               'dt_sync_in':  formataDataDb(itens[atual]["dt_sync"]),
                               'dt_sync_out': formataDataDb(itens[atual]["dt_sync"]) };

                control.db.insertRow(me, values).always(function(){
                    me.processNovasFotos(itens, (atual+1), deferred);
                });
            }).fail(function(){
                me.processNovasFotos(itens, (atual+1), deferred);
            });
        } else {
            deferred.resolve("syncGetNovasFotos: Done.");
        }
    }

    this.syncGetNovasFotos = function(block){
        var me = this;

        var deferred = $.Deferred();

        me.getCodigosFotosEnviadas().done(function(arrAlvos, arrFotos){
            if(arrAlvos.length){
                var info = { 'arrAlvos': arrAlvos, 
                             'arrFotos': arrFotos };

                control.rest.makeRequest('/api_motorista_mobile/getFotos', info, false, false).done(function(res){
                    if(!res.erro){
                        me.processNovasFotos(res.data, 0, deferred);
                    } else {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('API','300010', { classe: 'fotos.class.js', metodo: 'syncGetNovasFotos' },{mensagem_padrao: "syncGetNovasFotos: Response error: " + res.data});                 
                        deferred.reject("[300010]syncGetNovasFotos: Response error: " + res.data);
                    }
                }).fail(function(error){
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('API','300011', { classe: 'fotos.class.js', metodo: 'syncGetNovasFotos' },{mensagem_padrao: "syncGetNovasFotos: Ajax error: " + error});                 
                    deferred.reject("[300011]syncGetNovasFotos: Ajax error.");
                });
            } else {
                deferred.resolve("syncGetNovasFotos: Done.");
            }
        }).fail(function(error){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100061', { classe: 'fotos.class.js', metodo: 'syncGetNovasFotos' },{mensagem_padrao: "syncGetNovasFotos: Query error: " + error});                 
            deferred.reject("[100061]syncGetNovasFotos: Query error.");
        });;

        return deferred.promise();
    }

    this.syncSendFotos = function(block){
        var me = this;

        var deferred = $.Deferred();

        var contDone = 0;
        var contError = 0;

        if (me.is_sync!==true) {
            me.is_sync = true;
            console.log('fotos antes');
            me.getFotosParaEnviar().done(function(itens){
                console.log('fotos depois');
                if(itens.length){
                    for(j in itens){
                        (function (i) {
                            me.readPic(itens[i]['arquivo']).done(function(foto_bin){
                                var info = {
                                    'id':          itens[i]['id'],
                                    'app_name':    config.appAlias, 
                                    'vloc_codigo': itens[i]['vloc_codigo'], 
                                    'arquivo':     itens[i]['arquivo'].split("/").pop(), 
                                    'foto_bin':    foto_bin
                                }
                                me.getDtSyncFoto(itens[i]['id']).done(function(item) {
                                    if (item!=null && item.codigo==null) {
                                        control.rest.makeRequest('/api_motorista_mobile/saveFoto', info, false, false).done(function(res){
                                            if(!res.erro){
                                                contDone++;
                                                var item = { 'codigo': res.data.codigo, 'dt_sync_out': res.data.dt_sync };
                                                control.db.updateRow(me, item, 'id', res.data.id);

                                                if(mainView.activePage.name == 'entrega'){
                                                    $(mainView.activePage.container).find('#fotos .foto[data-id=' + res.data.id + '] .sync-state').removeClass('no').addClass('yes');
                                                }
                                            } else {

                                                //Adicionar erro nao fatal ao fabric
                		                        ErrorClass.parseError('API','300009', { classe: 'fotos.class.js', metodo: 'syncSendFotos' },{mensagem_padrao: "syncSendFotos: Response error: " + res.data});                 
                                                contError++;
                                                console.log("syncSendFotos: Response error: " + res.data);
                                            }

                                            if((contError + contDone) == itens.length){
                                                if(contError){
                                                    me.is_sync = false;
                                                    deferred.reject("[300009]syncSendFotos: Error.");
                                                } else {
                                                    me.is_sync = false;
                                                    deferred.resolve("syncSendFotos: Done.");
                                                }
                                            }
                                        }).fail(function(e){
                                            contError++;
                                            console.log("syncSendFotos: Ajax error.");

                                            if((contError + contDone) == itens.length){
                                                if(contError){
                                                    //Adicionar erro nao fatal ao fabric
                                                    me.is_sync = false;
                		                            ErrorClass.parseError('API','300012', { classe: 'fotos.class.js', metodo: 'syncSendFotos' },{mensagem_padrao: "syncSendFotos: Error:" + e});                 
                                                    deferred.reject("[300012]syncSendFotos: Error.");
                                                } else {
                                                    me.is_sync = false;
                                                    deferred.resolve("syncSendFotos: Done.");
                                                }
                                            }
                                        });
                                    }
                                });

                            }).fail(function(m){
                                contError++;
                                console.log("syncSendFotos: Error - " + m);
                                //Adicionar erro nao fatal ao fabric
        		                ErrorClass.parseError('media','500027', { classe: 'fotos.class.js', metodo: 'syncSendFotos' },{mensagem_padrao: "syncSendFotos: Error - " + m});                 
                                if((contError + contDone) == itens.length){
                                    if(contError){
                                        me.is_sync = false;
                                        deferred.reject("[500027]syncSendFotos: Error.");
                                    } else {
                                        me.is_sync = false;
                                        deferred.resolve("syncSendFotos: Done.");
                                    }
                                }
                            });
                        }(j));
                    }
                } else {
                    me.is_sync = false;
                    deferred.resolve("syncSendFotos: No photos found.");
                }
            }).fail(function(){
                //Adicionar erro nao fatal ao fabric
                me.is_sync = false;
    		    ErrorClass.parseError('media','500028', { classe: 'fotos.class.js', metodo: 'syncSendFotos' },{mensagem_padrao: "syncSendFotos: Query error"});                             
                deferred.reject("[500028]syncSendFotos: Query error.");
            });
        } else {
            deferred.reject("Sincronização já em andamento");
        }
        return deferred.promise();
    }

    this.syncDeleteFotos = function(block){
        var me = this;

        var deferred = $.Deferred();

        me.getCodigosFotosRemovidas().done(function(arrFotos){
            if(arrFotos.length){
                var info = { 
                    'aplicativo':  config.appAlias, 
                    'plataforma':  config.appDevice, 
                    'versao':      config.appVersion, 
                    'vlfo_codigo': arrFotos
                };

                control.rest.makeRequest('/api_motorista_mobile/deleteFotos', info, false).done(function(res){
                    if(!res.erro){
                        for(idx in res.data) control.db.deleteRow(me, 'codigo', res.data[idx]);
                        deferred.resolve("syncDeleteFotos: Done.");
                    } else {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('API','300013', { classe: 'fotos.class.js', metodo: 'syncDeleteFotos' },{mensagem_padrao: "syncDeleteFotos: Response error: " + res.data});                             
                        deferred.reject("[300013]syncDeleteFotos: Response error: " + res.data);
                    }
                }).fail(function(error){
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('API','300014', { classe: 'fotos.class.js', metodo: 'syncDeleteFotos' },{mensagem_padrao: "syncDeleteFotos: Ajax error." + error});                             
                    deferred.reject("[300014]syncDeleteFotos: Ajax error.");
                });
            } else {
                deferred.resolve("syncDeleteFotos: No photos to be deleted.");
            }
        }).fail(function(error){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100062', { classe: 'fotos.class.js', metodo: 'syncDeleteFotos' },{mensagem_padrao: "syncDeleteFotos: Query error" + error});                 
            deferred.reject("[100062]syncDeleteFotos: Query error.");
        });

        return deferred.promise();
    }   

	this.loadTableInfo = function(){
		this.tbName   = 'fotos';
		this.tbPK     = 'id';
		this.tbFields = {  'id':          'INTEGER AUTOINCREMENT', 
	                       'codigo':      'INTEGER', 
	                       'vloc_codigo': 'INTEGER', 
	                       'arquivo':     'TEXT', 
	                       'remover':     'INTEGER', 
	                   	   'dt_inc':      'TEXT',
	                   	   'dt_alt':      'TEXT', 
	                   	   'dt_sync_in':  'TEXT',
	                   	   'dt_sync_out': 'TEXT' };
   	}

   	this.createTable = function(){
   		var deferred = $.Deferred();

   		control.db.createTable(this).done(function(){
            console.log('tabela fotos criada');
   			deferred.resolve();
   		}).fail(function(e){
            console.log('tabela fotos NÃO criada: '+e);
   			deferred.reject(e);
   		})

   		return deferred.promise();
   	}

   	this.dropTable = function(){
   		var deferred = $.Deferred();

   		control.db.dropTable(this).done(function(){
   			deferred.resolve();
   		}).fail(function(e){
   			deferred.reject(e);
   		})
   		
   		return deferred.promise();
   	}

}
