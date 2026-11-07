// Roteiro das evidências. Cada passo é uma requisição real com o status esperado,
// ou uma ação: parar/iniciar um serviço, ou um extra tratado em gerar-evidencias.js.
const P = "http://localhost:4001";
const END = "http://localhost:4002";
const USU = "http://localhost:4003";
const TAR = "http://localhost:4004";
const CLI = "http://localhost:4005";
const POK = "http://localhost:4006";
const PED = "http://localhost:4007";
const GW = "http://localhost:4000";

const pedido = (cliente, ...itens) => ({
  cliente,
  itens: itens.map(([produtoId, quantidade]) => ({ produtoId, quantidade })),
});

module.exports = [
  {
    numero: 1,
    modulo: "Fundamentos",
    titulo: "Primeiro microsserviço",
    entrega: "Captura do endpoint funcionando.",
    passos: [{ metodo: "GET", url: `${P}/status`, esperado: 200 }],
  },
  {
    numero: 2,
    modulo: "Fundamentos",
    titulo: "Rotas e métodos HTTP",
    entrega: "Capturas das duas rotas e do erro 404.",
    passos: [
      { metodo: "GET", url: `${P}/produtos`, esperado: 200 },
      { metodo: "GET", url: `${P}/produtos/1`, esperado: 200 },
      { metodo: "GET", url: `${P}/produtos/999`, esperado: 404 },
    ],
  },
  {
    numero: 3,
    modulo: "Fundamentos",
    titulo: "Parâmetros e consultas",
    entrega: "Requisições demonstrando filtros válidos e inválidos.",
    passos: [
      { metodo: "GET", url: `${P}/produtos?categoria=perifericos`, esperado: 200 },
      { metodo: "GET", url: `${P}/produtos?categoria=informatica&limite=1`, esperado: 200 },
      { metodo: "GET", url: `${P}/produtos?categoria=inexistente`, esperado: 400 },
      { metodo: "GET", url: `${P}/produtos?limite=0`, esperado: 400 },
      { metodo: "GET", url: `${P}/produtos?limite=abc`, esperado: 400 },
    ],
  },
  {
    numero: 4,
    modulo: "Fundamentos",
    titulo: "Validação de JSON",
    entrega: "Não informada no roteiro; demonstrados os retornos 201 e 400.",
    passos: [
      {
        metodo: "POST",
        url: `${P}/produtos`,
        corpo: { nome: "Headset", preco: 189.9 },
        esperado: 201,
      },
      { metodo: "POST", url: `${P}/produtos`, corpo: { nome: "Headset" }, esperado: 400 },
      {
        metodo: "POST",
        url: `${P}/produtos`,
        corpo: { nome: "Headset", preco: -5 },
        esperado: 400,
      },
      { metodo: "POST", url: `${P}/produtos`, corpoBruto: '{"nome": "Headset"', esperado: 400 },
    ],
  },
  {
    numero: 5,
    modulo: "APIs públicas",
    titulo: "Primeira consulta externa",
    entrega: "Endpoint local e exemplo da resposta.",
    passos: [{ metodo: "GET", url: `${USU}/usuarios`, esperado: 200 }],
  },
  {
    numero: 6,
    modulo: "APIs públicas",
    titulo: "Detalhes de usuário",
    entrega: "Testes de ID válido e inexistente.",
    passos: [
      { metodo: "GET", url: `${USU}/usuarios/1`, esperado: 200 },
      { metodo: "GET", url: `${USU}/usuarios/999`, esperado: 404 },
      { metodo: "GET", url: `${USU}/usuarios/abc`, esperado: 400 },
    ],
  },
  {
    numero: 7,
    modulo: "APIs públicas",
    titulo: "Consulta de CEP",
    entrega: "Respostas 200, 400 e 404.",
    passos: [
      { metodo: "GET", url: `${END}/enderecos/01001000`, esperado: 200 },
      { metodo: "GET", url: `${END}/enderecos/123`, esperado: 400 },
      { metodo: "GET", url: `${END}/enderecos/99999999`, esperado: 404 },
    ],
  },
  {
    numero: 8,
    modulo: "APIs públicas",
    titulo: "Tarefas remotas",
    entrega: "Requisições com e sem filtro.",
    passos: [
      { metodo: "GET", url: `${TAR}/tarefas`, esperado: 200 },
      { metodo: "GET", url: `${TAR}/tarefas?usuario=1`, esperado: 200 },
      { metodo: "GET", url: `${TAR}/tarefas?usuario=abc`, esperado: 400 },
    ],
  },
  {
    numero: 9,
    modulo: "APIs públicas",
    titulo: "Dados meteorológicos",
    entrega: "Captura com coordenadas válidas e inválidas.",
    passos: [
      { metodo: "GET", url: `${CLI}/clima?latitude=-23.55&longitude=-46.63`, esperado: 200 },
      { metodo: "GET", url: `${CLI}/clima?latitude=100&longitude=-46.63`, esperado: 400 },
      { metodo: "GET", url: `${CLI}/clima?latitude=abc`, esperado: 400 },
    ],
  },
  {
    numero: 10,
    modulo: "APIs públicas",
    titulo: "Catálogo de personagens",
    entrega: "Exemplos de personagem existente e inexistente.",
    passos: [
      { metodo: "GET", url: `${POK}/pokemon/25`, esperado: 200 },
      { metodo: "GET", url: `${POK}/pokemon/99999`, esperado: 404 },
    ],
  },
  {
    numero: 11,
    modulo: "CRUD",
    titulo: "Cadastro local",
    entrega: "Demonstração de criação e listagem.",
    passos: [
      {
        metodo: "POST",
        url: `${P}/produtos`,
        corpo: { nome: "Webcam Full HD", preco: 299.9, categoria: "perifericos" },
        esperado: 201,
      },
      { metodo: "GET", url: `${P}/produtos?categoria=perifericos`, esperado: 200 },
    ],
  },
  {
    numero: 12,
    modulo: "CRUD",
    titulo: "Atualização e remoção",
    entrega: "Testes antes e depois das alterações.",
    passos: [
      { nota: "Antes da atualização" },
      { metodo: "GET", url: `${P}/produtos/7`, esperado: 200 },
      {
        metodo: "PUT",
        url: `${P}/produtos/7`,
        corpo: { nome: "Webcam 4K", preco: 549.9, categoria: "perifericos" },
        esperado: 200,
      },
      { nota: "Depois da atualização" },
      { metodo: "GET", url: `${P}/produtos/7`, esperado: 200 },
      { metodo: "DELETE", url: `${P}/produtos/7`, esperado: 204 },
      { nota: "Depois da remoção" },
      { metodo: "GET", url: `${P}/produtos/7`, esperado: 404 },
      { metodo: "DELETE", url: `${P}/produtos/7`, esperado: 404 },
    ],
  },
  {
    numero: 13,
    modulo: "CRUD",
    titulo: "Separação de serviços",
    entrega: "Captura dos dois serviços ativos e estrutura do projeto.",
    passos: [
      { metodo: "GET", url: `${P}/status`, esperado: 200 },
      { metodo: "GET", url: `${PED}/status`, esperado: 200 },
      { extra: "estrutura" },
    ],
  },
  {
    numero: 14,
    modulo: "Integração",
    titulo: "Gateway de API",
    entrega: "Requisições aos dois serviços por uma única porta.",
    passos: [
      { metodo: "GET", url: `${GW}/api/produtos?limite=2`, esperado: 200 },
      { metodo: "GET", url: `${GW}/api/produtos/999`, esperado: 404 },
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: pedido("Ana Souza", [2, 1]),
        esperado: 201,
      },
      { metodo: "GET", url: `${GW}/api/pedidos/1`, esperado: 200 },
      { metodo: "GET", url: `${GW}/api/pedidos/999`, esperado: 404 },
    ],
  },
  {
    numero: 15,
    modulo: "Integração",
    titulo: "Timeout e indisponibilidade",
    entrega: "Teste demonstrando a falha controlada.",
    passos: [
      { acao: "parar", pasta: "servico-produtos" },
      { nota: "Queda: o processo do serviço de produtos foi encerrado" },
      {
        metodo: "POST",
        url: `${PED}/pedidos`,
        corpo: pedido("Bruno Lima", [1, 1]),
        esperado: 503,
      },
      { metodo: "GET", url: `${GW}/api/produtos`, esperado: 503 },
      { acao: "iniciar", pasta: "servico-produtos" },
      { nota: "Recuperação: o serviço foi iniciado de novo e o pedido é aceito" },
      {
        metodo: "POST",
        url: `${PED}/pedidos`,
        corpo: pedido("Bruno Lima", [1, 1]),
        esperado: 201,
      },
      { extra: "timeout" },
    ],
  },
  {
    numero: 16,
    modulo: "Integração",
    titulo: "Persistência de pedidos",
    entrega: "Pedido recuperado depois de reiniciar o processo.",
    passos: [
      {
        metodo: "POST",
        url: `${PED}/pedidos`,
        corpo: pedido("Carla Dias", [5, 2]),
        esperado: 201,
      },
      { acao: "parar", pasta: "servico-pedidos" },
      { acao: "iniciar", pasta: "servico-pedidos" },
      { nota: "O processo foi encerrado e iniciado de novo" },
      { metodo: "GET", url: `${PED}/pedidos/3`, esperado: 200 },
    ],
  },
  {
    numero: 17,
    modulo: "Qualidade",
    titulo: "Configuração segura",
    entrega: "README com instruções e configuração de exemplo.",
    passos: [{ extra: "configuracao" }],
  },
  {
    numero: 18,
    modulo: "Qualidade",
    titulo: "Testes de integração",
    entrega: "Execução dos testes e relatório de resultados.",
    passos: [{ extra: "testes" }],
  },
  {
    numero: 19,
    modulo: "Qualidade",
    titulo: "Logs e observabilidade",
    entrega: "Logs de uma chamada bem-sucedida e de uma falha.",
    passos: [
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: pedido("Davi Rocha", [3, 1]),
        cabecalhos: { "x-request-id": "demo-sucesso" },
        esperado: 201,
      },
      { extra: "logs", requestId: "demo-sucesso", titulo: "Logs da chamada bem-sucedida" },
      { acao: "parar", pasta: "servico-produtos" },
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: pedido("Davi Rocha", [3, 1]),
        cabecalhos: { "x-request-id": "demo-falha" },
        esperado: 503,
      },
      { extra: "logs", requestId: "demo-falha", titulo: "Logs da falha" },
      { acao: "iniciar", pasta: "servico-produtos" },
    ],
  },
  {
    numero: 20,
    modulo: "Projeto final",
    titulo: "Gestão de pedidos integrada",
    entrega: "Demonstração ponta a ponta, testes e repositório documentado.",
    passos: [
      { nota: "Consulta do catálogo e criação do pedido por uma única porta" },
      { metodo: "GET", url: `${GW}/api/produtos?limite=3`, esperado: 200 },
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: pedido("Maria Oliveira", [1, 1], [3, 2]),
        esperado: 201,
      },
      { metodo: "GET", url: `${GW}/api/pedidos/5`, esperado: 200 },
      { nota: "Validações" },
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: { cliente: "", itens: [{ produtoId: 1, quantidade: 0 }] },
        esperado: 400,
      },
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: pedido("Maria Oliveira", [1, 1], [999, 1]),
        esperado: 422,
      },
      { nota: "Indisponibilidade do serviço de produtos" },
      { acao: "parar", pasta: "servico-produtos" },
      {
        metodo: "POST",
        url: `${GW}/api/pedidos`,
        corpo: pedido("Maria Oliveira", [1, 1]),
        esperado: 503,
      },
      { acao: "iniciar", pasta: "servico-produtos" },
      { extra: "testes" },
    ],
  },
];
