require("dotenv").config({ quiet: true });
const { criarApp } = require("./app");

const porta = process.env.PORTA || 4007;

const app = criarApp({
  produtosUrl: process.env.PRODUTOS_URL || undefined,
  timeoutMs: Number(process.env.TIMEOUT_MS) || undefined,
  arquivoDados: process.env.ARQUIVO_DADOS || undefined,
});

app.listen(porta, () => {
  console.log(`Serviço de pedidos na porta ${porta}`);
});
