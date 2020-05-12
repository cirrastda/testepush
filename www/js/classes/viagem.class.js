var viagemClass = function(){
    this.tbName   = null;
    this.tbPK     = null;
    this.tbFields = {};

    this.myMap     = null;
    this.carMarker = null;
    this.myMarker  = null;
    this.myPoly    = null;
    this.myRect    = null;
    this.myCirc    = null;
    this.myRoute   = null;
    this.myRouteSM = null;
    this.myRenderer   = null;
    this.myBounds  = [];

    this.tmrEmptyMap = null;
    this.tempo_mapa = 120000;

    this.mapMode   = 'out';
    this.first_map = true;

    this.tmrCall = null;

    this.page = null;

    this.init = function(){
        var deferred = $.Deferred();

        this.loadTableInfo();

        this.setupView();

        deferred.resolve();

        return deferred.promise();
    }

    this.checkSincronismoPendente = function(dt_ref){
        var me = this;

        var deferred = $.Deferred();

        if(typeof dt_ref == "undefined") dt_ref = curTime();

        var sql = "SELECT ( " +
                  "    (SELECT COUNT(id) FROM alvo WHERE sent == '' OR sent IS NULL) " +
                  "  + (SELECT COUNT(id) FROM comando WHERE data_cadastrada <= ? AND (sent == '' OR sent IS NULL)) + " +
                  "  + (SELECT COUNT(id) FROM fotos WHERE (dt_sync_out == '' OR dt_sync_out IS NULL) AND (dt_sync_in == '' OR dt_sync_in IS NULL)) " +
                  ") AS total";

        control.db.query(sql, [ dt_ref ], 1).done(function(res){
            console.log(res.total);
            deferred.resolve(res.total);
        }).fail(function(msg){

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100018', { classe: 'viagem.class.js', metodo: 'checkSincronismoPendente'},{mensagem_padrao: msg + ' - SQL: '+sql});	                      
            deferred.reject();
        });

        return deferred.promise();
    }

    this.checkTudoSincronizado = function(){
        var me = this;

        control.db.selectRows(me, 1, 1, 1).done(function(res){
            if(res){
                if($.trim(res.viag_data_fim_provisorio)){
                    me.checkSincronismoPendente(res.viag_data_fim_provisorio).done(function(total){
                        if(!total){
                            console.log('Verificando sincronização: completa');

                            switch(mainView.activePage.name){
                                case 'entrega':
                                case 'info-viagem':
                                case 'viagem':
                                case 'itinerario':
                                    me.loadSemViagem();
                                    // mainView.router.load({ url: 'sem-viagem.html'});
                                break;
                            }

                            control.sync.escondeNotificacaoRede();
                        } else {
                            console.log('Verificando sincronização: pendente');

                            control.sync.notificarRede();

                            setTimeout(function(){
                                me.checkTudoSincronizado();
                            }, 5000);
                        }
                    });
                }
            } else {
                me.loadSemViagem();
                // mainView.router.load({ url: 'sem-viagem.html'});
            }
        });
    }

    this.getViagemCompleta = function(id){
        var me = this;

        var deferred = $.Deferred();

        var viag_codigo_sm = null;

        if(typeof id == "undefined" && getLocalValue('viag_codigo_sm')){
            viag_codigo_sm = getLocalValue('viag_codigo_sm');
        } else if(typeof id != "undefined"){
            viag_codigo_sm = id;
        }

        if(viag_codigo_sm == 'null') viag_codigo_sm = null;

        if(viag_codigo_sm){
            var sql = "SELECT trav.*, "+
                      "       ori.refe_descricao as origem, "+
                      "       dest.refe_descricao as destino, " +
                      "       dest.refe_latitude as refe_latitude, " +
                      "       dest.refe_longitude as refe_longitude " +
                      "FROM viagem trav " +
                      "LEFT JOIN alvo ori ON ori.viag_codigo_sm = trav.viag_codigo_sm AND ori.vloc_tpar_codigo = 4 " +
                      "LEFT JOIN alvo dest ON dest.viag_codigo_sm = trav.viag_codigo_sm AND dest.vloc_tpar_codigo = 5 " +
                      "WHERE trav.viag_codigo_sm = " + viag_codigo_sm;
            control.db.query(sql, [], 1).done(function(results){
                if(results){
                    setLocalValue('parada',results.parada);
                    control.alvo.getAlvos(viag_codigo_sm).done(function(alvos){
                        //var destino = alvos[alvos.length-1];
                        results['itinerario'] = alvos;
                        deferred.resolve(results);
                    }).fail(function(error){
                        
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('database','100019', { classe: 'viagem.class.js', metodo: 'getViagemCompleta'},{mensagem_padrao: + error.message + ' - SQL: '+sql});	                      
                        deferred.reject("[100019]Transaction Error: " + error.message);
                    });
                } else {
                    deferred.resolve(null);
                }
            }).fail( function(error) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100020', { classe: 'viagem.class.js', metodo: 'getViagemCompleta'},{mensagem_padrao: + error.message + ' - SQL: '+sql});	                  
                deferred.reject("[100020]Transaction Error: " + error.message);
            });
        } else {
            deferred.resolve(null);
        }

        return deferred.promise();
    }

    this.iniciarViagem = function(){
        var me             = this;
        var deferred       = $.Deferred();

        var viag_codigo_sm = getLocalValue('viag_codigo_sm');

        control.db.updateRow(me, { 'viag_data_inicio_provisorio': curTime() }, 'viag_codigo_sm', viag_codigo_sm).done(function(){
            control.comando.insertComando(1).done(function(){
                setLocalValue('sm_em_transito', 1);
                setLocalValue('parada', 0);

                //Configuracao dos dados do usuário para o fabric
                if (window.fabric) {
                    if(getLocalValue('sm_em_transito')=='1'){
                        window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                    }else{
                        window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                    }
                    if(getLocalValue(viag_codigo_sm) != null){
                        window.fabric.Crashlytics.setStringValueForKey(getLocalValue(viag_codigo_sm), "Código da SM");
                    }
                }

                deferred.resolve();
            }).fail(function(msg){

                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100021', { classe: 'viagem.class.js', metodo: 'iniciarViagem'},{mensagem_padrao: + msg.message });	                  
                deferred.reject('[100021]'+msg);
            });
        });

        return deferred.promise();
    }

    this.informarParada = function(motivo){
        var me = this;

        var deferred = $.Deferred();

        var viag_codigo_sm = getLocalValue('viag_codigo_sm');

        var parada = 0;
        var codigo = 2;

        if(motivo != 'REINICIO'){
            codigo = 4;
            parada = 1;
        } else {
            motivo = '';
        }

        control.db.updateRow(me, { 'parada': parada }, 'viag_codigo_sm', viag_codigo_sm).done(function(){
            control.comando.insertComando(codigo, motivo).done(function(){
                setLocalValue('parada', parada);
                deferred.resolve();
            }).fail(function(msg){
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100022', { classe: 'viagem.class.js', metodo: 'informarParada'},{mensagem_padrao: + msg.message });	                  
                deferred.reject('[100022]'+msg);
            });
        });

        return deferred.promise();
    }



    this.finalizarViagem = function(){
        var me             = this;
        var deferred       = $.Deferred();

        var viag_codigo_sm = getLocalValue('viag_codigo_sm');

        control.db.updateRow(me, { 'viag_data_fim_provisorio': curTime() }, 'viag_codigo_sm', viag_codigo_sm).done(function(){
            control.comando.insertComando(3).done(function(){
                setLocalValue('sm_em_transito', 0);
                setLocalValue('parada', 0);
                //Configuracao dos dados do usuário para o fabric
                if (window.fabric) {
                    if(getLocalValue('sm_em_transito')=='1'){
                        window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                    }else{
                        window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                    }
                }

                deferred.resolve();
            }).fail(function(msg){
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100074', { classe: 'viagem.class.js', metodo: 'finalizarViagem'},{mensagem_padrao: msg });	                  
                deferred.reject('[100074]'+msg);
            });
        });

        return deferred.promise();
    }

    this.posicionaAtual = function(timer) {
        var me = this;

        if (typeof timer=="undefined") timer = false;

        if (timer) {
            if (me.tmrEmptyMap) {
                clearTimeout(me.tmrEmptyMap);
            }
        }

        if (me.myMap) {
            me.myBounds = new google.maps.LatLngBounds();

            // pega a posicao atual do gps e insere no mapa
            var pAtual = control.posicao.getLastPosition();
            if (!isNaN(parseFloat(pAtual['lat']))) {
                var myPos  = new google.maps.LatLng(parseFloat(pAtual['lat']), parseFloat(pAtual['lng']));
                var marcador = true;
            } else {
                var myPos = new google.maps.LatLng(-23.613087, -46.640521);
                var marcador = false;
            }

            if (!me.carMarker) {
                if (marcador) {
                    me.carMarker = new google.maps.Marker({
                        position: myPos,
                        map:      me.myMap,
                        icon:     new google.maps.MarkerImage(('img/mapa/icon-maps2.png')),
                        // icon:     new google.maps.MarkerImage(('http://chart.apis.google.com/chart?chst=d_map_pin_letter&chld=%E2%80%A2|336699'),
                        //     new google.maps.Size(31, 45),
                        //     new google.maps.Point(0,0),
                        //     new google.maps.Point(13, 45)
                        // ),
                        shadow:   new google.maps.MarkerImage('http://chart.apis.google.com/chart?chst=d_map_pin_shadow',
                            new google.maps.Size(40, 37),
                            new google.maps.Point(0, 0),
                            new google.maps.Point(12, 35)
                        ),
                        animation: google.maps.Animation.DROP
                        //icon:     new google.maps.MarkerImage(('img/pin-truck.png'), new google.maps.Size(37, 37), new google.maps.Point(0, 0), new google.maps.Point(19, 37))
                    });
                }
                me.myMap.setCenter(myPos);
                me.myBounds.extend(myPos);
            } else {
                if (marcador) {
                    me.carMarker.setPosition(myPos);
                } else {
                    me.carMarker.setMap(null);
                    me.carMarker = null;
                }
                me.myMap.panTo(myPos);
            }
            try {
                if (me.first_map) {
                    if(typeof navigator.geolocation != 'undefined'){
                        navigator.geolocation.getCurrentPosition(function(p){
                            $('.noPosition').hide();
                            posicionando = true;
                        }, function(error){
                            posicionando = false;
                            $('.noPosition').show();
                        },
                        { maximumAge: 0, timeout: 5000, enableHighAccuracy: true });
                    }
                } else {
                    if (posicionando) {
                        $('.noPosition').hide();
                    } else {
                        $('.noPosition').show();
                    }

                }
            } catch(e) {
                $('.noPosition').hide();
            }

            if (timer) {
                var tempo = (posicionando ? me.tempo_mapa : 30000);
                me.tmrEmptyMap = setTimeout(function() {
                    me.posicionaAtual(true);
                }, tempo);
            }

            me.first_map = false;
        }
    }



    this.loadEmptyMap = function(pageContainer, selector) {
        var me = this;
        me.mapMode = 'out';
        if(typeof google != "undefined"){
            if(me.carMarker) me.carMarker.setMap(null);

            for(i in me.myMarker) me.myMarker[i].setMap(null);
            for(i in me.myCirc)   me.myCirc[i].setMap(null);
            for(i in me.myRect)   me.myRect[i].setMap(null);
            for(i in me.myPoly)   me.myPoly[i].setMap(null);

            me.carMarker = null;

            me.myMarker  = [];
            me.myCirc    = [];
            me.myRect    = [];
            me.myPoly    = [];

            if (typeof selector =="undefined") selector = '#mapaEntrega';
            var objMapa = pageContainer.find(selector);

            var botao = 0;
            if(pageContainer.find('.btnIniciarViagem').length) {
                botao = 66;
            }

            var toolbar = 0;
            if(pageContainer.find('.toolbar').length) {
                botao = 50;
            }

            objMapa.parent().height($('body').height() - objMapa.parent().position().top - botao - toolbar - 1);

            me.myMap = new google.maps.Map(objMapa[0], {
                zoom:             14,
                disableDefaultUI: true
            });

            //console.log(me.myMap);
            me.posicionaAtual(true);

        }
    }


    this.loadMap = function(pageContainer, selector){
        var me = this;

        if(!getLocalValue('viag_codigo_sm')) return false;

        me.mapMode = 'out';

        control.db.selectRows(control.alvo, 'viag_codigo_sm', getLocalValue('viag_codigo_sm'), false, 'vloc_sequencia').done(function (objSel) {
            if(typeof google != "undefined"){
                if(me.carMarker) me.carMarker.setMap(null);

                for(i in me.myMarker) me.myMarker[i].setMap(null);
                for(i in me.myCirc)   me.myCirc[i].setMap(null);
                for(i in me.myRect)   me.myRect[i].setMap(null);
                for(i in me.myPoly)   me.myPoly[i].setMap(null);

                me.carMarker = null;

                me.myMarker  = [];
                me.myCirc    = [];
                me.myRect    = [];
                me.myPoly    = [];

                if (typeof selector =="undefined") selector = '#mapaEntrega';

                var objMapa = pageContainer.find(selector);

                var botao = 0;
                if(pageContainer.find('.btnIniciarViagem').length) {
                    botao = 66;
                }

                var toolbar = 0;
                if(pageContainer.find('.toolbar').length) {
                    toolbar = 50;
                }

                objMapa.parent().height($('body').height() - objMapa.parent().position().top - botao - toolbar - 1);

                me.myMap = new google.maps.Map(objMapa[0], {
                    zoom:             14,
                    disableDefaultUI: true
                });

                // me.posicionaAtual(true);

                me.myBounds = new google.maps.LatLngBounds();

                // pega a posicao atual do gps e insere no mapa
                var pAtual = control.posicao.getLastPosition();
                if (!isNaN(parseFloat(pAtual['lat']))) {
                    var myPos  = new google.maps.LatLng(parseFloat(pAtual['lat']), parseFloat(pAtual['lng']));
                    var marcador = true;
                } else {
                    var myPos = new google.maps.LatLng(-23.613087, -46.640521);
                    var marcador = false;
                }
                // var myPos  = new google.maps.LatLng(parseFloat(pAtual['lat']), parseFloat(pAtual['lng']));

                me.carMarker = new google.maps.Marker({
                    position: myPos,
                    map:      me.myMap,
                    icon:     new google.maps.MarkerImage(('img/mapa/carro-icone-mapa.png'), new google.maps.Size(37, 37), new google.maps.Point(0, 0), new google.maps.Point(19, 37))
                });

                me.myMap.setCenter(myPos);
                me.myBounds.extend(myPos);

                // pega os alvos e insere no mapa
                var myOrigem    = null;
                var myDestino   = null;
                var myWaypoints = [];

                for (i in objSel){
                    var alvoAtual = objSel[i];

                    var areaTipo = '';
                    var areaRefs = '';

                    var coordAlvo = new google.maps.LatLng(parseFloat(alvoAtual.refe_latitude), parseFloat(alvoAtual.refe_longitude));

                    if(alvoAtual.refe_circulo){
                        areaTipo = 'circulo';
                        areaRefs = $.trim(alvoAtual.refe_raio);
                    } else if($.trim(alvoAtual.refe_poligono)){
                        areaTipo = 'poligono';
                        areaRefs = $.trim(alvoAtual.refe_poligono);
                    } else {
                        areaTipo = 'quadrado';
                        areaRefs = alvoAtual.refe_latitude_min + ' ' + alvoAtual.refe_longitude_min + ',' + alvoAtual.refe_latitude_max + ' ' + alvoAtual.refe_longitude_max;
                    }

                    switch(areaTipo){
                        case 'circulo':
                            me.myCirc.push(new google.maps.Circle({
                                strokeColor:   '#AAAAEE',
                                strokeOpacity: 0.6,
                                strokeWeight:  2,
                                fillColor:     '#AAAAFF',
                                fillOpacity:   0.5,
                                map:           me.myMap,
                                center:        coordAlvo,
                                radius:        parseInt(areaRefs)
                            }));

                            me.myBounds.extend(coordAlvo);
                        break;

                        case 'quadrado':
                            var refs    = areaRefs.split(',');
                            var refsMin = refs[0].split(' ');
                            var refsMax = refs[1].split(' ');

                            me.myRect.push(new google.maps.Rectangle({
                                strokeColor:   '#AAAAEE',
                                strokeOpacity: 0.6,
                                strokeWeight:  2,
                                fillColor:     '#AAAAFF',
                                fillOpacity:   0.5,
                                map:           me.myMap,
                                bounds:        new google.maps.LatLngBounds(new google.maps.LatLng(refsMin[0], refsMin[1]), new google.maps.LatLng(refsMax[0], refsMax[1]))
                            }));

                            me.myBounds.extend(new google.maps.LatLng(refsMin[0], refsMin[1]), new google.maps.LatLng(refsMax[0], refsMax[1]));
                        break;

                        case 'poligono':
                            var path = new google.maps.MVCArray;

                            var refs  = areaRefs.split(',');
                            var refsP = [];

                            for(p in refs){
                                refsP = refs[p].split(' ');
                                path.insertAt(p, new google.maps.LatLng(refsP[0], refsP[1]));

                                me.myBounds.extend(new google.maps.LatLng(refsP[0], refsP[1]));
                            }

                            me.myPoly.push(new google.maps.Polygon({
                                strokeColor:   '#AAAAEE',
                                strokeOpacity: 0.6,
                                strokeWeight:  2,
                                fillColor:     '#AAAAFF',
                                fillOpacity:   0.5,
                                map:           me.myMap,
                                paths:         path
                            }));
                        break;
                    }

                    me.myMarker.push(new google.maps.Marker({
                        position: coordAlvo,
                        map:      me.myMap,
                        icon:     new google.maps.MarkerImage(('img/mapa/' + (alvoAtual.vloc_sequencia == 1 ? 'icon-origem-vermelho' : 'endereco-icone-azul') + '.png'), new google.maps.Size(19, 37), new google.maps.Point(0, 0), new google.maps.Point(9, 37))
                    }));

                    if(alvoAtual.vloc_sequencia != 1 && alvoAtual.vloc_sequencia != 99999){
                        myWaypoints.push({ location: coordAlvo });
                    } else if(alvoAtual.vloc_sequencia == 1){
                        myOrigem = coordAlvo;
                    } else if(alvoAtual.vloc_sequencia == 99999){
                        myDestino = coordAlvo;
                    }
                }

                if (myOrigem != null && myDestino != null) {
                    var request = {
                        origin: myOrigem,
                        destination: myDestino,
                        waypoints: myWaypoints,
                        travelMode: google.maps.TravelMode.DRIVING,
                        provideRouteAlternatives: true
                    }
                    me.myRouteSM = new google.maps.DirectionsService();
                    me.myRouteSM.route(request, function(response, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            me.myRenderer = new google.maps.DirectionsRenderer({
                                draggable: false,
                                markerOptions: {
                                    draggable: false
                                },
                                suppressMarkers: true
                            });
                            me.myRenderer.setDirections(response);
                            me.myRenderer.setMap(me.myMap);
                        }
                    });

                }
                control.posicao.getRouteSM().done(function(rota){
                    // console.log(rota);
                    me.myRoute = new google.maps.Polyline({
                        path:          rota,
                        geodesic:      true,
                        strokeColor:   '#FF0000',
                        strokeOpacity: 1.0,
                        strokeWeight:  2,
                        map:           me.myMap
                    });
                });

                $(window).resize(function() {
                    if ($('.viagem_andamento').css('display')!='none') {
                        objMapa.parent().height($('body').height() - objMapa.parent().position().top - $('.viagem_andamento').height() - botao - toolbar - 1);
                    } else {
                        objMapa.parent().height($('body').height() - objMapa.parent().position().top - botao - toolbar - 1);
                    }
                })
            }
        });
    }



    this.pesquisarViagemPlaca = function() {
        var deferred = $.Deferred();
        var placa = $(".placa").val();
        if (placa=="") {
            deferred.reject("Placa não informada");
        } else {
            getViagemPlaca(placa).done(function(ret) {
                deferred.resolve(ret);
            }).fail(function(msg) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100075', { classe: 'viagem.class.js', metodo: 'pesquisarViagemPlaca'},{mensagem_padrao: msg });	                  
                deferred.reject(msg);
            })
        }
        return deferred.promise();

    }

    this.checkAlvoOrigem = function() {
        var deferred = $.Deferred();
        var codigo_sm = getLocalValue('viag_codigo_sm');
        control.alvo.getOrigem(codigo_sm).done(function(origem) {
            var lat = getLocalValue('lastLatitude');
            var lng = getLocalValue('lastLongitude');
            if (lat!=null && lat!=undefined && lng!=null && lng!=undefined) {
                if ((parseFloat(lat) >= parseFloat(origem.refe_latitude_min) && parseFloat(lat) <= parseFloat(origem.refe_latitude_max) ) &&
                    (parseFloat(lng) >= parseFloat(origem.refe_longitude_min) && parseFloat(lng) <= parseFloat(origem.refe_longitude_max) ) ) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            } else {
                deferred.resolve(false);
            }
        }).fail(function(erro) {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100076', { classe: 'viagem.class.js', metodo: 'checkAlvoOrigem'},{mensagem_padrao: "Erro ao recuperar dados de origem: "+erro });	                     
            console.log("Erro ao recuperar dados de origem: "+erro);
            deferred.reject('[100076]'+erro);
        });
        return deferred.promise();
    }

    this.abreMenuViagem = function(tipo) {
        var me = this;
        // if (typeof tipo == "undefined") tipo = "load";
        // mainView.showNavbar();
        var deferred = $.Deferred();
        if (getLocalValue('sm_em_transito')=='1') {
            me.dados_viagem.sm_em_transito = 1;
        }


        if (me.dados_viagem.viag_tecnologia!=config.tecnologia_mobile) {
            me.dados_viagem.libera_inicio = 0;
            me.dados_viagem.libera_operacoes = 0;
            me.dados_viagem.libera_parada = 0;
            me.dados_viagem.libera_reinicio = 0;
        } else if(me.dados_viagem.sm_em_transito==1) {
            me.dados_viagem.libera_inicio = 0;
            me.dados_viagem.libera_operacoes = 1;
            if (getLocalValue('parada')=='1') {
                me.dados_viagem.libera_parada = 0;
                me.dados_viagem.libera_reinicio = 1;
            } else {
                me.dados_viagem.libera_parada = 1;
                me.dados_viagem.libera_reinicio = 0;
            }
        } else {
            me.dados_viagem.libera_inicio = 1;
            me.dados_viagem.libera_operacoes = 0;
            me.dados_viagem.libera_parada = 0;
            me.dados_viagem.libera_reinicio = 0;
        }
        if (me.dados_viagem.libera_inicio==0 && me.dados_viagem.libera_operacoes==0) {
            $('.divMenuViagem').slideUp();
            deferred.resolve('hide');
        } else {
            var divMenu = $('.divMenuViagem');
            if (tipo=='reload') {
                $('.divMenuViagem').slideUp();
            }
            me.loadMenuViagem("menu-viagem.html",me.dados_viagem, divMenu).done(function(html) {
                $(".divMenuViagem").slideDown();
                me.carregarAcoesMenu();
                translate(getLocalValue('language'));
                window.setTimeout(function() {
                    me.resizeMapa('.mapaPosicao');
                },100);
                deferred.resolve('show');
            }).fail(function(msg) {
                deferred.reject(msg);
            });

        }
        return deferred.promise();

        //console.log(me.dados_viagem);
        // if (tipo=="back") {
        //     mainView.router.back( {url: 'menu-viagem.html', context: me.dados_viagem, ignoreCache: true, force: true });
        // } else {
        //     mainView.router.loadPage( {url: 'menu-viagem.html', context: me.dados_viagem, ignoreCache: true});

        // }
    }

    this.resizeMapa = function(selector) {
        if (typeof selector =="undefined") selector = '#mapaEntrega';
        var objMapa = $(selector);

        var botao = 0;
        if($('.btnIniciarViagem').length) {
            botao = 66;
        }

        var toolbar = 0;
        if($('.toolbar').length) {
            toolbar = 50;
        }

        var navbar = 0;
        if($('.navbar').length) {
            navbar = 44;
        }

        console.log($('.viagem_andamento').css('display'));
        if ($('.viagem_andamento').css('display')!='none') {
            objMapa.parent().height($('body').height() - objMapa.parent().position().top - $('.viagem_andamento').height() - botao - toolbar - navbar - 1);
            $(window).trigger('resize');
        } else {
            objMapa.parent().height($('body').height() - objMapa.parent().position().top - botao - toolbar - navbar - 1);
            $(window).trigger('resize');
        }
        
        // $('.mapaPosicao').css('height',height);
    }

    this.getHistorico = function() {
        var me = this;

        var deferred = $.Deferred();

        me.getViagemCompleta(getLocalValue('viag_codigo_sm')).done(function(dados) {

            var query = "";
            query += "SELECT CASE WHEN codigo = 98 THEN 'ENVIO DE MENSAGEM' ELSE REPLACE(mensagem,'PARADA ','') END AS mensagem, ";
            query += "data_cadastrada, CAST(data_cadastrada AS datetime) as data ";
            query += "FROM comando ";
            query += "WHERE mensagem <> 'ATUALIZAR VIAGEM' AND codigo <> 99 AND data_cadastrada >= '"+dados.viag_data_inicio+"' ";
            query += "UNION ";
            query += "SELECT CASE WHEN COALESCE(alvo.confirmtime,'') <> '' THEN 'ENTREGA FINALIZADA' WHEN COALESCE(alvo.rejeicao_data,'') <> '' THEN 'ENTREGA REJEITADA' ELSE '' END AS mensagem, ";
            query += "COALESCE(alvo.confirmtime,alvo.rejeicao_data) AS data_cadastrada, CAST(COALESCE(alvo.confirmtime,alvo.rejeicao_data) AS datetime) as data ";
            query += "FROM alvo ";
            query += "WHERE ((COALESCE(confirmtime,'') <> '' or COALESCE(rejeicao_data,'') <> '')) ";
            query += " AND viag_codigo_sm = "+getLocalValue('viag_codigo_sm')+" ";
            query += "UNION ";
            query += "SELECT CASE WHEN remover = 1 THEN 'EXCLUSAO DE FOTO' ELSE 'ENVIO DE FOTO' END AS mensagem, ";
            query += "CASE WHEN remover = 1 THEN dt_alt ELSE dt_inc END AS data_cadastrada, CAST(CASE WHEN remover = 1 THEN dt_alt ELSE dt_inc END AS datetime) as data ";
            query += "FROM fotos ";
            query += " JOIN alvo ON fotos.vloc_codigo = alvo.vloc_codigo ";
            query += "WHERE viag_codigo_sm = "+getLocalValue('viag_codigo_sm')+" ";
            query += "ORDER BY data_cadastrada";
            console.log(query);
            control.db.query(query).done(function(res){
                var arrRegistros = [];
                if(res){

                    for(idx in res) arrRegistros.push(res[idx]);

                    deferred.resolve(arrRegistros);
                } else {
                    deferred.resolve(arrRegistros);
                }
            }).fail(function(msg){
                console.log(msg);
                console.log(query);
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100077', { classe: 'viagem.class.js', metodo: 'getHistorico'},{mensagem_padrao: msg });	                     
                deferred.reject('[100077]'+msg);
            });
        });
        return deferred.promise();

    }

    this.getStatusHistorico = function(mensagem) {
        var status = '';
        switch(mensagem) {
            case 'INICIO DE VIAGEM':
                status = 'historico-inicio-viagem';
                break;
            case 'FIM DE VIAGEM':
                status = 'historico-fim-viagem';
                break;
            case 'ENTREGA REJEITADA':
                status = 'historico-entrega-recusada';
                break;
            case 'ENTREGA FINALIZADA':
                status = 'historico-entrega-finalizada';
                break;
            case 'REINICIO DE VIAGEM':
                status = 'historico-reinicio-viagem';
                break;
            case 'REFEICAO':
                status = 'historico-refeicao';
                break;
            case 'ABASTECIMENTO':
                status = 'historico-abastecimento';
                break;
            case 'PERNOITE':
                status = 'historico-pernoite';
                break;
            case 'ENVIO DE MENSAGEM':
                status = 'historico-mensagem';
                break;
            case 'ENVIO DE FOTO':
                status = 'historico-arquivo-anexado';
                break;
            case 'EXCLUSAO DE FOTO':
                status = 'historico-arquivo-excluido';
                break;
        }
        if (mensagem=='INICIO DE VIAGEM' || mensagem=='FIM DE VIAGEM') {
            var imagem = 'play_fill';
        } else {
            var imagem = 'circle_fill';
        }

        return {
            'status': status,
            'imagem': imagem
        };
    }

    this.abreMenuHistorico = function() {
        var me = this;
        var codigo_sm = getLocalValue('viag_codigo_sm');
        me.getHistorico().done(function(historico) {
            //console.log(historico);
            $.each(historico, function(i, item) {
                historico[i].status = me.getStatusHistorico(item.mensagem);
                historico[i].data_formatada = formataDataView(item.data_cadastrada);
            });
            var context = {
                dados_viagem: me.dados_viagem,
                historico: historico
            }
            mainView.showNavbar();
            mainView.router.loadPage( {url: 'historico.html', context: context, ignoreCache: true});

        });




    }

    this.mensagemBomDia = function() {
        var deferred = $.Deferred();
        var d = new Date();
        var h = d.getHours();
        if (h < 12) {
            getText('BomDia',true).done(function(msg){
                deferred.resolve(msg);
            });
        } else if(h<18) {
            getText('BoaTarde',true).done(function(msg){
                deferred.resolve(msg);
            });
        } else {
            getText('BoaNoite',true).done(function(msg){
                deferred.resolve(msg);
            });
        }
        return deferred.promise();

    }


    this.mensagemPendentes = function() {
        var me = this;
        var deferred = $.Deferred();
        var sm_transito = getLocalValue('sm_em_transito');
        me.mensagemBomDia().done(function(msgBomDia) {
            if (sm_transito==0) {
                var msg = msgBomDia+"!<br/>";
                msg+=getText('DeveIniciarViagem')+".";
                deferred.resolve(msg);
            } else {
                control.alvo.getTotalEntregasPendentes().done(function(total) {
                    var msg = getText('TemParaConcluir')+"<br/>";
                    msg += String(total)+' '+getText('Entregas');
                    deferred.resolve(msg);
                }).fail(function () {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database','100078', { classe: 'viagem.class.js', metodo: 'mensagemPendentes'},{mensagem_padrao: 'Erro ao  recuperar entregas pendentes' });	                     
                    deferred.reject('[100078]'+getErrorMessage('ErroEntregasPendentes'));
                });
            }
        });
        return deferred.promise();
    }

    this.getPergunta = function(tipo) {
        var pergunta = "";
        switch(tipo) {
            case "abastecimento":
                pergunta = getAlertMessage('DesejaSinalizarAbastecimento');
                break;
            case "refeicao":
                pergunta = getAlertMessage('DesejaSinalizarRefeicao');
                break;
            case "pernoite":
                pergunta = getAlertMessage('DesejaSinalizarPernoite');
                break;
            case "reinicio":
                pergunta = getAlertMessage('DesejaReiniciarViagem');
                break;
        }
        return pergunta;
    }

    this.registrarParada = function(e, tipo) {
        var me = this;
        var deferred = $.Deferred();
        myApp.showPreloader(getLoadingMessage('Carregando')+'...');
        me.getViagemCompleta(me.dados_viagem.viag_codigo_sm).done(function(dados) {
            if (dados.viag_data_fim_provisorio==null || dados.viag_data_fim_provisorio=="") {
                motivo = tipo;
                motivo = motivo.toUpperCase();
                var lat = getLocalValue('lastLatitude');
                var lng = getLocalValue('lastLongitude');
                if (lat==null || lat==undefined || lng==null || lng==undefined) {
                    myApp.hidePreloader();
                    deferred.reject('sem_posicao');
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('generico','900059', { classe: 'alvo.class.js', metodo: 'registrarParada'},{mensagem_padrao: 'Seu aparelho não registrou nenhuma posição. Por favor, verifique seu GPS'});	                   
                       
                    myApp.alert('[900059]'+getErrorMessage('AparelhoNaoRegistrouPosicao')+'. '+getErrorMessage('VerifiqueGPS'),getAlertMessage('Atencao'));
                } else {
                    myApp.hidePreloader();
                    var pergunta = me.getPergunta(tipo).toUpperCase();
                    me.modalConfirm(pergunta, function() {
                        myApp.showPreloader(getLoadingMessage('Carregando')+'...');
                        control.viagem.informarParada(motivo).always(function(){
                            myApp.hidePreloader();
                            deferred.resolve();
                        });
                    });
                }
            } else {
                myApp.hidePreloader();
                myApp.alert(getAlertMessage('ViagemJaFinalizada')+ '. '+getAlertMessage('AguardandoSincronizacaoDados'), getAlertMessage('Atencao'));
                deferred.reject('ja_finalizada');
            }
        });

        return deferred.promise();
    }


    this.loadEnviarMensagem = function() {
        var me = this;
        me.getViagemCompleta(me.dados_viagem.viag_codigo_sm).done(function(dados) {
            if (dados.viag_data_fim_provisorio==null || dados.viag_data_fim_provisorio=="") {
                var lat = getLocalValue('lastLatitude');
                var lng = getLocalValue('lastLongitude');
                if (lat==null || lat==undefined || lng==null || lng==undefined) {
                    myApp.hidePreloader();
                     //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('generico','900059', { classe: 'alvo.class.js', metodo: 'registrarParada'},{mensagem_padrao: 'Seu aparelho não registrou nenhuma posição. Por favor, verifique seu GPS'});	                   
                    myApp.alert('[900059]'+getErrorMessage('AparelhoNaoRegistrouPosicao')+'. '+getErrorMessage('VerifiqueGPS'),getAlertMessage('Atencao'));
                } else {
                    myApp.hidePreloader();
                    mainView.showNavbar();
                    if (getLocalValue('sm_em_transito')=='1') {
                        me.dados_viagem.sm_em_transito = 1;
                    }
                    mainView.router.loadPage( {url: 'enviar-mensagem.html', context: me.dados_viagem});
                }
            } else {
                myApp.hidePreloader();
                myApp.alert(getAlertMessage('ViagemJaFinalizada')+ '. '+getAlertMessage('AguardandoSincronizacaoDados'), getAlertMessage('Atencao'));
            }
        });

    }

    this.modalConfirm = function(msg, callbackOK) {

        var modalOptions = {
            title: "<img src='img/modal-title.png' width='30px' />",
            text: msg,
            buttons: [
                {
                    text: getText('Nao'),
                    close: true
                },
                {
                    text: getText('Sim'),
                    onClick: callbackOK,
                    close: true
                }
            ]
        };
        myApp.modal(modalOptions);
    }

    this.timerCallUpdate = function(page) {
        var pageContainer = $(page.container);
        if (control.freeCall.time_start_call==null) {
            control.freeCall.time_start_call = $.now();
        }
        var agora = $.now();
        var diff = agora - control.freeCall.time_start_call;
        var tempo = miliseconds_to_minutes(diff);
        pageContainer.find('.divTempoChamada').html(tempo);

    }

    this.startTimerCall = function(page) {
        var me = this;
        var pageContainer = $(page.container);
        if (me.tmrCall) {
            //alert('teste');
            me.stopTimerCall(page);
        }
        //alert(control.freeCall.time_start_call);
        if (!me.tmrCall) {
            //alert('set timer');
            me.tmrCall = setInterval(function() {
                me.timerCallUpdate(page);
            },1000);
        }

    }

    this.stopTimerCall = function(page) {
        var me = this;
        var pageContainer = $(page.container);
        if (me.tmrCall) {
            clearInterval(me.tmrCall);
            me.tmrCall = null;
        }
        control.freeCall.time_start_call = null;
        pageContainer.find('.divTempoChamada').html('00:00');
    }

    this.showCalling = function(page) {
        var me = this;
        if (page==null || page==undefined) page = me.page;
        var pageContainer = $(page.container);
        pageContainer.find('.divChamada').show();
        if (page.name=='sem-viagem') {
            $('.chamada_sem').hide();
        } else {
            $('.chamada').hide();
        }
        me.startTimerCall(page);
        mainView.hideToolbar();
    }

    this.hideCalling = function(page) {
        var me = this;
        if (page==null || page==undefined) page = me.page;
        var pageContainer = $(page.container);
        pageContainer.find('.divChamada').hide();
        if (page.name=='sem-viagem') {
            $('.chamada_sem').show();
        } else {
            $('.chamada').show();
        }
        me.stopTimerCall(page);
        mainView.showToolbar();
    }

    this.openWaze = function(e) {
        e.preventDefault();
        var wazeLocation = $(this).attr('data-url');
        wazeLocation = wazeLocation.substring(wazeLocation.indexOf("=") + 1);
        wazeLocation = wazeLocation.substring(0,wazeLocation.indexOf("&"));          
        var app;
        launchnavigator.isAppAvailable(launchnavigator.APP.WAZE, function(isAvailable){
          
            if(isAvailable){
                app = launchnavigator.APP.WAZE;
            }else{
                console.warn("Waze não disponível");
                app = launchnavigator.APP.USER_SELECT;
            }
       
            launchnavigator.navigate(wazeLocation, {
                app: app
            });
        });        
    }

    this.openMenuEntregas = function(e, page) {
        var me= this;
        e.preventDefault();
        me.loadPanelEntregas().done(function() {
            control.alvo.mapEventsEntregas(page);
        });

    }

    this.reloadViagem = function(type) {
        myApp.showIndicator();
        if (typeof type === "undefined") type = "load";
        control.viagem.getViagemCompleta().done(function(viagem_atual){
            setTimeout(function(){ 
                mainView.showNavbar(); 
                if (type=="back") {
                    mainView.router.back({ url: 'viagem.html', context: viagem_atual, reload: true, ignoreCache: true }); 
                } else {
                    mainView.router.load({ url: 'viagem.html', context: viagem_atual, reload: true, ignoreCache: true }); 
                }
                myApp.hideIndicator(); 
            }, 100);
        });
    }

    this.loadSemViagem = function(type) {
        mainView.showNavbar();
        if (type=='back') {
            mainView.router.back({ url: 'sem-viagem.html'});
        } else {
            mainView.router.load({ url: 'sem-viagem.html'});
        }
    }

    this.carregarAcoesMenu = function(page) {
        var me = this;
        Dom7('.iniciar_viagem').off('click').on('click', function(e){
            e.preventDefault();
            e.stopPropagation();
            var lat = getLocalValue('lastLatitude');
            var lng = getLocalValue('lastLongitude');
            if (lat==null || lat==undefined || lng==null || lng==undefined) {
                 //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('generico','900060', { classe: 'alvo.class.js', metodo: 'registrarParada'},{mensagem_padrao: 'Seu aparelho não registrou nenhuma posição. Por favor, verifique seu GPS'});                       
                myApp.alert('[900060]'+getErrorMessage('AparelhoNaoRegistrouPosicao')+'. '+getErrorMessage('VerifiqueGPS'),getAlertMessage('Atencao'));
            } else {
                // console.log('check alvo origem');
                me.checkAlvoOrigem().done(function(dentro_alvo) {
                    var msg = getAlertMessage('DesejaIniciarViagem');

                    if (!dentro_alvo) {
                        msg = getAlertMessage('NaoPosicionadoOrigem')+'. '+msg;
                    }
                    me.modalConfirm(msg, function() {
                        myApp.showPreloader(getLoadingMessage('Carregando')+'...');
                       
                        // console.log('bg mode active');
                        if(config.appDevice == "ios"){
                            // console.log('bg set defaults ios');
                            cordova.plugins.backgroundMode.setDefaults({ 
                                title:getAlertMessage('SmAtivaSegundoPlano'), 
                                text:getAlertMessage('EnviandoCoordenadasDeslocamento'),
                            });
                        }else{
                            if (typeof cordova != "undefined") {
                                if (cordova.plugins) {
                            // console.log('bg set defaults android');
                                    cordova.plugins.backgroundMode.setDefaults({ 
                                            silent: true
                                    });
        
                                    // console.log('bg enable');
                                    // console.log('bg geo start');

                                }
                            }
                        }

                        if (typeof cordova != "undefined") {
                            if (cordova.plugins) {
                                cordova.plugins.backgroundMode.enable();
                            }
                        }

                        if (typeof BackgroundGeolocation != "undefined") {
                            BackgroundGeolocation.checkStatus(function(status) {
                                // console.log('[INFO] BackgroundGeolocation service is running', status.isRunning);
                                // console.log('[INFO] BackgroundGeolocation services enabled', status.locationServicesEnabled);
                                // console.log('[INFO] BackgroundGeolocation auth status: ' + status.authorization);
                             
                                // you don't need to check status before start (this is just the example)
                                if (!status.isRunning) {
                                  BackgroundGeolocation.start(); //triggers start on start event
                                }
                            });
                        }

                        console.log('before init');

                        me.iniciarViagem().done(function(){
                            control.routeEntrada(true,true);
                            myApp.hidePreloader();
                        }).fail(function(msg){
                            myApp.hidePreloader();
                        });
                    });
                }).fail(function(msg) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('generico','900033', { classe: 'viagem.class.js', metodo: 'myApp.onPageInit'},{mensagem_padrao: 'Erro ao iniciar viagem! Por favor, tente novamente: '+msg});             
                    myApp.alert('[900033]'+getErrorMessage('ErroIniciarViagem')+' '+getErrorMessage('TenteNovamente'), getAlertMessage('Atencao'));
                    // myApp.alert('[900033]Erro ao iniciar viagem! Por favor, tente novamente',getAlertMessage('Atencao'));
                    console.log('[900033]'+msg);
                });
            }
        });

        Dom7('.finalizar_viagem').off('click').on('click', function(e){
            e.preventDefault();

            var obj = $(this);

            me.getViagemCompleta(me.dados_viagem.viag_codigo_sm).done(function(dados) {
                if (dados.viag_data_fim_provisorio==null || dados.viag_data_fim_provisorio=="") {
                    var lat = getLocalValue('lastLatitude');
                    var lng = getLocalValue('lastLongitude');
                    if (lat==null || lat==undefined || lng==null || lng==undefined) {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('generico','900061', { classe: 'alvo.class.js', metodo: 'registrarParada'},{mensagem_padrao: 'Seu aparelho não registrou nenhuma posição. Por favor, verifique seu GPS'});                       
                        myApp.alert('[900061]'+getErrorMessage('AparelhoNaoRegistrouPosicao')+'. '+getErrorMessage('VerifiqueGPS'),getAlertMessage('Atencao'));
                    } else {

                        control.alvo.checkAlvoDestino().done(function(dentro_alvo) {
                            var msg = getAlertMessage('DesejaFinalizarViagem');
                            if (!dentro_alvo) {
                                msg = getAlertMessage('NaoPosicionadoDestino')+'. '+msg;
                            }

                            me.modalConfirm(msg, function () {
                                myApp.showPreloader(getLoadingMessage('Carregando')+'...');
                                if (typeof cordova != "undefined") {
                                    if (cordova && cordova.plugins) {
                                        cordova.plugins.backgroundMode.disable();
                                        BackgroundGeolocation.stop();
                                    }
                                }

                                control.viagem.finalizarViagem().done(function(){
                                    pageContainer.find('.btnFinalizarViagem, .btnInfoParada').addClass('pendente');

                                    setTimeout(function(){
                                        control.routeEntrada(false,true);
                                        myApp.hidePreloader();
                                    }, 3000);
                                }).fail(function(){
                                    myApp.hidePreloader();
                                });
                            });
                        }).fail(function(msg) {
                            //Adicionar erro nao fatal ao fabric
                            ErrorClass.parseError('database','100024', { classe: 'viagem.class.js', metodo: 'checkAlvoDestino'},{mensagem_padrao: + msg.message });                   
                            myApp.alert('[100024]'+getErrorMessage('ErroFinalizarViagem')+' '+getErrorMessage('TenteNovamente'),getAlertMessage('Atencao'));
                            console.log('[100024]'+msg);
                        });
                    }
                } else {

                     // Configurando status e numero da SM no fabric
                     if (window.fabric) {
                        if(getLocalValue('sm_em_transito')=='1'){
                            window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                        }else{
                            window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                        }
                        if(getLocalValue('viag_codigo_sm') != null){
                            window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
                        }
                    }
                    myApp.alert(getAlertMessage('ViagemJaFinalizada')+'. '+getAlertMessage('AguardandoSincronizacaoDados')+'.', getAlertMessage('Atencao'));
                }
            });
        });

        Dom7('.abastecimento').off('click').on('click', function(e){
            e.preventDefault();
            me.registrarParada(e, 'abastecimento').done(function() {
                me.abreMenuViagem('reload');
            });
            
        });

        Dom7('.refeicao').off('click').on('click', function(e){
            e.preventDefault();
            me.registrarParada(e, 'refeicao').done(function() {
                me.abreMenuViagem('reload');
            });
        });

        Dom7('.pernoite').off('click').on('click', function(e){
            e.preventDefault();
            me.registrarParada(e, 'pernoite').done(function() {
                me.abreMenuViagem('reload');
            });
        });

        Dom7('.reiniciar_viagem').off('click').on('click', function(e){
            e.preventDefault();
            me.registrarParada(e, 'reinicio').done(function() {
                me.abreMenuViagem('reload');
            });

            // Configurando status e numero da SM no fabric
            if (window.fabric) {
                if(getLocalValue('sm_em_transito')=='1'){
                    window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                }else{
                    window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                }
                if(getLocalValue('viag_codigo_sm') != null){
                    window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
                }
            }

        });

        Dom7('.mensagem').off('click').on('click', function(e){
            e.preventDefault();
            me.loadEnviarMensagem();
        });

        Dom7('.historico').off('click').on('click', function(e){
            e.preventDefault();
            me.abreMenuHistorico();
        });

        Dom7('.btnFecharMenu').off('click').on('click', function(e) {
            $('.viagem_andamento').slideUp("slow",function() {
                $('.abrir_menu').slideDown();
                me.resizeMapa('.mapaPosicao');
            });

        });

        Dom7('.btnExibirMenuViagem').off('click').on('click', function(e) {
            $('.viagem_andamento').slideDown("slow",function() {
                $('.abrir_menu').slideUp();
                me.resizeMapa('.mapaPosicao');

            });
        })        


    }

    this.setupView = function(){
        var me = this;
        myApp.onPageInit('info-viagem', function(page) {
            var pageContainer = $(page.container);
            me.loadMap(pageContainer);
        });
        myApp.onPageInit('viagem',function(page) {

            if ((typeof mainView.activePage !== "undefined") && 
                (typeof mainView.activePage.name !== "undefined") && 
                (mainView.activePage.name =="viagem") ) {
                mainView.showNavbar();
            }

            me.dados_viagem = page.context;
            var pageContainer = $(page.container);
            var navBarContainer = $(page.navbarInnerContainer);
            
            control.gps.checkGPSActive();
            // console.log(me.dados_viagem);
            var qtd_itinerario = me.dados_viagem.itinerario.length.toString();
            navBarContainer.find('.qtdEntregas').html(("00" + qtd_itinerario).slice(-2));
            navBarContainer.find('.numSm').html(me.dados_viagem.viag_codigo_sm);

            // me.mensagemPendentes().done(function (msg) {
            //     console.log(msg);
            //     pageContainer.find('.msg_entregas').html(msg);
            // });

            if ($(document).find('.btnOpenWazeImg').length > 0) {
                $(document).find('.btnOpenWazeImg').click(function(e) {
                    me.openWaze(e);
                });
            } else {
                $(document).on('click', '.btnOpenWazeImg', function(e){
                    me.openWaze(e);
                });
            }

            if ($(document).find('.btnMenuViagem').length > 0) {
                $(document).find('.btnMenuViagem').click(function(e){
                    e.preventDefault();
                    me.abreMenuViagem();
                });
            } else {
                $(document).off('click').on('click', '.btnMenuViagem', function(e){
                    e.preventDefault();
                    me.abreMenuViagem();
                });
            }

            if ($(document).find('.menu-button').length > 0) {
                $(document).find('.menu-button').click(function(e){
                    e.preventDefault();
                    control.loadMenu();
                });
            } else {
                $(document).off('click').on('click', '.menu-button', function(e){
                    e.preventDefault();
                    control.loadMenu();
                });
            }
            
            if (control.auth.checkAuthFrete()) {
                $(document).find('.frete-button').show();
            } else {
                $(document).find('.frete-button').hide();
            }

            if ($(document).find('.frete-button').length > 0) {
                $(document).find('.frete-button').click(function(e){
                    if (control.auth.checkAuthFrete()) {
                        e.preventDefault();
                        me.loadMenuClickCargo();                        
                    }
                });
            } else {
                $(document).off('click').on('click', '.frete-button', function(e){
                    e.preventDefault();
                    me.loadMenuClickCargo();
                });
            }


            if ($(document).find('.menuInfoViagem').length > 0) {
                $(document).find('.menuInfoViagem').click(function(e){
                    e.preventDefault();
                    me.loadPanelViagem();
                });
            } else {
                $(document).off('click').on('click', '.menuInfoViagem', function(e){
                    e.preventDefault();
                    me.loadPanelViagem();
                });
            }

            if ($(document).find('.menuEntregas').length > 0) {
                $(document).find('.menuEntregas').click(function(e){
                    me.openMenuEntregas(e, page);
                });
            } else {
                $(document).off('click').on('click', '.menuEntregas', function(e){
                    me.openMenuEntregas(e, page);
                });
            }

            // Dom7('.panel-right').on('closed', function () {
            //     $('.menuEntregas').find('img').attr('src','img/fechamento/lista-de-entrega-icone-azul.png');
            //     $('.menuEntregas').css('margin-right','0px');

            //     $('.menuInfoViagem').find('img').attr('src','img/fechamento/icon-informacoes.png');
            //     $('.menuInfoViagem').css('margin-right','0px');
            // });

            me.loadMap(pageContainer,'.mapaPosicao');
            //alert(config.freeCall);
            if (config.freeCall) {
                pageContainer.find('.chamada').show();
                $('.chamada').show();
            } else {
                console.log(pageContainer.find('.chamada'));
                console.log($('.chamada'));
                pageContainer.find('.chamada').hide();
                $('.chamada').hide();
            }

            //control.freeCall.in_calling = true;

            me.page = page;
            if (control.freeCall.in_calling) {
                me.showCalling(page);
            } else {
                me.hideCalling(page);
            }

            $(document).off('click','.chamada').on('click','.chamada', function(e) {
                myApp.showIndicator();
                control.freeCall.makeCentralCall(function() {
                    myApp.hideIndicator();
                    me.showCalling();
                },function() {
                    me.hideCalling();
                });
                // control.freeCall.makeCentralCall().done(function() {
                //     me.showCalling(page);
                // });
            });

            $(document).off('click','.divBtnDesligar').on('click','.divBtnDesligar', function(e) {
                control.freeCall.stopCall().done(function() {
                    me.hideCalling(page);
                }).fail(function(msg) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database','100079', { classe: 'viagem.class.js', metodo: 'setupView'},{mensagem_padrao: msg });	                     
                    myApp.alert('[100079]'+msg,getAlertMessage('Atencao'));
                });
            });

            me.carregarAcoesMenu(page);

            me.abreMenuViagem();

            $('.div-meio').css('display',control.auth.checkAuthFrete());

        });
        myApp.onPageAfterBack('menu-viagem', function(page){
            me.reloadViagem();
        });
        myApp.onPageInit('menu-viagem',function(page) {
            //alert('x');
            me.dados_viagem = page.context;
            console.log(me.dados_viagem);
            var pageContainer = $(page.container);

            me.carregarAcoesMenu(page);
        });

        myApp.onPageInit('historico',function(page) {
            //var me.dados_viagem = page.context.dados_viagem;
            //var me.historico = page.context.historico;
            console.log(page.context);
            console.log(page.context.historico);


            Dom7('.back').on('click',function(e) {
                e.preventDefault();
                e.stopPropagation();
                //me.abreMenuViagem('back');
                me.reloadViagem('back');
            });

            // $.each(page.context.historico, function(key, item) {
            //     console.log(key);
            //     console.log(item);
            // })
        });
        myApp.onPageAfterAnimation('sem-viagem',function(page) {
            var me = control.viagem;            
            me.checkTabbarShow();
        });
        myApp.onPageInit('sem-viagem', function(page) {
            // mainView.hideNavbar();
            var pageContainer = $(page.container);
            var navBarContainer = $(page.navbarInnerContainer);

            control.gps.checkGPSActive();

            navBarContainer.on('click','.menu-button', function(e) {
                e.preventDefault();
                control.loadMenu();
            });

            pageContainer.off('focus','.placa').on('focus','.placa',function() {
                pageContainer.find('.topoMapa').addClass('bg-white').addClass('topoMapaBlock');
                pageContainer.find('.toolbar').slideUp(200);
                pageContainer.find('.bgBlock').fadeIn(200);
                pageContainer.find('.infoMapa').animate({width: "65%",marginLeft: "15%",marginRight: "20%"},200);
                pageContainer.find('.img-back').fadeIn(200);
                pageContainer.find('.img-search').fadeIn(200);
            });
            pageContainer.off('click','.img-back').on('click','.img-back',function() {
                pageContainer.find('.topoMapa').removeClass('bg-white').removeClass('topoMapaBlock');
                pageContainer.find('.toolbar').slideDown(200);
                pageContainer.find('.bgBlock').fadeOut(200);
                pageContainer.find('.infoMapa').animate({width: "90%",marginLeft: "5%",marginRight: "5%"},200);
                //pageContainer.find('.infoMapa').removeClass('infoMapa2');
                pageContainer.find('.img-back').fadeOut(200);
                pageContainer.find('.img-search').fadeOut(200);
            });

            pageContainer.off('click','.btnPesquisar').on('click','.btnPesquisar',function(e) {
                myApp.showPreloader('Pesquisando Viagem');
                me.pesquisarViagemPlaca().done(function(ret) {
                    if (ret.sucesso) {
                        if(ret.cpf != '10535571402' && ret.cpf != getLocalValue('cpf')){
                            myApp.hidePreloader();
                            me.showMessageNaoEncontrado(getAlertMessage('ViagemOutroMotorista'),getAlertMessage('VeiculoPossuiOutroMotorista')+' '+ret.sm+'.<br/><br/>'+getAlertMessage('OQueDesejaFazer'));
                        }else{
                            pageContainer.find('.img-back').trigger('click');
                            myApp.hidePreloader();
                            myApp.showPreloader(getLoadingMessage('AssumindoViagem'));
                            me.assumirViagem(ret.sm).done(function(ret) {
                                myApp.hidePreloader();
                            }).fail(function() {
                                myApp.hidePreloader();
                            });
                        }
                    } else {
                        myApp.hidePreloader();
                        me.showMessageNaoEncontrado(getAlertMessage('ViagemNaoEncontrada'), getAlertMessage('NaoEncontramosViagensVoce')+'.<br/><br/>'+getAlertMessage('OQueDesejaFazer'));
                    }
                }).fail(function(msg) {
                    myApp.hidePreloader();
                    if (msg=="Placa não informada") {
                        myApp.alert(getAlertMessage('InformePlacaVeiculo'),getAlertMessage('Aviso'));
                    } else if (msg=="Internal Server Error") {
                        //Adicionar erro nao fatal ao fabric
			            ErrorClass.parseError('generico','900031', { classe: 'sync.class.js', metodo: 'startSync'},{mensagem_padrao: 'Não foi possível recuperar a viagem'});             
                        myApp.alert("[900031]"+getAlertMessage('NaoFoiPossivelRecuperarViagem')+". "+getErrorMessage('TenteNovamenteMaisTarde')+".",getAlertMessage('Aviso'));
                    } else {
                        //Adicionar erro nao fatal ao fabric
			            ErrorClass.parseError('generico','900032', { classe: 'sync.class.js', metodo: 'startSync'},{mensagem_padrao: 'Erro ao pesquisar viagem: '+msg});             
                        myApp.alert('[900032]'+getErrorMessage('ErroPesquisarViagem')+': '+msg,getAlertMessage('Aviso'));
                    }
                });
            });
            (function blink() {
                $(".blink").fadeOut(2000).fadeIn(200, blink);
            })();

            //control.freeCall.in_calling = true;

            me.page = page;
            me.checkTabbarShow();

            pageContainer.on('click','#btnFretes',function() {
                me.loadMenuClickCargo();
            });
            
            // if (control.freeCall.in_calling) {
            //     me.showCalling(page);
            // } else {
            //     me.hideCalling(page);
            // }

            // //alert($('.chamada_sem').length);
            // $(document).off('click','.chamada_sem').on('click','.chamada_sem', function(e) {
            //     myApp.showIndicator();
            //     control.freeCall.makeCentralCall(function() {
            //         myApp.hideIndicator();
            //         me.showCalling();
            //     },function() {
            //         me.hideCalling();
            //     }).fail(function() {
            //         myApp.hideIndicator();
            //     });
            //     // control.freeCall.makeCentralCall().done(function() {
            //     //     me.showCalling(page);
            //     // });
            // });

            // if (config.freeCall) {
            //     pageContainer.find('.chamada_sem').show();
            //     $('.chamada_sem').show();
            // } else {
            //     console.log(pageContainer.find('.chamada_sem'));
            //     console.log($('.chamada_sem'));
            //     //alert(pageContainer.find('.chamada_sem'));
            //     //alert('hide');
            //     pageContainer.find('.chamada_sem').hide();
            //     $('.chamada_sem').hide();
            // }

            // $(document).off('click','.divBtnDesligarSem').on('click','.divBtnDesligarSem', function(e) {

            //     control.freeCall.stopCall().done(function() {
            //         me.hideCalling(page);
            //     });
            // });

        });
    }

    this.checkTabbarShow = function() {
        var me = this;
        var pageContainer = $(me.page.container);
        console.log('check tabbar show');
        console.log((control.auth.checkAuthFrete() ? 'true' : 'false'));
        pageContainer.find('.tab_link_menu_opcoes').css('display',(control.auth.checkAuthFrete() ? "block" : "none"));
        // pageContainer.find('.rodape-menu').css({'margin-bottom':(control.auth.checkAuthFrete() ? "70px" : "30px")});
    }

    this.loadPanelViagem = function() {
        var me = this;
        var deferred = $.Deferred();
        var url = 'info-viagem.html';
        var params = me.dados_viagem;

        me.loadPanel(url,params).done(function(html) {
            $('.menuInfoViagem').find('img').attr('src','img/fechamento/icon-informacoes-cinza.png');
            $('.menuEntregas').css('margin-right','-10px');
            myApp.openPanel('right');
            translate(getLocalValue('language'));
            deferred.resolve();
        });

        return deferred.promise();
    }

    this.loadPanelEntregas = function() {
        var me = this;
        var deferred = $.Deferred();
        var url = 'lista-entregas.html';
        //var params = me.dados_viagem;
        control.alvo.getAlvos(me.dados_viagem.viag_codigo_sm).done(function(alvos) {
            $.each(alvos,function(i, data) {
                var dados_status = control.alvo.getStatusEntrega(data);
                alvos[i].status = dados_status.status;
                alvos[i].class_status = dados_status.class_status;
                alvos[i].key = i;
            })
            var params = {
                'dados_viagem': me.dados_viagem,
                'alvos': alvos
            };
            console.log(params);
            control.loadPanelLeft(url,params).done(function(html) {
                // $('.menuEntregas').find('img').css('width','54px').attr('src','img/fechamento/icon-lista-de-entrega-cinza.png');
                // $('.menuInfoViagem').css('margin-right','-10px');
                $('.panel-left').addClass('black-screen');
                myApp.openPanel('left');
                translate(getLocalValue('language'));
                deferred.resolve();
            });

        })

        return deferred.promise();
    }

    this.loadMenuClickCargo = function(type, checkin) {
        var me = this;
        var deferred = $.Deferred();
        var url = 'menu-click.html';
        if (typeof checkin === 'undefined') checkin = null;
        //var params = me.dados_viagem;
        control.settings.getDataByDocumento().done(function(dados) {
            var params = {
                'dados': dados,
            };
            if (checkin !== null) {
                params.checkin = checkin;
            }
            mainView.showNavbar();
            if (type=='back') {
                mainView.router.back({ url: url, context: params, animatePages: true, force: true, reload: true });
            } else {
                mainView.router.load({ url: url, context: params, animatePages: true });
            }
        });

        return deferred.promise();
    }



    this.loadMenuViagem = function(url, params, div) {
        var deferred = $.Deferred();
        Dom7.get(url, params, function (data) {
            var compiled = Template7.compile(data);
            var html = compiled(params);
            var template = html;
            //var template = $(html).find('#tplavaliar').html();
            console.log(template);
            div.html(template);

            deferred.resolve(html);
        });
        return deferred.promise();
    }

    this.loadPanel = function(url, params) {
        var deferred = $.Deferred();
        Dom7.get(url, params, function (data) {
            var compiled = Template7.compile(data);
            var html = compiled(params);
            var template = html;
            //var template = $(html).find('#tplavaliar').html();
            $('.panel-right').html(template);

            deferred.resolve(html);
        });
        return deferred.promise();
    }

    this.assumirViagem = function(codigo_sm) {
        var me       = this;
        var deferred = $.Deferred();
        assumirViagem(codigo_sm).done(function(retorno) {
            me.sincronizaViagem(false).done(function(ret) {
                deferred.resolve(ret);
            }).fail(function(msg) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100025', { classe: 'viagem.class.js', metodo: 'assumirViagem'},{mensagem_padrao: + msg.message });	                                
                myApp.alert('[100025]'+getErrorMessage('ErroAssumirViagem')+': '+msg,getAlertMessage('Aviso'));
                deferred.reject('[100025]'+msg)
            });
        }).fail(function(msg) {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database','100026', { classe: 'viagem.class.js', metodo: 'assumirViagem'},{mensagem_padrao: + msg.message });	                                
            myApp.alert('[100026]'+getErrorMessage('ErroAssumirViagem')+': '+msg,getAlertMessage('Aviso'));
            deferred.reject('[100026]'+msg)
        });
        return deferred.promise();
    }
    this.showMessageNaoEncontrado = function(titulo, mensagem) {
        // var mensagem = 'Infelizmente não encontramos viagem para você ou seu veículo.<br/><br/>O que deseja fazer?'
        myApp.modal({
            title: titulo,
            text: mensagem,
            verticalButtons: true,
            buttons: [
                {
                    text: getText('InformarOutraPlaca'),
                    close: true,
                    onClick: function(obj) {
                        $('.placa').val('');
                    }
                },
                {
                    text: getText('InformarOutroCPF'),
                    close: true,
                    onClick: function(obj) {
                        control.settings.doLogoff().done(function(){
                            mainView.hideNavbar();
                            mainView.router.loadPage('login.html',{context: {language: getLocalValue('language').substring(0,2)}});
                        });
                    }
                },
            ]
        });
    }

    this.mensagemNovaViagem = function() {
        myApp.addNotification({
            title: 'Buonny Driver',
            subtitle: '',
            message: getAlertMessage('RecebeuNovaViagem')+'!',
            media: '<img src="img/fechamento/seta-push.png" />'
        });
    }

    this.mensagemAtualizaViagem = function() {
        myApp.addNotification({
            title: 'Buonny Driver',
            subtitle: '',
            message: getAlertMessage('ViagemAtualizada')+'!',
            media: '<img src="img/fechamento/seta-push.png" />'
        });
    }

    this.mensagemEncerraViagem = function() {
        myApp.addNotification({
            title: 'Buonny Driver',
            subtitle: '',
            message: getAlertMessage('ViagemEncerrada')+'!',
            media: '<img src="img/fechamento/seta-push.png" />'
        });
    }

    this.sincronizaViagem = function($atualiza_viagem){
        var me       = this;
        var deferred = $.Deferred();
        dados_motorista = {
            'aplicativo': config.appAlias,
            'plataforma': config.appDevice,
            'versao':     config.appVersion,
            'documento':  getLocalValue('cpf'),
            'nome':       getLocalValue('nome'),
            'telefone':   getLocalValue('telefone'),
            'token':      getLocalValue('token')
        }

        control.rest.makeRequest('/api_motorista_mobile/get_viagem', dados_motorista , false, true).done(function(viagem){
            if(typeof viagem.viag_codigo_sm === "undefined"){
                var viagem_encerrada = false;
                if(getLocalValue('viag_codigo_sm') != null) {
                    viagem_encerrada = true;
                }

                setLocalValue('viag_codigo_sm', null);
                setLocalValue('sm_em_transito', 0);

               //Configuracao dos dados do usuário para o fabric
                if (window.fabric) {
                    if(getLocalValue('sm_em_transito')=='1'){
                        window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                    }else{
                        window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                    }
                    if(getLocalValue('viag_codigo_sm') != null){
                        window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
                    }
                }

                control.db.deleteRow(me, 1, 1).done(function(){
                    control.db.deleteRow(control.alvo, 1, 1);
                    control.mensagem.limpaMensagens();
                    control.fotos.limpaFotos();
                    switch(mainView.activePage.name){
                        case 'entrega':
                        case 'info-viagem':
                        case 'itinerario':
                        case 'viagem':
                            me.loadSemViagem();
                            // mainView.router.load({ url: 'sem-viagem.html'});
                        break;
                    }
                    var dados_atualiza_comando = {
                        sent: '1900-01-01 00:00:00'
                    };
                    control.db.updateRow(control.comando,dados_atualiza_comando,'sent',null);

                    if (viagem_encerrada) {
                        me.mensagemEncerraViagem();
                    }

                    deferred.resolve("syncViagem: Done.");
                }).fail(function(msg){
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database','100027', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Query error"});	                                
                        deferred.reject("[100027]syncViagem: Query error.");
                });
            } else if(!viagem.erro){
                console.log(viagem);
                setLocalValue('sm_em_transito', (viagem.viag_data_inicio && !viagem.viag_data_fim ? 1 : 0));

                //Configuracao dos dados do usuário para o fabric
                if (window.fabric) {
                    if(getLocalValue('sm_em_transito')=='1'){
                        window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                    }else{
                        window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                    }
                }
                var dados_viagem = {
                    viag_codigo:        viagem.viag_codigo,
                    viag_codigo_sm:     viagem.viag_codigo_sm,
                    viag_data_inicio:   viagem.viag_data_inicio,
                    viag_data_fim:      viagem.viag_data_fim,
                    viag_embarcador:    viagem.embarcador,
                    viag_transportador: viagem.transportador,
                    viag_placa:         viagem.veic_placa,
                    viag_tecnologia:    viagem.vtec_tecn_codigo

                }
                me.getViagemCompleta().done(function(viagem_atual){
                    //se não tem viagem atual e veio nova viagem
                    if(viagem_atual == null){
                        dados_viagem.viag_data_inicio_provisorio = viagem.viag_data_inicio;
                        dados_viagem.viag_data_fim_provisorio = null;
                        control.db.insertRow(me, dados_viagem).done(function(msg){
                            setLocalValue('viag_codigo_sm', dados_viagem.viag_codigo_sm);

                            //Configuracao dos dados do usuário para o fabric
                            if(getLocalValue('viag_codigo_sm') != null){
                                if (window.fabric) {
                                    window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
                                }
                            }
                            control.posicao.sincronizaPosicoes(viagem.posicoes);
                            control.comando.syncGetComandos();
                            //caso esteja na tela de sem viagem precisa redirecionar para a tela de acordo com o status da viagem
                            control.alvo.sincronizaEntregas().done(function(){
                                if($atualiza_viagem){
                                    me.mensagemAtualizaViagem();
                                }else{
                                    me.mensagemNovaViagem();
                                }
                                control.routeEntrada(false,true);
                                if(mainView.activePage.name == "sem-viagem"){
                                    deferred.resolve("syncViagem: Done.");
                                } else {
                                    deferred.resolve("syncViagem: Done.");
                                }
                            }).fail(function(msg){
                                //Adicionar erro nao fatal ao fabric
                                ErrorClass.parseError('database','100028', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                                
                                deferred.reject("[100028]syncViagem: Process error - " + msg);
                            });
                        }).fail(function(msg){
                             //Adicionar erro nao fatal ao fabric
                             ErrorClass.parseError('database','100029', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                       
                             deferred.reject("[100029]syncViagem: Process error - " + msg);
                        });
                    //se já tenho uma viagem e veio viagem
                    } else {
                        control.db.updateRow(me, dados_viagem, 'viag_codigo_sm', getLocalValue('viag_codigo_sm')).done(function(){
                            //se mudou a viagem
                            if(dados_viagem.viag_codigo_sm != viagem_atual.viag_codigo_sm){
                                setLocalValue('viag_codigo_sm', dados_viagem.viag_codigo_sm);

                                //Configuracao dos dados do usuário para o fabric
                                if(getLocalValue('viag_codigo_sm') != null){
                                    if (window.fabric) {
                                        window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
                                    }
                                }
                                //sincroniza os alvos para deletar os antigos e incluir os novos
                                control.db.deleteRow(control.alvo, 1, 1).done(function(){
                                    control.fotos.limpaFotos();
                                    control.mensagem.limpaMensagens();
                                    control.alvo.sincronizaEntregas().done(function(){
                                        control.db.updateRow(me, {viag_data_inicio_provisorio: dados_viagem.viag_data_inicio, viag_data_fim_provisorio: dados_viagem.viag_data_fim}, 'viag_codigo_sm', dados_viagem.viag_codigo_sm).done(function(){
                                            if($atualiza_viagem){
                                                me.mensagemAtualizaViagem();
                                            }else{
                                                me.mensagemNovaViagem();
                                            }
                                            if(mainView.activePage.name != "ajuda" && mainView.activePage.name != "dados-pessoais"){
                                                control.routeEntrada(false,true);
                                            }
                                            deferred.resolve("syncViagem: Done.");
                                        }).fail(function(msg){
                                            //Adicionar erro nao fatal ao fabric
                                            ErrorClass.parseError('database','100030', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                       
                                            deferred.reject("[100030]syncViagem: Process error - " + msg);
                                        });
                                    }).fail(function(msg){
                                        //Adicionar erro nao fatal ao fabric
                                        ErrorClass.parseError('database','100031', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                      
                                        deferred.reject("[100031]syncViagem: Process error - " + msg);
                                    });
                                }).fail(function(msg){
                                    //Adicionar erro nao fatal ao fabric
                                    ErrorClass.parseError('database','100032', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                      
                                    deferred.reject("[100032]syncViagem: Process error - " + msg);
                                });
                            //iniciou viagem
                            } else if(viagem_atual.viag_data_inicio_provisorio == null && dados_viagem.viag_data_inicio != null){
                                control.db.updateRow(me, {viag_data_inicio_provisorio: dados_viagem.viag_data_inicio}, 'viag_codigo_sm', dados_viagem.viag_codigo_sm).done(function(){
                                    if(mainView.activePage.name != "ajuda" && mainView.activePage.name != "dados-pessoais"){
                                        me.getViagemCompleta().done(function(viagem_atualizada){
                                            //mainView.router.load({ url: 'itinerario.html', context: viagem_atualizada, reload: true });
                                            mainView.showNavbar();
                                            mainView.router.load({ url: 'viagem.html', context: viagem_atualizada, reload: true });
                                            deferred.resolve("syncViagem: Done.");
                                        }).fail(function(msg){
                                            //Adicionar erro nao fatal ao fabric
                                            ErrorClass.parseError('database','100033', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                  
                                            deferred.reject("[100033]syncViagem: Process error - " + msg);
                                        });
                                    } else {
                                        deferred.resolve("syncViagem: Done.");
                                    }
                                }).fail(function(msg){
                                    //Adicionar erro nao fatal ao fabric
                                    ErrorClass.parseError('database','100034', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                  
                                    deferred.reject("[100034]syncViagem: Process error - " + msg);
                                });
                            //iniciou viagem pelo gerador e ainda não atualizou no aplicativo
                            } else if(viagem_atual.viag_data_inicio_provisorio != null && viagem_atual.viag_data_inicio == null && dados_viagem.viag_data_inicio != null){
                                control.db.updateRow(me, {viag_data_inicio: dados_viagem.viag_data_inicio}, 'viag_codigo_sm', dados_viagem.viag_codigo_sm).done(function(){
                                    if(mainView.activePage.name != "ajuda" && mainView.activePage.name != "dados-pessoais"){
                                        me.getViagemCompleta().done(function(viagem_atualizada){
                                            //mainView.router.load({ url: 'itinerario.html', context: viagem_atualizada, reload: true });
                                            mainView.showNavbar();
                                            mainView.router.load({ url: 'viagem.html', context: viagem_atualizada, reload: true });
                                            deferred.resolve("syncViagem: Done.");
                                        }).fail(function(msg){
                                            //Adicionar erro nao fatal ao fabric
                                            ErrorClass.parseError('database','100033', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});                     
                                            deferred.reject("[100033]syncViagem: Process error - " + msg);
                                        });
                                    } else {
                                        deferred.resolve("syncViagem: Done.");
                                    }
                                }).fail(function(msg){
                                    //Adicionar erro nao fatal ao fabric
                                    ErrorClass.parseError('database','100034', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});                     
                                    deferred.reject("[100034]syncViagem: Process error - " + msg);
                                });
                            //voltou agendada
                            } else if(viagem_atual.viag_data_inicio != null && dados_viagem.viag_data_inicio == null){
                                control.db.updateRow(me, {viag_data_inicio_provisorio: null}, 'viag_codigo_sm', dados_viagem.viag_codigo_sm).done(function(){
                                    if(mainView.activePage.name != "ajuda" && mainView.activePage.name != "dados-pessoais"){
                                        me.getViagemCompleta().done(function(viagem_atualizada){
                                            //mainView.router.load({ url: 'info-viagem.html', context: viagem_atualizada, reload: true });
                                            mainView.showNavbar();
                                            mainView.router.load({ url: 'viagem.html', context: viagem_atualizada, reload: true });
                                            deferred.resolve("syncViagem: Done.");
                                        }).fail(function(msg){
                                            //Adicionar erro nao fatal ao fabric
                                            ErrorClass.parseError('database','100035', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                  
                                            deferred.reject("[100035]syncViagem: Process error - " + msg);
                                        });
                                    } else {
                                        deferred.resolve("syncViagem: Done.");
                                    }
                                }).fail(function(){
                                    //Adicionar erro nao fatal ao fabric
                                    ErrorClass.parseError('database','100036', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                  
                                    deferred.reject("[100036]syncViagem: Query error");
                                });
                            } else {
                                setLocalValue('sm_em_transito', (viagem_atual.viag_data_inicio_provisorio != null && viagem_atual.viag_data_fim_provisorio == null ? 1 : 0));
                                //Configuracao dos dados do usuário para o fabric
                                if (window.fabric) {
                                    if(getLocalValue('sm_em_transito')=='1'){
                                        window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
                                    }else{
                                        window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
                                    }
                                }
                                deferred.resolve("syncViagem: Done.");
                            }
                        }).fail(function(msg){
                            //Adicionar erro nao fatal ao fabric
                            ErrorClass.parseError('database','100037', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                     
                            deferred.reject("[100037]syncViagem: Process error - " + msg);
                        });
                    }
                }).fail(function(msg){
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database','100038', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                     
                    deferred.reject("[100038]syncViagem: Process error - " + msg);
                });
            } else {
                if(viagem.erro.substr(0, 7) == 'O Token') control.settings.doLogoff();
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('generico','900057', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + viagem.erro});	                     
                   
                deferred.reject("[900057]syncViagem: Process error - " + viagem.erro);
            }
        }).fail(function(msg){
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300001', { classe: 'viagem.class.js', metodo: 'sincronizaViagem'},{mensagem_padrao: "syncViagem: Process error - " + msg});	                             
            deferred.reject("[300001]syncViagem: Process error - " + msg);
        });

        return deferred.promise();
    }


    this.loadTableInfo = function(){
        this.tbName   = 'viagem';
        this.tbPK     = 'id';
        this.tbFields = {
            'id':                          'INTEGER AUTOINCREMENT PRIMARY KEY',
            'viag_codigo':                 'INTEGER',
            'viag_codigo_sm':              'INTEGER',
            'viag_embarcador':             'TEXT',
            'viag_transportador':          'TEXT',
            'viag_data_inicio':            'TEXT',
            'viag_placa':                  'TEXT',
            'viag_data_inicio_provisorio': 'TEXT',
            'viag_data_fim_provisorio':    'TEXT',
            'parada':                      'INTEGER',
            'viag_tecnologia':             'INTEGER'
      };
    }

    this.createTable = function(){
        var deferred = $.Deferred();

        control.db.createTable(this).done(function(){
            deferred.resolve();
        }).fail(function(e){
            deferred.reject(e);
        });

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