var avaliarFreteClass = function(){

	this.page 	  		= null;
	this.dados_frete	= null;



	this.init = function(dados_frete){
		if (dados_frete==null || dados_frete==undefined) dados_frete = [];
		var deferred = $.Deferred();
		//console.log('init');
		//this.setupPushNotification();
		this.dados_frete = dados_frete;
		this.loadRating();

		deferred.resolve();

		return deferred.promise();
	}

	this.loadRating = function() {
		jQuery(function($) {
			$('.score').star_rating({
		  	// Add some functionality for when a star is clicked
		  		click: function(clicked_rating, event) {
		    		event.preventDefault();
		    		this.rating(clicked_rating);
		    		$('#score').val(clicked_rating);
				}
			});
		});
	}

	this.loadModal = function(frete, encerrar) {
		this.dados_frete = frete;
		
		var msg_extra = (encerrar ? "<br/><small>Confirmando a nota, o frete será encerrado.</small>" : "");
		var title = (encerrar ? "Encerrar Frete" : "Avaliar Frete");

		var deferred = $.Deferred();
		var me = this;

		Dom7.get('avaliar.html', frete, function (data) {
			var compiled = Template7.compile(data);
			var html = compiled(frete);	
			var template = html;
			//var template = $(html).find('#tplavaliar').html();
			var modal = myApp.modal({
				title: title,
				text: 'Por favor, avalie o contratante do frete:'+msg_extra,
				afterText: template,
				buttons: [
					{
						text: 'Cancelar',
					},
					{
						text: 'Confirmar',
						bold: true,
						close: false,
						onClick: function(obj) {

							frete.score = $('#score').val();
							if (isNaN(frete.score) || frete.score <=0 || frete.score > 5) {
								var msg = "Por favor, informe um Score";
								myApp.closeModal();
								myApp.alert(msg, title,function () {
									deferred.reject(msg);
								});
							} else {
								deferred.resolve(frete);
							}
						}
					},
				]
			});
			me.loadRating();
		});

		return deferred.promise();
	}



	this.checkRating = function() {


		var resposta = $("#resposta").val();

		var questao = this.question_data;
		var model = questao.data_model;
		var field = questao.data_field;


		eval("var valor = this.dados."+model+"."+field+";");
		switch (questao.data_type) {
			case "piece":
				var separador = questao.data_separator;
				var arrDados = valor.split(separador);
				if (arrDados.constructor === Array) {
					valor = arrDados[0];
				}
				break;
			case "datetime":
				var formato_entrada = questao.data_entry_format;
				var formato_saida = questao.data_format;
				if (formato_saida=="dmy") {
					var arrData = valor.split(" ");
					if (arrData.constructor === Array) {
						valor = arrData[0];
					}
				}
				break;
		}
		console.log($.trim(resposta.toUpperCase()));
		console.log($.trim(valor.toUpperCase()));
		return ($.trim(resposta.toUpperCase())==$.trim(valor.toUpperCase()));
	}



};
