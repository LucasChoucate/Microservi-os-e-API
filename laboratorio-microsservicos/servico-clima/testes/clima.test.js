const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { criarApp } = require("../app");
const { iniciar } = require("./auxiliar");

let externo;
let servico;
let ultimaConsulta;
let respostaExterna;

before(async () => {
  externo = await iniciar(
    http.createServer((req, res) => {
      ultimaConsulta = new URL(req.url, "http://externo");
      res.setHeader("content-type", "application/json");
      res.end(JSON.stringify(respostaExterna));
    })
  );
  servico = await iniciar(criarApp({ apiUrl: externo.url, log: () => {} }));
});

after(async () => {
  await servico.fechar();
  await externo.fechar();
});

test("coordenadas válidas devolvem o JSON reduzido", async () => {
  respostaExterna = {
    latitude: -23.5,
    generationtime_ms: 0.1,
    current: { time: "2026-11-06T18:00", temperature_2m: 24.5, precipitation: 0 },
  };

  const resposta = await fetch(`${servico.url}/clima?latitude=-23.55&longitude=-46.63`);
  assert.equal(resposta.status, 200);
  assert.deepEqual(await resposta.json(), {
    latitude: -23.55,
    longitude: -46.63,
    horario: "2026-11-06T18:00",
    temperaturaC: 24.5,
    precipitacaoMm: 0,
  });
  assert.equal(ultimaConsulta.searchParams.get("latitude"), "-23.55");
  assert.equal(ultimaConsulta.searchParams.get("current"), "temperature_2m,precipitation");
});

test("temperatura zero é um valor válido", async () => {
  respostaExterna = { current: { time: "x", temperature_2m: 0, precipitation: 0 } };
  const resposta = await fetch(`${servico.url}/clima?latitude=0&longitude=0`);
  assert.equal(resposta.status, 200);
  assert.equal((await resposta.json()).temperaturaC, 0);
});

for (const consulta of [
  "",
  "latitude=10",
  "longitude=10",
  "latitude=&longitude=",
  "latitude=91&longitude=0",
  "latitude=0&longitude=181",
  "latitude=abc&longitude=0",
  "latitude=1e1&longitude=0",
  "latitude=1&latitude=2&longitude=0",
]) {
  test(`coordenadas inválidas retornam 400: "${consulta}"`, async () => {
    assert.equal((await fetch(`${servico.url}/clima?${consulta}`)).status, 400);
  });
}

test("resposta externa sem temperatura retorna 502", async () => {
  respostaExterna = { error: true };
  assert.equal((await fetch(`${servico.url}/clima?latitude=1&longitude=1`)).status, 502);
});

test("API externa fora do ar retorna 502", async () => {
  const fora = await iniciar(criarApp({ apiUrl: "http://127.0.0.1:9", log: () => {} }));
  assert.equal((await fetch(`${fora.url}/clima?latitude=1&longitude=1`)).status, 502);
  await fora.fechar();
});
