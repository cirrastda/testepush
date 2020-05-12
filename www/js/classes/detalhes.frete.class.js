var DetalhesFreteClass = function(){
	this.page = null;
	this.data = null;
	this.$$ = null;
	
  this.tbName   = null;
  this.tbPK     = null;
  this.tbFields = {};

  this.init = function(){
	   this.loadTableInfo();

     this.setupView();
     
	}

	this.renderButtons = function() {
		var me = this;
		
		var view = $(mainView.activePage.container);

		var frete = {
                  id : me.data.codigo_frete,
                  encerrado : 'S'
                };	
		
		//ENCERRAR FRETE
		me.$$('#btnEncerrar').on('click',function() {
        frete.encerrado = "S";
		    me.acaoEncerrar(frete);
		});

    //ENCERRAR FRETE
    me.$$('#btnCancelar').on('click',function() {
        frete.encerrado = "N";
        me.acaoEncerrarOuCancelar(frete)
    });
		
	}

  this.setupView = function() {
    var me = this;
    
    myApp.onPageInit('detalhes-frete', function(page) {
        me.$$ = Dom7;
        var pageContainer = $(page.container);

        me.data = page.context;

        me.renderButtons();

    });

  } 

  

  this.acaoEncerrar = function(frete) {
      var deferred = $.Deferred();
      var me = this;
      control.avaliarFrete.loadModal(frete, true).done(function(frete) {
          me.encerrarFrete(frete,getAlertMessage('FreteEncerrado')).done(function() {
            myApp.closeModal();
            deferred.resolve();
          }).fail(function(msg) {
            me.acaoEncerrar(frete);
            deferred.reject(msg);
          });
      }).fail(function(msg) {
          me.acaoEncerrar(frete);
          deferred.reject(msg);
      });


      return deferred.promise();
  }

  this.encerrarFrete = function(frete, msg_success) {
      var deferred = $.Deferred();
      var me = this;
      encerrarFrete(frete).done(function(res){
        myApp.alert(msg_success, getAlertMessage('Sucesso'), function () {
              me.deleteLocalFrete(me.data.codigo_frete);//Deleta localmente
              //Atualiza página
              mainView.router.back({url:'meus-fretes.html', ignoreCache: true, force: true }); 
        });
        deferred.resolve();
      }).fail(function(erro){
        myApp.closeModal();
        myApp.alert(erro, 'Atenção');                             
        deferred.reject(erro);
      });

      return deferred.promise();
  }

  this.novoFreteRecebido = function(id_frete) {
      var deferred = $.Deferred();
      var me = this;
      getDadosFrete(id_frete).done(function (dados_frete) {
        control.db.selectRows(me, 'codigo_frete', id_frete).done(function(item){
          if(item.length == 0){
            //Senão encontrar o frete local, inclui
            me.insertLocalFrete(dados_frete).done(function () {
              deferred.resolve(dados_frete);
            }).fail(function(msg) {
              ErrorClass.parseError('database','100095', { classe: 'detalhes.frete.class.js', metodo: 'novoFreteRecebido'},{mensagem_padrao: + 'Erro ao adicionar frete: '+msg });
              deferred.reject(msg);
            }); 
          } else {
            deferred.resolve(dados_frete);            
          }
        }).fail(function(msg) {
          ErrorClass.parseError('database','100096', { classe: 'detalhes.frete.class.js', metodo: 'novoFreteRecebido'},{mensagem_padrao: + 'Erro ao buscar frete: '+msg });
          deferred.reject(msg);
        });
      }).fail(function(msg) {
        deferred.reject(msg);        
      }); 

      return deferred.promise();

  }

  this.acaoEncerrarOuCancelar = function(frete) {
      var deferred = $.Deferred();
      var me = this;
      var msg = getAlertMessage("DesejaCancelarFrete");
      var title = getAlertMessage("CancelarFrete");
      var msg_success = getAlertMessage("SolicitacaoCancelamentoEnviada");
      if(frete.encerrado == "S"){
        msg = getAlertMessage("ConfirmaEncerramento");
        title = getAlertMessage("EncerrarFrete");
        msg_success = getAlertMessage("FreteEncerrado");
      }
      
      myApp.modal({
        title: title,
        text: msg,
        buttons: [
          {
            text: getAlertMessage("NaoM"),
            close: true
          },
          {
            text: getAlertMessage("SimM"),
            close: true,
            onClick: function () {
              me.encerrarFrete(frete,msg_success).done(function() {
                deferred.resolve();
              }).fail(function (erro) {
                deferred.reject(erro);
              });
            }
          }


        ]
      })
      // myApp.confirm(msg, title, 
      //     function () {
      //       me.encerrarFrete(frete,msg_success).done(function() {
      //         deferred.resolve();
      //       }).fail(function (erro) {
      //         deferred.reject(erro);
      //       });
      //     },
      //     function () {}
      // );

      return deferred.promise();
  }

  this.limpaFretes = function(){
      var me = this;

      var deferred = $.Deferred();

      control.db.selectRows(me, 1, 1).done(function(item){
          for(i in item) {
            console.log(item[i]);
            me.deleteLocalFrete(item[i].codigo_frete);
          }
          console.log("Resolve Limpa fretes");
          deferred.resolve();
      }).fail(function(){
          console.log("Falha Limpa fretes");
          deferred.reject();
      });

      return deferred.promise();
  }

  this.deleteLocalFrete = function(id_frete){
    var deferred = $.Deferred();
    control.db.deleteRow(this,this.tbPK,id_frete).fail(function (erro) {
      console.log("Delete frete: " + erro); 
      deferred.reject(erro); 
    }).done(function() {
      // console.log('deletado');
      deferred.resolve();
    });
    return deferred.promise();
  }

  this.insertLocalFrete = function(frete){ 
    var deferred = $.Deferred();
    control.db.insertRow(this, frete).done(function(){
      deferred.resolve();
    }).fail(function(m){
      deferred.reject('Erro: ' + m);
    });
    return deferred.promise();
  }
  
  this.syncFretes = function() {
      var me = this;
      var deferred = $.Deferred();

      getFretesEmAtendimento().done(function(res){
        // console.log(res);
        //Insere os dados do frete localmente
        if(res.length > 0){
            var tot = res.length;
            console.log("Tot registros = "+tot);
            for(var i = 0; i < tot; i++){
              // console.log("Frete = "+i);
              // console.log(res[i]);
              (function(j) {
                me.getFretePorCodigo(res[j].codigo_frete).done(function(dados_frete) {
                  if (dados_frete === null) {
                    control.detalhesFrete.insertLocalFrete(res[j]).done(function(){
                      if(j >= (tot-1)){
                        console.log("Resolve reloadFretes");
                        deferred.resolve();  
                      }
                    }).fail(function(ret) {
                      console.log("Reject1 reloadFretes");
                        deferred.reject(ret);                  
                    });
                  }
                }).fail(function(msg) {
                  deferred.reject(msg);
                })
              })(i);
            }
        }else{
          console.log("Resolve2 loadFretes");
          deferred.resolve();
        }
        
      }).fail(function(ret) {
        console.log("Reject2 reloadFretes");
        deferred.reject(ret);  
      });

  }

  this.syncCancelaEncerra = function() {
      var me = this;
      var deferred = $.Deferred();
      me.getLocalFreteEmAtendimento().done(function(res) {
        if (res !== null) {
          if(res.length > 0){
              var tot = res.length;
              console.log("Tot registros = "+tot);
              for(var i = 0; i < tot; i++){
                // console.log("Frete = "+i);
                // console.log(res[i]);
                (function(j) {
                  getDadosFrete(res[j].codigo_frete).done(function(dados_frete) {
                    var status = dados_frete.status;
                    // console.log(status);
                    if (status==6 || status ==7) {
                      control.detalhesFrete.deleteLocalFrete(dados_frete.codigo_frete).done(function () {
                        if(j >= (tot-1)){
                          deferred.resolve();  
                        }                      
                      }).fail(function(ret) {
                          deferred.reject(ret);                  
                      });
                    }
                  }).fail(function(msg) {
                    deferred.reject(msg);
                  })
                })(i);
              }
          }else{
            console.log("Resolve2 loadFretes");
            deferred.resolve();
          }
        } else {
          deferred.resolve();
        }
      }).fail(function(msg) {
        console.log(msg);
        deferred.reject(msg);
      });

      return deferred.promise();

  }


  // Método que recarrega os fretes vindos do servidor - Chamado no Login
  this.reloadFretes = function() {
      var me = this;
      var deferred = $.Deferred();

      me.limpaFretes().done(function () {
      getFretesEmAtendimento().done(function(res){

        //Insere os dados do frete localmente
        if(res.length > 0){
            var tot = res.length;
            console.log("Tot registros = "+tot);
            for(var i = 0; i < tot; i++){
              // console.log("Frete = "+i);
              // console.log(res[i]);
              (function(j) {
                control.detalhesFrete.insertLocalFrete(res[j]).done(function(){
                  if(j >= (tot-1)){
                    console.log("Resolve reloadFretes");
                    deferred.resolve();  
                  }
                }).fail(function(ret) {
                  console.log("Reject1 reloadFretes");
                    deferred.reject(ret);                  
                });
              })(i);
            }
        }else{
          console.log("Resolve2 loadFretes");
          deferred.resolve();
        }
        
      }).fail(function(ret) {
        console.log("Reject2 reloadFretes");
        deferred.reject(ret);  
      });
      
    }).fail(function(){
      console.log("Reject3 reloadFretes");
      deferred.reject();
    });

    return deferred.promise();
    
  }

  this.getFretePorCodigo = function(codigo){
    
    var deferred = $.Deferred();

    var sql = "SELECT * " +
            " FROM " + this.tbName + 
            " WHERE codigo_frete = " + codigo
            ;

    control.db.query(sql).done(function(itens){
      if(itens.length == 0){
        itens = null;
        deferred.resolve(itens);
      } else {
        deferred.resolve(itens[0]);
      }
    }).fail(function(msg){
      console.log("Erro SQL = "+sql);
      ErrorClass.parseError('database','100096', { classe: 'detalhes.frete.class.js', metodo: 'getFretePorCodigo'},{mensagem_padrao: + 'Erro ao buscar frete: '+msg });
      deferred.reject(msg);
    });

    return deferred.promise();

  }

  this.getLocalFreteEmAtendimento = function(){
    
    var deferred = $.Deferred();

    var sql = "SELECT * " +
            " FROM " + this.tbName + 
            //" ORDER BY " + this.tbPK+ " ASC";
            " ORDER BY data_previsao_inicio DESC";
    control.db.query(sql).done(function(itens){
      if(itens.length == 0){
          itens = null;
      }
      deferred.resolve(itens);
    }).fail(function(msg){
      console.log("Erro SQL = "+sql);
      ErrorClass.parseError('database','100097', { classe: 'detalhes.frete.class.js', metodo: 'getLocalFreteEmAtendimento'},{mensagem_padrao: + 'Erro ao buscar frete: '+msg });
      deferred.resolve(null);
    });

    return deferred.promise();

  }

	this.loadTableInfo = function(){
		this.tbName   = 'frete_em_atendimento';
		this.tbPK     = 'codigo_frete';
		this.tbFields = {
            'codigo_frete':              'INTEGER PRIMARY KEY',  
            'ofertante':            	   'TEXT', 
            'num_transporte':            'TEXT', 
            'data_previsao_inicio':      'DATETIME',
            'data_previsao_entrega':     'DATETIME',
            'valor':      				       'TEXT',
            'valor_fechado':      		   'TEXT',
            'peso':      				         'TEXT',
            'modalidade':      			     'TEXT', 
            'origem':      				       'TEXT',
            'endereco_origem':     	 	   'TEXT',
            'numero_origem':     		     'TEXT',
            'bairro_origem':      		   'TEXT',
            'cidade_origem':      		   'TEXT',
            'uf_origem':      			     'TEXT',
            'cep_origem':      			     'TEXT',
            'destino':      			       'TEXT',
            'endereco_destino':      	   'TEXT',
            'numero_destino':      		   'TEXT',
            'bairro_destino':     		   'TEXT',
            'cidade_destino':     		   'TEXT',
            'uf_destino':      			     'TEXT',
           	'cep_destino':      		     'TEXT',
           	'tipos_veiculos':      		   'TEXT',
           	'tipos_carrocerias':      	 'TEXT',
            "km_total":                  'TEXT',
            "tempo_cadastro":            'TEXT',
        };
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