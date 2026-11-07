const fs = require("node:fs");
const path = require("node:path");

// Atividade 16: pedidos gravados em arquivo JSON.
function criarRepositorio(arquivo) {
  const pedidos = carregar(arquivo);
  let proximoId = pedidos.reduce((maior, p) => Math.max(maior, p.id), 0) + 1;

  return {
    listar: () => pedidos,
    buscar: (id) => pedidos.find((p) => p.id === id),
    adicionar(dados) {
      const pedido = { id: proximoId, ...dados };
      gravar(arquivo, [...pedidos, pedido]);
      pedidos.push(pedido);
      proximoId += 1;
      return pedido;
    },
  };
}

function carregar(arquivo) {
  // Um arquivo corrompido interrompe a inicialização para não ser sobrescrito.
  try {
    return JSON.parse(fs.readFileSync(arquivo, "utf8"));
  } catch (erro) {
    if (erro.code === "ENOENT") return [];
    throw new Error(`Não foi possível ler ${arquivo}: ${erro.message}`);
  }
}

// Grava em um arquivo temporário e renomeia: uma queda no meio não corrompe os dados.
function gravar(arquivo, pedidos) {
  fs.mkdirSync(path.dirname(arquivo), { recursive: true });
  const temporario = `${arquivo}.tmp`;
  fs.writeFileSync(temporario, JSON.stringify(pedidos, null, 2));
  fs.renameSync(temporario, arquivo);
}

module.exports = { criarRepositorio };
