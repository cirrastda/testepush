var myApp = null;
var mainView = null;
var control = null;
var loaded = false;
var posicionando = false;
var pos_executing = false;
var last_position_time = null;
var tmr_reposiciona = null;
var tempo_bgmode = null;

function reposiciona(utiliza_gps, use_cache, maximum_age) {
    if (utiliza_gps == null || utiliza_gps == undefined) utiliza_gps = false;
    if (use_cache == null || use_cache == undefined) use_cache = false;
    if (maximum_age == null || maximum_age == undefined) maximum_age = 120000;
    var max_age = (use_cache ? Infinity : maximum_age);
    var deferred = $.Deferred();

    if (utiliza_gps) {
        var myOptions = { timeout: 60000, enableHighAccuracy: utiliza_gps };
    } else {
        var myOptions = { maximumAge: max_age, timeout: 60000, enableHighAccuracy: utiliza_gps };
    }

    navigator.geolocation.getCurrentPosition(function (p) {
        console.log('Pos fg: ' + p.coords.latitude + ' | ' + p.coords.longitude);
        if (typeof cordova == 'undefined' || !cordova.plugins.backgroundMode.isActive()) {
            console.log('Pos fg: ' + p.coords.latitude + ' | ' + p.coords.longitude);
            control.posicao.setLastPosition(p.coords.latitude, p.coords.longitude);
        }
        posicionando = true;
        pos_executing = false;
        last_position_time = new Date();
        deferred.resolve();
    }, function (error) {
        posicionando = false;
        pos_executing = false;
        console.log(error.message);
        deferred.reject();
    },
        myOptions);
    return deferred.promise();
}

var onDeviceReady = function () {
    console.log('onDeviceReady');
    runConfig();
    // if(typeof FCMPlugin != 'undefined'){
    //     FCMPlugin.onNotification(function (data) {
    //         alert('notify');
    //     });
    // }
    //Configuracao dos dados do usuário para o fabric
    console.log(window.fabric);
    if (typeof window.fabric !== "undefined") {
        if (getLocalValue('CPF') != null) {
            window.fabric.Crashlytics.setUserIdentifier("CPF: " + getLocalValue('CPF'));
        } else if (getLocalValue('documento') != null) {
            window.fabric.Crashlytics.setUserIdentifier("Documento: " + getLocalValue('documento'));
        }

        if (getLocalValue('nome') != null) {
            window.fabric.Crashlytics.setUserName(getLocalValue('nome'));
        }

        if (getLocalValue('email') != null) {
            window.fabric.Crashlytics.setUserEmail(getLocalValue('email'));
        }

        if (getLocalValue('telefone') != null) {
            window.fabric.Crashlytics.setStringValueForKey(getLocalValue('telefone'), "Telefone");
        }

        if (getLocalValue('codigo_pais') != null) {
            switch (getLocalValue('codigo_pais')) {
                case "1":
                    window.fabric.Crashlytics.setStringValueForKey("Brasil", "País");
                    break;

                case "11":
                    window.fabric.Crashlytics.setStringValueForKey("Mexico", "País");
                    break;

                case "5":
                    window.fabric.Crashlytics.setStringValueForKey("Chile", "País");
                    break;

            }
        }

        if (getLocalValue('sm_em_transito') == '1') {
            window.fabric.Crashlytics.setStringValueForKey("Em transito", "Status da SM");
        } else {
            window.fabric.Crashlytics.setStringValueForKey("Esperando inicio", "Status da SM");
        }
        if (getLocalValue('viag_codigo_sm') != null) {
            window.fabric.Crashlytics.setStringValueForKey(getLocalValue('viag_codigo_sm'), "Código da SM");
        }
    }

    if (config.appDevice != "browser") {
        if (config.apiENV == 'prd') {
            //console.oldLog = console.log;
            // console.log = function () { };
        }
        window.plugins.insomnia.keepAwake();

        cordova.plugins.backgroundMode.setDefaults({ title: 'Ativo em segundo plano', text: 'Enviando coordenadas do deslocamento' });

        if (config.appDevice == "ios") {
            cordova.plugins.backgroundMode.setDefaults({
                title: 'Ativo em segundo plano',
                text: 'Enviando coordenadas do deslocamento',
            });
        } else {
            cordova.plugins.backgroundMode.setDefaults({
                silent: true
            });
        }
        cordova.plugins.backgroundMode.enable();
    }

    myApp       = new Framework7({ template7Pages: true, sortable: false, swipeBackPage: false });
    mainView    = myApp.addView('.view-main', { dynamicNavbar: true, pushState: true });

    control = new mainClass();
    control.init().done(function(retorno){
        if (retorno=='logado') {
            control.push.setupPushNotification();
        }
        if (typeof navigator.geolocation != 'undefined') {
            navigator.geolocation.getCurrentPosition(function (p) {
                console.log('Pos fg: ' + p.coords.latitude + ' | ' + p.coords.longitude + ' | ' + p.coords.speed);
                control.posicao.setLastPosition(p.coords.latitude, p.coords.longitude);
                posicionando = true;
            }, function (error) {
                posicionando = false;
                console.log(error.message);
            },
            {
                maximumAge: Infinity,
                timeout: 60000,
                enableHighAccuracy: true
            });

            tmr_reposiciona = setInterval(function () {
                if (pos_executing) return;
                if (typeof cordova != 'undefined' && cordova.plugins.backgroundMode.isActive()) return;
                if (!control.auth.checkAuthLocalizacao()) return;

                if (posicionando && last_position_time != null) {
                    var curtime = new Date();
                    var diff = curtime.getTime() - last_position_time.getTime();
                    if (diff < (2 * 60 * 1000)) return;
                }
                pos_executing = true;
                reposiciona(true).fail(function () {
                    reposiciona(false).fail(function () {
                        reposiciona(true, false, 300000).fail(function () {
                            reposiciona(true, true);
                        });
                    });
                });
            }, 30000);

            if (config.appDevice != "browser") {
                if (typeof BackgroundGeolocation != 'undefined') {
                    BackgroundGeolocation.configure({
                        locationProvider: BackgroundGeolocation.RAW_PROVIDER,
                        desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
                        stationaryRadius: 20,
                        distanceFilter: 10,
                        notificationTitle: 'Ativo em segundo plano',
                        notificationSmallIcon: 'drawable/icon_buonny',
                        notificationText: 'Enviando coordenadas do deslocamento',
                        debug: false,
                        interval: 60000,
                        fastestInterval: 5000,
                        activitiesInterval: 10000,                    
                        startForeground: false,
                        // stopOnTerminate: false,
                        // foregroundService: true,
                        // activityType: 'AutomotiveNavigation',
                        // pauseLocationUpdates: false

                    }, function (state) {
                        console.log("Background Geolocation started.  Current state: ", state.enabled);
                    }, function (error) {
                        console.warn("Background Geolocation failed to configure");
                    });
                    // BackgroundGeolocation.reset({
                    //     desiredAccuracy: -1,
                    //     stationaryRadius: 20,
                    //     distanceFilter: 30,
                    //     debug: false,
                    //     stopOnTerminate: false,
                    //     foregroundService: true,
                    //     notificationTitle: 'Ativo em segundo plano',
                    //     notificationSmallIcon: 'drawable/icon_buonny',
                    //     notificationText: 'Enviando coordenadas do deslocamento',
                    //     activityType: 'AutomotiveNavigation',
                    //     interval: 60000,
                    //     fastestInterval: 5000,
                    //     activitiesInterval: 10000,
                    //     pauseLocationUpdates: false
                    // }, function (state) {
                    //     console.log("Background Geolocation started.  Current state: ", state.enabled);
                    // }, function (error) {
                    //     console.warn("Background Geolocation failed to configure");
                    // });

                    BackgroundGeolocation.on('authorization', function (status) {
                        console.log('[INFO] BackgroundGeolocation authorization status: ' + status);
                        if (status !== BackgroundGeolocation.AUTHORIZED) {
                            // we need to set delay or otherwise alert may not be shown
                            setTimeout(function () {
                                if (!control.auth.checkAuthLocalizacao()) return;

                                var showSettings = confirm('Este app requer permissão para acessar sua localização. Você deseja ir para o settings?');
                                if (showSetting) {
                                    return BackgroundGeolocation.showAppSettings();
                                }
                            }, 1000);
                        }
                    });

                    // Add a location listener
                    BackgroundGeolocation.on('location', function (location) {
                        //console.log(location);
                        if (!control.auth.checkAuthLocalizacao()) return;

                        console.log('Pos Bg: ' + location.latitude + ' | ' + location.longitude);
                        control.posicao.setLastPosition(location.latitude, location.longitude);
                        posicionando = true;

                        // BackgroundGeolocation.startTask(function(taskKey) {
                        //     // execute long running task
                        //     // eg. ajax post location
                        //     // IMPORTANT: task has to be ended by endTask
                        //     console.log('Pos Bg: ' + location.latitude + ' | ' + location.longitude);
                        //     control.posicao.setLastPosition(location.latitude, location.longitude);
                        //     posicionando = true;

                        //     BackgroundGeolocation.endTask(taskKey);
                        // });
                        // BackgroundGeolocation.finish(taskId);
                    }, function (error) {
                        console.warn('[event] location error: ', error);
                        posicionando = false;
                    });

                    BackgroundGeolocation.on('stationary', function(location) {

                        if (!control.auth.checkAuthLocalizacao()) return;

                        console.log('Pos Bg: ' + location.latitude + ' | ' + location.longitude);
                        control.posicao.setLastPosition(location.latitude, location.longitude);
                        posicionando = true;

                        // BackgroundGeolocation.startTask(function(taskKey) {
                        //     // execute long running task
                        //     // eg. ajax post location
                        //     // IMPORTANT: task has to be ended by endTask
                        //     console.log('Pos Bg: ' + location.latitude + ' | ' + location.longitude);
                        //     control.posicao.setLastPosition(location.latitude, location.longitude);
                        //     posicionando = true;

                        //     BackgroundGeolocation.endTask(taskKey);
                        // });
                        // handle stationary locations here
                    });

                    BackgroundGeolocation.on('start', function() {
                        if (!control.auth.checkAuthLocalizacao()) return;
                        console.log('[INFO] BackgroundGeolocation service has been started');
                    });
                     
                    BackgroundGeolocation.on('stop', function() {
                        if (!control.auth.checkAuthLocalizacao()) return;
                        console.log('[INFO] BackgroundGeolocation service has been stopped');
                    });
                    BackgroundGeolocation.on('error', function(error) {
                        if (!control.auth.checkAuthLocalizacao()) return;

                        console.log('[ERROR] BackgroundGeolocation error:', error.code, error.message);
                        ErrorClass.parseError('generico', '900062', { classe: 'my-app.js', metodo: 'control.init' }, { mensagem_padrao: error.message });
                    });
                    BackgroundGeolocation.on('background', function() {
                        console.log('[INFO] App is in background');
                        console.log('onactivate called');
                        if (getLocalValue('sm_em_transito') == '1') {
                            console.log('bg mode active');
                            if (config.appDevice == "ios") {
                                cordova.plugins.backgroundMode.setDefaults({
                                    title: 'Ativo em segundo plano',
                                    text: 'Enviando coordenadas do deslocamento',
                                });
                            } else {
                                cordova.plugins.backgroundMode.setDefaults({
                                    silent: true
                                });
                            }
                            cordova.plugins.backgroundMode.enable();
                            BackgroundGeolocation.checkStatus(function(status) {
                                // console.log('[INFO] BackgroundGeolocation service is running', status.isRunning);
                                // console.log('[INFO] BackgroundGeolocation services enabled', status.locationServicesEnabled);
                                // console.log('[INFO] BackgroundGeolocation auth status: ' + status.authorization);
                             
                                // you don't need to check status before start (this is just the example)
                                if (control.auth.checkAuthLocalizacao()) {
                                    if (!status.isRunning) {
                                        BackgroundGeolocation.start(function() {
                                            console.log('start bg mode');
                                        }, function() {
                                            console.log('error start bg mode');
                                        });
                                    }
                                }
                                console.log(status.locationServicesEnabled);
                            });

                            cordova.plugins.backgroundMode.disableWebViewOptimizations();
                        }
                        // BackgroundGeolocation.start();
                    });

                    BackgroundGeolocation.on('foreground', function() {
                        console.log('[INFO] App is in foreground');
                        if (control.auth.checkAuthFrete()) {
                            control.sync.syncClickCargo();
                        }
                        // BackgroundGeolocation.configure({ debug: false });
                        // BackgroundGeolocation.stop();
                    });
                }
            }

            if (config.appDevice != "browser") {
                console.log('call onactivate');
                cordova.plugins.backgroundMode.onactivate = function () {
                    console.log('onactivate called');

                    if (getLocalValue('sm_em_transito') == '1') {
                        console.log('bg mode active');
                        if (config.appDevice == "ios") {
                            cordova.plugins.backgroundMode.setDefaults({
                                title: 'Ativo em segundo plano',
                                text: 'Enviando coordenadas do deslocamento',
                            });
                        } else {
                            cordova.plugins.backgroundMode.setDefaults({
                                silent: true
                            });
                        }
                        cordova.plugins.backgroundMode.enable();
                        if (typeof BackgroundGeolocation != 'undefined') {
                            BackgroundGeolocation.start(function() {
                                console.log('start bg mode');
                            }, function() {
                                console.log('error start bg mode');
                            });
                        }
                        cordova.plugins.backgroundMode.disableWebViewOptimizations();
                    } else {
                        cordova.plugins.backgroundMode.disable();
                        if (typeof BackgroundGeolocation != 'undefined') {
                            BackgroundGeolocation.stop();
                        }
                    }
                }
                cordova.plugins.backgroundMode.ondeactivate = function () {
                    console.log('backgroundMode.ondeactivate');
                    if (typeof BackgroundGeolocation != 'undefined') {
                        BackgroundGeolocation.stop();
                    }
                }
            }
        }
        loaded = true;
        runCheckVersion();
        setPais(getLocalValue('codigo_pais'));
    });
}

var onBackButton = function () {
    var cur_page = mainView.activePage.name;
    var view_page = control.page.name;
    if (view_page=='aceite-lgpd') {
        var qtd_bot = $(".btnRejeitar").length;
        if (qtd_bot > 0) {
            $(".btnRejeitar")[qtd_bot - 1].click();
        }

    } else if (view_page.substr(0, 6) != 'smart-') {
        var qtd_bot = $(".back").length;
        if (qtd_bot > 0) {
            $(".back")[qtd_bot - 1].click();
        }
    } else {
        var qtd_bot = $(".close-popup").length;
        if (qtd_bot > 0) {
            $(".close-popup")[qtd_bot - 1].click();
        }
        control.page.name = cur_page;
    }
}

if (typeof cordova != "undefined") {
    document.addEventListener('deviceready', onDeviceReady, false);
    document.addEventListener("backbutton", onBackButton, false);
} else {
    $(document).ready(function () {
        onDeviceReady();
    });
}