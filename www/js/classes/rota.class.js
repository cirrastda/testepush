var rotaClass = function(){
    this.tbName   = null;
    this.tbPK     = null;
    this.tbFields = {};

    this.lastPointPosition = null;
    this.lastPointTime     = null;
    
    this.init = function(){
        var deferred = $.Deferred();

        this.loadTableInfo();

        deferred.resolve();

        return deferred.promise();
    }    


    this.addPoint = function(){
        var me = this;

        var deferred = $.Deferred();

        if(!getLocalValue('viag_codigo_sm') || !getLocalValue('sm_em_transito')) return false;

        var pos = control.posicao.getLastPosition();

        var linha = {
            'latitude':        pos['lat'],
            'longitude':       pos['lng'],
            'data_cadastrada': curTime(),
            'mensagem':        msg,
            'codigo':          codigo
        };

        control.db.insertRow(me, linha).done(function(){
            if(codigo != 99) control.sync.syncSendComando(false);
            
            deferred.resolve();
        }).fail(function(){
            deferred.reject();
        })


    }


    this.loadTableInfo = function(){
        this.tbName   = 'rota';
        this.tbPK     = 'id';
        this.tbFields = {  
            'id':              'INTEGER AUTOINCREMENT PRIMARY KEY',             
            'sm':              'TEXT', 
            'latitude':        'TEXT', 
            'longitude':       'TEXT', 
            'dt_inc':          'TEXT'
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