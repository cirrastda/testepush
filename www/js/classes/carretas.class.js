var carretasClass = function(){
	this.tbName   = null;
	this.tbPK     = null;
	this.tbFields = {};
	this.push     = null;
	this.pushErr  = 0;
	this.page 	  = null;

	this.init = function(){
		var deferred = $.Deferred();
		this.loadTableInfo();
		this.setupView();
		this.dados = [];
		deferred.resolve();
		return deferred.promise();
	}

	this.setupView = function(){
		var me = this;

	}

	this.loadTableInfo = function(){
		this.tbName   = 'carretas';
		this.tbPK     = 'id';
		this.tbFields = {
			'id':          		'INTEGER AUTOINCREMENT',
            'codigo':         	'INTEGER PRIMARY KEY',
            'settings_id': 		'INTEGER',
			'placa': 		 	'TEXT',
			'tipo_veiculo': 	'INTEGER',
			'tipo_carroceria': 	'INTEGER',
			'antt': 			'TEXT',
			'marca': 		 	'INTEGER',
			'modelo': 		 	'INTEGER',
			'ano': 			 	'INTEGER',
			'rastreador': 	 	'INTEGER',
			'tecnologia': 	 	'INTEGER',
			'versao_tec':		'INTEGER',
			'rastreador': 	 	'INTEGER',
			'veic_atrelado': 	'INTEGER', 
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