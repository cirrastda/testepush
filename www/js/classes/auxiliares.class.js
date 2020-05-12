var auxiliaresClass = function(){
  	this.tables = [];

  	this.init = function(){
  		  var deferred = $.Deferred();

  		  this.loadTableInfo();

  		  deferred.resolve();

  		  return deferred.promise();
  	}


    this.processAuxiliaresItens = function(data, table, idx, deferred){
        var me = this;

        if(typeof idx == "undefined"){
            var idx = 0;
            var deferred = $.Deferred();
        }

        if(typeof data[table['tbName']] != "undefined"){
            var res = data[table['tbName']];

            if(typeof res[idx] != "undefined"){
                var info = { 
                    'id':         null,
                    'codigo':     res[idx]['codigo'], 
                    'descricao':  res[idx]['descricao'], 
                    'dt_inc':     formataDataDb(res[idx]['data_inclusao']), 
                    'dt_alt':     formataDataDb(data['dt_sync']), 
                    'dt_sync_in': formataDataDb(data['dt_sync'])
                };
                // if (table['tbName']=="paises") {
                //   info['codigo_telefonico'] = res[idx]['codigo_telefonico'];
                //   info['codigo_mssql'] = res[idx]['codigo_mssql'];
                // }
            
                control.db.insertRow(false, info, table['tbName'], table['tbFields']);

                me.processAuxiliaresItens(data, table, (idx+1), deferred);
            } else {
                deferred.resolve();
            }
        } else {
            deferred.resolve();
        }

        if(!idx) return deferred.promise();
    }

    this.processAuxiliaresTabelas = function(data, idx, deferred){
      var me = this;

      if(typeof idx == "undefined"){
          var idx = 0;
          var deferred = $.Deferred();
      }

      me.processAuxiliaresItens(data, control.auxiliares.tables[idx]).done(function(){
          if((idx+1) < control.auxiliares.tables.length){
              me.processAuxiliaresTabelas(data, (idx+1), deferred);
          } else {
              deferred.resolve();
          }
      }).fail(function(e){
            //Adicionar erro nao fatal ao fabric
		    ErrorClass.parseError('generico','900005', { classe: 'auxiliares.class.js', metodo: 'processAuxiliaresItens' },{mensagem_padrao: e});
            deferred.reject('[900005]'+e);
      });

      if(!idx) return deferred.promise();
    }

    this.syncAuxiliares = function(block){
      var me = this;   

      var deferred = $.Deferred();

      control.rest.makeRequest('/api_motorista_mobile/getTabelasAuxiliares', null, false).done(function(res){
          if(!res.error){
              me.processAuxiliaresTabelas(res.data).done(function(){
                  deferred.resolve("syncAuxiliares: Done.");
              }).fail(function(msg){
                   //Adicionar erro nao fatal ao fabric
                   ErrorClass.parseError('database','100056', { classe: 'auxiliares.class.js', metodo: 'syncAuxiliares' },{mensagem_padrao:"syncAuxiliares: Parse error."+ "Mensagem:"+ msg}); 
                   deferred.reject("[100056]syncAuxiliares: Parse error.");
              });
          } else {
               //Adicionar erro nao fatal ao fabric
                ErrorClass.parseError('database','100057', { classe: 'auxiliares.class.js', metodo: 'syncAuxiliares' },{mensagem_padrao:"syncAuxiliares: Response error:"+ "Mensagem:"+ msg});   
                deferred.reject("[100057]syncAuxiliares: Response error: " + res.data);
          }
      }).fail(function(msg){
           //Adicionar erro nao fatal ao fabric                
            ErrorClass.parseError('API','300008', { classe: 'auxiliares.class.js', metodo: 'syncAuxiliares' },{mensagem_padrao:"syncAuxiliares: Ajax error."+ msg});   
            deferred.reject("[300008]syncAuxiliares: Ajax error.");
      });

      return deferred.promise();
    }

  	this.loadTableInfo = function(){
    		this.tables = [];

    		this.tables.push ({
      			tbName:   'motivos_recusa',
      			tbPK:     'id',
      			tbFields: { 
    		        'id':          'INTEGER AUTOINCREMENT', 
                'codigo':      'INTEGER PRIMARY KEY', 
                'descricao':   'TEXT',
                'dt_inc':      'TEXT',
                'dt_alt':      'TEXT', 
                'dt_sync_in':  'TEXT',
                'dt_sync_out': 'TEXT'
            }
        });

        // this.tables.push ({
        //     tbName:   'paises',
        //     tbPK:     'id',
        //     tbFields: { 
        //         'id':          'INTEGER AUTOINCREMENT', 
        //         'codigo':      'INTEGER PRIMARY KEY', 
        //         'descricao':   'TEXT',
        //         'codigo_telefonico': 'INTEGER',
        //         'codigo_mssql': 'INTEGER',
        //         'dt_inc':      'TEXT',
        //         'dt_alt':      'TEXT', 
        //         'dt_sync_in':  'TEXT',
        //         'dt_sync_out': 'TEXT'
        //     }
        // });
   	}

   	this.createTable = function(idx, deferred){
     		var me = this;

     		if(typeof idx == "undefined"){
     			var idx = 0;
     			var deferred = $.Deferred();
     		}

     		control.db.createTable(false, me.tables[idx]['tbName'], me.tables[idx]['tbFields']).done(function(){
       			idx++;

       			if(idx < me.tables.length){
                me.createTable(idx, deferred);
       			} else {
                deferred.resolve();
       			}
     		}).fail(function(e){
     			  deferred.reject(e);
     		});

     		if(!idx) return deferred.promise();
    }

    this.dropTable = function(idx, deferred){
     		var me = this;

     		if(typeof idx == "undefined"){
     			  var idx = 0;
     			  var deferred = $.Deferred();
     		}

     		control.db.dropTable(false, me.tables[idx]['tbName']).done(function(){
       			idx++;

       			if(idx < me.tables.length){
                me.dropTable(idx, deferred);
       			} else {
                deferred.resolve();
       			}
     		}).fail(function(e){
     			  deferred.reject(e);
     		});

     		if(!idx) return deferred.promise();
   	}
}