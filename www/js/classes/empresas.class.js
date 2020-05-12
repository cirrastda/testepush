var EmpresasClass = function(){
	
	this.data = null;
	this.$$ = null;
	this.arrEstados = null;
	this.arrCategorias = null;
	
	this.loading = false;
 
	// Last loaded index
	this.offset = 0;
 
	// Append items per load
	this.itemsPerLoad = 20;

	this.raio = 500;//500 KM

	this.init = function() {
		var me = this;

		this.setupView();
		
	}

	this.setupView = function() {
		var me = this;
		
		myApp.onPageInit('empresas', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);
         	
			me.raio = 500;
			console.log(page);
			if(page.context!=undefined && page.context.filtros != undefined){
				me.data = []
				if(page.context.filtros.raio > 0) {
					me.raio = page.context.filtros.raio;
				}
				if (page.context.filtros.estado!=null) {
					me.estado = page.context.filtros.estado;
				}
				console.log(me.data);
				me.data.filtros = page.context.filtros;
			} else if (page.context.dados_checkin != undefined) {
				with (page.context) {
					if (me.data==undefined || me.data.filtros==undefined) {
		 				me.data = {
		 					filtros: {
								raio: 500,
								cidade: dados_checkin.codigo_cidade,
								estado: dados_checkin.codigo_estado
							}
						};
					} else {
						me.data.filtros.cidade = dados_checkin.codigo_cidade;
						me.data.filtros.estado = dados_checkin.codigo_estado;
					}
				}
			} else {
				me.data = [];
				me.data.filtros = [];
			}

			me.$$('#btnFiltro').on('click', function () {
				var myContext = null;
				if(me.data.filtros != undefined){
					myContext = me.data.filtros;
				}
				myApp.showPreloader(getLoadingMessage('CarregandoFiltros'));

				if(me.arrEstados == null || me.arrCategorias==null) {

					var d1 = getEstados();
					var d2 = getCategorias();

					$.when(d1, d2).then(function(estados, categorias) {
						me.arrEstados = estados;
						me.arrCategorias = categorias;
						myApp.hidePreloader();
						mainView.router.loadPage({url: 'pesquisa-empresas.html', context: {arrEstados: me.arrEstados, arrCategorias: me.arrCategorias, filtros: myContext}});
					});
	
				}else {
					console.log(myContext);
					myApp.hidePreloader();
					mainView.router.loadPage({url: 'pesquisa-empresas.html', context: {arrEstados: me.arrEstados, arrCategorias: me.arrCategorias, filtros: myContext}});
				}
				
			});

			me.carregaLista();
			me.preparePullRequest();
		});
	}	

	this.preparePullRequest = function() {
		var me = this;
		// Pull to refresh content
		var ptrContent = me.$$('.pull-to-refresh-content');
		// Add 'refresh' listener on it

		ptrContent.on('refresh', function () {
			me.$$('.infinite-scroll-preloader').remove();
			myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
			myApp.attachInfiniteScroll(me.$$('.infinite-scroll'));
			$('.pull-to-refresh-layer').css('margin-top','0px');
			$('.pull-to-refresh-layer').parent().css('transform','translate3d(0,0px,0)');
			me.carregaLista(false).done(function() {
				$('.pull-to-refresh-layer').css('margin-top','-44px');
				myApp.pullToRefreshDone();
        	 	// me.$$('#lista_empresas').append('<div class="infinite-scroll-preloader">'+
											//     	'<div class="preloader"></div>'+
											//     '</div>');
			}).fail(function() {
				$('.pull-to-refresh-layer').css('margin-top','-44px');
				myApp.pullToRefreshDone();
			})

		});

	}

	this.abreDetalhe = function(item) {
		var me = this;
		var codigo = item.attr('data-id');
		myApp.showIndicator();
		getDetalhesEmpresa(codigo).done(function(res) {
			myApp.hideIndicator();
			myContext = res;
			mainView.router.loadPage({ url: 'detalhes-empresa.html', context: myContext});	
		}).fail(function(erro){
			myApp.alert(erro,getErrorMessage('ErroDadosEmpresa'));
			myApp.hideIndicator();
		});
	}

	this.loadItems = function(show_empty) {
		var me = this;
		var deferred = $.Deferred();
		if (typeof show_empty == 'undefined') show_empty = false;

		var tot = 0;
		var html = '';
		getEmpresas(me.data.filtros, me.offset, me.itemsPerLoad).done(function(res){
			var tot = res.length;
			if (show_empty) {
				if(tot == 0){
					me.$$("#lista_empresas").html('<h3 class="text-center">'+getText('NenhumaEmpresaEncontrada')+'</h3>');
					deferred.resolve(html, 0);
					return;
				}
			}
			
			var max = (tot > me.itemsPerLoad) ? me.itemsPerLoad : tot;
		
			for(var i = 0; i < max; i++) {
		      	html += ''+
		      				'<a href="#" data-id="'+res[i].codigo+'" class="item-empresa">' +
						        '<div class="card">'+
						        	// '<div class="item-title-row">' +	
						        		'<div class="card-header"><b>'+res[i].razao_social+'</b></div>'+
						        	// '</div>'+
						        	'<div class="card-content">' +	
					        		'<div class="card-content-inner text_12">'+(res[i].categoria!=''?res[i].categoria:'N/A')+'</div>'+
					        		'<div class="card-content-inner text_12">'+res[i].cidade+'/'+res[i].estado+'</div>'+
						        	'</div>'+
						        	'<div class="card-footer"> + '+getText('VerDetalhes')+'</div>'+
						        '</div>'+
						     '</a>'+
				      	'';
		    }

			// Append new items
			me.$$('#lista_empresas .list-block ul').append(html);

			if (tot < me.itemsPerLoad) {
		      myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
		      me.$$('.infinite-scroll-preloader').remove();
			}

			me.offset+=me.itemsPerLoad;
			deferred.resolve(html, max);
		}).fail(function(erro) {
			console.log(erro);
			//myApp.alert(erro);
		});
		return deferred.promise();	
	}

	this.carregaLista = function(exibe_indicator) {
		
		var deferred = $.Deferred();
		if (exibe_indicator==null || exibe_indicator==undefined) exibe_indicator = true;
		var me = this;

		var html = '<div class="list-block media-list no-margin">'+
			    	'';

		me.offset = 0;

		if (exibe_indicator) myApp.showIndicator();
		
		$('#total_empresas').slideUp();
		
		var d1 = me.loadItems(true);
		var d2 = getTotalEmpresas(me.data.filtros);

		$.when(d1,d2).then(function(items, qtd_total) {
			if (exibe_indicator) myApp.hideIndicator();

			n_html = items[0];
			max = items[1];

			$('#total_empresas').slideDown();
			$('.qtd_empresas').html(qtd_total);
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
						// Reset loading flag
						me.loading = false;

						// Generate new items HTML
						
  						me.loadItems(false).done(function(n_html, max) {
  							//html += n_html;
  						});

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

}
