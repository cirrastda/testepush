var restService = function(){
	this.apiENV  = config.apiENV;
	this.apiURIs = config.apiURIs;
    this.apiURIsCl = config.apiURIsCl;

    this.apiURL     = this.apiURIs[this.apiENV];
    this.apiURLCl   = this.apiURIsCl[this.apiENV];

    this.makeRequest = function(action, param, block, usetimeout, headers, type, separador_querystring){
    	var me = this;

    	var deferred = $.Deferred();

    	block = (typeof block == "undefined" ? false : block);
        type = (typeof type == "undefined" ? "POST" : type);
        separador_querystring = (typeof separador_querystring == "undefined" ? "/" : separador_querystring);

    	if(block) myApp.showIndicator();

        if(typeof usetimeout == "undefined" || usetimeout){
            timeout = 50000;
        } else {
            timeout = 150000;
        }

        if(!isOnline()){
            console.log('Ajax request error: no network connection');
            deferred.reject('no network connection');
        } else {
            // console.log(action);
            if (action.search('checkVersion')>-1) {
                var apiURL = me.apiURL;
            } else {
                var apiURL = (getLocalValue('codigo_pais')==5 ? me.apiURLCl : me.apiURL);
            }
            var data = null;
            var queryString = '';
            if (type=='GET') {
                data = null;
                if (param != null && param != {} && param != [])  {
                    queryString = (separador_querystring=='&' ? '?' : separador_querystring);
                    for(i in param) {
                        if (separador_querystring=='&') {
                            queryString += i+'='+param[i] + separador_querystring;
                        } else {
                            queryString += param[i] + separador_querystring;
                        }
                    }
                    queryString+=Math.random();
                }
            } else {
                data = JSON.stringify(param)
            }

            $.ajax({
                url:         apiURL + action + queryString,
                type:        type,
                dataType:    "json",
                crossDomain: true,
                data:        data,
                timeout:     timeout,
                beforeSend: function(request){
                    if(block) myApp.showIndicator();
                    if (typeof headers != "undefined") {
                        if (typeof headers == "object") {
                            for(var key in headers) {
                                request.setRequestHeader(key, headers[key]);
                            }
                        } else {
                            request.setRequestHeader('aplicativo', 'buonnydriver');
                            request.setRequestHeader('versao',config.appVersion);
                            if (action.indexOf('api_motorista_mobile')>-1) {
                                request.setRequestHeader('language',getLocalValue('language'));
                            }
                        }
                        request.setRequestHeader('Set-Cookie','sessionid=12345; SameSite=None; Secure');
                    } else {
                        request.setRequestHeader('aplicativo', 'buonnydriver');
                        request.setRequestHeader('Set-Cookie','sessionid=12345; SameSite=None; Secure');
                        request.setRequestHeader('versao',config.appVersion);
                        if (action.indexOf('api_motorista_mobile')>-1) {
                            request.setRequestHeader('language',getLocalValue('language'));
                        }
                    }
                },
                success: function(res){
                    if(block) myApp.hideIndicator();
                    if (res==null) res={erro: false, nullReturn: true};
                    var busyError = typeof res.erro != 'undefined' ? res.erro : 0;
                    busyError = busyError && typeof res.mensagem != 'undefined' && res.mensagem == 'Server busy' ? 1 : 0;

                    if(!busyError){
                        deferred.resolve(res);
                    } else {
                        //Adicionar erro nao fatal ao fabric
                        ErrorClass.parseError('API','300032', { classe: 'rest.class.js', metodo: 'makeRequest'},{mensagem_padrao:'Server busy'+res});	                        
                        deferred.reject('Server busy');
                    }
                },

                error: function(xhr, status, error){
                    if(block) myApp.hideIndicator();

                    console.log('Ajax request error: ' + action);
                    deferred.reject(error);
                }
            });
        }
    	return deferred.promise();
    }

    this.makeLoggedRequest = function(action, param, block, usetimeout, headers, type, separador_querystring){
        var me = this;

        var deferred = $.Deferred();

        block = (typeof block == "undefined" ? false : block);
        type = (typeof type == "undefined" ? "POST" : type);
        separador_querystring = (typeof separador_querystring == "undefined" ? "/" : separador_querystring);

        if (typeof headers == "undefined" || headers == null) headers = {}
        headers.aplicativo = 'buonnydriver';
        headers.documento = so_numeros(getLocalValue('documento'));
        headers.token = getLocalValue('token');
        headers.versao = config.appVersion;
        if (action.indexOf('api_motorista_mobile')>-1) {
            headers.language = getLocalValue('language');
        }
        this.makeRequest(action, param, block, usetimeout, headers, type, separador_querystring).done(function(res) {
            deferred.resolve(res);
        }).fail(function(error) {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300034', { classe: 'rest.class.js', metodo: 'makeLoggedRequest'},{mensagem_padrao:error});	                             
            deferred.reject('[300034]'+error);
        });

        return deferred.promise();
    }
}