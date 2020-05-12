var DetalhesEmpresaClass = function(){
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
		myApp.onPageInit('detalhes-empresa', function(page, context) {
            var pageContainer = $(page.container);
            var fm = pageContainer.find('form');
			me.$$ = Dom7;
			me.data = page.context;
			var show_toolbar = false;
			var show_phone = false;
			if (me.data!=undefined) {
				var ddi = get_ddi(getLocalValue('codigo_pais'));
				if (me.data.telefone!='') {
					$('#btnPhone').show();
					var telefone = so_numeros(me.data.telefone);
					$('#btnPhone').attr('href','tel:+'+ddi+telefone);
					show_toolbar = true;
					show_phone = true;
				} else if (me.data.celular!='') {
					$('#btnPhone').show();
					var celular = so_numeros(me.data.celular);
					$('#btnPhone').attr('href','tel:+'+ddi+celular);
					show_toolbar = true;
					show_phone = true;
				} 

				if (me.data.email!='') {
					$('#btnEmail').show();
					$('#btnEmail').attr('href','mailto:'+me.data.email);
					if (show_phone) {
						$('#btnPhone').addClass('border-right-tab');
					}
					show_toolbar = true;
				} 
			}

			if (!show_toolbar) {
				$('.toolbar').hide();
			}


		});
	}

}