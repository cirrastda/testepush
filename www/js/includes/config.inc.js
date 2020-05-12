var config = {
	appName:      'Driver',
	appAlias:     'buonnydriver',
	appBundle:    'com.buonny.buonnydrivermessenger',  // redefinido depois com o plugin version
	appVersion:   '3.9.0',                            // redefinido depois com o plugin version
	appDate:      '19/06/2018',
	appDevice:    'browser',

	dbName:       'buonnydriver',
	dbAlias:      'Buonny Driver',
	dbVersion:    '11.3',
	dbSize:       (1024 * 1024 * 5), // 5MB
	dbForceCreate: false,

	apiENV:       'dev',
	apiURIs:      {
		'dev': 'http://d01ti012/portal',
        'tst': 'https://tstportal.buonny.com.br/portal',
        'prd': 'https://api.buonny.com.br/portal'
    },
	apiURIsCl: 	{
		'dev': 'http://d01ti012/portal',
        'tst': 'http://tstportal.buonny.cl/portal',
        'prd': 'http://portal.buonny.cl/portal'
    },

    appOwner: "Buonny",
    copyYear: "",

    pushSenderID: '874075977037',
    free: false,
    freeCall: false,

    tecnologia_mobile: 5096,

    debug: true
};

function runConfig(){
	if(typeof localApiURIs != "undefined")
		config.apiURIs = localApiURIs;
	if(typeof localApiURIsCl != "undefined")
		config.apiURIsCl = localApiURIsCl;
	if(typeof localLocENV != "undefined")
		config.apiENV = localLocENV;

	if(typeof cordova != "undefined"){
		config.appDevice = device.platform.toLowerCase();
		config.apiENV    = typeof localDevENV != "undefined" ? localDevENV : 'prd';

		cordova.getAppVersion.getVersionNumber(function(version) {
		    config.appVersion = version;
		});

		cordova.getAppVersion.getPackageName(function(pkg) {
		    config.appBundle  = pkg;
		});
	}
	var d = new Date();
	config.copyYear = d.getFullYear();
}

function runCheckVersion(){
	if(typeof cordova != "undefined"){
		var v = cordova.getAppVersion.getVersionNumber();
		var p = cordova.getAppVersion.getPackageName();

		$.when(v, p).done(function(version, pkg){
			config.appVersion = version;
			config.appBundle  = pkg;

			control.settings.checkVersion();
		});
	} else {
		control.settings.checkVersion();
	}
}