var MeusFretesClass = function(){
	this.page = null;
	this.$$ = null;

	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};
	

	this.init = function(){
		var deferred = $.Deferred();

		this.setupView();

		deferred.resolve();

		return deferred.promise();
	}

	this.setupView = function(){
		var me = this;
		myApp.onPageInit('meus-fretes', function(page) {
			me.page = page;
			console.log(me.page);
			me.$$ = Dom7;



			me.$$('.backToMenu').on('click',function(e) {
				control.viagem.loadMenuClickCargo('back', true);
				e.preventDefault();
				e.stopPropagation();
			});
			

			if(me.page.context.isPush != undefined && me.page.context.isPush != '') {

				me.getFreteEmAtendimento(me.$$).done(function() {
					me.page.context.isPush = '';
				});			
				
			}else {

				control.detalhesFrete.getLocalFreteEmAtendimento().done(function(dados){
					me.getFreteEmAtendimento(me.$$);
				});
			}
			me.preparePullRequest();
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
			me.getFreteEmAtendimento(me.$$, false).done(function() {
				$('.pull-to-refresh-layer').css('margin-top','-30px');
				myApp.pullToRefreshDone();
        	 	// me.$$('#lista_empresas').append('<div class="infinite-scroll-preloader">'+
											//     	'<div class="preloader"></div>'+
											//     '</div>');
			}).fail(function() {
				$('.pull-to-refresh-layer').css('margin-top','-30px');
				myApp.pullToRefreshDone();
			})

		});

	}	

	this.trataEndereco = function(endereco, numero, bairro) {
		if (numero!=null && numero!='') endereco += ","+numero;
		if (bairro!=null && bairro!='') endereco += " - "+bairro;
		return endereco;
	}

	this.loadFreteById = function(id_frete) {
		var me = this;
		getDadosFrete(id_frete).done(function (dados_frete) {
			me.loadFrete(dados_frete);
		});
	}

	this.loadFrete = function(dados_frete) {
		var me = this;

		if (dados_frete.valor_fechado) {
			dados_frete.valor = dados_frete.valor_fechado;
		}
		
		dados_frete.peso = (dados_frete.peso!="" ? dados_frete.peso+" Kg." : "N/A");

		dados_frete.endereco_origem = me.trataEndereco(dados_frete.endereco_origem,dados_frete.numero_origem,dados_frete.bairro_origem);
		dados_frete.endereco_destino = me.trataEndereco(dados_frete.endereco_destino,dados_frete.numero_destino,dados_frete.bairro_destino);
		dados_frete.height = "calc(100% - 50px)";
    	
    	myApp.hideIndicator();
    	
    	
		mainView.router.load( {url: 'detalhes-frete.html', context: dados_frete });	
    	
		//Carrega a página via ajax para carregar dentro da div de conteudo da tab
		/*me.$$.get('detalhes-frete.html', {}, function (data) { 

	        me.$$('#tabEmAtendimento').html(bindData(data,dados_frete));//substitui os dados do html pelos dados do frete 	    
	        
	        control.detalhesFrete.page = me.page;
			control.detalhesFrete.loadView(dados_frete);//carrega os dados do frete na view
			myApp.hideIndicator();
	    });*/
	    
	}


	this.loadDataAtendimento = function($$,fretes, exibe_indicator) {
        //var pageContainer = $(this.page.container);
        var me = this;
		if (exibe_indicator==null || exibe_indicator==undefined) exibe_indicator = true;

        if(fretes.length == 0){
			$$("#tabEmAtendimento").html('<div class="content-block text-center">'+
						    getText('NaoExistemFretesAtendimento')+
						'</div>');
			if (exibe_indicator) myApp.hideIndicator();
		}else {
			
			$$("#tabEmAtendimento").html('<div class="list-block media-list no-margin-top-important">'+
								    '<div id="list-atendimentos"></div>'+
								  '</div>');

			fretes.forEach(function(item){
				
				$$("#list-atendimentos").append('\n' +
					'<a href="#" id="atendimento_' + item.codigo_frete + '" data-id="'+item.codigo_frete+'" class="item-atendimento">\n' +
			        	'<div class="card">\n' +
			        		//'<div class="item-title-row">\n' +
		            			'<div class="card-header"><b>' + strLimit(ucwords(item.ofertante),90) + '</b></div>\n'+
			          		//'</div>\n' +
			        		'<div class="card-content">\n' +
				          		'<div class="card-content-inner">'+getText('De')+': ' 		 + item.cidade_origem 			+ ' - ' + item.uf_origem 	+ '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Para')+': ' 	 + item.cidade_destino 			+ ' - ' + item.uf_destino 	+ '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Valor')+': '+getMoneyAbreviation()+' ' + item.valor_fechado 			+ '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Retirada')+': ' + item.data_previsao_inicio 	+ '</div>\n' +
				          		'<div class="card-content-inner">'+getText('Entrega')+': '  + item.data_previsao_entrega 	+ '</div>\n' +
						      	'<div class="card-content-inner">'+getText('KMTotal')+': ' + (item.km_total!="0,00"?item.km_total+" Km":getStatusText('NaoIdentificado')) + '</div>' +
						      	'<div class="card-content-inner"><i>'+getText('LancadoA')+': ' + item.tempo_cadastro + '</i></div>' +
				        	'</div>'+
				        	'<div class="card-footer"> + '+getText('VerDetalhes')+'</div>'+
			        	'</div>\n' +
			        '</a>\n' +
		      	'');
			});		
			
				
	        $$('.item-atendimento').off('click').on('click', function () {
	        	var id = $(this).attr('data-id');
	        	me.loadFreteById(id);//Carrega o frete selecionado
	        });

	        if (exibe_indicator) myApp.hideIndicator();
        	
        	//Se possuir um único atendimento, exibe o detalhe
    		console.log(me.page.context);
        	if(me.page.context.isPush != undefined && me.page.context.isPush != '') {
        		console.log(me.page.context);
        		if (me.page.context.id_frete) {
        			me.loadFreteById(me.page.context.id_frete);
        		}
        	} else {
				// if(fretes.length == 1){
				// 	me.loadFreteById(fretes[0].codigo_frete);
				// }
			}
		}
		
	}


	this.getFreteEmAtendimento = function($$, exibe_indicator){
		var me = this;
		if (exibe_indicator==null || exibe_indicator==undefined) exibe_indicator = true;

		if (exibe_indicator) {
			$$("#tabEmAtendimento").html("");
			myApp.showIndicator();
		}

		var deferred = $.Deferred();

		//Busca frete armazenado localmente caso exista
		control.detalhesFrete.getLocalFreteEmAtendimento().done(function(dados){
		
			if(dados == null){//Se não encontrou, então busca da API e adiciona localmente
			
				getFretesEmAtendimento().done(function(res){
					
					me.loadDataAtendimento($$,res, exibe_indicator);
					
					var tot = res.length;
					for(var i = 0; i < tot; i++){
						//Insere os dados do frete localmente
						control.detalhesFrete.insertLocalFrete(res[i]).done(function(){
							deferred.resolve();
						});
					}
					
				}).fail(function(erro){
					if (exibe_indicator) myApp.hideIndicator();
					myApp.alert(erro, getAlertMessage('Atencao'));
					deferred.reject(erro);
				});

			} else {
				//Se existe localmente então utiliza os dados locais
				me.loadDataAtendimento($$,dados, exibe_indicator);
				deferred.resolve();
			}


		});

		return deferred.promise();
	}




}