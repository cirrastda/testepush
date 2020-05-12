var mainClass = function(){
    this.page       = null;
	this.appName    = config.appName;
	this.appAlias   = config.appAlias;
	this.appBundle  = config.appBundle;
	this.appVersion = config.appVersion;
	this.appDate    = config.appDate;
	this.db         = null;
    this.push       = null;
	this.rest       = null;
	this.settings   = null;



    this.data_settings = null;

    this.pushRedirect = null;
    this.pushRedirectType = null;
    this.pushRedirectData = null;
	this.init = function(){
		var me          = this;
		var deferred    = $.Deferred();
		// this.db         = new dbClass();
        this.push       = new PushClass();
		// this.rest       = new restService();
		// this.settings   = new settingsClass();

		// this.settings.init();
        this.push.init().done(function() {
            deferred.resolve();
        });


		return deferred.promise();
	}
    
    this.createTables = function() {
        var me = this;
        var deferred = $.Deferred();
        me.resetTables().done(function(){
            console.log(me.data_settings);
            if (me.data_settings==null || me.data_settings.codigo==null || me.data_settings.codigo==undefined) {
                removeLocalValue('id');
                removeLocalValue('cpf');
                removeLocalValue('documento');
                removeLocalValue('nome');
                removeLocalValue('telefone');
                removeLocalValue('token');
                removeLocalValue('confirmtime');
            }
            removeLocalValue('lastLatitude');
            removeLocalValue('lastLongitude');
            removeLocalValue('sm_em_transito');
            removeLocalValue('parada');
            setLocalValue('dbVersion', me.db.dbVersion);
            var d1 = me.auxiliares.createTable();
            var d2 = me.settings.createTable();
            var d3 = me.viagem.createTable();
            var d4 = me.alvo.createTable();
            var d5 = me.comando.createTable();
            var d6 = me.fotos.createTable();
            var d7 = me.carretas.createTable();
            var d8 = me.auth.createTable();
            var d9 = me.rota.createTable();
            var d10 = me.checkin.createTable();
            var d11 = me.detalhesFrete.createTable();
            var d12 = me.pesquisaFrete.createTable();
            var d13 = me.mensagem.createTable();
            var d14 = me.push.createTable();

            $.when(d1, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14).then(function(){
                console.log(me.data_settings);
                if (me.data_settings!=null && me.data_settings.codigo!=null && me.data_settings.codigo!=undefined) {
                    control.db.insertRow(control.settings,me.data_settings).done(function() {
                        if (me.data_carretas != null) {
                            for (var i=0;i<me.data_carretas.length;i++) {
                                control.db.insertRow(control.carretas,me.data_carretas[i]);
                            }                            
                        }

                        deferred.resolve();                                
                    }).fail(function(msg) {
                        alert(msg);
                        deferred.reject();
                    });
                } else {
                   deferred.resolve();
                }
            }, function(msg){
                //Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100063', { classe: 'main.class.js', metodo: 'createTables'},{mensagem_padrao: msg});	
                alert('[100063]'+msg);
                console.log(msg);
                deferred.reject();
            });
        }).fail(function (msg) {
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100064', { classe: 'main.class.js', metodo: 'createTables'},{mensagem_padrao: msg});	
            alert('[100064]'+getErrorMessage('ErroRemoverTabelas')+': '+msg);
        });

        return deferred.promise();

    }

	this.checkTables = function(){
		var me = this;
		var deferred = $.Deferred();
        var create = (getLocalValue('dbVersion') != this.db.dbVersion);
        if (this.db.forceCreate!=undefined) {
            if (this.db.forceCreate) {
                create = true;
            }
        }
		if(create){
            var d1 = control.db.selectRows(control.settings,1,1,1);
            var d2 = control.db.selectRows(control.carretas,1,1,1);
            $.when(d1,d2).then(function(settings, carretas) {
                me.data_settings = settings;
                me.data_carretas = carretas;
                me.createTables().done(function() {
                    deferred.resolve();
                }).fail(function(msg) {
                    alert(msg);
                    deferred.reject();
                });
            }).fail(function() {
               
                me.data_settings = null;
                me.createTables().done(function() {
                    deferred.resolve();
                }).fail(function(msg) {
                    alert(msg);
                    deferred.reject();
                });
            });
		} else {
			deferred.resolve();
		}
		return deferred.promise();
	}
	this.resetTables = function(){
		var deferred = $.Deferred();
        var d1 = this.auxiliares.dropTable();
		var d2 = this.settings.dropTable();
        var d3 = this.viagem.dropTable();
        var d4 = this.alvo.dropTable();
        var d5 = this.comando.dropTable();
        var d6 = this.fotos.dropTable();
        var d7 = this.carretas.dropTable();
        var d8 = this.auth.dropTable();
        var d9 = this.rota.dropTable();
        var d10 = this.checkin.dropTable();
        var d11 = this.detalhesFrete.dropTable();
        var d12 = this.pesquisaFrete.dropTable();
        var d13 = this.mensagem.dropTable();
        var d14 = this.push.dropTable();

		$.when(d1, d2, d2, d3, d4, d5, d6, d7, d8, d9, d10, d11, d12, d13, d14).then(function(){
			deferred.resolve();
		}, function(){
			deferred.reject();
		});
		return deferred.promise();
	}
    this.routeEntrada = function(abreProximaEntrega, reload){
        var me = this;
        var abreProximaEntrega = typeof abreProximaEntrega != 'undefined' ? abreProximaEntrega : false;
        var reload = typeof reload != 'undefined' ? reload : false;
        myApp.showPreloader(getLoadingMessage('Carregando')+'...');
        /* control.freeCall.configureTokenCall().done(function(ret) {
            myApp.hidePreloader();
            if (config.freeCall==false) {
                myApp.alert('A Função de Chamadas Gratuitas não está habilitada neste aparelho', 'Alerta');
            }
 */
            if (!control.settings.checkLGPD()) {
                myApp.hidePreloader();
                mainView.showNavbar();
                me.loadLgpdMotorista(true,false);
                return false;
            }

            console.log(me.pushRedirect);
            if (me.pushRedirect !== null ){
                myApp.hidePreloader();
                mainView.showNavbar();
                if (me.pushRedirectType=='back') {
                    mainView.router.back({url: me.pushRedirect, context: me.pushRedirectData, ignoreCache: true, force: true, refresh: true });
                } else {
                    mainView.router.loadPage({url: me.pushRedirect, context: me.pushRedirectData, ignoreCache: true, force: true }); 
                }

                me.pushRedirect = null;
                me.pushRedirectType = null;
                me.pushRedirectData = null;
                return false;
            }

            control.viagem.getViagemCompleta().done(function(viagem_atual){
                myApp.hidePreloader();
                if(viagem_atual != null){
                    setLocalValue('sm_em_transito', (viagem_atual.viag_data_inicio_provisorio && !viagem_atual.viag_data_fim_provisorio ? 1 : 0));
                    
                    //Configuracao dos dados do usuário para o fabric
                    if (typeof window.fabric != "undefined") {
                        if(getLocalValue('sm_em_transito')=='1'){
                            window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                        }else{
                            window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                        }
                    }

                    console.log(viagem_atual);
                    if(!viagem_atual.viag_data_inicio_provisorio){
                        //console.log('info-viagem');
                        if (reload) {
                            myApp.hideIndicator();
                            mainView.showNavbar();
                            mainView.router.loadPage({ url: 'viagem.html', context: viagem_atual, ignoreCache: true, reload: true });
                            //mainView.router.loadPage({url: 'info-viagem.html', context: viagem_atual, ignoreCache: true, reload: true});
                        } else {
                            mainView.showNavbar();
                            mainView.router.loadPage({ url: 'viagem.html', context: viagem_atual, ignoreCache: true});
                            //mainView.router.loadPage({url: 'info-viagem.html', context: viagem_atual, ignoreCache: true});
                        }
                        //mainView.router.loadPage({ url: 'info-viagem.html', context: viagem_atual, ignoreCache: true, reload: true });
                    } else {
                        if(abreProximaEntrega && !viagem_atual.viag_data_fim_provisorio){
                            mainView.showNavbar();
                            if (reload) {
                                mainView.router.loadPage({ url: 'viagem.html', context: viagem_atual, reload: true, ignoreCache: true });
                            } else {
                                mainView.router.loadPage({ url: 'viagem.html', context: viagem_atual });
                            }
                            /*                        
                            control.alvo.getProximaEntrega().done(function(codigo){
                                control.alvo.abreAlvo(codigo);
                            }).fail(function(){
                                mainView.router.loadPage({ url: 'itinerario.html', context: viagem_atual });
                            });
                            */
                        } else if(viagem_atual.viag_data_fim_provisorio){
                            control.viagem.checkSincronismoPendente(viagem_atual.viag_data_fim_provisorio).done(function(total){
                                if(total){
                                    //mainView.router.loadPage({ url: 'itinerario.html', context: viagem_atual });
                                    // mainView.router.loadPage({ url: 'sem-viagem.html' });
                                    control.viagem.loadSemViagem();
                                    control.sync.notificarRede();
                                    control.viagem.checkTudoSincronizado();
                                } else {
                                    control.sync.escondeNotificacaoRede();
                                    // control.db.deleteRow(control.viagem, 1, 1).done(function(){
                                    //     control.db.deleteRow(control.alvo, 1, 1);
                                    //     control.fotos.limpaFotos();
                                    control.viagem.loadSemViagem();
                                        // mainView.router.loadPage({ url: 'sem-viagem.html' });
                                    // });
                                }
                            });
                        } else {
                            mainView.showNavbar();
                            if (reload) {
                                mainView.router.loadPage({ url: 'viagem.html', context: viagem_atual, reload: true, ignoreCache: true });
                            } else {
                                mainView.router.loadPage({ url: 'viagem.html', context: viagem_atual });
                            }
                            //mainView.router.loadPage({ url: 'itinerario.html', context: viagem_atual });
                        }
                    }
                } else {
                    console.log('loadSemViagem');
                    control.viagem.loadSemViagem();
                    // mainView.router.loadPage({ url: 'sem-viagem.html' });
                }

            }).fail(function(msg){
                console.log(msg);
                myApp.hidePreloader();
                control.viagem.loadSemViagem();
                // mainView.router.loadPage({ url: 'sem-viagem.html' });
            });
        /* }) */
    }
    this.getFree = function() {
        var me       = this;
        var deferred = $.Deferred();
        config.free = false;
        // config.free = true;
        // deferred.resolve('free');
        // alert(smiSdkPlugin);
        if (config.appDevice != "browser") {
            if (typeof smiSdkPlugin != "undefined") {
                smiSdkPlugin.getSdState(function(sdState) {
                    // Custom Messaging Code Here
                    //alert(sdState);
                    if (sdState=='SD_AVAILABLE') {
                        config.free = true;
                        deferred.resolve('free');
                    } else {
                        deferred.resolve('not free');                    
                    }
                     //alert("Passo 1");
                     //alert("OK "+ sdState)
                });
            } else {
                deferred.resolve('not free');            
            }
        } else {
            deferred.resolve('not free');            
        }
        return deferred.promise();
    }



    this.splashFree = function() {
        var me       = this;
        var deferred = $.Deferred();

        me.getFree().done(function() {
            if (config.free) {

                mainView.router.load({ url: 'gratis.html' });
                mainView.hideNavbar();
                setTimeout(function(){
                    deferred.resolve('free');
                }, 5000);
            } else {
                deferred.resolve('no_free');
            }            
        });

        return deferred.promise();
    }

    this.loadPanelLeft = function(url, params) {
        var deferred = $.Deferred();
        Dom7.get(url, params, function (data) {
            var compiled = Template7.compile(data);
            var html = compiled(params);
            var template = html;
            //var template = $(html).find('#tplavaliar').html();
            $('.panel-left').html(template);

            deferred.resolve(html);
        });
        return deferred.promise();
    }

    this.loadMenu = function() {
        var me = this;
        var deferred = $.Deferred();
        var url = 'menu.html';
        //var params = me.dados_viagem;
        control.settings.getDataByDocumento().done(function(dados) {
            var params = {
                'dados': dados,
            };
            console.log(params);
            me.loadPanelLeft(url,params).done(function(html) {
                control.loadDadosPanel();
                control.loadActionsMenu();
                $('.panel-left').removeClass('black-screen');
                myApp.openPanel('left');
                translate(getLocalValue('language'));
                deferred.resolve();
            });

        });

        return deferred.promise();
    }

    this.loadActionsMenu = function() {
        $(document).on('click', 'a.btnDados', function(e){
            e.preventDefault();
            // control.db.selectRows(me.settings, "REPLACE(REPLACE(documento,'.',''),'-','')", so_numeros(getLocalValue('cpf')), 1).done(function(res){
            // control.settings.getData("REPLACE(REPLACE(documento,'.',''),'-','')", so_numeros(getLocalValue('cpf'))).done(function(res) {
            control.settings.getDataByDocumento().done(function(res) {
                var item = {};
                console.log(res);
                for(i in res) item[i] = res[i];
                //getPaises().done(function(paises) {
                    var d = new Date();
                    var n = d.getTime();

                    item.documento = formataCPF(item.documento);
                    item.pais = get_pais(item.codigo_pais);
                    item.telefone  = formataTelefone(item.telefone, item.codigo_pais);
                    item.n = n;
                    // item.obrigatoriedade = 'frete';
                    control.settings.renderDadosCadastro('dados-pessoais',true,item);

                    // mainView.router.load({ url: 'dados-pessoais.html', context: item });
                //});
            });
        });

        $(document).on('click', 'a.btnPrivacidade', function(e){
            e.preventDefault();
            var current_page = mainView.activePage.name;
            control.settings.getDataByDocumento().done(function(res) {
                var documento = getLocalValue('cpf');
                var codigo = res.codigo;
                myContext = {codigo: codigo, documento: documento, logado: true};
                control.auth.loadTelaPermissoes(false, current_page, myContext);
            });

        });            
        $(document).on('click', 'a.btnAbout', function(e){
            e.preventDefault();
            mainView.router.load({ url: 'about.html', context:config, ignoreCache: true, force: true });
        });
        $(document).on('click','.btnAtualizar',function(e) {
            e.preventDefault();
            setLocalValue('viag_codigo_sm', null);
            setLocalValue('sm_em_transito', 0);

            //Configuracao dos dados do usuário para o fabric
            if(getLocalValue('sm_em_transito')=='1'){
                window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
            }else{
                window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
            }
            if(getLocalValue('viag_codigo_sm') != null){
                window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
            }

            control.db.deleteRow(control.viagem, 1, 1).done(function(){
                control.db.deleteRow(control.alvo, 1, 1);
                control.mensagem.limpaMensagens();
                control.fotos.limpaFotos();
                var dados_atualiza_comando = {
                    sent: '1900-01-01 00:00:00'
                };
                control.db.updateRow(control.comando,dados_atualiza_comando,'sent',null);
                control.sync.firstSync().done(function(ret) {
                    deferred.resolve(ret);
                }).fail(function(msg) {

                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database','900008', { classe: 'main.class.js', metodo: 'setupView'},{mensagem_padrao: 'Erro ao assumir viagem: '+msg});  
                    myApp.alert('[900008]'+getErrorMessage('ErroAssumirViagem')+': '+msg,getAlertMessage('Aviso'));
                    deferred.reject(msg)
                });
                deferred.resolve("syncViagem: Done.");
            }).fail(function(){
                 //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100071', { classe: 'main.class.js', metodo: 'setupView'},{mensagem_padrao:"syncViagem: Query error."});                 
                deferred.reject("syncViagem: Query error.");
            });
        });

    }
	this.setupView = function(){
		var me       = this;
        var deferred = $.Deferred();
        myApp.onPageInit('index', function(page) {
            if(typeof mainView.activePage.fromPage != "undefined") return false;
            $(document).on('click', 'a.btnInfoViagem', function(e){
                e.preventDefault();
                control.viagem.getViagemCompleta().done(function(res){
                    var item = {};
                    for(i in res) item[i] = res[i];
                    item.viag_placa = formataPlaca(item.viag_placa);
                    if(item.viag_codigo_sm) mainView.router.loadPage({url: 'info-viagem.html', context: item});
                });
            });
            (function blink() {
              $(".blink").fadeOut(2000).fadeIn(200, blink);
            })();
            $(".panel .img-profile-menu").bind("taphold", function(e){
                myApp.showPreloader();
                control.db.selectRows(control.comando, 1, 1, false, 'id', 'DESC').done(function(res){
                    var itens = [];
                    for(i in res){
                        itens[i] = {};

                        for(x in res[i]) itens[i][x] = res[i][x];

                        itens[i]['sent']            = formataDataView(itens[i]['sent']);
                        itens[i]['data_cadastrada'] = formataDataView(itens[i]['data_cadastrada']);
                    }
                    var itens = { 'comandos': itens };
                    mainView.router.load({ url: 'comandos.html', context: itens });
                    myApp.closePanel();
                    myApp.hidePreloader();
                });
            });
            if(me.settings.checkLogin()){
                me.settings.checkFotoMotorista().done(function() {
                    console.log('foto atualizada');
                });
                if (control.settings.checkLGPD()) {
                    control.push.setupPushNotification();
                    // control.auth.syncGetPermissoes(false).done(function() {
                        control.sync.startAllSyncs(true);
                        if (control.auth.checkAuthFrete()) {
                            control.sync.syncClickCargo();
                        }
                        mainView.showNavbar();                                            
                    // });
                }
                me.routeEntrada(true);
            } else if(me.settings.checkTempLogin()) {
                mainView.showNavbar();
                mainView.router.loadPage('conf-codigo.html');
            } else {
                mainView.hideNavbar();
                me.getFree().done(function() {
                    if (config.free) {
                        mainView.router.loadPage('gratis.html');
                    } else {                
                        mainView.router.loadPage('seleciona-pais.html');
                        // mainView.router.loadPage('iniciar.html');
                    }
                });
            }
        }).trigger();
        myApp.onPageAfterAnimation('*', function(page) {
            var pageContainer = $(page.container);
            if(typeof navigator.splashscreen != "undefined") navigator.splashscreen.hide();
            setTimeout(function(){
                switch(page.name){
                    case 'login-screen':
                        if(me.settings.checkLogin()) {
                            mainView.showNavbar();
                            control.routeEntrada();
                        } else {

                            control.settings.carregarComboPaises(pageContainer).done(function() {
                                // DEFAULT = BRASIL
                                var campo_pais = pageContainer.find('[name=pais]');
                                var codigo_pais = getLocalValue('codigo_pais');
                                var crd; 
                                if(codigo_pais==null){
                                    codigo_pais = 1;
                                    setLocalValue('codigo_pais', codigo_pais);
                                    setFieldValue(campo_pais,codigo_pais);
                                    campo_pais.trigger('change');
                                }else{
                                    setFieldValue(campo_pais,codigo_pais);
                                    campo_pais.trigger('change');
                                }

                                // var options = {
                                //     enableHighAccuracy: true,
                                //     timeout: 50000,
                                //     maximumAge: 0
                                //   };

                                // function successoBuscaPosicao(pos) {
                                //     crd = pos.coords;

                                //     function successbuscaPais(result) {
                                //         console.log(result);
                                //         if (typeof result[0] !== "undefined") {
                                //             var firstResult = result[0];
                                //             if(firstResult.countryCode == "BR"){
                                //                 codigo_pais = 1;
                                //                 setLocalValue('codigo_pais', codigo_pais);
                                //             }else if (firstResult.countryCode == "MX"){
                                //                 codigo_pais = 11;
                                //                 setLocalValue('codigo_pais', codigo_pais);
                                //             }
                                //         } else {
                                //             if(result == "pt-BR"){
                                //                 codigo_pais = 1;
                                //                 setLocalValue('codigo_pais', codigo_pais);
                                //             }else if (result == "en-MX"){
                                //                 codigo_pais = 11;
                                //                 setLocalValue('codigo_pais', codigo_pais);
                                //             }
                                //         }
                                //         setFieldValue(campo_pais,codigo_pais);
                                //         campo_pais.trigger('change');
                                //     }
                                  
                                //     function failureBuscaPais(err) {
                                //         console.log(err);
                                //         console.warn('ERROR(' + err.code + '): ' + err.message);
                                //     }

                                //     var codigo_pais = getLocalValue('codigo_pais');
                                //     setFieldValue(campo_pais,codigo_pais);
                                //     campo_pais.trigger('change');
                                //     // navigator.globalization.getLocaleName(successbuscaPais, failureBuscaPais);

                                //     // getPaisSimCard().done(successbuscaPais).fail(function() {
                                //     //     getPaisDeviceLocale().done(successbuscaPais).fail(function() {
                                //     //         getPaisGeocode(successbuscaPais,failureBuscaPais);
                                //     //     });
                                //     // });
                                //     // window.plugins.carrier.getCarrierInfo(successbuscaPais, failureBuscaPais);
                                //     //nativegeocoder.reverseGeocode(successbuscaPais, failureBuscaPais,crd.latitude, crd.longitude, { useLocale: true, maxResults: 1 });
                                // };
                                  
                                // function erroBuscaPosicao(err) {
                                // console.warn('ERROR(' + err.code + '): ' + err.message);
                                // };

                                // navigator.geolocation.getCurrentPosition(successoBuscaPosicao, erroBuscaPosicao, options);
                            });
                            pageContainer.on('change','[name=pais]',function() {
                                var campo_pais = $(this);
                                //control.settings.alterarMascaraTelefones(pageContainer, getFieldValueObj(campo_pais));
                                pageContainer.find('input[name="telefone"]').focus(function(){$(document.body).addClass('keyboard-up');}).blur(function(){$(document.body).removeClass('keyboard-up');});
                            });
                        }
                    break;
                    case 'seleciona-pais':
                        var campo_pais = pageContainer.find('[name=pais]');
                        function successbuscaPais(codigo_pais) {
                            setFieldValue(campo_pais,codigo_pais);
                            campo_pais.trigger('change');
                        }

                        function failureBuscaPais(err) {
                            console.log(err);
                            console.warn('ERROR(' + err.code + '): ' + err.message);
                        }

                        pageContainer.on('change','[name=pais]',function() {
                            var campo_pais = $(this);
                            var codigo_pais = getFieldValueObj(campo_pais);
                            setPais(codigo_pais);
                            // control.settings.alterarMascaraTelefones(pageContainer, getFieldValueObj(campo_pais));
                            // pageContainer.find('input[name="telefone"]').focus(function(){$(document.body).addClass('keyboard-up');}).blur(function(){$(document.body).removeClass('keyboard-up');});
                        });

                        pageContainer.find('.btnSelecionaPais').click(function(e){
                            e.preventDefault();
                            mainView.hideNavbar();
                            mainView.router.loadPage('iniciar.html');
                        });

                        control.settings.carregarComboPaises(pageContainer).done(function() {
                            // DEFAULT = BRASIL
                            var campo_pais = pageContainer.find('[name=pais]');
                            getPaisSimCard().done(successbuscaPais).fail(function() {
                                getPaisDeviceLocale().done(successbuscaPais).fail(function() {
                                    getPaisGeocode(successbuscaPais,failureBuscaPais);
                                });
                            });
                        });

                        break;
                    case 'iniciar':
                    case 'pre-login':
                    case 'cadastrar':
                    case 'gratis':
                    case 'photo-login':
                    break;
                    case 'conf-codigo':
                        if(me.settings.checkLogin()){
                            mainView.showNavbar();
                            control.routeEntrada();
                        } else if(!me.settings.checkTempLogin()) {
                            mainView.hideNavbar();
                            mainView.router.loadPage('login.html', {ignoreCache: true, force: true, context: {language: getLocalValue('language').substring(0,2)}});
                        }
                    break;
                    default:
                        if(!me.settings.checkLogin()) {
                            mainView.hideNavbar();
                            mainView.router.loadPage('login.html',{context: {language: getLocalValue('language').substring(0,2)}});
                        }
                    break;
                }
                
            }, 100);
            translate(getLocalValue('language'), pageContainer);
            pageContainer.find('form').on('submit', function(e){
                e.preventDefault();
                $('*').blur();
                $(this).find('.submitBtn').trigger('click');
                return false;
            });
        });
        myApp.onPageInit('*', function(page){
            me.page = page;
            //console.log(me.page.context);
            if (me.page.context) {
                me.page.context.language = getLocalValue('language');
            }
            setTimeout(function(){ setup_mascaras(); }, 300);
            me.loadDadosPanel();

        });
    }
    
    this.loadDadosPanel = function() {
        var me = this;
        if(getLocalValue('nome')){
            var nome = $.trim(getLocalValue('nome'));
            nome = nome ? nome.split(" ") : [ "Usuário" ];
            if(nome.length > 1){
                nome = nome[0] + " " + nome[(nome.length - 1)];
            } else {
                nome = nome[0];
            }
            $('body .panel-left .username').html(nome.toUpperCase());
        }

        if (getLocalValue('foto')) {
            var foto = getLocalValue('foto');
            var d = new Date();
            var n = d.getTime();

            //var nome_arquivo = foto.replace('file://','');
            //foto = '';
            if (foto!='') {
                var nome_arquivo = foto;
                console.log(nome_arquivo);
                try {
                    window.resolveLocalFileSystemURL(nome_arquivo, function() {
                        $('body .panel-left .img-profile-menu').css('background-image',"url('"+foto+"?"+n+"')");
                    }, function() {
                        console.log('foto não existe');
                        $('body .panel-left .img-profile-menu').css('background-image',"url('img/profile/ico-profile.png')");
                    });
                } catch(e) {
                    $('body .panel-left .img-profile-menu').css('background-image',"url('img/profile/ico-profile.png')");
                }
            } else {
                $('body .panel-left .img-profile-menu').css('background-image',"url('img/profile/ico-profile.png')");
            }
        }        
    }

    this.loadLgpdMotorista = function(logado, atualizar_dados, campos){
        var me = this;
        if (campos==null || campos==undefined) campos = {};
        if (logado) {
            d1 = control.settings.getDataByDocumento();
        } else {
            d1 = getDadosMotorista(cpf);
        }

        d1.done(function(data) {
            if (data.erro) {
                deferred.reject(res.erro);
            } else {
                var codigo_profissional;
                if (logado) {
                    control.settings.setDataAutorization(null, data);
                    codigo_profissional = data.codigo;
                } else {
                    control.settings.setDataAutorization(data, campos);
                    codigo_profissional = data.Profissional.codigo;
                }
                control.settings.questionaLgpd(codigo_profissional, logado);
            }
        }).fail(function() {
            ErrorClass.parseError('database',(logado ? '100083' : '100053'), { classe: 'main.class.js', metodo: 'createTables'},{mensagem_padrao: msg});  
            deferred.reject('Erro ao Buscar dados do Motorista');
        })

        //return deferred.promise();
    }//FINAL lgpdMotoristaJaExistente
    this.renderQuestionaLgpd = function(codigo, logado, type) {
        var deferred = $.Deferred();
        if (logado==null || logado==undefined) logado = false;
        if (type==null || type==undefined) type = 'load';
        getTextoLgpd().done(function(res) {
            var documento = getLocalValue('cpf');
            myContext = {codigo: codigo, documento: documento, logado: logado, texto_lgpd: res.texto};
            if (type=='load') {
                mainView.router.load({ url: 'aceite-lgpd.html', context: myContext, force: false, reload: false });
            } else {
                console.log(myContext);
                mainView.router.back({ url: 'aceite-lgpd.html', context: myContext, force: true, reload: false });
            }
            deferred.resolve();
        }).fail(function(msg) {
            deferred.reject(msg);
        });
        return deferred.promise();
    }    

};