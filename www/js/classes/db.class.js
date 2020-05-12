var dbClass = function(){
	this.dbName    = config.dbName;
	this.dbAlias   = config.dbAlias;
	this.dbVersion = config.dbVersion;
	this.dbSize    = config.dbSize;
	this.forceCreate= (config.dbForceCreate!=undefined?config.dbForceCreate:false);

	this.conn      = null;

	this.init = function(){
        if(!this.conn) this.conn = window.openDatabase(this.dbName, '1.0', this.dbAlias, this.dbSize);
        return this.conn;
	}

	this.query = function(sql, param, single){
		var deferred = $.Deferred();

		param  = (typeof param != "object") ? [] : param;
		single = (typeof single == "undefined") ? false : single;

		this.conn.transaction(function(tx) {
  			tx.executeSql(sql, param, function(tx, res){
  				if(single){
  					var saida = (res.rows.length ? res.rows.item(0) : null);
  				} else {
  					var saida = [];
					for(i=0; i<res.rows.length; i++) saida.push(res.rows.item(i));
  				}

  				var extra = (sql.substr(0, 6) == 'INSERT') ? res.insertId : null;

                deferred.resolve(saida, extra);
            }, function(tx, error){
            	deferred.reject(error);
            });
		}, function(error){
			deferred.reject(error);
		});

		return deferred.promise();
	}

	this.createTable = function(refClass, tbName, tbFields){
		var deferred = $.Deferred();

		if(typeof refClass != "object" && (typeof refClass != "boolean" || refClass !== false)){
			console.log('Invalid refClass on createTable');

			deferred.reject();
		} else {
			if(typeof refClass == "object"){
				tbName   = refClass.tbName;
				tbFields = refClass.tbFields;
			}

			var sql = '';
			var arrFields = [];

			sql = 'CREATE TABLE IF NOT EXISTS ' + tbName + ' (';

			for(field in tbFields){
				var def = tbFields[field].replace(' AUTOINCREMENT', '');

				arrFields.push(field + ' ' + def);
			}

			sql = sql + arrFields.join(', ');

			sql = sql + ')';
			console.log(sql);
			this.query(sql, []).done(function(){
				console.log('Create table [' + tbName + '] success');

				deferred.resolve();
			}).fail(function(e){
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100001', { classe: 'db.class.js', metodo: 'createTable'},{mensagem_padrao: 'Create table [' + tbName + '] error: ' + e.message});	
				if (e.message.indexOf('storage space')>0) {
					deferred.reject('[100001]'+getErrorMessage('DispositivoSemEspaco')+'. '+getErrorMessage('DesinstaleAplicacoes'))
				} else {
					deferred.reject('[100001]'+e.message);
				}
			});
		}

		return deferred.promise();
	}

	this.dropTable = function(refClass, tbName){
		var deferred = $.Deferred();

		if(typeof refClass != "object" && (typeof refClass != "boolean" || refClass !== false)){
			console.log('Invalid refClass on dropTable');

			deferred.reject();
		} else {
			if(typeof refClass == "object"){
				tbName = refClass.tbName;
			}

			var sql = 'DROP TABLE IF EXISTS ' + tbName;

			this.query(sql, []).done(function(){
				console.log('Drop table [' + tbName + '] success');

				deferred.resolve();
			}).fail(function(e){
				console.log('Drop table [' + tbName + '] error: ' + e.message);

				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100002', { classe: 'db.class.js', metodo: 'dropTable'},{mensagem_padrao: 'Drop table [' + tbName + '] error: ' + e.message});	
				
				deferred.reject();
			});
		}

		return deferred.promise();
	}

	this.insertRow = function(refClass, values, tbName, tbFields, tbPK){
		var me = this;
		var deferred = $.Deferred();
		if(typeof refClass != "object" && (typeof refClass != "boolean" || refClass !== false)){
			console.log('Invalid refClass on insertRow');
			deferred.reject();
		} else {
			tbPK = (typeof tbPK == "undefined") ? 'id' : tbPK;

			if(typeof refClass == "object"){
				tbName   = refClass.tbName;
				tbFields = refClass.tbFields;
				tbPK     = refClass.tbPK;
			}

			var arrFields  = [];
			var arrReplace = [];
			var arrValues  = [];

			for(field in values){
				if(typeof tbFields[field] != "undefined"){
					arrFields.push(field);

					if(tbFields[field].indexOf('AUTOINCREMENT') > -1 && !values[field]){
						arrReplace.push('(SELECT COALESCE(MAX(' + field + '), 0) + 1 FROM ' + tbName + ')');
					} else {
						arrReplace.push('?');
						arrValues.push(values[field]);
					}
				}
			}

			var sql = 'INSERT OR REPLACE INTO ' + tbName + ' (' + arrFields.join(', ') + ') VALUES (' + arrReplace.join(', ') + ')';
			this.query(sql, arrValues).done(function(res, insertedID){
				console.log('Insert row in table [' + tbName + '] success');

				me.query(('SELECT MAX(' + tbPK + ') AS lastID FROM ' + tbName), [], 1).done(function(item){
					deferred.resolve(item.lastID);
				}).fail(function(){
					deferred.resolve(insertedID);	
				});
			}).fail(function(e){
				console.log('Insert row in table [' + tbName + '] error: ' + e.message);
				console.log(sql);
				console.log(arrValues);

				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100003', { classe: 'db.class.js', metodo: 'insertRow'},{mensagem_padrao: 'Insert row in table [' + tbName + '] error: ' + e.message +' - SQL:'+sql});	
			
				deferred.reject();
			});
		}

		return deferred.promise();
	}

	this.updateRow = function(refClass, values, whereField, whereValue){
		var deferred = $.Deferred();

		if(typeof refClass != "object"){
			console.log('Invalid refClass on updateRow');

			deferred.reject();
		} else {
			var arrFields  = [];
			var arrValues  = [];

			for(field in values){
				if(typeof refClass.tbFields[field] != "undefined"){
					arrFields.push(field + ' = ?');
					arrValues.push(values[field]);
				}
			}


			if (whereValue==null) {
				var sql = 'UPDATE ' + refClass.tbName + ' SET ' + arrFields.join(', ') + ' WHERE ' + whereField + ' IS NULL';
				
			} else {
				var sql = 'UPDATE ' + refClass.tbName + ' SET ' + arrFields.join(', ') + ' WHERE ' + whereField + ' = ?';				
				arrValues.push(whereValue);
			}

			this.query(sql, arrValues).done(function(){
				console.log('Update row in table [' + refClass.tbName + '] success');

				deferred.resolve();
			}).fail(function(e){
				console.log('Update row in table [' + refClass.tbName + '] error: ' + e.message+' - SQL: '+sql);
				
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100004', { classe: 'db.class.js', metodo: 'updateRow'},{mensagem_padrao: 'Update row in table [' + refClass.tbName + '] error: ' + e.message+' - SQL: '+sql});	
				deferred.reject();
			});
		}

		return deferred.promise();
	}

	this.deleteRow = function(refClass, whereField, whereValue){
		var deferred = $.Deferred();

		if(typeof refClass != "object"){
			console.log('Invalid refClass on deleteRow');

			deferred.reject();
		} else {
			var sql = 'DELETE FROM ' + refClass.tbName + ' WHERE ' + whereField  + ' = ?';

			this.query(sql, [ whereValue ]).done(function(){
				console.log(sql);
				console.log(whereValue);
				console.log('Delete row in table [' + refClass.tbName + '] success');

				deferred.resolve();
			}).fail(function(e){
				console.log('Delete row in table [' + refClass.tbName + '] error: ' + e.message);
					
				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100005', { classe: 'db.class.js', metodo: 'deleteRow'},{mensagem_padrao: 'Delete row in table [' + refClass.tbName + '] error: ' + e.message + ' - SQL: '+sql});	

				deferred.reject();
			});
		}

		return deferred.promise();
	}

	this.selectRows = function(refClass, whereField, whereValue, limit, orderField, orderType){
		var me = this;

		var deferred = $.Deferred();

		limit      = (typeof limit == "undefined")      ? false : limit;
		orderField = (typeof orderField == "undefined") ? false : orderField;
		orderType  = (typeof orderType == "undefined")  ? 'ASC' : orderType;

		if(typeof refClass != "object"){
			console.log('Invalid refClass on selectRows');

			deferred.reject();
		} else {
			var wherePart = (whereValue === null || whereValue === "") ? (whereField  + ' IS NULL OR ' + whereField + ' = ?') : (whereField + ' = ?');
			var sql = 'SELECT * FROM ' + refClass.tbName + ' WHERE ' + wherePart;

			if(orderField) sql = sql + ' ORDER BY ' + orderField + ' ' + orderType;
			if(limit)      sql = sql + ' LIMIT ' + limit;

			this.query(sql, [ whereValue ], (limit == 1)).done(function(res){
				console.log('Select row in table [' + refClass.tbName + '] success');

				deferred.resolve(res);
			}).fail(function(e){
				console.log('Select row in table [' + refClass.tbName + '] error: ' + e.message);
				console.log(sql);
				console.log(whereValue);

				//Adicionar erro nao fatal ao fabric
				ErrorClass.parseError('database','100006', { classe: 'db.class.js', metodo: 'selectRows'},{mensagem_padrao: 'Select row in table [' + refClass.tbName + '] error: ' + e.message + ' - SQL: '+sql});	
				deferred.reject();
			});
		}

		return deferred.promise();
	}

	this.init();
}