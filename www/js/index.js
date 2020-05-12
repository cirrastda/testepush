/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
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
    alert('onDeviceReady');
    runConfig();

    myApp       = new Framework7({ template7Pages: true, sortable: false, swipeBackPage: false });
    // mainView    = myApp.addView('.view-main', { dynamicNavbar: true, pushState: true });


    control = new mainClass();
    control.init().done(function(){
        alert('dony');
        control.push.setupPushNotification();
        alert('dony 2');
    });       
    alert('dony 4'); 
    
    // runCheckVersion();
}

var app = {
    // Application Constructor
    initialize: function() {
        document.addEventListener('deviceready', this.onDeviceReady.bind(this), false);
    },

    // deviceready Event Handler
    //
    // Bind any cordova events here. Common events are:
    // 'pause', 'resume', etc.
    onDeviceReady: function() {
        onDeviceReady();
        alert('dony 3');
        this.receivedEvent('deviceready');
    },

    // Update DOM on a Received Event
    receivedEvent: function(id) {
        
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
        
    }
};

app.initialize();