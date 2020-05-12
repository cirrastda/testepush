function valida_campo(obj, required) {
    if (required==null || required==undefined) required = false;
    var definitions = getCurrentDefinitions();
    switch(obj.get(0).tagName.toLowerCase()){
        case 'input':
            switch(obj.attr('type')){
                case 'text':
                case 'tel':
                case 'date':
                case 'datetime-local':
                case 'password':
                    if (!required) {
                        if ($.trim(obj.val())=="") break;
                    }
                    if(!$.trim(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'value', 'msg': 'empty' });
                    } else if(obj.hasClass('cpf')){
                        if (definitions['validationFunctions']['cpf']!=null && definitions['validationFunctions']['cpf']!=undefined) {
                            var ret = eval(definitions['validationFunctions']['cpf']+"(obj.val())");
                            if (!ret) {
                                return({ 'field': obj.attr('name'), 'type': 'cpf', 'msg': 'invalid' });
                            }
                        }
                    } else if(obj.hasClass('rg')){
                        if (definitions['validationFunctions']['rg']!=null && definitions['validationFunctions']['rg']!=undefined) {
                            var ret = eval(definitions['validationFunctions']['rg']+"(obj.val())");
                            if (!ret) {
                                return({ 'field': obj.attr('name'), 'type': 'rg', 'msg': 'invalid' });
                            }                            
                        }
                    } else if(obj.hasClass('cnpj') && !validarCNPJ(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'cnpj', 'msg': 'invalid' });
                    } else if(obj.hasClass('placa') && !validarPlaca(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'placa', 'msg': 'invalid' });
                    } else if(obj.hasClass('cep') ){
                        if (definitions['validationFunctions']['cep']!=null && definitions['validationFunctions']['cep']!=undefined) {
                            var ret = eval(definitions['validationFunctions']['cep']+"(obj.val())");
                            if (!ret) {
                                return({ 'field': obj.attr('name'), 'type': 'cep', 'msg': 'invalid' });
                            }                            
                        }                        
                    } else if(obj.hasClass('data') && !validarData(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'data', 'msg': 'invalid' });
                    } else if(obj.hasClass('hora') && !validarHora(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'hora', 'msg': 'invalid' });
                    } else if(obj.hasClass('datahora') && !validarDataHora(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'datahora', 'msg': 'invalid' });
                    } else if(obj.hasClass('celular')) {
                        if (definitions['validationFunctions']['celular']!=null && definitions['validationFunctions']['celular']!=undefined) {
                            var ret = eval(definitions['validationFunctions']['celular']+"(obj.val())");
                            if (!ret) {
                                return({ 'field': obj.attr('name'), 'type': 'celular', 'msg': 'invalid' });
                            }                            
                        }  
                        // return({ 'field': obj.attr('name'), 'type': 'celular', 'msg': 'invalid' });
                    } else if(obj.hasClass('email') && !validarEmail(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'email', 'msg': 'invalid' });
                    } else if(obj.hasClass('cnh')) {
                        if (definitions['validationFunctions']['cnh']!=null && definitions['validationFunctions']['cnh']!=undefined) {
                            var ret = eval(definitions['validationFunctions']['cnh']+"(obj.val())");
                            if (!ret) {
                                return({ 'field': obj.attr('name'), 'type': 'cnh', 'msg': 'invalid' });
                            }                            
                        }  
                        // return({ 'field': obj.attr('name'), 'type': 'cnh', 'msg': 'invalid' });
                    }
                break;
            }
        break;

        case 'select':
            if (required) {
                if(obj.attr('multiple')){
                    if(!obj.val().length){
                        return({ 'field': obj.attr('name'), 'type': 'value', 'msg': 'empty' });
                    }
                } else {
                    if(!$.trim(obj.val())){
                        return({ 'field': obj.attr('name'), 'type': 'value', 'msg': 'empty' });
                    }
                }
            }
        break;
    }
    return null;
}

function retornaMsgErro(erro) {
    var constant = erro['field']+'_'+erro['msg'];
    var msg = getFormErrorMessage(constant);
    if (msg!="" && msg!=undefined) {
        return msg;
    }
    constant = erro['msg'];
    msg = getFormErrorMessage(constant);
    if (msg!="") {
        var txt_campo = getText(erro['field'],false,true);
        if (txt_campo=="" && txt_campo!=undefined) txt_campo = erro['field'];
        return msg.replace('<campo>',txt_campo);
    }
    return '';
}
function valida_form(fm, display){
    var errors = [];
    display = (typeof display == "undefined") ? false : display;
    var ret;
    fm.find('.error').remove();
    fm.find('[required]').each(function(){
        ret = valida_campo($(this),true);
        if (ret!==null) errors.push(ret);
    });
    fm.find('input, select, textarea').each(function(){
        var req = $(this).attr('required');
        if (!req) {
            ret = valida_campo($(this),false);
            if (ret!==null) errors.push(ret);
        }
    });

    if(display){
        fm.find('.has-error').removeClass('has-error');
        for(idx in errors){
            if(errors[idx]["field"]){
                var obj = fm.find('[name=' + errors[idx]["field"] + ']');
                if (obj.next().hasClass('item-content')) {
                    obj = obj.next();
                } else {
                    for(x=0;x<5;x++){
                        obj = obj.parent();
                        if(obj.hasClass('item-content') || obj.hasClass('item-content-select')) break;
                    }
                }

                obj.addClass('has-error');
                var txt_erro = retornaMsgErro(errors[idx]);
                if (txt_erro!="") {
                    $("<div class='error'>"+txt_erro+"</div>").insertAfter(obj);
                    //obj.insertAfter()
                }
            }
        }
    }

    return errors;
}

function validarPlaca(placa){
    placa = placa.toUpperCase();
    placa = placa.replace(/-/g,'');
    
    var definitions = getCurrentDefinitions();
    var masks       = definitions['filters']['carplate'];

    var curmask = null;
    if (Array.isArray(masks)) {
      for(var k in masks) {
        var mask = masks[k];
        mask.pattern.lastIndex = 0;
        if (mask.pattern.test(placa)) {

          return true;
        }
      }
      return false;
    }
    return masks.pattern.test(placa);
}

function validarCep(cep, separado){
    if(separado==null || separado==undefined) separado = true;

    if(separado){
        var er = /[0-9]{5}-[0-9]{3}/gim;
    } else {
        var er = /[0-9]{8}/gim;
    }

    er.lastIndex = 0;

    return er.test(cep);
}

function validarCpChile(cep, separado){
    if(separado==null || separado==undefined) separado = true;

    if(separado){
        var er = /[0-9]{3} [0-9]{4}/gim;
    } else {
        var er = /[0-9]{7}/gim;
    }

    er.lastIndex = 0;

    return er.test(cep);
}

function validarCPF(cpf){
    cpf = so_numeros(cpf);

    if(cpf == '') return false;

    // Elimina CPFs invalidos conhecidos
    if(cpf.length != 11 || cpf == "00000000000" || cpf == "11111111111" || cpf == "22222222222" ||
       cpf == "33333333333" || cpf == "44444444444" || cpf == "55555555555" || cpf == "66666666666" ||
       cpf == "77777777777" || cpf == "88888888888" || cpf == "99999999999"){

        return false;
     }

    // Valida 1o digito
    add = 0;
    for (i=0; i < 9; i ++) add+= parseInt(cpf.charAt(i)) * (10 - i);

    rev = 11 - (add % 11);

    if(rev == 10 || rev == 11) rev = 0;

    if(rev != parseInt(cpf.charAt(9))) return false;

    // Valida 2o digito
    add = 0;
    for (i = 0; i < 10; i ++) add+= parseInt(cpf.charAt(i)) * (11 - i);

    rev = 11 - (add % 11);

    if(rev == 10 || rev == 11) rev = 0;

    if(rev != parseInt(cpf.charAt(10))) return false;

    return true;
}

function validarCNPJ(cnpj){
    cnpj = so_numeros(cnpj);

    if(cnpj == '') return false;

    if(cnpj.length != 14) return false;

    // Elimina CNPJs invalidos conhecidos
    if(cnpj == "00000000000000" || cnpj == "11111111111111" || cnpj == "22222222222222" || cnpj == "33333333333333" ||
       cnpj == "44444444444444" || cnpj == "55555555555555" || cnpj == "66666666666666" || cnpj == "77777777777777" ||
       cnpj == "88888888888888" || cnpj == "99999999999999"){

        return false;
    }

    // Valida DVs
    tamanho = cnpj.length - 2;
    numeros = cnpj.substring(0,tamanho);
    digitos = cnpj.substring(tamanho);
    soma = 0;
    pos = tamanho - 7;

    for(i = tamanho; i >= 1; i--){
      soma += numeros.charAt(tamanho - i) * pos--;
      if(pos < 2)pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

    if(resultado != digitos.charAt(0)) return false;

    tamanho = tamanho + 1;
    numeros = cnpj.substring(0,tamanho);
    soma = 0;
    pos = tamanho - 7;

    for (i = tamanho; i >= 1; i--){
      soma += numeros.charAt(tamanho - i) * pos--;
      if(pos < 2) pos = 9;
    }

    resultado = soma % 11 < 2 ? 0 : 11 - soma % 11;

    if(resultado != digitos.charAt(1)) return false;

    return true;
}

/**
 * Check RUT
 * @author      Weslley Santo   <weslleyesanto@gmail.com>
 * @param       {string}        rut                         "CPF" Chileno
 * @return      {boolean}                                   Retonar true/false
 */
function checkRut(rut) {
    rut         = String(rut);
    var valor   = rut.replace(".", "").replace(".", "");
    valor       = valor.replace("-", "");
    cuerpo      = valor.slice(0, -1);
    dv          = valor.slice(-1).toUpperCase();
    rut         = cuerpo + "-" + dv;

    if (cuerpo.length < 7) {
        return false;
    }//FINAL SE cuerpo.length MENOR 7
    suma        = 0;
    multiplo    = 2;
    for (i = 1; i <= cuerpo.length; i++) {
        index   = multiplo * valor.charAt(cuerpo.length - i);
        suma    = suma + index;
        if (multiplo < 7) {
            multiplo = multiplo + 1;
        } else {
            multiplo = 2;
        }
    }//FINAL for

    dvEsperado  = 11 - suma % 11;
    dv          = dv == "K" ? 10 : dv;
    dv          = dv == 0 ? 11 : dv;
    if (dvEsperado != dv) {
        return false;
    }
    return true;
}//FINAL checkRut

function validarData(data){
    try {
        var dia = data.substring(0,2)
        var mes = data.substring(3,5)
        var ano = data.substring(6,10)

        //Criando um objeto Date usando os valores ano, mes e dia.
        var novaData = new Date(ano,(mes-1),dia);

        var mesmoDia = parseInt(dia,10) == parseInt(novaData.getDate());
        var mesmoMes = parseInt(mes,10) == parseInt(novaData.getMonth())+1;
        var mesmoAno = parseInt(ano) == parseInt(novaData.getFullYear());

        if(!((mesmoDia) && (mesmoMes) && (mesmoAno))) return false;

        dia = parseInt(dia);
        mes = parseInt(mes);
        ano = parseInt(ano);

        if(ano<1900 || ano>2099) return false;
        if(mes<1 || mes>12) return false;

        var bissexto = false;

        if(ano%4==0) bissexto = true;

        var dias = [31,(bissexto?29:28),31,30,31,30,31,31,30,31,30,31];

        if(dia<1 && dia>dias[mes]) return false;

        return true;
    } catch(e){
        return false;
    }
}

function validarHora(strHora, valida24){
    if(valida24==null || valida24==undefined) valida24 = false;

    try {
        var hora = strHora.substring(0,2);
        var min = strHora.substring(3,5);
        var sec = strHora.substring(6,8);

        if(isNaN(hora)) return false;
        if(isNaN(min)) return false;

        var validaSec = false;

        if(sec != '' && sec != null){
            validaSec = true;
            if(isNaN(sec)) return false;
        }

        hora = parseInt(hora);
        min = parseInt(min);
        if(validaSec) sec = parseInt(sec);

        if(validaSec){
            if(sec<0 || sec>59) return false;
        }

        if(min<0 || min>59) return false;

        if(valida24){
            if(hora<0 || hora>23) return false;
        }

        return true;
    } catch(e){
        return false;
    }
}

function validarDataHora(datahora){
    var arrData = formataDataView(datahora).split(' ');

    if(arrData.length != 2) return false;

    var data = arrData[0];
    var hora = arrData[1];

    if(!validarData(data)) return false;
    if(!validarHora(hora, true)) return false;

    return true;
}

function validarCNH( cnh ) {
    cnh = cnh.replace(/[^\d]+/g,'');

    var definitions = getCurrentDefinitions();
    var masks = definitions['mask']['cnh'].replace(/-/g,'');
    var length = masks.length;

    if(cnh == '' || cnh.length != length || parseInt(cnh.charAt(0)) != 0 ) {
        alert(cnh);
        return false;
    }
    valor  = parseInt(cnh.charAt(0));
    valor += parseInt(cnh.charAt(1));
    valor += parseInt(cnh.charAt(2));
    valor += parseInt(cnh.charAt(3));
    valor += parseInt(cnh.charAt(4));

    return valor > 0;//true or false
}

function validarCNHChile( cnh ) {
    cnh = cnh.replace(/[^\d]+/g,'');

    var definitions = getCurrentDefinitions();
    var masks = definitions['mask']['cnh'].replace(/-/g,'');
    var length = masks.length;

    if(cnh == '' || cnh.length != length  ) {
        alert(cnh);
        return false;
    }

    valor = parseInt(cnh);

    return valor > 0;//true or false
}

function validarCelular(telefone) {
    //retira todos os caracteres menos os numeros
    telefone = telefone.replace(/\D/g, '');

    //verifica se tem a qtde de numero correto
    if (!(telefone.length >= 10 && telefone.length <= 11)) return false;

    //Se tiver 11 caracteres, verificar se começa com 9 o celular
    if (telefone.length == 11 && parseInt(telefone.substring(2, 3)) != 9) return false;

    //verifica se não é nenhum numero digitado errado (propositalmente)
    for (var n = 0; n < 10; n++) {
        //um for de 0 a 9.
        //estou utilizando o metodo Array(q+1).join(n) onde "q" é a quantidade e n é o
        //caractere a ser repetido
        if (telefone == new Array(11).join(n) || telefone == new Array(12).join(n)) return false;
    }
    //DDDs validos
    var codigosDDD = [11, 12, 13, 14, 15, 16, 17, 18, 19,
        21, 22, 24, 27, 28, 31, 32, 33, 34,
        35, 37, 38, 41, 42, 43, 44, 45, 46,
        47, 48, 49, 51, 53, 54, 55, 61, 62,
        64, 63, 65, 66, 67, 68, 69, 71, 73,
        74, 75, 77, 79, 81, 82, 83, 84, 85,
        86, 87, 88, 89, 91, 92, 93, 94, 95,
        96, 97, 98, 99];

    //verifica se o DDD é valido (sim, da pra verificar rsrsrs)
    if (codigosDDD.indexOf(parseInt(telefone.substring(0, 2))) == -1) return false;

    //  E por ultimo verificar se o numero é realmente válido. Até 2016 um celular pode
    //ter 8 caracteres, após isso somente numeros de telefone e radios (ex. Nextel)
    //vão poder ter numeros de 8 digitos (fora o DDD), então esta função ficará inativa
    //até o fim de 2016, e se a ANATEL realmente cumprir o combinado, os numeros serão
    //validados corretamente após esse período.
    //NÃO ADICIONEI A VALIDAÇÂO DE QUAIS ESTADOS TEM NONO DIGITO, PQ DEPOIS DE 2016 ISSO NÃO FARÁ DIFERENÇA
    //Não se preocupe, o código irá ativar e desativar esta opção automaticamente.
    //Caso queira, em 2017, é só tirar o if.
    // if (new Date().getFullYear() < 2017) return true;
    if (telefone.length == 10 && [2, 3, 4, 5].indexOf(parseInt(telefone.substring(2, 3))) == -1) return false;

    //se passar por todas as validações acima, então está tudo certo
    return true;
}

function validarCelularChile(telefone) {
    //retira todos os caracteres menos os numeros
    telefone = telefone.replace(/\D/g, '');

    //verifica se tem a qtde de numero correto
    if (!(telefone.length == 9)) return false;

    //Se tiver 11 caracteres, verificar se começa com 9 o celular
    if (telefone.length == 9 && parseInt(telefone.substring(0, 1)) != 9) return false;

    //verifica se não é nenhum numero digitado errado (propositalmente)
    for (var n = 0; n < 10; n++) {
        //um for de 0 a 9.
        //estou utilizando o metodo Array(q+1).join(n) onde "q" é a quantidade e n é o
        //caractere a ser repetido
        if (telefone == new Array(9).join(n) || telefone == new Array(10).join(n)) return false;
    }
    //se passar por todas as validações acima, então está tudo certo
    return true;
}

function validarEmail(email) {
    if ($.trim(email)=="") return true;
    var retorno = true;
    var reg = new RegExp(/([^0-9a-zA-Z@._-])/g);

    if (email.match('@')==null) retorno = false;
    if (email.indexOf('.')==-1) retorno = false;
    if (email.indexOf('..')!=-1) retorno = false;
    if (email.match(reg)!=null) retorno = false;
    var tEmail = email.split('@');
    if (tEmail.length!=2) retorno = false;
    return retorno;
}

function valida_numeros(obj) {
  numeros = new RegExp("[0-9]");
  while (!obj.value.charAt(obj.value.length-1).match(numeros)){
    if(obj.value.length >= 1){
      obj.value = obj.value.substring(0,obj.value.length-1)
    }else{
      return false;
    }
  }
  return true;
}