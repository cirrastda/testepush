var posicaoClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};

	this.lastInfo = null;

    this.lastPointPosition = null;
    this.lastPointTime     = null;
    this.routePoints       = [];

	this.init = function(){
		var deferred = $.Deferred();

		deferred.resolve();
		
		return deferred.promise();
	}

	this.setLastPosition = function(lat, lng){		
		setLocalValue('lastLatitude', lat);
		setLocalValue('lastLongitude', lng);		
	}

	this.getLastPosition = function(fmtGoogle){

		if(typeof fmtGoogle == 'undefined' || !fmtGoogle || typeof google == 'undefined'){
			return { 
				lat: getLocalValue('lastLatitude'), 
				lng: getLocalValue('lastLongitude') 
			};
		} else {
			return new google.maps.LatLng(parseFloat(getLocalValue('lastLatitude')), parseFloat(getLocalValue('lastLongitude')));
		}
	}

	this.addPosicao = function(){		
		var deferred   = $.Deferred(); 

		if (control.auth.checkAuthLocalizacao()) {
			control.comando.insertComando(99).done(function(){		          
				deferred.resolve();
			}).fail(function(msg){
				//Adicionar erro nao fatal ao fabric
	            ErrorClass.parseError('database','100072', { classe: 'posicao.class.js', metodo: 'addPosicao'},{mensagem_padrao:msg});	                 
				deferred.reject('[100072]'+msg);
			});	
		} else {
			deferred.reject('Posicionamento não autorizado');							
		}

		return deferred.promise();		
	}

    this.addRoutePoint = function(){
        var me = this;

        var deferred = $.Deferred();

        if(!getLocalValue('viag_codigo_sm') || !getLocalValue('sm_em_transito')){
        	deferred.reject();
        } else {

        	var pos = me.getLastPosition(true);

        	if(pos != me.lastPointPosition){
        		me.lastPointTime     = curTime();
        		me.lastPointPosition = pos;

        		me.routePoints.push(me.lastPointPosition);

        		if(mainView.activePage.name == 'info-viagem' && control.viagem.myRoute){
        			control.viagem.myRoute.setOptions({ path: me.routePoints });

        			control.viagem.carMarker.setPosition(me.lastPointPosition);
        			control.viagem.myBounds.extend(me.lastPointPosition);

        			if(control.viagem.mapMode == 'nav'){
        				control.viagem.myMap.panTo(me.lastPointPosition);
        			}
        		}
        	}

            deferred.resolve();
		}        

        return deferred.promise();
    }

    this.getRouteSM = function(){
        var me = this;

        var deferred = $.Deferred();

        if(!getLocalValue('viag_codigo_sm') || !getLocalValue('sm_em_transito')){
        	deferred.reject();
        } else {
        	control.db.selectRows(control.viagem, 'viag_codigo_sm', getLocalValue('viag_codigo_sm'), 1).done(function(viagem){
        		var sql = "SELECT latitude, longitude " + 
        		          "FROM comando " + 
        		          "WHERE data_cadastrada >= ? " + 
        		          "ORDER BY data_cadastrada ASC";

        		control.db.query(sql, [ viagem.viag_data_inicio_provisorio ]).done(function(pontos){
        			me.routePoints = [];

        			for(p in pontos){

        				if ((!isNaN(parseFloat(pontos[p]["latitude"]))) && (!isNaN(parseFloat(pontos[p]["longitude"])))) {
	        				var pos = new google.maps.LatLng(parseFloat(pontos[p]["latitude"]), parseFloat(pontos[p]["longitude"]));

	        				me.routePoints.push(pos);
	        				control.viagem.myBounds.extend(pos);
	        			}
        			}
        			console.log(me.lastPointPosition);
        			//getLocalValue('lastLatitude')
			
        			if ((!isNaN(me.lastPointPosition.lat)) && (!isNaN(me.lastPointPosition.lng))) {
						me.routePoints.push(me.lastPointPosition);
						control.viagem.myBounds.extend(me.lastPointPosition);
					}
					// console.log(control.viagem.myBounds);
					control.viagem.myMap.fitBounds(control.viagem.myBounds);

        			deferred.resolve(me.routePoints);
        		}).fail(function(e){
					//Adicionar erro nao fatal ao fabric
					ErrorClass.parseError('database','100062', { classe: 'posicao.class.js', metodo: 'getRouteSM'},{mensagem_padrao: e +' - SQL: '+sql});	
        			deferred.reject('[100062]'+e);
        		})
        	}).fail(function(e){
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100073', { classe: 'posicao.class.js', metodo: 'getRouteSM'},{mensagem_padrao: e +' - SQL: '+sql});	
        		deferred.reject(e);
        	});
		}        

        return deferred.promise();
    }





	this.syncAddRoutePoint = function(){
		var me = this;

		var deferred = $.Deferred(); 

		control.posicao.addRoutePoint().done(function(){
			deferred.resolve();
		}).fail(function(erro){
			//Adicionar erro nao fatal ao fabric
			//ErrorClass.parseError('generico','900006', { classe: 'posicao.class.js', metodo: 'syncAddRoutePoint'},{mensagem_padrao:"syncAddRoutePoint: Process error: "+ erro});			
			deferred.reject("[900006]syncAddRoutePoint: Process error");
		});

		return deferred.promise();
	}

	this.syncAddPosicao = function(){
		var me = this;

		var deferred = $.Deferred(); 

		control.posicao.addPosicao().done(function(){
			deferred.resolve("syncAddPosicao: Done.");
		}).fail(function(error){
			//Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900007', { classe: 'posicao.class.js', metodo: 'syncAddPosicao'},{mensagem_padrao:"syncAddPosicao: Process error:"+ error});			
			deferred.reject("[900007]syncAddPosicao: Process error");
		});

		return deferred.promise();
	}

	this.sincronizaPosicoes = function(posicoes){
	 	var me = this;	
        var deferred = $.Deferred();        
		me.sincronizaPosicoesTarget(deferred, posicoes, 0);
	}
	this.sincronizaPosicoesTarget = function(deferred, posicoes, cur){
		var me  = this;
		var len = posicoes.length;
        cur = (!cur || cur == "undefined") ? 0 : cur;
        if(cur < len){
			posicao = posicoes[cur];
			var linha = {
	            'latitude':        posicao[0].latitude,
	            'longitude':       posicao[0].longitude,
	            'data_cadastrada': posicao[0].data_inicial,
	            'mensagem':        "ATUALIZAR VIAGEM",
	            'codigo':          99,
	            'sent':            curTime()
	        }	        
			control.db.insertRow(control.comando, linha).always(function(retorno) {
                me.sincronizaPosicoesTarget(deferred, posicoes, (cur + 1));                     
            });
    	}else{
    		deferred.resolve('Sync completed: sincronizaPosicoes');
    	}
	}
}