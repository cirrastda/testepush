var settingsClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};
	// this.push     = null;
	// this.pushErr  = 0;
	this.page 	  = null;

	this.init = function(){
		var deferred = $.Deferred();
		this.loadTableInfo();
		this.setupView();
		this.dados = [];
		deferred.resolve();
		return deferred.promise();
	}

	this.checkLogin = function(){
		return ($.trim(getLocalValue('confirmtime')) ? true : false);
	}

	this.checkTempLogin = function(){
		return ($.trim(getLocalValue('cpf')) ? true : false);
	}

	this.checkLGPD = function(){
		return ($.trim(getLocalValue('lgpd'))==1 ? true : false);
	}

	this.checkVersion = function(){
		var me       = this;
		var deferred = $.Deferred();
		var campos = {
			'aplicativo': config.appAlias,
			'plataforma': config.appDevice,
			'versao':     config.appVersion
		};

		control.rest.makeRequest('/api_motorista_mobile/checkVersion', campos, false).done(function(res){
			var msg   = null;
			var btnUp = false;
			var loja  = config.appDevice == 'ios' ? 'App Store' : 'Play Store';
			if(!res.erro){
				if(res.data.code != 'updated'){
					if(res.data.update == 'required'){
						btnUp = true;
						msg   = getMessage('AplicativoDesatualizado')+'. '+getMessage('MsgAtualizacao')+' ' + loja + '.<br><br>'+getMessage('SuaVersao')+': ' + config.appVersion + '<br>'+getMessage('NovaVersao')+': ' + res.data.cur_version;
					} else {
					    myApp.modal({
						    title:  '<strong>'+getAlertMessage('Atualizacao')+'</strong>',
						    text:   '<br>'+getAlertMessage('NovaVersaoDisponivel')+'.<br><br>'+getMessage('SuaVersao')+': ' + config.appVersion + '<br>'+getMessage('NovaVersao')+': ' + res.data.cur_version + '<br><br>'+getAlertMessage('DesejaAtualizarAgora'),
						    buttons: [
						        {
							        text: '<span class="color-black">'+getAlertMessage('AgoraNao')+'</span>'
						        },
						        {
							        text: '<strong>'+getAlertMessage('SimM')+'</strong>',
							        bold: true,
							        onClick: function() {
										var url = null;

										if(config.appDevice == 'ios'){
											url = 'itms://itunes.com/apps/' + config.appAlias;
										} else {
											url = 'market://details?id=' + config.appBundle;
										}
										window.open(url, '_system');
							    	}
						        }
						    ]
					    });
					}
				}
			} else {
				msg = res.data;
			}
			if(msg){
				// control.sync.stopAllSyncs();
				// control.sync.blockSync = true;
				$.get('update.html', function(popupHTML){
					popupHTML = popupHTML.replace('[##MSG##]', msg);
					if(!btnUp) popupHTML = popupHTML.replace('display:block', 'display:none');

					myApp.popup(popupHTML);

					$(document).on('click', '.btnUpdate', function(e){
						e.preventDefault();

						var url = null;

						if(config.appDevice == 'ios'){
							url = 'itms://itunes.com/apps/' + config.appAlias;
						} else {
							url = 'market://details?id=' + config.appBundle;
						}

						window.open(url, '_system');
					});
				});
	  		}
		}).fail(function(msg){
			//Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300002', { classe: 'settings.class.js', metodo: 'checkVersion'},{mensagem_padrao:  msg});	                             
			deferred.reject();
		});
		return deferred.promise();
	}

	this.trataDadosMotorista = function(dados_motorista, dados_envio) {
		if (dados_motorista.dados_profissional != undefined) {
			dados_motorista = dados_motorista.dados_profissional;
		}

		if ((typeof dados_envio.documento === "undefined") && (typeof dados_envio.cpf !== "undefined")) {
			dados_envio.documento = dados_envio.cpf;
		}

		if (dados_motorista.Profissional==undefined) dados_motorista.Profissional = null;
		if (dados_motorista.ProfissionalCelular==undefined) dados_motorista.ProfissionalCelular = null;
		if (dados_motorista.ProfissionalEmail==undefined) dados_motorista.ProfissionalEmail = null;
		if (dados_motorista.VeiculoLog==undefined) dados_motorista.VeiculoLog = null;
		if (dados_motorista.VEndereco==undefined) dados_motorista.VEndereco = null;
		if (dados_motorista.ProfissionalEndereco==undefined) dados_motorista.ProfissionalEndereco = null;
		if (dados_motorista.Veiculo==undefined) dados_motorista.Veiculo = null
		//if (dados_motorista.TPfisPessoaFisica==undefined) dados_motorista.TPfisPessoaFisica = null;

		with(dados_motorista) {
			//'key1' in obj
			if(dados_motorista.Veiculo == null) {
				dados_motorista.Veiculo = {carretas: ''};
			} 
			if (dados_motorista.Veiculo.carretas == undefined){
				dados_motorista.Veiculo.carretas = {placa_carreta_um: '', placa_carreta_dois: '', marca_carreta_um: '', marca_carreta_dois: '', modelo_carreta_um: '', modelo_carreta_dois: '', ano_carreta_um: '', ano_carreta_dois: ''}
			}
			var settings = {
				codigo_pais: dados_envio.codigo_pais,
				
				nome: (dados_motorista!==false && Profissional!=null && Profissional.nome!=undefined ? Profissional.nome : ""),
				// cpf: (dados_motorista!==false && Profissional!=null && Profissional.codigo_documento!=undefined ? Profissional.codigo_documento : ""),
				documento: dados_envio.documento,

				// telefone: dados_envio.telefone,
				telefone: (dados_motorista!==false && ProfissionalCelular!=null && ProfissionalCelular.descricao!=undefined ? formataTelefone(ProfissionalCelular.descricao.replace(/[^0-9]+/g, '')) : ""),
				email: (dados_motorista!==false && ProfissionalEmail!=null && ProfissionalEmail.descricao!=undefined ? ProfissionalEmail.descricao : ""),

				cep: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_cep!=undefined ? formataCEP(VEndereco.endereco_cep.replace(/[^0-9]+/g, '')) : ""),
				endereco: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_logradouro!=undefined ? VEndereco.endereco_tipo+" "+VEndereco.endereco_logradouro : ""),
				numero: (dados_motorista!==false && ProfissionalEndereco!=null && ProfissionalEndereco.numero!=undefined ? ProfissionalEndereco.numero : ""),
				complemento: (dados_motorista!==false && ProfissionalEndereco!=null && ProfissionalEndereco.complemento!=undefined ? ProfissionalEndereco.complemento : ""),
				estado: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_codigo_estado!=undefined ? VEndereco.endereco_codigo_estado : ""),
				codigo_estado: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_codigo_estado!=undefined ? VEndereco.endereco_codigo_estado : ""),
				cidade: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_codigo_cidade!=undefined ? VEndereco.endereco_codigo_cidade : ""),
				codigo_cidade: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_codigo_cidade!=undefined ? VEndereco.endereco_codigo_cidade : ""),
				bairro: (dados_motorista!==false && VEndereco!=null && VEndereco.endereco_bairro!=undefined ? VEndereco.endereco_bairro : ""),

				placa: (dados_motorista!==false && Veiculo!=null && Veiculo.placa!=undefined ? Veiculo.placa : ""),
				tipo_veiculo: (dados_motorista!==false && Veiculo!=null && Veiculo.codigo_tipo_veiculo!=undefined ? Veiculo.codigo_tipo_veiculo : ""),
				tipo_carroceria: (dados_motorista!==false && Veiculo!=null && Veiculo.codigo_tipo_carroceria!=undefined ? Veiculo.codigo_tipo_carroceria : ""),
				antt: (dados_motorista!==false && Veiculo!=null && Veiculo.antt!=undefined ? Veiculo.antt : ""),
				marca: (dados_motorista!==false && Veiculo!=null && Veiculo.fabricante!=undefined ? Veiculo.fabricante : ""),
				modelo: (dados_motorista!==false && Veiculo!=null && Veiculo.modelo!=undefined ? Veiculo.modelo : ""),
				ano: (dados_motorista!==false && Veiculo!=null && Veiculo.ano_fabricacao!=undefined ? Veiculo.ano_fabricacao : ""),
				tecnologia: (dados_motorista!==false && Veiculo!=null && Veiculo.tecnologia!=undefined ? Veiculo.tecnologia : ""),
				rastreador: (dados_motorista!==false && Veiculo!=null && Veiculo.rastreador!=undefined ? Veiculo.rastreador : 0),
				versao_tec: (dados_motorista!==false && Veiculo!=null && Veiculo.versao_tec!=undefined ? Veiculo.versao_tec : 0),
				versao_tec: (dados_motorista!==false && Veiculo!=null && Veiculo.veic_atrelado!=undefined ? Veiculo.veic_atrelado : 0),

				cnh: (dados_motorista!==false && Profissional!=null && Profissional.cnh!=undefined ? Profissional.cnh : ""),
				cnh_vencimento: (dados_motorista!==false && Profissional!=null && Profissional.cnh_vencimento!=undefined ? Profissional.cnh_vencimento.substring(0,10): ""),
				cnh_categoria: (dados_motorista!==false && Profissional!=null && Profissional.cnh_categoria!=undefined ? Profissional.cnh_categoria : (dados_motorista!==false && Profissional!=null && Profissional.codigo_tipo_cnh !=undefined ? Profissional.codigo_tipo_cnh :  "") ),
				lgpd: (dados_motorista!==false && Profissional!=null && Profissional.lgpd!=undefined ? Profissional.lgpd : 0),
				
				token_push: (dados_motorista!==false && ProfissionalSistema!=null && ProfissionalSistema.ProfissionalSistema.token_push!=undefined ? ProfissionalSistema.ProfissionalSistema.token_push : ""),
				token: (dados_motorista!==false && ProfissionalSistema!=null && ProfissionalSistema.ProfissionalSistema.token!=undefined ? ProfissionalSistema.ProfissionalSistema.token : ""),
				token_call: (dados_motorista!==false && ProfissionalSistema!=null && ProfissionalSistema.ProfissionalSistema.token_chamadas!=undefined ? ProfissionalSistema.ProfissionalSistema.token_chamadas : ""),
			};

		}


		return settings;
	}


	this.trataCarretas = function(dados_motorista) {
		var carretas = [];
		if (dados_motorista.dados_profissional != undefined) {
			dados_motorista = dados_motorista.dados_profissional;
		}
		if (dados_motorista !== null) {
			// with(dados_motorista) {
				if (dados_motorista.Carretas != null && dados_motorista.Carretas != undefined) {
					if (typeof dados_motorista.Carretas == 'Array' || typeof dados_motorista.Carretas == 'object') {
						if (dados_motorista.Carretas.length>2) {
							var tmp_carreta = dados_motorista.Carretas;
							dados_motorista.Carretas = []
							dados_motorista.Carretas.push(tmp_carreta);
						}
						if (dados_motorista.Carretas.length > 0) {
							for (var i in dados_motorista.Carretas) {
								if (dados_motorista.Carretas[i] != null) {
									var carreta = {
										placa: dados_motorista.Carretas[i].placa,
										marca: dados_motorista.Carretas[i].fabricante,
										modelo: dados_motorista.Carretas[i].modelo,
										ano: dados_motorista.Carretas[i].ano_fabricacao,
									};

									carretas.push(carreta);
								}
							}
						}
					}
				}

			// }
		}

		return carretas;

	}

	this.reloadSettings = function(res, campos) {
		var deferred = $.Deferred();
		var me = this;

		var d1 = control.db.deleteRow(control.carretas,1,1);
		var d2 = control.db.deleteRow(me, 1, 1);
		$.when(d1, d2).then(function() {
			var settings = me.trataDadosMotorista(res, campos);
			if (campos.foto) {
				settings.foto = campos.foto;
			}
			var carretas = me.trataCarretas(res);
			control.db.insertRow(me, settings).done(function(lastId){
				for(var i in carretas) {
					carretas[i].settings_id = lastId;
					control.db.insertRow(control.carretas, carretas[i]).fail(function(msg) {
						ErrorClass.parseError('database','100081', { classe: 'settings.class.js', metodo: 'reloadSettings'},{mensagem_padrao: msg});	                     
						deferred.reject('[100081]'+getErrorMessage('ErroDadosCarreta'));
					});
				}
				settings.carretas = carretas;
				settings.id = lastId;
				deferred.resolve(settings);
			}).fail(function(msg) {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100039', { classe: 'settings.class.js', metodo: 'reloadSettings'},{mensagem_padrao: msg});	                     
				deferred.reject('[100039]'+getErrorMessage('ErroDadosUsuario')+":"+msg);
			});
		}).fail(function(msg){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100040', { classe: 'settings.class.js', metodo: 'reloadSettings'},{mensagem_padrao: msg});	                     
			deferred.reject('[100040]'+getErrorMessage('ErroRemoverDadosAntigos'));
		});
		return deferred.promise();
	}

	this.setFabricVariables = function() {
		 if (window.fabric) {
			if(getLocalValue('documento') != null){

				window.fabric.Crashlytics.setUserIdentifier("Documento: " + getLocalValue('documento'));
			}else if(getLocalValue('CPF') != null){
				window.fabric.Crashlytics.setUserIdentifier("CPF: " + getLocalValue('CPF'));
			}

			if(getLocalValue('nome') != null){
				window.fabric.Crashlytics.setUserName(getLocalValue('nome'));
			}

			if(getLocalValue('email') != null){
				window.fabric.Crashlytics.setUserEmail(getLocalValue('email'));
			}

			if(getLocalValue('telefone') != null){
				window.fabric.Crashlytics.setStringValueForKey(getLocalValue('telefone'), "Telefone");
			}

			if(getLocalValue('codigo_pais') != null){
				switch(getLocalValue('codigo_pais')){
					case "1": 
					window.fabric.Crashlytics.setStringValueForKey("Brasil", "País");
					break;

					case "11":
					window.fabric.Crashlytics.setStringValueForKey("Mexico","País");
					break;
				}	
			}

			if(getLocalValue('sm_em_transito')=='1'){
				window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
			}else{
				window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
			}
			if(getLocalValue('viag_codigo_sm') != null){
				window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
			}
		}

	}

	this.concluiLogin = function(res, campos) {
		var me = this;
		var deferred = $.Deferred();

		me.reloadSettings(res, campos).done(function(settings) {
			setLocalValue('id',          settings.id);
			setLocalValue('cpf',         settings.documento);
			setLocalValue('documento',   settings.documento);
			setLocalValue('nome',        settings.nome);
			setLocalValue('telefone',    settings.telefone);
			setLocalValue('codigo_pais', settings.codigo_pais);
			setLocalValue('email', 		 settings.email);
			setLocalValue('lgpd', 		 settings.lgpd);
			setLocalValue('foto', 		 settings.foto);

			me.setFabricVariables();
			 //Configuracao dos dados do usuário para o fabric
			deferred.resolve("login");

		}).fail(function(msg){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100082', { classe: 'settings.class.js', metodo: 'concluiLogin'},{mensagem_padrao: msg});
			deferred.reject('[100082]'+getErrorMessage('ErroDadosUsuario')+":"+msg);
		});
		return deferred.promise();
	}

	this.setDataAutorization = function(res, campos) {
		campos = JSON.stringify(campos);
		res = JSON.stringify(res);
		localStorage.setItem('doLoginRes', res);
		localStorage.setItem('doLogincampos', campos);
	}

	this.removeDataAutorization = function() {
		localStorage.removeItem('doLoginRes');
		localStorage.removeItem('doLogincampos');
	}

	this.checkFotoMotorista = function() {
		var me       = this;
		var deferred = $.Deferred();
		me.getDataByDocumento().done(function(settings) {
			var arquivo = settings.foto;
			if (arquivo != "") {
				control.fotos.readPic(arquivo).done(function(foto_bin){
					deferred.resolve();
				}).fail(function(msg) {
					var cpf = getLocalValue('cpf');
					getFotoMotorista(cpf).done(function(dados_foto) {
						if (dados_foto.erro) {
							deferred.reject(dados_foto.erro);
						}
						if (dados_foto.foto!=false) {
							control.fotos.writePic(cpf+".jpg", dados_foto.foto).done(function(fullpath, filename){
								me.saveOption('foto',fullpath).done(function() {
									deferred.resolve('foto atualizada');
								}).fail(function(msg) {
									deferred.reject(msg);
								});
							}).fail(function(msg) {
								deferred.reject(msg);
							});
						}
					}).fail(function(msg) {
						deferred.reject(msg);
					});
				});
			} else {
				deferred.resolve();
			}
		});

		return deferred.promise();
	}

	this.doLogin = function(cpf, telefone, codigo_pais, novo_cadastro){
		var me       = this;
		var deferred = $.Deferred();
		var telefone = so_numeros(telefone);
		if (typeof novo_cadastro=="undefined") novo_cadastro = false;
		var campos = {
			// 'documento':  so_numeros(cpf),
			'documento':  cpf,
			'telefone':   so_numeros(telefone),
			'aplicativo': config.appAlias,
            'plataforma': config.appDevice,
            'versao':     config.appVersion,
            'codigo_pais':codigo_pais
		};
		checkLogin(cpf, telefone).done(function(res) {
			var pendente_foto = (typeof res.pendente_foto !== "undefined" ? res.pendente_foto : false);
			if (res.dados_profissional != undefined) {
				res = res.dados_profissional;
			}

			if ((!res.Profissional) || (res.Profissional.codigo==null || res.Profissional.codigo=='') ) {
				deferred.resolve("cadastrar");
			} else {
				if ((!novo_cadastro) && pendente_foto) {
					deferred.resolve('pendente_foto');
				} else {
					campos.nome = res.Profissional.nome;
					campos.email = res.ProfissionalEmail.descricao;
					
					getFotoMotorista(cpf).done(function(dados_foto) {
						if (dados_foto.erro) {
							deferred.reject(dados_foto.erro);
						}
						if (dados_foto.foto!=false) {
							console.log('before write');
							if(config.appDevice != "browser") {
								// control.fotos.writePic(so_numeros(cpf)+".jpg", dados_foto.foto).done(function(fullpath, filename){
								control.fotos.writePic(cpf+".jpg", dados_foto.foto).done(function(fullpath, filename){
									campos.foto = fullpath;
									me.concluiLogin(res,campos).done(function(ret) {
										deferred.resolve(ret);
									}).fail(function(msg) {
										deferred.reject(msg);
									});
								}).fail(function(msg) {
									deferred.reject(msg);
								});
							} else {
								me.concluiLogin(res,campos).done(function(ret) {
									deferred.resolve(ret);
								}).fail(function(msg) {
									deferred.reject(msg);
								});
							}
						} else {
							me.concluiLogin(res,campos).done(function(ret) {
								deferred.resolve(ret);
							}).fail(function(msg) {
								deferred.reject(msg);
							});
						}
					}).fail(function(msg) {
						deferred.reject(msg);
					});
				}
			}
		}).fail(function(msg) {
			//Adicionar erro nao fatal ao fabric
			deferred.reject(msg);
			//deferred.reject('Sem conexão com a internet');
		});
		return deferred.promise();
	}

	this.reenviarCodigo = function(cpf){
		var me       = this;
		var deferred = $.Deferred();
		campos = {
			// 'documento':  so_numeros(cpf),
			'documento':  cpf,
			'aplicativo': config.appAlias,
            'plataforma': config.appDevice,
            'versao':     config.appVersion
		}
		control.rest.makeRequest('/api_motorista_mobile/reenviar_codigo', campos, true).done(function(res){
			if(res.sucesso){
				deferred.resolve();
			} else {
				deferred.reject(res.erro);
			}
		}).fail(function(){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('API','300003', { classe: 'settings.class.js', metodo: 'reenviarCodigo'},{mensagem_padrao: 'Erro ao reenviar código'});	                             
			deferred.reject('[300003]'+getErrorMessage('ErroReenviarCodigo'));
		});
		return deferred.promise();
	}

	this.saveTokenPush = function(aplicativo, force){
		var me = this;
		var deferred = $.Deferred();
		if (typeof aplicativo === "undefined") aplicativo = config.appAlias;
		if (typeof force === "undefined") force = false;
		var sql = "SELECT documento, token_push FROM settings WHERE REPLACE(REPLACE(documento,'.',''),'-','') = ? ";
		if (!force) sql += "AND dt_alt IS NOT NULL";
		control.db.query(sql, [ so_numeros(getLocalValue('cpf')) ], 1).done(function(itemX){
			(function(item) {
				if(item){
					var info = {
						'documento':  item.documento,
						'token_push': item.token_push,
						'platform' : config.appDevice
					}
					var header = {
						'aplicativo': aplicativo
					};
					console.log(header);
					control.rest.makeRequest('/api_motorista_mobile/saveTokenPushSistema', info, false, null, header).done(function(res){
						if(res.sucesso){
							if (aplicativo==config.appAlias) {
								control.db.updateRow(me, { dt_alt: null }, 'documento', info.documento);
								localStorage.setItem('token_push',      info.token_push);
							}
							deferred.resolve('syncSendPushToken: Done.');
						} else {
							deferred.reject("syncSendPushToken: Response error - " + res.erro);
						}
					}).fail(function(){
						//Adicionar erro nao fatal ao fabric
						ErrorClass.parseError('API','300004', { classe: 'settings.class.js', metodo: 'saveTokenPush'},{mensagem_padrao: '"syncSendPushToken: Response error'});	                             
						deferred.reject("[300004]syncSendPushToken: Response error");
					});
				} else {
					console.log('nao encontrado');
					deferred.resolve('syncSendPushToken: Done.');
				}
			}(itemX));
		});
		return deferred.promise();
	}

	this.confCodigo = function(codigo){
		var me       = this;
		var deferred = $.Deferred();
		campos = {
			'documento':       getLocalValue('cpf'),
			'aplicativo':      config.appAlias,
			'cod_confirmacao': codigo
		}
		control.rest.makeRequest('/api_motorista_mobile/confirmar_codigo', campos, true).done(function(res){
			if(!res.erro){
				data_atual = curTime();
				control.db.updateRow(me, {'token': res.token, 'confirmtime': data_atual}, 'id', getLocalValue('id')).done(function(){
					setLocalValue('token',       res.token);
					setLocalValue('confirmtime', data_atual);
					deferred.resolve();
				}).fail(function(msg){
					//Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database','100041', { classe: 'settings.class.js', metodo: 'confCodigo'},{mensagem_padrao: msg});	                     
					deferred.reject(1);
				});
			} else {
				deferred.reject('[100041]'+res.erro);
			}
		}).fail(function(msg){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('API','300005', { classe: 'settings.class.js', metodo: 'confCodigo'},{mensagem_padrao: msg});	                            
			deferred.reject(1);
		});
		return deferred.promise();
	}

	this.doLogoff = function(){
		var me = this;
		var deferred = $.Deferred();
		control.sync.stopAllSyncs();
		control.sync.blockSync = false;
		control.push.resetPushNotification(getLocalValue('cpf'),'mundofrete',true);
		control.push.resetPushNotification(getLocalValue('cpf'));
		removeLocalValue('id');
		removeLocalValue('cpf');
		removeLocalValue('documento');
		removeLocalValue('email');
		removeLocalValue('viag_codigo_sm');
		removeLocalValue('sm_em_transito');
		removeLocalValue('nome');
		removeLocalValue('telefone');
		// removeLocalValue('codigo_pais');
		removeLocalValue('token');
		removeLocalValue('token_call');
		removeLocalValue('senha_call');
		removeLocalValue('confirmtime');
		removeLocalValue('lastLatitude');
   		removeLocalValue('lastLongitude');
   		removeLocalValue('lgpd');
   		removeLocalValue('foto');

   		removeLocalValue('auth');
   		removeLocalValue('authFrete');
   		removeLocalValue('authLocalizacao');
   		removeLocalValue('authValidacao');
		control.db.deleteRow(control.alvo, 1,1);
		control.db.deleteRow(control.viagem, 1,1);
		control.db.deleteRow(control.settings, 1,1);
		control.db.deleteRow(control.carretas, 1,1);
		control.db.deleteRow(control.auth, 1,1);
		control.db.deleteRow(control.comando, 1,1);
		control.db.selectRows(control.fotos, 1, 1).done(function(fotos){
			for(i in fotos) control.fotos.deleteFoto(fotos[i].id);
			control.db.deleteRow(control.fotos, 1,1);
		});
		deferred.resolve();
		return deferred.promise();
	}

	this.saveOption = function(field, value){
		var me = this;
		var deferred = $.Deferred();
		var item = {};
		item[field]    = value;
		item['dt_alt'] = curTime();
		// control.db.updateRow(me, item, 'documento', so_numeros(getLocalValue('cpf'))).done(function(){
		control.db.updateRow(me, item, "REPLACE(REPLACE(documento,'-',''),'.','')", so_numeros(getLocalValue('cpf')) ).done(function(){
			deferred.resolve();
		}).fail(function(msg){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100042', { classe: 'settings.class.js', metodo: 'saveOption'},{mensagem_padrao: msg});	               
			deferred.reject();
		});
		return deferred.promise();
	}

	this.validateForm = function() {
        //var pageContainer = $(this.page.container);
		var view = $(mainView.activePage.container);
		var me = this;
		var campos = {
			'aplicativo': config.appAlias,
			'plataforma': config.appDevice,
			'versao':     config.appVersion
		};
		var existe_tab = (view.find('.tabs').length>0);
		if (existe_tab) {
			var retorno = true;
			var ctab = null;
			view.find('.tab').each(function() {
				retorno = retorno && me.validateTab($(this));
				if (!retorno && ctab==null) {
					var id_tab = $(this).attr('id').replace('tab','');
					ctab = id_tab;
					me.moveToTab(id_tab);
				}
			});
			return retorno;
		} else {
            var fm = view.find('form');

			var erros = valida_form(fm, true);
			if(erros.length > 0) {
				myApp.alert(getErrorMessage('VerificarErros'), getAlertMessage('Atencao'));
				return false;
			}
			return true;
		}
	}

	this.getCurrentTab = function(tab) {
		var view = $(mainView.activePage.container);
		var tab = parseInt(tab);
		return view.find('#tab'+tab);
	}

	this.getNextTab = function(tab) {
		var view = $(mainView.activePage.container);
		var next_tab = parseInt(tab)+1;
		return view.find('#tab'+next_tab);
		//return view.find('.tab-link[data-id='+next_tab+']');
	}

	this.getPreviousTab = function(tab) {
		var view = $(mainView.activePage.container);
		var next_tab = parseInt(tab)-1;
		return view.find('#tab'+next_tab);
		//return view.find('.tab-link[data-id='+next_tab+']');
	}

	this.moveTabForward = function() {
		var view = $(mainView.activePage.container);
		var current_tab_id = view.find('[name=current_tab]').val();
		var next_obj = this.getNextTab(current_tab_id);
		var current_tab = this.getCurrentTab(current_tab_id);
		if (!this.validateTab(current_tab)) {
			return false;
		}
		if (next_obj.length) {
			this.changeTab(next_obj);
		}
	}

	this.moveTabBack = function() {
		var view = $(mainView.activePage.container);
		var current_tab = view.find('[name=current_tab]').val();
		var next_obj = this.getPreviousTab(current_tab)
		if (next_obj.length) {
			this.changeTab(next_obj);
		}
	}

	this.moveToTab = function(id_tab) {
		var obj = this.getCurrentTab(id_tab)
		if (obj.length) {
			this.changeTab(obj);
		}
	}

	this.changeTab = function(tab) {
		var view = $(mainView.activePage.container);
		var seq_pag = tab.attr('id').replace('tab','');
		view.find('[name=current_tab]').val(seq_pag);
		var btnCadastrar = view.find('.btnCadastrar');
		var next = this.getNextTab(seq_pag);
		if (next.length) {
			btnCadastrar.prop('innerHTML',getText('Continuar'));
			btnCadastrar.prop('data-action','continuar');
		} else {
			btnCadastrar.prop('innerHTML',getText('Concluir'));
			btnCadastrar.prop('data-action','concluir');
		}
		myApp.showTab('#tab'+seq_pag);
	}

	this.carregarComboCidadesOrigem = function(container, codigo_uf) {
		var me = this;
	    var deferred = $.Deferred();
	    myApp.showIndicator();
	    console.log('showIndicator carregarComboCidadesOrigem');
	    container.find('[name=cidade_origem]').find('option').remove();
		//var view = $(mainView.activePage.container);
		getCidades(codigo_uf).done(function(ret) {
			me.dados.arrCidades = ret;
			var list = container.find('[name=cidade_origem]');
			list.append($('<option>', { value : '' }).text(getText('Escolha')));
			$.each(me.dados.arrCidades, function (key, cidade) {
				list.append($('<option>', { value : cidade.codigo }).text(cidade.descricao));
			});
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboCidadesOrigem');
			deferred.resolve(true);
		}).fail(function(erro){
			ErrorClass.parseError('database','100043', { classe: 'settings.class.js', metodo: 'carregarComboCidadesOrigem'},{mensagem_padrao: erro});	               
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboCidadesOrigem');
			deferred.reject('[100043]'+erro);
		});
	    return deferred.promise();
	}

	this.carregarComboCidades = function(container, codigo_uf) {
		var me = this;
	    var deferred = $.Deferred();
	    myApp.showIndicator();
	    console.log('showIndicator carregarComboCidades');
	    container.find('[name=cidade]').find('option').remove();
		//var view = $(mainView.activePage.container);
		getCidades(codigo_uf).done(function(ret) {
			me.dados.arrCidades = ret;
			var list = container.find('[name=cidade]');
			list.append($('<option>', { value : '' }).text(getText('Escolha')));
			//console.log(view);
			$.each(me.dados.arrCidades, function (key, cidade) {
				list.append($('<option>', { value : cidade.codigo }).text(cidade.descricao));
			});
			myApp.hideIndicator();
			console.log('hideIndicator carregarComboCidades');
			deferred.resolve(true);
		}).fail(function(erro){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100043', { classe: 'settings.class.js', metodo: 'carregarComboCidades'},{mensagem_padrao: erro});	               
			myApp.hideIndicator();
			console.log('hideIndicator carregarComboCidades');
			deferred.reject('[100043]'+erro);
		});
	    return deferred.promise();
	}

	this.carregarComboEstadosOrigem = function(container, codigo_regiao) {
		var me = this;
		var deferred = $.Deferred();

	    if( codigo_regiao == null || codigo_regiao == undefined ) {
			codigo_regiao = '';
		}

	    myApp.showIndicator();
	    console.log('showIndicator carregarComboEstadosOrigem');

	    container.find('[name=estado_origem]').find('option').remove();

		getEstados(codigo_regiao).done(function(ret) {
			me.dados.arrEstados = ret;
			var list = container.find('[name=estado_origem]');
			list.append($('<option>', { value : '' }).text(getText('Escolha')));
			$.each(me.dados.arrEstados, function (key, estado) {
				list.append($('<option>', { value : key }).text(estado));
			});
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboEstadosOrigem');
			deferred.resolve(true);
		}).fail(function(erro){
			ErrorClass.parseError('database','100044', { classe: 'settings.class.js', metodo: 'carregarComboEstadosOrigem'},{mensagem_padrao: erro});	               
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboEstadosOrigem');

			deferred.reject('[100044]'+erro);
		});
	    return deferred.promise();
	}
	
	this.carregarComboEstados = function(container, codigo_regiao) {
		var me = this;
	    var deferred = $.Deferred();
	    if(codigo_regiao==null || codigo_regiao==undefined) codigo_regiao = '';
	    myApp.showIndicator();
	    console.log('showIndicator carregarComboEstados');
	    container.find('[name=estado]').find('option').remove();
		//var view = $(mainView.activePage.container);
		//console.log(codigo_regiao);
		getEstados(codigo_regiao).done(function(ret) {
			//console.log(ret);
			me.dados.arrEstados = ret;
			var list = container.find('[name=estado]');
			list.append($('<option>', { value : '' }).text(getText('Escolha')));
			//console.log(view);
			$.each(me.dados.arrEstados, function (key, estado) {
				list.append($('<option>', { value : key }).text(estado));
			});
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboEstados');
			deferred.resolve(true);
		}).fail(function(erro){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100044', { classe: 'settings.class.js', metodo: 'carregarComboEstados'},{mensagem_padrao: erro});	               
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboEstados');
			deferred.reject('[100044]'+erro);
		});
	    return deferred.promise();
	}

	this.carregarComboPaises = function(container) {
		var me = this;
	    var deferred = $.Deferred();
	    myApp.showPreloader(getLoadingMessage('Carregando')+'...');
	    console.log('showPreloader carregarComboPaises');
	    container.find('[name=pais]').find('option').remove();
		//var view = $(mainView.activePage.container);
		//console.log(codigo_regiao);
		getPaises().done(function(ret) {
			//console.log(ret);
			me.dados.arrPaises = ret;
			var list = container.find('[name=pais]');
			list.append($('<option>', { value : '', ddi: '' }).text(getText('Escolha')));
			$.each(me.dados.arrPaises, function (key, dados_pais) {
				list.append($('<option>', { value : dados_pais.codigo, ddi: dados_pais.codigo_telefonico }).text(dados_pais.descricao).attr('data-option-image','img/paises/'+dados_pais.imagem+'.png'));
			});
			myApp.hidePreloader();
		    console.log('hidePreloader carregarComboPaises');
			deferred.resolve(true);
		}).fail(function(erro){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100045', { classe: 'settings.class.js', metodo: 'carregarComboPaises'},{mensagem_padrao: erro});	               
			myApp.hidePreloader();
		    console.log('hidePreloader carregarComboPaises');
			deferred.reject('[100045]'+erro);
		});
	    return deferred.promise();
	}

	this.carregarComboModelos = function(container, codigo_fabricante, tipo) {
		var me = this;
	    var deferred = $.Deferred();
	    if(tipo==null || tipo==undefined) tipo="veiculo";
	    myApp.showIndicator();
	    console.log('showIndicator carregarComboModelos');
		//var view = $(mainView.activePage.container);
		getModelos(codigo_fabricante).done(function(ret) {
			me.dados.arrModelos = ret;
			if (tipo=='carreta') {
				var list = container.find('[name=modelo_carreta]');
			} else {
				var list = container.find('[name=modelo]');
			}
			//console.log(view);
			$.each(me.dados.arrModelos, function (key, modelo) {
				list.append($('<option>', { value : key }).text(modelo));
			});
			myApp.hideIndicator();
		    console.log('hideIndicator carregarComboModelos');
			deferred.resolve(true);
		}).fail(function(erro){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100045', { classe: 'settings.class.js', metodo: 'carregarComboModelos'},{mensagem_padrao: erro});	               
			myApp.hidePreloader();
		    console.log('hideIndicator carregarComboModelos');
			deferred.reject('[100045]'+erro);
		});
	    return deferred.promise();
	}

	this.carregarEndereco = function(container, cep) {
		var me = this;
	    var deferred = $.Deferred();
	    myApp.showIndicator();
	    console.log('showIndicator carregarEndereco');
	    var fields = me.getFields(0);
		getEndereco(cep).done(function(dados_endereco) {
			if (dados_endereco==null) {
				dados_endereco = {
					endereco_codigo: "",
					endereco_tipo: "",
					endereco_logradouro: "",
					endereco_bairro: "",
					endereco_cidade: "",
					endereco_estado_abreviacao: "",
					endereco_codigo_estado: "",
					endereco_codigo_cidade: ""
				};
			}
			me.dados_endereco = dados_endereco;
			var endereco = (dados_endereco.endereco_logradouro!="" ? dados_endereco.endereco_tipo+" "+dados_endereco.endereco_logradouro : endereco);
			setFieldValue(fields.endereco,endereco);
			setFieldValue(fields.estado,dados_endereco.endereco_codigo_estado);
			me.carregarComboCidades(container, dados_endereco.endereco_codigo_estado).done(function(res) {
				setFieldValue(fields.cidade,me.dados_endereco.endereco_codigo_cidade);
			});
			setFieldValue(fields.bairro,dados_endereco.endereco_bairro);
			myApp.hideIndicator();
		    console.log('hideIndicator carregarEndereco');
		}).fail(function() {
			myApp.hideIndicator();
			console.log('hideIndicator carregarEndereco');
		});
	    return deferred.promise();
	}

	this.carregarDadosVeiculo = function(container, placa, tipo) {
		var me = this;
	    var deferred = $.Deferred();
	    if (tipo==null || tipo==undefined) tipo = '';
	    myApp.showIndicator();
	    console.log('showIndicator carregarDadosVeiculo');
	    var fields = me.getFields(0);
		getDadosVeiculo(placa, tipo).done(function(dados_veiculo) {
			if (dados_veiculo.erro) {
				myApp.hideIndicator();
			    console.log('hideIndicator carregarDadosVeiculo');
				myApp.alert(dados_veiculo.erro,'Erro ao recuperar dados do motorista / veículo');
				deferred.reject(dados_motorista.erro);
			} else {


				me.dados_veiculo = dados_veiculo;
				// if (tipo=='carreta_um') {
				// 	setFieldValue(fields.marca_carreta_um,(dados_veiculo.fabricante!=undefined ? dados_veiculo.fabricante : ""));
				// 	me.carregarComboModelos(container, getFieldValueObj(fields.marca_carreta_um), '[name=modelo_carreta_um]').done(function(res) {
				// 		setFieldValue(fields.modelo_carreta_um,(dados_veiculo.modelo!=undefined ? dados_veiculo.modelo : ""));
				// 	});
				// 	setFieldValue(fields.ano_carreta_um,(dados_veiculo.ano_fabricacao!=undefined ? dados_veiculo.ano_fabricacao : ""));

				// } else if (tipo=='carreta_dois') {
				// 	setFieldValue(fields.marca_carreta_dois,(dados_veiculo.fabricante!=undefined ? dados_veiculo.fabricante : ""));
				// 	me.carregarComboModelos(container, getFieldValueObj(fields.marca_carreta_dois), '[name=modelo_carreta_dois]').done(function(res) {
				// 		setFieldValue(fields.modelo_carreta_dois,(dados_veiculo.modelo!=undefined ? dados_veiculo.modelo : ""));
				// 	});
				// 	setFieldValue(fields.ano_carreta_dois,(dados_veiculo.ano_fabricacao!=undefined ? dados_veiculo.ano_fabricacao : ""));

				if (tipo=='carreta') {
					fields = me.mapFieldsModal();
					setFieldValue(fields.marca,(dados_veiculo.fabricante!=undefined ? dados_veiculo.fabricante : ""));
					me.carregarComboModelos(container, getFieldValueObj(fields.marca), 'carreta').done(function(res) {
						setFieldValue(fields.modelo,(dados_veiculo.modelo!=undefined ? dados_veiculo.modelo : ""));
						myApp.hideIndicator();
						deferred.resolve();
					});
					setFieldValue(fields.ano,(dados_veiculo.ano_fabricacao!=undefined ? dados_veiculo.ano_fabricacao : ""));
				} else {
					if(dados_veiculo.veic_atrelado == 1){
						fields.tecnologia.attr('disabled', true);
					}
					setFieldValue(fields.tipo_veiculo,(dados_veiculo.codigo_tipo_veiculo!=undefined ? dados_veiculo.codigo_tipo_veiculo : ""));
					setFieldValue(fields.tipo_carroceria,(dados_veiculo.codigo_tipo_carroceria!=undefined ? dados_veiculo.codigo_tipo_carroceria : ""));
					setFieldValue(fields.antt,(dados_veiculo.antt!=undefined ? dados_veiculo.antt : ""));

					setFieldValue(fields.marca,(dados_veiculo.fabricante!=undefined ? dados_veiculo.fabricante : ""));
					me.carregarComboModelos(container, getFieldValueObj(fields.marca)).done(function(res) {
						setFieldValue(fields.modelo,(dados_veiculo.modelo!=undefined ? dados_veiculo.modelo : ""));
					});
					setFieldValue(fields.ano,(dados_veiculo.ano_fabricacao!=undefined ? dados_veiculo.ano_fabricacao : ""));

					setFieldValue(fields.tecnologia,(dados_veiculo.tecnologia!=undefined ? dados_veiculo.tecnologia : ""));
					setFieldValue(fields.versao_tec,(dados_veiculo.versao_tec!=undefined ? dados_veiculo.versao_tec : 0));
					setFieldValue(fields.veic_atrelado,(dados_veiculo.veic_atrelado!=undefined ? dados_veiculo.veic_atrelado : 0));
					if (dados_veiculo.rastreador==1) {
						setFieldValue(fields.rastreador,1);
					} else {
						setFieldValue(fields.rastreador,0);
					}
					myApp.hideIndicator();
				    console.log('hideIndicator carregarDadosVeiculo');
					deferred.resolve();
				}
			}
		}).fail(function(msg) {
			myApp.hideIndicator();
		    console.log('hideIndicator carregarDadosVeiculo');
			deferred.reject(msg);

		});
	    return deferred.promise();
	}

	this.alterarMascara = function(obj, pais) {
		$(obj).removeClass('telefone').removeClass('telefone_mex');
		var celular = false;
		if ($(obj).hasClass('celular') || $(obj).hasClass('celular_mex')) {
			$(obj).removeClass('celular').removeClass('celular_mex');
			celular = true;
		}
		if (pais==11) {
			$(obj).addClass('telefone_mex');
			if (celular) $(obj).addClass('celular_mex');
		} else {
			$(obj).addClass('telefone');
			if (celular) $(obj).addClass('celular');
		}
		$(obj).off();
	}

	this.alterarMascaraTelefones = function(container, pais) {
		var me = this;
		container.find('.telefone').each(function() {
			me.alterarMascara(this, pais);
		});
		container.find('.telefone_mex').each(function() {
			me.alterarMascara(this, pais);
		});
		setup_mascaras();
	}

	this.mapFields = function() {
        var pageContainer = $(this.page.container);
        var fm = pageContainer.find('form');
		var obj = [];
		obj[1] = {
			nome: fm.find('input[name="nome"]'),
			documento: fm.find('input[name="cpf"]'),
			email: fm.find('input[name="email"]'),
			telefone: fm.find('input[name="celular"]')
		};
		obj[2] = {
			cep: fm.find('input[name="cep"]'),
			endereco: fm.find('input[name="endereco"]'),
			numero: fm.find('input[name="numero"]'),
			complemento: fm.find('input[name="complemento"]')
		};
		obj[3] = {
			estado: fm.find('select[name="estado"]'),
			cidade: fm.find('select[name="cidade"]'),
			bairro: fm.find('input[name="bairro"]')
		};
		obj[4] = {
			placa: fm.find('input[name="placa"]'),
			tipo_veiculo: fm.find('select[name="tipo_veiculo"]'),
			tipo_carroceria: fm.find('select[name="tipo_carroceria"]'),
			antt: fm.find('input[name="antt"]')
		};
		obj[5] = {
			marca: fm.find('select[name="marca"]'),
			modelo: fm.find('select[name="modelo"]'),
			ano: fm.find('select[name="ano"]'),
			versao_tec: fm.find('input[name="versao_tec"]'),
			veic_atrelado: fm.find('input[name="veic_atrelado"]'),
			tecnologia: fm.find('select[name="tecnologia"]'),
			rastreador: fm.find('input[name="rastreador"]')			
		};
		obj[6] = {
			carretas: []
		};
		// obj[7] = {
		// 	placa_carreta_dois: fm.find('input[name="placa_carreta_dois"]'),
		// 	marca_carreta_dois: fm.find('select[name="marca_carreta_dois"]'),
		// 	modelo_carreta_dois: fm.find('select[name="modelo_carreta_dois"]'),
		// 	ano_carreta_dois: fm.find('select[name="ano_carreta_dois"]')
		// };		
		obj[8] = {
			cnh: fm.find('input[name="cnh"]'),
			cnh_vencimento: fm.find('input[name="cnh_vencimento"]'),
			cnh_categoria: fm.find('select[name="cnh_categoria"]')
		};
		obj[9] = {
			foto: fm.find('div[class="img-profile"]')
		};

		for(var i=1;i<=2;i++) {
			obj[6].carretas.push({
				placa: fm.find('input[name="carretas['+String(i)+'].placa"]'),
				marca: fm.find('input[name="carretas['+String(i)+'].marca"]'),
				modelo: fm.find('input[name="carretas['+String(i)+'].modelo"]'),
				ano: fm.find('input[name="carretas['+String(i)+'].ano"]')
			});
		}

		obj[0] = {};
		for (var i=1;i<=9;i++) {
			for (var key in obj[i]) {
				obj[0][key] = obj[i][key];
			}
		}
		return obj;
	}

	this.getFields = function(tab) {
		if (tab==null || tab==undefined) tab = 0;
		var obj = this.mapFields();
		return obj[tab];
	}

	this.validateTab = function(tab) {
		var table_id = $(tab).attr('id').replace('tab','');
		var fields = this.getFields(table_id);
		var erros = valida_form(tab, true);
		if(erros.length > 0) {
			myApp.alert(getErrorMessage('VerificarErros'), getAlertMessage('Atencao'));
			return false;
		}
		return true;
	}

	this.prepareSettings = function(alteracao, type) {
		var me = this;
		if (alteracao==null || alteracao==undefined) alteracao = false;
		if (type==null || type==undefined) type = 'register-only';
		var settings = {};
		if ((alteracao) || (type!='register-only') ) {
			var fields = this.getFields(0);
		} else {
			var fields = this.getFields(1);
		}
		console.log('init prepareSettings | fields: ', fields);
		if (alteracao) {
			delete fields['cpf'];
			delete fields['senha'];
			delete fields['conf_senha'];
		}

		if(window.localStorage.getItem('language') == 'pt-br'){
			for (key in fields) {
				switch(key) {
					case "carretas":
						break;
					case "cpf":
					case "celular":
					case "telefone":
					case "documento":
					case "cep":
					case "cnh":
						eval("if (getFieldValueObj(fields."+key+")) settings."+key+"=so_numeros(getFieldValueObj(fields."+key+"));");
						break;
					default:
						eval("if (getFieldValueObj(fields."+key+")) settings."+key+"=getFieldValueObj(fields."+key+");");
				}

			}
		}else{
			for (key in fields) {
				switch(key) {
					case "celular":
					case "telefone":
					case "cep":
					case "cnh":
						eval("if (getFieldValueObj(fields."+key+")) settings."+key+"=so_numeros(getFieldValueObj(fields."+key+"));");
						break;
					default:
						eval("if (getFieldValueObj(fields."+key+")) settings."+key+"=getFieldValueObj(fields."+key+");");
				}
			}
		}

		if (typeof fields.carretas !== undefined)  {
			settings.carretas = [];
			for(var i in fields.carretas) {
				settings.carretas.push({
					placa: getFieldValueObj(fields.carretas[i].placa),
					marca: getFieldValueObj(fields.carretas[i].marca),
					modelo: getFieldValueObj(fields.carretas[i].modelo),
					ano: getFieldValueObj(fields.carretas[i].ano)
				});
			}
		}
		console.log('init prepareSettings | settings: ', settings);
		return settings;
	}//FINAL prepareSettings

	this.prepareFields = function(settings) {
		var data = {};
		for(key in this.tbFields) {
			if (key=="id") {
				if (settings.id!=undefined) {
					data.id = settings.id;
				}
			} else if (key=='codigo_cidade') {
				data.codigo_cidade = settings.cidade;
			} else if (key=='codigo_estado') {
				data.codigo_estado = settings.estado;
			} else if (key=='dt_inc') {
				data.dt_inc = curTime();
			} else {
				eval("data."+key+"=(settings."+key+"!=undefined ? settings."+key+" : null);");
			}
		}
		if (typeof settings.carretas !== "undefined") {
			data.carretas = settings.carretas;
		}
		if (typeof settings.foto_bin !== "undefined") {
			if (settings.foto_bin!=null) {
				data.foto_bin = settings.foto_bin;
			}
		}
		return data;
	}

	this.loadFotoData = function(alteracao) {
		var deferred = $.Deferred();
		if (alteracao==null || alteracao==undefined) alteracao = false;
		var me = this;
		if ($('div.img-profile').length>0) {
			if (alteracao) {
				var obj_class = 'div.img-profile';
			} else {
				var obj_class = 'div.img-profile-cad';
			}
			var arquivo = $(obj_class).attr('data-img').replace('url(','').replace(')','').replace(/\"/gi, "");
			console.log(arquivo);
			if (arquivo=='' || arquivo=='img/profile/ico-profile.png') {
				deferred.resolve(null);
			} else {
				control.fotos.readPic(arquivo).done(function(foto_bin){
					deferred.resolve(foto_bin);
				}).fail(function(msg) {
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('database','100046', { classe: 'settings.class.js', metodo: 'loadFotoData'},{mensagem_padrao: msg});	               
					deferred.reject(getErrorMessage('FotoNaoEncontrada'));
				});
			}
		} else {
			deferred.reject(getErrorMessage('FotoNaoInformada'));
		}
		return deferred.promise();
	}

	this.submitRegister = function(alteracao, tipo) {
		var objMe = this;
		if (alteracao==null || alteracao==undefined) alteracao = false;
		if (tipo==null || tipo==undefined) tipo = "register-only";
		myApp.showIndicator();
		objMe.loadFotoData(alteracao).done(function(foto_bin) {
			var erro = false;
			myApp.hideIndicator();
			var settings = objMe.prepareSettings(alteracao, tipo);
			// console.log(settings); return
			if (foto_bin!=null) {
				settings.foto_bin = foto_bin;
			} else {
				myApp.hideIndicator();
				myApp.alert(getErrorMessage('FotoNaoInformada'),getAlertMessage('Atencao'));
				erro = true;
			}
			if (!erro) {
				if (!alteracao) {
					objMe.incluir(settings);
				} else {
					objMe.atualizar(settings);
				}			
			}
		}).fail(function(msg) {
			myApp.hideIndicator();
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100047', { classe: 'settings.class.js', metodo: 'submitRegister'},{mensagem_padrao: 'Erro ao Salvar os Dados: '+msg});
			if (msg==getErrorMessage('FotoNaoInformada')) {
				myApp.alert(msg,getAlertMessage('Atencao'));
			} else {
				myApp.alert('[100047]'+getErrorMessage('ErroSalvarDados')+': '+msg,getAlertMessage('Atencao'));
			}
		});
	}

	this.incluir = function(settings) {
		var me = this;
		var d1 = control.db.deleteRow(this,1,1);
		myApp.showPreloader('Registrando Usuário');
		d1.done(function(reg) {
			var data = me.prepareFields(settings);
			// console.log(data);
			// return false;
			data.codigo_pais = getLocalValue('codigo_pais');
			incluirMotorista(data,false).done(function(ret) {
				data.codigo 	= ret.codigo;
				data.dt_sync_in = curTime();
				data.token_push = config.gcmID;//seta o token do push para registrar no banco local
				me.moveTempPhotoToPermanent(data.documento).done(function(entry_path, newFileName){
	                console.log(entry_path);
	                var dados = me.trataDadosMotorista(ret, data);
	                if (entry_path!=null) {
	                	console.log(entry_path.toURL());
	                	dados.foto = entry_path.toURL();
	                }
	                console.log(dados);
					control.db.insertRow(me,dados).done(function () {
						myApp.hidePreloader();
						if (me.register_only) {
							var mensagem = getAlertMessage('ObrigadoConfirmarInformacoes')+'. '+getAlertMessage('SeusDadosAtualizados')+'. '+getAlertMessage('BoasViagens');
						} else {
							var mensagem = getAlertMessage('SeuCadastroRealizado')+'. '+getAlertMessage('BoasViagens');
						}
						$(".btnCadastrar").attr("disabled",true);
						myApp.alert(mensagem,getAlertMessage('Aviso'),function() {
							myApp.showIndicator();
							me.doLogin(data.documento, data.telefone, data.codigo_pais, true).done(function () {
			                    myApp.hideIndicator();
								$(".btnCadastrar").attr("disabled",false);
			                    mainView.showNavbar();
			                    mainView.router.load({ url: 'conf-codigo.html' });
			                    //mainView.router.loadPage('main.html');
							});
						});
					}).fail(function (erro) {
						myApp.hidePreloader();
						//Adicionar erro nao fatal ao fabric
						ErrorClass.parseError('database','100048', { classe: 'settings.class.js', metodo: 'incluir'},{mensagem_padrao: "Erro ao incluir Motorista: "+erro});	               
						if (erro=="") erro = getErrorMessage('ErroIncluirMotorista');
						myApp.alert('[100048]'+erro, getAlertMessage('Atencao'));
					});
				}).fail(function(erro) {
					myApp.hideIndicator();
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('database','100049', { classe: 'settings.class.js', metodo: 'incluir'},{mensagem_padrao: erro});	               
					myApp.alert('[100049]'+erro, getAlertMessage('Atencao'));
				});
			}).fail(function (erro) {
				myApp.hidePreloader();
				if (erro=="timeout") {
					erro = getErrorMessage('NaoFoiPossivelConcluirCadastro')+". "+getErrorMessage('TenteNovamenteMaisTarde')+".";
				}
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100050', { classe: 'settings.class.js', metodo: 'incluir'},{mensagem_padrao: erro});	               		
				myApp.alert('[100050]'+erro, getAlertMessage('Atencao'));
			});
		}).fail(function (erro) {
			myApp.hidePreloader();
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100065', { classe: 'settings.class.js', metodo: 'incluir'},{mensagem_padrao: erro});	               			
			myApp.alert('[100065]'+erro, getAlertMessage('Atencao'));
		});
	}

	this.atualizar = function(settings) {
		var me = this;
		var cpf = localStorage.getItem('cpf');
		var data = me.prepareFields(settings);
		myApp.showIndicator();

		atualizarMotorista(data,false).done(function(ret) {
			control.db.selectRows(me,1,1,1).done(function(dados_motorista) {
				data.codigo = dados_motorista.codigo;
				data.dt_sync_in = curTime();
				me.moveTempPhotoToPermanent(cpf).done(function(entry_path, newFileName){
	                if (entry_path!=null) {
	                	data.foto = entry_path.toURL();
	                }
					control.db.updateRow(me,data,'codigo',data.codigo).done(function () {
						setLocalValue('foto',data.foto);
						setLocalValue('nome',data.nome);
				        var d = new Date();
		    		    var n = d.getTime();

						myApp.hideIndicator();
						myApp.alert(getSuccessMessage('DadosMotoristaAtualizados'),getAlertMessage('AtualizacaoCadastro'));
						console.log(entry_path);
						if (entry_path!=null) {
							$('div.img-profile-menu').css('background-image',"url('"+data.foto+"?"+n+"')");
						}
						data.documento = formataCPF(data.documento);
						//me.renderDadosCadastro('dados-pessoais',false, data, "back");
			            myApp.showIndicator();
			            control.viagem.getViagemCompleta().done(function(viagem_atual){
			            	if (viagem_atual === null) {
								setTimeout(function(){
				            		myApp.hideIndicator();
				            		control.viagem.loadSemViagem();
								}, 100);
			            	} else {
			                	setTimeout(function(){ mainView.showNavbar(); mainView.router.load({ url: 'viagem.html', context: viagem_atual, reload: true }); myApp.hideIndicator(); }, 100);
			            	}
			            });

					}).fail(function(erro) {
						myApp.hideIndicator();
						myApp.alert(erro, getAlertMessage('Atencao'));
					});					
				}).fail(function(erro) {
					myApp.hideIndicator();
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('database','100051', { classe: 'settings.class.js', metodo: 'atualizar'},{mensagem_padrao: erro});	               
					myApp.alert('[100051]'+erro, getAlertMessage('Atencao'));
				});
			}).fail(function(erro) {
				myApp.hideIndicator();
				myApp.alert(erro, getAlertMessage('Atencao'));
			});
		}).fail(function (erro) {
			myApp.hideIndicator();
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100052', { classe: 'settings.class.js', metodo: 'atualizar'},{mensagem_padrao: erro});	               	
			myApp.alert('[100052]'+erro, getAlertMessage('Atencao'));
		});
	}

	this.setObrigatoriedade = function(dados) {
		required = [];
		if (dados.obrigatoriedade=='frete') {
			required['email'] = true;
			required['placa'] = true;
			required['tipo_veiculo'] = true;
			required['marca'] = true;
			required['modelo'] = true;
			required['ano'] = true;
			required['cnh'] = true;
			required['cnh_vencimento'] = true;
			required['cnh_categoria'] = true;
			required['tecnologia'] = true;
		}
		return required;
	}

	this.renderPhotoLogin = function(dados) {
		var me = this;
		// myApp.showPreloader(getLoadingMessage('Carregando')+'...');
        var pais = getLocalValue('codigo_pais');
        var d = new Date();
	    var n = d.getTime();

        dados.n = n;
        dados.pais = pais;

        // myApp.hidePreloader();
    	mainView.router.load({ url: 'photo-login.html',reload: false, context: dados, ignoreCache: true });

	}

	this.concluiDadosCadastro = function(page, show_preloader, dados, tipo) {
		var me = this
        dados.estrangeiro = (getLocalValue('codigo_pais')!='1');

        var d = new Date();
	    var n = d.getTime();

        dados.n = n;
        console.log('before hide');
        if (show_preloader) {
        	console.log('hide');
        	myApp.hidePreloader();
		    console.log('hidePreloader renderDadosCadastro');
        }

        if (page=='cadastrar' || page=='dados-pessoais') {
        	mainView.showNavbar();
        }
        dados.required = me.setObrigatoriedade(dados);
        dados.qtd_carretas = (typeof dados.carretas !== "undefined" ? dados.carretas.length : 0);
        dados.carreta1_exists = (dados.qtd_carretas>0);
        dados.carreta2_exists = (dados.qtd_carretas>=2);
        dados.list_carretas = [1, 2];
        if (tipo=="back") {
        	mainView.router.back({ url: page+'.html',reload: true, context: dados, force: true, ignoreCache: true });
        } else {
        	mainView.router.load({ url: page+'.html',reload: false, context: dados, ignoreCache: true });
        }
	}


    this.renderDadosCadastro = function(page, show_preloader, dados, tipo) {
        var me = this;
        if(typeof tipo == 'undefined') tipo="load";
        if(typeof page == 'undefined')
        	return false;
        if(typeof show_preloader == 'undefined')
        	show_preloader = true;
        if (show_preloader) {
        	myApp.showPreloader(getLoadingMessage('Carregando')+'...');
		    console.log('showPreloader renderDadosCadastro');
        }
        var pais = getLocalValue('codigo_pais');
        if (page == 'dados-pessoais') {
	        var load1 = getEstados(null, pais);
	        var load2 = getTiposVeiculo();
	        var load3 = getTiposCarroceria();
	        var load4 = getFabricantes();
	        var load5 = getTecnologias();
	        console.log('Init Load');
	        $.when(load1, load2, load3, load4, load5).then(function(estados, tipos_veiculo, tipos_carroceria, fabricantes, tecnologias){
	            console.log('OK Load');
	            if (typeof dados =='undefined') dados = [];
	            dados.arrEstados = estados;
	            dados.arrTiposVeiculo = tipos_veiculo;
	            dados.arrTiposCarroceria = tipos_carroceria;
	            dados.arrFabricantes = fabricantes;
	            dados.arrTecnologias = tecnologias;
	            dados.arrAnos = getAnos();
	            if (typeof dados.cep !== "undefined" && dados.cep != "") {
	            	dados.cep = formataCEP(dados.cep);
	            }

	            me.concluiDadosCadastro(page,show_preloader,dados,tipo);

	        }, function(msg){
	            if (show_preloader) {
				    console.log('hidePreloader renderDadosCadastro');
	            	myApp.hidePreloader();
	            }

	            myApp.alert(getErrorMessage(ErroCarregarDados)+': '+msg);
	            //deferred.reject();
	        });
	    } else {
            if (typeof dados =='undefined') dados = [];

            me.concluiDadosCadastro(page,show_preloader,dados,tipo);
	    }
    }

  	this.checkMotorista = function(cpf) {
		console.log('init checkMotorista');
		var deferred = $.Deferred();
		if(window.localStorage.getItem('language') == 'pt-br'){
			cpf = so_numeros(cpf);
		}
		var def = getCurrentDefinitions();
		var funct = def['validationFunctions']['cpf'];

		eval("ret = "+funct+"(cpf)");

		if (!ret) {
			deferred.reject('cpf_invalido');
		} else {
			getDadosMotorista(cpf).done(function(res) {
				if ((!res.Profissional) || (res.Profissional.codigo==null || res.Profissional.codigo=='') ) {
					deferred.resolve("cadastrar");
				} else {
					deferred.reject('existente');
				}
			}).fail(function (erro) {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100053', { classe: 'settings.class.js', metodo: 'checkMotorista'},{mensagem_padrao: erro});	               	
				deferred.reject('[100053]'+erro);
			});
		}
		return deferred.promise();
	}//FINAL checkMotorista

	this.openPictureMotorista = function(cpf, origin) {
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
        console.log('FOTO MOTORISTA');
        navigator.camera.getPicture(function(imageURI){
        	console.log('yyyy');
            if(config.appDevice != "browser") window.plugins.insomnia.keepAwake();

            if (imageURI.substring(0,21)=="content://com.android") {
                photo_split = imageURI.split("%3A");
                imageURI = "content://media/external/images/media/" + photo_split[1];
            }        

            // me.moveTempPhotoMotorista(imageURI, so_numeros(cpf)).done(function(entry_path, newFileName){
            me.moveTempPhotoMotorista(imageURI, cpf).done(function(entry_path, newFileName){
	            var d = new Date();
	            var n = d.getTime();

                $('div.img-profile').css('background-image',"url('"+entry_path.toURL()+"?"+n+"')");
                $('div.img-profile').attr('data-img',entry_path.toURL());
                $('.close-foto').trigger('click');
            }).fail(function(message){
                console.log(message);
            });
        }, function(message) {
        	// alert(message);
			//alert('[500001]Erro ao capturar imagem');
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('media','500001', { classe: 'settings.class.js', metodo: 'openPictureMotorista'},{mensagem_padrao: message});	               	

            if(config.appDevice != "browser") window.plugins.insomnia.keepAwake();
            console.log('get picture failed: ' + message);
        }, options);
    }

    this.copyFile = function(entry, directory, newFileName) {
        var me = this;

        var deferred = $.Deferred();
        var dir_name = directory.toURL();
        if (dir_name.slice(-1)!='/') dir_name += '/';

        window.resolveLocalFileSystemURL(dir_name+newFileName, function(file) {
        	file.remove(function(f) {
				entry.copyTo(directory, newFileName, function(entry_path) {
		           	deferred.resolve(entry_path, newFileName);
		        }, function(error) {
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('media','500002', { classe: 'settings.class.js', metodo: 'copyFile', arquivo: newFileName, diretorio: entry_path },{mensagem_padrao: error});
		            deferred.reject('[500002]Erro: ' + error.code);
		        });
        	}, function(error) {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('media','500003', { classe: 'settings.class.js', metodo: 'copyFile'},{mensagem_padrao: error});	               	 
        		deferred.reject('[500003]Erro: '+error.code);
        	});

        }, function(err) {
			entry.copyTo(directory, newFileName, function(entry_path) {
	           	deferred.resolve(entry_path, newFileName);
	        }, function(error) {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('media','500004', { classe: 'settings.class.js', metodo: 'copyFile', arquivo: newFileName, diretorio: entry_path},{mensagem_padrao: error});	               	 
	            deferred.reject('[500004]Erro: ' + error.code);
	        });
        });
        return deferred.promise();
    }

    this.moveTempPhotoMotorista = function(file, cpf){
        var me = this;

        var deferred = $.Deferred();
        console.log(file);
        //window.resolveLocalFileSystemURI(file, function(entry) {
        window.resolveLocalFileSystemURL(file, function(entry) {
            var d = new Date();
            var n = d.getTime();

            //new file name
            var newFileName = cpf + "_tmp" + ".jpg";
            var myFolderApp = control.appAlias;

            window.resolveLocalFileSystemURL(control.fotos.fileURI, function(entry_path){

                entry_path.getDirectory(myFolderApp, { create:true, exclusive: false }, function(directory){

                    me.copyFile(entry, directory, newFileName).done(function(entry_path, newFileName) {
			           	deferred.resolve(entry_path, newFileName);
			        }, function(error) {
						//Adicionar erro nao fatal ao fabric
						ErrorClass.parseError('media','500005', { classe: 'settings.class.js', metodo: 'moveTempPhotoMotorista', arquivo: newFileName, diretorio: directory},{mensagem_padrao: error});	               	 
			            deferred.reject('[500005]'+error);
			        });
                }, function(error) {
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('media','500006', { classe: 'settings.class.js', metodo: 'moveTempPhotoMotorista'},{mensagem_padrao: error});	               	 
                    deferred.reject('[500006]Erro: ' + error.code);
                });
            }, function(error) {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('media','500007', { classe: 'settings.class.js', metodo: 'moveTempPhotoMotorista', diretorio: myFolderApp},{mensagem_padrao: error});	               	 
                deferred.reject('[500007]Erro: ' + error.code);
            });
        }, function(error) {
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('media','500008', { classe: 'settings.class.js', metodo: 'moveTempPhotoMotorista', arquivo: file},{mensagem_padrao: error});	               	               
            deferred.reject('[500008]Erro: ' + error.code);
        });
        return deferred.promise();
    }

    this.getPhotoName = function(arquivo) {
    	var arrArquivo = arquivo.split('/');
    	return arrArquivo.pop();
    }

    this.moveTempPhotoToPermanent = function(cpf){
        var me = this;

        var deferred = $.Deferred();

		// var arquivo = $('div.img-profile').css('background-image').replace('url(','').replace(')','').replace(/\"/gi, "");
		var arquivo = $('div.img-profile').attr('data-img').replace('url(','').replace(')','').replace(/\"/gi, "");
        //var file = img_object.css('background-image');
        
        //window.resolveLocalFileSystemURI(file, function(entry) {
        if (arquivo=='' || arquivo=='img/profile/ico-profile.png') {
        	deferred.resolve(null, null);
        } else {
	        window.resolveLocalFileSystemURL(arquivo, function(entry) {
	        	entry.getParent(function(directory) {
		            //new file name
		            var newFileName = cpf + ".jpg";
		            if (me.getPhotoName(arquivo)==newFileName) {
		            	deferred.resolve(entry, newFileName);
		            } else {
			            var myFolderApp = control.appAlias;
	                    me.copyFile(entry, directory, newFileName).done(function(entry_path, newFileName) {
				           	deferred.resolve(entry_path, newFileName);
				        }, function(error) {
							//Adicionar erro nao fatal ao fabric
							ErrorClass.parseError('media','500009', { classe: 'settings.class.js', metodo: 'moveTempPhotoToPermanent', arquivo: newFileName, diretorio: directory },{mensagem_padrao: error});	               	               
				            deferred.reject('[500009]'+error);
				        });
	                }
                }, function(error) {
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('media','500010', { classe: 'settings.class.js', metodo: 'moveTempPhotoToPermanent', diretorio: directory },{mensagem_padrao: error});	               	               
                    deferred.reject('[500010]'+getErrorMessage('Erro')+': ' + error.code);
                });
	        }, function(error) {
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('media','500011', { classe: 'settings.class.js', metodo: 'moveTempPhotoToPermanent', diretorio: directory },{mensagem_padrao: error});	               	                               
	            deferred.reject('[500011]'+getErrorMessage('Erro')+': ' + error.code);
	        });
	    }
        return deferred.promise();
    }

    this.getDataByDocumento = function() {
		var deferred = $.Deferred();    	
        control.settings.getData("REPLACE(REPLACE(documento,'.',''),'-','')", so_numeros(getLocalValue('cpf'))).done(function(res) {
			deferred.resolve(res);       	
       	}).fail(function(msg) {
			deferred.reject(msg);
       	});
		return deferred.promise();    	
    }

    this.getData = function(field, value) {
        var me = this;

        var deferred = $.Deferred();
        var result = [];

        if(typeof dt_ref == "undefined") dt_ref = curTime();

		
        control.db.selectRows(me, field, value, 1).done(function(res){
        	result = res;

        	if (res != null && res.id !== undefined) {
		        control.db.selectRows(control.carretas, 'settings_id', res.id).done(function(res2){
		        	res.carretas = res2;
		        	deferred.resolve(res);
		        }).fail(function() {
					res.carretas = [];
		        	deferred.resolve(res);
		        });
        	} else {
        		res.carretas = [];
	        	deferred.resolve(res);
        	}

        }).fail(function(msg){

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100080', { classe: 'settings.class.js', metodo: 'getData'},{mensagem_padrao: msg + ' - SQL: '+sql});	                      
            deferred.reject(msg);
        });

        return deferred.promise();    	
    }

	this.preencherDados = function(container, dados) {
	    var me = this;
	    var fields = me.getFields(0);

		// Dados Profissional
		setFieldValue(fields.cpf,(dados.documento!=undefined ? dados.documento : ""));
		setFieldValue(fields.telefone,(dados.telefone!=undefined ? dados.telefone : ""));
		setFieldValue(fields.codigo_pais,(dados.codigo_pais!=undefined ? dados.codigo_pais : ""));
		setFieldValue(fields.nome,(dados.nome!=undefined ? dados.nome : ""));
		setFieldValue(fields.email,(dados.email!=undefined ? dados.email : ""));
		setFieldValue(fields.celular,(dados.celular!=undefined ? dados.celular : ""));

		// Dados Endereço
		setFieldValue(fields.cep,(dados.cep!=undefined ? dados.cep : ""));
		setFieldValue(fields.endereco,(dados.endereco!=undefined ? dados.endereco : ""));
		setFieldValue(fields.numero,(dados.numero!=undefined ? dados.numero : ""));
		setFieldValue(fields.complemento,(dados.complemento!=undefined ? dados.complemento : ""));
		setFieldValue(fields.bairro,(dados.bairro!=undefined ? dados.bairro : ""));
		setFieldValue(fields.estado,(dados.codigo_estado!=undefined ? dados.codigo_estado : ""));
		me.carregarComboCidades(container, getFieldValueObj(fields.estado)).done(function(res) {
			if (dados.codigo_cidade!=undefined ) {
				setFieldValue(fields.cidade, dados.codigo_cidade);
			} else {
				setFieldValue(fields.cidade,"");
			}
		});

		// Dados Veículo
		setFieldValue(fields.placa,(dados.placa!=undefined ? dados.placa : ""));
		setFieldValue(fields.tipo_veiculo,(dados.tipo_veiculo!=undefined ? dados.tipo_veiculo : ""));
		setFieldValue(fields.tipo_carroceria,(dados.tipo_carroceria!=undefined ? dados.tipo_carroceria : ""));
		setFieldValue(fields.antt,(dados.antt!=undefined ? dados.antt : ""));
		setFieldValue(fields.marca,(dados.marca!=undefined ? dados.marca : ""));
		me.carregarComboModelos(container, getFieldValueObj(fields.marca)).done(function(res) {
			if (dados.modelo!=undefined ) {
				setFieldValue(fields.modelo, dados.modelo);
			} else {
				setFieldValue(fields.modelo,"");
			}
		});
		setFieldValue(fields.ano,(dados.ano!=undefined ? dados.ano : ""));
		setFieldValue(fields.versao_tec,(dados.versao_tec!=undefined ? dados.versao_tec : ""));
		setFieldValue(fields.veic_atrelado,(dados.veic_atrelado!=undefined ? dados.veic_atrelado : ""));
		setFieldValue(fields.tecnologia,(dados.tecnologia!=undefined ? dados.tecnologia : ""));

		// Dados CNH
		setFieldValue(fields.cnh,(dados.cnh!=undefined ? dados.cnh : ""));
		setFieldValue(fields.cnh_vencimento,(dados.cnh_vencimento!=undefined ? dados.cnh_vencimento : ""));
		setFieldValue(fields.cnh_categoria,(dados.cnh_categoria!=undefined ? dados.cnh_categoria : ""));

		console.log(fields.carretas);

		for(var i = 0; i<=1; i++) {
			if (typeof dados.carretas[i] != "undefined") {
				setFieldValue(fields.carretas[i].placa,dados.carretas[i].placa);
				setFieldValue(fields.carretas[i].marca,dados.carretas[i].marca);
				setFieldValue(fields.carretas[i].modelo,dados.carretas[i].modelo);
				setFieldValue(fields.carretas[i].ano,dados.carretas[i].ano);

			} else {
				setFieldValue(fields.carretas[i].placa,"");
				setFieldValue(fields.carretas[i].marca,"");
				setFieldValue(fields.carretas[i].modelo,"");
				setFieldValue(fields.carretas[i].ano,"");
			}
		}

	}

	this.mapFieldsModal = function() {
        var pageContainer = $(this.page.container);
		var fm = $('.modal-view');

		var fields_modal = {
			placa: fm.find('.placa_carreta'),
			marca: fm.find('.marca_carreta'),
			modelo: fm.find('.modelo_carreta'),
			ano: fm.find('.ano_carreta'),
		}

		return fields_modal;

	}

	this.setEventosCarreta = function(incluir, sequencia) {
		var modalView = $('.modal-view');
		var me = this;
		console.log(modalView.find('[name=marca_carreta]'));
		modalView.on('change','[name=marca_carreta]',function() {
			var codigo_fabricante = $(this).val();
			me.carregarComboModelos(modalView, codigo_fabricante, 'carreta');
			setFieldValue(modalView.find('[name=modelo_carreta]'),'');
		});
		modalView.on('change','[name=placa_carreta]',function() {
			var placa = $(this).val();
			if(placa.length == 8) {
				me.carregarDadosVeiculo(modalView, placa, 'carreta').fail(function(msg) {
					myApp.closeModal();
					me.loadModalCarreta(incluir,sequencia);
					me.limparCamposCarreta();
				});
			} else {
				if (placa.length > 0) {
					myApp.alert(getAlertMessage('PlacaInvalida'),getAlertMessage('Atencao'));
					myApp.closeModal();
					me.loadModalCarreta(incluir,sequencia);
					me.limparCamposCarreta();
				} else {
					me.limparCamposCarreta();
				}
			}
		});

	}

	this.limparCamposCarreta = function() {
		var fields_modal = this.mapFieldsModal();
		setFieldValue(fields_modal.placa,'' );
		setFieldValue(fields_modal.marca,'' );
		this.carregarComboModelos($('.modal-view'), '', 'carreta').done(function(res) {
			setFieldValue(fields_modal.modelo,'' );
		});
		setFieldValue(fields_modal.ano,'' );		
	}
	this.editarCarreta = function(sequencia) {
		var fields = this.getFields(0);

		this.loadModalCarreta(false,sequencia);

		var fields_modal = this.mapFieldsModal();
		setFieldValue(fields_modal.placa,getFieldValueObj(fields.carretas[sequencia-1].placa) );
		setFieldValue(fields_modal.marca,getFieldValueObj(fields.carretas[sequencia-1].marca) );

		this.carregarComboModelos($('.modal-view'), getFieldValueObj(fields_modal.marca), 'carreta').done(function(res) {
			// setFieldValue(fields.modelo_carreta,(getFieldValueObj(fields.carretas[sequencia-1].modelo)!=undefined ? getFieldValueObj(fields.carretas[sequencia-1].modelo) : ""));
			setFieldValue(fields_modal.modelo,getFieldValueObj(fields.carretas[sequencia-1].modelo) );
		});
				
		setFieldValue(fields_modal.ano,getFieldValueObj(fields.carretas[sequencia-1].ano) );		
		console.log(fields_modal.placa);
	}

	this.incluirCarreta = function() {
		var pageContainer = $(this.page.container);

		var sequencia = pageContainer.find('#add-carreta').attr('data-seq');
		
		this.loadModalCarreta(true,sequencia);

		var fields_modal = this.mapFieldsModal();

		setFieldValue(fields_modal.placa,"");
		setFieldValue(fields_modal.marca,"");
		setFieldValue(fields_modal.modelo,"");
		setFieldValue(fields_modal.ano,"");		
	}

	this.tratarIconesCarretas = function(qtd_carretas) {
		var pageContainer = $(this.page.container);
		pageContainer.find('#edit-carreta-1').css('display',qtd_carretas>0 ? '' : 'none');
		pageContainer.find('#edit-carreta-2').css('display',qtd_carretas>=2 ? '' : 'none');
		pageContainer.find('#add-carreta').css('display',qtd_carretas<2 ? '' : 'none');
		pageContainer.find('#add-carreta').attr('data-seq',qtd_carretas+1);
	}

	this.removerCarreta = function(sequencia) {
	    var fields = this.getFields(0);
	    var qtd_carretas = 1;

	    if (sequencia==1) {
			setFieldValue(fields.carretas[sequencia-1].placa,getFieldValueObj(fields.carretas[1].placa));
			setFieldValue(fields.carretas[sequencia-1].marca,getFieldValueObj(fields.carretas[1].marca));
			setFieldValue(fields.carretas[sequencia-1].modelo,getFieldValueObj(fields.carretas[1].modelo));
			setFieldValue(fields.carretas[sequencia-1].ano,getFieldValueObj(fields.carretas[1].ano));		

			qtd_carretas =(fields.carretas[sequencia-1].placa != "" ? 1 : 0);

			sequencia++;
	    }

		setFieldValue(fields.carretas[sequencia-1].placa,"");
		setFieldValue(fields.carretas[sequencia-1].marca,"");
		setFieldValue(fields.carretas[sequencia-1].modelo,"");
		setFieldValue(fields.carretas[sequencia-1].ano,"");		

		this.tratarIconesCarretas(qtd_carretas);
	}

	this.getErrosCarreta = function() {
		var fields_modal = this.mapFieldsModal();
		var msg_erro = getErrorMessage('NaoFoiPreenchido');
		var campo_erro = "";
		if (campo_erro == "" && getFieldValueObj(fields_modal.placa) == "") {
			campo_erro = "placa";
		}
		if (campo_erro == "" && getFieldValueObj(fields_modal.marca) == "") {
			campo_erro = "marca";
		}
		if (campo_erro == "" && getFieldValueObj(fields_modal.modelo) == "") {
			campo_erro = "modelo";
		}
		if (campo_erro == "" && getFieldValueObj(fields_modal.ano) == "") {
			campo_erro = "ano";
		}

		if (campo_erro != "") {
			return getErrorMessage('Campo')+" "+campo_erro+" "+msg_erro;
		}

		return false;
	}

	this.salvarCarreta = function(sequencia) {
	    var fields = this.getFields(0);
		var fields_modal = this.mapFieldsModal();

		setFieldValue(fields.carretas[sequencia-1].placa,getFieldValueObj(fields_modal.placa));
		setFieldValue(fields.carretas[sequencia-1].marca,getFieldValueObj(fields_modal.marca));
		setFieldValue(fields.carretas[sequencia-1].modelo,getFieldValueObj(fields_modal.modelo));
		setFieldValue(fields.carretas[sequencia-1].ano,getFieldValueObj(fields_modal.ano));

		var qtd_carretas = 0;
		for(var i = 0; i<=1; i++) {
			if (getFieldValueObj(fields.carretas[sequencia-1].placa)!="") {
				qtd_carretas++;
			}
		}
		this.tratarIconesCarretas(qtd_carretas);
	}

	this.loadModalCarreta = function(incluir, sequencia) {
		var me = this;
		var template = Dom7('#tplmodalCarreta').html();
		var buttons = []
		buttons.push({
			text: getAlertMessage('CancelarAlteracoes'),
			close: true,
		});
		if (!incluir) {
			buttons.push({
				text: getAlertMessage('RemoverCarreta'),
				close: false,
				onClick: function(obj) {
					me.removerCarreta(sequencia);
					myApp.closeModal(obj);
				}
			});
		}
		buttons.push({
			text: getAlertMessage('SalvarCarreta'),
			bold: true,
			close: false,
			onClick: function(obj) {
				var erro = me.getErrosCarreta();
				if (erro === false) {
					me.salvarCarreta(sequencia);
					myApp.closeModal(obj);					
				} else {
					myApp.alert(erro, getAlertMessage('Atencao'));
					myApp.closeModal(obj);
					if (incluir) {
						me.incluirCarreta();
					} else {
						me.editarCarreta(sequencia);
					}
				}
			}
		});
		var modal_carreta = myApp.modal({
			title: (incluir ? getAlertMessage('IncluirCarreta') : getAlertMessage('EditarCarreta')),
			text: (incluir ? getAlertMessage('MsgIncluirCarreta') : getAlertMessage('MsgEditarCarreta')),
			afterText: template,
			buttons: buttons,
			verticalButtons: true,
		});

		$$(modal_carreta).on('modal:opened', function () {
			myApp.addView('.modal-view');
		});

		this.setEventosCarreta(incluir, sequencia);

	}

	this.photoLogin = function(dados) {
		//
		var me = this;
		var deferred = $.Deferred();
		validarFotoMotorista(dados.cpf, dados.telefone, dados.foto_bin, dados.atualizar_foto).done(function(res) {
			if (typeof res.erro !== "undefined") {
				console.log(res.erro);
				deferred.reject(res.erro);
			} else {
				if (typeof res.dados_profissional !=="undefined") res = res.dados_profissional;
				dados.nome = res.Profissional.nome;
				dados.email = res.ProfissionalEmail.descricao;
				if (dados.atualizar_foto) {
					console.log('1965');
					getFotoMotorista(dados.cpf).done(function(dados_foto) {
						if (dados_foto.erro) {
							deferred.reject(dados_foto.erro);
						}
						if (dados_foto.foto!=false) {
							if(config.appDevice != "browser") {
								// control.fotos.writePic(so_numeros(cpf)+".jpg", dados_foto.foto).done(function(fullpath, filename){
								control.fotos.writePic(dados.cpf+".jpg", dados_foto.foto).done(function(fullpath, filename){
									dados.foto = fullpath;
									me.concluiLogin(res,dados).done(function(ret) {
										deferred.resolve(ret);
									}).fail(function(msg) {
										deferred.reject(msg);
									});
								}).fail(function(msg) {
									deferred.reject(msg);
								});
							} else {
								me.concluiLogin(res,dados).done(function(ret) {
									deferred.resolve(ret);
								}).fail(function(msg) {
									deferred.reject(msg);
								});
							}
						} else {
							deferred.reject(getErrorMessage('ErroRecuperarFoto'));
						}
					}).fail(function(msg) {
						deferred.reject(msg);
					});
				} else {
					console.log('1997');
					me.concluiLogin(res,dados).done(function(ret) {
						console.log('1999');
						deferred.resolve(ret);
					}).fail(function(msg) {
						console.log('2002');
						deferred.reject(msg);
					});					
				}
			}
		}).fail(function(msg) {
			console.log('2008');
			deferred.reject(msg);
		});
		return deferred.promise();
	}

	this.setupView = function(){
		var me = this;
		myApp.onPageInit('login-screen', function(page) {
            var pageContainer = $(page.container);
			pageContainer.find('input[name="cpf"]').val(getLocalValue('cpf'));
			//pageContainer.find('input[name="nome"]').val(getLocalValue('nome'));
			pageContainer.find('input[name="telefone"]').val(getLocalValue('telefone'));
			pageContainer.find('input[name="pais"]').val(getLocalValue('codigo_pais'));
			pageContainer.find('input[name="cpf"]').blur();
			pageContainer.find('input[name="pais"]').blur();
			pageContainer.find('input[name="telefone"]').blur();
            pageContainer.find('.submitBtn').on('click', function () {
            	var fm = pageContainer.find('form');
            	var erros = valida_form(fm, true);
                if(erros.length == 0){
                	var cpf      = pageContainer.find('input[name="cpf"]').val();
					//var nome     = pageContainer.find('input[name="nome"]').val();
					var telefone = pageContainer.find('input[name="telefone"]').val();
					var codigo_pais = getFieldValue(pageContainer,"pais");
					myApp.showPreloader(getLoadingMessage('Carregando')+'...');
                    me.doLogin(cpf, telefone, codigo_pais).done(function(tipo_retorno){
                        mainView.showNavbar();
                        console.log(tipo_retorno);
                        if (tipo_retorno=="login") {
                        	myApp.hidePreloader();
		                    mainView.router.load({ url: 'conf-codigo.html' });
		                } else {
		                	var dados = {
		                		cpf: cpf,
		                		codigo_pais: codigo_pais,
		                		telefone: telefone
		                	}

		                	if (tipo_retorno=="pendente_foto") {
	                        	myApp.hidePreloader();
		                		me.renderPhotoLogin(dados);
			                	//myApp.alert(getErrorMessage('MsgPhotoLogin'),getAlertMessage('Atencao'),function() {
			                		// me.openPictureLogin(cpf, false);
			                		// me.renderDadosCadastro('cadastrar',true,dados);
			                	//});
			                } else {
	                        	myApp.hidePreloader();
			                	myApp.alert(getErrorMessage('CPFNaoCadastrado')+'.<br/><br/> '+getErrorMessage('RedirecionadoCadastro')+'.',getAlertMessage('Atencao'),function() {
			                		me.renderDadosCadastro('cadastrar',true,dados);
			                	});
			                }
			            }
                    }).fail(function(msg){
						myApp.hidePreloader();
						//Adicionar erro nao fatal ao fabric
						ErrorClass.parseError('generico','900001', { classe: 'settings.class.js', metodo: 'setupView/doLogin'},{mensagem_padrao:'Houve um problema ao realizar login:' + msg});	               	                               
                        myApp.alert('[900001]'+getErrorMessage('ProblemaLogin')+': ' + msg, getAlertMessage('Atencao'));
                    });
                } else {
                    myApp.alert(getErrorMessage('VerificarErros'), getAlertMessage('Atencao'));
                }
            });
        	pageContainer.find('.back').click(function(e){
        		e.preventDefault();
                mainView.hideNavbar();
                mainView.router.loadPage('iniciar.html');
        	});  
        	pageContainer.find("input, textarea").focus(function(){  $(document.body).addClass('keyboard-up');     });
			pageContainer.find("input, textarea").blur(function(){  $(document.body).removeClass('keyboard-up');  });          
            pageContainer.find('#LogoAcompanhamento').attr('src',"img/lang/"+getLocalValue('language').substring(0,2)+"/logotipo-acompanhamento-logistico.png");

	    });
		myApp.onPageInit('conf-codigo', function(page) {
            var pageContainer = $(page.container);
            pageContainer.find('.confirmar-codigo').off('click').on('click', function () {
            	codigo = pageContainer.find('input[name="codigo"]').val();
            	me.confCodigo(codigo).done(function(){
            		if (!me.checkLGPD()) {
	            		mainView.hideNavbar();
						control.routeEntrada(true);
            		} else {
	            		control.push.setupPushNotification();
	            		// mainView.hideNavbar();
						control.sync.firstSync().always(function(){
							control.sync.startAllSyncs(false);
					        if (control.auth.checkAuthFrete()) {
					        	control.sync.syncClickCargo();
					        }
							control.routeEntrada(true);
	                    });            			
            		}
            	}).fail(function(msg){
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('generico','900002', { classe: 'settings.class.js', metodo: 'setupView/myApp.onPageInit'},{mensagem_padrao:'Erro ao confirmar código: ' + msg});	               	                               
            		myApp.alert('[900002]: '+ getErrorMessage('ErroConfirmaCodigo') + msg, getAlertMessage('Atencao'));
            	});
            });
            $('.btnVoltarCodigo').on('click',function(event) {
                event.preventDefault();
                mainView.hideNavbar();
	            mainView.router.back({ url: 'login.html', ignoreCache: true, force: true, context: {language: getLocalValue('language').substring(0,2)}} );
            });
            pageContainer.find('.alterar-dados').on('click', function () {
                mainView.hideNavbar();
	            mainView.router.load({ url: 'login.html', context: {language: getLocalValue('language').substring(0,2)}});
            });
            pageContainer.find('.reenviar-codigo').on('click', function () {
            	if($(this).hasClass('actionButtonDisabled')) return false;

				$(this).addClass('actionButtonDisabled');

            	var cpf = getLocalValue('cpf');

            	me.reenviarCodigo(cpf).done(function(){
                    myApp.alert(getSuccessMessage('SMSReenviado'), 'Sucesso');

		            setTimeout(function(){
		            	pageContainer.find('.reenviar-codigo').removeClass('actionButtonDisabled');
		            }, 60000);
                }).fail(function(msg){
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('media','900003', { classe: 'settings.class.js', metodo: 'setupView/me.reenviarCodigo'},{mensagem_padrao:'Houve um problema ao reenviar SMS: ' + msg});	               	                               
                    myApp.alert('[900003]'+getErrorMessage('ErroReenvioSMS')+': ' + msg, getAlertMessage('Atencao'));
                    pageContainer.find('.reenviar-codigo').removeClass('actionButtonDisabled');
                });
            });
			myApp.onPageAfterBack('*', function(page){
	            setTimeout(function(){ setup_mascaras(); }, 300);
	        });
            if(mainView.activePage.fromPage.name != 'index'){
            	pageContainer.find('.reenviar-codigo').addClass('actionButtonDisabled');

	            setTimeout(function(){
	            	pageContainer.find('.reenviar-codigo').removeClass('actionButtonDisabled');
	            }, 60000);
            }
	    });
		myApp.onPageInit('cadastrar', function(page) {
			me.page = page;
            $('div.img-profile').attr('data-img','');
            var pageContainer = $(page.container);
            var navBarContainer = $(page.navbarInnerContainer);
            var fm = pageContainer.find('form');
			var list = fm.find('[name=estado]');
			//pageContainer.find('input').attr('tabindex','-1');
			//pageContainer.find('select').attr('tabindex','-1');
			pageContainer.on('keydown',function(e) {
				if (e.keyCode == 9) {
    				e.preventDefault();
  				}
			});
			pageContainer.on('change','[name=cpf]',function() {
				var cpf = $(this).val();
				var myObj = $(this);
				myApp.showIndicator();
				me.checkMotorista(cpf).fail(function (erro) {
					myApp.hideIndicator();
					if (erro=="cpf_invalido") {
						myApp.alert(getErrorMessage('CPFInvalido'),getAlertMessage('Atencao'));
						myObj.val("");
						if (!myObj.hasClass('has-error')) myObj.addClass('has-error');
					} else if (erro=="existente") {
						myApp.alert(getErrorMessage('CPFExisteNoCadastro')+'. <br/><br/>'+getErrorMessage('RedirecionadoLogin'),function() {
	    	                mainView.hideNavbar();
	    	                mainView.router.loadPage('login.html',{context: {language: getLocalValue('language').substring(0,2)}});
						});
					} else {
						myApp.alert(erro,getAlertMessage('Atencao'));
						myObj.val("");
					}
				}).done(function() {
					myApp.hideIndicator();
				});
			});

			pageContainer.on('click','.btnCadastrar',function () {
				var type = $(this).prop('data-action');
				if (type=='register-only') {
					$('[name=placa]').val('');
					if (me.validateTab($("#tab1"))) {
						me.submitRegister(false, type);
					}
				} else {
					if (me.validateForm()) {
						me.submitRegister();
					}
				}
			});
			navBarContainer.on('click','.btnVoltar',function (e) {
                mainView.hideNavbar();
				mainView.router.loadPage({url: 'iniciar.html'});
				e.preventDefault();
				e.stopPropagation();
			});
			var myCalendar = myApp.calendar({
			    input: '#cnh_vencimento',
			    dateFormat: 'dd/mm/yyyy',
			    monthNames: getMonths(), //['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto' , 'Setembro' , 'Outubro', 'Novembro', 'Dezembro'],
			    dayNames: getDaysOfWeek(), // ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
			    monthNamesShort: getMonths(true), //['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago' , 'Set' , 'Out', 'Nov', 'Dez'],
			    dayNamesShort: getDaysOfWeek(true), // ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'],
			    closeOnSelect: true
			});

			pageContainer.on('click','.btnEditImagem',function () {
        		var fm = pageContainer.find('form');
				if ($.trim(fm.find('input[name="cpf"]').val())=="") {
					myApp.alert(getAlertMessage('InformarCPFAntesDeImagem'));
				} else {
					mainView.hideNavbar();
					$('.bg-block').fadeIn(400);
				}
			});

			pageContainer.on('click','.close-foto',function () {
				mainView.showNavbar();
				$('.bg-block').fadeOut(400);
			});

            pageContainer.on('click', '.ico-foto-motorista', function(e){
                e.preventDefault();
                var documento = $.trim(fm.find('input[name="cpf"]').val());
                var origem = $(this).attr('data-origem');
				if ($.trim(fm.find('input[name="cpf"]').val())=="") {
					myApp.alert(getAlertMessage('InformarCPFAntesDeImagem'));
				} else {
	                me.openPictureMotorista(documento, origem);
	            }
            });

		});

		myApp.onPageInit('dados-pessoais', function(page) {
			me.page = page;
            var pageContainer = $(page.container);
            var modalView = $('.modal-view');
            var dados = page.context;
            
            me.preencherDados(pageContainer, dados);

        	pageContainer.find('a.btnSair').click(function(e){
        		e.preventDefault();
                myApp.confirm(getAlertMessage('DesejaSair'), getAlertMessage('Aviso'), function () {
            		me.doSair().done(function(){
    	                mainView.hideNavbar();
						mainView.router.loadPage('iniciar.html');
						navigator.app.exitApp();
    	            });
                });
			});
			
			pageContainer.find('a.btnLogoff').click(function(e){
        		e.preventDefault();
                myApp.confirm(getAlertMessage('DesejaRealizarLogoff')+' \n '+getAlertMessage('ExplicacaoLogoff'), getAlertMessage('Aviso'), function () {
            		me.doLogoff().done(function(){
    	                mainView.hideNavbar();
    	                mainView.router.loadPage('iniciar.html');
    	            });
                });
        	});

        	pageContainer.find('a.btnCancelar').click(function(e) {
        		console.log(Dom7('.back'));
        		//Dom7('.back').trigger('click');
        		mainView.router.back();
        	});

			pageContainer.on('click','.btnCadastrar',function () {
				if (me.validateForm()) {
					me.submitRegister('atualizar');
				}
			});

			pageContainer.on('click','.btnEditImagem',function () {
				mainView.hideNavbar();
				$('.bg-block').fadeIn(400);
			});

			pageContainer.on('click','.close-foto',function () {
				mainView.showNavbar();
				$('.bg-block').fadeOut(400);
			});

            pageContainer.on('click', '.ico-foto-motorista', function(e){
                e.preventDefault();

                var origem = $(this).attr('data-origem');

                me.openPictureMotorista(dados.documento, origem);
            });

			pageContainer.on('change','[name=estado]',function() {
				var codigo_uf = $(this).val();
				setFieldValue(fm.find('[name=cidade]'),"");
				me.carregarComboCidades(pageContainer, codigo_uf);
			});
			pageContainer.on('change','[name=marca]',function() {
				var codigo_fabricante = $(this).val();
				me.carregarComboModelos(pageContainer, codigo_fabricante);
			});
			pageContainer.on('change','[name=cep]',function() {
				var definitions = getCurrentDefinitions();
				var loadCEP = (definitions['others']['adressByCEP']!=null && definitions['others']['adressByCEP']!=undefined ? definitions['others']['adressByCEP'] : false);
				if (loadCEP) {
					var cep = $(this).val();
					me.carregarEndereco(pageContainer, cep);
				}
			});
			pageContainer.on('change','[name=placa]',function() {
				var placa = $(this).val();
				if(placa.length == 8) {
					me.carregarDadosVeiculo(pageContainer, placa, 'veiculo');
				}
			});
			pageContainer.on('change','[name=tecnologia]',function() {
				pageContainer.find('[name=versao_tec]').val('');
				if ($(this).val()=="" || $(this).val()==20 || $(this).val()==5096) {
					pageContainer.find('[name=rastreador]').val(0);
				} else {
					pageContainer.find('[name=rastreador]').val(1);
				}
			});

			pageContainer.off('click','img-edit-carreta').on('click','.img-edit-carreta',function(e) {
				var sequencia = $(this).attr('data-seq');
				me.editarCarreta(sequencia);
			});

			pageContainer.off('click','img-add-carreta').on('click','.img-add-carreta',function(e) {
				me.incluirCarreta();
			});

	    });

		myApp.onPageInit('photo-login', function(page) {
			me.page = page;
            var pageContainer = $(page.container);
            var modalView = $('.modal-view');
            var dados = page.context;

            pageContainer.on('click', '.btnTirarFoto', function(e){
                e.preventDefault();

                var origem = $(this).attr('data-origem');

                me.openPictureMotorista(dados.cpf, "camera");
            });


            pageContainer.on('click', '.submitBtn', function(e) {
				myApp.showPreloader(getLoadingMessage('ValidandoFoto'));
				me.loadFotoData(false).done(function(foto_bin) {
					if (foto_bin==null) {
						myApp.hidePreloader();
						myApp.alert(getErrorMessage('FotoNaoInformada'),getAlertMessage('Atencao'));
						erro = true;
					} else {
		            	var atualizar_foto = pageContainer.find('input[name="atribuir_foto"]').is(':checked');
	                	dados.atualizar_foto = atualizar_foto;
	                	dados.foto_bin = foto_bin;
	                	me.photoLogin(dados).done(function() {
							myApp.hidePreloader();
		                    mainView.showNavbar();
		                    mainView.router.load({ url: 'conf-codigo.html' });

	                	}).fail(function(msg) {
							myApp.hidePreloader();
							ErrorClass.parseError('media','500029', { classe: 'settings.class.js', metodo: 'photoLoginSubmit'},{mensagem_padrao: 'Erro ao Informar Foto: '+msg});
							myApp.alert(msg,getAlertMessage('Atencao'));
	                	});
					}
					/*
					var settings = objMe.prepareSettings(alteracao, tipo);
					// console.log(settings); return
					if (foto_bin!=null) {
						settings.foto_bin = foto_bin;
					} else {
						myApp.hideIndicator();
						myApp.alert(getErrorMessage('FotoNaoInformada'),getAlertMessage('Atencao'));
						erro = true;
					}
					if (!erro) {
						if (!alteracao) {
							objMe.incluir(settings);
						} else {
							objMe.atualizar(settings);
						}			
					}
					*/
				}).fail(function(msg) {
					myApp.hidePreloader();
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('media','500029', { classe: 'settings.class.js', metodo: 'photoLoginSubmit'},{mensagem_padrao: 'Erro ao Informar Foto: '+msg});
					if (msg==getErrorMessage('FotoNaoInformada')) {
						myApp.alert(msg,getAlertMessage('Atencao'));
					} else {
						myApp.alert('[500029]'+getErrorMessage('ErroSubmeterFoto')+': '+msg,getAlertMessage('Atencao'));
					}
				});
/*
            	var fm = pageContainer.find('form');
            	var erros = valida_form(fm, true);

                if(erros.length == 0){
                	var cpf      = pageContainer.find('input[name="cpf"]').val();
					//var nome     = pageContainer.find('input[name="nome"]').val();
					var telefone = pageContainer.find('input[name="telefone"]').val();
					var codigo_pais = getFieldValue(pageContainer,"pais");
					myApp.showPreloader(getLoadingMessage('Carregando')+'...');
                    me.doLogin(cpf, telefone, codigo_pais).done(function(tipo_retorno){
                        mainView.showNavbar();
                        console.log(tipo_retorno);
                        if (tipo_retorno=="login") {
                        	myApp.hidePreloader();
		                    mainView.router.load({ url: 'conf-codigo.html' });
		                } else {
		                	var dados = {
		                		cpf: cpf,
		                		codigo_pais: codigo_pais,
		                		telefone: telefone
		                	}

		                	if (tipo_retorno=="pendente_foto") {
	                        	myApp.hidePreloader();
		                		me.renderPhotoLogin(dados);
			                	//myApp.alert(getErrorMessage('MsgPhotoLogin'),getAlertMessage('Atencao'),function() {
			                		// me.openPictureLogin(cpf, false);
			                		// me.renderDadosCadastro('cadastrar',true,dados);
			                	//});
			                } else {
	                        	myApp.hidePreloader();
			                	myApp.alert(getErrorMessage('CPFNaoCadastrado')+'.<br/><br/> '+getErrorMessage('RedirecionadoCadastro')+'.',getAlertMessage('Atencao'),function() {
			                		me.renderDadosCadastro('cadastrar',true,dados);
			                	});
			                }
			            }
                    }).fail(function(msg){
						myApp.hidePreloader();
						//Adicionar erro nao fatal ao fabric
						ErrorClass.parseError('generico','900001', { classe: 'settings.class.js', metodo: 'setupView/doLogin'},{mensagem_padrao:'Houve um problema ao realizar login:' + msg});	               	                               
                        myApp.alert('[900001]'+getErrorMessage('ProblemaLogin')+': ' + msg, getAlertMessage('Atencao'));
                    });
                } else {
                    myApp.alert(getErrorMessage('VerificarErros'), getAlertMessage('Atencao'));
                }

*/
            });

	    });

		myApp.onPageInit('gratis', function(page) {
            var pageContainer = $(page.container);
        	pageContainer.find('.botao-rodape').click(function(e){
        		e.preventDefault();
                mainView.hideNavbar();
                mainView.router.loadPage('seleciona-pais.html');
        	});
	    });
		myApp.onPageInit('iniciar', function(page) {
            var pageContainer = $(page.container);
        	pageContainer.find('.btnLogin').click(function(e){
        		e.preventDefault();
                mainView.hideNavbar();
                mainView.router.load({ url: 'pre-login.html', ignoreCache: true, context: {language: getLocalValue('language').substring(0,2)}});
        	});
        	pageContainer.find('.btnCadastrar').click(function(e){
        		e.preventDefault();
                mainView.showNavbar();
                me.renderDadosCadastro('cadastrar',true,{});
                //mainView.router.loadPage('cadastrar.html');
        	});
	    });
		myApp.onPageInit('pre-login', function(page) {
            var pageContainer = $(page.container);
        	pageContainer.find('.next').click(function(e){
        		e.preventDefault();
                mainView.hideNavbar();
                mainView.router.load({url: 'login.html', ignoreCache: true, context: {language: getLocalValue('language').substring(0,2)}});
        	});
	    });
	}




	this.questionaLgpd = function(codigo, logado) {
		if (logado==null || logado==undefined) logado = false;
		control.renderQuestionaLgpd(codigo, logado);
	}//FINAL this.questionaLgpd




	this.loadTableInfo = function(){
		this.tbName   = 'settings';
		this.tbPK     = 'id';
		this.tbFields = {
			'id':          		'INTEGER AUTOINCREMENT',

            'codigo':         	'INTEGER PRIMARY KEY',
			'codigo_pais': 		'INTEGER',
			'nome':        		'TEXT',
			'documento':   		'TEXT',
            'senha':       		'TEXT',
			'telefone':    		'TEXT',
            'email':       	 	'TEXT',
			'cep':            	'TEXT',
			'endereco':       	'TEXT',
			'numero': 		 	'INTEGER',
			'complemento': 	 	'TEXT',
			'bairro': 		 	'TEXT',
			'codigo_cidade':  	'INTEGER',
			'codigo_estado':  	'INTEGER',
			'placa': 		 	'TEXT',
			'tipo_veiculo': 	'INTEGER',
			'tipo_carroceria': 	'INTEGER',
			'antt': 			'TEXT',
			'marca': 		 	'INTEGER',
			'modelo': 		 	'INTEGER',
			'ano': 			 	'INTEGER',
			'rastreador': 	 	'INTEGER',
			'cnh': 			 	'TEXT',
			'cnh_vencimento': 	'TEXT',
			'cnh_categoria': 	'INTEGER',

			'confirmtime': 		'TEXT',
			'token'      : 		'TEXT',
			'token_push':  		'TEXT',
			'token_call':  		'TEXT',
			'senha_call': 		'TEXT',
			'dt_alt':      		'TEXT',
			'foto': 			'TEXT',
			'foto_bin':    		'TEXT',
			'tecnologia': 	 	'INTEGER',
			'versao_tec':		'INTEGER',
			'rastreador': 	 	'INTEGER',
			'veic_atrelado': 	'INTEGER', 
			'lgpd': 			'INTEGER',      

		};
   	}

   	this.createTable = function(){
   		var deferred = $.Deferred();
   		control.db.createTable(this).done(function(){
   			deferred.resolve();
   		}).fail(function(e){
   			deferred.reject(e);
   		});
   		return deferred.promise();
   	}

   	this.dropTable = function(){
   		var deferred = $.Deferred();
   		control.db.dropTable(this).done(function(){
   			deferred.resolve();
   		}).fail(function(e){
   			deferred.reject(e);
   		});
   		return deferred.promise();
   	}

};