const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const sortJson = require('sort-json');

// Carrega o catálogo de exemplos JSON
let catalogo = require('../catalogo.json');
let catalogo_coded = 0;

// Função auxiliar para injetar o código-fonte de cada ficheiro .vm no objeto do catálogo
function add_examples_code() {
  if (!catalogo_coded) {
    catalogo["examples"].forEach(e => {
      // Nota: O código original usava "../examples/" mas o index.js usava "../exemplos/".
      // Esta versão tenta ler de ambos para garantir retrocompatibilidade.
      let absPath = path.join(__dirname, "../examples/" + e.file);
      try {
        e["code"] = fs.readFileSync(absPath, { encoding: 'utf8', flag: 'r' });
      } catch (err) {
        try {
          let altPath = path.join(__dirname, "../exemplos/" + e.file);
          e["code"] = fs.readFileSync(altPath, { encoding: 'utf8', flag: 'r' });
        } catch (altErr) {
          console.log("MISSING FILE: " + e.file + " not found in 'examples' or 'exemplos'");
        }
      }
    });
    // Se não quiseres reler do disco a cada pedido, podes descomentar a linha abaixo:
    // catalogo_coded = 1;
  }
}

// 1. GET /api/examples
// Devolve a lista de todos os exemplos, suportando os filtros e ordenações originais (?orderBy=cat,dif)
router.get('/', function(req, res, next) {
  add_examples_code();

  let orderBy1 = req.query.orderBy?.split(',')[0];
  let orderBy2 = req.query.orderBy?.split(',')[1];
  let exemplos;

  if (orderBy1 === 'dif' || orderBy1 === 'cat') {
    // Categoriza os exemplos num objeto estruturado
    const result = {};
    catalogo["examples"].forEach(e => {
      let div = "undefined";
      if (orderBy1 === "dif") div = e.difficulty;
      else if (orderBy1 === "cat") div = e.category;
      
      if (div !== undefined && div !== null) {
        result[div] = result[div] ?? [];
        result[div].push(e);
      }
    });

    // Ordena as categorias alfa-numericamente
    exemplos = sortJson(result, { ignoreCase: true, reverse: false, depth: 1 });

    // Ordena os sub-elementos dentro de cada bloco de categoria
    for (let key in exemplos) {
      let arr = exemplos[key];
      if (orderBy2 === "dif") {
        arr.sort((a, b) => (a.difficulty ?? 0) - (b.difficulty ?? 0));
      } else if (orderBy2 === "cat") {
        arr.sort((a, b) => (a.category ?? "").localeCompare(b.category ?? ""));
      } else {
        arr.sort((a, b) => a.title.localeCompare(b.title));
      }
    }
  } else {
    // Ordenação padrão global por Título
    exemplos = [...catalogo["examples"]].sort((a, b) => a.title.localeCompare(b.title));
  }

  let order1 = "Title";
  if (orderBy1 === "dif") order1 = "Difficulty";
  else if (orderBy1 === "cat") order1 = "Category";

  let order2 = "Title";
  if (orderBy2 === "dif") order2 = "Difficulty";
  else if (orderBy2 === "cat") order2 = "Category";

  // Retorna os dados puros para o Vue tratar do design dos menus dropdown
  res.json({
    success: true,
    data: {
      exemplos: exemplos,
      order1: order1,
      order2: order2,
      orderBy1: orderBy1
    }
  });
});

// 2. GET /api/examples/categories/:cat
// Devolve os exemplos filtrados por uma categoria específica
router.get('/categories/:cat', function(req, res, next) {
  add_examples_code();

  let exemplos = catalogo["examples"]
    .filter(item => item.category === req.params.cat)
    .sort((a, b) => a.title.localeCompare(b.title));
  
  let order = "Title";
  if (req.query.orderBy === 'dif') {
    order = "Difficulty";
    const result = {};
    exemplos.forEach(e => {
      let div = e.difficulty ?? "undefined";
      result[div] = result[div] ?? [];
      result[div].push(e);
    });
    exemplos = sortJson(result, { ignoreCase: true, reverse: false, depth: 1 });
  }
    
  res.json({
    success: true,
    data: {
      category: req.params.cat,
      order: order,
      exemplos: exemplos
    }
  });
});

// 3. GET /api/examples/update
// Em vez de fazer redirect para a página antiga, limpa a cache e avisa o Vue que correu bem
router.get('/update', function(req, res, next) {
  catalogo_coded = 0;
  delete require.cache[require.resolve('../catalogo.json')];
  catalogo = require('../catalogo.json');

  res.json({
    success: true,
    message: "Catálogo de exemplos recarregado com sucesso a partir do disco."
  });
});

// 4. GET /api/examples/:title
// NOVO: Endpoint ideal para quando o utilizador quer abrir ou inspecionar um único exemplo pelo título
router.get('/:title', function(req, res, next) {
  add_examples_code();

  const exemplo = catalogo["examples"].find(
    e => e.title.toLowerCase() === req.params.title.toLowerCase()
  );

  if (!exemplo) {
    return res.status(404).json({
      success: false,
      message: "Exemplo não encontrado."
    });
  }

  res.json({
    success: true,
    data: {
      title: exemplo.title,
      category: e.category,
      difficulty: e.difficulty,
      description: e.description,
      code: exemplo.code
    }
  });
});

module.exports = router;