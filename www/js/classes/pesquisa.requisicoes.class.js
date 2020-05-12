var PesquisaRequisicoesClass = function(){
	
	this.data = null;
	this.$$ = null;
	this.fm = null;

	this.init = function() {
		var me = this;
		this.setupView();
	}

	this.setupView = function() {
		var me = this;
		myApp.onPageInit('pesquisa-requisicoes', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);
           	me.fm = pageContainer.find('form');
			
			me.$$('#btnPesquisar').on('click', function () {
				me.pesquisa();	
			});

			var list = me.fm.find('[name=estado]');

			pageContainer.on('change','[name=estado]',function() {
				var codigo_uf = $(this).val();
				setFieldValue(me.fm.find('[name=cidade]'),"");
				console.log(codigo_uf);
				control.settings.carregarComboCidades(pageContainer, codigo_uf);
			});

			if(page.context.filtros != undefined){
				
				setFieldValue(me.fm.find('[name=estado]'),page.context.filtros.estado);
				console.log(page.context);

				if(page.context.filtros.estado != "") {
					console.log(page.context.filtros.estado);
					control.settings.carregarComboCidades(pageContainer, page.context.filtros.estado).done(function(){
						setFieldValue(me.fm.find('[name=cidade]'),page.context.filtros.cidade);		
					});
				}
			}
		});
	}	

	this.preparaFiltros = function() {
		console.log(this.fm.find('input[name="estado"]'));
		var filtro = {
			estado: getFieldValue(this.fm,'estado'),
			cidade: getFieldValue(this.fm,'cidade'),
		};

		return filtro;
	
	}

	this.pesquisa = function() {
		var filtros = this.preparaFiltros();
		var retorno = [];
		retorno.filtro = true;
		retorno.filtros = filtros;	

		mainView.router.back({url:'requisicoes.html', context: retorno, ignoreCache: true, force: true});
	}

}