var languageDefinitions = {};
var languageStrings = {};
var languageStringsIns = {};


function get_pais(codigo_pais) {
    var pais = '';
    switch(codigo_pais) {
        case 11:
            pais = "MEXICO";
            break;
        case 5:
            pais = "CHILE";
            break;
        default:
            pais = "BRASIL";
            break;
    }
    return pais;
}

function get_ddi(codigo_pais) {
    var ddi = '55';
    switch(codigo_pais) {
        case '11':
            ddi = '52';
            break;
        case '5':
            ddi = '56';
            break;
    }
    return ddi;
}

function getMoneyAbreviation(codigo_pais) {
    if (typeof codigo_pais === "undefined") codigo_pais = getLocalValue('codigo_pais');
    var money_abrev = 'R$';
    switch(codigo_pais) {
        case '11':
            money_abrev = '$';
            break;
        case '5':
            money_abrev = '$';
            break;
    }
    return money_abrev;
}


function getPaisSimCard() {
	var deferred = $.Deferred();
    if (typeof window.plugins.carrier != "undefined") {
	    window.plugins.carrier.getCarrierInfo(function(result) {
	    	var codigo_pais = 1;
	    	switch(result.countryCode) {
	    		case 'cl':
	    			codigo_pais = 5;
	    			break;
	    		case 'mx':
	    			codigo_pais = 11;
	    			break;
	    	}
	    	deferred.resolve(codigo_pais);
	    }, function(msg) {
	    	deferred.reject(msg);
	    });
	} else {
		deferred.reject("Plugin 'carrier' não encontrado");
	}
	return deferred.promise();
}

function getPaisDeviceLocale() {
	var deferred = $.Deferred();
    if (typeof navigator.globalization != "undefined") {
	    navigator.globalization.getLocaleName(function(result) {
	        var codigo_pais = 1;
	    	switch(result) {
	    		case 'es_CL':
	    			codigo_pais = 5;
	    			break;
	    		case 'es_MX':
	    			codigo_pais = 11;
	    			break;
	    	}
	    	deferred.resolve(codigo_pais);
	    }, function(msg) {
	    	deferred.reject(msg);
	    });
	} else {
		deferred.reject("Plugin 'globalization' não encontrado");
	}

	return deferred.promise();
}

function getPaisGeocode() {
	var deferred = $.Deferred();


    if (typeof navigator.geolocation != "undefined") {
	    var options = {
	        enableHighAccuracy: true,
	        timeout: 50000,
	        maximumAge: 0
	    };
    	navigator.geolocation.getCurrentPosition(function() {
            crd = pos.coords;
    		
    		nativegeocoder.reverseGeocode(function(result) {
		        var firstResult = result[0];
		        var codigo_pais = 1;
		    	switch(firstResult.countryCode) {
		    		case 'CL':
		    			codigo_pais = 5;
		    			break;
		    		case 'MX':
		    			codigo_pais = 11;
		    			break;
		    	}
		    	deferred.resolve(codigo_pais);

			},function(msg) {
		    	deferred.reject(msg);
			},crd.latitude, crd.longitude, { useLocale: true, maxResults: 1 });
    	}, function(msg) {
	    	deferred.reject(msg);
    	}, options);
	} else {
		deferred.reject("Plugin 'geolocation' não encontrado");
	}
	return deferred.promise();
}
function translate(language, pageContent) {
	//language = 'pt';
	if (pageContent==null || pageContent==undefined) pageContent = null;
	$$ = Dom7;
	$$.get('js/languages/'+language.substring(0,2)+'.lang.js',{},function(data) {
		eval('languageStrings.'+language.substring(0,2)+' = '+data);
		// alert(language);
		i18next.init({
	        lng: language,
	        resources: languageStrings,
	        fallbackLng: 'pt-br'
	    }, function(o) {
	        jqueryI18next.init(i18next, $);
        	$(document).localize();
	    });
	});
}

function loadDefinitions(language) {
	$$ = Dom7;
	$$.get('js/languages/'+language+'.definitions.js',{},function(data) {
		language = language.replace('-','_');
		eval('languageDefinitions.'+language+' = '+data);
	});
}

function getLanguage() {
	var language = getLocalValue('language');
	if (language==null || language == undefined) language = 'pt-br';
	return language;
}

function getCurrentDefinitions() {
	var language = getLanguage();
	language = language.replace('-','_');
	return languageDefinitions[language];
}

function setPais(codigo_pais) {
	var language = '';

	switch(codigo_pais) {
		case '1':
			language = 'pt-br';
			break;
		case '5':
			language = 'es-cl';
			break;
		case '11':
			language = 'es-mx';
			break;
		default:
			language = 'pt-br';
	}
    setLocalValue('codigo_pais', codigo_pais);
    setLocalValue('language', language);
    loadDefinitions(language);
    translate(language);
}

function isLoaded() {
	var language = getLanguage();
	language = language.substring(0,2);
	return (languageStrings[language]!=undefined);
}

function loadInsensitive(type) {
	var language = getLanguage();
	language = language.substring(0,2);
	languageStringsIns[language] = {
		'translation': {}
	};
	languageStringsIns[language]['translation'][type] = {};
	for(var i in languageStrings[language]['translation'][type]) {
		// console.log(languageStringsIns[language]['translation'][type]);
		languageStringsIns[language]['translation'][type][i.toLowerCase()] = languageStrings[language]['translation'][type][i];
		languageStringsIns[language]['translation'][type][i.toLowerCase().replace('_','')] = languageStrings[language]['translation'][type][i];
	}
}

function getMessageTranslated(type, constant, insensitive) {
	if (insensitive==null || insensitive==undefined) insensitive = false;
	var language = getLanguage();
	language = language.substring(0,2);
	if (languageStrings[language]!=undefined) {
		if (insensitive) {
			if (languageStringsIns[language]==undefined || languageStringsIns[language]['translation'][type]==undefined) loadInsensitive(type);
			var msg = languageStringsIns[language]['translation'][type][constant.toLowerCase().replace('_','')];
		} else {
			var msg = languageStrings[language]['translation'][type][constant];
			
		}
	} else {
		var msg = '';
	}
	return msg;
}

function getAllMessagesByType(type) {
	var language = getLanguage();
	language = language.substring(0,2);
	var ret = [];
	var i;
	if (languageStrings[language]!=undefined) {
		for (i in languageStrings[language]['translation'][type]) {
			var msg = languageStrings[language]['translation'][type][i];
			ret.push(msg);
		}
	} 
	return ret;	
}

function getAllMessagesByTypeWithIdx(type) {
	var language = getLanguage();
	language = language.substring(0,2);
	var ret = [];
	var i;
	if (languageStrings[language]!=undefined) {
		for (i in languageStrings[language]['translation'][type]) {
			var msg = languageStrings[language]['translation'][type][i];
			var idx = i
			ret.push({
				idx: i,
				msg: msg
			});
		}
	} 
	return ret;	
}

function getErrorMessage(constant) {
	return getMessageTranslated('error', constant);
}

function getFormErrorMessage(constant) {
	return getMessageTranslated('form_error', constant);
}

function getLoadingMessage(constant) {
	return getMessageTranslated('loading', constant);	
}

function getSuccessMessage(constant) {
	return getMessageTranslated('success', constant);	
}

function getAlertMessage(constant) {
	return getMessageTranslated('alert', constant);	
}

function getStatusText(constant) {
	return getMessageTranslated('status', constant);	
}

function getMessage(constant) {
	return getMessageTranslated('message', constant);	
}

function getText(constant, async, insensitive) {
	if (async==null || async==undefined) async = false;
	if (insensitive==null || insensitive==undefined) insensitive = false;
	if (!async) {
		return getMessageTranslated('text', constant, insensitive);			
	} else {
		var deferred = $.Deferred();
		window.setTimeout(function() {
			var msg = getMessageTranslated('text',constant, insensitive);
			deferred.resolve(msg);
		},100);
		return deferred.promise();
	}
}

function getMensagemComando(constant) {
	var seq = 1;

	var mensagem = getMessageTranslated('sendMessage', constant);
	if (!isLoaded()) {
		var deferred = $.Deferred();
		window.setTimeout(function() {
			var msg = getMessageTranslated('sendMessage',constant);
			deferred.resolve(msg);
		},100);
		return deferred.promise();
	}
	if (mensagem==undefined || mensagem==null || mensagem=='') {
		mensagem = constant;
	}
	return mensagem;
}

function getMensagemComandoReverse(message) {
	var seq = 1;
	var mensagens = getAllMessagesByType('sendMessage');
	var mensagens_idx = getAllMessagesByTypeWithIdx('sendMessage')

	var index = inArray(message, mensagens);
	if (index !== false) {
		return mensagens_idx[index].idx;
	} else {
		return message;
	}

}

function getMonths(abreviado) {
	if (abreviado==null || abreviado==undefined) abreviado = false;

	var type = (abreviado ? 'shortMonths' : 'months');

	return getAllMessagesByType(type);
}

function getDaysOfWeek(abreviado) {
	if (abreviado==null || abreviado==undefined) abreviado = false;

	var type = (abreviado ? 'shortDays' : 'days');

	return getAllMessagesByType(type);
}

// // export const setValidator = () => {
// //     Validator.localize(Language);
// //     const validator = new Validator();
// //     validator.localize(store.state.locale);
// //     HelperClass.validators.veeValidateExtends();
// // }

// export const setLocal = (locale) => {
//     store.state.locale = locale;
//     store.state.language = Language;
//     store.state.localLanguage = Language[locale];    
// }

// export default Language;