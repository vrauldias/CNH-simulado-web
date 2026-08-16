/*
 * Simulado CNH (versão web)
 * Porta em HTML/CSS/JS do app de terminal original, para uso direto no
 * navegador (GitHub Pages ou arquivo local). Progresso e histórico ficam
 * salvos no localStorage do navegador — não há backend.
 */
(function () {
  "use strict";

  var STORAGE_PROGRESSO = "carteiraQuiz.progresso.v1";
  var STORAGE_SIMULADOS = "carteiraQuiz.simulados.v1";
  var STORAGE_TEMA = "carteiraQuiz.tema.v1";
  var STORAGE_COMO_USAR_OCULTO = "carteiraQuiz.comoUsarOculto.v1";

  var TAMANHO_SIMULADO = 30;
  var NOTA_APROVACAO = Math.ceil(TAMANHO_SIMULADO * 0.7); // 21/30 (70%)
  var LETRAS = ["A", "B", "C", "D", "E", "F"];

  var progresso = carregarProgresso();
  var simulados = carregarSimulados();
  var sessao = null;
  var mensagemMenuPendente = null;

  var app = document.getElementById("app");

  // ---------- persistência ----------

  function carregarProgresso() {
    try {
      var raw = localStorage.getItem(STORAGE_PROGRESSO);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function salvarProgresso(p) {
    try {
      localStorage.setItem(STORAGE_PROGRESSO, JSON.stringify(p));
    } catch (e) {
      /* localStorage indisponível (modo privado, etc.) — segue sem salvar */
    }
  }

  function carregarSimulados() {
    try {
      var raw = localStorage.getItem(STORAGE_SIMULADOS);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function salvarSimulados(lista) {
    try {
      localStorage.setItem(STORAGE_SIMULADOS, JSON.stringify(lista));
    } catch (e) {
      /* ignora */
    }
  }

  // ---------- utilidades ----------

  function criarEl(tag, className, texto) {
    var elx = document.createElement(tag);
    if (className) elx.className = className;
    if (texto !== undefined && texto !== null) elx.textContent = texto;
    return elx;
  }

  function embaralhar(array) {
    var copia = array.slice();
    for (var i = copia.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copia[i];
      copia[i] = copia[j];
      copia[j] = tmp;
    }
    return copia;
  }

  function amostraAleatoria(array, n) {
    return embaralhar(array).slice(0, n);
  }

  function classeBadge(dificuldade) {
    var d = (dificuldade || "").toLowerCase();
    if (d.indexOf("fác") === 0 || d.indexOf("fac") === 0) return "badge-facil";
    if (d.indexOf("dif") === 0) return "badge-dificil";
    return "badge-intermediario";
  }

  function resolverPlacas(codigoPlaca) {
    if (!codigoPlaca) return [];
    var partes = codigoPlaca
      .split(/\s+e\s+|,|\//)
      .map(function (s) {
        return s.trim();
      })
      .filter(Boolean);
    var resultado = [];
    partes.forEach(function (parte) {
      var arquivo = PLACAS_MAPA[parte] || PLACAS_MAPA[parte + "a"];
      if (arquivo) resultado.push({ codigo: parte, arquivo: arquivo });
    });
    return resultado;
  }

  function formatarDuracao(segundos) {
    var m = Math.floor(segundos / 60);
    var s = segundos % 60;
    return m + " min " + (s < 10 ? "0" : "") + s + " s";
  }

  function formatarPercentual(p) {
    return p.toString().replace(".", ",") + "%";
  }

  function formatarData(iso) {
    var d = new Date(iso);
    return (
      d.toLocaleDateString("pt-BR") +
      " " +
      d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    );
  }

  function agregarStats() {
    var chaves = Object.keys(progresso);
    var tentativas = 0,
      acertos = 0,
      erros = 0;
    chaves.forEach(function (k) {
      var p = progresso[k];
      tentativas += p.tentativas || 0;
      acertos += p.acertos || 0;
      erros += p.erros || 0;
    });
    return { vistos: chaves.length, tentativas: tentativas, acertos: acertos, erros: erros };
  }

  function registrarResposta(id, acertou) {
    var chave = String(id);
    if (!progresso[chave]) progresso[chave] = { tentativas: 0, acertos: 0, erros: 0 };
    progresso[chave].tentativas += 1;
    progresso[chave].ultima_correta = acertou;
    if (acertou) progresso[chave].acertos += 1;
    else progresso[chave].erros += 1;
    salvarProgresso(progresso);
  }

  // ---------- tema claro/escuro ----------

  function temaEfetivo() {
    var atributo = document.documentElement.getAttribute("data-theme");
    if (atributo) return atributo;
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function aplicarIconeTema() {
    var icone = document.getElementById("icone-tema");
    if (icone) icone.textContent = temaEfetivo() === "dark" ? "☀️" : "🌙";
  }

  function inicializarTema() {
    var salvo = localStorage.getItem(STORAGE_TEMA);
    if (salvo) document.documentElement.setAttribute("data-theme", salvo);
    aplicarIconeTema();
    var btn = document.getElementById("btn-tema");
    if (btn) {
      btn.addEventListener("click", function () {
        var novo = temaEfetivo() === "dark" ? "light" : "dark";
        document.documentElement.setAttribute("data-theme", novo);
        try {
          localStorage.setItem(STORAGE_TEMA, novo);
        } catch (e) {
          /* ignora */
        }
        aplicarIconeTema();
      });
    }
  }

  // ---------- modal de confirmação ----------

  function confirmar(mensagem, onConfirmar) {
    var tpl = document.getElementById("tpl-modal");
    var node = tpl.content.cloneNode(true);
    var backdrop = node.querySelector(".modal-backdrop");
    node.querySelector(".modal-msg").textContent = mensagem;
    var cancelar = node.querySelector(".modal-cancelar");
    var confirmarBtn = node.querySelector(".modal-confirmar");

    function fechar() {
      backdrop.remove();
    }
    cancelar.addEventListener("click", fechar);
    backdrop.addEventListener("click", function (e) {
      if (e.target === backdrop) fechar();
    });
    confirmarBtn.addEventListener("click", function () {
      fechar();
      onConfirmar();
    });
    document.body.appendChild(backdrop);
  }

  // ---------- menu principal ----------

  function criarCardMenu(emoji, titulo, desc, onClick) {
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "menu-card";
    btn.addEventListener("click", onClick);
    btn.appendChild(criarEl("div", "menu-card-emoji", emoji));
    var textWrap = document.createElement("div");
    textWrap.appendChild(criarEl("div", "menu-card-title", titulo));
    textWrap.appendChild(criarEl("div", "menu-card-desc", desc));
    btn.appendChild(textWrap);
    return btn;
  }

  function criarBannerComoUsar() {
    var banner = criarEl("div", "banner-como-usar");
    banner.appendChild(criarEl("p", "banner-como-usar-titulo", "👋 Como usar"));
    banner.appendChild(
      criarEl(
        "p",
        null,
        "▶️ Treino: prática sem fim, priorizando questões que você errou ou ainda não viu. Corrige na hora."
      )
    );
    banner.appendChild(
      criarEl(
        "p",
        null,
        "📝 Simulado: " +
          TAMANHO_SIMULADO +
          " questões — dá pra pular e voltar quando quiser, e só corrige depois que você enviar, como numa prova real."
      )
    );
    banner.appendChild(criarEl("p", null, "Tudo fica salvo automaticamente neste navegador."));

    var acoes = criarEl("div", "banner-como-usar-acoes");
    var btnOcultar = criarEl("button", "btn btn-secundario", "Não mostrar novamente");
    btnOcultar.type = "button";
    btnOcultar.addEventListener("click", function () {
      try {
        localStorage.setItem(STORAGE_COMO_USAR_OCULTO, "1");
      } catch (e) {
        /* ignora */
      }
      renderMenu();
    });
    acoes.appendChild(btnOcultar);
    banner.appendChild(acoes);

    return banner;
  }

  function renderMenu() {
    sessao = null;
    app.innerHTML = "";

    var comoUsarOculto = false;
    try {
      comoUsarOculto = localStorage.getItem(STORAGE_COMO_USAR_OCULTO) === "1";
    } catch (e) {
      /* ignora */
    }
    if (!comoUsarOculto) {
      app.appendChild(criarBannerComoUsar());
    }

    if (mensagemMenuPendente) {
      app.appendChild(criarEl("div", "aviso-inline", mensagemMenuPendente));
      mensagemMenuPendente = null;
    }

    var grid = criarEl("div", "menu-grid");

    grid.appendChild(
      criarCardMenu(
        "▶️",
        "Continuar treino",
        "Pratica com prioridade para questões que você errou ou ainda não viu.",
        function () {
          iniciarTreino(false);
        }
      )
    );
    grid.appendChild(
      criarCardMenu("🆕", "Novo treino", "Zera as estatísticas de treino e começa do zero.", function () {
        confirmarNovoTreino();
      })
    );
    grid.appendChild(
      criarCardMenu(
        "📝",
        "Simulado (" + TAMANHO_SIMULADO + " questões)",
        "Simula a prova teórica: " + TAMANHO_SIMULADO + " questões sorteadas, sem gabarito até o fim.",
        iniciarSimulado
      )
    );
    grid.appendChild(
      criarCardMenu("📊", "Status", "Veja estatísticas de treino e seu histórico de simulados.", renderStatus)
    );
    var cardDeletar = criarCardMenu(
      "🗑️",
      "Deletar progresso",
      "Apaga o histórico de treino salvo neste navegador.",
      confirmarDeletarProgresso
    );
    cardDeletar.classList.add("perigo");
    grid.appendChild(cardDeletar);

    app.appendChild(grid);
  }

  function confirmarNovoTreino() {
    var stats = agregarStats();
    if (stats.tentativas === 0) {
      iniciarTreino(true);
      return;
    }
    confirmar("Isso apaga o progresso atual de treino e começa do zero. Confirma?", function () {
      iniciarTreino(true);
    });
  }

  function confirmarDeletarProgresso() {
    var stats = agregarStats();
    if (stats.tentativas === 0) {
      mensagemMenuPendente = "Não há progresso de treino salvo para apagar.";
      renderMenu();
      return;
    }
    confirmar(
      "Tem certeza que deseja apagar todo o progresso de treino? Isso não afeta o histórico de simulados.",
      function () {
        progresso = {};
        salvarProgresso(progresso);
        mensagemMenuPendente = "Progresso removido.";
        renderMenu();
      }
    );
  }

  // ---------- seleção ponderada de questão (modo treino) ----------

  function pesoQuestao(questao) {
    var p = progresso[String(questao.id)];
    if (!p) return 100;
    if (!p.ultima_correta) return 30;
    return 5;
  }

  function escolherQuestaoPonderada() {
    var total = 0;
    var pesos = QUESTOES.map(function (q) {
      var w = pesoQuestao(q);
      total += w;
      return w;
    });
    var r = Math.random() * total;
    for (var i = 0; i < QUESTOES.length; i++) {
      r -= pesos[i];
      if (r <= 0) return QUESTOES[i];
    }
    return QUESTOES[QUESTOES.length - 1];
  }

  // ---------- modo treino ----------

  function iniciarTreino(zerar) {
    if (zerar) {
      progresso = {};
      salvarProgresso(progresso);
    }
    sessao = { modo: "treino" };
    proximaQuestaoTreino();
    renderQuiz();
  }

  function proximaQuestaoTreino() {
    var questao = escolherQuestaoPonderada();
    sessao.questaoAtual = questao;
    sessao.alternativasAtuais = embaralhar([questao.correta].concat(questao.incorretas));
    sessao.respondida = false;
    sessao.escolhida = null;
  }

  function responderTreino(texto) {
    var questao = sessao.questaoAtual;
    var acertou = texto === questao.correta;
    sessao.escolhida = texto;
    sessao.respondida = true;
    registrarResposta(questao.id, acertou);
    renderQuiz();
  }

  // ---------- modo simulado ----------
  //
  // Navegação livre entre as 30 questões (como no Moodle): dá para pular uma
  // questão e voltar depois. sessao.respostas[i] guarda a alternativa
  // escolhida para a questão i (ou null se ainda não respondida). O envio é
  // uma ação explícita ("Enviar simulado"), separada de "avançar".

  function iniciarSimulado() {
    var questoesSimulado = amostraAleatoria(QUESTOES, TAMANHO_SIMULADO);
    sessao = {
      modo: "simulado",
      questoes: questoesSimulado,
      alternativasPorQuestao: questoesSimulado.map(function (q) {
        return embaralhar([q.correta].concat(q.incorretas));
      }),
      respostas: questoesSimulado.map(function () {
        return null;
      }),
      indiceAtual: 0,
      inicio: Date.now(),
      enviado: false,
      resultado: null,
    };
    renderQuiz();
  }

  function selecionarAlternativaSimulado(texto) {
    sessao.respostas[sessao.indiceAtual] = texto;
    renderQuiz();
  }

  function irParaQuestao(idx) {
    sessao.indiceAtual = idx;
    renderQuiz();
  }

  function irAnterior() {
    if (sessao.indiceAtual > 0) {
      sessao.indiceAtual -= 1;
      renderQuiz();
    }
  }

  function irProxima() {
    if (sessao.indiceAtual < sessao.questoes.length - 1) {
      sessao.indiceAtual += 1;
      renderQuiz();
    }
  }

  function confirmarEnvioSimulado() {
    var naoRespondidas = sessao.respostas.filter(function (r) {
      return r === null;
    }).length;
    var msg =
      naoRespondidas > 0
        ? "Ainda há " + naoRespondidas + " questão(ões) sem resposta. Enviar o simulado assim mesmo?"
        : "Enviar o simulado para correção? Não dá para alterar as respostas depois.";
    confirmar(msg, enviarSimulado);
  }

  function enviarSimulado() {
    var porQuestao = sessao.questoes.map(function (q, i) {
      var escolhida = sessao.respostas[i];
      var acertou = escolhida !== null && escolhida === q.correta;
      if (escolhida !== null) registrarResposta(q.id, acertou);
      return acertou;
    });

    var total = sessao.questoes.length;
    var acertos = porQuestao.filter(Boolean).length;
    var duracaoSeg = Math.round((Date.now() - sessao.inicio) / 1000);
    var percentual = Math.round((acertos / total) * 1000) / 10;
    var aprovado = acertos >= NOTA_APROVACAO;

    var registro = {
      data: new Date().toISOString(),
      acertos: acertos,
      total: total,
      percentual: percentual,
      aprovado: aprovado,
      duracaoSeg: duracaoSeg,
    };
    simulados.unshift(registro);
    simulados = simulados.slice(0, 20);
    salvarSimulados(simulados);

    sessao.enviado = true;
    sessao.resultado = { porQuestao: porQuestao, registro: registro };
    sessao.indiceAtual = 0;
    renderQuiz();
  }

  // ---------- navegador de questões (grade estilo Moodle) ----------

  function legendaItem(classe, texto) {
    var item = criarEl("span", "legenda-item");
    item.appendChild(criarEl("span", "legenda-quad " + classe));
    item.appendChild(document.createTextNode(texto));
    return item;
  }

  // Popover com a legenda de cores, aberto pelo ícone "ⓘ" ao lado de
  // "Questão X de N". Só um pode ficar aberto por vez; fecha ao clicar fora.
  var popoverLegendaAberto = null;

  function fecharPopoverLegenda() {
    if (popoverLegendaAberto) {
      popoverLegendaAberto.classList.remove("aberta");
      popoverLegendaAberto = null;
    }
  }

  function criarBotaoInfoLegenda(enviado) {
    var wrap = criarEl("span", "info-legenda-wrap");
    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-info-legenda";
    btn.setAttribute("aria-label", "O que significam as cores da navegação");
    btn.textContent = "ⓘ";

    var pop = criarEl("div", "popover-legenda");
    if (enviado) {
      pop.appendChild(legendaItem("nav-certa", "Certa"));
      pop.appendChild(legendaItem("nav-errada", "Errada ou em branco"));
    } else {
      pop.appendChild(legendaItem("nav-respondida", "Respondida"));
      pop.appendChild(legendaItem("nav-pendente", "Não respondida"));
    }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (popoverLegendaAberto === pop) {
        fecharPopoverLegenda();
        return;
      }
      fecharPopoverLegenda();
      pop.classList.add("aberta");
      popoverLegendaAberto = pop;
    });

    wrap.appendChild(btn);
    wrap.appendChild(pop);
    return wrap;
  }

  function renderNavegadorSimulado() {
    var wrap = document.createElement("div");
    wrap.className = "navegador-simulado";

    var cabecalho = criarEl("div", "navegador-cabecalho");
    cabecalho.appendChild(criarEl("span", "navegador-titulo", "Navegação"));
    if (!sessao.enviado) {
      var btnEnviar = criarEl("button", "btn btn-primario btn-enviar-simulado", "Enviar simulado");
      btnEnviar.type = "button";
      btnEnviar.addEventListener("click", confirmarEnvioSimulado);
      cabecalho.appendChild(btnEnviar);
    }
    wrap.appendChild(cabecalho);

    var grid = document.createElement("div");
    grid.className = "navegador-grid";
    sessao.questoes.forEach(function (q, i) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "nav-num";
      btn.textContent = String(i + 1);
      if (i === sessao.indiceAtual) btn.classList.add("atual");
      if (sessao.enviado) {
        btn.classList.add(sessao.resultado.porQuestao[i] ? "nav-certa" : "nav-errada");
      } else {
        btn.classList.add(sessao.respostas[i] !== null ? "nav-respondida" : "nav-pendente");
      }
      btn.setAttribute("aria-label", "Questão " + (i + 1));
      btn.addEventListener("click", function () {
        irParaQuestao(i);
      });
      grid.appendChild(btn);
    });
    wrap.appendChild(grid);

    return wrap;
  }

  // ---------- tela de questão (treino + simulado) ----------

  function renderPlacas(container, codigoPlaca) {
    if (!codigoPlaca) return;
    var imgs = resolverPlacas(codigoPlaca);
    if (imgs.length) {
      var wrap = criarEl("div", "placas-wrap");
      imgs.forEach(function (p) {
        var item = document.createElement("div");
        item.className = "placa-item";
        var img = document.createElement("img");
        img.src = "assets/placas/" + p.arquivo;
        img.alt = "Placa " + p.codigo;
        img.loading = "lazy";
        item.appendChild(img);
        item.appendChild(criarEl("div", "placa-codigo", p.codigo));
        wrap.appendChild(item);
      });
      container.appendChild(wrap);
    } else {
      container.appendChild(criarEl("div", "placa-texto-fallback", "Código da placa: " + codigoPlaca));
    }
  }

  function renderQuiz() {
    app.innerHTML = "";
    var ehSimulado = sessao.modo === "simulado";

    var header = criarEl("div", "tela-header");
    header.appendChild(
      criarEl("h2", "tela-titulo", ehSimulado ? "📝 Simulado" : "▶️ Modo treino")
    );
    if (ehSimulado && sessao.enviado) {
      var voltarMenu = criarEl("button", "link-voltar", "← Menu");
      voltarMenu.type = "button";
      voltarMenu.addEventListener("click", renderMenu);
      header.appendChild(voltarMenu);
    } else {
      var sair = criarEl("button", "link-voltar", ehSimulado ? "✕ Sair do simulado" : "✕ Encerrar treino");
      sair.type = "button";
      sair.addEventListener("click", function () {
        confirmar(
          ehSimulado ? "Sair agora descarta o simulado em andamento. Confirma?" : "Encerrar o treino e voltar ao menu?",
          renderMenu
        );
      });
      header.appendChild(sair);
    }
    app.appendChild(header);

    var questaoAtual, indiceAtual, totalAtual;

    if (ehSimulado) {
      indiceAtual = sessao.indiceAtual;
      totalAtual = sessao.questoes.length;
      questaoAtual = sessao.questoes[indiceAtual];

      if (sessao.enviado) {
        var reg = sessao.resultado.registro;
        var resumo = document.createElement("div");
        resumo.className = "resultado-topo resultado-topo-compacto";
        resumo.appendChild(criarEl("div", "resultado-percentual", formatarPercentual(reg.percentual)));
        resumo.appendChild(
          criarEl(
            "div",
            "resultado-fracao",
            reg.acertos + " de " + reg.total + " questões corretas · " + formatarDuracao(reg.duracaoSeg)
          )
        );
        var seloWrap = criarEl("div", "resultado-selo");
        seloWrap.appendChild(
          criarEl(
            "span",
            "pill-status " + (reg.aprovado ? "pill-aprovado" : "pill-reprovado"),
            reg.aprovado ? "✅ Aprovado" : "❌ Reprovado"
          )
        );
        resumo.appendChild(seloWrap);
        app.appendChild(resumo);

        var acoesResumo = criarEl("div", "acoes-resumo-simulado");
        var btnRefazer = criarEl("button", "btn btn-primario", "🔁 Refazer simulado");
        btnRefazer.type = "button";
        btnRefazer.addEventListener("click", iniciarSimulado);
        var btnMenu = criarEl("button", "btn btn-secundario", "Voltar ao menu");
        btnMenu.type = "button";
        btnMenu.addEventListener("click", renderMenu);
        acoesResumo.appendChild(btnRefazer);
        acoesResumo.appendChild(btnMenu);
        app.appendChild(acoesResumo);
      }

      var respondidasCount = sessao.respostas.filter(function (r) {
        return r !== null;
      }).length;

      if (!sessao.enviado) {
        var barraWrap = criarEl("div", "barra-progresso-wrap");
        var barra = criarEl("div", "barra-progresso");
        barra.style.width = Math.round((respondidasCount / totalAtual) * 100) + "%";
        barraWrap.appendChild(barra);
        app.appendChild(barraWrap);
      }

      var linhaInfo = criarEl("div", "questao-info-row");
      linhaInfo.appendChild(criarEl("span", null, "Questão " + (indiceAtual + 1) + " de " + totalAtual));
      linhaInfo.appendChild(criarBotaoInfoLegenda(sessao.enviado));
      app.appendChild(linhaInfo);
    } else {
      questaoAtual = sessao.questaoAtual;
      var stats = agregarStats();
      app.appendChild(criarEl("p", "meter-label", "Já respondidas nesta sessão de treino: " + stats.tentativas));
    }

    var card = document.createElement("div");
    card.className = "card-questao";

    card.appendChild(criarEl("span", "badge " + classeBadge(questaoAtual.dificuldade), questaoAtual.dificuldade || "—"));
    card.appendChild(criarEl("p", "pergunta-texto", questaoAtual.pergunta));
    renderPlacas(card, questaoAtual.codigo_placa);

    var lista = document.createElement("ul");
    lista.className = "alternativas";
    var alternativas = ehSimulado ? sessao.alternativasPorQuestao[indiceAtual] : sessao.alternativasAtuais;
    var escolhidaSimulado = ehSimulado ? sessao.respostas[indiceAtual] : null;

    alternativas.forEach(function (texto, idx) {
      var li = document.createElement("li");
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "alt-btn";
      btn.appendChild(criarEl("span", "alt-letra", LETRAS[idx]));
      btn.appendChild(criarEl("span", null, texto));

      if (ehSimulado) {
        if (sessao.enviado) {
          btn.disabled = true;
          if (texto === questaoAtual.correta) btn.classList.add("correta");
          else if (texto === escolhidaSimulado) btn.classList.add("incorreta");
          else btn.classList.add("neutra-desabilitada");
        } else {
          if (escolhidaSimulado === texto) btn.classList.add("selecionada");
          btn.addEventListener("click", function () {
            selecionarAlternativaSimulado(texto);
          });
        }
      } else if (sessao.respondida) {
        btn.disabled = true;
        if (texto === questaoAtual.correta) btn.classList.add("correta");
        else if (texto === sessao.escolhida) btn.classList.add("incorreta");
        else btn.classList.add("neutra-desabilitada");
      } else {
        btn.addEventListener("click", function () {
          responderTreino(texto);
        });
      }
      li.appendChild(btn);
      lista.appendChild(li);
    });
    card.appendChild(lista);

    if (!ehSimulado && sessao.respondida) {
      var acertouTreino = sessao.escolhida === questaoAtual.correta;
      var painel = document.createElement("div");
      painel.className = "painel-resultado " + (acertouTreino ? "acerto" : "erro");
      painel.appendChild(
        criarEl("p", "painel-resultado-titulo", acertouTreino ? "✅ Resposta correta!" : "❌ Resposta incorreta")
      );
      if (!acertouTreino) {
        painel.appendChild(criarEl("p", "painel-resultado-comentario", "Alternativa correta: " + questaoAtual.correta));
      }
      painel.appendChild(criarEl("p", "painel-resultado-comentario", questaoAtual.comentario));
      card.appendChild(painel);

      var acoesTreino = criarEl("div", "acoes-questao");
      acoesTreino.appendChild(document.createElement("span"));
      var btnProx = criarEl("button", "btn btn-primario", "Próxima questão →");
      btnProx.type = "button";
      btnProx.addEventListener("click", function () {
        proximaQuestaoTreino();
        renderQuiz();
      });
      acoesTreino.appendChild(btnProx);
      card.appendChild(acoesTreino);
    }

    if (ehSimulado && sessao.enviado) {
      var acertouSim = sessao.resultado.porQuestao[indiceAtual];
      var painelSim = document.createElement("div");
      painelSim.className = "painel-resultado " + (acertouSim ? "acerto" : "erro");
      painelSim.appendChild(
        criarEl(
          "p",
          "painel-resultado-titulo",
          acertouSim ? "✅ Você acertou" : escolhidaSimulado === null ? "❌ Questão em branco" : "❌ Você errou"
        )
      );
      if (!acertouSim) {
        painelSim.appendChild(criarEl("p", "painel-resultado-comentario", "Alternativa correta: " + questaoAtual.correta));
      }
      painelSim.appendChild(criarEl("p", "painel-resultado-comentario", questaoAtual.comentario));
      card.appendChild(painelSim);
    }

    if (ehSimulado) {
      var acoesSim = criarEl("div", "acoes-questao");
      var btnAnterior = criarEl("button", "btn btn-secundario", "← Anterior");
      btnAnterior.type = "button";
      btnAnterior.disabled = indiceAtual === 0;
      btnAnterior.addEventListener("click", irAnterior);
      acoesSim.appendChild(btnAnterior);

      var btnProxima = criarEl("button", "btn btn-primario", "Próxima →");
      btnProxima.type = "button";
      btnProxima.disabled = indiceAtual === totalAtual - 1;
      btnProxima.addEventListener("click", irProxima);
      acoesSim.appendChild(btnProxima);

      card.appendChild(acoesSim);
    }

    app.appendChild(card);

    if (ehSimulado) {
      app.appendChild(renderNavegadorSimulado());
    }
  }

  // ---------- status ----------

  function criarTile(label, value) {
    var tile = document.createElement("div");
    tile.className = "stat-tile";
    tile.appendChild(criarEl("div", "stat-tile-label", label));
    tile.appendChild(criarEl("div", "stat-tile-value", String(value)));
    return tile;
  }

  function renderStatus() {
    sessao = null;
    app.innerHTML = "";

    var header = criarEl("div", "tela-header");
    header.appendChild(criarEl("h2", "tela-titulo", "📊 Status"));
    var voltar = criarEl("button", "link-voltar", "← Menu");
    voltar.type = "button";
    voltar.addEventListener("click", renderMenu);
    header.appendChild(voltar);
    app.appendChild(header);

    var stats = agregarStats();
    var totalBanco = QUESTOES.length;
    var naoVistas = totalBanco - stats.vistos;
    var taxa = stats.tentativas ? (stats.acertos / stats.tentativas) * 100 : 0;

    var grid = document.createElement("div");
    grid.className = "stat-grid";
    grid.appendChild(criarTile("Questões no banco", totalBanco));
    grid.appendChild(criarTile("Já vistas", stats.vistos));
    grid.appendChild(criarTile("Ainda não vistas", naoVistas));
    grid.appendChild(criarTile("Tentativas", stats.tentativas));
    grid.appendChild(criarTile("Acertos", stats.acertos));
    grid.appendChild(criarTile("Erros", stats.erros));
    app.appendChild(grid);

    var meterWrap = document.createElement("div");
    meterWrap.className = "meter-wrap";
    var label = document.createElement("div");
    label.className = "meter-label";
    label.appendChild(document.createTextNode("Taxa de acerto (treino)"));
    var val = document.createElement("span");
    val.textContent = taxa.toFixed(1) + "%";
    label.appendChild(val);
    meterWrap.appendChild(label);
    var track = document.createElement("div");
    track.className = "meter-track";
    var fill = document.createElement("div");
    fill.className = "meter-fill";
    fill.style.width = Math.min(100, taxa) + "%";
    track.appendChild(fill);
    meterWrap.appendChild(track);
    app.appendChild(meterWrap);

    app.appendChild(criarEl("h3", "secao-titulo", "Histórico de simulados"));
    if (!simulados.length) {
      app.appendChild(criarEl("p", "estado-vazio", "Você ainda não fez nenhum simulado."));
    } else {
      var wrap = document.createElement("div");
      wrap.className = "tabela-wrap";
      var table = document.createElement("table");
      table.className = "tabela-simulados";
      var thead = document.createElement("thead");
      thead.innerHTML = "<tr><th>Data</th><th>Acertos</th><th>%</th><th>Duração</th><th>Resultado</th></tr>";
      table.appendChild(thead);
      var tbody = document.createElement("tbody");
      simulados.forEach(function (s) {
        var tr = document.createElement("tr");
        tr.appendChild(criarEl("td", null, formatarData(s.data)));
        tr.appendChild(criarEl("td", null, s.acertos + "/" + s.total));
        tr.appendChild(criarEl("td", null, formatarPercentual(s.percentual)));
        tr.appendChild(criarEl("td", null, formatarDuracao(s.duracaoSeg)));
        var tdStatus = document.createElement("td");
        tdStatus.appendChild(
          criarEl("span", "pill-status " + (s.aprovado ? "pill-aprovado" : "pill-reprovado"), s.aprovado ? "Aprovado" : "Reprovado")
        );
        tr.appendChild(tdStatus);
        tbody.appendChild(tr);
      });
      table.appendChild(tbody);
      wrap.appendChild(table);
      app.appendChild(wrap);
    }
  }

  // ---------- info (sobre o projeto) ----------

  function criarSecaoInfo(titulo, elementos) {
    var secao = criarEl("div", "info-secao");
    secao.appendChild(criarEl("h3", "secao-titulo", titulo));
    elementos.forEach(function (el) {
      secao.appendChild(el);
    });
    return secao;
  }

  function criarLink(texto, url) {
    var a = document.createElement("a");
    a.href = url;
    a.textContent = texto;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    return a;
  }

  function criarParagrafo(partes) {
    var p = criarEl("p", "info-texto");
    partes.forEach(function (parte) {
      if (typeof parte === "string") p.appendChild(document.createTextNode(parte));
      else p.appendChild(parte);
    });
    return p;
  }

  function renderInfo() {
    sessao = null;
    app.innerHTML = "";

    var header = criarEl("div", "tela-header");
    header.appendChild(criarEl("h2", "tela-titulo", "ℹ️ Sobre o projeto"));
    var voltar = criarEl("button", "link-voltar", "← Menu");
    voltar.type = "button";
    voltar.addEventListener("click", renderMenu);
    header.appendChild(voltar);
    app.appendChild(header);

    app.appendChild(
      criarSecaoInfo("Como o material foi criado", [
        criarParagrafo([
          "As ",
          String(QUESTOES.length),
          " questões vêm do PDF oficial “Banco Nacional de Questões” (CNH do Brasil). Um script " +
            "processou automaticamente cada questão do documento — enunciado, dificuldade, alternativas e " +
            "comentário — e gerou o banco de dados usado pelo treino e pelo simulado.",
        ]),
        criarParagrafo([
          "As imagens das placas foram extraídas do PDF oficial “Mosaico de Placas de Sinalização” " +
            "(CNH do Brasil / SERPRO), material complementar do curso de primeira habilitação: cada código " +
            "de placa (ex.: A-33a) foi localizado e recortado da posição correspondente no mosaico.",
        ]),
        criarParagrafo([
          "Todo o progresso de treino e o histórico de simulados ficam salvos apenas neste navegador " +
            "(localStorage) — nada é enviado a servidores.",
        ]),
      ])
    );

    app.appendChild(
      criarSecaoInfo("Créditos", [
        criarParagrafo([
          "Esta versão web é uma adaptação (HTML/CSS/JS) do app de terminal ",
          criarLink("brasil-cnh-quiz", "https://github.com/AmiltonCabral/brasil-cnh-quiz"),
          ", criado por Amilton Cabral. A ideia original, a estrutura do banco de questões e a lógica de " +
            "treino ponderado por acerto/erro são dele.",
        ]),
        criarParagrafo([
          "Por ser derivado de um projeto licenciado em GPLv3, este projeto mantém a mesma licença.",
        ]),
      ])
    );

    var comoUsarOculto = false;
    try {
      comoUsarOculto = localStorage.getItem(STORAGE_COMO_USAR_OCULTO) === "1";
    } catch (e) {
      /* ignora */
    }
    if (comoUsarOculto) {
      var btnMostrar = criarEl("button", "btn btn-secundario", "🔁 Mostrar de novo o aviso “Como usar” no menu");
      btnMostrar.type = "button";
      btnMostrar.addEventListener("click", function () {
        try {
          localStorage.removeItem(STORAGE_COMO_USAR_OCULTO);
        } catch (e) {
          /* ignora */
        }
        renderMenu();
      });
      app.appendChild(criarSecaoInfo("Preferências", [btnMostrar]));
    }
  }

  function irParaInfo() {
    if (sessao && sessao.modo === "simulado" && !sessao.enviado) {
      confirmar("Sair agora descarta o simulado em andamento. Confirma?", renderInfo);
    } else {
      renderInfo();
    }
  }

  // ---------- boot ----------

  document.addEventListener("click", fecharPopoverLegenda);

  document.addEventListener("DOMContentLoaded", function () {
    inicializarTema();
    var btnInfo = document.getElementById("btn-info");
    if (btnInfo) btnInfo.addEventListener("click", irParaInfo);
    renderMenu();
  });
})();
