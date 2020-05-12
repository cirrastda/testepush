var DetalhesRequisicaoClass = function(){
	this.page = null;
	this.data = null;
	this.$$ = null;
	this.init = function(){
		var deferred = $.Deferred();

		this.setupView();

		deferred.resolve();

		return deferred.promise();
	}

	this.setupView = function(){
		var me = this;
		myApp.onPageInit('detalhes-requisicao', function(page, context) {
            var pageContainer = $(page.container);
            var fm = pageContainer.find('form');
			me.$$ = Dom7;
			me.data = page.context;
			console.log("Testando");
			console.log(me.data);
			var possuiContato = false;
			if(me.data.contato != undefined) {
				var ddi = get_ddi(getLocalValue('codigo_pais'));

				if (me.data.contato.telefone!='') {
					$('#btnPhone').show();
					var telefone = so_numeros(me.data.contato.telefone);
					
					$('#btnPhone').attr('href','tel:+'+ddi+telefone);
					possuiContato = true;
				} else if (me.data.contato.celular!='') {
					$('#btnPhone').show();
					var celular = so_numeros(me.data.contato.celular);
					$('#btnPhone').attr('href','tel:+'+ddi+celular);
					possuiContato = true;
				} 

				if(!possuiContato) {
					$('#btnPhone').removeClass('border-right-tab');
				}

				if (me.data.contato.email!='') {
					$('#btnEmail').show();
					$('#btnEmail').attr('href','mailto:'+me.data.contato.email);
					possuiContato = true;
				}
				
				if(!possuiContato) {
					$('.toolbar').hide();	
					$('#page-detalhe').css('height', '100%');
				}
			}
		});
	}

}