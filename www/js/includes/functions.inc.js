function getFieldValue(fm, field, fnHELPER){
    var value = false;

    var obj = fm.find('[name=' + field + ']');

    switch(obj.get(0).tagName.toLowerCase()){
        case 'select':
            if(obj.attr('multiple')){
                value = obj.val().join(',');
            } else {
                value = obj.val();
            }
        break;

        case 'input':
            if(obj.attr('type') == 'checkbox'){
                value = (obj.is(':checked') ? 1 : 0);
            } else {
                value = obj.val();
            }
        break;

        default:
            value = obj.val();
        break;
    }

    if(value && typeof fnHELPER == "function") value = fnHELPER(value);

    return value;
}

function getFieldValueObj(obj, fnHELPER){
    var value = false;

    if (obj.length==0) return false;

    switch($(obj).get(0).tagName.toLowerCase()){
        case 'select':
            if(obj.attr('multiple')){
                value = obj.val().join(',');
            } else {
                value = obj.val();
            }
        break;

        case 'input':
            if(obj.attr('type') == 'checkbox'){
                value = (obj.is(':checked') ? 1 : 0);
            } else {
                value = obj.val();
            }
        break;

        default:
            value = obj.val();
        break;
    }

    if(value && typeof fnHELPER == "function") value = fnHELPER(value);

    return value;
}

function setFieldValue(field, value) {
    if (field == undefined) return false;
    if (field.length==0) return false;

    switch ($(field).get(0).tagName.toLowerCase()){
        case 'select':
            field.val(value);
            field.find('[value="'+value+'"]').attr('selected',true);
            var texto = field.find('[value="'+value+'"]').prop('text');
            field.parent().find('.item-after').text(texto);
            field.parent().find('.item-after').removeAttr('data-i18n');
       break;

        case 'input':
            if(field.attr('type') == 'checkbox'){
                field.find('[value='+value+']').attr('checked',true);
            } else if(field.attr('type') == 'radio'){
                field.find('[value='+value+']').attr('checked',true);
            } else {
                field.val(value);
            }
        break;

        default:
            field.val(value);
        break;
    }
}

function getLocalValue(name){
    return ((typeof localStorage.getItem(name) != "unfined" && localStorage.getItem(name) != 'null') ? localStorage.getItem(name) : null);
}

function setLocalValue(name, value){
    return localStorage.setItem(name, value);
}

function removeLocalValue(name){
    return localStorage.removeItem(name);
}

function checkOverlap(a, b, s){
    var s = (typeof s == "undefined") ? false : s;

    var overlap = false;

    var aX1 = a.position().left;
    var aX2 = a.position().left + a.width();
    var aY1 = a.position().top;
    var aY2 = a.position().top + a.height();

    var bX1 = b.position().left;
    var bX2 = b.position().left + b.width();
    var bY1 = b.position().top;
    var bY2 = b.position().top + b.height();

    //console.log(aX1 + "|" + aX2 + "|" + aY1 + "|" + aY2);
    //console.log(bX1 + "|" + bX2 + "|" + bY1 + "|" + bY2);

    if(aX1 > bX1 && aX1 < bX2 && aY1 > bY1 && aY1 < bY2) overlap = true;
    if(aX2 > bX1 && aX2 < bX2 && aY1 > bY1 && aY1 < bY2) overlap = true;
    if(aX1 > bX1 && aX1 < bX2 && aY2 > bY1 && aY2 < bY2) overlap = true;
    if(aX2 > bX1 && aX2 < bX2 && aY2 > bY1 && aY2 < bY2) overlap = true;

    if(!s && !overlap) overlap = checkOverlap(b, a, true);

    return overlap;
}

function sortListJson(data) {
    var sortable = [];
    $.each(data, function(key, value) {
        if (value!=null && value!=undefined) {
            sortable.push({key: key,value: value});
        }
    });
    var res = sortable.sort(function(a,b) {
        var x = a.value; var y = b.value;
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    });
    return res;
}

function getEstados(uf, nome){
    var uf   = (typeof uf == "undefined") ? false : uf;
    var nome = (typeof nome == "undefined") ? false : nome;

    var estados = { 'AC': 'Acre', 'AL': 'Alagoas', 'AP': 'Amapá', 'AM': 'Amazonas', 'BA': 'Bahia', 'CE': 'Ceará', 'DF': 'Distrito Federal', 'ES': 'Espírito Santo', 'GO': 'Goiás', 'MA': 'Maranhão', 'MT': 'Mato Grosso', 'MS': 'Mato Grosso do Sul', 'MG': 'Minas Gerais', 'PA': 'Pará', 'PB': 'Paraíba', 'PR': 'Paraná', 'PE': 'Pernambuco', 'PI': 'Piauí', 'RJ': 'Rio de Janeiro', 'RN': 'Rio Grande do Norte', 'RS': 'Rio Grande do Sul', 'RO': 'Rondônia', 'RR': 'Roraima', 'SC': 'Santa Catarina', 'SP': 'São Paulo', 'SE': 'Sergipe', 'TO': 'Tocantins' };

    if(uf){
        return ((typeof estados[uf] == "undefined") ? false : estados[uf]);
    } else if(nome){
        for(idx in estados) if(estados[idx] == nome) return idx;
    } else {
        return estados;
    }

    return false;
}

function curTime2(dt){
    if(typeof dt == "undefined"){
       var currentdate = new Date();
    } else if(typeof dt == "object") {
       var currentdate = dt;
    } else {
       var currentdate = new Date(dt);
    }

    var dt = [ currentdate.getDate(), (currentdate.getMonth()+1), currentdate.getFullYear(),
               currentdate.getHours(), currentdate.getMinutes(), currentdate.getSeconds() ];

    if(dt[0] < 10) dt[0] = "0" + dt[0];
    if(dt[1] < 10) dt[1] = "0" + dt[1];
    if(dt[2] < 10) dt[2] = "0" + dt[2];
    if(dt[3] < 10) dt[3] = "0" + dt[3];
    if(dt[4] < 10) dt[4] = "0" + dt[4];
    if(dt[5] < 10) dt[5] = "0" + dt[5];

    dt = dt[2] + "-" + dt[1] + "-" + dt[0] + " " + dt[3] + ":" + dt[4] + ":" + dt[5];

    return dt;
}

function curTime(date){

    if(typeof date == "undefined"){
       var currentdate = new Date();
    } else if(typeof dt == "object") {
       var currentdate = date;
    } else {
       var currentdate = new Date(date);
    }

    var UTChora     = currentdate.getUTCHours();
    var UTCminutes  = currentdate.getUTCMinutes();
    var UTCSeconds  = currentdate.getUTCSeconds();
    var UTCDia      = currentdate.getUTCDate();
    var UTCMonth    = currentdate.getUTCMonth();
    var UTCYear     = currentdate.getUTCFullYear();

    UTCMonth +=1;
    if(UTChora < 10)    UTChora     = "0" + UTChora;
    if(UTCminutes < 10) UTCminutes  = "0" + UTCminutes;
    if(UTCSeconds < 10) UTCSeconds  = "0" + UTCSeconds;
    if(UTCDia < 10)     UTCDia      = "0" + UTCDia;
    if(UTCMonth < 10)   UTCMonth    = "0" + UTCMonth;
    if(UTCYear < 10)    UTCYear     = "0" + UTCYear;

    return UTCYear+"-"+UTCMonth+"-"+UTCDia+" "+UTChora+":"+UTCminutes+":"+UTCSeconds;
}

function formataDataView(valor){
    if(!valor) return valor;

    if(valor.indexOf('/') > -1){
        valor = so_numeros(valor);
        if(valor.length == 12) valor+= "00";
        if(valor.length == 14){
            return valor.replace(/(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})/g,"\$1\/\$2\/\$3 \$4\:\$5");
        } else {
            return valor.replace(/(\d{2})(\d{2})(\d{4})/g,"\$1\/\$2\/\$3");
        }
    } else if(valor.indexOf('-') > -1){
        valor = so_numeros(valor);
        if(valor.length == 12) valor+= "00";
        if(valor.length == 14){
            return valor.replace(/(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})/g,"\$3\/\$2\/\$1 \$4\:\$5");
        } else {
            return valor.replace(/(\d{4})(\d{2})(\d{2})/g,"\$3\/\$2\/\$1");
        }
    } else {
        return valor.replace('T', ' ');
    }
}

function just_number(z){
    z.value=z.value.replace(/[^0-9]/g, '');
}

function so_numeros(str){
    return str.replace(/[^0-9]/g, '');
}

function isOnline(){
    if(typeof navigator.connection != 'undefined' && typeof Connection != 'undefined'){
        return navigator.connection.type != Connection.NONE;
    } else {
        return true;
    }
}

function getMainPlatformVersion() {
    return (isNaN(device.version) ? 0 : Math.floor(device.version));
}

function miliseconds_to_minutes(miliseconds) {
    var seconds = Math.floor(miliseconds / 1000);
    var minutes = Math.floor(seconds / 60);
    seconds = seconds - (minutes * 60);
    return [minutes < 10 ? 0 : '', minutes, ':', seconds < 10 ? 0 : '', seconds].join('');
}

function normalizaTexto(texto) {
    texto = texto.replace('/[áàãâä]/gui', 'a');
    texto = texto.replace('/[éèêë]/gui', 'e');
    texto = texto.replace('/[íìîï]/gui', 'i');
    texto = texto.replace('/[óòõôö]/gui', 'o');
    texto = texto.replace('/[úùûü]/gui', 'u');
    texto = texto.replace('/[ç]/gui', 'c');
    // alert(texto);
    texto = texto.replace('/\W/g', '');
    texto = texto.replace(/[|&;$%@"<>()+,]/g, "");
    // alert(texto.indexOf('?'));
    while (texto.indexOf('?')>=0) texto = texto.replace('?','');
    // alert(texto);
    //especialChar = especialChar.replace('/_+/', '_'); //
    return texto;
}

function inArray(needle, haystack) {
    var length = haystack.length;
    console.log(haystack);
    for(i in haystack) {
        if(haystack[i] == needle) return i;
    }
    return false;
}