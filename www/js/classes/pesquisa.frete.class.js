var PesquisaFreteClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};

	this.data 	= null;
	this.$$ 	= null;
	this.fm 	= null;

	this.init = function() {
		var me = this;
		this.loadTableInfo();

		this.setupView();
	}

	this.setupView = function() {
		var me = this;

		myApp.onPageInit('pesquisa-frete', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);
           	me.fm = pageContainer.find('form');

           	var storage_buscar_por = localStorage.getItem('buscar_por');
           	if(storage_buscar_por == null){
           		var proximo = 'proximo';
           		localStorage.setItem('buscar_por', proximo);
           		var storage_buscar_por = localStorage.getItem('buscar_por');
           	}

           	if(storage_buscar_por != ""){
           		$('#proximo').prop('checked', 'checked');

       			me.habilitarOrigem(storage_buscar_por);
           		if(storage_buscar_por == 'proximo'){
           			$('#cidade').prop('checked');
           			$('#proximo').prop('checked', 'checked');
           		}else if(storage_buscar_por == 'cidade'){
           			$('#proximo').prop('checked');
           			$('#cidade').prop('checked', 'checked');
           		}
           	}

			me.$$('#btnPesquisar').on('click', function () {
				if(me.validaForm()) {
					me.pesquisa();
				}
			});

			me.$$('#btnLimpar').on('click',function() {

				var storage_buscar_por = localStorage.getItem('buscar_por');
				if(storage_buscar_por == 'cidade'){
           			$('#cidade').prop('checked', false);
           			$('#proximo').prop('checked', true);
           		}
				localStorage.setItem('buscar_por', 'proximo');
				me.habilitarOrigem('proximo');

				me.resetRegiaoOrigem(me);

				setFieldValue(me.fm.find('[name=regiao]'),"");
				me.fm.find('[name=regiao]').trigger("change");
				setFieldValue(me.fm.find(".valor_moeda"),"");
				var raio_default = control.fretesProximos.raio_default;
				setFieldValue(me.fm.find("[name=raio]"),raio_default);
				me.fm.find("[name=raio]").trigger('input');
				control.settings.getDataByDocumento().done(function(dados){
					if(dados != null){
						if(dados.tipo_veiculo != 'undefined') {
							setFieldValue(me.fm.find('[name=tipo_veiculo]'),dados.tipo_veiculo);
						}else{
							setFieldValue(me.fm.find("[name=tipo_veiculo]"), "");
						}

						if(dados.tipo_carroceria != 'undefined') {
							setFieldValue(me.fm.find('[name=tipo_carroceria]'),dados.tipo_carroceria);
						}else{
							setFieldValue(me.fm.find("[name=tipo_carroceria]"), "");
						}

						if(dados.tecnologia != 'undefined') {
							setFieldValue(me.fm.find('[name=tecnologia]'),dados.tecnologia);
						}else{
							setFieldValue(me.fm.find("[name=tecnologia]"), "");
						}

						var filtros = {
								raio: raio_default,
								tipo_veiculo: dados.tipo_veiculo,
								tipo_carroceria: dados.tipo_carroceria,
								tecnologia: dados.tecnologia,
								limpa_filtros: 		true,

						};
						control.pesquisaFrete.saveFiltros(filtros).done(function() {});
					}
				});
			});

			me.fm.find('[name=raio]').on('input', function(){
				$('#raio_value').html($(this).val());
			});

			var list 	= me.fm.find('[name=estado_origem]');
			var list2 	= me.fm.find('[name=estado]');

			me.$$('.label-buscar-por').on('change', function () {
				var buscar_por = me.fm.find('input[name=buscar-por]:checked').val();
				me.habilitarOrigem(buscar_por);
				me.resetRegiaoOrigem(me);
			});

			pageContainer.on('change','[name=estado_origem]',function() {
				var codigo_uf_origem = $(this).val();
				setFieldValue(me.fm.find('[name=cidade_origem]'),"");
				control.settings.carregarComboCidadesOrigem(pageContainer, codigo_uf_origem);
			});

			pageContainer.on('change','[name=estado]',function() {
				var codigo_uf = $(this).val();
				setFieldValue(me.fm.find('[name=cidade]'),"");
				control.settings.carregarComboCidades(pageContainer, codigo_uf);
			});

			pageContainer.on('change','[name=regiao_origem]',function() {
				var codigo_regiao = $(this).val();
				setFieldValue(me.fm.find('[name=estado_origem]'),"");
				setFieldValue(me.fm.find('[name=cidade_origem]'),"");
				control.settings.carregarComboEstadosOrigem(pageContainer, codigo_regiao);
				control.settings.carregarComboCidadesOrigem(pageContainer, "");
			});

			pageContainer.on('change','[name=regiao]',function() {
				var codigo_regiao = $(this).val();
				setFieldValue(me.fm.find('[name=estado]'),"");
				setFieldValue(me.fm.find('[name=cidade]'),"");
				control.settings.carregarComboEstados(pageContainer, codigo_regiao);
				control.settings.carregarComboCidades(pageContainer, "");
			});

			pageContainer.on('keyup','.valor_moeda',function() {
				var obj = $(this)[0];
				campo_moeda(obj);
			});
			pageContainer.on('blur','.valor_moeda',function() {
				if ($(this).val()=="0,0") {
					$(this).val("");
				}
			});
			console.log(page.context);
			if(page.context.filtros != undefined){
				control.pesquisaFrete.carregaFiltrosDoBanco().done(function(dados){
					if(dados != null){
						me.preencheCamposFiltros(pageContainer, dados[0]);
					} else {
						me.preencheCamposFiltrosDefault(pageContainer);
					}
				});
			}
		});
	}

	this.carregaFiltrosDoBanco = function () {
	    var deferred = $.Deferred();

	    var sql = "SELECT * " +
	            " FROM " + this.tbName + 
	            " ORDER BY " + this.tbPK+ " ASC";

	    control.db.query(sql).done(function(itens){
	      if(itens.length == 0){
	          itens = null;
	      }
	      deferred.resolve(itens);
	    }).fail(function(){
	      console.log("Erro SQL = "+sql);
	      deferred.resolve(null);
	    });

    	return deferred.promise();
	}

	this.preencheCamposFiltrosDefault = function(pageContainer) {
		var me = this;

		control.settings.getDataByDocumento().done(function(dados){
			if(dados != null){
				if(dados.tipo_veiculo != 'undefined') {
					setFieldValue(me.fm.find('[name=tipo_veiculo]'),dados.tipo_veiculo);
				}
				if(dados.tipo_carroceria != 'undefined') {
					setFieldValue(me.fm.find('[name=tipo_carroceria]'),dados.tipo_carroceria);
				}
				if(dados.tecnologia != 'undefined') {
					setFieldValue(me.fm.find('[name=tecnologia]'),dados.tecnologia);
				}
				var raio_default = control.fretesProximos.raio_default;
				setFieldValue(me.fm.find('[name=raio]'),raio_default);
				$('#raio_value').html(raio_default);
				
			}
			setFieldValue(me.fm.find('[name=valor_ate]'),'');
			setFieldValue(me.fm.find('[name=valor_de]'),'');
		});

		
	}

	this.preencheCamposFiltros = function(pageContainer, filtros) {
		var me = this;

		if( filtros.regiao_origem != "" ) {
			setFieldValue(me.fm.find('[name=regiao_origem]'),filtros.regiao_origem);
			control.settings.carregarComboEstadosOrigem(pageContainer, filtros.regiao_origem).done(function(){
				setFieldValue(me.fm.find('[name=estado_origem]'), filtros.uf_origem);
			});
		}

		if( filtros.regiao_destino != "" ) {
			setFieldValue(me.fm.find('[name=regiao]'),filtros.regiao_destino);
			control.settings.carregarComboEstados(pageContainer, filtros.regiao_destino).done(function(){
				setFieldValue(me.fm.find('[name=estado]'), filtros.uf_destino);
			});
		}
		console.log(filtros.tipo_veiculo);
		if(filtros.tipo_veiculo) {
			setFieldValue(me.fm.find('[name=tipo_veiculo]'),filtros.tipo_veiculo);
		} else {
			control.settings.getDataByDocumento().done(function(dados){
				if(dados != null){
					if(dados.tipo_veiculo != 'undefined') {
						setFieldValue(me.fm.find('[name=tipo_veiculo]'),dados.tipo_veiculo);
					}
				}
   			});
		}

		if(filtros.tipo_carroceria) {
			setFieldValue(me.fm.find('[name=tipo_carroceria]'),filtros.tipo_carroceria);
		} else {
			control.settings.getDataByDocumento().done(function(dados){
				if(dados != null){
					if(dados.tipo_carroceria != 'undefined') {
						setFieldValue(me.fm.find('[name=tipo_carroceria]'),dados.tipo_carroceria);
					}
				}
   			});
		}
		if(filtros.tecnologia) {
			setFieldValue(me.fm.find('[name=tecnologia]'),filtros.tecnologia);
		} else {
			control.settings.getDataByDocumento().done(function(dados){
				console.log(dados.tecnologia);
				if(dados != null){
					if(dados.tecnologia != 'undefined') {
						setFieldValue(me.fm.find('[name=tecnologia]'),dados.tecnologia);
					}
				}
   			});
		}

		if(filtros.uf_origem != "") {
			control.settings.carregarComboCidadesOrigem(pageContainer, filtros.uf_origem).done(function(){
				setFieldValue(me.fm.find('[name=cidade_origem]'), filtros.cidade_origem);
			});
		}

		if(filtros.uf_destino != "") {
			control.settings.carregarComboCidades(pageContainer, filtros.uf_destino).done(function(){
				setFieldValue(me.fm.find('[name=cidade]'),filtros.cidade_destino);
			});
		}

		if(filtros.raio != "" && filtros.raio != 'undefined') {
			setFieldValue(me.fm.find('[name=raio]'),filtros.raio);
			$('#raio_value').html(filtros.raio);
		}else {
			var raio_default = control.fretesProximos.raio_default;
			setFieldValue(me.fm.find('[name=raio]'),raio_default);
			$('#raio_value').html(raio_default);
		}

		if(filtros.valor_ate != "" && filtros.valor_ate != undefined) {
			setFieldValue(me.fm.find('[name=valor_ate]'),filtros.valor_ate);
		}else {
			setFieldValue(me.fm.find('[name=valor_ate]'),'');

		}
		if(filtros.valor_de != "" && filtros.valor_de != undefined) {
			setFieldValue(me.fm.find('[name=valor_de]'),filtros.valor_de);
		}else {
			setFieldValue(me.fm.find('[name=valor_de]'),'');
		}
	}

	this.salvarFiltrosPadroes = function() {
		control.settings.getDataByDocumento().done(function(dados){
			var raio_default = control.fretesProximos.raio_default;
			var filtro = {
				raio: 				raio_default,
				tipo_veiculo: 		String(dados[0].tipo_veiculo),
				tipo_carroceria: 	String(dados[0].tipo_carroceria),
				tecnologia: 		String(dados[0].tecnologia),
			};
			control.pesquisaFrete.saveFiltros(filtro);

		});
	}

	this.preparaFiltros = function() {
		var filtro = {
			buscar_por: 		localStorage.getItem('buscar_por'),
			regiao_origem: 		getFieldValue(this.fm,'regiao_origem'),
			uf_origem: 			getFieldValue(this.fm,'estado_origem'),
			cidade_origem: 		getFieldValue(this.fm,'cidade_origem'),
			regiao_destino: 	getFieldValue(this.fm,'regiao'),
			uf_destino: 		getFieldValue(this.fm,'estado'),
			cidade_destino: 	getFieldValue(this.fm,'cidade'),
			valor_de: 			this.fm.find('input[name="valor_de"]').val(),
			valor_ate: 			this.fm.find('input[name="valor_ate"]').val(),
			raio: 				this.fm.find('input[name="raio"]').val(),
			tipo_veiculo: 		getFieldValue(this.fm,'tipo_veiculo'),
			tipo_carroceria: 	getFieldValue(this.fm,'tipo_carroceria'),
			tecnologia: 		getFieldValue(this.fm,'tecnologia'),
		};
		return filtro;
	}

	this.pesquisa = function() {
		var filtros = this.preparaFiltros();
		control.pesquisaFrete.saveFiltros(filtros).done(function() {
			getFretesProximos(filtros).done(function(res){
				var retorno = [];
				retorno.filtro 	= true;
				retorno.filtros = filtros;
				retorno.fretes 	= res;

				mainView.router.back({url:'fretes-proximos.html', context: retorno, ignoreCache: true, force: true});
			});
		}).fail(function(erro) {
		});
	}

	this.validaForm = function() {

		if(this.fm.find('[name=valor_de]').val() != "" && this.fm.find('[name=valor_ate]').val() != "") {
			var valor_de 	= this.fm.find('[name=valor_de]').val().toString().replace('.', '').replace(',', '.');
			var valor_ate 	= this.fm.find('[name=valor_ate]').val().toString().replace('.', '').replace(',', '.');
			if(parseFloat(valor_de) > parseFloat(valor_ate)) {
				myApp.alert('O valor "De" deve ser menor que o valor "Até"', 'Atenção');
				return false;
			}
		}
		return true;
	}

	this.getFiltros = function() {
		var me = this;
		var deferred = $.Deferred();
		control.db.selectRows(me,1,1,1).done(function(reg) {
			if (reg) {
				deferred.resolve(reg);
			} else {
				me.getFiltrosDefault().done(function(filtros) {
					deferred.resolve(filtros);
				}).fail(function(msg) {
					deferred.reject(msg)
				});
			}
		});
		return deferred.promise();
	}

	this.getFiltrosDefault = function() {
		var me = this;
		var filtros = {};
		var deferred = $.Deferred();
		control.settings.getDataByDocumento().done(function(dados){
			if(dados != null){
				if(dados.tipo_veiculo != 'undefined') {
					filtros.tipo_veiculo = dados.tipo_veiculo;
				}
				if(dados.tipo_carroceria != 'undefined') {
					filtros.tipo_carroceria = dados.tipo_carroceria;
				}
				if(dados.tecnologia != 'undefined') {
					filtros.tecnologia = dados.tecnologia;
				}
				var raio_default = control.fretesProximos.raio_default;
				filtros.raio = raio_default;
				deferred.resolve(filtros);
			} else {
				deferred.resolve(null);
			}
		}).fail(function(msg) {
			deferred.reject(msg);
		});
		return deferred.promise();


	}

	this.saveFiltros = function(filtros, reseta_valores) {
		if (reseta_valores==null || reseta_valores==undefined) reseta_valores = true;
		var me = this;
		var deferred = $.Deferred();
		control.db.selectRows(me,me.tbPK,1,1).done(function(reg) {
			if (reg) {
				var novo_reg = new Object();
				for(key in reg) {
					if (key!=me.tbPK) {
						if (reseta_valores) {
							if (typeof(filtros.valor_ate) != 'undefined') {
								novo_reg.valor_ate = filtros.valor_ate;
							}
							if (typeof(filtros.valor_de) != 'undefined') {
								novo_reg.valor_de = filtros.valor_de;
							}
							if (typeof(filtros.raio) != 'undefined') {
								novo_reg.raio = filtros.raio;
							}
							if (typeof(filtros.tipo_carroceria) != 'undefined') {
								novo_reg.tipo_carroceria = String(filtros.tipo_carroceria);
							}
							if (typeof(filtros.tipo_veiculo) != 'undefined') {
								novo_reg.tipo_veiculo = String(filtros.tipo_veiculo);
							}
							if (typeof(filtros.tecnologia) != 'undefined') {
								novo_reg.tecnologia = String(filtros.tecnologia);
							}
							if (typeof(filtros.cidade_origem) != 'undefined') {
								novo_reg.cidade_origem = filtros.cidade_origem;
							}
							if (typeof(filtros.uf_origem) != 'undefined') {
								novo_reg.uf_origem = filtros.uf_origem;
							}
							if (typeof(filtros.regiao_origem) != 'undefined') {
								novo_reg.regiao_origem = filtros.regiao_origem;
							}
							if (typeof(filtros.cidade_destino) != 'undefined') {
								novo_reg.cidade_destino = filtros.cidade_destino;
							}
							if (typeof(filtros.uf_destino) != 'undefined') {
								novo_reg.uf_destino = filtros.uf_destino;
							}
							if (typeof(filtros.regiao_destino) != 'undefined') {
								novo_reg.regiao_destino = filtros.regiao_destino;
							}

							if(filtros.limpa_filtros == true) {
								novo_reg.valor_de = null;
								novo_reg.valor_ate = null;
								novo_reg.regiao_origem = null;
								novo_reg.uf_origem = null;
								novo_reg.cidade_origem = null;
								novo_reg.regiao_destino = null;
								novo_reg.uf_destino = null;
								novo_reg.cidade_destino = null;
							}
							// eval("reg."+key+"=(typeof(filtros."+key+")!='undefined' ? $.trim(filtros."+key+") : null);");
						} else {
							eval("novo_reg."+key+"=(typeof(filtros."+key+")!='undefined' ? $.trim(filtros."+key+") : reg."+key+");");
						}
					}
				}
				if(!novo_reg) {
					novo_reg = reg;
				}
				control.db.updateRow(me,novo_reg,1,1).done(function() {
					deferred.resolve('update');
				}).fail(function(msg) {
					deferred.reject(msg);
				});

			} else {
				control.db.insertRow(me,filtros,1,1).done(function() {
					deferred.resolve('insert');
				}).fail(function(msg) {
					deferred.reject(msg);
				});
			}
		}).fail(function() {
			control.db.insertRow(me,filtros,1,1).done(function() {
				deferred.resolve('insert');
			}).fail(function(msg) {
				deferred.reject(msg);
			});
		});
		return deferred.promise();
	}

	this.loadTableInfo = function(){
		this.tbName   = 'filtros';
		this.tbPK     = 'id';
		this.tbFields = {
			'id':              	'INTEGER PRIMARY KEY',
			'buscar_por':  		'TEXT',
			'regiao_origem':  	'TEXT',
            'uf_origem':      	'TEXT',
            'cidade_origem':  	'TEXT',
            'regiao_destino':  	'TEXT',
            'uf_destino':      	'TEXT',
            'cidade_destino':  	'TEXT',
            'valor_de': 	   	'TEXT',
            'valor_ate':	   	'TEXT',
            'raio': 			'TEXT',
            'tipo_veiculo': 	'TEXT',
            'tipo_carroceria': 	'TEXT',
            'tecnologia':       'TEXT'
        };
   	}//FINAL loadTableInfo

   	this.createTable = function(){
   		var deferred = $.Deferred();
   		console.log('create table filtros');
   		control.db.createTable(this).done(function(){
   			console.log('create table filtros - OK');
   			deferred.resolve();
   		}).fail(function(e){
   			deferred.reject(e);
   		})

   		return deferred.promise();
   	}

   	this.dropTable = function(){
   		var deferred = $.Deferred();

   		control.db.dropTable(this).done(function(){
   			deferred.resolve();
   		}).fail(function(e){
   			deferred.reject(e);
   		})
   		return deferred.promise();
   	}

   	this.habilitarOrigem = function(buscar_por){
   		if(buscar_por == 'proximo' || buscar_por == ''){
			$('#origem').css({'display':'none'});
			$('#raio').css({'display':'block'});
		}else if(buscar_por == 'cidade'){
			$('#origem').css({'display':'block'});
			$('#raio').css({'display':'none'});
		}
		localStorage.setItem('buscar_por', buscar_por);
   	}//FINAL habilitarOrigem

   	this.resetRegiaoOrigem = function(me){
   		setFieldValue(me.fm.find('[name=regiao_origem]'),"");
		me.fm.find('[name=regiao_origem]').trigger("change");
   	}//FINAL resetRegiaoOrigem
}//FINAL class PesquisaFreteClass