var AlterarLocalClass = function(){
	this.data = null;
	this.fm = null;
	this.$$ = null;
	this.geocoder = null;

	this.init = function() {
		if (typeof google != "undefined") {
			this.geocoder = new google.maps.Geocoder();
		} else {
			this.geocoder = null;
		}
		this.setupView();
	}

	this.setupView = function() {
		
		var me = this;
		myApp.onPageInit('alterar-local', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);
            me.fm = pageContainer.find('form');

			var list = me.fm.find('[name=estado]');

			pageContainer.on('change','[name=estado]',function() {
				var codigo_uf = $(this).val();
				setFieldValue(me.fm.find('[name=cidade]'),"");
				control.settings.carregarComboCidades(pageContainer, codigo_uf);
			});

			pageContainer.on('change','[name=cep]',function() {
				var cep = $(this).val();
				if(cep != ""){
					control.settings.carregarEndereco(pageContainer, cep);	
				}
			});

			pageContainer.on('click','.btnBuscar',function () {
				
				if (me.validateForm()) {

					me.data = {
						cep: getFieldValue(me.fm, 'cep'),
						endereco: getFieldValue(me.fm, 'endereco'),
						numero: getFieldValue(me.fm, 'numero'),
						complemento: getFieldValue(me.fm, 'complemento'),
						bairro: getFieldValue(me.fm, 'bairro'),
						cidade: $('#cidade option:selected').text(),
						estado: $('#estado option:selected').text()
					}
					myApp.showIndicator();
					var address = me.data.endereco+", "+me.data.numero+", "+me.data.bairro+ ", "+me.data.cidade+ " - "+me.data.estado;
					me.geocoder.geocode({'address': address}, function(results, status) {
					    if (status === google.maps.GeocoderStatus.OK) {
					     	me.data.localAlterado = true;
					    	control.posicoes.setLastPosition(results[0].geometry.location.lat(), results[0].geometry.location.lng());
				        	control.checkin.loadFieldDestino().done(function(arrDestino) {
					    		myApp.hideIndicator();
				    			me.data.arrDestino = arrDestino;
				    			console.log(me.data);
				    			mainView.router.back({url:'checkin.html', context: me.data, ignoreCache: true, force: true});
				    		}).fail(function(msg) {
						    	myApp.hideIndicator();
						      	myApp.alert('Erro ao processar dados de localização: '+msg,'Atenção');
				        	});
					    } else {
					    	myApp.hideIndicator();
					      	myApp.alert('Não foi possivel localizar o endereço: ' + status,'Atenção');
					    }
					});
				}

			});

			control.settings.page = page;//Para poder reutilizar os métodos de carregar combos do cadastro
			
			if(page.context.cep != undefined){
				me.fm.find('[name=cep]').val(page.context.cep);
				me.fm.find('[name=cep]').trigger("change");

				me.fm.find('[name=numero]').val(page.context.numero);
				me.fm.find('[name=complemento]').val(page.context.complemento);
			}

		});
	}


	this.validateForm = function() {
		var view = $(mainView.activePage.container);
		var me = this;
		console.log(me.fm);
		var erros = valida_form(me.fm, true);
		if(erros.length > 0) {
			myApp.alert('Verificar os seguintes erros', 'Atenção');
			return false;
		}

		return true;
		
	}

}

