var mensagemClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};
	this.push     = null;
	this.pushErr  = 0;
	this.page 	  = null;

   this.notification = null;

	this.init = function(){
		var deferred = $.Deferred();
		this.loadTableInfo();
		this.setupView();
		this.dados = [];
		deferred.resolve();
		return deferred.promise();
	}

   this.limpaMensagens = function() {
      var deferred = $.Deferred();
      var me = this;
      control.db.deleteRow(me, 1, 1).done(function() {
         deferred.resolve();
      }).fail(function(msg) {
         ErrorClass.parseError('database','100089', { classe: 'mensagem.class.js', metodo: 'limpaMensagens'},{mensagem_padrao: 'Erro ao limpar mensagens: '+msg});
         deferred.reject(msg);
      })
      return deferred.promise();
   }

   this.getMensagens = function() {
      var deferred = $.Deferred();
      var me = this;
      control.db.selectRows(me, 1, 1).done(function(mensagens) {
         deferred.resolve(mensagens);
      }).fail(function(msg) {
         ErrorClass.parseError('database','100090', { classe: 'mensagem.class.js', metodo: 'getMensagens'},{mensagem_padrao: 'Erro ao buscar mensagens: '+msg});
         deferred.reject(msg);
      })
      return deferred.promise();
   }

   this.getNovasMensagens = function() {
      var deferred = $.Deferred();
      var me = this;
      control.db.selectRows(me, 'data_lida', null).done(function(mensagens) {
         deferred.resolve(mensagens);
      }).fail(function(msg) {
         ErrorClass.parseError('database','100091', { classe: 'mensagem.class.js', metodo: 'getMensagens'},{mensagem_padrao: 'Erro ao buscar novas mensagens: '+msg});
         deferred.reject(msg);
      })
      return deferred.promise();
   }

   this.getMensagensListagem = function() {
      var me = this;
      var deferred = $.Deferred();

      var codigo_sm = getLocalValue('viag_codigo_sm');
      var mensagens = [];
      var dados_viagem = me.dados_viagem;

      if (dados_viagem.viag_data_inicio == null || dados_viagem.viag_data_inicio_provisorio == null) {
         deferred.resolve(mensagens);
         return;
      } else {
         var data_inicio = (dados_viagem.viag_data_inicio != null ? dados_viagem.viag_data_inicio : dados_viagem.viag_data_inicio_provisorio);
         var sql = "SELECT * FROM ( "+
         "SELECT 'R' as tipo, codigo, texto, data_cadastrada, data_lida "+
         "FROM mensagem "+
         "UNION "+
         "SELECT 'E' as tipo, id as codigo, mensagem as texto, data_cadastrada, sent as data_lida "+
         "FROM comando "+
         "WHERE codigo <> 99 "+
         "AND data_cadastrada >= '"+data_inicio+"' "+
         ") AS x "+
         "ORDER BY data_cadastrada"
         control.db.query(sql).done(function(mensagens) {
            deferred.resolve(mensagens);
         }).fail(function(msg) {
            console.log(sql);
            ErrorClass.parseError('database','100093', { classe: 'mensagem.class.js', metodo: 'getMensagensListagem'},{mensagem_padrao: 'Erro ao listar mensagens: '+msg});
            deferred.reject(msg);
         });

      }
      return deferred.promise();
   }

   this.clearMessages = function() {
      $$('.listMensagens').html("");
   }

   this.showMessage = function(message) {
      var classe = (message.tipo=='R' ? 'mensagem-recebida' : 'mensagem-enviada');
      var classe_hide = (message.tipo=='R' ? 'hide-recebida' : 'hide-enviada');
      var classe_line = (message.tipo=='R' ? 'line-recebida' : 'line-enviada');
      var html = "<div class='mensagem-item "+classe+"'>"+
         "<div class='"+classe_hide+"'></div>"+
         "<div class='"+classe_line+"'></div>"+
         message.texto
      "</div>";
      // console.log($$('.listMensagens'));
      $$('.listMensagens').append(html);
      $$('.listMensagens').scrollTop($$('.listMensagens').prop("scrollHeight"));
   }

   this.loadMensagens = function(pageContainer) {
      var me = this;
      console.log('loadMensagens');
      var deferred = $.Deferred();
      me.clearMessages();
      me.getMensagensListagem().done(function(mensagens) {
         console.log(mensagens);
         var total = mensagens.length
         if (total == 0) {
            deferred.resolve();
         } else {
            for(var j in mensagens) {
               (function(i) {
                  var mensagem = mensagens[i];
                  me.showMessage(mensagem);
                  if (mensagem.tipo=='R' && mensagem.data_lida===null) {
                     me.marcaMensagemLida(mensagem.codigo);
                  }  
                  if (i == total-1) deferred.resolve();
               })(j);
            }            
         }
      }).fail(function(erro) {
         console.log(erro);
         deferred.reject(erro);
      });
      return deferred.promise();
   }

   this.marcaMensagemLida = function(codigo) {
      var deferred = $.Deferred();
      var me = this;
      var data = {
         'data_lida': curTime()
      };
      control.db.updateRow(me,data, 'codigo', codigo).done(function(ret) {
         deferred.resolve(true);
      }).fail(function(msg) {
         ErrorClass.parseError('database','100092', { classe: 'mensagem.class.js', metodo: 'getMensagens'},{mensagem_padrao: 'Erro ao marcar mensagem como lida: '+msg});
         deferred.reject(msg);
      })
      return deferred.promise();
   }

   this.incluirMensagemRecebida = function(dados_mensagem) {
      var deferred = $.Deferred();
      var me = this;
      var data = {
         codigo: dados_mensagem.envi_codigo,
         tipo: 'R',
         texto: dados_mensagem.emli_texto,
         data_registro: dados_mensagem.envi_data_cadastro,
         data_cadastrada: curTime(),
         data_lida: null
      };

      control.db.insertRow(me, data).done(function(id) {
         deferred.resolve(id);
      }).fail(function(msg) {
         deferred.reject(msg);
      });

      return deferred.promise();
   }

   this.hideMessageNotification = function() {
      var me = this;
      if (me.notification) {
         myApp.closeNotification(me.notification);
         me.notification = null;
      }
   }

   this.messageNotification = function(mensagens) {
      var me = this;
      if (me.notification) {
         myApp.closeNotification(me.notification);
         me.notification = null;
      }
      console.log(mensagens);
      me.notification = myApp.addNotification({
         title: "<span class='not-blink'>"+getMessage('NovasMensagensRecebidas')+"</span>",
         subtitle: mensagens.join('<br />'),
      });
   }

   this.comandoAsMessage = function(comando) {
      var message = {
         codigo: comando.id,
         tipo: 'E',
         texto: comando.mensagem,
         data_cadastrada: comando.data_cadastrada,
      };
      return message;
   }

   this.checkPage = function() {
      var type = 0;
      if (mainView.activePage.name=='viagem' || 
         mainView.activePage.name=='anexar-fotos' || 
         mainView.activePage.name=='assinatura_responsavel' || 
         mainView.activePage.name=='comandos' || 
         mainView.activePage.name=='confirmar-entrega' || 
         mainView.activePage.name=='entrega' || 
         mainView.activePage.name=='historico' || 
         mainView.activePage.name=='rota-entrega' || 
         mainView.activePage.name=='sem-viagem'
      ) {
         type = 1;
      } else if(mainView.activePage.name=='enviar-mensagem') {
         type = 2;
      }
      return type;
   }

   this.notifyMensagens = function() {
      var me = this;
      var deferred = $.Deferred();
      var notify = [];
      me.getNovasMensagens().done(function (mensagens) {
         var total = mensagens.length;
         if (total==0) {
            deferred.resolve();
         } else {
            for(var j in mensagens) {
               (function (i) {
                  notify.push(mensagens[i].texto);
                  var chkPage = me.checkPage();
                  if (chkPage==1 || chkPage==2) {
                     me.marcaMensagemLida(mensagens[i].codigo);
                  }
                  if (chkPage==2) {
                     var mensagem = mensagens[i];
                     me.showMessage(mensagem);
                  }
                  if (i==total-1) {
                     if (chkPage==1) {
                        me.messageNotification(notify);
                     }
                  }
                  deferred.resolve();
               })(j);
            }
         }
      }).fail(function(msg) {
         deferred.reject(msg);
      });
      return deferred.promise();
   }

   this.syncGetMensagens = function () {
      var me = this;
      var deferred = $.Deferred();
      var recebidas = [];
      if ((getLocalValue('viag_codigo_sm')) && (getLocalValue('sm_em_transito')=='1') ) {
         control.settings.getDataByDocumento().done(function(settings) {
            getMensagens(getLocalValue('viag_codigo_sm'), settings.tecnologia, settings.versao_tec).done(function(mensagens) {
               var total = mensagens.length;
               if (total==0) {
                  deferred.resolve();
               } else {
                  for(var j in mensagens) {
                     (function(i) {
                        me.incluirMensagemRecebida(mensagens[i]).done(function(id_msg) {
                           recebidas.push({
                              codigo: mensagens[i].envi_codigo,
                              codigo_externo: id_msg
                           });
                           if (i == total-1) {
                              if (recebidas.length>0) {
                                 marcarMensagensRecebidas(recebidas).done(function() {
                                    deferred.resolve();
                                 }).fail(function(msg) {
                                    deferred.reject(msg);
                                 });
                              } else {
                                 deferred.resolve();
                              }
                           }
                        }).fail(function(msg) {
                           deferred.reject(msg);
                           //break;
                        })
                     })(j);
                  }
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
         deferred.resolve("syncAlvos: Done.");
      }
      return deferred.promise();
   }
   this.registrarMensagem = function(motivo){
     var me = this;

     var deferred = $.Deferred();

     var viag_codigo_sm = getLocalValue('viag_codigo_sm');

     control.comando.insertComando(98, motivo).done(function(id){
         deferred.resolve(id);
     }).fail(function(msg){
           //Adicionar erro nao fatal ao fabric
           ErrorClass.parseError('database','100023', { classe: 'viagem.class.js', metodo: 'registrarMensagem'},{mensagem_padrao: + msg.message });                     
          
         deferred.reject('[100023]'+msg);
     });

     return deferred.promise();
   }

   this.setupView = function(){
      var me = this;

     myApp.onPageInit('enviar-mensagem',function(page) {

         me.dados_viagem = page.context;
         console.log(me.dados_viagem);
         var pageContainer = $(page.container);

         me.loadMensagens(pageContainer).done(function(mensagens) {
            $('.listMensagens').scrollTop($('.listMensagens').prop("scrollHeight"));
            console.log('mensagens');
//
         }).fail(function(erro) {
            myApp.alert(erro,getAlertMessage('Atencao'));
         });

         // $('.textMensagem').height($('body').height() - $('.textMensagem').position().top - $('.navbar').height() - $('.subnavbar').height() - $('.botoesMensagem').height() - 30).prop('maxlength',5000);

         $('.textMensagem').on('touchstart', function() {
           //$(e).val('touchstart');
           $(this).focus();
         }).on('keydown',function(event) {
             if(event.keyCode==8) {
                 var txt = $(this).val();

                 var l = txt.length;
                 txt = txt.substr(0,l-1);
                 //alert(txt);
                 $(this).val(txt);
                 $(this).text(txt);
                 event.preventDefault();

                 return false;
             }
         });
         $('.textMensagem').on('keypress', function(event) {

             var txt = $(this).val();
             //alert(event.keyCode);
             var pressed = (txt + String.fromCharCode(event.keyCode));
             var el = this;

             setTimeout(function() {
                  var string = $(el).val();
                  //if(string.length < 1) {
                     $(el).text(pressed);
                     $(el).val(pressed);
                  //}
             }, 100);

         });


         pageContainer.off('click','btnApagar').on('click','.btnApagar', function(e){
             Dom7('.textMensagem').val("");
         });

         Dom7('.back').on('click',function(e) {
            e.preventDefault();
            e.stopPropagation();
            control.viagem.reloadViagem('back');
         });

         pageContainer.off('click','.btnEnviar').on('click','.btnEnviar', function(e){
             e.preventDefault();
             e.stopPropagation();
             var motivo = $('.textMensagem').val().toUpperCase();
             if ($.trim(motivo)=="") {
                 myApp.alert(getErrorMessage('MensagemEmBranco'),getAlertMessage('Aviso'));
             } else {
                 myApp.showPreloader(getLoadingMessage('Carregando')+'...');
                 me.registrarMensagem(motivo).done(function(id){
                     control.comando.getComandoById(id).done(function(msg) {
                        myApp.hidePreloader();
                        var comando = me.comandoAsMessage(msg);
                        me.showMessage(comando);
                        $('.textMensagem').val('');
                     }).fail(function(msg) {
                        myApp.alert(msg,getAlertMessage('Aviso'));

                     });

                     //me.abreMenuViagem('back');
                 });
             }
         });
     });

   }

	this.loadTableInfo = function(){
		this.tbName   = 'mensagem';
		this.tbPK     = 'id';
		this.tbFields = {
			   'id':                'INTEGER AUTOINCREMENT',
            'codigo':            'INTEGER PRIMARY KEY',
            'tipo':				   'TEXT',
            'texto':			      'TEXT',
            'data_registro': 	   'TEXT',
            'data_cadastrada':   'TEXT',
            'data_lida':         'TEXT',
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