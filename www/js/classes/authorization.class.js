var authorizationClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};
	this.push     = null;
	this.pushErr  = 0;
	this.page 	  = null;

	this.init = function(){
		var deferred = $.Deferred();
		this.loadTableInfo();
		this.setupView();
		this.dados = [];
		deferred.resolve();
		return deferred.promise();
	}

	this.checkAutorizacaoExistente = function() {
		return ($.trim(getLocalValue('auth')) ? true : false);
	}

	this.checkAuthLocalizacao = function(){
		return ($.trim(getLocalValue('authLocalizacao'))==1 ? true : false);
	}

	this.checkAuthFrete = function(){
		return ($.trim(getLocalValue('authFrete'))==1 ? true : false);
	}

	this.checkAuthValidacao = function(){
		return ($.trim(getLocalValue('authValidacao'))==1 ? true : false);
	}

	this.syncPermissoes = function() {
		var me = this;
		var deferred = $.Deferred();
		console.log('syncPermissoes');
		
		control.db.selectRows(control.settings,1,1,1).done(function(settings) {
			var documento = settings.documento;
			control.db.selectRows(me,1,1).done(function(permissoes) {
				var total = permissoes.length;
				if (total > 0) {
					for (j in permissoes) {
						(function (i) {
							var dados_envio = {
								documento: documento,
								lgpd: permissoes[i].aprovacao,
								tipo: permissoes[i].codigo_tipo,
							};
							salvaAceiteLogin(dados_envio).done(function(result){
								permissoes[i].codigo = result.id;
								control.db.updateRow(me,permissoes[i],'codigo_tipo',permissoes[i].codigo_tipo).done(function() {
									if (i>=(total-1)) {
										deferred.resolve();
									}
								}).fail(function(msg) {
									ErrorClass.parseError('database','100087', { classe: 'authorization.class.js', metodo: 'syncPermissoes'},{mensagem_padrao: msg});
									deferred.reject(msg);
								});
							}).fail(function(msg) {
								ErrorClass.parseError('API','300037', { classe: 'authorization.class.js', metodo: 'syncPermissoes'},{mensagem_padrao: msg});
								deferred.reject(msg);
							});

						}(j));

					}
				}
			}).fail(function(msg) {
				ErrorClass.parseError('database','100085', { classe: 'authorization.class.js', metodo: 'syncPermissoes'},{mensagem_padrao: msg});
				deferred.reject(msg);
				// myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
			});
		}).fail(function(msg) {
			ErrorClass.parseError('database','100053', { classe: 'authorization.class.js', metodo: 'syncPermissoes'},{mensagem_padrao: msg});
			deferred.reject(msg);
			// myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
		});
		return deferred.promise();
	}

	this.syncGetPermissoes = function() {
		var me = this;
		var deferred = $.Deferred();

		control.db.selectRows(control.settings,1,1,1).done(function(settings) {
			var documento = settings.documento;

			getAutorizacoes(documento).done(function(permissoes) {
				var total = permissoes.length;

				if (total > 0) {

					for (j in permissoes) {
						(function (i) {

							control.db.selectRows(me,'codigo_tipo',codigo,1).done(function(dados) {

								var auth = permissoes[i].aprovacao;
								if (dados == null) {
									dados = {
										codigo: permissoes[i].codigo,
										codigo_tipo: permissoes[i].codigo_tipo,
										tipo: permissoes[i].texto,
										aprovacao: auth,
										data_aprovacao: (auth == 1 ? curTime() : null)
									};
									var d1 = control.db.insertRow(me,dados)
								} else {
									if (dados.aprovacao != auth) {
										dados.data_aprovacao = (auth == 1 ? curTime() : null);
									}
									dados.aprovacao = auth;
									dados.codigo = permissoes[i].codigo;
									var d1 = control.db.updateRow(me,dados,'codigo_tipo',permissoes[i].tipo);
								}

								d1.done(function() {

									switch(dados.codigo_tipo) {
										case '1':
										case 1:
										 	console.log('124');
									        console.log('authFrete = ',auth);
											setLocalValue('authFrete',auth);
											break;
										case '3':
										case 3:
											setLocalValue('authLocalizacao',auth);
											break;
										case '4':
										case 4:
											setLocalValue('authValidacao',auth);
											break;

									}

									if (i>=(total - 1)) {
										setLocalValue('auth',1);
										deferred.resolve();
									}
								}).fail(function(msg) {
									ErrorClass.parseError('database','100087', { classe: 'authorization.class.js', metodo: 'syncGetPermissoes'},{mensagem_padrao: msg});
									deferred.reject(msg);
								});
							}).fail(function(msg) {
								ErrorClass.parseError('database','100084', { classe: 'authorization.class.js', metodo: 'syncGetPermissoes'},{mensagem_padrao: msg});
								deferred.reject(msg);
							});
						}(j));

					}
				}


			}).fail(function(msg) {
				ErrorClass.parseError('API','300036', { classe: 'authorization.class.js', metodo: 'syncGetPermissoes'},{mensagem_padrao: msg});
				deferred.reject(msg);
			});

		}).fail(function(msg) {
			ErrorClass.parseError('database','100053', { classe: 'authorization.class.js', metodo: 'syncPermissoes'},{mensagem_padrao: msg});
			deferred.reject(msg);
			// myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
		});
		return deferred.promise();
	}	

	this.routeAceite = function() {
		var me = this;
		setLocalValue('lgpd',1);
        control.push.setupPushNotification();
        control.sync.startAllSyncs(true);
        if (control.auth.checkAuthFrete()) {
        	control.sync.syncClickCargo();
        }
        mainView.showNavbar();                    
        control.routeEntrada(true);			  	
	}

	this.setupView = function(){
		var me = this;
		var deferred = $.Deferred();

		myApp.onPageInit('aceite-lgpd', function(page){
			me.page = page;
			var pageContainer = $(page.container);
			var dados = page.context;

			pageContainer.find('.input-lgpd-login').change(function() {
				var aceite = ($('.input-lgpd-login').is(':checked'));
				if (aceite) {
					$('.btnAceitar').attr('disabled',false).removeClass('actionButtonDisabled');

				} else {
					$('.btnAceitar').attr('disabled',true).addClass('actionButtonDisabled');
				}
			});
			pageContainer.find('.btnLinkPermissoes').click(function() {
				var primeira_autorizacao = (!me.checkAutorizacaoExistente());
				me.loadTelaPermissoes(primeira_autorizacao, 'aceite-lgpd', dados);
			});
			pageContainer.find('.btnRejeitar').click(function(e) {
        		e.preventDefault();
        		control.settings.doLogoff().done(function(){
	                mainView.hideNavbar();
	                mainView.router.loadPage('iniciar.html');
	            });
			});
			pageContainer.find('.btnAceitar').click(function () {
				var profissional = pageContainer.find('input[name="codigo"]').val();
				var documento 	 = pageContainer.find('input[name="documento"]').val();
				var aceite		 = getFieldValueObj(pageContainer.find('input[name="lgpd"]')); 
				var data  		 = {
					documento: documento, 
					lgpd: aceite, 
					tipo: 2
				};
				salvaAceiteLogin(data).done(function(res){
					if (typeof res.erro !== "undefined") {
						myApp.alert(getAlertMessage('ErroPermissoes')+': ' + res.erro, getAlertMessage('Atencao'));	
						return;
					}
					var settings = JSON.parse(localStorage.getItem('settingsIncluir'));
					if (settings != null && settings != undefined) {
						settings.lgpd = 1;
						control.settings.incluir(settings);
					} else {
						if (!me.checkAutorizacaoExistente()) {
							console.log('non existe');
							me.salvarTodasPermissoes().done(function() {
								me.syncPermissoes().done(function() {
									me.routeAceite();
								}).fail(function(msg){
									myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
								});								
							}).fail(function(msg){
								myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
							});
						} else {
							console.log('existe');
							me.syncPermissoes().done(function() {
								me.routeAceite();
							}).fail(function(msg){
								myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
							});
						}
						// var res                    = JSON.parse(localStorage.getItem('doLoginRes')); 
						// var campos                 = JSON.parse(localStorage.getItem('doLogincampos'));                                             
						// var senha                  = localStorage.getItem('doLoginSenha');
						// var atualiza_dados_veiculo = localStorage.getItem('doLoginAtualizaDadosVeiculo');	

						// me.processaLogin(res, campos, senha, atualiza_dados_veiculo).done(function(res){
						// 	mainView.showNavbar();
						// 	mainView.router.load({ url: 'main.html' });
						// }).fail(function (erro) {
						// 	myApp.alert('Houve um problema ao realizar login: ' + erro, 'Atenção');
						// });
					}
				}).fail(function(msg){
					myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
				});
			});
		});

		myApp.onPageInit('privacidade', function(page){
			me.page = page;
			var pageContainer = $(page.container);
			var navBarContainer = $(page.navbarInnerContainer);
			console.log(page.context.origem);
			if (page.context.origem=="aceite-lgpd") {
				navBarContainer.off('click','.btnVoltar').on('click','.btnVoltar',function (e) {
					var dados = page.context;
					myApp.showIndicator();
					control.renderQuestionaLgpd(dados.codigo, dados.logado, 'back').fail(function(msg) {
						myApp.hideIndicator();
						myApp.alert(msg, getAlertMessage('Atencao'));
					}).done(function() {
						myApp.hideIndicator();
						//
					});
					e.preventDefault();
					e.stopPropagation();						
				});
			}

			pageContainer.find('.btnSalvarPrivacidade').click(function(e) {

				me.savePermissoes(page.context).done(function() {
					if (page.context.origem!="aceite-lgpd") {
						myApp.showIndicator();
						me.syncPermissoes().done(function() {
							if (me.checkAuthFrete()) {
								control.settings.saveTokenPush('mundofrete', true);
								control.sync.syncClickCargo();
							} else {
								control.push.resetPushNotification(getLocalValue('cpf'),'mundofrete',true);
							}
							myApp.hideIndicator();
							if (page.context.origem == "viagem") {
								control.viagem.reloadViagem();
							} else if (page.context.origem == "sem-viagem") {
								control.viagem.loadSemViagem();
							} else if (page.context.origem == "menu-click") {
								if (me.checkAuthFrete()) {
									mainView.back();
								} else {
									if (getLocalValue('viag_codigo_sm') != null) {
										control.viagem.reloadViagem();
									} else {
										// control.viagem.loadPesquisaViagem();
									}
								}
							} else {
								mainView.back();
							}
						}).fail(function(msg){
							myApp.hideIndicator();
							myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
						});								
					} else {
						mainView.back();
					}
				}).fail(function(msg) {
					myApp.alert(getAlertMessage('ErroPermissoes')+': ' + msg, getAlertMessage('Atencao'));
				})
			});

			pageContainer.find('.chkAutorizacao').change(function(e) {
				if ($(this).val()!=1) return;
				var obj = $(this);
				myApp.showIndicator();
				control.settings.getDataByDocumento().done(function(settings) {
					myApp.hideIndicator();
					if (obj.is(':checked')) {
						var frete_permitido = me.checkCamposFretes(settings);
						if (!frete_permitido) {
							me.modalDadosFrete(obj, settings);
						}
					}
				}).fail(function(msg) {
					myApp.hideIndicator();
					myApp.alert(getAlertMessage('ErroDefinirPermissao'),getAlertMessage('Aviso'))
				})
			});
			
		});		
	}//FINAL setupView

	this.modalDadosFrete = function(obj, settings) {
		var me = this;
        myApp.modal({
            title: getAlertMessage('Atencao'),
            text: getAlertMessage('NecessarioPreencherDados')+'.<br/><br/>'+getAlertMessage('DesejaPreencherDados'),
            buttons: [
                {
                    text: getAlertMessage('SimM'),
                    close: true,
                    onClick: function (obj2) {
                    	var dados = settings;
                    	dados.origem = 'permissoes';
                    	dados.obrigatoriedade = 'frete';
						control.settings.renderDadosCadastro('dados-pessoais',true,dados);
                    }
                },
                {
                    text: getAlertMessage('NaoM'),
                    close: true,
                    onClick: function (obj2) {
                    	obj.attr('checked',false);
                    }
                },
            ]

        });

	}

	this.checkCamposFretes = function(settings) {
		var campos_fretes = true;

		campos_fretes = (campos_fretes && (settings.placa != null && settings.placa != ""));
		campos_fretes = (campos_fretes && (settings.tipo_veiculo != null && settings.tipo_veiculo != ""));
		campos_fretes = (campos_fretes && (settings.marca != null && settings.marca != ""));
		campos_fretes = (campos_fretes && (settings.modelo != null && settings.modelo != ""));
		campos_fretes = (campos_fretes && (settings.ano != null && settings.ano != ""));
		campos_fretes = (campos_fretes && (settings.cnh != null && settings.cnh != ""));
		campos_fretes = (campos_fretes && (settings.cnh_vencimento != null && settings.cnh_vencimento != ""));
		campos_fretes = (campos_fretes && (settings.cnh_categoria != null && settings.cnh_categoria != ""));
		campos_fretes = (campos_fretes && (settings.tecnologia != null && settings.tecnologia != ""));

		return campos_fretes;
	}

	this.savePermissoes = function(context) {
		var me = this;
		var deferred = $.Deferred();
		console.log(context.tipos_autorizacao);
		var total = $('.chkAutorizacao').length;
		$('.chkAutorizacao').each(function(i, obj) {
			var codigo = obj.value;
			var auth = (obj.checked ? 1 : 0);
			control.db.selectRows(me,'codigo_tipo',codigo,1).done(function(dados) {
				if (dados == null) {
					dados = {
						codigo_tipo: codigo,
						tipo: context.tipos_autorizacao[i].texto,
						aprovacao: auth,
						data_aprovacao: (auth == 1 ? curTime() : null)
					};
					var d1 = control.db.insertRow(me,dados)
				} else {
					if (dados.aprovacao != auth) {
						dados.data_aprovacao = (auth == 1 ? curTime() : null);
					}
					dados.aprovacao = auth;
					var d1 = control.db.updateRow(me,dados,'codigo_tipo',codigo);
				}
				d1.done(function() {
					switch(codigo) {
						case 1:
						case "1":
							console.log('424');
					        console.log('authFrete = ',auth);
							setLocalValue('authFrete',auth);
							break;
						case 3:
						case "3":
							setLocalValue('authLocalizacao',auth);
							break;
						case 4:
						case "4":
							setLocalValue('authValidacao',auth);
							break;

					}
					if (i>=(total - 1)) {
						setLocalValue('auth',1);
						deferred.resolve();
					}
				}).fail(function(msg) {
					ErrorClass.parseError('database','100087', { classe: 'authorization.class.js', metodo: 'savePermissoes'},{mensagem_padrao: msg});
					deferred.reject(msg);
				});
			}).fail(function(msg) {
				ErrorClass.parseError('database','100084', { classe: 'authorization.class.js', metodo: 'savePermissoes'},{mensagem_padrao: msg});
				deferred.reject(msg);
			});
		});
		return deferred.promise();
	}

	this.salvarTodasPermissoes = function() {
		var me = this;
		var deferred = $.Deferred();

		control.db.selectRows(control.settings,1,1,1).done(function(settings) {
			control.db.deleteRow(me, 1,1).done(function() {
				me.loadPermissoes(true).done(function(context) {
					var total = context.tipos_autorizacao.length;
					for(var j in context.tipos_autorizacao) {
						(function (i) {
							var codigo = context.tipos_autorizacao[i].codigo;
							var frete_permitido = true;
							if (codigo == 1) {
								frete_permitido = me.checkCamposFretes(settings);
							}
							dados = {
								codigo_tipo: codigo,
								tipo: context.tipos_autorizacao[i].texto,
								aprovacao: (frete_permitido ? 1 : 0),
								data_aprovacao: (frete_permitido ? curTime() : "")
							};
							var d1 = control.db.insertRow(me,dados);
							d1.done(function() {
								console.log(codigo);
								switch(codigo) {
									case 1:
									case "1":
								        console.log('481');
								        console.log('authFrete = ',(frete_permitido ? 1 : 0));
										setLocalValue('authFrete',(frete_permitido ? 1 : 0));
										break;
									case 3:
									case "3":
										setLocalValue('authLocalizacao',1);
										break;
									case 4:
									case "4":
										setLocalValue('authValidacao',1);
										break;

								}
								if (i>=(total - 1)) {
									setLocalValue('auth',1);
									deferred.resolve();
								}
							}).fail(function(msg) {
								ErrorClass.parseError('database','100087', { classe: 'authorization.class.js', metodo: 'savePermissoes'},{mensagem_padrao: msg});
								deferred.reject(msg);
							});
						})(j);
					}
				}).fail(function(msg) {
					deferred.reject(msg);
				});
			}).fail(function(msg) {
				deferred.reject(msg);
			});
		}).fail(function(msg) {
			deferred.reject(msg);
		});

		return deferred.promise();	
	}

	this.loadTelaPermissoes = function(primeira_autorizacao, origem, dados) {
		myApp.showPreloader(getLoadingMessage('Carregando'));
		this.loadPermissoes(primeira_autorizacao).done(function(context) {
			console.log(context);
			myApp.hidePreloader();
			context.origem = origem;
			context.logado = dados.logado;
			context.codigo = dados.codigo;
        	mainView.router.load({ url: 'privacidade.html',reload: false, context: context, ignoreCache: true });

		}).fail(function(msg) {
			myApp.hidePreloader();
			myApp.alert('[900063]'+msg, getAlertMessage('Atencao'));
		})
	}

	this.preparaArrayAuth = function(context, settings) {
		var me = this;
		for(var i in context.tipos_autorizacao) {
			if (context.autorizacoes.length == 0) {
				if (context.tipos_autorizacao[i].codigo==1) {
					var frete_permitido = me.checkCamposFretes(settings);
					context.tipos_autorizacao[i].aprovacao = (frete_permitido ? 1 : 0);
					context.tipos_autorizacao[i].checked = (frete_permitido ? "checked" : "");
				} else {
					context.tipos_autorizacao[i].aprovacao = 1;
					context.tipos_autorizacao[i].checked = "checked";
				}
			} else {
				// console.log(context.autorizacoes);
				for (var j in context.autorizacoes) {
					if (context.tipos_autorizacao[i].codigo == context.autorizacoes[j].codigo_tipo) {
						context.tipos_autorizacao[i].aprovacao = context.autorizacoes[j].aprovacao;
						context.tipos_autorizacao[i].checked = (context.autorizacoes[j].aprovacao==1 ? "checked" : "");
					}
					if (context.tipos_autorizacao[i].aprovacao === undefined) {
						context.tipos_autorizacao[i].aprovacao = 0;
						context.tipos_autorizacao[i].checked = "";
					}
				}
			}
		}
		return context;
	}

	this.loadPermissoes = function(primeira_autorizacao) {
		var deferred = $.Deferred();
		var me = this;
		getTiposAutorizacao().done(function(tipos_autorizacao) {
			if (primeira_autorizacao) {
				autorizacoes = [];
				context = {
					tipos_autorizacao: tipos_autorizacao,
					autorizacoes: autorizacoes
				};
				control.db.selectRows(control.settings,1,1,1).done(function(settings) {
					context = me.preparaArrayAuth(context, settings);
					console.log(context);
					deferred.resolve(context);
				}).fail(function(msg) {
					ErrorClass.parseError('database','100088', { classe: 'authorization.class.js', metodo: 'loadPermissoes'},{mensagem_padrao: msg});
					deferred.reject(msg);
				});
			} else {
				control.db.selectRows(me,1,1).done(function(autorizacoes) {
					context = {
						tipos_autorizacao: tipos_autorizacao,
						autorizacoes: autorizacoes
					};
					control.db.selectRows(control.settings,1,1,1).done(function(settings) {
						context = me.preparaArrayAuth(context, settings);
						deferred.resolve(context);
					}).fail(function(msg) {
						ErrorClass.parseError('database','100088', { classe: 'authorization.class.js', metodo: 'loadPermissoes'},{mensagem_padrao: msg});
						deferred.reject(msg);
					});
				}).fail(function(msg) {
					ErrorClass.parseError('database','100084', { classe: 'authorization.class.js', metodo: 'loadPermissoes'},{mensagem_padrao: msg});
					deferred.reject(msg);
				});
			}
		}).fail(function(msg) {
			deferred.reject(msg);
		});

		return deferred.promise();
	}


	this.loadTableInfo = function(){
		this.tbName   = 'authorization';
		this.tbPK     = 'id';
		this.tbFields = {
			'id':          		'INTEGER AUTOINCREMENT',
			'codigo': 			'INTEGER',
			'codigo_tipo': 		'INTEGER',
			'tipo': 			'TEXT',
			'aprovacao': 		'INTEGER',
			'data_aprovacao': 	'TEXT'
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