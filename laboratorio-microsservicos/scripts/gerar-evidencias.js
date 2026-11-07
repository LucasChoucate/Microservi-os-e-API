// Sobe os serviços como processos reais, executa o roteiro de cada atividade, confere
// os status e gera: relatório, capturas PNG e coleção do Postman.
const { spawn, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { RAIZ, SERVICOS } = require("./servicos");
const ATIVIDADES = require("./atividades");

const PASTA_EVIDENCIAS = path.join(RAIZ, "evidencias");
const PASTA_CAPTURAS = path.join(PASTA_EVIDENCIAS, "capturas");
const PASTA_TEMP = fs.mkdtempSync(path.join(os.tmpdir(), "evidencias-"));
const ARQUIVO_PEDIDOS = path.join(PASTA_TEMP, "pedidos.json");
const MAX_LINHAS_RESPOSTA = 28;

const processos = new Map();
const logs = [];

// ---------- processos ----------

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function esperarNoAr(porta) {
  for (let tentativa = 0; tentativa < 50; tentativa += 1) {
    try {
      const resposta = await fetch(`http://localhost:${porta}/status`);
      if (resposta.ok) return;
    } catch {
      await esperar(100);
    }
  }
  throw new Error(`O serviço da porta ${porta} não subiu`);
}

function capturarLogs(fluxo) {
  let resto = "";
  fluxo.on("data", (parte) => {
    const linhas = (resto + parte).split(/\r?\n/);
    resto = linhas.pop();
    logs.push(...linhas.filter(Boolean));
  });
}

function criarProcesso(pasta, ambiente = {}) {
  const filho = spawn(process.execPath, ["server.js"], {
    cwd: path.join(RAIZ, pasta),
    env: { ...process.env, ARQUIVO_DADOS: ARQUIVO_PEDIDOS, ...ambiente },
    stdio: ["ignore", "pipe", "pipe"],
  });
  capturarLogs(filho.stdout);
  capturarLogs(filho.stderr);
  return filho;
}

async function iniciarServico(pasta) {
  const { porta } = SERVICOS.find((s) => s.pasta === pasta);
  processos.set(pasta, criarProcesso(pasta, { PORTA: String(porta) }));
  await esperarNoAr(porta);
}

function encerrar(filho) {
  return new Promise((resolve) => {
    if (filho.exitCode !== null) return resolve();
    filho.once("exit", resolve);
    filho.kill();
  });
}

async function pararServico(pasta) {
  await encerrar(processos.get(pasta));
  processos.delete(pasta);
}

// ---------- requisições ----------

function formatarCorpo(texto) {
  let formatado = texto;
  try {
    formatado = JSON.stringify(JSON.parse(texto), null, 2);
  } catch {
    // Mantém o texto como veio.
  }
  const linhas = formatado.split("\n");
  if (linhas.length <= MAX_LINHAS_RESPOSTA) return formatado;
  return [
    ...linhas.slice(0, MAX_LINHAS_RESPOSTA),
    `... (${linhas.length - MAX_LINHAS_RESPOSTA} linhas omitidas nesta captura)`,
  ].join("\n");
}

async function executarRequisicao(passo, numero) {
  const corpo = passo.corpoBruto ?? (passo.corpo ? JSON.stringify(passo.corpo) : undefined);
  const headers = { ...passo.cabecalhos };
  if (corpo) headers["content-type"] = "application/json";

  const inicio = Date.now();
  const resposta = await fetch(passo.url, { method: passo.metodo, headers, body: corpo });
  const texto = await resposta.text();
  const duracaoMs = Date.now() - inicio;

  if (resposta.status !== passo.esperado) {
    throw new Error(
      `Atividade ${numero}: ${passo.metodo} ${passo.url} retornou ${resposta.status}, ` +
        `esperado ${passo.esperado}\n${texto}`
    );
  }

  return {
    tipo: "requisicao",
    metodo: passo.metodo,
    url: passo.url,
    corpoEnviado: passo.corpoBruto ?? (passo.corpo ? JSON.stringify(passo.corpo, null, 2) : null),
    status: resposta.status,
    duracaoMs,
    corpo: texto ? formatarCorpo(texto) : "(sem corpo)",
  };
}

// ---------- extras ----------

function arvore(pasta, prefixo = "") {
  const ignorar = new Set(["node_modules", "testes", "dados", "evidencias", "postman", "scripts"]);
  const itens = fs
    .readdirSync(pasta, { withFileTypes: true })
    .filter((i) => !ignorar.has(i.name) && !i.name.startsWith(".git") && i.name !== "package-lock.json")
    .sort((a, b) => Number(b.isDirectory()) - Number(a.isDirectory()));

  return itens.flatMap((item, posicao) => {
    const ultimo = posicao === itens.length - 1;
    const linha = `${prefixo}${ultimo ? "└── " : "├── "}${item.name}${item.isDirectory() ? "/" : ""}`;
    if (!item.isDirectory()) return [linha];
    return [linha, ...arvore(path.join(pasta, item.name), `${prefixo}${ultimo ? "    " : "│   "}`)];
  });
}

async function extraEstrutura() {
  const portas = SERVICOS.map((s) => `  ${s.pasta.padEnd(20)} porta ${s.porta}`).join("\n");
  const filhos = [...processos.entries()]
    .map(([pasta, filho]) => `  ${pasta.padEnd(20)} PID ${filho.pid}`)
    .join("\n");

  return [
    { tipo: "texto", titulo: "Processos independentes em execução", conteudo: filhos },
    { tipo: "texto", titulo: "Portas", conteudo: portas },
    {
      tipo: "texto",
      titulo: "Estrutura do projeto",
      conteudo: ["laboratorio-microsservicos/", ...arvore(RAIZ)].join("\n"),
    },
  ];
}

async function extraTimeout() {
  // Um servidor que aceita a conexão e nunca responde simula o serviço travado.
  const travado = http.createServer(() => {});
  await new Promise((resolve) => travado.listen(4098, "127.0.0.1", resolve));

  const pedidos = criarProcesso("servico-pedidos", {
    PORTA: "4097",
    PRODUTOS_URL: "http://127.0.0.1:4098",
    TIMEOUT_MS: "1000",
    ARQUIVO_DADOS: path.join(PASTA_TEMP, "pedidos-timeout.json"),
  });
  await esperarNoAr(4097);

  const resultado = await executarRequisicao(
    {
      metodo: "POST",
      url: "http://localhost:4097/pedidos",
      corpo: { cliente: "Bruno Lima", itens: [{ produtoId: 1, quantidade: 1 }] },
      esperado: 503,
    },
    15
  );

  await encerrar(pedidos);
  travado.closeAllConnections();
  await new Promise((resolve) => travado.close(resolve));

  if (resultado.duracaoMs < 900 || resultado.duracaoMs > 2500) {
    throw new Error(`O timeout não durou cerca de 1 s: ${resultado.duracaoMs} ms`);
  }

  return [
    {
      tipo: "nota",
      texto: "Travamento: produtos aceita a conexão e nunca responde (instância temporária com TIMEOUT_MS=1000)",
    },
    resultado,
  ];
}

async function extraConfiguracao() {
  const exemplo = (pasta) =>
    fs.readFileSync(path.join(RAIZ, pasta, ".env.example"), "utf8").trim();

  const instancia = criarProcesso("servico-produtos", { PORTA: "4101" });
  await esperarNoAr(4101);
  const porVariavel = await executarRequisicao(
    { metodo: "GET", url: "http://localhost:4101/status", esperado: 200 },
    17
  );
  await encerrar(instancia);

  const ignorados = fs.readFileSync(path.join(RAIZ, ".gitignore"), "utf8").trim();

  return [
    { tipo: "texto", titulo: "servico-pedidos/.env.example", conteudo: exemplo("servico-pedidos") },
    { tipo: "texto", titulo: "gateway/.env.example", conteudo: exemplo("gateway") },
    { tipo: "nota", texto: "Serviço de produtos iniciado com a variável PORTA=4101 (o padrão é 4001)" },
    porVariavel,
    { tipo: "texto", titulo: ".gitignore (o .env real não vai para o repositório)", conteudo: ignorados },
  ];
}

function extraTestes() {
  const relatorio = fs.readFileSync(path.join(PASTA_EVIDENCIAS, "relatorio-testes.txt"), "utf8");
  const resumo = relatorio.split("\n")[0];
  const porServico = [...relatorio.matchAll(/===== (.+?) =====[\s\S]*?ℹ tests (\d+)[\s\S]*?ℹ pass (\d+)[\s\S]*?ℹ fail (\d+)/g)]
    .map((m) => `${m[1].padEnd(36)} testes: ${m[2].padStart(3)}   passaram: ${m[3].padStart(3)}   falharam: ${m[4]}`)
    .join("\n");

  return [
    {
      tipo: "texto",
      titulo: "Execução de npm test (detalhes em evidencias/relatorio-testes.txt)",
      conteudo: `${porServico}\n\n${resumo}`,
    },
  ];
}

async function extraLogs(passo) {
  await esperar(150);
  const linhas = logs.filter((linha) => linha.includes(`"requestId":"${passo.requestId}"`));
  if (linhas.length === 0) throw new Error(`Sem logs para ${passo.requestId}`);

  return [
    {
      tipo: "texto",
      titulo: `${passo.titulo} (x-request-id: ${passo.requestId})`,
      conteudo: linhas.join("\n"),
    },
  ];
}

async function executarExtra(passo) {
  switch (passo.extra) {
    case "estrutura":
      return extraEstrutura();
    case "timeout":
      return extraTimeout();
    case "configuracao":
      return extraConfiguracao();
    case "testes":
      return extraTestes();
    case "logs":
      return extraLogs(passo);
    default:
      throw new Error(`Extra desconhecido: ${passo.extra}`);
  }
}

// ---------- saídas ----------

function escapar(texto) {
  return String(texto).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]);
}

function corDoStatus(status) {
  if (status < 300) return "#3fb950";
  if (status < 500) return "#d29922";
  return "#f85149";
}

function blocosHtml(blocos) {
  return blocos
    .map((b) => {
      if (b.tipo === "nota") return `<p class="nota">${escapar(b.texto)}</p>`;
      if (b.tipo === "texto") {
        return `<div class="caixa"><div class="rotulo">${escapar(b.titulo)}</div><pre>${escapar(b.conteudo)}</pre></div>`;
      }
      const enviado = b.corpoEnviado ? `<pre class="enviado">${escapar(b.corpoEnviado)}</pre>` : "";
      return `<div class="caixa">
        <div class="linha"><span class="metodo">${b.metodo}</span><span class="url">${escapar(b.url)}</span>
        <span class="status" style="color:${corDoStatus(b.status)}">${b.status}</span><span class="tempo">${b.duracaoMs} ms</span></div>
        ${enviado}<pre>${escapar(b.corpo)}</pre></div>`;
    })
    .join("\n");
}

function paginaHtml(atividade, blocos, horario) {
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 24px; background: #0d1117; color: #e6edf3; font: 14px/1.45 Consolas, monospace; }
  h1 { font: 600 22px "Segoe UI", sans-serif; margin: 2px 0 6px; }
  .modulo { color: #7d8590; font: 12px "Segoe UI", sans-serif; letter-spacing: .08em; text-transform: uppercase; }
  .entrega { color: #7d8590; font: 13px "Segoe UI", sans-serif; margin: 0 0 16px; }
  .nota { color: #79c0ff; font: 600 13px "Segoe UI", sans-serif; margin: 16px 0 8px; }
  .caixa { background: #161b22; border: 1px solid #30363d; border-radius: 6px; margin-bottom: 10px; overflow: hidden; }
  .linha, .rotulo { display: flex; gap: 12px; align-items: center; padding: 7px 12px; background: #21262d; }
  .rotulo { color: #e6edf3; font-weight: 600; }
  .metodo { color: #d2a8ff; font-weight: 700; }
  .url { flex: 1; overflow-wrap: anywhere; }
  .status { font-weight: 700; }
  .tempo { color: #7d8590; }
  pre { margin: 0; padding: 9px 12px; white-space: pre-wrap; overflow-wrap: anywhere; font: inherit; }
  .enviado { color: #a5d6ff; border-bottom: 1px solid #30363d; }
  </style></head><body>
  <div class="modulo">Atividade ${atividade.numero} de 20 · ${escapar(atividade.modulo)}</div>
  <h1>${escapar(atividade.titulo)}</h1>
  <p class="entrega">Entrega: ${escapar(atividade.entrega)} · Requisições reais em ${escapar(horario)}</p>
  ${blocosHtml(blocos)}
  </body></html>`;
}

function alturaEstimada(blocos) {
  const LARGURA = 118;
  let altura = 150;
  for (const b of blocos) {
    if (b.tipo === "nota") {
      altura += 45;
      continue;
    }
    const textos = b.tipo === "texto" ? [b.conteudo] : [b.corpo, b.corpoEnviado ?? ""];
    altura += 70;
    for (const texto of textos) {
      for (const linha of texto.split("\n")) {
        altura += 21 * Math.max(1, Math.ceil(linha.length / LARGURA));
      }
    }
  }
  return altura;
}

function localizarNavegador() {
  const candidatos = [
    process.env.CHROME_PATH,
    "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
    "C:/Program Files/Google/Chrome/Application/chrome.exe",
    "/usr/bin/google-chrome",
    "/usr/bin/chromium",
  ];
  return candidatos.find((c) => c && fs.existsSync(c));
}

function capturar(navegador, html, destino, altura) {
  const arquivoHtml = path.join(PASTA_TEMP, `${path.basename(destino, ".png")}.html`);
  const temporario = path.join(PASTA_TEMP, path.basename(destino));
  fs.writeFileSync(arquivoHtml, html);

  const resultado = spawnSync(
    navegador,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--user-data-dir=${path.join(PASTA_TEMP, "perfil")}`,
      `--window-size=1100,${altura}`,
      `--screenshot=${temporario}`,
      `file:///${arquivoHtml.replace(/\\/g, "/")}`,
    ],
    { timeout: 60000 }
  );
  if (!fs.existsSync(temporario)) {
    throw new Error(`Falha ao gerar ${destino}: ${resultado.stderr}`);
  }
  fs.renameSync(temporario, destino);
}

function secaoMarkdown(atividade, blocos) {
  const numero = String(atividade.numero).padStart(2, "0");
  const partes = [
    `## Atividade ${atividade.numero}: ${atividade.titulo}`,
    `**Módulo:** ${atividade.modulo}  \n**Entrega:** ${atividade.entrega}  \n**Captura:** [atividade-${numero}.png](capturas/atividade-${numero}.png)`,
  ];
  for (const b of blocos) {
    if (b.tipo === "nota") partes.push(`*${b.texto}*`);
    else if (b.tipo === "texto") partes.push(`**${b.titulo}**\n\n\`\`\`text\n${b.conteudo}\n\`\`\``);
    else {
      const enviado = b.corpoEnviado ? `\n\nCorpo enviado:\n\n\`\`\`json\n${b.corpoEnviado}\n\`\`\`` : "";
      partes.push(
        `\`${b.metodo} ${b.url}\` → **${b.status}** (${b.duracaoMs} ms)${enviado}\n\n\`\`\`json\n${b.corpo}\n\`\`\``
      );
    }
  }
  return partes.join("\n\n");
}

function colecaoPostman() {
  return {
    info: {
      name: "Laboratório de Microsserviços",
      description:
        "Requisições das 20 atividades. Execute em ordem, com os serviços recém-iniciados (npm start). " +
        "As atividades 15, 16, 19 e 20 também pedem encerrar e iniciar serviços manualmente; veja o README.",
      schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    },
    item: ATIVIDADES.map((atividade) => ({
      name: `Atividade ${String(atividade.numero).padStart(2, "0")} - ${atividade.titulo}`,
      item: atividade.passos
        .filter((passo) => passo.metodo)
        .map((passo) => {
          const corpo = passo.corpoBruto ?? (passo.corpo ? JSON.stringify(passo.corpo, null, 2) : null);
          const cabecalhos = Object.entries(passo.cabecalhos ?? {}).map(([key, value]) => ({ key, value }));
          if (corpo) cabecalhos.push({ key: "Content-Type", value: "application/json" });
          return {
            name: `${passo.metodo} ${passo.url.replace("http://localhost:", ":")} (espera ${passo.esperado})`,
            request: {
              method: passo.metodo,
              header: cabecalhos,
              url: passo.url,
              ...(corpo ? { body: { mode: "raw", raw: corpo } } : {}),
            },
            event: [
              {
                listen: "test",
                script: {
                  type: "text/javascript",
                  exec: [
                    `pm.test("status ${passo.esperado}", () => pm.response.to.have.status(${passo.esperado}));`,
                  ],
                },
              },
            ],
          };
        }),
    })),
  };
}

// ---------- execução ----------

async function principal() {
  if (!fs.existsSync(path.join(PASTA_EVIDENCIAS, "relatorio-testes.txt"))) {
    throw new Error("Execute npm test antes de gerar as evidências.");
  }

  fs.mkdirSync(PASTA_CAPTURAS, { recursive: true });
  for (const { pasta } of SERVICOS) await iniciarServico(pasta);

  const horario = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const navegador = localizarNavegador();
  if (!navegador) console.warn("Navegador não encontrado: as capturas PNG não serão geradas.");

  const secoes = [];
  for (const atividade of ATIVIDADES) {
    const blocos = [];
    for (const passo of atividade.passos) {
      if (passo.nota) blocos.push({ tipo: "nota", texto: passo.nota });
      else if (passo.acao === "parar") await pararServico(passo.pasta);
      else if (passo.acao === "iniciar") await iniciarServico(passo.pasta);
      else if (passo.extra) blocos.push(...(await executarExtra(passo)));
      else blocos.push(await executarRequisicao(passo, atividade.numero));
    }

    secoes.push(secaoMarkdown(atividade, blocos));
    if (navegador) {
      const numero = String(atividade.numero).padStart(2, "0");
      capturar(
        navegador,
        paginaHtml(atividade, blocos, horario),
        path.join(PASTA_CAPTURAS, `atividade-${numero}.png`),
        alturaEstimada(blocos)
      );
    }
    console.log(`OK atividade ${atividade.numero}: ${atividade.titulo}`);
  }

  fs.writeFileSync(
    path.join(PASTA_EVIDENCIAS, "evidencias.md"),
    `# Evidências das 20 atividades\n\nRequisições reais executadas por \`npm run evidencias\` em ${horario}. ` +
      `Cada status foi conferido com o esperado.\n\n${secoes.join("\n\n---\n\n")}\n`
  );
  fs.writeFileSync(
    path.join(RAIZ, "postman", "laboratorio-microsservicos.postman_collection.json"),
    JSON.stringify(colecaoPostman(), null, 2)
  );
}

async function limpar() {
  await Promise.all([...processos.values()].map(encerrar));
  await esperar(300);
  fs.rmSync(PASTA_TEMP, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
}

principal()
  .then(limpar)
  .then(() => console.log("\nEvidências geradas em evidencias/ e postman/."))
  .catch(async (erro) => {
    console.error(erro);
    await limpar();
    process.exit(1);
  });
