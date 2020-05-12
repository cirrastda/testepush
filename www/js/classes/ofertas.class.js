var OfertasClass = function(){
	this.page = null;
	this.$$ = null;

	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};

	this.tipo_view = "novos";
	this.tipos = {
		"todos": getStatusText("TodosFretes"),
		"novos": getStatusText("NovasOfertas"),
		"aguardando": getStatusText("AguardandoResposta")
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
			"novos": getStatusText("NovasOfertas"),
			"aguardando": getStatusText("AguardandoResposta")
		};
		
	}

	this.setupView = function(){
		var me = this;

		myApp.onPageInit('ofertas', function(page) {
			console.log('route ofertas');
			me.page = page;
			console.log(me.page);
			me.loadTipos();
			me.$$ = Dom7;

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
					me.loadOfertas();
					//me.getHistorico(me.$$, true);
					myApp.closeModal(pop,true);
				})
			});

			if(me.page.context.isPush != undefined && me.page.context.isPush != '') {
				me.loadOfertas().done(function() {
					me.page.context.isPush = '';
				});
			}else {
				me.loadOfertas();
			}

			me.preparePullRequest();

			me.$$('#btnInfo').on('click',function(e) {
				var view = $("#legenda").css("display");
				if (view=="none") {
					$("#legenda").slideDown();
					$(this).children().attr("src","img/icon/ico-seta-up.png");
				} else {
					$("#legenda").slideUp();
					$(this).children().attr("src","img/icon/ico-seta-down.png");
				}
			});

		});
	}

	this.preparePullRequest = function() {
		var me = this;
		// Pull to refresh content
		var ptrContent = me.$$('.pull-to-refresh-content');
		// Add 'refresh' listener on it

		ptrContent.on('refresh', function () {
			//me.$$('.infinite-scroll-preloader').remove();
			//myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
			//myApp.attachInfiniteScroll(me.$$('.infinite-scroll'));
			$('.pull-to-refresh-layer').css('margin-top','10px');
			//$('.pull-to-refresh-layer').parent().css('transform','translate3d(0,0px,0)');
			me.getOfertas(me.$$, false).done(function() {
				$('.pull-to-refresh-layer').css('margin-top','-45px');
				myApp.pullToRefreshDone();
        	 	// me.$$('#lista_empresas').append('<div class="infinite-scroll-preloader">'+
											//     	'<div class="preloader"></div>'+
											//     '</div>');
			}).fail(function() {
				$('.pull-to-refresh-layer').css('margin-top','-45px');
				myApp.pullToRefreshDone();
			})

		});
	}

	this.loadOfertas = function(clear, show_indicator) {
		var me = this;
		var deferred = $.Deferred();
		// if (clear) {
		// 	$$(".list-ofertas").html("");
		// 	if (show_indicator) myApp.showIndicator();
		// }
		if(me.page.context.isPush == undefined || me.page.context.isPush == '') {//Se não for através de push, carrega normal
			me.getOfertas(me.$$).done(function(res) {
				deferred.resolve(res);
			});
		}else{
			me.getOfertas(me.$$).done(function(){//Se carregado através de push, carrega a lista e em seguida exibe o detalhe
				me.loadOferta(me.page.context.id_oferta).done(function() {
					deferred.resolve();
				});
			});
		}
		return deferred.promise();
	}

	this.trataEndereco = function(endereco, numero, bairro) {
		if (numero!=null && numero!='') endereco += ","+numero;
		if (bairro!=null && bairro!='') endereco += " - "+bairro;
		return endereco;
	}

	this.loadOferta = function(id_oferta) {
		var me = this;
		var deferred = $.Deferred();

		getDadosOferta(id_oferta).done(function (dados_oferta) {
			dados_oferta.peso = (dados_oferta.peso!="" ? dados_oferta.peso+" Kg." : "N/A");

			dados_oferta.endereco_origem = me.trataEndereco(dados_oferta.endereco_origem,dados_oferta.numero_origem,dados_oferta.bairro_origem);
			dados_oferta.endereco_destino = me.trataEndereco(dados_oferta.endereco_destino,dados_oferta.numero_destino,dados_oferta.bairro_destino);

			dados_oferta.height = (dados_oferta.data_aceite!=null && dados_oferta.data_aceite!="" ? "100%" : "calc(100% - 50px)");
			if (dados_oferta.valor=="0,00") {
				dados_oferta.valor = getText('ACombinar');
			} else {
				dados_oferta.valor = getMoneyAbreviation()+" "+dados_oferta.valor;
			}

			if (dados_oferta.valor_contra_oferta=="" || dados_oferta.valor_contra_oferta=="0,00") {
				dados_oferta.exibe_contra_oferta = false;
			} else {
				dados_oferta.valor_contra_oferta = getMoneyAbreviation()+" "+dados_oferta.valor_contra_oferta;
				dados_oferta.exibe_contra_oferta = true;
			}

        	mainView.router.load( {url: 'detalhes-oferta.html', context: dados_oferta });
        	deferred.resolve();
		});
		return deferred.promise();
	}

	this.loadData = function($$,ofertas) {
        //var pageContainer = $(this.page.container);
        var me = this;

        var cssAceito = '';
        var status = getStatusOferta();
        console.log(me.tipo_view);
        if(ofertas.length == 0){
			$$("#tabOferta").html('<h4 id="title-ofertas" class="no-margin-bottom title-navy title-group">&nbsp;<img src="img/icon/truck-white.png" width="24"><span>'+me.tipos[me.tipo_view]+'</span></h4>'+
						'<div class="content-block text-center">'+
						    getText('NaoHaOfertas')+
						'</div>');
		}else {

			$$("#tabOferta").html('<div class="list-block media-list no-margin-top-important">'+
									'<h4 id="title-ofertas" class="no-margin-bottom title-navy title-group">&nbsp;<img src="img/icon/truck-white.png" width="24"><span>'+me.tipos[me.tipo_view]+'</span></h4>'+
								    '<div id="list-ofertas"></div>'+
								  '</div>');

			ofertas.forEach(function(item){
				// classItem = (item.status_oferta=='A' ? 'card-header-accept' : (item.status_oferta == 'CO' ? 'card-header-counter' : ''));
				//cssAceito = (item.data_aceite!=null && item.data_aceite!="") ? 'ofertaAceita' : '';
				$$("#list-ofertas").append('\n' +
					'<a href="#" id="oferta_' + item.codigo_oferta + '" data-id="'+item.codigo_oferta+'" class="item-oferta '+cssAceito+'">\n' +
			        	'<div class="card">\n' +
			        		'<div class="card-header">' +strLimit(ucwords(item.ofertante),100)+'</div>\n' +
			        		'<div class="card-content">\n' +
				          		'<div class="card-content-inner">'+getText('De')+': ' + item.cidade_origem + ' - ' + item.uf_origem + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Para')+': ' + item.cidade_destino + ' - ' + item.uf_destino + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Valor')+': ' + (item.valor!="0,00"?getMoneyAbreviation()+" "+item.valor:getText('ACombinar')) + '</div>\n' +
				          		(item.valor_contra_oferta!="" && item.valor_contra_oferta!="0,00" ? '<div class="card-content-inner">'+getText('ContraOferta')+': ' + getMoneyAbreviation()+" "+item.valor_contra_oferta + '</div>\n' : '')+
				          		'<div class="card-content-inner">'+getText('Retirada')+': ' + item.data_previsao_inicio + '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Entrega')+': ' + item.data_previsao_entrega + '</div>\n' +
						      	'<div class="card-content-inner">'+getText('KMTotal')+': '+(item.km_total!="0,00"?item.km_total+" Km":getStatusText('NaoIdentificado'))+'</div>' +
						      	'<div class="card-content-inner"><i>'+getText('LancadoA')+': ' + item.tempo_cadastro + '</i></div>' +
				        	'</div>'+
				        	'<div class="card-footer">'+(item.status_oferta!=""?status[item.status_oferta]:getStatusText('NaoIdentificado'))+'</div>'+
			        	'</div>\n' +
			        '</a>\n' +
		      	'');
			});

	        $$('.item-oferta').off('click').on('click', function () {
	        	var id = $(this).attr('data-id');
	        	me.loadOferta(id);
	        });
	        //Se possuir uma única oferta, exibe o detalhe
			// if(ofertas.length == 1){
			// 	me.loadOferta(ofertas[0].codigo_oferta);
			// }
		}
	}

	this.getOfertas = function($$, exibe_indicator){
		var me = this;
		var deferred = $.Deferred();

		control.settings.getDataByDocumento().done(function(dados){
				if(dados.placa != 'undefined') {
					var placa = dados.placa;
				}else{
					var placa ='';
				}

				if (exibe_indicator==null || exibe_indicator==undefined) exibe_indicator = true;

				if (exibe_indicator) {
					$$("#tabOferta").html("");
					myApp.showIndicator();
				}

				getOfertas(me.tipo_view,placa).done(function(res){
					me.loadData($$,res);
					if (exibe_indicator) {
						$('#legenda').slideDown();
						$('#btnInfo').show();
						myApp.hideIndicator();
					}
					deferred.resolve();
				}).fail(function(erro){
					if (exibe_indicator) myApp.hideIndicator();
					myApp.alert(erro, getAlertMessage('Atencao') );
					deferred.reject(erro);
				});

			});
		return deferred.promise();
	}
}