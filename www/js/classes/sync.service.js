var syncService = function(){
	this.blockSync   = false;
	this.ctlInterval    = {};
	this.blockInterval  = {};

	this.notification = null;
	this.configInterval = {
		'syncAddRoutePoint':   1000,
		'syncAddPosicao':      180000,
		'syncSendComando':     120000,
		'syncViagem':          60000,
		'syncGetMensagens':    60000,
		'syncNotifyMensagens': 60000,
		// 'syncAlvos':           30000,
		'marcaAlvosEntregues': 15000,
		// 'syncGetNovasFotos':   30000,
		'syncSendFotos':       30000,
		// 'syncDeleteFotos':     30000,
		'syncSendPushToken':   30000,
		'syncAuxiliares':      30000000,
		'checkGPSActive': 	   120000,
	};

	this.syncInSilence  = {
		'syncAddRoutePoint': true,
		'syncAddPosicao': true
	};

	this.init = function(){
		for(idx in this.configInterval){
			this.ctlInterval[idx]   = null;
			this.blockInterval[idx] = false;
		}
	}

	this.firstSync = function(){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(this.blockSync){
				console.log('sync: main block active');
				deferred.reject();
			} else {
				console.log('sync: Starting first sync');
				myApp.showPreloader('Sincronizando...');
				var d1 = me.syncSendComando(false);
				var d2 = me.syncAuxiliares(false);
				var d3 = me.syncGetPermissoes(false);
				var d4 = me.syncViagem(false);
				$.when(d1, d2, d3, d4).then(function(msg){
					me.syncGetMensagens(false);
					me.syncNotifyMensagens(false);
					me.syncAlvos(false).done(function(msg){
						me.syncGetNovasFotos(false);
						myApp.hidePreloader();
						deferred.resolve();
					}).fail(function(m){
						console.log(m);
						myApp.hidePreloader();
						deferred.reject();
					})
				}).fail(function(m){
					myApp.hidePreloader();
					deferred.reject();
				});
			}
		}
		return deferred.promise();
	}

	this.syncSendPushToken = function(block, force){
		var me = this;
		var deferred = $.Deferred();
		if (typeof force==="undefined") force = false;

		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if((!this.blockSync && !this.blockInterval["syncSendPushToken"] ) || (force)){
				this.blockSync = block;
				this.blockInterval["syncSendPushToken"] = true;
				control.settings.saveTokenPush(undefined,force).done(function(msg){
					if (control.auth.checkAuthFrete()) {
						control.settings.saveTokenPush('mundofrete',force).done(function(msg){
							me.blockSync = false;
							me.blockInterval["syncSendPushToken"] = false;
							deferred.resolve(msg);		
						}).fail(function(msg){
							me.blockSync = false;
							me.blockInterval["syncSendPushToken"] = false;
							//Adicionar erro nao fatal ao fabric
							ErrorClass.parseError('generico','900034', { classe: 'sync.class.js', metodo: 'syncSendPushToken'},{mensagem_padrao: msg});
							deferred.reject('[900034]'+msg);
						});
					} else {
						//me.resetPushNotification(getLocalValue('cpf'),'mundofrete',true);
						me.blockSync = false;
						me.blockInterval["syncSendPushToken"] = false;
						deferred.resolve(msg);
					}
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncSendPushToken"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900034', { classe: 'sync.class.js', metodo: 'syncSendPushToken'},{mensagem_padrao: msg});              
					deferred.reject('[900034]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900035', { classe: 'sync.class.js', metodo: 'syncSendPushToken'},{mensagem_padrao: "syncSendPushToken: Another sync in progress"});              	
				deferred.reject("[900035]syncSendPushToken: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncAddRoutePoint = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!this.blockSync && !this.blockInterval["syncAddRoutePoint"]){
			this.blockSync = block;
			this.blockInterval["syncAddRoutePoint"] = true;
			if (control.auth.checkAuthLocalizacao()) {
				control.posicao.syncAddRoutePoint().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAddRoutePoint"] = false;
					deferred.resolve(msg);
				}).fail(function(){
					me.blockSync = false;
					me.blockInterval["syncAddRoutePoint"] = false;
					//Adicionar erro nao fatal ao fabric
					//ErrorClass.parseError('generico','900036', { classe: 'sync.class.js', metodo: 'syncAddRoutePoint'},{mensagem_padrao: msg});              	
					deferred.reject();
				});
			} else {
				me.blockSync = false;
				me.blockInterval["syncAddRoutePoint"] = false;
				//Adicionar erro nao fatal ao fabric
				//ErrorClass.parseError('generico','900036', { classe: 'sync.class.js', metodo: 'syncAddRoutePoint'},{mensagem_padrao: msg});              	
				deferred.reject('Posicionamento não autorizado');				
			}
		} else {
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900037', { classe: 'sync.class.js', metodo: 'syncAddRoutePoint'},{mensagem_padrao: "syncAddRoutePoint: Another sync in progress"});              	
			deferred.reject("[900037]syncAddRoutePoint: Another sync in progress");
		}
		return deferred.promise();
	}

	this.syncAddPosicao = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!this.blockSync && !this.blockInterval["syncAddPosicao"]){
			this.blockSync = block;
			this.blockInterval["syncAddPosicao"] = true;
			if (control.auth.checkAuthLocalizacao()) {
				control.posicao.syncAddPosicao().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAddPosicao"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAddPosicao"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900038', { classe: 'sync.class.js', metodo: 'syncAddPosicao'},{mensagem_padrao: msg});              	
					deferred.reject('[900038]'+msg);
				});
			} else {
				me.blockSync = false;
				me.blockInterval["syncAddPosicao"] = false;
				//Adicionar erro nao fatal ao fabric
				//ErrorClass.parseError('generico','900036', { classe: 'sync.class.js', metodo: 'syncAddRoutePoint'},{mensagem_padrao: msg});              	
				deferred.reject('Posicionamento não autorizado');				
			}				
		} else {
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900039', { classe: 'sync.class.js', metodo: 'syncAddPosicao'},{mensagem_padrao: "syncAddPosicao: Another sync in progress"});              	
			deferred.reject("[900039]syncAddPosicao: Another sync in progress");
		}
		return deferred.promise();
	}

	this.escondeNotificacaoRede = function() {
		var me = this;
		if (me.notification) {
			myApp.closeNotification(me.notification);
			me.notification = null;
		}
	}

	this.notificarRede = function() {
		var me = this;
		if (me.notification) {
			myApp.closeNotification(me.notification);
			me.notification = null;
		}
		me.notification = myApp.addNotification({
			title: "<span class='not-blink'>"+getMessage('NaoFoiPossivelAcessarRede')+"</span>"
		});
        (function blink() {
          $(".not-blink").fadeOut(2000).fadeIn(200, blink);
        })();
	}

	this.syncSendComando = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			me.notificarRede();
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncSendComando"]){
				this.blockSync = block;
				this.blockInterval["syncSendComando"] = true;
				control.comando.sincronizaComandos().done(function(msg){
					control.comando.limpaComandos().always(function(){
						me.blockSync = false;
						me.blockInterval["syncSendComando"] = false;
						deferred.resolve(msg);
					});
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncSendComando"] = false;
					//Adicionar erro nao fatal ao fabric
					if (msg!='Sem viagens no momento') {
						ErrorClass.parseError('generico','900040', { classe: 'sync.class.js', metodo: 'syncSendComando'},{mensagem_padrao: msg});              	
					}
					deferred.reject('[900040]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900041', { classe: 'sync.class.js', metodo: 'syncSendComando'},{mensagem_padrao: "syncSendComando: Another sync in progress"});              	
				deferred.reject("[900041]syncSendComando: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncViagem = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			if(mainView.activePage.name == "sem-viagem"){
				me.notificarRede();
			}
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncViagem"]){
				this.blockSync = block;
				this.blockInterval["syncViagem"] = true;
				control.viagem.sincronizaViagem(false).done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncViagem"] = false;
					deferred.resolve(msg);
					// console.log("BackGeo:Get Position");
					// BackgroundGeolocation.getCurrentPosition({samples:1, persist: false});
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncViagem"] = false;
					if (msg.indexOf('timeout')>0) {
						me.notificarRede();
					}
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900042', { classe: 'sync.class.js', metodo: 'syncViagem'},{mensagem_padrao: msg});              	
					deferred.reject('[900042]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900043', { classe: 'sync.class.js', metodo: 'syncViagem'},{mensagem_padrao: "syncViagem: Another sync in progress"});              	
				deferred.reject("[900043]syncViagem: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	// this.syncGetComandos = function(block){
	// 	var me = this;
	// 	var deferred = $.Deferred();
	// 	if(!isOnline()){
	// 		console.log('sync: no network connection');
	// 		deferred.reject();
	// 	} else {
	// 		if(!this.blockSync && !this.blockInterval["syncGetComandos"]){
	// 			this.blockSync = block;
	// 			this.blockInterval["syncGetComandos"] = true;
	// 			control.comando.syncGetComandos().done(function(msg){
	// 				me.blockSync = false;
	// 				me.blockInterval["syncGetComandos"] = false;
	// 				deferred.resolve(msg);
	// 			}).fail(function(msg){
	// 				me.blockSync = false;
	// 				me.blockInterval["syncGetComandos"] = false;
	// 				//Adicionar erro nao fatal ao fabric
	// 				ErrorClass.parseError('generico','900068', { classe: 'sync.class.js', metodo: 'syncGetComandos'},{mensagem_padrao: msg});              	
	// 				deferred.reject('[900068]'+msg);
	// 			});
	// 		}
	// 	}
	// 	return deferred.promise();
	// }
	this.syncGetMensagens = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncGetMensagens"]){
				this.blockSync = block;
				this.blockInterval["syncGetMensagens"] = true;
				control.mensagem.syncGetMensagens().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncGetMensagens"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncGetMensagens"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900066', { classe: 'sync.class.js', metodo: 'syncGetMensagens'},{mensagem_padrao: msg});              	
					deferred.reject('[900066]'+msg);
				});
			}
		}
		return deferred.promise();
	}

	this.syncNotifyMensagens = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncNotifyMensagens"]){
				this.blockSync = block;
				this.blockInterval["syncNotifyMensagens"] = true;
				control.mensagem.notifyMensagens().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncNotifyMensagens"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncNotifyMensagens"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900067', { classe: 'sync.class.js', metodo: 'syncNotifyMensagens'},{mensagem_padrao: msg});              	
					deferred.reject('[900067]'+msg);
				});
			}
		}
		return deferred.promise();
	}

	this.syncAlvos = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncAlvos"]){
				this.blockSync = block;
				this.blockInterval["syncAlvos"] = true;
				control.alvo.syncAlvos().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAlvos"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAlvos"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900044', { classe: 'sync.class.js', metodo: 'syncAlvos'},{mensagem_padrao: msg});              	
					deferred.reject('[900044]'+msg);
				});
			}
		}
		return deferred.promise();
	}

	this.marcaAlvosEntregues = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["marcaAlvosEntregues"]){
				this.blockSync = block;
				this.blockInterval["marcaAlvosEntregues"] = true;
				control.alvo.marcaAlvosEntregues().done(function(msg){
					me.blockSync = false;
					me.blockInterval["marcaAlvosEntregues"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["marcaAlvosEntregues"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900045', { classe: 'sync.class.js', metodo: 'marcaAlvosEntregues'},{mensagem_padrao: msg});              	
					deferred.reject('[900045]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900046', { classe: 'sync.class.js', metodo: 'marcaAlvosEntregues'},{mensagem_padrao: "marcaAlvosEntregues: Another sync in progress"});              	
				deferred.reject("[900046]marcaAlvosEntregues: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncGetNovasFotos = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncGetNovasFotos"]){
				this.blockSync = block;
				this.blockInterval["syncGetNovasFotos"] = true;
				control.fotos.syncGetNovasFotos().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncGetNovasFotos"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncGetNovasFotos"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900047', { classe: 'sync.class.js', metodo: 'syncGetNovasFotos'},{mensagem_padrao: msg});              	
					deferred.reject('[900047]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900048', { classe: 'sync.class.js', metodo: 'syncGetNovasFotos'},{mensagem_padrao: "syncGetNovasFotos: Another sync in progress"});              	
				deferred.reject("[900048]syncGetNovasFotos: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncSendFotos = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncSendFotos"]){
				this.blockSync = block;
				this.blockInterval["syncSendFotos"] = true;
				control.fotos.syncSendFotos().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncSendFotos"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncSendFotos"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900049', { classe: 'sync.class.js', metodo: 'syncSendFotos'},{mensagem_padrao: msg});              	
					deferred.reject('[900049]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900050', { classe: 'sync.class.js', metodo: 'syncSendFotos'},{mensagem_padrao: "syncSendFotos: Another sync in progress"});              
				deferred.reject("[900050]syncSendFotos: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncDeleteFotos = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncDeleteFotos"]){
				this.blockSync = block;
				this.blockInterval["syncDeleteFotos"] = true;
				control.fotos.syncDeleteFotos().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncDeleteFotos"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncDeleteFotos"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900051', { classe: 'sync.class.js', metodo: 'syncDeleteFotos'},{mensagem_padrao: msg});              	
					deferred.reject('[900051]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900052', { classe: 'sync.class.js', metodo: 'syncDeleteFotos'},{mensagem_padrao: "syncDeleteFotos: Another sync in progress"});              
				deferred.reject("[900052]syncDeleteFotos: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncAuxiliares = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncAuxiliares"]){
				this.blockSync = block;
				this.blockInterval["syncAuxiliares"] = true;
				control.auxiliares.syncAuxiliares(block).done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAuxiliares"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncAuxiliares"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900053', { classe: 'sync.class.js', metodo: 'syncAuxiliares'},{mensagem_padrao: msg});              	
					deferred.reject('[900053]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900054', { classe: 'sync.class.js', metodo: 'syncAuxiliares'},{mensagem_padrao: "syncAuxiliares: Another sync in progress"});              
				deferred.reject("[900054]syncAuxiliares: Another sync in progress");
			}
		}
		return deferred.promise();
	}

	this.syncGetPermissoes = function(block){
		var me = this;
		var deferred = $.Deferred();
		if(!isOnline()){
			console.log('sync: no network connection');
			deferred.reject();
		} else {
			if(!this.blockSync && !this.blockInterval["syncGetPermissoes"]){
				this.blockSync = block;
				this.blockInterval["syncGetPermissoes"] = true;
				control.auth.syncGetPermissoes().done(function(msg){
					me.blockSync = false;
					me.blockInterval["syncGetPermissoes"] = false;
					deferred.resolve(msg);
				}).fail(function(msg){
					me.blockSync = false;
					me.blockInterval["syncGetPermissoes"] = false;
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900064', { classe: 'sync.class.js', metodo: 'syncGetPermissoes'},{mensagem_padrao: msg});              	
					deferred.reject('[900064]'+msg);
				});
			} else {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('generico','900065', { classe: 'sync.class.js', metodo: 'syncGetPermissoes'},{mensagem_padrao: "syncAuxiliares: Another sync in progress"});              
				deferred.reject("[900065]syncAuxiliares: Another sync in progress");
			}
		}
		return deferred.promise();
	}


	this.checkGPSActive = function(block) {
		var me = this;
		var deferred = $.Deferred();
		console.log("SM: "+getLocalValue('viag_codigo_sm'));
		console.log("Loaded: "+loaded);
		if(!this.blockSync && !this.blockInterval["checkGPSActive"]){
			this.blockSync = block;
			this.blockInterval["checkGPSActive"] = true;
			if (control.auth.checkAuthLocalizacao()) {
				if (loaded && getLocalValue('viag_codigo_sm')!==null) {
					control.gps.checkGPSActive().done(function(retorno) {
						console.log(retorno!==null?"GPS Ativo":"Plataforma sem GPS");
						me.blockSync = false;
						me.blockInterval["checkGPSActive"] = false;
						deferred.resolve();
					}).fail(function(error_type) {
						console.log(error_type);
						control.gps.showMessage(error_type);
						me.blockSync = false;
						me.blockInterval["checkGPSActive"] = false;
						//Adicionar erro nao fatal ao fabric
						ErrorClass.parseError('generico','900055', { classe: 'sync.class.js', metodo: 'checkGPSActive'},{mensagem_padrao: error_type});              	
						deferred.reject('[900055]'+error_type);
					});
				}
			} else {
				me.blockSync = false;
				me.blockInterval["checkGPSActive"] = false;
				//Adicionar erro nao fatal ao fabric
				//ErrorClass.parseError('generico','900036', { classe: 'sync.class.js', metodo: 'syncAddRoutePoint'},{mensagem_padrao: msg});              	
				deferred.reject('Posicionamento não autorizado');				
			}
		} else {
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900056', { classe: 'sync.class.js', metodo: 'checkGPSActive'},{mensagem_padrao: "checkGPSActive: Another sync in progress"});              	
			deferred.reject("[900056]checkGPSActive: Another sync in progress");
		}
		return deferred.promise();
	}

	this.startAllSyncs = function(iniExec){
		this.blockSync = false;
		for(i in this.blockInterval)
			this.blockInterval[i] = false;
		control.sync.startSync('syncAuxiliares',      iniExec);
		control.sync.startSync('syncAddRoutePoint',   iniExec);
		control.sync.startSync('syncAddPosicao',      iniExec);
		control.sync.startSync('syncSendComando',     iniExec);
		control.sync.startSync('syncViagem',          iniExec);
		control.sync.startSync('syncGetMensagens',    iniExec);
		control.sync.startSync('syncNotifyMensagens', iniExec);
		// control.sync.startSync('syncAlvos',           iniExec);
		control.sync.startSync('marcaAlvosEntregues', iniExec);
		// control.sync.startSync('syncGetNovasFotos',   iniExec);
		control.sync.startSync('syncSendFotos',       iniExec);
		// control.sync.startSync('syncDeleteFotos',     iniExec);
		control.sync.startSync('syncSendPushToken',   iniExec);
		control.sync.startSync('checkGPSActive',   	  iniExec);
	}

	this.stopAllSyncs = function(iniExec){
		control.sync.stopSync('syncAuxiliares');
		control.sync.stopSync('syncAddRoutePoint');
		control.sync.stopSync('syncAddPosicao');
		control.sync.stopSync('syncSendComando');
		control.sync.stopSync('syncViagem');
		control.sync.stopSync('syncGetMensagens');
		control.sync.stopSync('syncNotifyMensagens');
		// control.sync.stopSync('syncAlvos');
		control.sync.stopSync('marcaAlvosEntregues');
		// control.sync.stopSync('syncGetNovasFotos');
		control.sync.stopSync('syncSendFotos');
		// control.sync.stopSync('syncDeleteFotos');
		control.sync.stopSync('syncSendPushToken');
		control.sync.stopSync('checkGPSActive');
	}

	this.startSync = function(name, iniExec){
		var me = this;
		var iniExec = (typeof iniExec == "undefined" ? true : iniExec);
		if(typeof me.configInterval[name] != "undefined"){
			if(me.stopSync(name)){
				console.log("Sync: starting sync [" + name + "] - Time: " + me.configInterval[name]);
				if(iniExec){
					eval("var def1 = me." + name + "()");
					// alert(name);
					def1.always(function(m){
						me.ctlInterval[name] = setInterval(function(){
							if(typeof me.syncInSilence[name] == 'undefined' || !me.syncInSilence[name]){
								console.log(name + ": Started.");
							}
							eval("var def2 = me." + name + "()");
							def2.always(function(m){
								if(typeof m != "undefined" && $.trim(m)) {
									// if (m != "Posicionamento não autorizado") {
										console.log(m);
									// }
								}
							});
						}, me.configInterval[name]);
						// alert(name);
						// alert(me.ctlInterval[name])
					});
				} else {
					me.ctlInterval[name] = setInterval(function(){
						if(typeof me.syncInSilence[name] == 'undefined' || !me.syncInSilence[name]){
							console.log(name + ": Started.");
						}
						eval("var def2 = me." + name + "()");
						def2.always(function(m){
							if(typeof m != "undefined" && $.trim(m)) console.log(m);
						});
					}, me.configInterval[name]);
					// alert(name);
					// alert(me.ctlInterval[name])
				}
			}
			return true;
		} else {
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900030', { classe: 'sync.class.js', metodo: 'startSync', info: info},{mensagem_padrao: 'Error: Start unknown sync: ' + name});             
			console.log('[900030]Error: Start unknown sync: ' + name);
			return false;
		}
	}

	this.syncSelecao = function() {
		control.detalhesFrete.syncFretes();
	}

	this.syncCancelamentoEncerramento = function() {
		control.detalhesFrete.syncCancelaEncerra();
	}

	this.syncClickCargo = function(iniExec){
		this.syncSelecao();
		this.syncCancelamentoEncerramento();
	}

	this.stopSync = function(name){
		var me = this;
		if(typeof me.configInterval[name] != "undefined"){
			if(me.ctlInterval[name]){
				console.log('Sync: stopping sync [' + name + ']');
				clearInterval(me.ctlInterval[name]);
				me.ctlInterval[name] = null;
			}
			return true;
		} else {
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900029', { classe: 'sync.class.js', metodo: 'stopSync', info: info},{mensagem_padrao: 'Error: Stop unknown sync: ' + name});              
			console.log('[900029]Error: Stop unknown sync: ' + name);
			return false;
		}
	}
}