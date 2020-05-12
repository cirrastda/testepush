function setup_mascaras(){
    var definitions = getCurrentDefinitions();
    var masks = definitions['mask'];

    var mask8ou9Digitos = function (val) {
        var definitions = getCurrentDefinitions();
        var masks = definitions['mask']['tel'];
        if (Array.isArray(masks)) {
            return val.replace(/\D/g, '').length === 11 ? masks_tel[1] : masks_tel[0];
        } else {
            return masks;
        }
    }, mask8ou9DigitosOptions = {
        onKeyPress: function(val, e, field, options) {
            field.unmask().mask(mask8ou9Digitos.apply({}, arguments), options);
        }
    };

    $('.telefone').on('focus',function() {
        $(this).unmask();
        var obj = $(this)[0];
        if (obj.value!="") obj.value = formataTelefone(obj.value.replace(/[^0-9]/g,''));
    }).on('keyup',function() {
        var obj = $(this)[0];
        campo_fone(obj);
    }).on('blur',function() {
        $(this).mask(mask8ou9Digitos, mask8ou9DigitosOptions);
    });

    if(window.localStorage.getItem('language') == 'pt-br'){
        $('.cpf').focus(function() {
            $(this).unmask();
            var obj = $(this)[0];
            formatar_mascara(obj, masks['cpf'], "#");
            if (obj.value!="") obj.value = formataCPF(obj.value);
        }).keyup(function () {
            var obj = $(this)[0];
            if (valida_numeros(obj)) {
                formatar_mascara(obj, masks['cpf'], "#");
            }
        }).blur(function () {
            $(this).mask(masks['cpf'].replace(/#/g,'0'), {reverse: true});
        });
    }else if(window.localStorage.getItem('language') == 'es-cl'){
        $('.cpf').focus(function() {
            $(this).unmask();
        }).blur(function () {
            _mascaraRUT($(this));
        });
    }

    $('.rg').focus(function() {
        $(this).unmask();
        var obj = $(this)[0];
        formatar_mascara(obj, masks['rg'].replace(/9/g,'#').replace(/0/g,'#'), "#");
        //if (obj.value!="") obj.value = formataCPF(obj.value);
    }).keyup(function () {
        var obj = $(this)[0];
        if (valida_numeros(obj)) {
            formatar_mascara(obj, masks['rg'].replace(/9/g,'#').replace(/0/g,'#'), "#");
        }
    }).blur(function () {
        $(this).mask(masks['rg'], {reverse: true});
    });

    $('.placa').css('text-transform', 'uppercase').on('change', function(){
        var placa = $(this).val();

        placa = formataPlaca(placa);

        if(validarPlaca(placa)){
            $(this).val(placa);
        }else{
            $(this).val('');
        }
    });
    //$('.cep').unmask().mask('00000-000');
    $('.cep').focus(function() {
        $(this).unmask();
        var obj = $(this)[0];
        formatar_mascara(obj, masks['cep'], "#");
    }).keyup(function () {
        var obj = $(this)[0];
        if (valida_numeros(obj)) {
            formatar_mascara(obj, masks['cep'], "#");
        }
    }).blur(function () {
        $(this).mask(masks['cep'].replace(/#/g,'0'));
    });

    $('.cnpj').focus(function() {
        $(this).unmask();
        var obj = $(this)[0];
        formatar_mascara(obj, "##.###.###/####-##", "#");
        if (obj.value!="") obj.value = formataCNPJ(obj.value);
    }).keyup(function () {
        var obj = $(this)[0];
        if (valida_numeros(obj)) {
            formatar_mascara(obj, "##.###.###/####-##", "#");
        }
    }).blur(function () {
        $(this).mask('00.000.000/0000-00', {reverse: true});
    });

    $('.data').unmask().mask('00/00/0000');
    $('.hora').unmask().mask('00:00');
    $('.datahora').unmask().mask('00/00/0000 00:00');
    $('.just-number').keyup(function() {
        just_number(this);
    });

    $('.cnh').keyup(function () {
        var obj = $(this)[0];
        if (valida_numeros(obj)) {
            formatar_mascara(obj, masks['cnh'], "#");
        }
    }).blur(function() {
        var cnh = $(this).val();
        while(cnh.length < masks['cnh'].replace(/-/g,'').length) {
            cnh = '0'+cnh;
        }
        $(this).val(cnh);
        $(this).mask(masks['cnh'].replace(/#/g,'0'));
        //formatar_mascara($(this)[0], masks['cnh'], "#");
    });
}//FINAL setup_mascaras

function formataDataDb(valor){
    if(!valor) return valor;

    if(valor.indexOf('/') > -1){
        valor = so_numeros(valor);
        if(valor.length == 12) valor+= "00";
        if(valor.length == 14){
            return valor.replace(/(\d{2})(\d{2})(\d{4})(\d{2})(\d{2})(\d{2})/g,"\$3\-\$2\-\$1 \$4\:\$5\:\$6");
        } else {
            return valor.replace(/(\d{2})(\d{2})(\d{4})/g,"\$3\-\$2\-\$1");
        }
    } else {
        if(valor.length == 16) valor+= ":00";
        return valor.replace('T', ' ');
    }
}

function formataDataLocal(valor){
    if(!valor) return valor;

    valor = formataDataDb(valor);

    return valor.replace(' ', 'T');
}

function formataTelefone(valor, pais) {
    if(!valor) return valor;
    if (pais==null || pais==undefined) pais = 1;

    var definitions = getCurrentDefinitions();
    var masks = definitions['filters']['tel'];

    if (Array.isArray(masks)) {
        if(valor.length == 11){
            masks = masks[1];
        } else {
            masks = masks[0];
        }
    }
    return valor.replace(masks.pattern,masks.mask);
}

function formataCEP(valor) {
    if(!valor) return valor;

    var definitions = getCurrentDefinitions();
    var mask = definitions['filters']['cep'];

    return valor.replace(mask.pattern,mask.mask);
    //return valor.replace(/(\d{5})(\d{3})/g,"\$1\-\$2");
}

function formataPlaca(valor) {
    if(!valor) return valor;

    valor = valor.toUpperCase().replace(/-/g,'');

    var definitions = getCurrentDefinitions();
    var masks = definitions['filters']['carplate'];

    var curmask = null;
    if (Array.isArray(masks)) {
      for(var k in masks) {
        var mask = masks[k];
        mask.pattern.lastIndex = 0;
        if (mask.pattern.test(valor)) {
          curmask = mask;
          break;
        }
      }
      masks = (curmask == null ? mask[0] : curmask);
    }
    return valor.replace(masks.pattern,masks.mask);
}

function formataCPF(valor) {
    if(!valor) return valor;

    return valor.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/g,"\$1.\$2.\$3\-\$4");
}

function formataCNPJ(valor) {
    if(!valor) return valor;

    return valor.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,"\$1.\$2.\$3\/\$4\-\$5");
}

function formatar_mascara(cpo, mascara, padrao){
    var src   = cpo;
    var campo = src.value.length;
    var texto = mascara.substring(campo-1);

    if(texto.substring(0,1) != padrao && texto.substring(0,1) != src.value.substring(campo,campo-1)) {
        char_digitado = src.value.substring(campo,campo-1);
        src.value = src.value.substring(0,campo-1)+texto.substring(0,1);
        while(mascara.substring(src.value.length,src.value.length+1) != padrao && mascara.length > src.value.length){
          src.value = src.value+mascara.substring(src.value.length,src.value.length+1);
        }
        src.value += char_digitado;
    }
    submask = mascara;

    while(submask.substring(submask.length-1,submask.length) != padrao){
        submask = submask.substring(0,submask.length-1);
    }//FINAL while

    if (src.value.length == submask.length){
        while (src.value.length < mascara.length){
          src.value += mascara.substring(src.value.length,src.value.length+1);
        }//FINAL while
    }

    if (src.value.length > mascara.length){
        retira  = new RegExp(padrao,"g");
        teste   = mascara.replace(retira,"");
        itens   = teste.split("");
        txt     = src.value;
        msk     = mascara;
        for (x in itens){
          if (itens[x].length==1){
            retira = new RegExp("\\"+itens[x],"g");
            txt = txt.replace(retira,"");
            msk = msk.replace(retira,"");
          }
        }//FINAL for
        txt = txt.substring(0,msk.length);
        txt = txt.split("");
        src.value = "";
        for (x in txt){
          src.value += txt[x];
          formatar_mascara(src, mascara, padrao);
        }//FINAL for
    }//FINAL SE src.value.length MAIOR mascara.length
}//FINAL FUNCTION formatar_mascara

function maskText(val, mascara, padrao){
    var campo = val.length;
    var texto = mascara.substring(campo-1);
    if(texto.substring(0,1) != padrao && texto.substring(0,1) != val.substring(campo,campo-1)) {
        char_digitado = val.substring(campo,campo-1);
        val = val.substring(0,campo-1)+texto.substring(0,1);
        while(mascara.substring(val.length,val.length+1) != padrao && mascara.length > val.length){
          val = val+mascara.substring(val.length,val.length+1);
        }
        val += char_digitado;
    }

    submask = mascara;
    while(submask.substring(submask.length-1,submask.length) != padrao){
        submask = submask.substring(0,submask.length-1);
    }//FINAL while

    if (val.length == submask.length){
        while (val.length < mascara.length){
          val += mascara.substring(val.length,val.length+1);
        }//FINAL while
    }


    if (val.length > mascara.length){
        retira  = new RegExp(padrao,"g");
        teste   = mascara.replace(retira,"");
        itens   = teste.split("");
        txt     = val;
        msk     = mascara;
        for (x in itens){
          if (itens[x].length==1){
            retira = new RegExp("\\"+itens[x],"g");
            txt = txt.replace(retira,"");
            msk = msk.replace(retira,"");
          }
        }//FINAL for
        txt = txt.substring(0,msk.length);
        txt = txt.split("");
        val = "";
        for (x in txt){
          val += txt[x];
          maskText(val, mascara, padrao);
        }//FINAL for
    }//FINAL SE src.value.length MAIOR mascara.length
    return val;
}//FINAL FUNCTION formatar_mascara


function campo_fone(obj) {
  function getDDDPattern(pattern) {
    var inicio  = pattern.indexOf('(');
    var fim     = pattern.indexOf(')');
    var length  = fim - (inicio+1);
    return {
        inicio: inicio,
        length: length
    };
  }

  function getMaxLength(pattern) {
    var maxLength = 0;
    if (Array.isArray(pattern)) {
        for (var pat in pattern) {
            if (pattern[pat].length>maxLength) {
                maxLength = pattern[pat].length;
            }
        }
    } else {
        maxLength = pattern.length;
    }
    return maxLength;
  }

  if (valida_numeros(obj)) {

    var tel_unformat = obj.value;
    var tel_unformat = tel_unformat.replace(/[()-]|[ ]/g,'');
    var definitions = getCurrentDefinitions();
    var mask = definitions['mask']['tel'];
    var max = getMaxLength(mask);

    var dddDef = getDDDPattern(Array.isArray(mask) ? mask[0] : mask);
    if (dddDef.length>0) {
        var ddd = tel_unformat.substring(dddDef.inicio,dddDef.length);
        var prim_digito = tel_unformat.substring(dddDef.length+1,dddDef.length+2);
    } else {
        var ddd = 0;
        var prim_digito = tel_unformat.substring(0,1);
    }

    if (obj.value.length>max) obj.value = obj.value.substr(0,max);

    var txt = {'value':''};
    //        var splitted = obj.value.replace('-','').split('');
    var splitted = obj.value.replace(/[^0-9]/g,'').split('');

    for (x in splitted) {
        if (!isNaN(splitted[x])) {
            txt.value += ''+splitted[x];
        }
        var l = txt.length;

        if (Array.isArray(mask)) {
            if (prim_digito=='9') {
                mask = mask[1];
                formatar_mascara(txt, "(##) #####-####", "#");
            } else {
                mask = mask[0];
            }
        }
        mask = mask.replace(/0/g,'#').replace(/9/g,'#');
        formatar_mascara(txt, mask, "#");

    }

    obj.value = txt.value;
  }
}

function campo_fone2(obj, maxLength, mexico) {
  if (valida_numeros(obj)) {
    //if (mexico==null || mexico==undefined) mexico = false;

    var max = (maxLength ? maxLength : (obj.maxLength ? obj.maxLength : 15));

    var tel_unformat = obj.value;
    var tel_unformat = tel_unformat.replace(/[()-]|[ ]/g,'');
    var definitions = getCurrentDefinitions();
    var mask = definitions['mask']['tel'];

    if (max>10) {
        if (mexico) {
            var ddd = tel_unformat.substring(0,3);
            var prim_digito = tel_unformat.substring(3,4);
        } else {
            var ddd = tel_unformat.substring(0,2);
            var prim_digito = tel_unformat.substring(2,3);
            ddd = parseInt(ddd);
        }
    } else {
      var ddd = 0;
      var prim_digito = tel_unformat.substring(0,1);
    }

    if (obj.value.length>max) obj.value = obj.value.substr(0,max);
    if (mexico) {
      var txt = {'value':''};
      //        var splitted = obj.value.replace('-','').split('');
      var splitted = obj.value.replace(/[^0-9]/g,'').split('');
      for (x in splitted) {
        if (!isNaN(splitted[x])) {
          txt.value += ''+splitted[x];
        }
        var l = txt.length;
        formatar_mascara(txt, "(###) ####-####", "#");
      }
      obj.value = txt.value;
    } else {
        if (max==10 && prim_digito=='9') {
          formatar_mascara(obj, "#####-####", "#");
        } else {
          if (max==10 && prim_digito!='9') {
            if (obj.value.length==10) obj.value = obj.value.substring(0,9);
            formatar_mascara(obj, "####-####", "#");
          }
          if (obj.value.length >= 10) {
            if (obj.value.length == 10 || obj.value.length == max) {
              var txt = {'value':''};
              //        var splitted = obj.value.replace('-','').split('');
              var splitted = obj.value.replace(/[^0-9]/g,'').split('');
              for (x in splitted) {
                if (!isNaN(splitted[x])) {
                  txt.value += ''+splitted[x];
                }
                if (prim_digito=='9') {
                  formatar_mascara(txt, "(##) #####-####", "#");
                } else {
                  formatar_mascara(txt, "(##) ####-####", "#");
                }
              }
              obj.value = txt.value;
            } else {
                if (prim_digito=='9') {
                formatar_mascara(obj, "(##) #####-####", "#");
              } else {
                formatar_mascara(obj, "(##) ####-####", "#");
              }
            }
          } else {
            formatar_mascara(obj, "####-####", "#");
          }
        }
    }
  }
}

/**
 * Método privado para incluir mascara RUT
 * @author      Weslley Santo   <weslleyesanto@gmail.com>
 * @param       {string}        rut                         "CPF" Chileno
 * @return      {string}                                    Retorna RUT formatado.
 */
function _mascaraRUT(rut){
    rut.unmask();

    var rut_length = rut.val().length;

    if(rut_length == 8){
        return rut.mask('#.###.###-A', {
            translation: {
                'A': { pattern: /[0-9kK]/, optional: false}
            }
        });
    }else if(rut_length == 9){
        return rut.mask('##.###.###-A', {
            translation: {
                'A': { pattern: /[0-9kK]/, optional: false}
            }
        });
    }
}//FINAL _mascaraRUT

function pad (str, max) {
  str = str.toString();
  return str.length < max ? pad("0" + str, max) : str;
}

function strLimit(str, limit, full_words) {
    if (full_words==null || full_words==undefined) full_words = false;

    var return_str = '';
    if (full_words) {
        var parts = text.split(' ');
        len = parts.length;
        for (i = 0; i < len; i++) {
            var part = parts[i];
            if (return_str.length + part.length <= limit) {
                return_str += ' '+part.length;
            }
        }
        if (return_str.length<str.length) return_str += '...';
    } else {
        if (str.length > limit) {
            return_str = $.trim(str.substr(0,limit))+'...';
        } else {
            return_str = $.trim(str);
        }
    }
    return return_str;
}

function ucfirst(str) {
    str = str.toLowerCase();
    var first = str[0].toUpperCase();
    var rest = str.substring(1, str.length);
    var word = first + rest;
    
    return word;
}

function ucwords(str) {
    var text = str.toLowerCase();

    var parts = text.split(' '),
    len = parts.length,
    i, words = [];
    for (i = 0; i < len; i++) {
        var part = parts[i];
        if (part!="") {
            word = ucfirst(part);
            words.push(word);
        }
    }

    return words.join(' ');
}
function textWidth(){
  var html_org = $(this).html();
  var html_calc = '<span>' + html_org + '</span>';
  $(this).html(html_calc);
  var width = $(this).find('span:first').width();
  $(this).html(html_org);
  return width;
};

function trataEndereco(endereco, numero, bairro) {
    if (numero!=null && numero!='') endereco += ","+numero;
    if (bairro!=null && bairro!='') endereco += " - "+bairro;
    return endereco;
}

function campo_moeda(obj) {
  valida_numeros(obj);
  valor = obj.value.replace(",","");
  valor = valor.replace(/\./g,"");

  while (valor.charAt(0) == "0"){
    valor = valor.substring(1,valor.length);
  }
  if (valor.length >= 3){
    tam   = valor.length;
    real  = valor.substring(0,tam-2);
    tamreal = real.length;
    valor_dividido = "";
    premilhar = real;
    while(tamreal > 3){
      premilhar  = premilhar.substring(0,tamreal-3);
      milhar  = real.substring(tamreal-3,tamreal);
      tamreal = premilhar.length;
      real = premilhar;
      valor_dividido = "."+milhar+valor_dividido;
    }
    real = premilhar+valor_dividido;
    cent  = valor.substring(tam-2,tam);
    valor = real+","+cent;
  }else{
    valor = "0," + (valor.length == 2 ? valor : "0" + valor);
  }
  obj.value = valor;
}
