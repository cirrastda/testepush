function getPaises(){
    var deferred = $.Deferred();
    //control.rest.makeRequest('/api_endereco/get_paises_driver/1').done(function(res){
        var res = {
            "1":{
                "codigo":1,
                "descricao":"Brasil",
                "codigo_telefonico":55,
                "imagem": "brasil"
            },
            "5":{
                "codigo":5,
                "descricao":"Chile",
                "codigo_telefonico":56,
                "imagem": "chile"
            },
            "11":{
                "codigo":11,
                "descricao":"Mexico",
                "codigo_telefonico":52,
                "imagem": "mexico"
            }
        };
        deferred.resolve(res);
    //});
    return deferred.promise();
}

function getEstados(regiao, pais){
    var deferred = $.Deferred();
    if (regiao==null || regiao==undefined) regiao = '';
    if (pais==null || pais==undefined) pais = '';
    var param = {
        "codigo_regiao": regiao,
        "pais": pais
    };
    control.rest.makeRequest('/api_endereco/get_ufs', param).done(function(res){
        deferred.resolve(res);
    });
    return deferred.promise();
}

function getCidades(codigo_uf){
    var deferred = $.Deferred();
    var param = {
        "uf": codigo_uf
    };
    control.rest.makeRequest('/api_endereco/get_cidades',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300024', { classe: 'postdata.class.js', metodo: 'getCidades'},{mensagem_padrao: '[300024]Erro ao buscar cidades>:'+erro});	                         
        console.log('[300024]Erro ao buscar cidades');
        deferred.reject(erro);
    });
    return deferred.promise();
}

function getTiposVeiculo(){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_localiza_veiculos/get_tipos_veiculo' ).done(function(res){
        res = sortListJson(res);
        deferred.resolve(res);
    });
    return deferred.promise();
}

function getTiposCarroceria(){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_localiza_veiculos/get_tipos_carroceria' ).done(function(res){
        res = sortListJson(res);
        deferred.resolve(res);
    });
    return deferred.promise();
}

function getAnos() {
    var ano_atual = new Date().getFullYear();
    var ano_menor = 1950;
    var ano = ano_atual
    var anos = [];
    while(ano >= ano_menor) {
        anos.push(ano);
        ano--;
    }
    return anos;
}

function getFabricantes(){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_localiza_veiculos/get_fabricantes' ).done(function(res){
        deferred.resolve(res);
    });
    return deferred.promise();
}

function getTecnologias(){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_localiza_veiculos/get_tecnologias' ).done(function(res){
        deferred.resolve(res);
    });
    return deferred.promise();
}//FINAL function getTecnologias


function getModelos(codigo_fabricante){
    var deferred = $.Deferred();
    var param = {
        "fabricante": codigo_fabricante
    };
    control.rest.makeRequest('/api_localiza_veiculos/get_modelos',param ).done(function(res){
        deferred.resolve(res);
    });
    return deferred.promise();
}
function getEndereco(cep){
    var deferred = $.Deferred();
    var param = {
        "cep": cep
    };
    control.rest.makeRequest('/api_endereco/get_endereco_cep',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300025', { classe: 'postdata.class.js', metodo: 'getEndereco'},{mensagem_padrao: '[300025]Erro ao pesquisar endereco: '+erro});	                         
        deferred.reject('[300025]Erro ao pesquisar endereco: '+erro);
    });
    return deferred.promise();
}

function getDadosVeiculo(placa, tipo) {
    var deferred = $.Deferred();
    if (tipo==null || tipo==undefined) tipo = '';
    var param = {
        "placa": placa,
    };
    if (tipo=='veiculo') {
        param.tipo_veiculo = 1;
        param.operador = '!=';
    } else if (tipo=='carreta') {
        param.tipo_veiculo = 1;
        param.operador = '=';
    }
    control.rest.makeRequest('/api_localiza_veiculos/get_dados_veiculo',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300026', { classe: 'postdata.class.js', metodo: 'getDadosVeiculo'},{mensagem_padrao: 'Erro ao pesquisar veiculo: '+erro});	                        
        deferred.reject('[300026]Erro ao pesquisar veiculo: '+erro);
    });
    return deferred.promise();    
}

function checkLogin(documento, telefone) {
    var deferred = $.Deferred();
    var param = {
        "documento": documento,
        'telefone': telefone
    };
    control.rest.makeRequest('/api_motorista_mobile/check_motorista_driver',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300027', { classe: 'postdata.class.js', metodo: 'getDadosMotorista'},{mensagem_padrao: 'Erro ao pesquisar motorista: '+erro});                         
        deferred.reject('[300027]Erro ao pesquisar motorista: '+erro);
    });
    return deferred.promise();    
}

function getDadosMotorista(cpf) {
    var deferred = $.Deferred();
    var param = {
        "documento": cpf,
        'aplicativo': 'buonnydriver'
    };
    control.rest.makeRequest('/api_motorista_mobile/get_motorista',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300027', { classe: 'postdata.class.js', metodo: 'getDadosMotorista'},{mensagem_padrao: 'Erro ao pesquisar motorista: '+erro});	                        
        deferred.reject('[300027]Erro ao pesquisar motorista: '+erro);
    });
    return deferred.promise();    
}

function getViagemPlaca(placa) {
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_localiza_veiculos/retorna_sm_por_placa/'+placa+"/0/0/0/1/1" ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300028', { classe: 'postdata.class.js', metodo: 'getViagemPlaca', placa: placa},{mensagem_padrao: erro});	                        
        deferred.reject(erro);
    });
    return deferred.promise();    

}

function getFotoMotorista(cpf) {
    var deferred = $.Deferred();
    var param = {
        "documento": cpf,
        'aplicativo': 'buonnydriver'
    };
    control.rest.makeRequest('/api_motorista_mobile/get_foto_motorista',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300029', { classe: 'postdata.class.js', metodo: 'getFotoMotorista'},{mensagem_padrao: 'Erro ao pesquisar motorista 2: '+erro});	                        
        deferred.reject('[300029]Erro ao pesquisar motorista: '+erro);
    });
    return deferred.promise();    
}

function getTokenCall(cpf) {
    var deferred = $.Deferred();
    var param = {
        "documento": cpf,
        'aplicativo': 'buonnydriver'
    };
    control.rest.makeRequest('/api_motorista_mobile/gerar_token_chamadas',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300030', { classe: 'postdata.class.js', metodo: 'getTokenCall', placa: placa},{mensagem_padrao: 'Erro ao pesquisar motorista 3: '+erro});	                       
        deferred.reject('[300030]Erro ao pesquisar motorista 3: '+erro);
    });
    return deferred.promise();    
}

function getTextoLgpd() {
    var deferred = $.Deferred();
    var param = null;
    control.rest.makeRequest('/lgpd_mobile',param ,undefined,undefined,undefined,"GET").done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300035', { classe: 'getdata.class.js', metodo: 'getTextoLgpd'},{mensagem_padrao: 'Erro ao Recuperar Texto de Autorização: '+erro});                         
        deferred.reject('[300035]Erro ao pesquisar motorista 3: '+erro);
    });
    return deferred.promise();    

}

function getAutorizacoes(cpf) {
    var deferred = $.Deferred();
    var param = {
        "documento": so_numeros(cpf),
    };
    control.rest.makeRequest('/autorizacoes',param,undefined,undefined,undefined,"GET" ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300036', { classe: 'getdata.class.js', metodo: 'getAutorizacoes'},{mensagem_padrao: 'Erro ao pesquisar autorizacoes do motorista: '+erro});
        deferred.reject('[300036]Erro ao pesquisar autorizacoes do motorista: '+erro);
    });
    return deferred.promise();    
}

function getTiposAutorizacao() {
    var deferred = $.Deferred();
    control.rest.makeRequest('/tipos_autorizacao',null,undefined,undefined,undefined,"GET" ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300037', { classe: 'getdata.class.js', metodo: 'getTiposAutorizacao'},{mensagem_padrao: 'Erro ao pesquisar tipos de autorizacao: '+erro});
        deferred.reject('[300037]Erro ao pesquisar tipos de autorizacao: '+erro);
    });
    return deferred.promise();    
}


function getRegioes(){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_endereco/get_regioes').done(function(res){
        deferred.resolve(res);
    }).fail(function(erro) {
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300051', { classe: 'getdata.class.js', metodo: 'getRegioes'},{mensagem_padrao: 'Erro ao pesquisar regiões: '+erro});
        deferred.reject('[300051]Erro ao pesquisar regiões: '+erro);
    });
    return deferred.promise();
}


function getStatusOferta() {
    var status = [];
    status['A'] = getStatusText('AguardandoResposta');
    status['CO'] = getStatusText('AguardandoResposta');
    status['NR'] = getStatusText('NovaOferta');
    return status
}

function getTotalOfertas(tipo_view) {
    var deferred = $.Deferred();
    if (tipo_view==null || tipo_view==undefined) tipo_view = 'todos';
    param = {
        'tipo_view': tipo_view
    };
    control.rest.makeLoggedRequest('/ofertas', '', false, false, param, 'GET').done(function(res){
        if(!res.erro){              
            deferred.resolve(res.length);
        } else {
            deferred.reject(res.erro);
        }   
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300052', { classe: 'getdata.class.js', metodo: 'getTotalOfertas'},{mensagem_padrao: 'Erro ao pesquisar total de ofertas: '+erro});
        deferred.reject('[300052]Erro ao pesquisar o total de ofertas: '+erro);
        // deferred.reject('Sem conexão com a internet');
    });

    return deferred.promise();

}


function getOfertas(tipo_view, placa) {
    var deferred = $.Deferred();
    if (tipo_view==null || tipo_view==undefined) tipo_view = 'todos';
    param = {
        'tipo_view': tipo_view,
        'placa': placa
    };
    control.rest.makeLoggedRequest('/ofertas', '', false, null, param, 'GET').done(function(res){
        if(!res.erro){
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300052', { classe: 'getdata.class.js', metodo: 'getOfertas'},{mensagem_padrao: 'Erro ao pesquisar ofertas: '+erro});
        deferred.reject('[300052]'+getErrorMessage('SemConexao'));
        // deferred.reject('Sem conexão com a internet');
    });

    return deferred.promise();

}

function getDadosOferta(id) {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/ofertas/'+id, '', true, null, null, 'GET').done(function(res){
        if(!res.erro){
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300053', { classe: 'getdata.class.js', metodo: 'getDadosOferta'},{mensagem_padrao: 'Erro ao buscar dados da oferta: '+erro});
        deferred.reject('[300053]Erro ao buscar dados da oferta: '+erro);
    });

    return deferred.promise();

}

function getTotalFretesProximos(filtros, loading) {
    var deferred = $.Deferred();
    if (loading==null || loading==undefined) loading = true;
    control.rest.makeLoggedRequest('/fretes/proximos/1', filtros, loading, null, null, 'POST').done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300054', { classe: 'getdata.class.js', metodo: 'getTotalFretesProximos'},{mensagem_padrao: 'Erro ao buscar Fretes Proximos: '+erro});
        deferred.reject('[300054]Erro ao buscar Fretes Proximos: '+erro);
    });

    return deferred.promise();
}

function getFretesProximos(filtros) {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes/proximos', filtros, true, null, null, 'POST').done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300055', { classe: 'getdata.class.js', metodo: 'getFretesProximos'},{mensagem_padrao: 'Erro ao buscar Fretes Proximos: '+erro});
        deferred.reject('[300055]Erro ao buscar Fretes Proximos: '+erro);
    });

    return deferred.promise();
}

function getFretesEmAtendimento() {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes', '', true, null, null, 'GET').done(function(res){
        if(!res.erro){
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300056', { classe: 'getdata.class.js', metodo: 'getFretesEmAtendimento'},{mensagem_padrao: 'Erro ao buscar fretes em atendimento: '+erro});
        deferred.reject('[300056]'+getErrorMessage('ErroBuscarFretesAtendimento')+': '+erro);
    });

    return deferred.promise();
}

function getDadosFrete(id) {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes/'+id, '', true, null, null, 'GET').done(function(res){
        if(!res.erro){
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300057', { classe: 'getdata.class.js', metodo: 'getDadosFrete'},{mensagem_padrao: 'Erro ao buscar fretes em atendimento: '+erro});
        deferred.reject('[300057]Erro ao buscar fretes em atendimento: '+erro);
    });

    return deferred.promise();
}

function getCheckin() {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/checkin', '', false, null, null, 'GET').done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300058', { classe: 'getdata.class.js', metodo: 'getCheckin'},{mensagem_padrao: 'Erro ao buscar Check-in: '+erro});
        deferred.reject('[300058]Erro ao buscar Check-in: '+erro);
    });

    return deferred.promise();
}

function getCategorias(){
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/sessoes_cnae','',false, null, null,'GET' ).done(function(res){
        res = sortListJson(res);
        deferred.resolve(res);
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300059', { classe: 'getdata.class.js', metodo: 'getCategorias'},{mensagem_padrao: 'Erro ao buscar Categorias: '+erro});
        deferred.reject('[300059]Erro ao buscar Categorias: '+erro);
    });
    return deferred.promise();
}

function getDetalhesEmpresa(codigo_cliente) {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/clientes_app/detalhes/'+codigo_cliente, '', false, null, null, 'GET').done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300060', { classe: 'getdata.class.js', metodo: 'getDetalhesEmpresa'},{mensagem_padrao: 'Erro ao buscar Detalhes da Empresa: '+erro});
        deferred.reject('[300060]Erro ao buscar Detalhes da Empresa: '+erro);
    });

    return deferred.promise();
}

function getTotalHistorico(tipo) {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes/historico/'+tipo+"/count", '', true, null, null, 'GET').done(function(res){
        if(!res.erro){              
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }   
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300061', { classe: 'getdata.class.js', metodo: 'getTotalHistorico'},{mensagem_padrao: 'Erro ao buscar Histórico: '+erro});
        deferred.reject('[300061]Sem conexão com a internet');
    });

    return deferred.promise();
}

function getHistorico(tipo, limit, offset) {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes/historico/'+tipo+"/all/1/"+offset+"/"+limit, '', false, null, null, 'GET').done(function(res){
        if(!res.erro){              
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }   
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300062', { classe: 'getdata.class.js', metodo: 'getHistorico'},{mensagem_padrao: 'Erro ao buscar Histórico: '+erro});
        deferred.reject('[300062]Sem conexão com a internet');
    });

    return deferred.promise();

}

function getNotificacao() {
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/api_checkin/get_notificacao', '', false, null, null, 'GET').done(function(res){
        if(res===null){              
            deferred.resolve(null);
        } else {
            deferred.resolve(res);
        }   
    }).fail(function(erro){
         //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300063', { classe: 'getdata.class.js', metodo: 'getNotificacao'},{mensagem_padrao: 'Erro ao buscar Notificação: '+erro});
        deferred.reject('[300063]Sem conexão com a internet');
    });

    return deferred.promise();

}
