# Laboratório de Microsserviços: gestão de pedidos

Implementação das 20 atividades do **Roteiro de Prática de Microsserviços** com Node.js, Express, HTTP e JSON. O resultado é um sistema de pedidos em que cada serviço roda em um processo independente: antes de registrar um pedido, o serviço de pedidos consulta o serviço de produtos.

## Arquitetura

```text
                         ┌──▶ servico-produtos  :4001
                         │          ▲
                         │          │ consulta preço e existência
                         ├──▶ servico-pedidos   :4007 ──▶ dados/pedidos.json
Cliente ──▶ gateway :4000│
(Postman, frontend)      ├──▶ servico-enderecos :4002 ──▶ ViaCEP
                         ├──▶ servico-usuarios  :4003 ──▶ JSONPlaceholder
                         ├──▶ servico-tarefas   :4004 ──▶ JSONPlaceholder
                         ├──▶ servico-clima     :4005 ──▶ Open-Meteo
                         └──▶ servico-pokemon   :4006 ──▶ PokéAPI
```

| Serviço | Porta | Rotas principais | Pelo gateway |
|---|---|---|---|
| `gateway` | 4000 | `/status` | ponto de entrada único |
| `servico-produtos` | 4001 | `GET`, `POST /produtos`; `GET`, `PUT`, `DELETE /produtos/:id` | `/api/produtos` |
| `servico-enderecos` | 4002 | `GET /enderecos/:cep` | `/api/enderecos` |
| `servico-usuarios` | 4003 | `GET /usuarios`; `GET /usuarios/:id` | `/api/usuarios` |
| `servico-tarefas` | 4004 | `GET /tarefas?usuario=` | `/api/tarefas` |
| `servico-clima` | 4005 | `GET /clima?latitude=&longitude=` | `/api/clima` |
| `servico-pokemon` | 4006 | `GET /pokemon/:id` | `/api/pokemon` |
| `servico-pedidos` | 4007 | `GET`, `POST /pedidos`; `GET /pedidos/:id` | `/api/pedidos` |

Todos os serviços também têm `GET /status`, e cada um tem seu próprio `package.json`, arquivo de inicialização e porta.

## Como executar

Requer Node.js 18 ou superior.

```bash
npm run instalar   # instala as dependências dentro de cada serviço
npm start          # sobe todos os serviços; Ctrl+C encerra
```

Para subir um único serviço:

```bash
cd servico-produtos
node server.js
```

### Criar um pedido

```http
POST http://localhost:4000/api/pedidos
Content-Type: application/json

{
  "cliente": "Maria Oliveira",
  "itens": [
    { "produtoId": 1, "quantidade": 1 },
    { "produtoId": 3, "quantidade": 2 }
  ]
}
```

O serviço de pedidos busca nome e preço no serviço de produtos e calcula o total, ignorando qualquer preço enviado pelo cliente:

```json
{
  "id": 1,
  "cliente": "Maria Oliveira",
  "itens": [
    { "produtoId": 1, "nome": "Notebook", "precoUnitario": 3500, "quantidade": 1, "subtotal": 3500 },
    { "produtoId": 3, "nome": "Teclado mecânico", "precoUnitario": 249.9, "quantidade": 2, "subtotal": 499.8 }
  ],
  "valorTotal": 3999.8,
  "criadoEm": "2026-11-06T21:57:42.000Z"
}
```

### Códigos de resposta

| Código | Significado neste sistema |
|---|---|
| 200, 201, 204 | Consulta ou atualização, criação e remoção bem-sucedidas |
| 400 | Dados inválidos: JSON malformado, campo ausente, filtro ou id inválido |
| 404 | O recurso não existe |
| 422 | O pedido é válido, mas contém produto inexistente; a resposta lista os ids |
| 502 | API externa falhou, ou um serviço interno devolveu uma resposta inválida |
| 503 | Serviço interno fora do ar ou sem responder dentro do tempo limite |

## Mapa das atividades

As capturas estão em [evidencias/capturas/](evidencias/capturas/), e as requisições com as respostas completas em [evidencias/evidencias.md](evidencias/evidencias.md).

| # | Atividade | Onde está | Captura |
|---|---|---|---|
| 1 | Primeiro microsserviço | `servico-produtos`, `GET /status` | [01](evidencias/capturas/atividade-01.png) |
| 2 | Rotas e métodos HTTP | `servico-produtos`, `GET /produtos` e `/produtos/:id` | [02](evidencias/capturas/atividade-02.png) |
| 3 | Parâmetros e consultas | `servico-produtos`, `?categoria=&limite=` | [03](evidencias/capturas/atividade-03.png) |
| 4 | Validação de JSON | `servico-produtos`, `POST /produtos` | [04](evidencias/capturas/atividade-04.png) |
| 5 | Primeira consulta externa | `servico-usuarios`, `GET /usuarios` | [05](evidencias/capturas/atividade-05.png) |
| 6 | Detalhes de usuário | `servico-usuarios`, `GET /usuarios/:id` | [06](evidencias/capturas/atividade-06.png) |
| 7 | Consulta de CEP | `servico-enderecos` | [07](evidencias/capturas/atividade-07.png) |
| 8 | Tarefas remotas | `servico-tarefas` | [08](evidencias/capturas/atividade-08.png) |
| 9 | Dados meteorológicos | `servico-clima` | [09](evidencias/capturas/atividade-09.png) |
| 10 | Catálogo de personagens | `servico-pokemon` | [10](evidencias/capturas/atividade-10.png) |
| 11 | Cadastro local | `servico-produtos`, `POST` e `GET` | [11](evidencias/capturas/atividade-11.png) |
| 12 | Atualização e remoção | `servico-produtos`, `PUT` e `DELETE` | [12](evidencias/capturas/atividade-12.png) |
| 13 | Separação de serviços | `servico-produtos` e `servico-pedidos` | [13](evidencias/capturas/atividade-13.png) |
| 14 | Gateway de API | `gateway` | [14](evidencias/capturas/atividade-14.png) |
| 15 | Timeout e indisponibilidade | `servico-pedidos/app.js`, `gateway/app.js` | [15](evidencias/capturas/atividade-15.png) |
| 16 | Persistência de pedidos | `servico-pedidos/repositorio.js` | [16](evidencias/capturas/atividade-16.png) |
| 17 | Configuração segura | `.env.example` de cada serviço, `.gitignore` | [17](evidencias/capturas/atividade-17.png) |
| 18 | Testes de integração | `testes/` de cada serviço, `testes-integracao/` | [18](evidencias/capturas/atividade-18.png) |
| 19 | Logs e observabilidade | `observabilidade.js` de cada serviço | [19](evidencias/capturas/atividade-19.png) |
| 20 | Gestão de pedidos integrada | `gateway`, `servico-pedidos`, `servico-produtos` | [20](evidencias/capturas/atividade-20.png) |

O texto do roteiro não informa a entrega da atividade 4; foram demonstrados os retornos 201 e 400 pedidos no desenvolvimento esperado.

## Decisões técnicas

- **Persistência em arquivo JSON (atividade 16).** O laboratório tem uma única instância do serviço de pedidos e poucos registros, então um arquivo atende sem exigir a instalação de um banco. A gravação usa um arquivo temporário seguido de renomeação, para que uma queda no meio não corrompa os dados. Se o arquivo estiver corrompido, o serviço não inicia, em vez de sobrescrevê-lo. Com várias instâncias ou escritas concorrentes de processos diferentes, o caminho seria um banco de dados.
- **Catálogo de produtos em memória.** As atividades 2 e 11 pedem isso, portanto reiniciar o serviço de produtos restaura o catálogo inicial.
- **Tempos limite em cascata.** Produtos é chamado com limite de 3 s e o gateway espera até 8 s, para que o serviço de pedidos consiga responder primeiro com um erro mais específico.
- **Valores em centavos.** O total é calculado em centavos para evitar erros de ponto flutuante, como `0.1 + 0.2 = 0.30000000000000004`.
- **Preço congelado no pedido.** Cada item guarda o nome e o preço do momento da compra; mudar o catálogo depois não altera pedidos antigos.
- **`observabilidade.js` copiado em cada serviço.** Foi uma escolha para manter a implantação independente; uma pasta compartilhada acoplaria os serviços.
- **Dependências por serviço.** O roteiro sugere instalar `express` e `cors` na raiz, mas aqui eles ficam dentro de cada serviço, conforme a própria observação do roteiro. A raiz tem apenas scripts de apoio, e `cors` é usado só no gateway, a única porta de entrada de um frontend.

## Configuração

Portas e URLs vêm de variáveis de ambiente, com padrões de desenvolvimento no código. Para mudar algum valor, copie o exemplo do serviço:

```bash
cd servico-pedidos
cp .env.example .env
```

| Variável | Serviços | Função |
|---|---|---|
| `PORTA` | todos | Porta HTTP do serviço |
| `TIMEOUT_MS` | todos, exceto produtos | Tempo limite das chamadas a outros serviços |
| `PRODUTOS_URL` | pedidos, gateway | Endereço do serviço de produtos |
| `ENDERECOS_URL`, `USUARIOS_URL`, `TAREFAS_URL`, `CLIMA_URL`, `POKEMON_URL`, `PEDIDOS_URL` | gateway | Endereço de cada serviço |
| `ARQUIVO_DADOS` | pedidos | Caminho do arquivo de pedidos |
| `VIACEP_URL`, `JSONPLACEHOLDER_URL`, `OPEN_METEO_URL`, `POKEAPI_URL` | serviços de APIs públicas | Endereço da API externa |
| `CORS_ORIGEM` | gateway | Origem permitida para frontends |

O sistema não usa segredos, e o `.gitignore` impede que arquivos `.env` e os dados locais de pedidos entrem no repositório.

## Testes

```bash
npm test
```

O comando executa os testes de cada serviço e um teste ponta a ponta, e grava o resultado em [evidencias/relatorio-testes.txt](evidencias/relatorio-testes.txt). Eles cobrem sucesso, validação, recurso ausente e indisponibilidade, incluindo serviço fora do ar e serviço travado. As APIs públicas são simuladas por servidores locais, então os testes não dependem de internet.

## Logs

Cada requisição gera uma linha JSON com serviço, horário, rota, status e identificador. O `x-request-id` atravessa gateway, pedidos e produtos, o que permite seguir uma única chamada por todos eles:

```json
{"servico":"servico-pedidos","horario":"2026-11-06T21:57:39.820Z","nivel":"info","requestId":"demo-sucesso","metodo":"POST","rota":"/pedidos","status":201,"duracaoMs":57}
```

## Evidências e Postman

```bash
npm test && npm run evidencias
```

Esse comando sobe os serviços nas portas 4000 a 4007 (que precisam estar livres), refaz as requisições de todas as atividades, confere cada status e regenera as capturas e a coleção. As capturas exigem Edge ou Chrome instalado, e as APIs públicas exigem internet.

Para testar manualmente, importe [postman/laboratorio-microsservicos.postman_collection.json](postman/laboratorio-microsservicos.postman_collection.json) no Postman ou no Insomnia. Execute em ordem, com os serviços recém-iniciados e sem o arquivo `servico-pedidos/dados/pedidos.json`, porque algumas requisições usam ids criados pelas anteriores. Nas atividades 15, 19 e 20, encerre o serviço de produtos antes das requisições que esperam 503; na 16, reinicie o de pedidos antes da última.

## Critérios de avaliação do projeto integrador

| Critério | Peso | Onde verificar |
|---|---:|---|
| Rotas e métodos HTTP | 25% | Tabela de serviços; atividades 2, 11, 12 e 14 |
| Integração entre serviços | 25% | `buscarProduto` em `servico-pedidos/app.js`; gateway; atividades 14 e 20 |
| Validação e erros | 20% | `validarPedido`; tabela de códigos; atividades 4, 15 e 20 |
| Código e documentação | 15% | Este README; atividade 17 |
| Testes e demonstração | 15% | `npm test`; roteiro abaixo; atividades 18 e 20 |

## Roteiro da demonstração

1. Rode `npm start` e mostre os serviços ativos.
2. No Postman, consulte `GET /api/produtos` pelo gateway, na porta 4000.
3. Crie um pedido com `POST /api/pedidos` e mostre que o total foi calculado com os preços do serviço de produtos.
4. Envie um pedido inválido (400) e outro com produto inexistente (422).
5. Encerre o serviço de produtos, repita o pedido e mostre o 503 imediato e o log com o motivo.
6. Reinicie o serviço de pedidos e consulte de novo o pedido criado, para mostrar a persistência.
7. Rode `npm test` e mostre o resultado.
