var MapaFretesClass = function(){
	this.data = null;
	this.$$ = null;
	this.arrEstados = null;
	this.arrRegioes = null;
	this.arrTiposVeiculo = null;

	this.map = null;

	this.lat = null;
	this.lng = null;

	this.googleMapWidth = null;
	this.googleMapHeight = null;

	this.loading = false;

	// Last loaded index
	this.lastIndex = 0;

	// Max items to load
	this.maxItems = 100;

	// Append items per load
	this.itemsPerLoad = 20;

	this.raio = 200;//200 KM

	this.init = function() {
		var me = this;

		this.setupView();
	}

	this.setupView = function() {
		var me = this;

		myApp.onPageInit('mapa-fretes', function(page) {
			me.$$ = Dom7;
			var pageContainer = $(page.container);

			me.googleMapWidth = $("#map_fretes").css('width');
			me.googleMapHeight = $("#map_fretes").css('height');

			var myContext = page.context;
			page.context.filtro = true;
			me.data = page.context;
			me.raio = me.data.filtros.raio;
			me.lat = me.data.lat;
			me.lng = me.data.lng;

			me.$$('.backToList').on('click',function(e) {
				// console.log(myContext);
				mainView.router.back({url:'fretes-proximos.html', context:myContext, ignoreCache: true, force: true});	
				e.preventDefault();
				e.stopPropagation();
			});

			me.$$('#btnInfo').on('click',function(e) {
				var view = $("#infoMapa").css("display");
				if (view=="none") {
					$("#infoMapa").slideDown();
					$(this).children().attr("src","img/icon/ico-seta-up.png");
				} else {
					$("#infoMapa").slideUp();
					$(this).children().attr("src","img/icon/ico-seta-down.png");
				}
			});
			me.initMap();
		});
	}

	this.initMap = function() {
		var deferred = $.Deferred();

		var pos = control.posicao.getLastPosition();
		console.log(pos);
		if (pos.lat != null && pos.lng != null) {
			var myLatLng = new google.maps.LatLng(pos.lat, pos.lng);//{lat: pos.lat , lng: pos.lng};
		} else {
			var myLatLng = new google.maps.LatLng(-23.549085, -46.633997);//{lat: -23.549085, lng: -46.633997};
		}

		this.map = new google.maps.Map(document.getElementById("map_fretes"), {
		  mapTypeControl: false,
		  scaleControl: false,
		  streetViewControl: false,
		  rotateControl: false,
		  scrollwheel: false,
		  fullscreenControl: false,
		  zoom: 5,
		  center: myLatLng
		});

		var myIcon = "img/mapa/truck.png";

		var marker = new google.maps.Marker({
		    position: myLatLng,
		    map: this.map,
		    icon: myIcon,
		    title: getText('VoceEstaAqui'),
		    animation: google.maps.Animation.DROP,
		});

		// var raioCircle = new google.maps.Circle({
		//       strokeColor: '#FF0000',
		//       strokeOpacity: 0.6,
		//       strokeWeight: 2,
		//       fillColor: '#FF0000',
		//       fillOpacity: 0.15,
		//       map: this.map,
		//       center: myLatLng,
		//       radius: this.raio * 1000
	 //    });

		this.map.setCenter(myLatLng);
		//this.map.fitBounds(raioCircle.getBounds());

		this.carregaFretes().done(function(fretes) {
			deferred.resolve(fretes);
		}).fail(function(erro) {
			deferred.reject(erro);
		});
		return deferred.promise();
	}

	this.carregaFretes = function() {
		var me = this;
		var deferred = $.Deferred();
		if(me.data != undefined && me.data.fretes != undefined) {//As informações vieram da pesquisa
			if(me.data.fretes != undefined){
				me.plotaFretes(me.data.fretes);	

				$('#infoMapa').css("display","block");
				var tot_fretes = (me.data.fretes != undefined)? me.data.fretes.length : 0;
				var storage_buscar_por = localStorage.getItem('buscar_por');
				if(storage_buscar_por == 'proximo'){
					$('#contentInfoMapa').html(tot_fretes+' '+getText('XFretesA')+' '+me.raio+getText('KmSuaLocalizacao'));
				}else if(storage_buscar_por == 'cidade'){
					$('#contentInfoMapa').html(tot_fretes+' '+getText('XFretes'));
				}else{
					$('#contentInfoMapa').html(tot_fretes+' '+getText('XFretesA')+' '+me.raio+getText('KmSuaLocalizacao'));
				}
				// console.log($('#contentInfoMapa').html());
				deferred.resolve(me.data.fretes);
			} else {
				deferred.resolve(null);
			}
		}else {
			deferred.reject(getText("FretesNaoEnviados"));
		}
		return deferred.promise();
	}

	this.plotaFretes = function(locations){

		var me = this;
		var latlngbounds = new google.maps.LatLngBounds();

		for(var i = 0; i < locations.length; i++) {

			var latLngFrete = {lat: parseFloat(locations[i].latitude_origem) , lng: parseFloat(locations[i].longitude_origem)};
			var markerFrete = new google.maps.Marker({
			    position: latLngFrete,
			    map: me.map,
			    title: 'Frete '+ i
			});
			latlngbounds.extend(latLngFrete);
// <a class="button detalhePin" href="javascript:abreDetalheFrete('+i+')">'+getText('VerDetalhes')+'</a>
			var contentString = '<div id="content" class="frete-box">'+
							      '<h3 id="firstHeading" class="firstHeading">'+locations[i].ofertante+'</h3>'+
							      '<div id="bodyContent">'+
							      	'<div>'+getText('De')+': '+locations[i].cidade_origem+ ' - '+ locations[i].uf_origem +'</div>' +
							      	'<div>'+getText('Para')+': '+locations[i].cidade_destino+ ' - '+ locations[i].uf_destino +'</div>' +
							      	'<div>'+getText('Valor')+': '+getMoneyAbreviation()+' '+locations[i].valor+'</div>' +
							      	'<div>'+getText('Retirada')+': '+locations[i].data_previsao_inicio+'</div>' +
							      	'<div>'+getText('Entrega')+': '+locations[i].data_previsao_entrega+'</div>' +
							      	'<p><button class="fullButton darkButton darkButtonBlue button100NoMargin" onclick="javascript:abreDetalheFrete('+i+')">'+getText('VerDetalhes')+'</button></p>'+
							      '</div>'+
							    '</div>';
			me.infoWindow(markerFrete, contentString);

		}
		me.map.fitBounds(latlngbounds);
		return true;
	}

	this.infoWindow = function(marker, contentString) {
		var me = this;
		var info = new google.maps.InfoWindow({
	    	content: contentString
	  	});

		marker.addListener('click', function() {
		    info.open(me.map, marker);
	  	});
	}
}