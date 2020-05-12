var FretesProximosClass = function(){

	this.data = null;
	this.$$ = null;
	this.arrEstados = null;
	this.arrRegioes = null;
	this.arrTiposVeiculo = null;
	this.arrTecnologias = null;

	this.lat = null;
	this.lng = null;

	this.loading = false;

	// Last loaded index
	this.lastIndex = 0;

	// Max items to load
	this.maxItems = 100;
	this.totalItems = 0;

	// Append items per load
	this.itemsPerLoad = 20;

	this.raio = 200;//200 KM
	this.raio_default = 200;

	this.init = function() {
		var me = this;

		this.setupView();
	}

	this.setupView = function() {
		var me = this;

		myApp.onPageInit('fretes-proximos', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);

           	me.data 	= null;
			me.raio 	= me.raio_default;
			me.regiao 	= null;
			me.estado 	= null;
			if(page.context.filtro != undefined){
				me.data = [];
				if(page.context.filtros.raio > 0) {
					me.raio = page.context.filtros.raio;
				}
				if (page.context.filtros.regiao!=null) {
					me.regiao = page.context.filtros.regiao;
				}
				if (page.context.filtros.estado!=null) {
					me.estado = page.context.filtros.estado;
				}
				if (page.context.filtros.tipo_veiculo!=null) {
					me.tipo_veiculo = page.context.filtros.tipo_veiculo;
				}
				me.data.fretes = page.context.fretes;
				me.data.filtros = page.context.filtros;
			} else if (page.context.dados_checkin != undefined) {
				with (page.context) {
					if (me.data==undefined || me.data.filtros==undefined) {
		 				me.data = {
		 					filtros: {
								raio: me.raio_default,
								regiao_destino: dados_checkin.codigo_regiao_destino,
								uf_destino: dados_checkin.codigo_estado_destino
							}
						};
					} else {
						me.data.filtros.regiao_destino = dados_checkin.codigo_regiao_destino;
						me.data.filtros.uf_destino = dados_checkin.codigo_estado_destino;
					}
					me.lat = dados_checkin.latitude;
					me.lng = dados_checkin.longitude;
				}
			}

			me.$$('.backToMenu').on('click',function(e) {
				if(me.data.filtros != undefined){
					myContext = me.data.filtros;
				}
				control.viagem.loadMenuClickCargo('back', true);
				// mainView.router.back({url:'main.html', context:{checkin: true}, ignoreCache: true, force: true});	
				e.preventDefault();
				e.stopPropagation();
			});

			me.$$('#btnFiltro').on('click', function () {
				var myContext = null;
				if(me.data.filtros != undefined){
					myContext = me.data.filtros;
				}
				myApp.showIndicator();
				if(me.arrEstados == null || me.arrRegioes == null || me.regiao!=null) {
					var d1 = getEstados(me.regiao);
					var d2 = getRegioes();
					var d3 = getTiposVeiculo();
					var d4 = getTiposCarroceria();
					var d5 = getTecnologias()

					$.when(d1, d2, d3, d4, d5).then(function(estados, regioes, tipos_veiculos, tipos_carroceria, tecnologias) {
						myApp.hideIndicator();
						me.arrEstados = estados;
						me.arrRegioes = regioes;
						me.arrTiposVeiculo = tipos_veiculos;
						me.arrTiposCarroceria = tipos_carroceria;
						me.arrTecnologias = tecnologias;
						console.log(myContext);
						mainView.router.loadPage({url: 'pesquisa-frete.html', context: {arrEstados: me.arrEstados, arrRegioes: me.arrRegioes, arrTiposVeiculo: me.arrTiposVeiculo, arrTiposCarroceria: me.arrTiposCarroceria, arrTecnologias: me.arrTecnologias, filtros: myContext}});
					});
				}else {
					myApp.hideIndicator();
					mainView.router.loadPage({url: 'pesquisa-frete.html', context: {arrEstados: me.arrEstados, arrRegioes: me.arrRegioes, arrTiposVeiculo: me.arrTiposVeiculo, arrTiposCarroceria: me.arrTiposCarroceria, arrTecnologias: me.arrTecnologias, filtros: myContext}});
				}
			});

			me.$$('#btnMapa').on('click', function () {
				console.log('FretesProximosClass | click', me);
				var myContext = null;
				if(me.data.fretes != undefined){
					myContext = {
						fretes: me.data.fretes
					};
				} else {
					myContext = {
						fretes: []
					};
				}
				if(me.data.filtros != undefined){
					myContext['filtros'] = me.data.filtros;
				} else {
					myContext['filtros'] = {
						raio: me.raio
					};
				}
				console.log('FretesProximosClass | setupView | me.lat: ', me.lat);
				console.log('FretesProximosClass | setupView | me.lng: ', me.lng);
				if(me.lat != undefined){
					myContext['lat'] = me.lat;
				} else {
					myContext['lat'] = null;
				}
				if(me.lng != undefined){
					myContext['lng'] = me.lng;
				} else {
					myContext['lng'] = null;
				}
				mainView.router.loadPage({url: 'mapa-fretes.html', context: myContext});
			});

			me.carregaFretes();
		});
	}

	this.loadView = function(hide_indicator) {
		if (hide_indicator==null || hide_indicator==undefined) hide_indicator = false;
    	var d_checkin = control.db.selectRows(control.checkin,1,1);
		var d_filtros = control.pesquisaFrete.getFiltros();
		$.when(d_checkin, d_filtros).then(function(checkin, filtros) {
			if (hide_indicator) myApp.hideIndicator();
			var checkin = checkin[0];
			if (filtros!=null) {
    			myContext = {dados_checkin: checkin, filtros: filtros, filtro: true};
    		} else {
    			myContext = {dados_checkin: checkin};
    		}
    		mainView.router.load({url:'fretes-proximos.html', context:myContext, ignoreCache: true, force: true});
		},function(msg) {
			if (hide_indicator) myApp.hideIndicator();
		});
	}

	this.calculaTotalFretes = function() {
		var me = this;
		var tot_fretes = 0;

		if(me.data.fretes == undefined) {
			tot_fretes = 0;
		}else if(me.data.fretes.erro == 'Erro ao buscar fretes') {
			tot_fretes = 0;
		}else {
			tot_fretes = me.data.fretes.length;
		}
		var storage_buscar_por = localStorage.getItem('buscar_por');
		if(storage_buscar_por == 'proximo'){
			$('#contentInfo').html(tot_fretes+' '+getText('XFretesA')+' '+me.raio+getText('KmSuaLocalizacao'));
		}else if(storage_buscar_por == 'cidade'){
			$('#contentInfo').html(tot_fretes+' '+getText('XFretes'));
		}else{
			$('#contentInfo').html(tot_fretes+' '+getText('XFretesA')+' '+me.raio+getText('KmSuaLocalizacao'));
		}
	}

	this.carregaFretes = function() {
		var me = this;
		if(me.data != undefined && me.data.fretes != undefined) {//As informações vieram da pesquisa
			me.calculaTotalFretes();
			if(me.data.fretes != undefined){
				me.carregaLista();
			}
		}else {
			var filtros = (me.data != undefined)? me.data.filtros : '';
			getFretesProximos(filtros).done(function(res){//Busca os fretes
				if (me.data==undefined) me.data = [];
				me.data.fretes = res;
				me.calculaTotalFretes();
				if(res) {
					me.carregaLista();
				}
			}).fail(function(erro){
				console.log('FretesProximosClass | carregaFretes | erro: ', erro);
			});
		}
	}

	this.printFrete = function(i, dados_frete) {
		return '<a href="javascript:abreDetalheFrete('+i+')" data-id="'+dados_frete.codigo_frete+'" class="item-frete">' +
	        '<div class="card">'+
	        	// '<div class="item-title-row">' +	
        				'<div class="card-header"><b>' + strLimit(ucwords(dados_frete.ofertante),100) + '</b></div>\n'+
	        	// '</div>'+
	        	'<div class="card-content">' +	
		        	'<div class="card-content-inner">'+getText('De')+': '+dados_frete.cidade_origem+ ' - '+ dados_frete.uf_origem +'</div>' +
			      	'<div class="card-content-inner">'+getText('Para')+': '+dados_frete.cidade_destino+ ' - '+ dados_frete.uf_destino +'</div>' +
			      	'<div class="card-content-inner">'+getText('Valor')+': '+(dados_frete.valor!="0,00"?getMoneyAbreviation()+" "+dados_frete.valor:getText('ACombinar'))+'</div>' +
			      	'<div class="card-content-inner">'+getText('Retirada')+': '+dados_frete.data_previsao_inicio+'</div>' +
			      	'<div class="card-content-inner">'+getText('Entrega')+': '+dados_frete.data_previsao_entrega+'</div>' +
			      	'<div class="card-content-inner">'+getText('KMTotal')+': '+(dados_frete.km_total!="0,00"?dados_frete.km_total+" Km":getStatusText('NaoIdentificado'))+'</div>' +
			      	'<div class="card-content-inner"><i>'+getText('LancadoA')+': ' + dados_frete.tempo_cadastro + '</i></div>' +
	        	'</div>'+
	        	'<div class="card-footer"> + '+getText('VerDetalhes')+'</div>'+
	        '</div>'+
	     '</a>';
	}

	this.carregaLista = function() {
		var me = this;

		var html = '<div class="list-block media-list no-margin">'+
			    	// '<ul>'+
			    	''
		;

		var tot = me.data.fretes.length;
		me.totalItems = tot;

		if(tot == 0){
			me.$$("#lista_fretes").html('<h3 class="text-center">'+getText('NenhumFreteEncontrado')+'</h3>');
			return;
		}

		var max = (tot > me.itemsPerLoad) ? me.itemsPerLoad : tot;

	    for(var i = 0; i < max; i++) {
	      	html += me.printFrete(i,me.data.fretes[i]);
	    }

	    this.lastIndex = (max-1);

	    html += ''+
	    		// '	</ul>'+
				  '</div>';

		if(max >= me.itemsPerLoad) {
			html +=  '<div class="infinite-scroll-preloader">'+
					    '<div class="preloader"></div>'+
					  '</div>';

			me.$$('.infinite-scroll').on('infinite', function () {
			  // Exit, if loading in progress
			  if (me.loading) return;

			  // Set loading flag
			  me.loading = true;

			  // Emulate 1s loading
			  setTimeout(function () {
			    // Reset loading flag
			    me.loading = false;
			    if (me.lastIndex >= me.maxItems || me.lastIndex >= (me.totalItems-1)) {
			      // Nothing more to load, detach infinite scroll events to prevent unnecessary loadings
			      myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
			      // Remove preloader
			      me.$$('.infinite-scroll-preloader').remove();
			      return;
			    }

			    // Generate new items HTML
			    var html = '';
			    var tot = 0;
			    for (var i = me.lastIndex + 1; i <= me.lastIndex + me.itemsPerLoad; i++) {
			    	if (me.data.fretes[i]==undefined) break;
			      	html += me.printFrete(i,me.data.fretes[i]);
			    	tot++;
			    }

			    // Append new items
			    me.$$('#lista_fretes .list-block').append(html);

			    // Update last loaded index
			    me.lastIndex = me.lastIndex+tot;
			  }, 1000);
			});
		}else {
			myApp.detachInfiniteScroll(me.$$('.infinite-scroll'));
		}

		me.$$("#lista_fretes").html(html);

		me.$$('.item-frete').on('click',function(){
		});
	}
}

function abreDetalheFrete(idx){

	getDadosFrete(control.fretesProximos.data.fretes[idx].codigo_frete).done(function(res){

		var dados = [];
		dados = res;
		dados.isFrete = true;
		dados.height = 'calc(100% - 50px)';
		dados.filtros = control.fretesProximos.data.filtros;
		if (dados.valor=="0,00") {
			dados.valor = getText('ACombinar');
		} else {
			dados.valor = getMoneyAbreviation()+" "+dados.valor;
		}
		dados.exibe_contra_oferta = false;
		mainView.router.loadPage({url:'detalhes-oferta.html', context: dados}); 
	});
}