// Executa os testes de todos os serviços e grava o relatório da atividade 18.
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const { RAIZ, SERVICOS } = require("./servicos");

const alvos = [
  ...SERVICOS.map(({ pasta }) => ({ nome: pasta, cwd: path.join(RAIZ, pasta), args: [] })),
  {
    nome: "testes-integracao (ponta a ponta)",
    cwd: RAIZ,
    args: [path.join("testes-integracao", "ponta-a-ponta.test.js")],
  },
];

let relatorio = "";
let totalTestes = 0;
let totalFalhas = 0;

for (const { nome, cwd, args } of alvos) {
  const resultado = spawnSync(
    process.execPath,
    ["--test", "--test-reporter=spec", ...args],
    { cwd, encoding: "utf8" }
  );
  const saida = resultado.stdout + resultado.stderr;
  const testes = Number(saida.match(/ℹ tests (\d+)/)?.[1] ?? 0);
  const falhas = Number(saida.match(/ℹ fail (\d+)/)?.[1] ?? 0);

  totalTestes += testes;
  totalFalhas += falhas;
  if (resultado.status !== 0 && falhas === 0) totalFalhas += 1;

  relatorio += `\n===== ${nome} =====\n${saida}`;
  console.log(`${falhas === 0 && resultado.status === 0 ? "OK   " : "FALHA"} ${nome}: ${testes} testes`);
}

const resumo = `TOTAL: ${totalTestes} testes, ${totalFalhas} falhas`;
console.log(`\n${resumo}`);

const pasta = path.join(RAIZ, "evidencias");
fs.mkdirSync(pasta, { recursive: true });
fs.writeFileSync(path.join(pasta, "relatorio-testes.txt"), `${resumo}\n${relatorio}`);

if (totalFalhas > 0 || totalTestes === 0) {
  console.log(relatorio);
  process.exit(1);
}
