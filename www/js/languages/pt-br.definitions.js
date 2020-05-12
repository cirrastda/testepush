{
    mask: {
        cnpj             : '##.###.###/####-##',
        cpf             : '###.###.###-##',
        cpfcnpj            : ['###.###.###-##','##.###.###/####-##'],
        tel             : ['(00) 0000-00009', '(00) 00000-0000'],
        datetime         : '##/##/#### ##:##:##',
        date             : '##/##/####',
        time             : '##:##:##',
        carplate         : ['AAA-####', 'AAA-#A##'],
        somente_numero  : '#################',
        codigo_cliente  : '######',
        cep              : '#####-###',
        cnh             : '###########',
        rg               : '99.990.000-0'

    },
    filters:{
        cpf     : {
            pattern     : /(\d{3})(\d{3})(\d{3})(\d{2})/g,
            mask         : "\$1.\$2.\$3\-\$4"
        },
        cnpj : {
           pattern        : /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/g,
           mask        : "\$1.\$2.\$3\/\$4\-\$5"
       },
       tel : [
           {
               pattern        : /(\d{2})(\d{4})(\d{4})/g,
               mask        : "\(\$1\) \$2\-\$3"
           },
           {
               pattern        : /(\d{2})(\d{5})(\d{4})/g,
               mask        : "\(\$1\) \$2\-\$3"
           },
       ],
       cep: {
            pattern     : /(\d{5})(\d{3})/g,
            mask        : "\$1-\$2"
       },
       carplate: [
          {
             pattern        :  /([a-zA-Z]{3})-?(\d{4})/gim,
             mask        : "\$1-\$2"
          },
          {
             pattern        :  /([a-zA-Z]{3})-?(\d{1})([a-zA-Z]{1})(\d{2})/gim,
             mask        : "\$1-\$2\$3\$4"
          },
       ]

    },
    validationFunctions: {
        cpf: 'validarCPF',
        cep: 'validarCep',
        cnh: 'validarCNH',
        celular: 'validarCelular',
    },
    others: {
      adressByCEP: true,
    },
}