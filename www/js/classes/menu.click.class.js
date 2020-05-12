var MenuClickClass = function(){
	this.page = null;
	this.$$ = null;


	this.init = function(){
		var deferred = $.Deferred();
		this.setupView();
		deferred.resolve();

		return deferred.promise();
	}
    
    this.countFretesProximos = function() {
    	var d_checkin = control.checkin.getCheckin();
		var d_filtros = control.pesquisaFrete.getFiltros();
        $.when(d_checkin, d_filtros).then(function(res, filtros_bd){
    		if(res != null) {
    			var filtros = {
    				lat: res.latitude,
    				lng: res.longitude,
    			}
    			if (filtros_bd!=null) {
					for(key in filtros_bd) {
						if (key!='id') {
							eval("filtros."+key+"=(filtros_bd."+key+"!=undefined ? $.trim(filtros_bd."+key+") : null);");
						}
					}
    			} else {
    				filtros.regiao_destino = res.codigo_regiao_destino,
    				filtros.estado_destino = res.codigo_estado_destino
    			}
		    	getTotalFretesProximos(filtros, false).done(function(res){

		    		if (res && (!isNaN(res)) && res>0 ) {
						$('#divQtdFretes').html("<span class='badge bg-red'>"+res+"</span>");
		    		} else {
		    			$('#divQtdFretes').html("");
		    		}
		    	});
			}
		});
    }

    this.timeoutCountFretesProximos = function() {
		var me = this;
		me.countFretesProximos();
		if (me.tmAtualizaQuantidade) clearTimeout(me.tmAtualizaQuantidade);
		if (document.getElementById('divQtdFretes')!=null) {
			me.tmAtualizaQuantidade = setTimeout(function() {
				me.timeoutCountFretesProximos();
			},(5*60*1000));
		}
    }

    this.countOfertas = function() {
    	getTotalOfertas('novos').done(function(res){
    		var posBulletTop = 0;
    		var posBulletLeft = 0;
    		if (res && (!isNaN(res)) && res>0 ) {
				$('#divQtdOfertas').html("<span class='badge bg-red'>"+res+"</span>");
				posBulletTop = $('#divQtdOfertas').parent().position().top+39;
				posBulletLeft = $('#divQtdOfertas').parent().position().left+70;
				$('#divQtdOfertas').css("top",String(posBulletTop)+"px" ).css("left",String(posBulletLeft)+"px" );
    		} else {
    			$('#divQtdOfertas').html("");
    		}
    	});
    }

    this.timeoutCountOfertas = function() {
		var me = this;
		me.countOfertas();
		if (me.tmAtualizaQtdOfertas) clearTimeout(me.tmAtualizaQtdOfertas);
		if (document.getElementById('divQtdOfertas')!=null) {
			me.tmAtualizaQtdOfertas = setTimeout(function() {
				me.timeoutCountOfertas();
			},(5*60*1000));
		}
    }

    this.checkTabbarShow = function() {
    	var me = this;
        var pageContainer = $(me.page.container);
		pageContainer.find('.tab_link_menu_opcoes').css('display',(getLocalValue('viag_codigo_sm') != null ? "none" : "block"));
		pageContainer.find('.rodape-menu').css({'margin-bottom':(getLocalValue('viag_codigo_sm') != null ? "30px" : "70px")});
    }

    this.timeoutCheckTabbarShow = function() {
		var me = this;
		me.checkTabbarShow();
		if (me.tmCheckTabbarShow) clearTimeout(me.tmCheckTabbarShow);
		if (document.getElementById('tab_link_menu_opcoes')!=null) {
			me.tmCheckTabbarShow = setTimeout(function() {
				me.timeoutCheckTabbarShow();
			},(60*1000));
		}
    }

	this.setupView = function(){
		var me = this;

        myApp.onPageInit('menu-click', function(page){

        	me.page = page;
            var pageContainer = $(page.container);
            var navBarContainer = $(page.navbarInnerContainer);

	        if(typeof page.context.url_query.tipo != "undefined" && page.context.url_query.tipo == "novos"){
	        	myApp.showTab('#novos');
	        } else if(typeof page.context.url_query.tipo != "undefined"){
	        	myApp.showTab('#abertos');
			}

			pageContainer.find('#checkin_loading').css("display","block");

			me.checkTabbarShow();

	        getCheckin().done(function(res){
				var nullResult = ((typeof(res.nullReturn) !== "undefined") && res.nullReturn==true);
				if ( res == null || nullResult) {
					/* SE NÃO HOUVER UM CHECKIN VALIDO, SALVAR UM NOVO */
					/*
					control.checkin.getCurrentPositionMain();

					var pos = control.posiccao.getLastPosition();
					var myLatLng = {lat: pos.lat , lng: pos.lng};

					control.checkin.getAddressByPosition(myLatLng).done(function() {
						control.checkin.confirmCheckin().done(function(res){
							pageContainer.find('#checkin_icon').attr('src','img/pointer-green3.png');
							pageContainer.find('#fretes').css("display","none");
							pageContainer.find('#checkin_realizado').css("display","block");
							pageContainer.find('#checkin_nao_realizado').css("display","none");

							var numero = (res.numero != null && $.trim(res.numero) != "") ? ", " + res.numero : "";
							var bairro = (res.bairro != null && $.trim(res.bairro) != "") ? res.bairro + ' - '  : "";

							pageContainer.find('#checkin_date').html(res.data_checkin);

							if(res.endereco != null && res.endereco != ""){
								pageContainer.find('#checkin_endereco').html(res.endereco + numero);
							}

							pageContainer.find('#checkin_bairro_cidade_estado').html(bairro + res.cidade + ' - ' + res.estado);
							control.checkin.syncronize(res).done(function() {
							});

							pageContainer.find('#checkin_loading').css("display","none");
						})
					}).fail(function(msg) {
					*/
			        	pageContainer.find('#checkin_realizado').css("display","none");
			        	pageContainer.find('#fretes').css("display","none");
						pageContainer.find('#checkin_nao_realizado').css("display","block");
						pageContainer.find('#checkin_loading').css("display","none");

		        		control.checkin.clean();
					//});
        		} else {
					pageContainer.find('#checkin_realizado').css("display","block");
					pageContainer.find('#fretes').css("display","block");
        			pageContainer.find('#checkin_nao_realizado').css("display","none");
					pageContainer.find('#checkin_icon').attr('src','img/icon/local.png');

					var numero = (res.numero != null && $.trim(res.numero) != "") ? ", " + res.numero : "";
					var bairro = (res.bairro != null && $.trim(res.bairro) != "") ? res.bairro + ' - '  : "";

					pageContainer.find('#checkin_date').html(res.data_checkin);

					if(res.endereco != null && res.endereco != ""){
						pageContainer.find('#checkin_endereco').html(res.endereco + numero);
					}

					pageContainer.find('#checkin_bairro_cidade_estado').html(bairro + res.cidade + ' - ' + res.estado);

					pageContainer.find('#checkin_loading').css("display","none");
				}
	        }).fail(function(){
	        	pageContainer.find('#checkin_realizado').css("display","none");
	        	pageContainer.find('#fretes').css("display","none");
				pageContainer.find('#checkin_nao_realizado').css("display","block");
				pageContainer.find('#checkin_loading').css("display","none");

        		control.checkin.clean();
			});

			me.timeoutCountFretesProximos();
			me.timeoutCountOfertas();

			navBarContainer.on('click','.frete-button', function() {
				if (getLocalValue('viag_codigo_sm')!=null) {
                    control.viagem.reloadViagem("back");					
				}
			});

			navBarContainer.on('click','.menu-button', function(e) {
                e.preventDefault();
                control.loadMenu();
			});

			pageContainer.on('click','.checkin_icon',function() {
	        	me.doLogoff().done(function() {
	                mainView.hideNavbar();
	                mainView.router.loadPage('inicio.html');
	        	});
	        })


	        pageContainer.on('click','.sair',function() {
	        	me.doLogoff().done(function() {
	                mainView.hideNavbar();
	                mainView.router.loadPage('inicio.html');
	        	});
	        })

	        pageContainer.on('click','.ofertas',function() {
	        	mainView.router.loadPage('ofertas.html');
	        });

	        pageContainer.on('click','.meus-fretes',function() {
	        	mainView.router.loadPage('meus-fretes.html');
	        });

	        pageContainer.on('click','.menu-historico',function() {
	        	mainView.router.loadPage('historico-fretes.html');
	        });

	        pageContainer.on('click','.checkin',function() {

	        	control.checkin.getCurrentPositionMain();

				pageContainer.find('#fretes').css("display","block");
				pageContainer.find('#checkin_realizado').css("display","none");
				pageContainer.find('#checkin_loading').css("display","block");	

					var pos = control.posicao.getLastPosition();
					var myLatLng = {lat: pos.lat , lng: pos.lng};


					control.checkin.getAddressByPosition(myLatLng).done(function() {
						control.checkin.confirmCheckin().done(function(res){

							pageContainer.find('#checkin_icon').attr('src','img/icon/local.png');
							pageContainer.find('#checkin_realizado').css("display","block");
							pageContainer.find('#checkin_nao_realizado').css("display","none");

							var numero = (res.numero != null && $.trim(res.numero) != "") ? ", " + res.numero : "";
							var bairro = (res.bairro != null && $.trim(res.bairro) != "") ? res.bairro + ' - '  : "";

							pageContainer.find('#checkin_date').html(res.data_checkin);

							if(res.endereco != null && res.endereco != ""){
								pageContainer.find('#checkin_endereco').html(res.endereco + numero);
							}

							pageContainer.find('#checkin_bairro_cidade_estado').html(bairro + res.cidade + ' - ' + res.estado);					
							pageContainer.find('#checkin_loading').css("display","none");

						})
					});
	        });

	        pageContainer.on('click','.fretes',function() {
	        	control.fretesProximos.loadView();
	        });

	        
	        pageContainer.on('click','.meus-dados',function() {
	        	//mainView.router.loadPage('meus-dados.html');
                me.renderDadosCadastro('meus-dados');
	        });


	        pageContainer.on('click','.empresas',function() {
				control.db.selectRows(control.checkin,1,1).done(function(item) {
					var item = item[0];
	        		myContext = {dados_checkin: item};
		        	mainView.router.loadPage({url: 'empresas.html', context:myContext, ignoreCache: true, force: true});
				});
	        });

	        pageContainer.on('click','.about',function() {
	        	mainView.router.loadPage({url: 'about.html', context:config, ignoreCache: true, force: true});
	        });

	        pageContainer.on('click','.requisicoes',function() {
	        	mainView.router.loadPage({url: 'requisicoes.html'});
	        });

	        pageContainer.on('click','.requisicoes',function() {
	        	mainView.router.loadPage({url: 'requisicoes.html'});
	        });
	        
	        pageContainer.on('click','#btnProcurarViagens',function() {
				control.viagem.loadSemViagem();
	        	// mainView.router.load({ url: 'sem-viagem.html'});
	        });

	    });
	}

}