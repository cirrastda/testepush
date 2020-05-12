var alvoClass = function () {
    this.tbName = null;
    this.tbPK = null;
    this.tbFields = {};
    this.objSel = null;
    this.myMap = null;
    this.carMarker = null;
    this.myMarker = null;
    this.myPoly = null;
    this.myRect = null;
    this.myCirc = null;
    this.gallery = null;

    this.myRoute = null;
    this.myRenderer = null;
    this.init = function () {
        var deferred = $.Deferred();
        this.loadTableInfo();
        this.setupView();
        deferred.resolve();
        return deferred.promise();
    }

    this.getOrigem = function (viag_codigo_sm) {
        var me = this;
        var deferred = $.Deferred();

        var posicao = control.posicao.getLastPosition();

        if (posicao == null || posicao == undefined || posicao['lat'] == null || posicao['lat'] == undefined || posicao['lat'] == '') posicao['lat'] = 0;
        if (posicao == null || posicao == undefined || posicao['lng'] == null || posicao['lng'] == undefined || posicao['lng'] == '') posicao['lng'] = 0;

        var sql = "SELECT *, " +
            "       CASE WHEN " +
            posicao['lat'] + " BETWEEN refe_latitude_min AND refe_latitude_max AND " +
            posicao['lng'] + " BETWEEN refe_longitude_min AND refe_longitude_max THEN 1 " +
            "ELSE 0 END AS no_alvo " +
            "FROM alvo " +
            "WHERE vloc_tpar_codigo = 4 AND " +
            "viag_codigo_sm = ? LIMIT 1";

        control.db.query(sql, [viag_codigo_sm], 1).done(function (item) {
            if (item) {
                deferred.resolve(item);
            } else {
                deferred.reject();
            }
        }).fail(function (msg) {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100007', { classe: 'alvo.class.js', metodo: 'getOrigem' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });

            deferred.reject('[100007]' + msg);
        });

        return deferred.promise();

    }

    this.getDestino = function (viag_codigo_sm) {
        var me = this;
        var deferred = $.Deferred();

        var posicao = control.posicao.getLastPosition();

        if (posicao == null || posicao == undefined || posicao['lat'] == null || posicao['lat'] == undefined || posicao['lat'] == '') posicao['lat'] = 0;
        if (posicao == null || posicao == undefined || posicao['lng'] == null || posicao['lng'] == undefined || posicao['lng'] == '') posicao['lng'] = 0;

        var sql = "SELECT *, " +
            "       CASE WHEN " +
            posicao['lat'] + " BETWEEN refe_latitude_min AND refe_latitude_max AND " +
            posicao['lng'] + " BETWEEN refe_longitude_min AND refe_longitude_max THEN 1 " +
            "ELSE 0 END AS no_alvo " +
            "FROM alvo " +
            "WHERE vloc_tpar_codigo = 5 AND " +
            "viag_codigo_sm = ? LIMIT 1";

        control.db.query(sql, [viag_codigo_sm], 1).done(function (item) {
            if (item) {
                deferred.resolve(item);
            } else {
                deferred.reject();
            }
        }).fail(function (msg) {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100008', { classe: 'alvo.class.js', metodo: 'getDestino' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });

            deferred.reject('[100008]' + msg);
        });

        return deferred.promise();

    }

    this.getAlvos = function (viag_codigo_sm) {
        var me = this;
        var deferred = $.Deferred();
        var posicao = control.posicao.getLastPosition();
        var sql = "SELECT *, " +
            "       CASE WHEN " +
            posicao['lat'] + " BETWEEN refe_latitude_min AND refe_latitude_max AND " +
            posicao['lng'] + " BETWEEN refe_longitude_min AND refe_longitude_max THEN 1 " +
            "ELSE 0 END AS no_alvo " +
            "FROM alvo " +
            "WHERE vloc_tpar_codigo NOT IN (4,5) AND " +
            "viag_codigo_sm = ? " +
            "ORDER BY vloc_sequencia ASC";
        control.db.query(sql, [viag_codigo_sm]).done(function (alvos) {
            for (i in alvos) {
                alvos[i]['delivered'] = $.trim(alvos[i]['confirmtime']) ? true : false;
                //alvos[i]['img_status'] = me.setStar(alvos[i]['vloc_status_viagem'], alvos[i]['confirmtime'], alvos[i]['rejeicao_motivo']);
            }

            deferred.resolve(alvos);
        }).fail(function (msg) {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100009', { classe: 'alvo.class.js', metodo: 'getAlvos' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });

            deferred.reject('[100009]' + msg);
        });

        return deferred.promise();
    }
    /*this.setStar = function(status, confirm, reject){
        var img_status = '';
        if(status == 'E')           img_status+= "portal ";
        if(confirm)                 img_status+= "app ";
        if(status == 'R' || reject) img_status = "rejeitada ";
        return $.trim(img_status);
    }*/
    this.abreAlvo = function (id_alvo, tipo) {
        var me = this;
        var deferred = $.Deferred();
        if (typeof tipo == "undefined") tipo = "load";
        myApp.showPreloader(getLoadingMessage('Carregando')+'...');
        var sql = "SELECT a.*, r.descricao AS rejeicao_motivo_txt " +
            "FROM alvo AS a " +
            "LEFT JOIN motivos_recusa AS r ON r.codigo = a.rejeicao_motivo " +
            "WHERE a.vloc_codigo = ?";

        control.db.query(sql, [id_alvo], 1).done(function (res) {
            var justReload = mainView.activePage.name == 'entrega';

            var item = {};
            for (i in res) item[i] = res[i];

            //item.img_status = me.setStar(item.vloc_status_viagem, item.confirmtime, item.rejeicao_motivo);

            me.objSel = item;
            me.myMap = null;
            me.myMarker = null;
            me.myPoly = null;
            me.myRect = null;

            item.confirmtime = formataDataView(item.confirmtime);
            item.rejeicao_data = formataDataView(item.rejeicao_data);

            item.refe_endereco_completo = ($.trim(item.refe_rua) != "" ? $.trim(item.refe_rua) : "");
            item.refe_endereco_completo += ($.trim(item.refe_numero) != "" ? "," + $.trim(item.refe_numero) : "");
            if (item.refe_endereco_completo != "") item.refe_endereco_completo += " - ";
            item.refe_endereco_completo += ($.trim(item.refe_bairro) != "" ? $.trim(item.refe_bairro) : "");
            if (item.refe_endereco_completo != "") item.refe_endereco_completo += " - ";
            item.refe_endereco_completo += ($.trim(item.refe_cidade) != "" ? $.trim(item.refe_cidade) : "");
            item.refe_endereco_completo += ($.trim(item.refe_estado) != "" ? " - " + $.trim(item.refe_estado) : "");

            var dados_status = me.getStatusEntrega(item);
            item.status = dados_status.status;
            item.sigla_status = dados_status.sigla_status;

            if (tipo == "back") {
                mainView.router.back({ url: 'entrega.html', reload: justReload, context: item, ignoreCache: true, force: true });
            } else if (tipo == "reload") {
                mainView.router.load({ url: 'entrega.html', reload: true, context: item, ignoreCache: true, pushState: false });
            } else {
                mainView.router.load({ url: 'entrega.html', reload: justReload, context: item, ignoreCache: true });
            }

            // mainView.showNavbar();

            myApp.hidePreloader();
            deferred.resolve();

        }).fail(function () {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100010', { classe: 'alvo.class.js', metodo: 'abreAlvo' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });

            myApp.hidePreloader();
            deferred.reject();
        });
        return deferred.promise();
    }

    this.abreConfirmacaoEntrega = function (id_alvo, tipo) {
        var me = this;
        var deferred = $.Deferred();
        if (typeof tipo == "undefined") tipo = "load";
        myApp.showPreloader(getLoadingMessage('Carregando')+'...');
        var sql = "SELECT a.*, r.descricao AS rejeicao_motivo_txt " +
            "FROM alvo AS a " +
            "LEFT JOIN motivos_recusa AS r ON r.codigo = a.rejeicao_motivo " +
            "WHERE a.vloc_codigo = ?";
        control.db.query(sql, [id_alvo], 1).done(function (res) {
            var item = {};
            for (i in res) item[i] = res[i];

            me.objSel = item;

            item.confirmtime = formataDataView(item.confirmtime);
            item.rejeicao_data = formataDataView(item.rejeicao_data);

            var dados_status = me.getStatusEntrega(item);
            item.status = dados_status.status;
            item.sigla_status = dados_status.sigla_status;

            if (tipo == "back") {
                mainView.router.back({ url: 'confirmar-entrega.html', context: item, ignoreCache: true, force: true });
            } else {
                mainView.router.load({ url: 'confirmar-entrega.html', context: item, ignoreCache: true });
            }

            myApp.hidePreloader();
            deferred.resolve();
        }).fail(function () {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100011', { classe: 'alvo.class.js', metodo: 'abreConfirmacaoEntrega' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });

            myApp.hidePreloader();
            deferred.reject();
        });
        return deferred.promise();

    }

    this.loadRotaEntrega = function (page) {
        var me = this;

        var dados_alvo = page.context;
        // mainView.hideNavbar();
        mainView.router.load({ url: 'rota-entrega.html', context: dados_alvo, pushState: false });


    }

    this.getStatusEntrega = function (data) {
        var status = null;
        var class_status = null;
        var sigla_status = null;
        if (data.confirmtime != null && data.confirmtime != "") {
            class_status = 'entregue';
            status = getStatusText('Entregue');
            sigla_status = 'E';
        } else if (data.rejeicao_data != null && data.rejeicao_data != "") {
            class_status = 'rejeitado';
            status = getStatusText('Rejeitado');
            sigla_status = 'R';
        } else {
            switch (data.vloc_status_viagem) {
                case 'N':
                    class_status = 'pendente';
                    status = getStatusText('Pendente');
                    sigla_status = 'N';
                    break;
                case 'D':
                    class_status = 'entregando';
                    status = getStatusText('Entregando');
                    sigla_status = 'D';
                    break;
                case 'E':
                    class_status = 'pendente-confirmacao';
                    status = getStatusText('PendenteConfirmacao');
                    sigla_status = 'C';
                    break;
                case 'R':
                    class_status = 'rejeitado';
                    status = getStatusText('Rejeitada');
                    sigla_status = 'R';
                    break;
            }
        }
        return {
            "status": status,
            "class_status": class_status,
            "sigla_status": sigla_status
        };
    }

    this.confirmaEntrega = function (codigo, nome, cpf, rg) {
        var deferred = $.Deferred();

        var info = {
            confirmtime: curTime(),
            vloc_nome_receptor: nome,
            vloc_cpf_receptor: cpf,
            vloc_rg_receptor: rg,
            rejeicao_data: null,
            rejeicao_motivo: null,
            sent: null
        };
        control.db.updateRow(this, info, 'vloc_codigo', codigo).done(function () {
            control.sync.marcaAlvosEntregues();

            deferred.resolve();
        }).fail(function () {
            //Erro adicionado ao fabric no arquivo db.class
            deferred.reject();
        });
        return deferred.promise();
    }
    this.rejeitaEntrega = function (alvo, motivo) {
        var deferred = $.Deferred();
        var info = {
            rejeicao_data: curTime(),
            rejeicao_motivo: motivo,
            confirmtime: null,
            vloc_nome_receptor: null,
            vloc_cpf_receptor: null,
            vloc_rg_receptor: null,
            sent: null
        };

        control.db.updateRow(this, info, 'vloc_codigo', alvo).done(function () {
            control.sync.marcaAlvosEntregues();
            deferred.resolve();
        }).fail(function () {
            //Erro adicionado ao fabric no arquivo db.class
            deferred.reject();
        });
        return deferred.promise();
    }
    this.getProximaEntrega = function () {
        var me = this;
        var deferred = $.Deferred();
        var sql = "SELECT vloc_codigo FROM alvo " +
            "WHERE (confirmtime IS NULL OR confirmtime = '') AND (rejeicao_data IS NULL OR rejeicao_data = '') AND " +
            "      vloc_tpar_codigo NOT IN (4, 5) " +
            "ORDER BY vloc_sequencia ASC " +
            "LIMIT 1";
        control.db.query(sql, [], 1).done(function (item) {
            if (item) {
                deferred.resolve(item.vloc_codigo);
            } else {
                deferred.reject();
            }
        }).fail(function (msg) {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100012', { classe: 'alvo.class.js', metodo: 'getProximaEntrega' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });
            deferred.reject();
        });
        return deferred.promise();
    }

    this.getTotalEntregasPendentes = function () {
        var me = this;
        var deferred = $.Deferred();
        var sql = "SELECT COUNT(0) as conta FROM alvo " +
            "WHERE (confirmtime IS NULL OR confirmtime = '') AND " +
            "      (rejeicao_data IS NULL OR rejeicao_data = '') AND " +
            "      vloc_tpar_codigo NOT IN (4, 5) ";

        control.db.query(sql, [], 1).done(function (item) {
            if (item) {
                deferred.resolve(item.conta);
            } else {
                deferred.reject();
            }
        }).fail(function (msg) {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100013', { classe: 'alvo.class.js', metodo: 'getTotalEntregasPendentes' }, { mensagem_padrao: msg.message + ' - SQL: ' + sql });
            deferred.reject();
        });
        return deferred.promise();
    }

    this.setupGallery = function () {
        var me = this;
        var obj = $('#fotos .lista');
        me.gallery = null;
        control.fotos.renderFotosTab(obj, me.objSel.id).done(function () {
            var arrFotos = [];
            obj.find('a').each(function () {
                var img = $(this).attr('data-url');
                arrFotos.push(img);
            });
            var tpl =
                '<div class="navbar">' +
                '<div class="navbar-inner">' +
                '<div class="left sliding">' +
                '<a href="#" class="link close-popup photo-browser-close-link {{#unless backLinkText}}icon-only{{/unless}} {{js "this.type === \'page\' ? \'back\' : \'\'"}}">' +
                '<i class="icon icon-back {{iconsColorClass}}"></i>' +
                '{{#if backLinkText}}<span>{{backLinkText}}</span>{{/if}}' +
                '</a>' +
                '</div>' +
                '<div class="center sliding">' +
                '<span class="photo-browser-current"></span> ' +
                '<span class="photo-browser-of">{{ofText}}</span> ' +
                '<span class="photo-browser-total"></span>' +
                '</div>' +
                '<div class="right sliding">' +
                '<a href="#" class="link btnExcluir">' +
                '<i class="icon icon-trash"></i>' +
                '</a>' +
                '</div>' +
                '</div>' +
                '</div>  ';

            me.gallery = myApp.photoBrowser({ navbarTemplate: tpl, photos: arrFotos, type: 'popup', theme: 'dark', backLinkText: 'Fechar', ofText: 'de' });
        });
    }
    this.setupMotivos = function () {
        var sql = "SELECT id, codigo, descricao FROM motivos_recusa ORDER BY codigo ASC";

        control.db.query(sql, []).done(function (itens) {
            for (i in itens) {
                myApp.smartSelectAddOption('.btnNaoRealizada.smart-select select', '<option value="' + itens[i]['codigo'] + '">' + itens[i]['descricao'] + '</option>');
            }
        });
    }

    this.checkAlvoDestino = function () {
        var deferred = $.Deferred();
        var codigo_sm = getLocalValue('viag_codigo_sm');
        control.alvo.getDestino(codigo_sm).done(function (origem) {
            var lat = getLocalValue('lastLatitude');
            var lng = getLocalValue('lastLongitude');
            if (lat != null && lat != undefined && lng != null && lng != undefined) {
                if ((parseFloat(lat) >= parseFloat(origem.refe_latitude_min) && parseFloat(lat) <= parseFloat(origem.refe_latitude_max)) &&
                    (parseFloat(lng) >= parseFloat(origem.refe_longitude_min) && parseFloat(lng) <= parseFloat(origem.refe_longitude_max))) {
                    deferred.resolve(true);
                } else {
                    deferred.resolve(false);
                }
            } else {
                deferred.resolve(false);
            }
        }).fail(function (erro) {

            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100014', { classe: 'alvo.class.js', metodo: 'checkAlvoDestino' }, { mensagem_padrao: "Erro ao recuperar dados de origem: " + erro + ' - SQL: ' + sql });

            console.log("Erro ao recuperar dados de origem: " + erro);
            deferred.reject('[100014]' + erro);
        });
        return deferred.promise();
    }

    this.mapEventsEntregas = function (page) {
        var me = this;
        //var pageContainer = $(page.container);
        var $$ = Dom7;
        $$('.linha-alvo').click(function (e) {
            var vloc_codigo = $(this).attr('data-codigo');
            myApp.closePanel();
            me.abreAlvo(vloc_codigo);
        });
    }

    this.loadMapEntrega = function (page, load_rota, fullscreen, calcula_distancia) {
        var pageContainer = $(page.container);
        if (typeof load_rota == "undefined") load_rota = false;
        if (typeof fullscreen == "undefined") fullscreen = false;
        if (typeof calcula_distancia == "undefined") calcula_distancia = false;
        var me = this;
        if (typeof google != "undefined") {
            if (me.carMarker) me.carMarker.setMap(null);

            for (i in me.myCirc) me.myCirc[i].setMap(null);
            for (i in me.myRect) me.myRect[i].setMap(null);
            for (i in me.myPoly) me.myPoly[i].setMap(null);
            for (i in me.myMarker) me.myMarker[i].setMap(null);

            me.carMarker = null;

            me.myCirc = [];
            me.myRect = [];
            me.myPoly = [];
            me.myMarker = [];

            var objMapa = pageContainer.find('#mapEntrega');
            if (fullscreen) {
                objMapa.height($('body').height() - objMapa.parent().position().top);
            } else {
                objMapa.height($('body').height() - objMapa.parent().position().top - $('.link-show-map').height() - $('.infoEntrega').height() - 45);
            }

            me.myMap = new google.maps.Map(objMapa[0], {
                zoom: 14,
                disableDefaultUI: true
            });

            var myBounds = new google.maps.LatLngBounds();

            // pega a posicao atual do gps e insere no mapa
            var pAtual = control.posicao.getLastPosition();
            if (pAtual['lat'] != null && pAtual['lat'] != undefined && pAtual['lng'] != null && pAtual['lng'] != undefined) {
                var myPos = new google.maps.LatLng(parseFloat(pAtual['lat']), parseFloat(pAtual['lng']));

                me.myMarker.push(new google.maps.Marker({
                    position: myPos,
                    map: me.myMap,
                    animation: google.maps.Animation.DROP,
                    icon: new google.maps.MarkerImage(('img/mapa/carro-icone-mapa.png'), new google.maps.Size(37, 37), new google.maps.Point(0, 0), new google.maps.Point(19, 37))
                }));

                myBounds.extend(myPos);
            }


            // pega os alvos e insere no mapa
            var areaTipo = '';
            var areaRefs = '';

            var coordAlvo = new google.maps.LatLng(parseFloat(me.objSel.refe_latitude), parseFloat(me.objSel.refe_longitude));

            if (me.objSel.refe_circulo) {
                areaTipo = 'circulo';
                areaRefs = $.trim(me.objSel.refe_raio);
            } else if ($.trim(me.objSel.refe_poligono)) {
                areaTipo = 'poligono';
                areaRefs = $.trim(me.objSel.refe_poligono);
            } else {
                areaTipo = 'quadrado';
                areaRefs = me.objSel.refe_latitude_min + ' ' + me.objSel.refe_longitude_min + ',' + me.objSel.refe_latitude_max + ' ' + me.objSel.refe_longitude_max;
            }

            switch (areaTipo) {
                case 'circulo':
                    me.myCirc.push(new google.maps.Circle({
                        strokeColor: '#AAAAEE',
                        strokeOpacity: 0.6,
                        strokeWeight: 2,
                        fillColor: '#AAAAFF',
                        fillOpacity: 0.5,
                        map: me.myMap,
                        center: coordAlvo,
                        radius: parseInt(areaRefs)
                    }));

                    myBounds.extend(coordAlvo);
                    break;

                case 'quadrado':
                    var refs = areaRefs.split(',');
                    var refsMin = refs[0].split(' ');
                    var refsMax = refs[1].split(' ');

                    me.myRect.push(new google.maps.Rectangle({
                        strokeColor: '#AAAAEE',
                        strokeOpacity: 0.6,
                        strokeWeight: 2,
                        fillColor: '#AAAAFF',
                        fillOpacity: 0.5,
                        map: me.myMap,
                        bounds: new google.maps.LatLngBounds(new google.maps.LatLng(refsMin[0], refsMin[1]), new google.maps.LatLng(refsMax[0], refsMax[1]))
                    }));

                    myBounds.extend(new google.maps.LatLng(refsMin[0], refsMin[1]), new google.maps.LatLng(refsMax[0], refsMax[1]));
                    break;

                case 'poligono':
                    var path = new google.maps.MVCArray;

                    var refs = areaRefs.split(',');
                    var refsP = [];

                    for (p in refs) {
                        refsP = refs[p].split(' ');
                        path.insertAt(p, new google.maps.LatLng(refsP[0], refsP[1]));

                        myBounds.extend(new google.maps.LatLng(refsP[0], refsP[1]));
                    }

                    me.myPoly.push(new google.maps.Polygon({
                        strokeColor: '#AAAAEE',
                        strokeOpacity: 0.6,
                        strokeWeight: 2,
                        fillColor: '#AAAAFF',
                        fillOpacity: 0.5,
                        map: me.myMap,
                        paths: path
                    }));
                    break;
            }

            me.myMarker.push(new google.maps.Marker({
                position: coordAlvo,
                map: me.myMap,
                animation: google.maps.Animation.DROP,
                //icon:     new google.maps.MarkerImage(('img/' + (me.objSel.vloc_sequencia == 1 ? 'pin-cd' : 'pin-loja') + '.png'), new google.maps.Size(37, 37), new google.maps.Point(0, 0), new google.maps.Point(19, 37))
                icon: new google.maps.MarkerImage(('img/mapa/endereco-icone-azul.png'), new google.maps.Size(19, 30), new google.maps.Point(0, 0), new google.maps.Point(9, 30))
            }));

            if (load_rota || calcula_distancia) {
                if (myPos) {
                    request = {
                        origin: myPos,
                        destination: coordAlvo,
                        travelMode: google.maps.TravelMode.DRIVING,
                        provideRouteAlternatives: true
                    };
                    me.myRoute = new google.maps.DirectionsService();
                    me.myRoute.route(request, function (response, status) {
                        if (status == google.maps.DirectionsStatus.OK) {
                            if (load_rota) {
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
                            if (calcula_distancia) {
                                if (typeof response.routes[0].legs[0].distance.text != "undefined") {
                                    $('.routeDistancia').html(response.routes[0].legs[0].distance.text);
                                }
                                if (typeof response.routes[0].legs[0].duration.text != "undefined") {
                                    $('.routeTempo').html(response.routes[0].legs[0].duration.text);
                                }
                                me.myMap.setCenter(coordAlvo);
                            }
                        }
                    });

                    if (load_rota) {
                        $('.noPosition').hide();
                    }
                } else {
                    if (load_rota) {
                        $('.noPosition').show();
                        me.myMap.setCenter(coordAlvo);
                        (function blink() {
                            $(".blink").fadeOut(2000).fadeIn(200, blink);
                        })();
                    }
                }
            } else {
                me.myMap.setCenter(coordAlvo);
            }

            //me.myMap.fitBounds(myBounds);

        }

    }

    this.checkHabilitaEntrega = function (dados) {
        var habilita = true;
        var msg_bloqueio = "";
        if (!getLocalValue("sm_em_transito")) {
            habilita = false;
            msg_bloqueio = getMessage('ViagemNaoIniciada');
        } else if (dados.sigla_status == "E") {
            habilita = false;
            msg_bloqueio = getMessage('EntregaConfirmadaEm') + ' '+ dados.confirmtime;
        } else if (dados.sigla_status == "R") {
            habilita = false;
            msg_bloqueio = getMessage('EntregaRejeitadaEm') + ' ' + dados.rejeicao_data + ' ' + getMessage('por') + ' ' +dados.rejeicao_motivo_txt;
        }
        return {
            "habilita": habilita,
            "msg_bloqueio": msg_bloqueio
        };
    }

    this.habilitaBotoesEntrega = function (page) {
        var me = this;
        var dados = page.context;
        var pageContainer = $(page.container);
        var dados_habilita = me.checkHabilitaEntrega(dados);
        if (dados_habilita.habilita) {
            pageContainer.find('.divBtnAcao').show();
            pageContainer.find('.divConfirma').html(getText('ConfirmacaoEntrega'));
        } else {
            pageContainer.find('.divBtnAcao').hide();
            pageContainer.find('.divConfirma').html(dados_habilita.msg_bloqueio);
        }
    }

    this.setupView = function () {
        var me = this;
        myApp.onPageInit('lista-entregas', function (page) {
            me.mapEventsEntregas(page);
        });
        myApp.onPageInit('itinerario', function (page) {
            var pageContainer = $(page.container);

            var ptrContent = $('.pull-to-refresh-content.itinerario');

            ptrContent.on('refresh', function (e) {
                control.viagem.getViagemCompleta().done(function (viagem_atual) {
                    mainView.router.load({ url: 'itinerario.html', context: viagem_atual, reload: true });
                }).always(function () {
                    myApp.pullToRefreshDone();
                });
            });

            pageContainer.on('click', '.abrirEntrega', function (e) {
                e.preventDefault();

                me.abreAlvo($(this).attr('data-codigo'));
            });
            pageContainer.on('click', '.btnFinalizarViagem', function (e) {
                e.preventDefault();

                var obj = $(this);

                if (!$(this).hasClass('pendente')) {
                    var lat = getLocalValue('lastLatitude');
                    var lng = getLocalValue('lastLongitude');
                    if (lat == null || lat == undefined || lng == null || lng == undefined) {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('generico', '900058', { classe: 'alvo.class.js', metodo: 'setupView' }, { mensagem_padrao: "Erro ao finalizar viagem! Por favor, tente novamente:" + msg.message + ' - SQL: ' + sql });

                        myApp.alert('[900058]'+getErrorMessage('AparelhoNaoRegistrouPosicao')+'. '+getErrorMessage('VerifiqueGPS'), getAlertMessage('Atencao'));
                    } else {

                        me.checkAlvoDestino().done(function (dentro_alvo) {
                            var msg = getAlertMessage('DesejaFinalizarViagem');
                            if (!dentro_alvo) {
                                msg = getAlertMessage('NaoPosicionadoDestino')+'. ' + msg;
                            }
                            myApp.confirm(msg, getAlertMessage('Aviso'), function () {
                                myApp.showPreloader(getLoadingMessage('Carregando')+'...');

                                control.viagem.finalizarViagem().done(function () {
                                    pageContainer.find('.btnFinalizarViagem, .btnInfoParada').addClass('pendente');

                                    setTimeout(function () {
                                        control.routeEntrada(false);
                                        myApp.hidePreloader();
                                    }, 3000);
                                }).fail(function () {
                                    myApp.hidePreloader();
                                });
                            });
                        }).fail(function (msg) {

                            //Adicionar erro nao fatal ao fabric
                            ErrorClass.parseError('database', '100015', { classe: 'alvo.class.js', metodo: 'setupView' }, { mensagem_padrao: "Erro ao finalizar viagem! Por favor, tente novamente:" + msg.message + ' - SQL: ' + sql });
                            myApp.alert('[100015]'+getErrorMessage('ErroFinalizarViagem')+' '+getErrorMessage('TenteNovamente'), getAlertMessage('Atencao'));
                            console.log(msg);
                        });
                    }
                } else {
                    myApp.alert(getAlertMessage('ViagemJaFinalizada')+'. '+getAlertMessage('AguardandoSincronizacaoDados')+'.', getAlertMessage('Atencao'));
                }
            });
        });
        myApp.onPageAfterBack('entrega', function (page) {
            myApp.showIndicator();

            control.viagem.getViagemCompleta().done(function (viagem_atual) {
                setTimeout(function () { mainView.showNavbar(); mainView.router.load({ url: 'viagem.html', context: viagem_atual, reload: true }); myApp.hideIndicator(); }, 100);
            });
        });
        myApp.onPageInit('entrega', function (page) {
            var pageContainer = $(page.container);
            me.dados = page.context;

            me.habilitaBotoesEntrega(page);
            me.loadMapEntrega(page, false, false, true);
            me.setupMotivos();

            pageContainer.on('click', '.link-show-map', function (e) {
                me.loadRotaEntrega(page);
            });

            Dom7('.back').on('click', function (e) {
                e.preventDefault();
                e.stopPropagation();
                myApp.showIndicator();
                control.viagem.getViagemCompleta().done(function (viagem_atual) {
                    mainView.showNavbar();
                    mainView.router.back({ url: 'viagem.html', context: viagem_atual, reload: true });
                    myApp.hideIndicator();
                });
            });

            pageContainer.on('click', '.divBtnConfirma', function (e) {
                me.abreConfirmacaoEntrega(page.context.vloc_codigo);

            });

            pageContainer.on('change', '.motivoRecusa', function (e) {
                var objeto = $(this);
                myApp.modal({
                    title: getAlertMessage('Atencao'),
                    text: getAlertMessage('DesejaRecusarEntrega'),
                    buttons: [
                        {
                            text: getText('Sim'),
                            close: true,
                            onClick: function (obj) {
                                //alert(objeto.val());
                                me.rejeitaEntrega(page.context.vloc_codigo, objeto.val()).done(function () {
                                    me.abreAlvo(page.context.vloc_codigo, "reload");
                                });
                            }
                        },
                        {
                            text: getText('Nao'),
                            close: true
                        },
                    ]

                });

            });

        });

        myApp.onPageInit('rota-entrega', function (page) {
            var pageContainer = $(page.container);
            me.loadMapEntrega(page, true, true);

            pageContainer.on('click', '.back', function (e) {
                mainView.showNavbar();
                me.abreAlvo(page.context.vloc_codigo, "back");
            });

            $(document).on('click', '.btnOpenWazeImg', function (e) {
                e.preventDefault();
                var wazeLocation = $(this).attr('data-url');
                wazeLocation = wazeLocation.substring(wazeLocation.indexOf("=") + 1);
                wazeLocation = wazeLocation.substring(0, wazeLocation.indexOf("&"));
                launchnavigator.isAppAvailable(launchnavigator.APP.WAZE, function (isAvailable) {
                    var app;
                    if (isAvailable) {
                        app = launchnavigator.APP.WAZE;
                    } else {
                        console.warn("Waze não disponível");
                        app = launchnavigator.APP.USER_SELECT;
                    }
                    launchnavigator.navigate(wazeLocation, {
                        app: app
                    });
                });
            });

        });

        myApp.onPageInit('confirmar-entrega', function (page) {
            var pageContainer = $(page.container);

            pageContainer.find("input, textarea").off('focus').on('focus', function () { Dom7('.rodape').hide(); }).off('blur').on('blur', function () { Dom7('.rodape').show(); });

            pageContainer.on('click', '.back', function (e) {
                me.abreAlvo(page.context.vloc_codigo, "back");
            });

            pageContainer.on('click', '.anexar-fotos', function (e) {
                var dados = page.context;
                mainView.router.load({ url: 'anexar-fotos.html', context: dados });
            });

            pageContainer.on('click', '.gravar-assinatura', function (e) {
                var dados = page.context;
                mainView.router.load({ url: 'assinatura_responsavel.html', context: dados });
            });

            pageContainer.on('click', '.btnSalvar', function (e) {
                e.preventDefault();

                var fm = pageContainer.find('form');
    
                var erros = valida_form(fm, true);
                console.log(erros);
                if(erros.length > 0) {
                    myApp.alert(getErrorMessage('VerificarErros'), getAlertMessage('Atencao'));
                    return false;
                }

                fm.find('.has-error').removeClass('has-error');


                var codigo  = getFieldValue(fm, 'codigo');
                var nome    = getFieldValue(fm, 'nome');
                // var cpf     = getFieldValue(fm, 'cpf', so_numeros);
                var cpf     = getFieldValue(fm, 'cpf');
                var rg      = getFieldValue(fm, 'rg');

                if (!nome) {
                    fm.find('input[name=nome]').parent().parent().parent().addClass('has-error');
                } else {
                    myApp.modal({
                        title: getAlertMessage('Atencao'),
                        text: getAlertMessage('DesejaConfirmarEntrega'),
                        buttons: [
                            {
                                text: getAlertMessage('SimM'),
                                close: true,
                                onClick: function (obj) {
                                    me.confirmaEntrega(codigo, nome, cpf, rg).done(function () {
                                        me.abreAlvo(codigo, "back");
                                    });
                                }
                            },
                            {
                                text: getAlertMessage('NaoM'),
                                close: true
                            },
                        ]

                    });
                    // myApp.confirm('Deseja realmente confirmar esta entrega?', getAlertMessage('Atencao'), function () {
                    //     me.confirmaEntrega(codigo, nome, cpf, rg).done(function(){
                    //         me.abreAlvo(codigo,"back");
                    //     });
                    // });
                }
            });

        });

        myApp.onPageInit('anexar-fotos', function (page) {
            var pageContainer = $(page.container);

            me.setupGallery();

            pageContainer.on('click', '.back', function (e) {
                me.abreConfirmacaoEntrega(page.context.vloc_codigo, "back");
            });

            pageContainer.on('click', '#fotos .lista .foto', function (e) {
                e.preventDefault();

                me.gallery.open($(this).parent().index());
            });
            pageContainer.on('click', '#fotos .bubbles a', function (e) {
                e.preventDefault();

                var origem = $(this).attr('data-origem');

                control.fotos.openPicture(origem);
            });
        });

        myApp.onPageInit('assinatura_responsavel', function (page) {
            var pageContainer = $(page.container);

            var wrapper = $("#signature-pad").get(0);
            var canvas = $("canvas").get(0);
            var signaturePad = new SignaturePad(canvas, { backgroundColor: 'rgb(255, 255, 255)' });
            var storage = window.localStorage;
            var vloc_codigo = page.context.vloc_codigo;

            pageContainer.on('click', '.botao-assinar-novamente', function (e) {
                signaturePad.clear();
            });

           pageContainer.on('click', '.botao-salvar', function (e) {
                if (signaturePad.isEmpty()) {
                    myApp.alert(getErrorMessage('FacaAssinaturaAntesEnviar'),getAlertMessage('Atencao'));
                } else {

                    var dataURL = signaturePad.toDataURL();
                    storage.setItem('assinatura', dataURL);

                    enviarAssinatura({ foto_assinatura: dataURL, codigo_entrega:vloc_codigo, token:getLocalValue('token') }).done(function () {
                        console.log('Assinatura enviada!');
                         myApp.alert(getSuccessMessage('AssinaturaSalva'),getSuccessMessage('Sucesso'));
                         mainView.router.back();
                    }).fail(function () {
                        console.log('Falha ao enviar assinatura!');
                        myApp.alert(getErrorMessage('FalhaSalvarAssinatura'),getErrorMessage('Falha'));
                    });

                }
            });
            
        });

    }
    this.syncAlvos = function () {
        var me = this;
        var deferred = $.Deferred();
        if (getLocalValue('viag_codigo_sm')) {
            control.alvo.sincronizaEntregas().done(function (msg) {
                if (mainView.activePage.name == "viagem") {
                    control.viagem.getViagemCompleta().done(function (viagem_atual) {
                        mainView.showNavbar();
                        mainView.router.load({ url: 'viagem.html', context: viagem_atual, reload: true });
                        deferred.resolve("syncAlvos: Done.");
                    }).fail(function (msg) {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('database', '100016', { classe: 'alvo.class.js', metodo: 'syncAlvos' }, { mensagem_padrao: "syncAlvos: Process error: " + msg + ' - SQL: ' + sql });
                        deferred.reject("[100016]syncAlvos: Process error: " + msg);
                    });
                } else {
                    deferred.resolve("syncAlvos: Done.");
                }
            }).fail(function (msg) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database', '100017', { classe: 'alvo.class.js', metodo: 'syncAlvos' }, { mensagem_padrao: "syncAlvos: Process error: " + msg + ' - SQL: ' + sql });
                deferred.reject("[100017]syncAlvos: Process error: " + msg);
            });
        } else {
            deferred.resolve("syncAlvos: Done.");
        }
        return deferred.promise();
    }
    this.ajaxMarcaAlvosEntregues = function (deferred, settings, targets, cur) {
        var me = this;
        var len = targets.length;
        var cur = (!cur || cur == "undefined") ? 0 : cur;
        if (cur < len) {
            var pos = control.posicao.getLastPosition();
            var info = {
                aplicativo: config.appAlias,
                plataforma: config.appDevice,
                versao: config.appVersion,
                documento: settings.documento,
                token: settings.token,
                id: targets[cur].id,
                viag_codigo_sm: targets[cur].viag_codigo_sm,
                vloc_codigo: targets[cur].vloc_codigo,
                vloc_nome_receptor: targets[cur].vloc_nome_receptor,
                vloc_cpf_receptor: targets[cur].vloc_cpf_receptor,
                vloc_rg_receptor: targets[cur].vloc_rg_receptor,
                confirmtime: targets[cur].confirmtime,
                rejeicao_motivo: targets[cur].rejeicao_motivo,
                rejeicao_data: targets[cur].rejeicao_data,
                lat: pos['lat'],
                lng: pos['lng']
            }
            control.rest.makeRequest('/api_motorista_mobile/marca_alvo_entregue', info, false).done(function (dados) {
                var mainError = typeof dados.erro != 'undefined' ? dados.erro : 0;
                mainError = !mainError && !dados.sucesso ? 1 : mainError;
                if (!mainError) {
                    control.db.updateRow(me, { sent: curTime() }, 'id', info.id).always(function () {
                        me.ajaxMarcaAlvosEntregues(deferred, settings, targets, (cur + 1));
                    });
                } else {
                    me.ajaxMarcaAlvosEntregues(deferred, settings, targets, (cur + 1));
                }
            }).fail(function (msg) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('API', '300031', { classe: 'alvo.class.js', metodo: 'ajaxMarcaAlvosEntregues' }, { mensagem_padrao: msg });
                me.ajaxMarcaAlvosEntregues(deferred, settings, targets, (cur + 1));
            });
        } else {
            deferred.resolve('marcaAlvosEntregues: Done.');
        }
    }
    this.marcaAlvosEntregues = function () {
        var me = this;
        var deferred = $.Deferred();
        control.db.selectRows(control.settings, 'codigo', 1, 1).done(function (settings) {
            control.db.selectRows(me, 'sent', null).done(function (targets) {
                me.ajaxMarcaAlvosEntregues(deferred, settings, targets, 0);
            }).fail(function (msg) {
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database', '100066', { classe: 'alvo.class.js', metodo: 'ajaxMarcaAlvosEntregues' }, { mensagem_padrao: 'marcaAlvosEntregues: Query error' + msg });
                deferred.reject('[100066]marcaAlvosEntregues: Query error');
            });
        }).fail(function () {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('database', '100067', { classe: 'alvo.class.js', metodo: 'ajaxMarcaAlvosEntregues' }, { mensagem_padrao: 'marcaAlvosEntregues: Query error' + msg });
            deferred.reject('[100067]marcaAlvosEntregues: Query error');
        });
        return deferred.promise();
    }
    this.sincronizaEntregasSetTargets = function (deferred, entregas, cur) {
        var me = this;
        var len = entregas.length;
        cur = (!cur || cur == "undefined") ? 0 : cur;
        if (cur < len) {
            control.db.selectRows(me, 'vloc_codigo', entregas[cur][0].vloc_codigo).done(function (entrega_db) {
                if (entrega_db.length == 0) {
                    entrega = entregas[cur][0];
                    var dados_entrega = {
                        viag_codigo_sm: entrega.viag_codigo_sm,
                        vloc_codigo: entrega.vloc_codigo,
                        vloc_sequencia: entrega.vloc_sequencia,
                        vloc_tpar_codigo: entrega.vloc_tpar_codigo,
                        vloc_status_viagem: entrega.vloc_status_viagem,
                        vloc_nome_receptor: entrega.vloc_nome_receptor,
                        vloc_cpf_receptor: entrega.vloc_cpf_receptor,
                        vloc_rg_receptor: entrega.vloc_rg_receptor,
                        confirmtime: entrega.vloc_data_conf_mobile,
                        rejeicao_motivo: entrega.vloc_vlrm_codigo,
                        rejeicao_data: entrega.vloc_rejeicao_data,
                        refe_descricao: entrega.refe_descricao,
                        refe_rua: entrega.refe_endereco_empresa_terceiro,
                        refe_numero: entrega.refe_numero,
                        refe_bairro: entrega.refe_bairro_empresa_terceiro,
                        refe_cidade: entrega.cida_descricao,
                        refe_estado: entrega.esta_sigla,
                        refe_cep: entrega.refe_cep,
                        refe_latitude: entrega.refe_latitude,
                        refe_longitude: entrega.refe_longitude,
                        refe_latitude_min: entrega.refe_latitude_min,
                        refe_latitude_max: entrega.refe_latitude_max,
                        refe_longitude_min: entrega.refe_longitude_min,
                        refe_longitude_max: entrega.refe_longitude_max,
                        refe_raio: entrega.refe_raio,
                        refe_poligono: entrega.refe_poligono,
                        refe_circulo: entrega.refe_circulo,
                        tpar_descricao: entrega.tpar_descricao,
                        sent: curTime(),
                        nfs: entrega.nfs
                    };
                    control.db.insertRow(me, dados_entrega).always(function (retorno) {
                        me.sincronizaEntregasSetTargets(deferred, entregas, (cur + 1));
                    });
                } else {
                    var dados_update = {};
                    var dados_vloc = entregas[cur][0];
                    dados_update['vloc_status_viagem'] = dados_vloc.vloc_status_viagem;
                    if (dados_vloc.vloc_vlrm_codigo)
                        dados_update['rejeicao_motivo'] = dados_vloc.vloc_vlrm_codigo;
                    if (dados_vloc.vloc_rejeicao_data)
                        dados_update['rejeicao_data'] = dados_vloc.vloc_rejeicao_data;
                    if (dados_vloc.vloc_nome_receptor)
                        dados_update['vloc_nome_receptor'] = dados_vloc.vloc_nome_receptor;
                    if (dados_vloc.vloc_cpf_receptor)
                        dados_update['vloc_cpf_receptor'] = dados_vloc.vloc_cpf_receptor;
                    if (dados_vloc.vloc_rg_receptor)
                        dados_update['vloc_rg_receptor'] = dados_vloc.vloc_rg_receptor;
                    if (dados_vloc.vloc_data_conf_mobile)
                        dados_update['confirmtime'] = dados_vloc.vloc_data_conf_mobile;
                    if (dados_vloc.nfs)
                        dados_update['nfs'] = dados_vloc.nfs;
                    control.db.updateRow(me, dados_update, 'vloc_codigo', dados_vloc.vloc_codigo).always(function (retorno) {
                        me.sincronizaEntregasSetTargets(deferred, entregas, (cur + 1));
                    });
                }
            });
        } else {
            deferred.resolve('Sync completed: sincronizaEntregas');
        }
    }
    this.sincronizaEntregas = function () {
        var me = this;
        var deferred = $.Deferred();
        if (getLocalValue('viag_codigo_sm')) {
            control.db.selectRows(me, 1, 1).done(function (res) {
                var arrAlvos = [];
                for (i in res)
                    arrAlvos.push(res[i].vloc_codigo);
                var settings = {
                    'documento': getLocalValue('cpf'),
                    'token': getLocalValue('token'),
                    'aplicativo': config.appName,
                    'plataforma': config.appDevice,
                    'versao': config.appVersion,
                    'viag_codigo_sm': getLocalValue('viag_codigo_sm'),
                    'alvos_atuais': arrAlvos
                };
                control.rest.makeRequest('/api_motorista_mobile/get_entregas', settings, false).done(function (dados) {
                    if (dados.erro) {
                        if (dados.erro.substr(0, 7) == 'O Token') control.settings.doLogoff();
                        if (dados.erro.substr(0, 8) == 'El Token') control.settings.doLogoff();
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('database', '100068', { classe: 'alvo.class.js', metodo: 'sincronizaEntregas' }, { mensagem_padrao: 'Sync fail: sincronizaEntregas / ajax get_entregas - ' + dados.erro });
                        deferred.reject('[100068]Sync fail: sincronizaEntregas / ajax get_entregas - ' + dados.erro);
                    } else {
                        me.sincronizaEntregasSetTargets(deferred, dados.entregas, 0);
                    }
                }).fail(function (msg) {
                    //Adicionar erro nao fatal ao fabric
                    ErrorClass.parseError('database', '100069', { classe: 'alvo.class.js', metodo: 'sincronizaEntregas' }, { mensagem_padrao: 'Sync fail: sincronizaEntregas / ajax get_entregas -' + msg });
                    deferred.reject('[100069]Sync fail: sincronizaEntregas / ajax get_entregas');
                });
            });
        } else {
            deferred.resolve('Sync completed: sincronizaEntregas');
        }
        return deferred.promise();
    }
    this.loadTableInfo = function () {
        this.tbName = 'alvo';
        this.tbPK = 'id';
        this.tbFields = {
            "id": "INTEGER AUTOINCREMENT PRIMARY KEY",
            "viag_codigo_sm": "INTEGER",
            "vloc_codigo": "INTEGER",
            "vloc_sequencia": "INTEGER",
            "vloc_tpar_codigo": "INTEGER",
            "tpar_descricao": "TEXT",
            "vloc_status_viagem": "TEXT",
            "vloc_nome_receptor": "TEXT",
            "vloc_cpf_receptor": "TEXT",
            "vloc_rg_receptor": "TEXT",
            "refe_descricao": "TEXT",
            "refe_rua": "TEXT",
            "refe_numero": "INTEGER",
            "refe_bairro": "TEXT",
            "refe_cidade": "TEXT",
            "refe_estado": "TEXT",
            "refe_cep": "TEXT",
            "refe_latitude": "TEXT",
            "refe_longitude": "TEXT",
            "refe_latitude_min": "TEXT",
            "refe_latitude_max": "TEXT",
            "refe_longitude_min": "TEXT",
            "refe_longitude_max": "TEXT",
            "refe_raio": "FLOAT",
            "refe_poligono": "TEXT",
            "refe_circulo": "INTEGER",
            "confirmtime": "TEXT",
            "rejeicao_motivo": "INTEGER",
            "rejeicao_data": "TEXT",
            "sent": "TEXT",
            "nfs": "TEXT"
        };
    }

    this.createTable = function () {
        var deferred = $.Deferred();

        control.db.createTable(this).done(function () {
            deferred.resolve();
        }).fail(function (e) {
            deferred.reject(e);
        });

        return deferred.promise();
    }

    this.dropTable = function () {
        var deferred = $.Deferred();

        control.db.dropTable(this).done(function () {
            deferred.resolve();
        }).fail(function (e) {
            deferred.reject(e);
        });

        return deferred.promise();
    }
}