var comandoClass = function(){
    this.tbName   = null;
    this.tbPK     = null;
    this.tbFields = {};

    this.init = function(){
        var deferred = $.Deferred();

        this.loadTableInfo();

        this.setupView();

        deferred.resolve();

        return deferred.promise();
    }

    this.getComandoById = function(id) {
      var deferred = $.Deferred();
      var me = this;
      control.db.selectRows(me, 'id', id, 1).done(function(comando) {
         deferred.resolve(comando);
      }).fail(function(msg) {
         ErrorClass.parseError('database','100090', { classe: 'mensagem.class.js', metodo: 'getMensagens'},{mensagem_padrao: 'Erro ao buscar mensagens: '+msg});
         deferred.reject(msg);
      })
      return deferred.promise();
    }

    this.insertComando = function(codigo, motivo){
        var me = this;
        var deferred = $.Deferred();

        var msg    = '';
        var motivo = typeof motivo == 'undefined' ? '' : motivo.toUpperCase();

        function incluir(msg, codigo) {
            //var deferred = $.Deferred();
            var pos = control.posicao.getLastPosition();
            
            if (pos['lat']===null || pos['lng']===null) {
                deferred.reject();
            }

            var linha = {
                'latitude':        pos['lat'],
                'longitude':       pos['lng'],
                'data_cadastrada': curTime(),
                'mensagem':        msg,
                'codigo':          codigo
            };

            control.db.insertRow(me, linha).done(function(id){
                if(codigo != 99) control.sync.syncSendComando(false);

                deferred.resolve(id);
            }).fail(function(msg){
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100054', { classe: 'comando.class.js', metodo: 'insertRow', linha: linha},{mensagem_padrao: msg});    
                deferred.reject();
            });

            //return deferred.promise();

        }

        switch(codigo){
            case 1:  msg = "INICIO DE VIAGEM";            break;
            case 2:  msg = "REINICIO DE VIAGEM";          break;
            case 3:  msg = "FIM DE VIAGEM";               break;
            case 4:  msg = "PARADA " + motivo;            break;
            case 98: msg = motivo;                        break;
            case 99: msg = "ATUALIZAR VIAGEM";            break;

            default: deferred.reject('[900004]'+getErrorMessage('Comando inválido'));
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('generico','900004', { classe: 'comando.class.js', metodo: 'insertComando', codigo: codigo, motivo: motivo},{mensagem_padrao: 'Comando inválido'});	
            break;
        }

        var pos = control.posicao.getLastPosition();

        if (pos['lat']===null || pos['lng']===null) {
            deferred.reject();
        }

        msg = getMensagemComando(msg);
        if (typeof msg != 'string') {
            console.log(msg);
            msg.done(function(message) {
                incluir(message, codigo);
            });
        } else {
            incluir(msg, codigo);
        }

        return deferred.promise();
    }

    this.validDataComando = function(data, no_passado) {
        var sucesso = true;
        var msg_erro = [];
        if (typeof no_passado === "undefined") no_passado = false;
        if (data.latitude == null) {
            sucesso = false;
            msg_erro.push("Latitude não informada");
        }
        if (data.longitude == null) {
            sucesso = false;
            msg_erro.push("Longitude não informada");
        }
        if (data.mensagem == null) {
            sucesso = false;
            msg_erro.push("Mensagem não informada");
        }
        if (data.codigo == null) {
            sucesso = false;
            msg_erro.push("Código não informado");
        }
        if (no_passado) {
            if (data.data_cadastrada == null) {
                sucesso = false;
                msg_erro.push("Dt. Cadastrada não informada");
            }
            
            if (data.sent == null) {
                sucesso = false;
                msg_erro.push("Dt. Envio não informada");
            }

        }
        return {
            sucesso: sucesso,
            erro: msg_erro
        };
    }

    this.insertComandoHistorico = function(data){
        var me = this;
        var deferred = $.Deferred();

        var msg    = '';
        var motivo = typeof motivo == 'undefined' ? '' : motivo.toUpperCase();

        function incluir(data) {
            //var deferred = $.Deferred();
            
            var valid = me.validDataComando(data, true);
            if (!valid.sucesso) {
                deferred.reject();
            }



            control.db.insertRow(me, data).done(function(){

                deferred.resolve();
            }).fail(function(msg){
                //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100054', { classe: 'comando.class.js', metodo: 'insertRow', linha: linha},{mensagem_padrao: msg});    
                deferred.reject();
            });

            //return deferred.promise();

        }


        var codigo = 98;
        if (data.mensagem !== null) {
            var mensagem = getMensagemComandoReverse(data.mensagem);
            if (mensagem == "INICIO DE VIAGEM") codigo = 1;
            if (mensagem == "REINICIO DE VIAGEM") codigo = 2;
            if (mensagem == "FIM DE VIAGEM") codigo = 3;
            if (mensagem.substr(0,6) == "PARADA") codigo = 4;
        }
        data.codigo = codigo;
        if (data.data_cadastrada !== null) {
            data.data_cadastrada = formataDataDb(data.data_cadastrada);            
        }
        if (data.sent !== null) {
            data.sent = formataDataDb(data.sent);
        }


        incluir(data);

        return deferred.promise();
    }


    this.setupView = function(){
        var me = this;

        myApp.onPageInit('comandos', function(page) {
            var pageContainer = $(page.container);
            var ptrContent = $('.pull-to-refresh-content.comandos');

            ptrContent.on('refresh', function (e) {
                control.db.selectRows(me, 1, 1, false, 'id', 'DESC').done(function(res){
                    var itens = [];

                    for(i in res){
                        itens[i] = {};

                        for(x in res[i]) itens[i][x] = res[i][x];

                        itens[i]['sent']            = formataDataView(itens[i]['sent']);
                        itens[i]['data_cadastrada'] = formataDataView(itens[i]['data_cadastrada']);
                    }

                    var itens = { 'comandos': itens };

                    mainView.router.load({ url: 'comandos.html', context: itens, reload: true });
                }).always(function(){
                    myApp.pullToRefreshDone();
                });
            });
        });
    }

   this.syncGetComandos = function () {
      var me = this;
      var deferred = $.Deferred();
      var recebidas = [];
      if ((getLocalValue('viag_codigo_sm')) && (getLocalValue('sm_em_transito')=='1') ) {
         control.settings.getDataByDocumento().done(function(settings) {
            getComandos(getLocalValue('viag_codigo_sm'), settings.tecnologia, settings.versao_tec).done(function(comandos) {
               var total = comandos.length;
               for(var j in comandos) {
                  (function(i) {
                     me.insertComandoHistorico(comandos[i]).done(function() {
                        deferred.resolve();
                     }).fail(function(msg) {
                        deferred.reject(msg);
//                        break;
                     })
                  })(j);
               }
            }).fail(function(msg) {
               console.log(msg);
               deferred.reject(msg);
            });            
         }).fail(function(msg) {
            console.log(msg);
            deferred.reject(msg);
         });
      } else {
         deferred.resolve("syncGetComandos: Done.");
      }
      return deferred.promise();
   }

    this.sincronizaComandos = function(){
        var me          = this;
        var deferred    = $.Deferred();
        var qtd         = 0;

        control.db.selectRows(me, 'sent', null).done(function(comandos){
            if(comandos.length){
                qtd = 0;
                var info = {
                    'aplicativo': config.appAlias,
                    'plataforma': config.appDevice,
                    'versao':     config.appVersion,
                    // 'documento':  so_numeros(getLocalValue('cpf')),
                    'documento':  getLocalValue('cpf'),
                    'token':      getLocalValue('token'),
                    'comandos':   []
                }

                for(idx in comandos){
                    qtd++;

                    if (qtd > 30) break;
                    var mensagem = normalizaTexto(comandos[idx].mensagem);
                    if (mensagem != '' && comandos[idx].latitude !== null && comandos[idx].longitude !== null) {
                        var cmd = {
                            'id':              comandos[idx].id,
                            'codigo':          comandos[idx].codigo,
                            'mensagem':        mensagem,
                            'latitude':        comandos[idx].latitude,
                            'longitude':       comandos[idx].longitude,
                            'data_cadastrada': comandos[idx].data_cadastrada

                        }
                        info['comandos'].push(cmd);
                    } else {
                        var sql   = 'UPDATE comando SET sent = ? WHERE id = ' + comandos[idx].id + '';
                        var param = [curTime()];
                        control.db.query(sql, param);
                    }
                }

                control.rest.makeRequest('/api_motorista_mobile/saveComando', info, false).done(function(result){
                    if(!result.erro){
                        var sql   = 'UPDATE comando SET sent = ? WHERE id IN (' + result.data.id.join(', ') + ')';
                        var param = [ result.data.dt_sync ];
                        control.db.query(sql, param);
                        deferred.resolve("syncSendComando: Done.");
                    } else {
                        //Adicionar erro nao fatal ao fabric
		                ErrorClass.parseError('API','300006', { classe: 'comando.class.js', metodo: 'sincronizaComandos', info: info},{mensagem_padrao: "syncSendComando: Process error: " + result.data});
                        deferred.reject("[300006]syncSendComando: Process error: " + result.data);
                    }
                }).fail(function(error){
                    //Adicionar erro nao fatal ao fabric
		            ErrorClass.parseError('API','300007', { classe: 'comando.class.js', metodo: 'sincronizaComandos', info: info},{mensagem_padrao: "syncSendComando: Process error: " + error.data});
                    deferred.reject("[300007]syncSendComando: Response error.");
                });
            } else {
                deferred.resolve("syncSendComando: Done.");
            }
        }).fail(function(){
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100055', { classe: 'comando.class.js', metodo: 'sincronizaComandos', },{mensagem_padrao: "syncSendComando: Query error."});
            deferred.reject("[100055]syncSendComando: Query error.");
        });
        return deferred.promise();
    }//FINAL FUNCTION sincronizaComandos

    this.limpaComandos = function(){
        var me = this;
        var deferred = $.Deferred();
        control.db.query("SELECT id FROM comando WHERE sent IS NOT NULL ORDER BY id DESC LIMIT 5000").done(function(res){
            if(res){
                var arrIds = [];

                for(idx in res) arrIds.push(res[idx]['id']);

                control.db.query("DELETE FROM comando WHERE sent IS NOT NULL AND id NOT IN (" + arrIds.join(',') + ")").always(function(){
                    deferred.resolve();
                });
            } else {
                deferred.resolve();
            }
        }).fail(function(msg){
            //Adicionar erro nao fatal ao fabric
			ErrorClass.parseError('database','100056', { classe: 'comando.class.js', metodo: 'limpaComandos', sql: "SELECT id FROM comando WHERE sent IS NOT NULL ORDER BY id DESC LIMIT 5000" },{mensagem_padrao: msg});
            deferred.reject();
        });

        return deferred.promise();
    }

    this.loadTableInfo = function(){
        this.tbName   = 'comando';
        this.tbPK     = 'id';
        this.tbFields = {
            'id':              'INTEGER AUTOINCREMENT PRIMARY KEY',
            'latitude':        'TEXT',
            'longitude':       'TEXT',
            'data_cadastrada': 'TEXT',
            'mensagem':        'TEXT',
            'codigo':          'INTEGER',
            'sent':            'TEXT'
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
        });

        return deferred.promise();
    }

}