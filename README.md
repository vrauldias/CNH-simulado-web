# Simulado CNH (versão web)

## Acesse direto pelo navegador (sem baixar nada)

**🔗 [COLOQUE AQUI O LINK DO GITHUB PAGES]**

Abra o link acima em qualquer navegador (computador ou celular) e comece a
estudar na hora — nada para instalar ou baixar.

## O que tem aqui

Simulado gratuito para estudo da prova teórica da CNH, no estilo do **Banco
Nacional de Questões**. Roda inteiramente no navegador — sem servidor, sem
instalação.

| Recurso | Descrição |
|---|---|
| **Treino** | Sorteio ponderado: prioriza questões nunca vistas e questões erradas na última tentativa. Feedback imediato (certo/errado + comentário) a cada resposta. |
| **Simulado** | 30 questões, com navegação livre entre elas (dá para pular uma questão e voltar depois) — como no Moodle. Aprovação a partir de 21 acertos (70%). Ao enviar, mostra nota, tempo e revisão questão a questão. |
| **Placas ilustradas** | Questões que citam um código de placa (ex: `A-33a`) mostram a imagem oficial do sinal. |
| **Status** | Estatísticas de treino e histórico dos últimos simulados feitos. |
| **Info** | Página dentro do próprio site explicando como o material foi criado. |
| **Tema claro/escuro** | Segue a preferência do sistema, com alternância manual. |

Todo o progresso (treino e histórico de simulados) fica salvo no
`localStorage` do navegador — é local ao dispositivo/navegador usado, não é
sincronizado nem enviado a nenhum servidor.

## Como usar localmente (alternativa ao GitHub Pages)

1. Clone este repositório ou baixe todo o conteúdo da pasta (botão **Code →
   Download ZIP** no GitHub) e extraia em uma pasta no seu computador.
2. Abra o arquivo `index.html` (duplo clique) no navegador.

Pronto — os dados do banco de questões e das placas já estão embutidos em
arquivos `.js`, então funciona sem precisar de servidor nem internet.

## Estrutura do projeto

```
carteira-quiz-web/
├── index.html              # ponto de entrada
├── css/style.css           # estilos (tema claro/escuro)
├── js/app.js                # lógica do app (menu, treino, simulado, status, info)
├── assets/
│   ├── questoes.js         # banco de questões (gerado a partir do PDF oficial)
│   ├── placas-mapa.js      # mapa "código da placa" → arquivo de imagem
│   └── placas/             # imagens das placas (extraídas do Mosaico oficial)
├── LICENSE                 # GPLv3
└── README.md
```

## Fontes dos dados

- **Questões**: Banco Nacional de Questões (CNH do Brasil).
- **Placas**: Mosaico de Placas de Sinalização (CNH do Brasil / SERPRO),
  material complementar oficial do curso de primeira habilitação.

Este material deriva de conteúdo oficial de órgãos de trânsito; respeite os
termos de uso ao redistribuir ou adaptar. Mais detalhes sobre como o material
foi processado estão na página **Info** dentro do próprio site.

---

Adaptação web do projeto [brasil-cnh-quiz](https://github.com/AmiltonCabral/brasil-cnh-quiz), de Amilton Cabral (licença GPLv3 mantida).
