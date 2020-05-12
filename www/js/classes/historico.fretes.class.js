var HistoricoFretesClass = function(){
	this.page = null;
	this.$$ = null;

	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};

	this.tipo_view = "todos";
	this.limite = 10;
	this.ultimo_registro = 0;
	this.loading = false;
	this.total_registros = 0;

	this.tipos = {
		"todos": getStatusText("TodosFretes"),
		"recusados": getStatusText("FretesRecusados"),
		"aguardando": getStatusText("AguardandoResposta"),
		"nao_selecionados": getStatusText("NaoSelecionados"),
		"em_atendimento": getStatusText("EmAtendimento"),
		"encerrados": getStatusText("FretesEncerrados"),
		"cancelados": getStatusText("FretesCancelados")
	};
	

	this.init = function(){
		var deferred = $.Deferred();
		this.setupView();

		deferred.resolve();

		return deferred.promise();
	}

	this.loadTipos = function() {
		this.tipos = {
			"todos": getStatusText("TodosFretes"),
			"recusados": getStatusText("FretesRecusados"),
			"aguardando": getStatusText("AguardandoResposta"),
			"nao_selecionados": getStatusText("NaoSelecionados"),
			"em_atendimento": getStatusText("EmAtendimento"),
			"encerrados": getStatusText("FretesEncerrados"),
			"cancelados": getStatusText("FretesCancelados")
		};
	}

	this.setupView = function(){
		var me = this;

		myApp.onPageInit('historico-fretes', function(page) {
			me.page = page;
			me.$$ = Dom7;
			me.loadTipos();


			me.$$('.backToMenu').on('click',function(e) {
				control.viagem.loadMenuClickCargo('back', true);
				e.preventDefault();
				e.stopPropagation();
			});
			
			me.$$('#btnFiltrar').on('click',function(e) {
				var template = Dom7('#tplpopover').html();
				var pop = myApp.popover(template, this, true);
	
				$('.filtrar-lista').removeClass('popover-link-selected');
				$('.filtrar-lista-'+me.tipo_view).addClass('popover-link-selected');

				$('.filtrar-lista').off('click').on('click',function() {
					var tipo = $(this).attr('data-value');
					me.tipo_view = tipo;
					me.getHistorico(me.$$, true);
					myApp.closeModal(pop,true);
				})
			});

			if(me.page.context.isPush != undefined && me.page.context.isPush != '') {

				me.page.context.isPush = '';
				me.startLists(me.tipo_view).done(function() {
					me.loadOferta(me.page.context.id_envio,true);
				});
				
			}else {
				me.startLists(me.tipo_view);
			}

		});

	}

	this.startLists = function(tipo_view) {
		var me = this;
		this.tipo_view = tipo_view;
		this.ultimo_registro = 0;
		this.loading = false;
		var deferred = $.Deferred();
		//myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));

		var d1 = getTotalHistorico(this.tipo_view);
		$.when(d1).done(function(total) {
			me.total_registros = total;
			me.getHistorico(me.$$, true).done(function () {
				deferred.resolve();
			});
			me.$$('.infinite-scroll').off('infinite').on('infinite', function () {
			  if (me.loading) return;
			 
			  me.loading = true;
			 
			  setTimeout(function () {

			    me.loading = false;
			 
			    if (me.ultimo_registro >= me.total_registros) {
			      myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
			      // Remove preloader
			      me.$$('.infinite-scroll-preloader').remove();
			      return;
			    }
			 
			    me.getHistorico(me.$$, false,false);
			  }, 1000);
			});          

			var ptrContent = me.$$('.pull-to-refresh-content');

			ptrContent.on('refresh', function () {
				me.$$('.infinite-scroll-preloader').remove();
				myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
				myApp.attachInfiniteScroll(me.$$('.infinite-scroll'));
				$('.pull-to-refresh-layer').css('margin-top','0px');
				$('.pull-to-refresh-layer').parent().css('transform','translate3d(0,0px,0)');
				me.getHistorico(me.$$,true,false).done(function() {
					$('.pull-to-refresh-layer').css('margin-top','-44px');
					myApp.pullToRefreshDone();
				}).fail(function() {
					$('.pull-to-refresh-layer').css('margin-top','-44px');
					myApp.pullToRefreshDone();
				})

			});

		});
		return deferred.promise();
	}

	this.loadOferta = function(id_oferta, avaliar) {
		var me = this;
		if (avaliar==null || avaliar==undefined) avaliar = false;
		getDadosOferta(id_oferta).done(function (dados_oferta) {
			dados_oferta.peso = (dados_oferta.peso!="" ? dados_oferta.peso+" Kg." : "N/A");

			var tipo_valor = 'oferta'
			if (dados_oferta.motorista_selecionado && dados_oferta.motorista_selecionado==1) {
				if (dados_oferta.valor_fechado) {
				 	dados_oferta.valor = dados_oferta.valor_fechado;
				 	tipo_valor = 'fechado';
				}
			}
			if (tipo_valor=='oferta' && dados_oferta.valor=='0,00') {
				dados_oferta.valor = getText('ACombinar');
			} else {
				dados_oferta.valor = getMoneyAbreviation()+' '+dados_oferta.valor;
			}

			if (tipo_valor!="oferta" || dados_oferta.valor_contra_oferta=="" || dados_oferta.valor_contra_oferta=="0,00") {
				dados_oferta.exibe_contra_oferta = false;
			} else {
				dados_oferta.valor_contra_oferta = getMoneyAbreviation()+" "+dados_oferta.valor_contra_oferta;
				dados_oferta.exibe_contra_oferta = true;
			}



			dados_oferta.endereco_origem = trataEndereco(dados_oferta.endereco_origem,dados_oferta.numero_origem,dados_oferta.bairro_origem);
			dados_oferta.endereco_destino = trataEndereco(dados_oferta.endereco_destino,dados_oferta.numero_destino,dados_oferta.bairro_destino);

			dados_oferta.height = ((dados_oferta.data_aceite!=null && dados_oferta.data_aceite!="") || (dados_oferta.data_recusa!=null && dados_oferta.data_recusa!="") ? "100%" : "calc(100% - 61px)");
			dados_oferta.avaliar = avaliar;

        	mainView.router.load( {url: 'detalhes-oferta.html', context: dados_oferta });
		});
	}


	this.loadData = function($$,ofertas, new_list) {
        //var pageContainer = $(this.page.container);
        var me = this;

        var cssAceito = '';

        if(ofertas.length == 0){
			if (new_list) {
				$$(".list-ofertas").append('<h4 id="title-ofertas" class="no-margin-bottom title-navy title-group">&nbsp;<img src="img/icon/truck-white.png" width="24"><span>'+me.tipos[me.tipo_view]+'</span></h4>'+
							'<div class="content-block text-center">'+
							    +getText('VoceNaoPossuiFretesHistorico')+
							'</div>');
			}
		}else {
			
			if (new_list) {
				$$(".list-ofertas").append('<div class="list-block media-list no-margin-top-important">'+
								    '<h4 id="title-ofertas" class="no-margin-bottom title-navy title-group">&nbsp;<img src="img/icon/truck-white.png" width="24"><span>'+me.tipos[me.tipo_view]+'</span></h4>'+
								    '<div id="list-ofertas"></div>'+
								  '</div>');
			}
			ofertas.forEach(function(item){
				//cssAceito = (item.data_aceite!=null && item.data_aceite!="") ? 'ofertaAceita' : '';
				var valor = item.valor;
				var tipo_valor = 'oferta';
				if (item.motorista_selecionado && item.motorista_selecionado==1) {
					if (item.valor_fechado!="") {
						valor = item.valor_fechado;
						tipo_valor = 'fechado';
					}
				}
				if (tipo_valor=='oferta' && valor=='0,00') {
					valor = getText('ACombinar');
				} else {
					valor = getMoneyAbreviation()+" "+valor;
				}
				
				cssAceito = '';
				$$("#list-ofertas").append('\n' +
					'<a href="#" id="oferta_' + item.codigo_oferta + '" data-id="'+item.codigo_oferta+'" class="item-oferta '+cssAceito+'">\n' +
			        	'<div class="card">\n' +
			        		'<div class="card-header">' +strLimit(ucwords(item.ofertante),100)+'</div>\n' +
			        		'<div class="card-content">\n' +
				          		'<div class="card-content-inner">'+getText('De')+': ' 		+ item.cidade_origem + ' - ' + item.uf_origem + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Para')+': ' 	+ item.cidade_destino + ' - ' + item.uf_destino + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Valor')+': ' 	+ valor + '</div>\n' +
				          		(tipo_valor=='oferta' && (item.valor_contra_oferta!="" && item.valor_contra_oferta!="0,00") ? '<div class="card-content-inner">'+getText('ContraOferta')+': '+getMoneyAbreviation()+ item.valor_contra_oferta + '</div>\n' : '') +
				          		'<div class="card-content-inner">'+getText('Retirada')+': ' + item.data_previsao_inicio + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Entrega')+': '  + item.data_previsao_entrega + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('KMTotal')+': ' + item.km_total + '</div>\n' +
				          		'<div class="card-content-inner"><i>'+getText('LancadoA')+' '+item.tempo_cadastro+'</i></div>\n' +
			          		'</div>\n' +
				        	'<div class="card-footer">'+(item.status_listagem!=""?item.status_listagem:getStatusText('NaoIdentificado'))+'</div>'+
			        	'</div>\n' +
			        '</a>\n' +
		      	'');
			});		
			
			$$(".list-ofertas").find('.infinite-scroll-preloader').remove();
			
			$$(".list-ofertas").append('<div class="infinite-scroll-preloader">'+
			    '<div class="preloader"></div>'+
			  '</div>'
			);
	        $$('.item-oferta').off('click').on('click', function () {
	        	var id = $(this).attr('data-id');
	        	me.loadOferta(id);
	        });
        	
	        //Se possuir uma única oferta, exibe o detalhe
			// if(ofertas.length == 1){
			// 	me.loadOferta(ofertas[0].codigo_oferta);
			// }
			
		}
		if (ofertas.length < me.limite) {
	    	myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
	    	me.$$('.infinite-scroll-preloader').remove();
		}
		
	}


	this.getHistorico = function($$, clear, show_indicator){
		var me = this;
		if (show_indicator==null || show_indicator==undefined) show_indicator = true;
		if (clear) {
			$$(".list-ofertas").html("");
			if (show_indicator) myApp.showIndicator();
			me.ultimo_registro = 0;
		}

		var deferred = $.Deferred();
		getHistorico(me.tipo_view, me.limite, me.ultimo_registro).done(function(res){
			me.ultimo_registro += res.length;
			me.loadData($$,res, clear);
			if (clear && show_indicator) myApp.hideIndicator();
			deferred.resolve();
		}).fail(function(erro){
			if (clear && show_indicator) myApp.hideIndicator();
			myApp.alert(erro, getAlertMessage('Atencao'));                        			
			deferred.reject(erro);
		});

		return deferred.promise();
	}

}