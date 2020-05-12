var PushClass = function(){
    
	this.pushObjectObject     = null;
	this.pushObjectErr  = 0;

    this.init = function(){
        var deferred = $.Deferred();

		// this.loadTableInfo();
		// this.setupView();

        deferred.resolve();

        return deferred.promise();
    }   


	this.resetPushNotification = function(cpf, aplicativo, database_only){
		if (typeof aplicativo === "undefined") aplicativo = config.appAlias;
		if (typeof database_only === "undefined") database_only = false;
		if (this.pushObject && (!database_only)) {
			this.unregisterTopics();
			// this.pushObject.unregister(function(){});
		};
		var info = {
			'documento':  cpf,
			'token_push': '',
			'platform' : config.appDevice
		}
		var header = {
			'aplicativo': aplicativo
		};
		// control.rest.makeRequest('/api_motorista_mobile/saveTokenPushSistema', info, false, null, header);
	}

	this.unregisterTopics = function() {
		this.pushObject.unsubscribeFromTopic('all');
		this.pushObject.unsubscribeFromTopic(config.appDevice);
		this.pushObject.unsubscribeFromTopic('buonnydriver');
		this.pushObject.unsubscribeFromTopic('clickcargo');

	}

	this.registerTopics = function() {
		var me = this;
		me.pushObject.subscribeToTopic('all');
		me.pushObject.subscribeToTopic(config.appDevice);
		me.pushObject.subscribeToTopic('buonnydriver');
		me.pushObject.subscribeToTopic('clickcargo');		
	}

    this.removeNotifications = function() {
        $('.notifications').remove();
    }

    this.setLastData = function(data) {
    	localStorage.setItem('lastPushData',JSON.stringify(data) );
    	// if (config.debug) {
    	// 	this.addHistory(data);
    	// }
    }

    this.getLastData = function() {
    	return localStorage.getItem('lastPushData');
    }

    // this.addHistory = function(push_data) {
    // 	var me = this;
    // 	var deferred = $.Deferred();
    // 	var insert = {
    // 		data: curTime(),
    // 		push_info: JSON.stringify(push_data)
    // 	};
	   //  control.db.insertRow(me, insert).done(function(id) {
	   //      deferred.resolve(id);
	   //  }).fail(function(msg) {
    //         ErrorClass.parseError('database','100094', { classe: 'push.class.js', metodo: 'addHistory'},{mensagem_padrao: + 'Erro ao adicionar historico de push: '+msg });
	   //      deferred.reject(msg);
	   //  });
	   //  return deferred.promise();
    // }

    // this.trataMensagemParaConfirmacao = function(mensagem) {
    // 	mensagem = mensagem.replace(getAlertMessage('CliqueVisualizarFrete'),getAlertMessage('DesejaVisualizarFrete'));
    // 	mensagem = mensagem.replace('Clique para visualizar o Frete.',getAlertMessage('DesejaVisualizarFrete'));

    // 	mensagem = mensagem.replace(getAlertMessage('CliqueVisualizarOferta'),getAlertMessage('DesejaVisualizarOferta'));
    // 	mensagem = mensagem.replace('Clique para visualizar a Oferta.',getAlertMessage('DesejaVisualizarOferta'));

    // 	return mensagem;
    // }

    this.setRouteValues = function(data, type) {
    	control.pushRedirect = data.pushRedirect;
    	control.pushRedirectData = data;
    	control.pushRedirectType = type;
    }

	// this.routeNotificationsClick = function(data) {
	// 	var me = this;
	// 	if(control.settings.checkLogin()){
	// 		data.isPush = true;
	// 		data.pushRedirect = "meus-fretes.html";

	// 		//Se O aplicativo foi iniciado ou estava em segundo plano, redireciona para a tela quando clicar no push
	//     	//if(data.additionalData.coldstart || data.additionalData.foreground == false){
	//     	if(data.wasTapped){
	// 			if(data.tipo == 'envio' || data.tipo == 'selecao' || data.tipo == 'encerramento' || data.tipo == 'cancelamento' || data.tipo == 'notificacao') {//Nova oferta
	// 	        	//Passa o context para o main, e lá ele redireciona
	// 	        	if (data.tipo == 'encerramento') {
	// 					data.pushRedirect = "historico-fretes.html";
	// 	        	} else if(data.tipo=='envio') {
	// 	        		data.pushRedirect = "ofertas.html";
	// 	        	}
	// 	        	// if (data.additionalData.coldstart) {
	// 	        	if (data.pushRedirect == mainView.activePage) {
	// 	        		// console.log('back');
	// 	        		// mainView.router.back({url: data.pushRedirect, context: data, ignoreCache: true, force: true, refresh: true });
	// 	        		me.setRouteValues(data,'back');
	// 	        		// control.routeEntrada();
	// 	        	} else {
	// 	        		// console.log('load');
	// 	        		mainView.router.loadPage({url: data.pushRedirect, context: data, ignoreCache: true, force: true }); 
	// 	        		me.setRouteValues(data,'load');
		        		
	// 	        		// alert('x');
	// 	        	}
	// 	        	window.setTimeout(function() {
	// 	        		control.routeEntrada();
	// 	        	},1000);
	// 			}
	// 	    }else {
	// 	    	if (data.tipo == "encerramento") {
	// 	    		// if(data.additionalData.foreground == true) {
	// 	    			var mensagem = me.trataMensagemParaConfirmacao(data.body);
	// 	    			myApp.confirm(mensagem, data.title, function () {
	// 				       mainView.router.loadPage({url:'historico-fretes.html', context: data.additionalData, 'reload' : true }); 
	// 				    });	
	// 	    		// }
	// 	    	} else if((mainView.activePage.name == "meus-fretes" || mainView.activePage.name == "detalhes-frete") && (data.tipo == "encerramento" || data.tipo == "cancelamento")){
	// 	    		//Atualiza a página de fretes, se estiver com o app aberto nos detalhes do atendimento no momento de receber o push em encerramento.
	// 	    		myApp.alert(data.body, data.title, function () {
	// 			       mainView.router.back({url:'meus-fretes.html', ignoreCache: true, force: true }); 
	// 			       mainView.refreshPage();
	// 			    });	
	// 	    	}else {
	// 	    		// if(data.additionalData.foreground == true) {
	// 	    			var mensagem = me.trataMensagemParaConfirmacao(data.body);
	// 	    			if (data.tipo == "nao_selecao") {
	// 		    			myApp.confirm(mensagem, data.title, function () {
	// 					       mainView.router.loadPage({url:'meus-fretes.html', context: data, 'reload' : true }); 
	// 					    }, function() {
	// 					    	if (mainView.activePage.name=='detalhes-frete') {
	// 					    		mainView.router.loadPage({url:'meus-fretes.html', context: data, 'reload' : true }); 
	// 					    	}
	// 					    });	
	// 	    			} else if(data.tipo == "envio") {
	// 		    			myApp.confirm(mensagem, data.title, function () {
	// 					       mainView.router.loadPage({url:'ofertas.html', context: data, 'reload' : true }); 
	// 					    });	
	// 	    			} else {
	// 		    			myApp.confirm(mensagem, data.title, function () {
	// 					       mainView.router.loadPage({url:'meus-fretes.html', context: data, 'reload' : true }); 
	// 					    });	
	// 		    		}
	// 	    		// }
	// 	    	}
	// 	    }

	// 	}else {
	//         if(!control.settings.checkTempLogin()) {
 //                mainView.showNavbar();
 //                mainView.router.loadPage('conf-codigo.html');
	//         } else {
	//         	mainView.hideNavbar();
	//             mainView.router.loadPage('login.html',{context: {language: getLocalValue('language').substring(0,2)}});
	//         }
	// 	}
	// }

	// this.checkPushClickCargo = function(data) {
	// 	var tipo = (typeof data.tipo !== 'undefined' ? data.tipo : null);
	// 	if (tipo===null) return false;
		
	// 	var tipo_click = (tipo=='envio' || tipo=='nao_selecao' || tipo=='cancelamento' || 
	// 			tipo=='encerramento' || tipo=='selecao' || tipo=='notificacao' ||
	// 			tipo=='cancelamento_bkg' || tipo=='encerramento_bkg' || tipo=='selecao_bkg' ||
	// 			tipo=='reverte_cancelamento');

	// 	if (tipo_click) return true;

	// 	var id_frete = (typeof data.id_frete !== 'undefined' ? data.id_frete : null);
	// 	if (id_frete !== null) return true;

	// 	return false;
	// }

 //    this.trataPush = function(data) {
 //    	var me = this;
 //    	var bkg_origin = false;

 //    	if (me.checkPushClickCargo(data)) {
	// 		// if (config.appDevice=='ios' && !data.wasTapped) {
	// 		console.log(data);
	// 		if (!data.wasTapped) {
	// 			if (data.tipo!='envio' && data.tipo!='nao_selecao') {
	// 				data.tipo = data.tipo+'_bkg';
	// 				bkg_origin = true;
	// 			}
	// 		} else {
	// 			if (data.tipo!='envio' && data.tipo!='nao_selecao') {
	// 				data.tipo = data.tipo+'_bkg';
	// 				bkg_origin = true;
	// 			}
	// 		}
	// 		if(data.tipo == 'cancelamento_bkg' || data.tipo == 'encerramento_bkg') {
	// 			control.detalhesFrete.deleteLocalFrete(data.id_frete).done(function () {
	// 				if (bkg_origin) {
	// 					data.tipo = data.tipo.replace('_bkg','');
	// 					me.routeNotificationsClick(data);
	// 				}
	// 			});
	// 		}else if(data.tipo == 'selecao_bkg') {
	// 			control.detalhesFrete.novoFreteRecebido(data.id_frete).done(function() {
	// 				if (bkg_origin) {
	// 					data.tipo = data.tipo.replace('_bkg','');
	// 					me.routeNotificationsClick(data);
	// 				}
	// 			});
	// 		}else{
	// 			me.routeNotificationsClick(data);
	// 		}			

 //    	} else {

	// 		if(data.body.indexOf("Rota alterada") !== -1){
	// 			//Deleta rota antiga e syncroniza com nova rota
	// 			control.db.deleteRow(control.alvo, 1,1);
	// 			control.db.deleteRow(control.viagem, 1,1);
	// 			control.db.deleteRow(control.fotos, 1,1);
	// 			// control.db.deleteRow(control.settings, 1,1);
	// 			control.viagem.sincronizaViagem(true);
	// 		} 
 //    	}


 //    }
	this.saveOption = function(field, value){
		var me = this;
		var deferred = $.Deferred();
		var item = {};
		item[field]    = value;
		item['dt_alt'] = curTime();
		// // control.db.updateRow(me, item, 'documento', so_numeros(getLocalValue('cpf'))).done(function(){
		// control.db.updateRow(me, item, "REPLACE(REPLACE(documento,'-',''),'.','')", so_numeros(getLocalValue('cpf')) ).done(function(){
		// 	deferred.resolve();
		// }).fail(function(msg){
		// 	//Adicionar erro nao fatal ao fabric
		// 	ErrorClass.parseError('database','100042', { classe: 'settings.class.js', metodo: 'saveOption'},{mensagem_padrao: msg});	               
		// 	deferred.reject();
		// });
		return deferred.promise();
	}

	this.setupPushNotification = function(){
		var me = this;
		console.log('setupPushNotification');
        if(typeof FCMPlugin != 'undefined'){
            me.pushObject = FCMPlugin;

			me.pushObject.onTokenRefresh(function(token){
            	if (token) {
				    console.log('onTokenRefresh');
	                // alert(token);
	                me.saveOption('token_push', token).done(function(){
	                	console.log('new token');
	                	// control.sync.syncSendPushToken(false,true);
	                }).fail(function(msg) {
	                	console.log(msg);
	                });
	                me.registerTopics();
				}
			});        
			if (config.appDevice=='ios') {
				me.pushObject.requestPushPermissionIOS(function(res) {
					console.log(res);
				}, function(err) {
					//myApp.alert('',getAlertMessage('Atencao'));
					console.log(err);
				});
			}
			me.pushObject.getAPNSToken(function(token){
			    // alert(token);
			    console.log('getAPNSToken');
			    console.log(token);
			}, function(err) {
				console.log(err);
			});    
            me.pushObject.getToken(function(token) {
            	// console.log(token);
            	if (token) {
	            	me.pushObjectErr = 0;
	                console.log('token: ', token);
	                me.saveOption('token_push', token).done(function(){
	                	console.log('new token');
	                	control.sync.syncSendPushToken(false,true);
	                }).fail(function(msg) {
	                	console.log(msg);
	                });
					me.registerTopics();
            	} else {
	            	console.log('Push Token: error on registration');
	            	console.log(e);
	            	me.pushObjectErr++;
	            	if(me.pushObjectErr < 4) me.setupPushNotification();            		
            	}
            })
            me.pushObject.onNotification(function (data) {
				console.log(data);
				alert('NOTIFICACAO');
				// me.removeNotifications();
				// me.setLastData(data);
				// me.trataPush(data);
            });
        }
	}

	// this.loadTableInfo = function(){
	// 	this.tbName   = 'push_history';
	// 	this.tbPK     = 'id';
	// 	this.tbFields = {
	// 	    'id':                'INTEGER AUTOINCREMENT',
 //            'data':   			 'TEXT',
 //            'push_info':	     'TEXT',
	// 	};
 //   	}

 //   	this.createTable = function(){
 //   		var deferred = $.Deferred();
 //   		control.db.createTable(this).done(function(){
 //   			deferred.resolve();
 //   		}).fail(function(e){
 //   			deferred.reject(e);
 //   		});
 //   		return deferred.promise();
 //   	}

 //   	this.dropTable = function(){
 //   		var deferred = $.Deferred();
 //   		control.db.dropTable(this).done(function(){
 //   			deferred.resolve();
 //   		}).fail(function(e){
 //   			deferred.reject(e);
 //   		});
 //   		return deferred.promise();
 //   	}	

}