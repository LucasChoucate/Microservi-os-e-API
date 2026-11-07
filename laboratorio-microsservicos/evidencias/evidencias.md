# Evidências das 20 atividades

Requisições reais executadas por `npm run evidencias` em 06/11/2026, 19:00:37. Cada status foi conferido com o esperado.

## Atividade 1: Primeiro microsserviço

**Módulo:** Fundamentos  
**Entrega:** Captura do endpoint funcionando.  
**Captura:** [atividade-01.png](capturas/atividade-01.png)

`GET http://localhost:4001/status` → **200** (3 ms)

```json
{
  "servico": "servico-produtos",
  "versao": "1.0.0",
  "status": "ok"
}
```

---

## Atividade 2: Rotas e métodos HTTP

**Módulo:** Fundamentos  
**Entrega:** Capturas das duas rotas e do erro 404.  
**Captura:** [atividade-02.png](capturas/atividade-02.png)

`GET http://localhost:4001/produtos` → **200** (3 ms)

```json
{
  "total": 5,
  "produtos": [
    {
      "id": 1,
      "nome": "Notebook",
      "preco": 3500,
      "categoria": "informatica"
    },
    {
      "id": 2,
      "nome": "Monitor 24 polegadas",
      "preco": 899.9,
      "categoria": "informatica"
    },
    {
      "id": 3,
      "nome": "Teclado mecânico",
      "preco": 249.9,
      "categoria": "perifericos"
    },
    {
      "id": 4,
      "nome": "Mouse sem fio",
      "preco": 119.5,
      "categoria": "perifericos"
    },
    {
... (7 linhas omitidas nesta captura)
```

`GET http://localhost:4001/produtos/1` → **200** (1 ms)

```json
{
  "id": 1,
  "nome": "Notebook",
  "preco": 3500,
  "categoria": "informatica"
}
```

`GET http://localhost:4001/produtos/999` → **404** (1 ms)

```json
{
  "erro": "Produto não encontrado"
}
```

---

## Atividade 3: Parâmetros e consultas

**Módulo:** Fundamentos  
**Entrega:** Requisições demonstrando filtros válidos e inválidos.  
**Captura:** [atividade-03.png](capturas/atividade-03.png)

`GET http://localhost:4001/produtos?categoria=perifericos` → **200** (2 ms)

```json
{
  "total": 2,
  "produtos": [
    {
      "id": 3,
      "nome": "Teclado mecânico",
      "preco": 249.9,
      "categoria": "perifericos"
    },
    {
      "id": 4,
      "nome": "Mouse sem fio",
      "preco": 119.5,
      "categoria": "perifericos"
    }
  ]
}
```

`GET http://localhost:4001/produtos?categoria=informatica&limite=1` → **200** (1 ms)

```json
{
  "total": 1,
  "produtos": [
    {
      "id": 1,
      "nome": "Notebook",
      "preco": 3500,
      "categoria": "informatica"
    }
  ]
}
```

`GET http://localhost:4001/produtos?categoria=inexistente` → **400** (0 ms)

```json
{
  "erro": "Categoria inválida",
  "categoriasValidas": [
    "informatica",
    "perifericos",
    "moveis",
    "geral"
  ]
}
```

`GET http://localhost:4001/produtos?limite=0` → **400** (1 ms)

```json
{
  "erro": "limite deve ser um inteiro entre 1 e 100"
}
```

`GET http://localhost:4001/produtos?limite=abc` → **400** (1 ms)

```json
{
  "erro": "limite deve ser um inteiro entre 1 e 100"
}
```

---

## Atividade 4: Validação de JSON

**Módulo:** Fundamentos  
**Entrega:** Não informada no roteiro; demonstrados os retornos 201 e 400.  
**Captura:** [atividade-04.png](capturas/atividade-04.png)

`POST http://localhost:4001/produtos` → **201** (18 ms)

Corpo enviado:

```json
{
  "nome": "Headset",
  "preco": 189.9
}
```

```json
{
  "id": 6,
  "nome": "Headset",
  "preco": 189.9,
  "categoria": "geral"
}
```

`POST http://localhost:4001/produtos` → **400** (1 ms)

Corpo enviado:

```json
{
  "nome": "Headset"
}
```

```json
{
  "erros": [
    "preco é obrigatório e deve ser um número maior que zero"
  ]
}
```

`POST http://localhost:4001/produtos` → **400** (1 ms)

Corpo enviado:

```json
{
  "nome": "Headset",
  "preco": -5
}
```

```json
{
  "erros": [
    "preco é obrigatório e deve ser um número maior que zero"
  ]
}
```

`POST http://localhost:4001/produtos` → **400** (1 ms)

Corpo enviado:

```json
{"nome": "Headset"
```

```json
{
  "erro": "JSON inválido"
}
```

---

## Atividade 5: Primeira consulta externa

**Módulo:** APIs públicas  
**Entrega:** Endpoint local e exemplo da resposta.  
**Captura:** [atividade-05.png](capturas/atividade-05.png)

`GET http://localhost:4003/usuarios` → **200** (143 ms)

```json
{
  "total": 10,
  "usuarios": [
    {
      "id": 1,
      "nome": "Leanne Graham",
      "email": "Sincere@april.biz",
      "cidade": "Gwenborough"
    },
    {
      "id": 2,
      "nome": "Ervin Howell",
      "email": "Shanna@melissa.tv",
      "cidade": "Wisokyburgh"
    },
    {
      "id": 3,
      "nome": "Clementine Bauch",
      "email": "Nathan@yesenia.net",
      "cidade": "McKenziehaven"
    },
    {
      "id": 4,
      "nome": "Patricia Lebsack",
      "email": "Julianne.OConner@kory.org",
      "cidade": "South Elvis"
    },
    {
... (37 linhas omitidas nesta captura)
```

---

## Atividade 6: Detalhes de usuário

**Módulo:** APIs públicas  
**Entrega:** Testes de ID válido e inexistente.  
**Captura:** [atividade-06.png](capturas/atividade-06.png)

`GET http://localhost:4003/usuarios/1` → **200** (38 ms)

```json
{
  "id": 1,
  "nome": "Leanne Graham",
  "usuario": "Bret",
  "email": "Sincere@april.biz",
  "telefone": "1-770-736-8031 x56442",
  "site": "hildegard.org",
  "cidade": "Gwenborough",
  "empresa": "Romaguera-Crona"
}
```

`GET http://localhost:4003/usuarios/999` → **404** (35 ms)

```json
{
  "erro": "Usuário não encontrado"
}
```

`GET http://localhost:4003/usuarios/abc` → **400** (1 ms)

```json
{
  "erro": "O id deve ser um inteiro positivo"
}
```

---

## Atividade 7: Consulta de CEP

**Módulo:** APIs públicas  
**Entrega:** Respostas 200, 400 e 404.  
**Captura:** [atividade-07.png](capturas/atividade-07.png)

`GET http://localhost:4002/enderecos/01001000` → **200** (456 ms)

```json
{
  "cep": "01001-000",
  "logradouro": "Praça da Sé",
  "bairro": "Sé",
  "cidade": "São Paulo",
  "uf": "SP"
}
```

`GET http://localhost:4002/enderecos/123` → **400** (2 ms)

```json
{
  "erro": "CEP deve conter 8 dígitos"
}
```

`GET http://localhost:4002/enderecos/99999999` → **404** (151 ms)

```json
{
  "erro": "CEP não encontrado"
}
```

---

## Atividade 8: Tarefas remotas

**Módulo:** APIs públicas  
**Entrega:** Requisições com e sem filtro.  
**Captura:** [atividade-08.png](capturas/atividade-08.png)

`GET http://localhost:4004/tarefas` → **200** (180 ms)

```json
{
  "total": 200,
  "tarefas": [
    {
      "id": 1,
      "usuarioId": 1,
      "titulo": "delectus aut autem",
      "concluida": false
    },
    {
      "id": 2,
      "usuarioId": 1,
      "titulo": "quis ut nam facilis et officia qui",
      "concluida": false
    },
    {
      "id": 3,
      "usuarioId": 1,
      "titulo": "fugiat veniam minus",
      "concluida": false
    },
    {
      "id": 4,
      "usuarioId": 1,
      "titulo": "et porro tempora",
      "concluida": true
    },
    {
... (1177 linhas omitidas nesta captura)
```

`GET http://localhost:4004/tarefas?usuario=1` → **200** (42 ms)

```json
{
  "total": 20,
  "tarefas": [
    {
      "id": 1,
      "usuarioId": 1,
      "titulo": "delectus aut autem",
      "concluida": false
    },
    {
      "id": 2,
      "usuarioId": 1,
      "titulo": "quis ut nam facilis et officia qui",
      "concluida": false
    },
    {
      "id": 3,
      "usuarioId": 1,
      "titulo": "fugiat veniam minus",
      "concluida": false
    },
    {
      "id": 4,
      "usuarioId": 1,
      "titulo": "et porro tempora",
      "concluida": true
    },
    {
... (97 linhas omitidas nesta captura)
```

`GET http://localhost:4004/tarefas?usuario=abc` → **400** (1 ms)

```json
{
  "erro": "usuario deve ser um inteiro positivo"
}
```

---

## Atividade 9: Dados meteorológicos

**Módulo:** APIs públicas  
**Entrega:** Captura com coordenadas válidas e inválidas.  
**Captura:** [atividade-09.png](capturas/atividade-09.png)

`GET http://localhost:4005/clima?latitude=-23.55&longitude=-46.63` → **200** (785 ms)

```json
{
  "latitude": -23.55,
  "longitude": -46.63,
  "horario": "2026-11-06T22:00",
  "temperaturaC": 22,
  "precipitacaoMm": 0
}
```

`GET http://localhost:4005/clima?latitude=100&longitude=-46.63` → **400** (1 ms)

```json
{
  "erro": "Informe latitude entre -90 e 90 e longitude entre -180 e 180"
}
```

`GET http://localhost:4005/clima?latitude=abc` → **400** (1 ms)

```json
{
  "erro": "Informe latitude entre -90 e 90 e longitude entre -180 e 180"
}
```

---

## Atividade 10: Catálogo de personagens

**Módulo:** APIs públicas  
**Entrega:** Exemplos de personagem existente e inexistente.  
**Captura:** [atividade-10.png](capturas/atividade-10.png)

`GET http://localhost:4006/pokemon/25` → **200** (195 ms)

```json
{
  "id": 25,
  "nome": "pikachu",
  "tipos": [
    "electric"
  ],
  "habilidades": [
    "static",
    "lightning-rod"
  ]
}
```

`GET http://localhost:4006/pokemon/99999` → **404** (41 ms)

```json
{
  "erro": "Personagem não encontrado"
}
```

---

## Atividade 11: Cadastro local

**Módulo:** CRUD  
**Entrega:** Demonstração de criação e listagem.  
**Captura:** [atividade-11.png](capturas/atividade-11.png)

`POST http://localhost:4001/produtos` → **201** (3 ms)

Corpo enviado:

```json
{
  "nome": "Webcam Full HD",
  "preco": 299.9,
  "categoria": "perifericos"
}
```

```json
{
  "id": 7,
  "nome": "Webcam Full HD",
  "preco": 299.9,
  "categoria": "perifericos"
}
```

`GET http://localhost:4001/produtos?categoria=perifericos` → **200** (1 ms)

```json
{
  "total": 3,
  "produtos": [
    {
      "id": 3,
      "nome": "Teclado mecânico",
      "preco": 249.9,
      "categoria": "perifericos"
    },
    {
      "id": 4,
      "nome": "Mouse sem fio",
      "preco": 119.5,
      "categoria": "perifericos"
    },
    {
      "id": 7,
      "nome": "Webcam Full HD",
      "preco": 299.9,
      "categoria": "perifericos"
    }
  ]
}
```

---

## Atividade 12: Atualização e remoção

**Módulo:** CRUD  
**Entrega:** Testes antes e depois das alterações.  
**Captura:** [atividade-12.png](capturas/atividade-12.png)

*Antes da atualização*

`GET http://localhost:4001/produtos/7` → **200** (2 ms)

```json
{
  "id": 7,
  "nome": "Webcam Full HD",
  "preco": 299.9,
  "categoria": "perifericos"
}
```

`PUT http://localhost:4001/produtos/7` → **200** (1 ms)

Corpo enviado:

```json
{
  "nome": "Webcam 4K",
  "preco": 549.9,
  "categoria": "perifericos"
}
```

```json
{
  "id": 7,
  "nome": "Webcam 4K",
  "preco": 549.9,
  "categoria": "perifericos"
}
```

*Depois da atualização*

`GET http://localhost:4001/produtos/7` → **200** (0 ms)

```json
{
  "id": 7,
  "nome": "Webcam 4K",
  "preco": 549.9,
  "categoria": "perifericos"
}
```

`DELETE http://localhost:4001/produtos/7` → **204** (1 ms)

```json
(sem corpo)
```

*Depois da remoção*

`GET http://localhost:4001/produtos/7` → **404** (0 ms)

```json
{
  "erro": "Produto não encontrado"
}
```

`DELETE http://localhost:4001/produtos/7` → **404** (1 ms)

```json
{
  "erro": "Produto não encontrado"
}
```

---

## Atividade 13: Separação de serviços

**Módulo:** CRUD  
**Entrega:** Captura dos dois serviços ativos e estrutura do projeto.  
**Captura:** [atividade-13.png](capturas/atividade-13.png)

`GET http://localhost:4001/status` → **200** (1 ms)

```json
{
  "servico": "servico-produtos",
  "versao": "1.0.0",
  "status": "ok"
}
```

`GET http://localhost:4007/status` → **200** (2 ms)

```json
{
  "servico": "servico-pedidos",
  "versao": "1.0.0",
  "status": "ok"
}
```

**Processos independentes em execução**

```text
  servico-produtos     PID 14396
  servico-enderecos    PID 4336
  servico-usuarios     PID 1364
  servico-tarefas      PID 12832
  servico-clima        PID 19116
  servico-pokemon      PID 8744
  servico-pedidos      PID 19020
  gateway              PID 7580
```

**Portas**

```text
  servico-produtos     porta 4001
  servico-enderecos    porta 4002
  servico-usuarios     porta 4003
  servico-tarefas      porta 4004
  servico-clima        porta 4005
  servico-pokemon      porta 4006
  servico-pedidos      porta 4007
  gateway              porta 4000
```

**Estrutura do projeto**

```text
laboratorio-microsservicos/
├── gateway/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── servico-clima/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── servico-enderecos/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── servico-pedidos/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   ├── repositorio.js
│   └── server.js
├── servico-pokemon/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── servico-produtos/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── servico-tarefas/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── servico-usuarios/
│   ├── .env.example
│   ├── app.js
│   ├── observabilidade.js
│   ├── package.json
│   └── server.js
├── testes-integracao/
│   └── ponta-a-ponta.test.js
├── package.json
└── README.md
```

---

## Atividade 14: Gateway de API

**Módulo:** Integração  
**Entrega:** Requisições aos dois serviços por uma única porta.  
**Captura:** [atividade-14.png](capturas/atividade-14.png)

`GET http://localhost:4000/api/produtos?limite=2` → **200** (39 ms)

```json
{
  "total": 2,
  "produtos": [
    {
      "id": 1,
      "nome": "Notebook",
      "preco": 3500,
      "categoria": "informatica"
    },
    {
      "id": 2,
      "nome": "Monitor 24 polegadas",
      "preco": 899.9,
      "categoria": "informatica"
    }
  ]
}
```

`GET http://localhost:4000/api/produtos/999` → **404** (3 ms)

```json
{
  "erro": "Produto não encontrado"
}
```

`POST http://localhost:4000/api/pedidos` → **201** (60 ms)

Corpo enviado:

```json
{
  "cliente": "Ana Souza",
  "itens": [
    {
      "produtoId": 2,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "id": 1,
  "cliente": "Ana Souza",
  "itens": [
    {
      "produtoId": 2,
      "nome": "Monitor 24 polegadas",
      "precoUnitario": 899.9,
      "quantidade": 1,
      "subtotal": 899.9
    }
  ],
  "valorTotal": 899.9,
  "criadoEm": "2026-11-06T22:00:47.327Z"
}
```

`GET http://localhost:4000/api/pedidos/1` → **200** (3 ms)

```json
{
  "id": 1,
  "cliente": "Ana Souza",
  "itens": [
    {
      "produtoId": 2,
      "nome": "Monitor 24 polegadas",
      "precoUnitario": 899.9,
      "quantidade": 1,
      "subtotal": 899.9
    }
  ],
  "valorTotal": 899.9,
  "criadoEm": "2026-11-06T22:00:47.327Z"
}
```

`GET http://localhost:4000/api/pedidos/999` → **404** (1 ms)

```json
{
  "erro": "Pedido não encontrado"
}
```

---

## Atividade 15: Timeout e indisponibilidade

**Módulo:** Integração  
**Entrega:** Teste demonstrando a falha controlada.  
**Captura:** [atividade-15.png](capturas/atividade-15.png)

*Queda: o processo do serviço de produtos foi encerrado*

`POST http://localhost:4007/pedidos` → **503** (3 ms)

Corpo enviado:

```json
{
  "cliente": "Bruno Lima",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "erro": "Serviço de produtos indisponível"
}
```

`GET http://localhost:4000/api/produtos` → **503** (3 ms)

```json
{
  "erro": "Serviço indisponível",
  "servico": "produtos"
}
```

*Recuperação: o serviço foi iniciado de novo e o pedido é aceito*

`POST http://localhost:4007/pedidos` → **201** (4 ms)

Corpo enviado:

```json
{
  "cliente": "Bruno Lima",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "id": 2,
  "cliente": "Bruno Lima",
  "itens": [
    {
      "produtoId": 1,
      "nome": "Notebook",
      "precoUnitario": 3500,
      "quantidade": 1,
      "subtotal": 3500
    }
  ],
  "valorTotal": 3500,
  "criadoEm": "2026-11-06T22:00:48.180Z"
}
```

*Travamento: produtos aceita a conexão e nunca responde (instância temporária com TIMEOUT_MS=1000)*

`POST http://localhost:4097/pedidos` → **503** (1031 ms)

Corpo enviado:

```json
{
  "cliente": "Bruno Lima",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "erro": "Serviço de produtos indisponível"
}
```

---

## Atividade 16: Persistência de pedidos

**Módulo:** Integração  
**Entrega:** Pedido recuperado depois de reiniciar o processo.  
**Captura:** [atividade-16.png](capturas/atividade-16.png)

`POST http://localhost:4007/pedidos` → **201** (4 ms)

Corpo enviado:

```json
{
  "cliente": "Carla Dias",
  "itens": [
    {
      "produtoId": 5,
      "quantidade": 2
    }
  ]
}
```

```json
{
  "id": 3,
  "cliente": "Carla Dias",
  "itens": [
    {
      "produtoId": 5,
      "nome": "Cadeira de escritório",
      "precoUnitario": 799,
      "quantidade": 2,
      "subtotal": 1598
    }
  ],
  "valorTotal": 1598,
  "criadoEm": "2026-11-06T22:00:50.017Z"
}
```

*O processo foi encerrado e iniciado de novo*

`GET http://localhost:4007/pedidos/3` → **200** (2 ms)

```json
{
  "id": 3,
  "cliente": "Carla Dias",
  "itens": [
    {
      "produtoId": 5,
      "nome": "Cadeira de escritório",
      "precoUnitario": 799,
      "quantidade": 2,
      "subtotal": 1598
    }
  ],
  "valorTotal": 1598,
  "criadoEm": "2026-11-06T22:00:50.017Z"
}
```

---

## Atividade 17: Configuração segura

**Módulo:** Qualidade  
**Entrega:** README com instruções e configuração de exemplo.  
**Captura:** [atividade-17.png](capturas/atividade-17.png)

**servico-pedidos/.env.example**

```text
PORTA=4007
PRODUTOS_URL=http://localhost:4001
TIMEOUT_MS=3000
ARQUIVO_DADOS=./dados/pedidos.json
```

**gateway/.env.example**

```text
PORTA=4000
PRODUTOS_URL=http://localhost:4001
ENDERECOS_URL=http://localhost:4002
USUARIOS_URL=http://localhost:4003
TAREFAS_URL=http://localhost:4004
CLIMA_URL=http://localhost:4005
POKEMON_URL=http://localhost:4006
PEDIDOS_URL=http://localhost:4007
TIMEOUT_MS=8000
CORS_ORIGEM=*
```

*Serviço de produtos iniciado com a variável PORTA=4101 (o padrão é 4001)*

`GET http://localhost:4101/status` → **200** (2 ms)

```json
{
  "servico": "servico-produtos",
  "versao": "1.0.0",
  "status": "ok"
}
```

**.gitignore (o .env real não vai para o repositório)**

```text
node_modules/
.env
servico-pedidos/dados/
*.log
```

---

## Atividade 18: Testes de integração

**Módulo:** Qualidade  
**Entrega:** Execução dos testes e relatório de resultados.  
**Captura:** [atividade-18.png](capturas/atividade-18.png)

**Execução de npm test (detalhes em evidencias/relatorio-testes.txt)**

```text
servico-produtos                     testes:  27   passaram:  27   falharam: 0
servico-enderecos                    testes:   8   passaram:   8   falharam: 0
servico-usuarios                     testes:   9   passaram:   9   falharam: 0
servico-tarefas                      testes:   8   passaram:   8   falharam: 0
servico-clima                        testes:  13   passaram:  13   falharam: 0
servico-pokemon                      testes:   6   passaram:   6   falharam: 0
servico-pedidos                      testes:  25   passaram:  25   falharam: 0
gateway                              testes:  14   passaram:  14   falharam: 0
testes-integracao (ponta a ponta)    testes:   6   passaram:   6   falharam: 0

TOTAL: 116 testes, 0 falhas
```

---

## Atividade 19: Logs e observabilidade

**Módulo:** Qualidade  
**Entrega:** Logs de uma chamada bem-sucedida e de uma falha.  
**Captura:** [atividade-19.png](capturas/atividade-19.png)

`POST http://localhost:4000/api/pedidos` → **201** (60 ms)

Corpo enviado:

```json
{
  "cliente": "Davi Rocha",
  "itens": [
    {
      "produtoId": 3,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "id": 4,
  "cliente": "Davi Rocha",
  "itens": [
    {
      "produtoId": 3,
      "nome": "Teclado mecânico",
      "precoUnitario": 249.9,
      "quantidade": 1,
      "subtotal": 249.9
    }
  ],
  "valorTotal": 249.9,
  "criadoEm": "2026-11-06T22:00:52.185Z"
}
```

**Logs da chamada bem-sucedida (x-request-id: demo-sucesso)**

```text
{"servico":"servico-produtos","horario":"2026-11-06T22:00:52.179Z","nivel":"info","requestId":"demo-sucesso","metodo":"GET","rota":"/produtos/3","status":200,"duracaoMs":1}
{"servico":"servico-pedidos","horario":"2026-11-06T22:00:52.187Z","nivel":"info","requestId":"demo-sucesso","metodo":"POST","rota":"/pedidos","status":201,"duracaoMs":55}
{"servico":"gateway","horario":"2026-11-06T22:00:52.187Z","nivel":"info","requestId":"demo-sucesso","metodo":"POST","rota":"/api/pedidos","status":201,"duracaoMs":57}
```

`POST http://localhost:4000/api/pedidos` → **503** (5 ms)

Corpo enviado:

```json
{
  "cliente": "Davi Rocha",
  "itens": [
    {
      "produtoId": 3,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "erro": "Serviço de produtos indisponível"
}
```

**Logs da falha (x-request-id: demo-falha)**

```text
{"servico":"servico-pedidos","horario":"2026-11-06T22:00:52.348Z","nivel":"erro","requestId":"demo-falha","rota":"/pedidos","mensagem":"Serviço de produtos: falha de conexão"}
{"servico":"servico-pedidos","horario":"2026-11-06T22:00:52.348Z","nivel":"erro","requestId":"demo-falha","metodo":"POST","rota":"/pedidos","status":503,"duracaoMs":2}
{"servico":"gateway","horario":"2026-11-06T22:00:52.349Z","nivel":"erro","requestId":"demo-falha","metodo":"POST","rota":"/api/pedidos","status":503,"duracaoMs":4}
```

---

## Atividade 20: Gestão de pedidos integrada

**Módulo:** Projeto final  
**Entrega:** Demonstração ponta a ponta, testes e repositório documentado.  
**Captura:** [atividade-20.png](capturas/atividade-20.png)

*Consulta do catálogo e criação do pedido por uma única porta*

`GET http://localhost:4000/api/produtos?limite=3` → **200** (4 ms)

```json
{
  "total": 3,
  "produtos": [
    {
      "id": 1,
      "nome": "Notebook",
      "preco": 3500,
      "categoria": "informatica"
    },
    {
      "id": 2,
      "nome": "Monitor 24 polegadas",
      "preco": 899.9,
      "categoria": "informatica"
    },
    {
      "id": 3,
      "nome": "Teclado mecânico",
      "preco": 249.9,
      "categoria": "perifericos"
    }
  ]
}
```

`POST http://localhost:4000/api/pedidos` → **201** (7 ms)

Corpo enviado:

```json
{
  "cliente": "Maria Oliveira",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    },
    {
      "produtoId": 3,
      "quantidade": 2
    }
  ]
}
```

```json
{
  "id": 5,
  "cliente": "Maria Oliveira",
  "itens": [
    {
      "produtoId": 1,
      "nome": "Notebook",
      "precoUnitario": 3500,
      "quantidade": 1,
      "subtotal": 3500
    },
    {
      "produtoId": 3,
      "nome": "Teclado mecânico",
      "precoUnitario": 249.9,
      "quantidade": 2,
      "subtotal": 499.8
    }
  ],
  "valorTotal": 3999.8,
  "criadoEm": "2026-11-06T22:00:53.321Z"
}
```

`GET http://localhost:4000/api/pedidos/5` → **200** (1 ms)

```json
{
  "id": 5,
  "cliente": "Maria Oliveira",
  "itens": [
    {
      "produtoId": 1,
      "nome": "Notebook",
      "precoUnitario": 3500,
      "quantidade": 1,
      "subtotal": 3500
    },
    {
      "produtoId": 3,
      "nome": "Teclado mecânico",
      "precoUnitario": 249.9,
      "quantidade": 2,
      "subtotal": 499.8
    }
  ],
  "valorTotal": 3999.8,
  "criadoEm": "2026-11-06T22:00:53.321Z"
}
```

*Validações*

`POST http://localhost:4000/api/pedidos` → **400** (2 ms)

Corpo enviado:

```json
{
  "cliente": "",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 0
    }
  ]
}
```

```json
{
  "erros": [
    "cliente é obrigatório e deve ter até 100 caracteres",
    "itens[0].quantidade deve ser um inteiro de 1 a 1000"
  ]
}
```

`POST http://localhost:4000/api/pedidos` → **422** (4 ms)

Corpo enviado:

```json
{
  "cliente": "Maria Oliveira",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    },
    {
      "produtoId": 999,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "erro": "Há produtos inexistentes no pedido",
  "produtosNaoEncontrados": [
    999
  ]
}
```

*Indisponibilidade do serviço de produtos*

`POST http://localhost:4000/api/pedidos` → **503** (4 ms)

Corpo enviado:

```json
{
  "cliente": "Maria Oliveira",
  "itens": [
    {
      "produtoId": 1,
      "quantidade": 1
    }
  ]
}
```

```json
{
  "erro": "Serviço de produtos indisponível"
}
```

**Execução de npm test (detalhes em evidencias/relatorio-testes.txt)**

```text
servico-produtos                     testes:  27   passaram:  27   falharam: 0
servico-enderecos                    testes:   8   passaram:   8   falharam: 0
servico-usuarios                     testes:   9   passaram:   9   falharam: 0
servico-tarefas                      testes:   8   passaram:   8   falharam: 0
servico-clima                        testes:  13   passaram:  13   falharam: 0
servico-pokemon                      testes:   6   passaram:   6   falharam: 0
servico-pedidos                      testes:  25   passaram:  25   falharam: 0
gateway                              testes:  14   passaram:  14   falharam: 0
testes-integracao (ponta a ponta)    testes:   6   passaram:   6   falharam: 0

TOTAL: 116 testes, 0 falhas
```
