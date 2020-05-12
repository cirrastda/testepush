{
    mask: {
        cnpj            : '##.###.###-#',
        //cpf             : '##.###.###-A',
        cpfcnpj         : '##.###.###-#',
        tel             : '000000000',
        datetime        : '##/##/#### ##:##:##',
        date            : '##/##/####',
        time            : '##:##:##',
        carplate        : ['AA-AA-##','AA-##-##', 'AAA-#A##', 'AA-###'],
        somente_numero  : '#################',
        codigo_cliente  : '######',
        cep             : '### ####',
        cnh             : '########-#',
        rg              : '00.000.000-0'
    },
    filters:{
        cpf     : [
          {
            pattern     : /(\d{1})(\d{3})(\d{3})([0-9kK]{1})/g,
            mask         : "\$1.\$2.\$3\-\$4"
          },
          {
            pattern     : /(\d{2})(\d{3})(\d{3})([0-9kK]{1})/g,
            mask         : "\$1.\$2.\$3\-\$4"
          }
        ],
        rg     : {
            pattern     : /(\d{2})(\d{3})(\d{3})(\d{1})/g,
            mask         : "\$1.\$2.\$3\-\$4"
        },
        cnpj : {
            pattern     : /(\d{2})(\d{3})(\d{3})(\d{1})/g,
            mask         : "\$1.\$2.\$3\-\$4"
       },
       tel : {
           pattern        : /(\d{9})/g,
           mask        : "\$1"
       },
       cep: {
            pattern     : /(\d{3})(\d{4})/g,
            mask        : "\$1 \$2"
       },
       carplate: [
          {
             pattern        :  /([a-zA-Z]{2})-?([a-zA-Z]{2})-?(\d{2})/gim,
             mask        : "\$1-\$2-\$3"
          },
          {
             pattern        :  /([a-zA-Z]{2})-?(\d{2})-?(\d{2})/gim,
             mask        : "\$1-\$2-\$3"
          },
          {
             pattern        :  /([a-zA-Z]{3})-?(\d{1})([a-zA-Z]{1})(\d{2})/gim,
             mask        : "\$1-\$2\$3\$4"
          },
          {
             pattern        :  /([a-zA-Z]{2})-?(\d{3})/gim,
             mask        : "\$1-\$2"
          },
       ]

    },
    validationFunctions: {
        cpf: 'checkRut',
        cep: 'validarCpChile',
        cnh: 'validarCNHChile',
        celular: 'validarCelularChile',
        rg: 'checkRut'
    },
    others: {
      adressByCEP: false,
    }
}