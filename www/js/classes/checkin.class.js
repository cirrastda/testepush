
var CheckinClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};

	this.data = null;
	this.checkinData = null;
	this.geocoder = null;
	this.fm = null;
	this.$$ = null;
	this.arrEstados = null;

	this.complemento = null;
	this.numero = null;
	this.map = null;
	this.marker = null;

	this.localAlterado = false;

	this.init = function() {
		var me = this;

		this.loadTableInfo();

		this.setupView();
		if((typeof cordova != 'undefined') && (typeof cordova.plugins != 'undefined') && (typeof cordova.plugins.diagnostic !='undefined') && (config.appDevice != "browser") ){
			cordova.plugins.diagnostic.registerLocationStateChangeHandler(function(state){
			    if((device.platform === "Android" && state !== cordova.plugins.diagnostic.locationMode.LOCATION_OFF)
			        || (device.platform === "iOS") && ( state === cordova.plugins.diagnostic.permissionStatus.GRANTED
			            || state === cordova.plugins.diagnostic.permissionStatus.GRANTED_WHEN_IN_USE
			    )){
			        console.log("Location is available");
			    	me.getCurrentPosition();

			    }
			});
		}
	}

	this.loadFieldDestino = function() {
		var me = this;
		var deferred = $.Deferred();
		var d1 = getRegioes();
		var d2 = getEstados();
		$.when(d1,d2).then(function(regioes, estados) {
			var arrDestino = [];
			if (Object.keys(regioes).length>0) {
				arrDestino.push({
					name: 'Regiões',
					values: regioes
				});
			}
			if (Object.keys(estados).length>0) {
				arrDestino.push({
					name: 'Estados',
					values: estados
				});
			}
			me.arrDestino = arrDestino;
			deferred.resolve(arrDestino);
		}).fail(function(msg) {
			console.log('Erro ao carregar Destinos: '+msg);
			deferred.reject(msg);
		});
		return deferred.promise();
	}

	this.showModalDestino = function() {
		var me = this;
		var template = Dom7('#tplmodal').html();
		var modal = myApp.modal({
			title: 'Destino de Preferência',
			text: 'Possui um destino de preferência?',
			afterText: template,
			buttons: [
				{
					text: 'Cancelar',
				},
				{
					text: 'Confirmar',
					bold: true,
					close: false,
					onClick: function(obj) {
						if (me.getDataDestino()) {
							myApp.closeModal(obj);
							me.confirmCheckin();
						}
					}
				},
			]
		});
		me.$$('.add-destino').off('change').on('change', function () {
			var checked =($(this).val()=='S');
			if (checked) {
				$('.destino').show();
			} else {
				$('.destino').hide();
			}
		});
	}

	this.getDataDestino = function() {
		var me = this;
		$('#alertaAddDestino').hide();
		$('#alertaDestino').hide();
		var add_destino = $('input[name=add-destino]:checked').val();
		if (add_destino!='S' && add_destino!='N') {
			$('#alertaAddDestino').show();
			return false;
		}
		if (add_destino=='S') {
			var destino = $('#destino :selected').val();
			if (destino=='') {
				$('#alertaDestino').show();
				return false;
			}
			me.checkinData.destino = destino;

			var tipo = $('#destino :selected').parent().attr('label');
			me.checkinData.tipo_destino = (tipo=='Regiões'?'R':'E');
		} else {
			me.checkinData.destino = null;
			me.checkinData.tipo_destino = null;
		}
		return true;
	}

	this.showNotificacao = function(notificacao) {
		var me = this;
		$('#popTitulo').html(notificacao.titulo);
		$('#popTexto').html(notificacao.notificacao);
		mainView.hideNavbar();
		myApp.popup('.popup-notificacao', false);
		$('.popup-overlay').hide();
		$('.fechar_popup').click(function() {
			myApp.closeModal('.popup-notificacao', true);
			mainView.showNavbar();
			control.fretesProximos.loadView(true);
		});
	}

	this.confirmCheckin = function() {
		var me = this;
		var deferred = $.Deferred();
		myApp.showIndicator();
		me.checkinData.destino = null;
		me.checkinData.tipo_destino = null;

		incluirCheckin(me.checkinData,false).done(function(res){
			getCheckin().done(function(res){
				deferred.resolve(res);
				me.syncronize(res).done(function() {
					// var filtros = {
					// 	regiao_destino: res.codigo_regiao_destino,
					// 	estado_destino: res.codigo_estado_destino,
					// 	cidade_destino: ''
					// };
					// control.pesquisaFrete.saveFiltros(filtros,false).done(function() {
						// getNotificacao().done(function(res) {
						// 	if (res===null) {
						// 		control.fretesProximos.loadView(true);
						// 	} else {
						// 		res = {
						// 			titulo: res.mmob_titulo,
						// 			notificacao: res.mmob_mensagem
						// 		};
						// 		myApp.hideIndicator();
						// 		me.showNotificacao(res);
						// 	}
						// });
					// }).fail(function(msg) {
					// 	myApp.hideIndicator();
					// 	console.log('Erro ao atualizar filtros de pesquisa: '+msg);
					// });
					// control.db.selectRows(me,1,1).done(function(item) {
					// 	myApp.hideIndicator();
					// 	var item = item[0];
		   			//  myContext = {dados_checkin: item};
		   			//  console.log(myContext);
		   			//  mainView.router.load({url:'fretes-proximos.html', context:myContext, ignoreCache: true, force: true});
					// }).fail(function(msg) {
					// 	myApp.hideIndicator();
					// 	console.log('Erro ao carregar localização: '+msg);
					// });
					//mainView.router.loadPage('fretes-proximos.html');
				}).fail(function(msg) {
					//myApp.hideIndicator();
					console.log('Erro na sincronização de localização: '+msg);
				});
			}).fail(function(msg) {
				//myApp.hideIndicator();
				console.log('Erro ao retornar localização: '+msg);
			});
      	}).fail(function(erro){
			//myApp.hideIndicator();
        	myApp.alert(erro, 'Atenção');
		});
		return deferred.promise();
	}

	this.setupView = function() {
		var me = this;
		if (typeof google != "undefined") {
			me.geocoder = new google.maps.Geocoder;

			me.geocoder.geocode(function(){}, function(results, status) {});
			myApp.onPageInit('checkin', function(page) {
				me.$$ = Dom7;
				var pageContainer = $(page.container);
	            me.fm = pageContainer.find('form');

				me.$$('#btnConfirmar').on('click', function () {
					me.showModalDestino();
					//me.confirmCheckin();
				});

				me.$$('#btnAlterarLocal').on('click', function () {
					if (!me.data) me.data = {};
					if(me.data.arrEstados == null) {
						getEstados().done(function(estados) {
							me.arrEstados = estados;
							me.data.arrEstados = me.arrEstados;
							mainView.router.load({url:'alterar-local.html', context: me.data});
						});
					}else {
						mainView.router.load({url:'alterar-local.html', context: me.data});
					}
				});

				me.$$('.recarregar_posicao').on('click',function() {
					me.getCurrentPosition();
				});

				me.numero = "";
				me.complemento = "";
				me.localAlterado = page.context.localAlterado;
				if(page.context.localAlterado != undefined){//Foi alterado o local
					me.numero = page.context.numero;
					me.complemento = page.context.complemento;
					me.initMap("maps").done(function() {
						me.$$('#btnConfirmar').trigger("click");
					});
				}else {
					me.getCurrentPosition();
				}
			});
		}
	}

	this.changeButtonStatus = function(obj_id, disabled) {
		var selector = $('#'+obj_id);
		selector.attr('disabled',disabled);
		if (disabled) {
			selector.addClass("bg-gray");
		} else {
			selector.removeClass("bg-gray");
		}
	}

	this.getCurrentPosition = function() {

		var me = this;
		me.initMap("maps");
 		if((typeof cordova != 'undefined') && (typeof cordova.plugins != 'undefined') && (typeof cordova.plugins.diagnostic !='undefined') && (config.appDevice != "browser") ){
 			cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
			    console.log("GPS location is " + (enabled ? "enabled" : "disabled"));
			    if(enabled){
			    	myApp.showIndicator();
				    navigator.geolocation.getCurrentPosition(function(position) {
						console.log("getCurrentPosition");
						console.log(position);
						myApp.hideIndicator();
						control.posicoes.setLastPosition(position.coords.latitude, position.coords.longitude);
						me.updateMap();

					},
					function(error){
						myApp.hideIndicator();
						console.log(error);
					});	
				}else {
					me.limpaEndereco();
					var texto = "Nenhuma posição encontrada. Verifique o GPS!";
					$('#title_local').html(texto).removeClass('alert').addClass('alert');
					me.changeButtonStatus('btnConfirmar',true);
				}

			},function(msg) {
				console.log(msg);
			});   
		} else {
			me.limpaEndereco();
			var texto = "Nenhuma posição encontrada. Verifique o GPS!";
			$('#title_local').html(texto).removeClass('alert').addClass('alert');
			me.changeButtonStatus('btnConfirmar',true);
		}
	}

	this.getCurrentPositionMain = function() {
		var me = this;

		if((typeof cordova != 'undefined') && (typeof cordova.plugins != 'undefined') && (typeof cordova.plugins.diagnostic !='undefined') ){
 			cordova.plugins.diagnostic.isLocationEnabled(function(enabled){
				console.log("GPS location is " + (enabled ? "enabled" : "disabled"));
			    if(enabled){
                    var options = {
                        enableHighAccuracy: true,
                        timeout: 50000,
                        maximumAge: 0
                    };
				    navigator.geolocation.getCurrentPosition(function(position) {
						console.log("getCurrentPosition");
						console.log(position);
						control.posicoes.setLastPosition(position.coords.latitude, position.coords.longitude);
						// me.checkin.syncronize(res).done(function() {
						// 	//me.countFretesProximos();
						// });
					},
					function(error){
						console.log("Nao pegou current position");
						console.log(error);
					}, options);
				}else {
					me.limpaEndereco();
					var texto = "Nenhuma posição encontrada. Verifique o GPS!";
					$('#title_local').html(texto).removeClass('alert').addClass('alert');
					me.changeButtonStatus('btnConfirmar',true);
				}

			},function(msg) {
				console.log(msg);
			});
		}
	}

	this.updateMap = function(exibe_msg_erro) {
		var me = this;
		var deferred = $.Deferred();
		if (exibe_msg_erro==null || exibe_msg_erro==undefined) exibe_msg_erro = true;
		if(localStorage.getItem('lastLatitude')){

			var pos = control.posicao.getLastPosition();
			var myLatLng = {lat: pos.lat , lng: pos.lng};

			var marker = new google.maps.Marker({
			    position: myLatLng,
			    map: me.map,
			    title: 'Você está aqui'
			});

			me.marker = marker;

			me.map.setCenter(myLatLng);
			me.map.setZoom(15);

			//me.map.setVisible(true);
			$('#title_local').html("Seu local:").removeClass('alert');
			//$('#btnConfirmar').attr('disabled',false);
			me.changeButtonStatus('btnConfirmar',false);
			var d1 = this.getAddressByPosition(myLatLng);

			localStorage.removeItem('lastLatitude');
			localStorage.removeItem('lastLongitude');

			$.when(d1).then(function() {
				deferred.resolve();
			}).fail(function(msg) {
				deferred.reject(msg);
			});
		}else {
			//console.log("Não foi possível recuperar a posição atual. Por favor verifique se o GPS do seu aparelho está ligado.");
			//me.map.setVisible(true);
			me.limpaEndereco();
			$('#title_local').html("");
			if (exibe_msg_erro) {
				var texto = "Nenhuma posição encontrada. Verifique o GPS!";
				$('#title_local').html(texto).removeClass('alert').addClass('alert');
			}
			me.changeButtonStatus('btnConfirmar',true);

			deferred.reject("Nenhuma posição encontrada");
		}
		return deferred.promise();
	}

	this.getAddressByPosition = function (latlng){
		myApp.showIndicator();
		var me = this;
		me.$$ = Dom7;
		var deferred = $.Deferred();
		// console.log('CheckinClass | getAddressByPosition | latlng: ', latlng);
		if (me.geocoder == null) {
			if (typeof google !== "undefined") {
				me.geocoder = new google.maps.Geocoder;
			}
		}
		if (latlng == null) {
	    	myApp.alert(getErrorMessage('NaoFoiPossivelLocalizacao'),getAlertMessage('Atencao'));
	    	deferred.reject(getErrorMessage('NaoFoiPossivelLocalizacao'));
		} else {
			objLatLng = new google.maps.LatLng(latlng.lat, latlng.lng);
			me.geocoder.geocode({'location': objLatLng}, function(results, status) {
			    if (status === google.maps.GeocoderStatus.OK) {
			      	if (results[0]) {

			      		me.data = null;

			      		for(var i = 0; i < results.length; i++){
				      		if(results[i].types[0] == "street_address" || results[i].types[0] == "establishment" ||  results[i].types[0] == "postal_code") {

					      		var dados_endereco = results[i].address_components;
					      		var numero = "";
					      		if (!me.localAlterado) {
					      		//if(me.numero == ""){
									if(dados_endereco.length <= 8) {
										if(results[i].types[0] != "postal_code") {
											numero = (dados_endereco[0].long_name != undefined) ? dados_endereco[0].long_name : '';
										}
									}else {
										numero = (dados_endereco[1].long_name != undefined) ? dados_endereco[1].long_name : '';
									}
								//}
								} else {
									me.localAlterado = false;
								}
								if (numero!="") {
									var match = numero.match(/[^0-9]/);
									if (match) {
										numero_old = numero;
										numero = numero.substring(0,match.index);
										if (numero=="") {
											var numero_pos = numero_old.substring(match.index,numero_old.length);
											match = numero_pos.match(/[0-9]/);
											if (match) {
												numero = numero_pos.substring(match.index,numero_pos.length);
											}
										}
									}
									me.numero = numero;
								}

				      			me.loadAddress(dados_endereco,latlng);
					      		break;
					      	}
						}

						if(me.data != null) {
							var nro = (me.data.numero != "") ? ", " + me.data.numero : "";
							me.$$("#rua").html(me.data.endereco + nro);
							me.$$("#bairro").html(me.data.bairro);
							me.$$("#cidade_estado").html(me.data.cidade + " - " +me.data.estado);
							me.$$("#cep").html(me.data.cep);
							// console.log('CheckinClass | getAddressByPosition | dados_endereco: ', dados_endereco)
			      			deferred.resolve(dados_endereco);
						} else {
							deferred.reject("Endereço não identificado");
						}
			      	} else {
				    	myApp.alert(getErrorMessage('NaoFoiPossivelLocalizacao'),getAlertMessage('Atencao'));
				    	deferred.reject(getErrorMessage('NaoFoiPossivelLocalizacao'));
			      	}
			    } else {
			      	myApp.alert(getErrorMessage('FalhaBuscarLocalizacao')+': ' + status,getAlertMessage('Atencao'));
		        	deferred.reject(getErrorMessage('FalhaBuscarLocalizacao')+': ' + status);
			    }
			    myApp.hideIndicator();
		  	});
		}
		return deferred.promise();
	}

	this.loadAddress = function(dados_endereco, latlng){

		var me = this;
		var totIdx = dados_endereco.length;

		switch(totIdx){
			case 4:
				me.data = {
			      			numero : me.numero,
			      			endereco: '',
			      			complemento: me.complemento,
			      			bairro: '',
			      			cidade: (dados_endereco[1].long_name != undefined) ? dados_endereco[1].long_name : '',
			      			estado: (dados_endereco[2].short_name != undefined) ?dados_endereco[2].short_name : '',
			      			pais: (dados_endereco[3].long_name != undefined) ?dados_endereco[3].long_name : '',
			      			cep: (dados_endereco[0].long_name != undefined) ? dados_endereco[0].long_name: '',
			      			latitude: latlng.lat,
			      			longitude: latlng.lng
			      		};
	      		break;
			case 5:
				me.data = {
			      			numero : me.numero,
			      			endereco: '',
			      			complemento: me.complemento,
			      			bairro: '',
			      			cidade: (dados_endereco[2].long_name != undefined) ? dados_endereco[2].long_name : '',
			      			estado: (dados_endereco[3].short_name != undefined) ?dados_endereco[3].short_name : '',
			      			pais: (dados_endereco[4].long_name != undefined) ?dados_endereco[4].long_name : '',
			      			cep: (dados_endereco[0].long_name != undefined) ? dados_endereco[0].long_name: '',
			      			latitude: latlng.lat,
			      			longitude: latlng.lng
			      		};
	      		break;
			case 6:
				me.data = {
			      			numero : me.numero,
			      			endereco: (dados_endereco[1].long_name != undefined) ? dados_endereco[1].long_name : '',
			      			complemento: me.complemento,
			      			bairro: '',
			      			cidade: (dados_endereco[2].long_name != undefined) ? dados_endereco[2].long_name : '',
			      			estado: (dados_endereco[3].short_name != undefined) ?dados_endereco[3].short_name : '',
			      			pais: (dados_endereco[4].long_name != undefined) ?dados_endereco[4].long_name : '',
			      			cep: (dados_endereco[5].long_name != undefined) ? dados_endereco[5].long_name: '',
			      			latitude: latlng.lat,
			      			longitude: latlng.lng
			      		};
	      		break;
	      	case 7:
				me.data = {
			      			numero : me.numero,
			      			endereco: (dados_endereco[1].long_name != undefined) ? dados_endereco[1].long_name : '',
			      			complemento: me.complemento,
			      			bairro: (dados_endereco[2].long_name != undefined) ? dados_endereco[2].long_name : '',
			      			cidade: (dados_endereco[3].long_name != undefined) ? dados_endereco[3].long_name : '',
			      			estado: (dados_endereco[4].short_name != undefined) ?dados_endereco[4].short_name : '',
			      			pais: (dados_endereco[5].long_name != undefined) ?dados_endereco[5].long_name : '',
			      			cep: (dados_endereco[6].long_name != undefined) ? dados_endereco[6].long_name: '',
			      			latitude: latlng.lat,
			      			longitude: latlng.lng
			      		};
	      		break;

	      	case 8:
				me.data = {
			      			numero : me.numero,
			      			endereco: (dados_endereco[1].long_name != undefined) ? dados_endereco[1].long_name : '',
			      			complemento: me.complemento,
			      			bairro: (dados_endereco[2].long_name != undefined) ? dados_endereco[2].long_name : '',
			      			cidade: (dados_endereco[4].long_name != undefined) ? dados_endereco[4].long_name : '',
			      			estado: (dados_endereco[5].short_name != undefined) ?dados_endereco[5].short_name : '',
			      			pais: (dados_endereco[6].long_name != undefined) ?dados_endereco[6].long_name : '',
			      			cep: (dados_endereco[7].long_name != undefined) ? dados_endereco[7].long_name: '',
			      			latitude: latlng.lat,
			      			longitude: latlng.lng
			      		};
	      		break;

	      	case 9:
				me.data = {
			      			numero : me.numero,
			      			endereco: (dados_endereco[2].long_name != undefined) ? dados_endereco[2].long_name : '',
			      			complemento: me.complemento,
			      			bairro: (dados_endereco[3].long_name != undefined) ? dados_endereco[3].long_name : '',
			      			cidade: (dados_endereco[5].long_name != undefined) ? dados_endereco[5].long_name : '',
			      			estado: (dados_endereco[6].short_name != undefined) ?dados_endereco[6].short_name : '',
			      			pais: (dados_endereco[7].long_name != undefined) ?dados_endereco[7].long_name : '',
			      			cep: (dados_endereco[8].long_name != undefined) ? dados_endereco[8].long_name: '',
			      			latitude: latlng.lat,
			      			longitude: latlng.lng
			      		};
	      		break;
		}
		me.checkinData = me.data;
	}

	this.limpaEndereco = function() {
		this.$$("#rua").html("");
		this.$$("#bairro").html("");
		this.$$("#cidade_estado").html("");
		this.$$("#cep").html("");
	}

	this.loadTableInfo = function(){
		this.tbName   = 'checkin';
		this.tbPK     = 'id';
		this.tbFields = {
			'id':             			'INTEGER AUTOINCREMENT',
			'codigo':         			'INTEGER PRIMARY KEY',
			'codigo_profissional': 		'INTEGER',
			'codigo_documento': 		'TEXT',
			'cep':           			'TEXT',
			'endereco':       	 		'TEXT',
			'numero':        			'INTEGER',
			'complemento':       		'TEXT',
			'bairro': 		 			'TEXT',
			'codigo_cidade':  			'INTEGER',
			'cidade':  					'TEXT',
			'codigo_estado':  			'INTEGER',
			'estado':  					'TEXT',
			'latitude':  				'FLOAT',
			'longitude':  				'FLOAT',
			'codigo_estado_destino': 	'INTEGER',
			'codigo_regiao_destino': 	'INTEGER',
			'data_checkin': 		 	'TEXT',
		};
   	}

	this.clean = function(){
		var me = this;

		var deferred = $.Deferred();

		control.db.selectRows(me, 1, 1).done(function(item){
			for(i in item) {
				me.delete(item[i].id);
			}
			console.log("Resolve Limpa check-in");
			deferred.resolve();
		}).fail(function(){
			console.log("Falha Limpa check-in");
			deferred.reject();
		});

		return deferred.promise();
	}

	this.getCheckin = function() {
		var deferred = $.Deferred();

		var dateOffset = (24*60*60*1000); //5 days
		var myDate = new Date();
		myDate.setTime(myDate.getTime() - dateOffset);
		var dt = myDate.toLocaleString();
		var data = pad(myDate.getDate(),2)+"/"+pad((myDate.getMonth()+1),2)+"/"+pad(myDate.getFullYear(),4)+" "+pad(myDate.getHours(),2)+":"+pad(myDate.getMinutes(),2)+":"+pad(myDate.getSeconds(),2);
		var sql = 'SELECT * FROM ' + this.tbName + ' WHERE data_checkin >= ?';
		control.db.query(sql, [data], true).done(function(res){
			deferred.resolve(res);
		}).fail(function(e){
			console.log(e);
			deferred.reject();
		});
		return deferred.promise();
	}

	this.delete = function(id){
	  control.db.deleteRow(this,this.tbPK,id).fail(function (erro) {
	      console.log("Delete check-in: " + erro);    
	  });
	}

	this.syncronize = function(dados){
		var deferred = $.Deferred();
		var me = this;
		control.db.selectRows(this,1,1).done(function(item) {
			var qtd_reg = item.length;
			if (qtd_reg==0) {
				dados.id = 1;
				control.db.insertRow(me, dados).done(function(){
					// console.log('Incluido checkin');
			  		deferred.resolve();
				}).fail(function(m){
			  		deferred.reject(getErrorMessage('Erro')+': ' + m);
				});
			} else {
				var item = item[0];
				if (item.data_checkin != dados.data_checkin) {
					control.db.updateRow(me, dados, me.tbPK, item.id).done(function(){
						// console.log('Atualizado checkin');
				  		deferred.resolve();
					}).fail(function(m){
				  		deferred.reject(getErrorMessage('Erro')+': ' + m);
					});
				} else {
					deferred.resolve();
					// alert('Check-In igual');
					// console.log('Check-In já atual');
				}
			}
		}).fail(function(msg) {
			console.log('Erro ao retornar os dados da tabela checkin');
			deferred.reject(getErrorMessage('Erro')+': ' + msg);
		});
		return deferred.promise();
	}

   	this.createTable = function(){
   		var deferred = $.Deferred();

   		control.db.createTable(this).done(function(){
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
}