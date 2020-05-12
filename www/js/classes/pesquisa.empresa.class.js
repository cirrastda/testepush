var PesquisaEmpresaClass = function(){
	
	this.data = null;
	this.$$ = null;
	this.fm = null;

	this.init = function() {
		var me = this;

		this.setupView();
		
	}

	this.setupView = function() {
		var me = this;
		myApp.onPageInit('pesquisa-empresas', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);
           	me.fm = pageContainer.find('form');
			alert('aaa');
			me.$$('#btnPesquisar').on('click', function () {
				alert('bbb');
				if(me.validaForm()) {
					me.pesquisa();	
				}
			});

			me.fm.find('[name=raio]').on('input', function(){
				console.log("changed raio");
				$('#raio_value').html($(this).val());
			});

			var list = me.fm.find('[name=estado]');

			pageContainer.on('change','[name=estado]',function() {
				var codigo_uf = $(this).val();
				if (codigo_uf=='') {
					$('.li-raio').hide();
				} else {
					$('.li-raio').show();
				}
				setFieldValue(me.fm.find('[name=cidade]'),"");
				console.log(codigo_uf);
				control.settings.carregarComboCidades(pageContainer, codigo_uf);
			});

			if(page.context.filtros != undefined){
				
				setFieldValue(me.fm.find('[name=estado]'),page.context.filtros.estado);
				console.log(page.context);

				if(page.context.filtros.estado != undefined && page.context.filtros.estado != "") {
					console.log(page.context.filtros.estado);
					control.settings.carregarComboCidades(pageContainer, page.context.filtros.estado).done(function(){
						setFieldValue(me.fm.find('[name=cidade]'),page.context.filtros.cidade);		
					});
					$('.li-raio').show();
				} else {
					$('.li-raio').hide();
				}

				setFieldValue(me.fm.find('[name=nome]'),page.context.filtros.nome);
				setFieldValue(me.fm.find('[name=categoria]'),page.context.filtros.categoria);
				setFieldValue(me.fm.find('[name=raio]'),page.context.filtros.raio);
				$('#raio_value').html(page.context.filtros.raio);
			}
		});
	}	


	this.preparaFiltros = function() {
		console.log(this.fm.find('input[name="estado"]'));
		var filtro = {
			estado: getFieldValue(this.fm,'estado'),
			cidade: getFieldValue(this.fm,'cidade'),
			nome: this.fm.find('input[name="nome"]').val(),
			categoria: getFieldValue(this.fm,'categoria'),
			raio: this.fm.find('input[name="raio"]').val()
		};

		return filtro;
	
	}

	this.pesquisa = function() {
		alert('85');
		var filtros = this.preparaFiltros();
		alert('87');
		var retorno = [];
		retorno.filtro = true;
		retorno.filtros = filtros;	
		alert('91');
		mainView.router.back({url:'empresas.html', context: retorno, ignoreCache: true, force: true});

	}

	this.validaForm = function() {
		/*
		if(this.fm.find('[name=valor_de]').val() != "" && this.fm.find('[name=valor_ate]').val() != "") {
			var valor_de 	= this.fm.find('[name=valor_de]').val().toString().replace('.', '').replace(',', '.');
			var valor_ate 	= this.fm.find('[name=valor_ate]').val().toString().replace('.', '').replace(',', '.');
			if(parseFloat(valor_de) > parseFloat(valor_ate)) {
				myApp.alert('O valor "De" deve ser menor que o valor "Até"', 'Atenção');
				return false;
			}
		}
		*/
		return true;
	}
}