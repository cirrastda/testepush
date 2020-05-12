function doLogin(data){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_motorista_mobile/incluir_motorista_app',data,true).done(function(res){
        console.log(data);
    	if (res.sucesso) {
    		deferred.resolve(res);
    	} else {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300015', { classe: 'postdata.class.js', metodo: 'doLogin'},{mensagem_padrao: res.erro});	                             
    		deferred.reject('[300015]'+res.erro);
    	}

    });
    return deferred.promise();
}

function atualizarMotorista(data, block){
    var deferred = $.Deferred();
    block = (typeof block == "undefined" ? true : block);
    control.rest.makeRequest('/motoristas_mobile/atualizar',data,block,true).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res);
        } else {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300016', { classe: 'postdata.class.js', metodo: 'atualizarMotorista'},{mensagem_padrao: res.erro});	                         
            deferred.reject('[300016]'+res.erro);
        }
    }).fail(function(error) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300017', { classe: 'postdata.class.js', metodo: 'atualizarMotorista'},{mensagem_padrao: error});	                         
        deferred.reject('[300017]'+error);
    });
    return deferred.promise();
}

function incluirMotorista(data, block){
    block = (typeof block == "undefined" ? true : block);
    var deferred = $.Deferred();
    data.developing = 1;
    control.rest.makeRequest('/motoristas_mobile/incluir',data,block,false).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res);
        } else {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300018', { classe: 'postdata.class.js', metodo: 'incluirMotorista'},{mensagem_padrao: res.erro});	                         
            deferred.reject('[300018]'+res.erro);
        }

    }).fail(function(error) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300019', { classe: 'postdata.class.js', metodo: 'incluirMotorista'},{mensagem_padrao: error});	                         
        deferred.reject('[300019]'+error);
    });
    return deferred.promise();
}

function assumirViagem(codigo_sm){

    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/api_motorista_mobile/assumir_viagem_e_veiculo/'+codigo_sm,{},true).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res);
        } else {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300020', { classe: 'postdata.class.js', metodo: 'assumirViagem', SM: codigo_sm},{mensagem_padrao: res.erro});	                         
            deferred.reject('[300020]'+res.erro);
        }
    }).fail(function(msg) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300021', { classe: 'postdata.class.js', metodo: 'assumirViagem', SM: codigo_sm},{mensagem_padrao: msg});	                         
        deferred.reject('[300021]'+msg);
    });
    return deferred.promise();
}

function saveFotoMotorista(data, block){
    var deferred = $.Deferred();
    block = (typeof block == "undefined" ? true : block);

    control.rest.makeRequest('/api_motorista_mobile/salvar_foto_motorista',data,block,true).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res);
        } else {
            //Adicionar erro nao fatal ao fabric
            ErrorClass.parseError('API','300022', { classe: 'postdata.class.js', metodo: 'saveFotoMotorista'},{mensagem_padrao: res.erro});	                         
            deferred.reject('[300022]'+res.erro);
        }
    }).fail(function(error) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300023', { classe: 'postdata.class.js', metodo: 'saveFotoMotorista'},{mensagem_padrao: error});	                         
        deferred.reject('[300023]'+error);
    });
    return deferred.promise();
}

function enviarAssinatura(params) {
    var deferred = $.Deferred();

    block = (typeof block == "undefined" ? true : block);
    control.rest.makeRequest('/api_custom_checklist/incluir_assinatura_entrega/', params, true).done(function (res) {
        if (res.sucesso) {
            deferred.resolve(res);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function (error) {
        deferred.reject(error);
    });

    return deferred.promise();
}

function salvaAceiteLogin(data){
    var deferred = $.Deferred();
    control.rest.makeRequest('/api_motorista_mobile/salvaAceiteProfissional',data,true).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res);
        } else {
            ErrorClass.parseError('API','300037', { classe: 'postdata.class.js', metodo: 'salvaAceiteLogin'},{mensagem_padrao: res.erro});                             
            deferred.reject(res.erro);
        }
    });
    return deferred.promise();
}

function validarFotoMotorista(documento, telefone, foto_bin, atualizar_foto, efetuar_login) {
    var deferred = $.Deferred();
    var param = {
        "documento": documento,
        'telefone': telefone,
        "atualizar_foto": atualizar_foto,
        "efetuar_login": efetuar_login,
        "foto_bin": foto_bin
    };
    control.rest.makeRequest('/api_motorista_mobile/validar_foto_motorista',param ).done(function(res){
        deferred.resolve(res);
    }).fail(function (erro) {
        //Adicionar erro nao fatal ao fabric
        ErrorClass.parseError('API','300038', { classe: 'postdata.class.js', metodo: 'validarFotoMotorista'},{mensagem_padrao: 'Erro ao validar foto motorista: '+erro});
        deferred.reject('[300038]Erro ao validar foto motorista: '+erro);
    });
    return deferred.promise();    
}

function aceitarOferta(data){
    var deferred = $.Deferred();    
    control.rest.makeLoggedRequest('/ofertas/aceitar',data,true).done(function(res){
        if(res.sucesso){     
            deferred.resolve(res);  
        } else {
            deferred.reject(res.erro);
        }
        
    }).fail(function(erro){
        ErrorClass.parseError('API','300039', { classe: 'postdata.class.js', metodo: 'aceitarOferta'},{mensagem_padrao: 'Erro ao aceitar oferta: '+erro});
        deferred.reject('[300039]'+getErrorMessage('ErroAceitarOferta')+': '+erro);
    });
    return deferred.promise();
}

function candidatarFrete(data){
    var deferred = $.Deferred();

    control.rest.makeLoggedRequest('/api_fretes/valida_cnh_categoria_frete_mundo_frete',data,true).done(function(res){
        if (res.sucesso) {
            control.rest.makeLoggedRequest('/fretes/candidatar',data,true).done(function(res){
                if (res.sucesso){     
                    deferred.resolve(res);  
                } else {
                    deferred.reject(res.erro);
                }                
            }).fail(function(erro) {
                ErrorClass.parseError('API','300041', { classe: 'postdata.class.js', metodo: 'candidatarFrete'},{mensagem_padrao: 'Erro ao candidatar-se ao Frete: '+erro});
                deferred.reject('[300041]'+getErrorMessage('ErroCandidatarFrete')+': '+erro);
            });
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro) {
        ErrorClass.parseError('API','300040', { classe: 'postdata.class.js', metodo: 'candidatarFrete'},{mensagem_padrao: 'Erro ao candidatar-se ao Frete: '+erro});
        deferred.reject('[300040]'+getErrorMessage('ErroCandidatarFrete')+': '+erro);
    });   

    return deferred.promise();
}

function rejeitarOferta(data){
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/ofertas/rejeitar',data,true).done(function(res){
        if(res.sucesso){     
            deferred.resolve(res);  
        } else {
            // ErrorClass.parseError('API','300042', { classe: 'postdata.class.js', metodo: 'rejeitarOferta'},{mensagem_padrao: 'Erro ao rejeitar oferta: '+erro});
            deferred.reject(res.erro);
            // deferred.reject(res.erro);
        }
        
    }).fail(function(erro){
        ErrorClass.parseError('API','300042', { classe: 'postdata.class.js', metodo: 'rejeitarOferta'},{mensagem_padrao: 'Erro ao rejeitar oferta: '+erro});
        deferred.reject('[300042]'+getErrorMessage('ErroRejeitarOferta')+': '+erro);
    });
    return deferred.promise();
}

function contraOferta(data){
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/ofertas/contra_oferta',data,true).done(function(res){
        if(res.sucesso){     
            deferred.resolve(res);  
        } else {
            deferred.reject(res.erro);
        }
        
    }).fail(function(erro){
        ErrorClass.parseError('API','300043', { classe: 'postdata.class.js', metodo: 'contraOferta'},{mensagem_padrao: 'Erro ao realizar contra oferta: '+erro});
        deferred.reject('[300043]'+getErrorMessage('ErroContraOferta')+': '+erro);
    });
    return deferred.promise();
}

function encerrarFrete(data){
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes/encerrar',data,true).done(function(res){
        if(res.sucesso){     
            deferred.resolve(res);  
        } else {
            deferred.reject(res.erro);
        }
        
    }).fail(function(erro){
        ErrorClass.parseError('API','300044', { classe: 'postdata.class.js', metodo: 'encerrarFrete'},{mensagem_padrao: 'Erro ao encerrar ferte: '+erro});
        deferred.reject('[300044]'+getErrorMessage('ErroEncerrarFrete')+': '+erro);
    });
    return deferred.promise();
}

function avaliarFrete(data){
    var deferred = $.Deferred();
    control.rest.makeLoggedRequest('/fretes/avaliar_embarcador',data,true).done(function(res){
        if(res.sucesso){     
            deferred.resolve(res);  
        } else {
            deferred.reject(res.erro);
        }
        
    }).fail(function(erro){
        ErrorClass.parseError('API','300045', { classe: 'postdata.class.js', metodo: 'avaliarFrete'},{mensagem_padrao: 'Erro ao avaliar o ferte: '+erro});
        deferred.reject('[300045]'+getErrorMessage('ErroAvaliarFrete')+': '+erro);
    });
    return deferred.promise();
}

function incluirCheckin(data, block){
    var deferred = $.Deferred();
    block = (typeof block == "undefined" ? true : block);
    control.rest.makeLoggedRequest('/checkin/incluir',data,block).done(function(res){
        if(res.sucesso){     
            deferred.resolve(res);  
        } else {
            deferred.reject(res.erro);
        }
        
    }).fail(function(erro){
        ErrorClass.parseError('API','300046', { classe: 'postdata.class.js', metodo: 'incluirCheckin'},{mensagem_padrao: 'Erro ao registrar localização: '+erro});
        deferred.reject('[300046]'+getErrorMessage('ErroRegistrarLocalizacao')+': '+erro);
    });
    return deferred.promise();
}

function getEmpresas(filtros, offset, limit) {
    var deferred = $.Deferred();
    var param = {
        codigo_cidade: filtros.cidade,
        codigo_estado: filtros.estado,
        categoria: filtros.categoria,
        raio: filtros.raio,
        nome: filtros.nome
    }
    control.rest.makeLoggedRequest('/clientes_app/'+offset+'/'+limit, param, false, null, {aplicativo: 'mundofrete'}).done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
        ErrorClass.parseError('API','300047', { classe: 'postdata.class.js', metodo: 'getEmpresas'},{mensagem_padrao: 'Erro ao buscar empresas: '+erro});
        deferred.reject('[300047]Erro ao buscar Empresas: '+erro);
    });

    return deferred.promise();
}

function getTotalEmpresas(filtros) {
    var deferred = $.Deferred();
    var param = {
        codigo_cidade: filtros.cidade,
        codigo_estado: filtros.estado,
        categoria: filtros.categoria,
        raio: filtros.raio,
        nome: filtros.nome
    }
    control.rest.makeLoggedRequest('/clientes_app/total', param, false, null, {aplicativo: 'mundofrete'}).done(function(res){
        deferred.resolve(res.qtde);
    }).fail(function(erro){
        ErrorClass.parseError('API','300048', { classe: 'postdata.class.js', metodo: 'getTotalEmpresas'},{mensagem_padrao: 'Erro ao buscar empresas: '+erro});
        deferred.reject('[300048]Erro ao buscar Empresas: '+erro);
    });

    return deferred.promise();
}

function getEmpresasReqAgregados(tipo_veiculo, filtros, page, limit) {
    var deferred = $.Deferred();

    var param = {
        codigo_cidade: filtros.cidade,
        codigo_estado: filtros.estado
    }

    control.rest.makeLoggedRequest('/clientes_app/requisicoes_por_tipo_veiculo/'+tipo_veiculo+'/'+page+'/'+limit, param, false, null, {aplicativo: 'mundofrete'}).done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
        ErrorClass.parseError('API','300049', { classe: 'postdata.class.js', metodo: 'getEmpresasReqAgregados'},{mensagem_padrao: 'Erro ao buscar empresas que buscam agregados: '+erro});
        deferred.reject('[300049]Erro ao buscar Empresas que buscam agregados: '+erro);
    });

    return deferred.promise();
}

function getTotalEmpresasReqAgregados(tipo_veiculo, filtros) {
    var deferred = $.Deferred();

    var param = {
        codigo_cidade: filtros.cidade,
        codigo_estado: filtros.estado
    }

    control.rest.makeLoggedRequest('/clientes_app/total_cliente_requisicoes/'+tipo_veiculo, param, false, null, {aplicativo: 'mundofrete'}).done(function(res){
        deferred.resolve(res);
    }).fail(function(erro){
        ErrorClass.parseError('API','300050', { classe: 'postdata.class.js', metodo: 'getTotalEmpresasReqAgregados'},{mensagem_padrao: 'Erro ao buscar empresas que buscam agregados: '+erro});
        deferred.reject('[300050]Erro ao buscar Empresas que buscam agregados: '+erro);
    });

    return deferred.promise();
}

function getComandos(codigo_sm, tecnologia, versao) {
    var deferred = $.Deferred();

    var param = {
        tecnologia: tecnologia,
        versao_tec: versao
    };

    control.rest.makeLoggedRequest('/viagem/'+codigo_sm+'/mensagens_recebidas/mobile/', param, false, null).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res.mensagens);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro){
        ErrorClass.parseError('API','300066', { classe: 'postdata.class.js', metodo: 'getComandos'},{mensagem_padrao: 'Erro ao buscar Comandos da Viagem: '+erro});
        deferred.reject('[300066]Erro ao buscar Comandos da Viagem: '+erro);
    });

    return deferred.promise();
}

function getMensagens(codigo_sm, tecnologia, versao) {
    var deferred = $.Deferred();

    var param = {
        tecnologia: tecnologia,
        versao_tec: versao
    };

    control.rest.makeLoggedRequest('/viagem/'+codigo_sm+'/mensagens/mobile/', param, false, null).done(function(res){
        if (res.sucesso) {
            deferred.resolve(res.mensagens);
        } else {
            console.log(res.erro);
            if (res.erro == 'Mensagens não Informadas') {
                deferred.resolve([]);
            } else {
                deferred.reject(res.erro);
            }
        }
    }).fail(function(erro){
        ErrorClass.parseError('API','300064', { classe: 'postdata.class.js', metodo: 'getMensagens'},{mensagem_padrao: 'Erro ao buscar Mensagens de Viagem: '+erro});
        deferred.reject('[300064]Erro ao buscar Mensagens de Viagem: '+erro);
    });

    return deferred.promise();
}

function marcarMensagensRecebidas(mensagens) {
    var deferred = $.Deferred();

    var param = {
        mensagens: mensagens
    };

    control.rest.makeLoggedRequest('/mensagens/recebidas/', param, false, null).done(function(res){
        if (res.sucesso) {
            deferred.resolve(true);
        } else {
            deferred.reject(res.erro);
        }
    }).fail(function(erro){
        ErrorClass.parseError('API','300065', { classe: 'postdata.class.js', metodo: 'marcarMensagensRecebidas'},{mensagem_padrao: 'Erro ao atualizar mensagens como recebidas: '+erro});
        deferred.reject('[3000645]Erro ao atualizar mensagens como recebidas: '+erro);
    });

    return deferred.promise();
}
