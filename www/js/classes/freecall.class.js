var freeCallClass = function(){

    this.in_calling = false;
    this.time_start_call = null;

	this.init = function(){
		var me          = this;
		var deferred    = $.Deferred();

		return deferred.promise();
	}

    this.getFreeCall = function() {
        var me       = this;
        var deferred = $.Deferred();
        //config.freeCall = false;
        try {
            if (typeof window.cordova.plugins.SNSdkWrapper != "undefined" && config.appDevice != 'browser') {
                //alert('19');
                window.cordova.plugins.SNSdkWrapper.initialize(function(retorno) {
                    //alert('21');
                    if (retorno=='OK') {
                        deferred.resolve('free');
                    } else {
                        //Adicionar erro nao fatal ao fabric
			            ErrorClass.parseError('generico','900016', { classe: 'freecall.class.js', metodo: 'getFreeCall'},{mensagem_padrao:'Erro ao conectar-se ao Plugin SNSdkWrapper'});	
                        deferred.reject('[900016]Erro ao conectar-se ao Plugin SNSdkWrapper');
                    }
                }, function(erro) {
                    if (erro.indexOf('already initialized')>0) {
                        deferred.resolve('already');
                    } else {
                        //Adicionar erro nao fatal ao fabric
			            ErrorClass.parseError('generico','900017', { classe: 'freecall.class.js', metodo: 'getFreeCall'},{mensagem_padrao:'Erro ao conectar-se ao Plugin SNSdkWrapper'});	       
                        deferred.reject('[900017]Erro ao conectar-se ao Plugin SNSdkWrapper');
                    }
                });
            } else {
                //Adicionar erro nao fatal ao fabric
			    ErrorClass.parseError('generico','900015', { classe: 'freecall.class.js', metodo: 'getFreeCall'},{mensagem_padrao: 'Plugin SNSdkWrapper inexistente'});	
                deferred.reject('[900015]Plugin SNSdkWrapper inexistente');
            }
        } catch(e) {
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900008', { classe: 'freecall.class.js', metodo: 'getFreeCall'},{mensagem_padrao: 'Erro ao instanciar Plugin SNSdkWrapper:' + e});	
            deferred.reject('[900008]Erro ao instanciar Plugin SNSdkWrapper');
        }
        return deferred.promise();
    }

    this.getTokenCallSDK = function(documento) {
        var me       = this;
        var deferred = $.Deferred();
        try {
            if (typeof window.cordova.plugins.SNSdkWrapper != "undefined" && config.appDevice != 'browser') {
                getTokenCall(documento).done(function(retorno) {
                    //alert(retorno);
                    deferred.resolve(retorno);
                }).fail(function(erro) {
                    //alert(erro);
                    //Adicionar erro nao fatal ao fabric
			        ErrorClass.parseError('generico','900023', { classe: 'freecall.class.js', metodo: 'getTokenCallSDK'},{mensagem_padrao:'Erro ao recuperar Token para o Plugin SNSdkWrapper'});	         
                	deferred.reject('[900023]Erro ao recuperar Token para o Plugin SNSdkWrapper');
                });
            } else {
                //Adicionar erro nao fatal ao fabric
			    ErrorClass.parseError('generico','900013', { classe: 'freecall.class.js', metodo: 'getTokenCallSDK'},{mensagem_padrao: 'Plugin SNSdkWrapper inexistente'});	
            	deferred.reject('[900013]Plugin SNSdkWrapper inexistente');
            }
        } catch(e) {
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900009', { classe: 'freecall.class.js', metodo: 'getFreeCall'},{mensagem_padrao: 'Erro ao instanciar Plugin SNSdkWrapper:' + e});	
            deferred.reject('[900009]Erro ao instanciar Plugin SNSdkWrapper');
        }
        return deferred.promise();

    }


    this.getTokenCall = function(settings) {
    	var me = this;
    	var deferred = $.Deferred();
    	if (settings.token_call!=null && settings.token_call!="") {
    		var myRet = {
                token_call: settings.token_call,
                senha_call: settings.senha_call
            };
            deferred.resolve(myRet);
    	} else {
    		me.getTokenCallSDK(settings.documento).done(function(retorno) {
     			if (retorno.sucesso) {
                    var myData = {
                        token_call: retorno.token,
                        senha_call: retorno.senha
                    };
                    console.log(retorno.token);
                    //alert(retorno.token);
                    control.db.updateRow(control.settings, myData, 'documento', settings.documento).done(function() {
                        deferred.resolve(myData);
                    }).fail(function(erro) {
                        //Adicionar erro nao fatal ao fabric
			            ErrorClass.parseError('generico','900024', { classe: 'freecall.class.js', metodo: 'getTokenCall'},{mensagem_padrao:'Erro ao salvar Token de Chamadas Gratuitas: '+erro});	         
                        deferred.reject('[900024]Erro ao salvar Token de Chamadas Gratuitas: '+erro);
                    });
                } else {
                    deferred.reject('[900024]'+retorno.erro);
                }
    		}).fail(function(erro) {
    			deferred.reject('[900024]'+erro);
    		})
    	}
        return deferred.promise();
    }

    this.login = function(token, numero) {
        var me       = this;
        var deferred = $.Deferred();
        try {
            if (typeof window.cordova.plugins.SNSdkWrapper != "undefined" && config.appDevice != 'browser') {
                //alert('102');
                window.cordova.plugins.SNSdkWrapper.login(token,numero,function(ret) {
                    //alert('104');
                    if (ret.indexOf('onRegistrationInProgress')<0) {
                        //alert('106');
                        deferred.resolve(ret);
                    }
                },function(erro) {
                    //alert('110');
                    deferred.reject(erro);
                })
            } else {
                //Adicionar erro nao fatal ao fabric
			    ErrorClass.parseError('generico','900014', { classe: 'freecall.class.js', metodo: 'login'},{mensagem_padrao: 'Plugin SNSdkWrapper inexistente'});	
                deferred.reject('[900014]Plugin SNSdkWrapper inexistente');
            }
        } catch(e) {
             //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900010', { classe: 'freecall.class.js', metodo: 'login'},{mensagem_padrao: 'Erro ao instanciar Plugin SNSdkWrapper:' + e});	
            deferred.reject('[900010]Erro ao instanciar Plugin SNSdkWrapper');
        }
        return deferred.promise();
    }

    this.configureTokenCall = function() {
    	var me = this;
    	var deferred = $.Deferred();
        control.db.selectRows(control.settings, 'codigo', 1, 1).done(function(settings){
    		me.getFreeCall().done(function () {
		    	me.getTokenCall(settings).done(function(ret) {
		    		var token_call = ret.token_call;
                    var senha_call = ret.senha_call;

                    setLocalValue('token_call', ret.token_call);
                    setLocalValue('senha_call', ret.senha_call);

                    var ddi = get_ddi(settings.codigo_pais);
                    //var ddi = (settings.codigo_pais=='11' ? '52' : '55');
                    var telefone = ddi+String(settings.telefone);
                    //alert('Telefone: '+telefone);
                    //alert('Token: '+token_call);

                    me.login(token_call, telefone).done(function(ret) {
                        if (ret.indexOf('onRegistrationSucces')>=0) {
        		    		console.log(ret);
                            config.freeCall = true;
        		    		deferred.resolve('ok');                            
                        } else {
                            config.freeCall = false;
                            //Adicionar erro nao fatal ao fabric
			                ErrorClass.parseError('generico','900025', { classe: 'freecall.class.js', metodo: 'configureTokenCall'},{mensagem_padrao:'Erro ao efetuar login em SDK para Chamadas Gratuitas'});	         
                            deferred.resolve("[900025]Erro ao efetuar login em SDK para Chamadas Gratuitas");
                        }
                    }).fail(function(erro) {
                        config.freeCall = false;
                        //Adicionar erro nao fatal ao fabric
			            ErrorClass.parseError('generico','900026', { classe: 'freecall.class.js', metodo: 'configureTokenCall'},{mensagem_padrao:'Erro ao efetuar login em SDK para Chamadas Gratuitas:'+ erro});	         
                        deferred.resolve("[900026]Erro ao efetuar login em SDK para Chamadas Gratuitas");
                    });
		    	}).fail(function(erro) {
                    //alert(erro);
                    console.log(erro);
	    			config.freeCall = false;
                    //Adicionar erro nao fatal ao fabric
			        ErrorClass.parseError('generico','900027', { classe: 'freecall.class.js', metodo: 'configureTokenCall'},{mensagem_padrao:'"Erro ao recuperar token para Chamadas Gratuitas:'+ erro});	          
	    			deferred.resolve("[900027]Erro ao recuperar token para Chamadas Gratuitas");
		    	});
    		}).fail(function(erro) {
                //alert(erro);
    			console.log(erro);
    			config.freeCall = false;
                //Adicionar erro nao fatal ao fabric
			    ErrorClass.parseError('generico','900018', { classe: 'freecall.class.js', metodo: 'configureTokenCall'},{mensagem_padrao:'Erro ao conectar-se ao SDK para Chamadas Gratuitas'});	
    			deferred.resolve("[900018]"+getErrorMessage('ErroConectarSDKChamada'));
    		});
        });
        return deferred.promise();
    }

    this.makeCall = function(numero, start_callback, end_callback) {
        var deferred = $.Deferred();
        var me = this;
        try {
            console.log(window.cordova.plugins.SNSdkWrapper);
            //alert('173');
            alert(window.cordova.plugins.SNSdkWrapper);
            if (typeof window.cordova.plugins.SNSdkWrapper != "undefined" && config.appDevice != 'browser') {
                var token_call = getLocalValue('token_call');
                window.cordova.plugins.SNSdkWrapper.makeCall(numero, token_call, function(ret) {
                    //alert(ret);
                    if (ret=='callConnected') {
                        me.in_calling = true;
                        me.time_start_call = $.now();
                        start_callback.call();
                        //deferred.resolve('start');
                    } else if (ret=='callEnd') {
                        me.in_calling = false;
                        end_callback.call();
                        //deferred.resolve('end');
                    } else {
                        if (ret.indexOf('callError')>=0) {
                            myApp.alert("[900028]"+getErrorMessage('ErroRealizarChamada'),getAlertMessage('Aviso'));
                            //Adicionar erro nao fatal ao fabric
			                ErrorClass.parseError('generico','900028', { classe: 'freecall.class.js', metodo: 'makeCall'},{mensagem_padrao:'"Erro ao realizar Chamada:'+ ret});	          
                            me.stopCall();
                            deferred.reject();
                        }
                    }
                }, function(erro) {
                    //alert(erro);
                    //Adicionar erro nao fatal ao fabric
			        ErrorClass.parseError('generico','900022', { classe: 'freecall.class.js', metodo: 'makeCall'},{mensagem_padrao:'Erro ao realizar Chamada:' + erro});	
                    myApp.alert("[900022]"+getErrorMessage('ErroRealizarChamada'),getAlertMessage('Aviso'));
                    me.stopCall();
                    deferred.reject();
                });
            } else {
                 //Adicionar erro nao fatal ao fabric
			    ErrorClass.parseError('generico','900019', { classe: 'freecall.class.js', metodo: 'makeCall'},{mensagem_padrao:'Erro ao conectar-se ao SDK para Chamadas Gratuitas'});	
                myApp.alert("[900019]"+getErrorMessage('ErroConectarSDKChamada'),getAlertMessage('Aviso'));
                deferred.reject();
            }
        } catch(e) {
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900011', { classe: 'freecall.class.js', metodo: 'makeCall'},{mensagem_padrao: 'Erro ao instanciar Plugin SNSdkWrapper:' + e});	
            deferred.reject('[900011]Erro ao instanciar Plugin SNSdkWrapper');
        }
        return deferred.promise();
    }

    this.stopCall = function() {
        var deferred = $.Deferred();
        var me = this;
        try {
            console.log(window.cordova.plugins.SNSdkWrapper);
            if (typeof window.cordova.plugins.SNSdkWrapper != "undefined" && config.appDevice != 'browser') {
                window.cordova.plugins.SNSdkWrapper.stopCurrentCall(function(ret) {
                    me.in_calling = false;
                    me.time_start_call = null;
                    deferred.resolve();
                }, function(erro) {
                    //Adicionar erro nao fatal ao fabric
			        ErrorClass.parseError('generico','900021', { classe: 'freecall.class.js', metodo: 'stopCall'},{mensagem_padrao:'Erro ao encerrar Chamada:' + erro});	
                    myApp.alert("[900021]"+getErrorMessage('ErroEncerrarChamada'),getAlertMessage('Aviso')); 
                    deferred.reject();
                });         
            } else {
                //Adicionar erro nao fatal ao fabric
			    ErrorClass.parseError('generico','900020', { classe: 'freecall.class.js', metodo: 'configureTokenCall'},{mensagem_padrao:'Erro ao conectar-se ao SDK para Chamadas Gratuitas'});	
                myApp.alert("[900020]"+getErrorMessage('ErroConectarSDKChamada'),getAlertMessage('Aviso'));
                deferred.reject();
            }
        } catch(e) {
             //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900012', { classe: 'freecall.class.js', metodo: 'stopCall'},{mensagem_padrao: 'Erro ao instanciar Plugin SNSdkWrapper:' + e});	
            deferred.reject('[900012]Erro ao instanciar Plugin SNSdkWrapper');
        }
        return deferred.promise();
    }

    this.makeCentralCall = function(start_callback, end_callback) {
        var deferred = $.Deferred();
        var numero = '4020';
        var me = this;
        //alert(me.in_calling);
        if (me.in_calling) {
            deferred.reject();
        } else {
            this.makeCall(numero, start_callback, end_callback).done(function() {
                deferred.resolve();
            }).fail(function() {
                deferred.reject();
            });
        }
        return deferred.promise();
    }

};