var RequisicoesClass = function(){
	
	this.data = null;
	this.$$ = null;
	this.arrEstados = null;
	this.loading = false;
 
	// Last loaded index
	this.page = 1;
 
	// Append items per load
	this.itemsPerLoad = 10;
	this.tipo_veiculo = 0;
	this.init = function() {
		var me = this;

		this.setupView();
	}
	this.empresas = null;

	this.setupView = function() {
		var me = this;
		
		myApp.onPageInit('requisicoes', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);
         	
			me.data = [];

	        if(page.context!=undefined && page.context.filtros != undefined){
				if (page.context.filtros.estado!=null) {
					me.arrEstados = page.context.filtros.estado;
				}
				me.data.filtros = page.context.filtros;
			} 
			

			control.settings.getDataByDocumento().done(function(item){
	            if(item && item.tipo_veiculo){
	            	me.tipo_veiculo = item.tipo_veiculo;
	               	me.carregaLista(item.tipo_veiculo);
	               	me.preparePullRequest();
	            } else {
	            	myApp.alert(getAlertMessage('MsgTipoVeiculo'),getAlertMessage('AtualizeDados'), function(){
	            		mainView.router.loadPage('meus-dados.html');
	            	});
	            }
	        }).fail(function(erro){
	        	console.log(erro);
			});


			me.$$('#btnFiltro').on('click', function() {
				var myContext = null;
				if(me.data.filtros != undefined){
					myContext = me.data.filtros;
				}
				myApp.showPreloader(getLoadingMessage('CarregandoFiltros'));

				if(me.arrEstados == null || me.arrCategorias==null) {

					var d1 = getEstados().done(function(estados, categorias) {
						me.arrEstados = estados;
						myApp.hidePreloader();
						mainView.router.loadPage({url: 'pesquisa-requisicoes.html', context: {arrEstados: me.arrEstados, filtros: myContext}});
					});
	
				}else {
					console.log(myContext);
					myApp.hidePreloader();
					mainView.router.loadPage({url: 'pesquisa-requisicoes.html', context: {arrEstados: me.arrEstados, filtros: myContext}});
				}

			});

		});
	}	

	this.preparePullRequest = function() {
		var me = this;
		// Pull to refresh content
		var ptrContent = me.$$('.pull-to-refresh-content');
		 
		ptrContent.on('refresh', function () {
			me.$$('.infinite-scroll-preloader').remove();
			myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
			myApp.attachInfiniteScroll(me.$$('.infinite-scroll'));
			$('.pull-to-refresh-layer').css('margin-top','0px');
			$('.pull-to-refresh-layer').parent().css('transform','translate3d(0,0px,0)');
			me.carregaLista(me.tipo_veiculo,false).done(function() {
				$('.pull-to-refresh-layer').css('margin-top','-44px');
				myApp.pullToRefreshDone();

			}).fail(function() {
				$('.pull-to-refresh-layer').css('margin-top','-44px');
				myApp.pullToRefreshDone();
			})

		});

		//myApp.initPullToRefresh(ptrContent);
	}

	this.carregaLista = function(tipo_veiculo, exibe_indicator) {
		var deferred = $.Deferred();
		if (exibe_indicator==null || exibe_indicator==undefined) exibe_indicator = true;
		var me = this;

		var html = '<div class="list-block media-list no-margin">'+
			    	'';

		me.page = 1;
		if (exibe_indicator) myApp.showIndicator();
		
		$('#total_empresas').slideUp();

		me.empresas = [];

		var filtros = {estado: '', cidade: ''};
		if(me.data.filtros != undefined) {
			filtros = me.data.filtros;
		}

		var d1 = me.loadItems(tipo_veiculo,true);
		var d2 = getTotalEmpresasReqAgregados(tipo_veiculo, filtros);

		$.when(d1,d2).then(function(items, total) {
			if (exibe_indicator) myApp.hideIndicator();

			n_html = items[0];
			max = items[1];
			if(total.qtde == '') {
				total.qtde = '0';
			}
			
			$('#total_empresas').slideDown();
			$('.qtd_empresas').html(total.qtde);
			if(total.qtde == 0) {
				if(filtros.estado != '' || filtros.cidade != '') {
					me.$$("#lista_empresas").html('<h3>'+getText('NenhumaEmpresaEncontradaFiltros')+'</h3>');	
				}
			}

			//n_html, max
			html += n_html;
    	  	html += '	'+
				  '</div>';			

			if(max >= me.itemsPerLoad) {
				html +=  '<div class="infinite-scroll-preloader">'+
						    '<div class="preloader"></div>'+
						  '</div>';

			  	me.$$('.infinite-scroll').on('infinite', function () {
					console.log("Entrou");
					// Exit, if loading in progress
					if (me.loading) return;

					// Set loading flag
					me.loading = true;

					// Emulate 1s loading
					setTimeout(function () {
						me.loading = false;
  						me.loadItems(tipo_veiculo,false);
					}, 1000);
				});

			} else {
				myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
			}

			me.$$("#lista_empresas").html(html);

			me.$$('.item-empresa').on('click',function(){
				me.abreDetalhe($(this));
			});
			deferred.resolve();
		}).fail(function() {
			deferred.reject();
		});

		return deferred.promise();	
	}

	this.abreDetalhe = function(item) {
		var me = this;
		var myContext = me.empresas[item.attr('data-id')];
		myApp.showIndicator();
		getDetalhesEmpresa(item.attr('data-id')).done(function(res) {
			myApp.hideIndicator();
			myContext.contato = res;
			mainView.router.loadPage({ url: 'detalhes-requisicao.html', context: myContext});	
		}).fail(function(erro){
			myApp.alert(erro,'Erro');
			myApp.hideIndicator();
		});
	}

	this.loadItems = function(tipo_veiculo, show_empty) {
		var me = this;
		var deferred = $.Deferred();
		if (typeof show_empty == 'undefined') show_empty = false;

		var tot = 0;
		var html = '';
		var filtros = {estado: '', cidade: ''};
		if(me.data.filtros != undefined) {
			filtros = me.data.filtros;
		}
		getEmpresasReqAgregados(tipo_veiculo, filtros, me.page, me.itemsPerLoad).done(function(res){

			var tot = res.length;
			if (tot < me.itemsPerLoad) {
		      myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
		      me.$$('.infinite-scroll-preloader').remove();
			}

			if (show_empty) {
				if(tot == 0){
					me.$$("#lista_empresas").html('<h3 class="text-center">'+getText('NenhumaEmpresaBuscandoAgregados')+'.</h3>');
					deferred.resolve(html, 0);
					return;
				}
			}
			
			var max = (tot > me.itemsPerLoad) ? me.itemsPerLoad : tot;
		
			for(var i = 0; i < max; i++) {

				me.empresas[res[i].codigo] = res[i];

		      	html += ''+
		      				'<a href="#" data-id="'+res[i].codigo+'" class="item-empresa">' +
						        '<div class="card">'+
						        	// '<div class="item-title-row">' +	
						        		'<div class="card-header"><b>'+res[i].razao_social+'</b></div>'+
						        	// '</div>'+
						        	'<div class="card-content">' +	
					        		'<div class="card-content-inner text_12"><b>Tipo veículo:</b> '+(res[i].tipo_veiculo!=''?res[i].tipo_veiculo:'N/A')+'</div>'+
					        		'<div class="card-content-inner text_12">Tipo carroceria: '+(res[i].tipo_carroceria!=''?res[i].tipo_carroceria:'N/A')+'</div>'+
					        		'<div class="card-content-inner text_12">'+(res[i].cidade!=null?res[i].cidade + '/':'') +(res[i].estado!=null?res[i].estado:'')+'</div>'+
					        		'<div class="card-content-inner text_12"><i>'+res[i].data_cadastro+'</i></div>'+
						        	'</div>'+
						        	'<div class="card-footer"> + '+getText('VerDetalhes')+'</div>'+
						        '</div>'+
						     '</a>'+
				      	'';
		    }

			// Append new items
			me.$$('#lista_empresas .list-block ul').append(html);

			me.page++;
			deferred.resolve(html, max);
		}).fail(function(erro) {
			myApp.hideIndicator();
			console.log(erro);
			//myApp.alert(erro);
		});
		return deferred.promise();	
	}

}
