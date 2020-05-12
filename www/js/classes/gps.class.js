var GPSClass = function(){
    
    var modal_opened = false;

    this.init = function(){
        var deferred = $.Deferred();

        deferred.resolve();

        return deferred.promise();
    }    

    this.checkGPSActive = function() {
        var deferred = $.Deferred();
        if((typeof cordova != 'undefined') && (typeof cordova.plugins != 'undefined') && (typeof cordova.plugins.diagnostic !='undefined') && (config.appDevice != "browser") ){
            console.log("Cordova Exists");
            cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
                console.log("Enabled: "+enabled);
                if (enabled) {
                    if (device.platform === "iOS") {
                        cordova.plugins.diagnostic.isLocationAuthorized(function(enabled) {
                            if (enabled) {
                                deferred.resolve("enabled");    
                            } else {
                                deferred.reject("unauthorized");
                            }
                        }, function(error) {
                            //Adicionar erro nao fatal ao fabric
                            ErrorClass.parseError('GPS','200001', { classe: 'gps.class.js', metodo: 'checkGPSActive'},{mensagem_padrao: error});	                                
                            console.log(error);
                            deferred.reject("[200001]error: "+error);
                        });
                    } else {
                        deferred.resolve("enabled");
                    }
                } else {
                    deferred.reject("disabled");
                }
            },function (error) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('GPS','200002', { classe: 'gps.class.js', metodo: 'checkGPSActive'},{mensagem_padrao: error});	                            
                console.log(error);
                deferred.reject("[200002]error: "+error);
            });
        } else {
            console.log("Cordova Not Exists");
            deferred.resolve(null);
        }
        return deferred.promise();
    }

    this.loadHtml = function(mensagem) {
        var me = this;
        var deferred = $.Deferred();
        me.$$ = Dom7;
        var dados = {mensagem: mensagem};
        //console.log("Before Load HTML 2");
        me.$$.get('gps-modal.html', dados, function (data) {
            //console.log("After Load HTML 2");
            var compiled = Template7.compile(data);
            //console.log("After Compile HTML 2");
            var html = compiled(dados);
            //console.log("After Get HTML 2");
            deferred.resolve(html);
        });

        return deferred.promise();
    }

    this.loadTemplate = function(template_id, mensagem) {
        var me = this;
        var deferred = $.Deferred();
        me.$$ = Dom7;
        //console.log("Before Load HTML");
        me.loadHtml(mensagem).done(function(html) {
            //var obj = me.$$(html)
            var obj = $(html);
            //console.log("After Get HTML");
            var return_html = obj.filter('#'+template_id).html();

            //console.log("After Get Template");
            deferred.resolve(return_html);
        });

        return deferred.promise();
    }

    this.showMessage = function(error_type) {
        var me = this;
        //console.log(error_type);
        if (!me.modal_opened) {
            if (error_type=="disabled") {
                me.showModalEnableGPS();
            } else if (error_type=="unauthorized") {
                me.showModalAuthorizeGPS();
            } else {
                var error = error_type.replace("error: ","");
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('GPS','200007', { classe: 'gps.class.js', metodo: 'showMessage'},{mensagem_padrao: 'Erro ao recuperar o Status do GPS'});	                            
               
                myApp.alert("[200007]"+getErrorMessage('ErroStatusGPS'),getAlertMessage('Atencao'));
                //console.log("Erro ao recuperar o Status do GPS: "+error)
            }
        }
    }

    this.enableGPS = function() {
        var deferred = $.Deferred();
        if (device.platform !== "iOS") {
            cordova.plugins.diagnostic.switchToLocationSettings(function(){
                deferred.resolve();
                //
            }, function(error){
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('GPS','200003', { classe: 'gps.class.js', metodo: 'enableGPS/switchToLocationSettings'},{mensagem_padrao: error});	                            
                myApp.alert("[200003]"+getErrorMessage('ErroConfiguracaoGPS')+". "+getErrorMessage('PorFavorAlterePreferencias')+".",getAlertMessage('Atencao'))
                deferred.reject(error);
            });            
        } else {
            cordova.plugins.diagnostic.switchToSettings(function(){
                deferred.resolve();
                //
            }, function(error){
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('GPS','200004', { classe: 'gps.class.js', metodo: 'enableGPS/switchToSettings'},{mensagem_padrao: error});	                            
                myApp.alert("[200004]"+getErrorMessage('ErroConfiguracaoGPS')+". "+getErrorMessage('PorFavorAlterePreferencias')+".",getAlertMessage('Atencao'))
                deferred.reject(error);
            });            
        }
        return deferred.promise();
    }

    this.authorizeGPS = function() {
        var deferred = $.Deferred();
        //console.log(device);
        if (device.platform == "iOS") {
            if (getMainPlatformVersion()>7) {
                //console.log("requestLocationAuthorization call");
                cordova.plugins.diagnostic.requestLocationAuthorization(function(status){
                    //console.log("requestLocationAuthorization OK");
                    console.log(status);
                    deferred.resolve();
                }, function(error){
                    //console.log("requestLocationAuthorization error");
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('GPS','200005', { classe: 'gps.class.js', metodo: 'authorizeGPS'},{mensagem_padrao: error});	                            
                    myApp.alert("[200005]"+getErrorMessage('ErroAutorizarAcessoGPS')+".<br/><br/>"+getErrorMessage('PorFavorVerifiquePermissoes')+". <br/>"+getErrorMessage('CasoNaoFuncioneReinstale')+".",getAlertMessage('Atencao'))
                    deferred.reject(error);
                }, "always");                
            } else {
                //console.log("lower version");
                deferred.reject("lower version");
            }
        } else {
            deferred.reject("not ios");            
        }

        return deferred.promise();

    }

    this.showModalEnableGPS = function() {
        var me = this;
        var mensagem = "Deseja ativá-lo?";
        //console.log("Before Load");
        me.loadTemplate('tpl-gpsinactive',mensagem).done(function(modal_text) {
            //console.log(modal_text);
            me.modal_opened = true;
            var mod = myApp.modal({
                title: "GPS Desativado",
                text: modal_text,
                buttons: [
                    {
                        text: "Não",
                        close: true,
                        onClick: function() {
                            me.modal_opened = false;
                        }
                    },
                    {
                        text: "Sim",
                        close: true,
                        onClick: function() {
                            me.enableGPS().fail(function(error) {
                                //Adicionar erro nao fatal ao fabric
                                ErrorClass.parseError('GPS','200006', { classe: 'gps.class.js', metodo: 'showModalEnableGPS'},{mensagem_padrao: "Erro ao carregar tela de Configuração: "+error});	                            
                                console.log("Erro ao carregar tela de Configuração: "+error);
                            });
                            me.modal_opened = false;                            
                        }
                    }
                ]
            });
        });
    }

    this.showModalAuthorizeGPS = function() {
        var me = this;
        var mensagem = getErrorMessage('PorFavorVerifiquePermissoes')+".<br/>"+getErrorMessage('CasoNaoFuncioneReinstale')+".";
        var botoes = [
            {
                text: "OK",
                close: true,
                onClick: function() {
                    me.modal_opened = false;
                }                
            }                
        ];
        /* COMENTADO DEVIDO A RESTRICOES DO IOS NA CHAMADA. SÓ É CHAMADO QUANDO NÃO HÁ DEFINIÇÃO DA PERMISSÃO (O QUE É DEFINIDO AUTOMATICAMENTE NA PRIMEIRA CHAMADA). CASO NÃO HAJA PERMISSÃO, NÃO TEM EFETIVIDADE. ALTERADO APENAS PARA RETORNAR UMA MENSAGEM.
        if (device.platform === "iOS") {
            if (getMainPlatformVersion()>7) {
                botoes[0].text = "Não";
                mensagem = "Deseja autorizá-lo?";
                botoes.push({
                    text: "Sim",
                    close: true,
                    onClick: function() {
                        me.authorizeGPS().fail(function(error) {
                            console.log("Erro ao carregar tela de Configuração: "+error);
                        });
                        me.modal_opened = false;
                    }
                });
            }
        }*/
        var modal_text = me.loadTemplate('tpl-gpsunauthorized',mensagem).done(function (modal_text) {
            me.modal_opened = true;

            myApp.modal({
                title: "GPS Desativado",
                text: modal_text,
                buttons: botoes
            });
        });
    }

    this.addEventHandler = function() {
        if((typeof cordova != 'undefined') && (typeof cordova.plugins != 'undefined') && (typeof cordova.plugins.diagnostic !='undefined') && (config.appDevice != "browser") ){
            cordova.plugins.diagnostic.registerLocationStateChangeHandler(function(state){
                if((device.platform === "Android" && state !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
                    || (device.platform === "iOS") && ( state === cordova.plugins.diagnostic.permissionStatus.GRANTED
                        || state === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE
                )){

                } else {
                    if (getLocalValue('viag_codigo_sm')!==null) {
                        // me.checkGPSActive().done(function(retorno) {
                        //     console.log(retorno!==null?"GPS Ativo":"Plataforma sem GPS");
                        // }).fail(function(error_type) {
                        control.gps.showMessage(error_type);
                        // });
                    }
                }
            });
        }

    }


}