var DetalhesOfertaClass = function(){
	this.page = null;
	this.data = null;
	this.$$ = null;
	this.init = function(){
		var deferred = $.Deferred();

		this.setupView();

		deferred.resolve();

		return deferred.promise();
	}

	this.renderTelefoneEmail = function() {
		var me = this;
		console.log(me.data);
		if (!me.data.telefone || me.data.telefone=="") {
			$('.btnLigar').hide();
		} else {
			var telefone = so_numeros(me.data.telefone);
			$('.btnLigar').attr('href','tel:+55'+telefone);
		}

		if (!me.data.email || me.data.email=="") {
			$('.btnEmail').hide();
		} else {
			$('.btnEmail').attr('href','mailto:'+me.data.email);
		}

	}

	this.renderButtons = function(isFrete) {
		var me = this;
		var deferred = $.Deferred();
		var view = $(mainView.activePage.container);

		if (this.data.data_aceite==null || this.data.data_aceite=="") {
			if (this.data.data_recusa==null || this.data.data_recusa=="") {
				$('.tab_links_aceitar').show();
			} else {
				$('.tab_links_aceitar').hide();
			}
		} else {
			$('.tab_links_aceitar').hide();
		}

		if(isFrete) {// Se é frete, é para se candidatar

			$('.tab_links_aceitar').hide();
			$('.tab_link_candidatar').show();

			var frete = {codigo_frete : me.data.codigo_frete};

			//ACEITAR OFERTA
			me.$$('#btnCandidatar').on('click',function() {
				myApp.modal({
					title: getAlertMessage('Candidatar'),
					text: getAlertMessage('DesejaCandidatar'),
					buttons: [
					  {
					    text: getAlertMessage("NaoM"),
					    close: true
					  },
					  {
					    text: getAlertMessage("SimM"),
					    close: true,
					    onClick: function () {
							candidatarFrete(frete).done(function(res){
								deferred.resolve();
								myApp.alert(getAlertMessage('CandidaturaRealizadaComSucesso'), getAlertMessage('Sucesso'), function () {
							        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
							        
							        var myContext = null;
							        if(me.data.filtros != undefined) {
							        	myContext = {filtro: true, filtros: me.data.filtros, fretes: undefined};//Fretes undefined, para forçar uma nova pesquisa na tela de próximos fretes
							        }

									mainView.router.back({url: 'fretes-proximos.html', context: myContext, force : true, ignoreCache: true});
							    });
							}).fail(function(erro){
								myApp.alert(erro, getAlertMessage('Atencao'));                        			
								deferred.reject(erro);
							});
					    }
					  }
					]
				});


				// myApp.confirm('Tem certeza que deseja se candidatar a esse frete?', 'Candidatar', 
			 //      	function () {
				// 		candidatarFrete(frete).done(function(res){
				// 			deferred.resolve();
				// 			myApp.alert('Candidatura realizada com sucesso, aguarde a aprovação', 'Sucesso!', function () {
				// 		        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
						        
				// 		        var myContext = null;
				// 		        if(me.data.filtros != undefined) {
				// 		        	myContext = {filtro: true, filtros: me.data.filtros, fretes: undefined};//Fretes undefined, para forçar uma nova pesquisa na tela de próximos fretes
				// 		        }

				// 				mainView.router.back({url: 'fretes-proximos.html', context: myContext, force : true, ignoreCache: true});
				// 		    });

				// 		}).fail(function(erro){
				// 			myApp.alert(erro, 'Atenção');                        			
				// 			deferred.reject(erro);
				// 		});
				// 	}
				// );

				deferred.promise();
			});

			//CONTRA OFERTA
			me.$$('#btnContraOfertaCand').on('click',function() {
				
				myApp.prompt(getAlertMessage('InformeValorContraOferta'), getAlertMessage('ContraOferta'), 
			      function (value) {
			      	
			      	if(me.validaValor(value)){
			      		frete.valor_contra_oferta = value;

				        candidatarFrete(frete).done(function(res){
							deferred.resolve();
							myApp.alert(getAlertMessage('ContraOfertaEnviada'), getAlertMessage('ContraOferta'), function () {
						        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
						        var myContext = null;
						        if(me.data.filtros != undefined) {
						        	myContext = {filtro: true, filtros: me.data.filtros, fretes: undefined};//Fretes undefined, para forçar uma nova pesquisa na tela de próximos fretes
						        }

								mainView.router.back({url: 'fretes-proximos.html', context: myContext, force : true, ignoreCache: true});
						    });
						}).fail(function(erro){
							myApp.alert(erro, getAlertMessage('Atencao'));                        			
							deferred.reject(erro);
						});
			      	}else{
			      		myApp.alert(getAlertMessage("ValorInformadoInvalido"), getAlertMessage('Atencao'));  
			      	}
			      	
			      },
			      function (value) {}
			    );

				//$('.modal-text-input').mask("#.##0,00", {reverse: true});
				$('.modal-text-input').attr('type','tel');
				$('.modal-text-input').val('0,00');
				$('.modal-text-input').off('keyup').on('keyup',function(event) {
					var obj = $(this);
					obj = obj[0];
					campo_moeda(obj);
				});
				
			});

			if (me.data.valor=="0,00" || me.data.valor=="A COMBINAR") {
				if (me.data.permite_aceitar_primeira!=1) {
					$('#btnCandidatar').hide();
					$('#btnContraOfertaCand').removeClass('border-right-tab');
				}
			}

			me.renderTelefoneEmail();

		}else {
			$('.tab_link_candidatar').hide();

			var oferta = {id : me.data.codigo_oferta};



			//REJEITAR OFERTA
			me.$$('#btnRejeitar').on('click',function() {
				
				myApp.modal({
					title: getAlertMessage('Recusar'),
					text: getAlertMessage('DesejaRecusar'),
					buttons: [
					  {
					    text: getAlertMessage("NaoM"),
					    close: true
					  },
					  {
					    text: getAlertMessage("SimM"),
					    close: true,
					    onClick: function () {
					       	rejeitarOferta(oferta).done(function(res){
								deferred.resolve();
								myApp.alert(getAlertMessage('OfertaRejeitada'), getAlertMessage('Rejeicao'), function () {
							        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
									mainView.router.back({url: 'ofertas.html',force : true, ignoreCache: true});
							    });
							}).fail(function(erro){
								myApp.alert(erro, getAlertMessage('Atencao'));
								deferred.reject(erro);
							});

					    }
					  }
					]
				});
				// myApp.confirm('Tem certeza que deseja recusar esta oferta?', 'Recusar', 
			 //      	function () {

				//        	rejeitarOferta(oferta).done(function(res){
				// 			deferred.resolve();
				// 			myApp.alert('Oferta rejeitada', 'Rejeição!', function () {
				// 		        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
				// 				mainView.router.back({url: 'ofertas.html',force : true, ignoreCache: true});
				// 		    });
				// 		}).fail(function(erro){
				// 			myApp.alert(erro, 'Atenção');                        			
				// 			deferred.reject(erro);
				// 		});
						
			 //      	},
			 //      	function () {}
			 //    );

				deferred.promise();

			});
			
			//CONTRA OFERTA
			me.$$('#btnContraOferta').on('click',function() {
				
				myApp.prompt(getAlertMessage('InformeValorContraOferta'), getAlertMessage('ContraOferta'), 
			      function (value) {
			      	
			      	if(me.validaValor(value)){
			      		oferta.valor = value;

				        contraOferta(oferta).done(function(res){
							deferred.resolve();
							myApp.alert(getAlertMessage('ContraOfertaEnviada'), getAlertMessage('ContraOferta'), function () {
						        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
								mainView.router.back({url: 'ofertas.html',force : true, ignoreCache: true});
						    });
						}).fail(function(erro){
							myApp.alert(erro, 'Atencao');                        			
							deferred.reject(erro);
						});
			      	}else{
			      		myApp.alert(getAlertMessage('ValorInformadoInvalido'), getAlertMessage('Atencao'));  
			      	}
			      	
			      },
			      function (value) {}
			    );

				//$('.modal-text-input').mask("#0,00", {reverse: true});
				$('.modal-text-input').attr('type','tel');
				$('.modal-text-input').val('0,00');
				$('.modal-text-input').off('keyup').on('keyup',function(event) {
					var obj = $(this);
					obj = obj[0];
					campo_moeda(obj);
				});
				
			});
			
			//ACEITAR OFERTA
			me.$$('#btnAceitar').on('click',function() {
				myApp.modal({
					title: getAlertMessage('Aceitar'),
					text: getAlertMessage('DesejaAceitarOferta'),
					buttons: [
					  {
					    text: getAlertMessage("NaoM"),
					    close: true
					  },
					  {
					    text: getAlertMessage("SimM"),
					    close: true,
					    onClick: function () {
							aceitarOferta(oferta).done(function(res){
								deferred.resolve();
								myApp.alert(getAlertMessage('OfertaAceita'), getAlertMessage('Sucesso'), function () {
							        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
									mainView.router.back({url: 'ofertas.html',force : true, ignoreCache: true});
							    });

							}).fail(function(erro){
								myApp.alert(erro, getAlertMessage('Atencao') );                        			
								deferred.reject(erro);
							});
					    }
					  }
					]
				});

				// myApp.confirm('Deseja aceitar esta oferta?', 'Aceitar', 
			 //      	function () {
				// 		aceitarOferta(oferta).done(function(res){
				// 			deferred.resolve();
				// 			myApp.alert('Oferta aceita com sucesso, aguarde a aprovação', 'Sucesso!', function () {
				// 		        //Volta par aa tela meu-fretes de forma que a lista de ofertas seja atualizada
				// 				mainView.router.back({url: 'ofertas.html',force : true, ignoreCache: true});
				// 		    });

				// 		}).fail(function(erro){
				// 			myApp.alert(erro, 'Atenção');                        			
				// 			deferred.reject(erro);
				// 		});
				// 	}
				// );

				deferred.promise();
			});
			

			console.log(me.data);
			if (me.data.valor=="0,00" || me.data.valor=="A COMBINAR") {
				if (me.data.permite_aceitar_primeira!=1) {
					$('#btnAceitar').hide();
					$('#btnContraOferta').removeClass('border-right-tab');
				} else {
					$('#btnContraOferta').hide();
				}
			}

			me.renderTelefoneEmail();

		}
		if (this.data.status==6 && this.data.score_embarcador=="") {
			$('.tab_link_avaliar').show();
			me.$$('#btnAvaliar').off('click').on('click',function() {
				me.acaoAvaliar();
			});
		} else {
			//console.log('hide');
			$('.tab_link_avaliar').hide();
		}
		
		if (this.data.avaliar) {
			me.$$('#btnAvaliar').trigger('click');
		}
	}
	this.acaoAvaliar = function() {
	  var me = this;
	  var frete = {
	  	id: me.data.codigo_frete,
	  	score: null,
	  	encerrado: 'S'
	  };
  	  var deferred = $.Deferred();
      control.avaliarFrete.loadModal(frete, true).done(function(frete) {
          me.avaliarFrete(frete,getAlertMessage('FreteAvaliado')).done(function() {
            myApp.closeModal();
            deferred.resolve();
          }).fail(function(msg) {
            deferred.reject(msg);
          });
      }).fail(function(msg) {
          me.acaoAvaliar();
          deferred.reject(msg);
      });		
      return deferred.promise();
	}

    this.avaliarFrete = function(frete, msg_success) {
		var deferred = $.Deferred();
		var me = this;
		avaliarFrete(frete).done(function(res){
			myApp.alert(msg_success, getAlertMessage('Sucesso'), function () {
				getDadosOferta(me.data.codigo_oferta).done(function(dados_oferta) {
					dados_oferta.peso = (dados_oferta.peso!="" ? dados_oferta.peso+" Kg." : "N/A");

					dados_oferta.endereco_origem = trataEndereco(dados_oferta.endereco_origem,dados_oferta.numero_origem,dados_oferta.bairro_origem);
					dados_oferta.endereco_destino = trataEndereco(dados_oferta.endereco_destino,dados_oferta.numero_destino,dados_oferta.bairro_destino);

					dados_oferta.height = (dados_oferta.data_aceite!=null && dados_oferta.data_aceite!="" ? "100%" : "calc(100% - 50px)");
					me.data = dados_oferta;

					var isFrete = (me.data.isFrete != undefined)? me.data.isFrete : false;
					me.renderButtons(isFrete);

					//me.setupView();
				})
		     	//mainView.router.back({url:'historico-fretes.html', ignoreCache: true, force: true }); 
			});
			deferred.resolve();
		}).fail(function(erro){
			myApp.alert(erro, getAlertMessage('Atencao'));
			deferred.reject(erro);
		});

		return deferred.promise();
	}	

	this.setupView = function(){
		var me = this;
		myApp.onPageInit('detalhes-oferta', function(page, context) {
			console.log(page.context);
            var pageContainer = $(page.container);
            var fm = pageContainer.find('form');
			me.$$ = Dom7;
			me.data = page.context;

			var isFrete = (page.context.isFrete != undefined)? page.context.isFrete : false;
			me.renderButtons(isFrete);

			// $$('#tabAndamento').on('show', function () {

			// });

			// $$('#tabOferta').on('show', function () {
			// 	me.getOfertas($$);
			// });
		});

	}


	this.validaValor = function(valor){

		if(valor == '' || valor <= 0){
			return false;
		}

		valor = valor.replace(".","");//Retira "." que nesse contexto representa separação de milhar
		valor = parseFloat(valor.replace(",","."));//Substitui "," por "." para representar o decimal e transforma em float
		console.log(valor);
		if(!isNaN(valor)){//Se não for não-númerico
			return true;	
		}
		return false;

	}


}