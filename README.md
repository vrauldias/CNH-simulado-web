# Carteira Quiz — Simulado CNH (versão web)

Simulado gratuito para estudo da prova teórica da CNH, no estilo do **Banco
Nacional de Questões**. Roda inteiramente no navegador — sem servidor, sem
instalação — e funciona tanto localmente (abrindo o `index.html`) quanto
publicado no GitHub Pages.

## Créditos

Este projeto é uma **adaptação para web (HTML/CSS/JS)** do app de terminal
[**brasil-cnh-quiz**](https://github.com/AmiltonCabral/brasil-cnh-quiz), criado
por **Amilton Cabral**. Todo o crédito pela ideia original, pela estrutura do
banco de questões e pela lógica de treino (sorteio ponderado por
acerto/erro) é dele — este repositório apenas porta a experiência do
terminal para uma interface web, com modo de simulado, placas ilustradas e
persistência via `localStorage`.

- Projeto original: <https://github.com/AmiltonCabral/brasil-cnh-quiz>
- Autor original: [Amilton Cabral](https://github.com/AmiltonCabral)

Por ser derivado de um projeto licenciado em GPLv3, este repositório
mantém a mesma licença — veja [`LICENSE`](./LICENSE).

## Funcionalidades

| Recurso | Descrição |
|---|---|
| **Treino** | Sorteio ponderado: prioriza questões nunca vistas e questões erradas na última tentativa, igual ao app original. Feedback imediato (certo/errado + comentário) a cada resposta. |
| **Simulado** | 30 questões sorteadas aleatoriamente, sem gabarito até o fim — como a prova real. Aprovação a partir de 21 acertos (70%). Ao final, mostra nota, tempo e revisão questão a questão. |
| **Placas ilustradas** | Questões que citam um código de placa (ex: `A-33a`) mostram a imagem oficial do sinal, extraída do *Mosaico de Placas de Sinalização* (fonte oficial CNH do Brasil / SERPRO). |
| **Status** | Estatísticas de treino (vistas, tentativas, acertos, taxa de acerto) e histórico dos últimos simulados feitos. |
| **Tema claro/escuro** | Segue a preferência do sistema, com alternância manual salva no navegador. |

Todo o progresso (treino e histórico de simulados) fica salvo no
`localStorage` do navegador — é local ao dispositivo/navegador usado, não é
sincronizado nem enviado a nenhum servidor.

## Estrutura do projeto

```
carteira-quiz-web/
├── index.html              # ponto de entrada
├── css/style.css           # estilos (tema claro/escuro)
├── js/app.js               # lógica do app (menu, treino, simulado, status)
├── assets/
│   ├── questoes.js         # banco de questões (gerado a partir do PDF oficial)
│   ├── placas-mapa.js      # mapa "código da placa" → arquivo de imagem
│   └── placas/             # imagens das placas (extraídas do Mosaico oficial)
├── LICENSE                 # GPLv3 (herdada do projeto original)
└── README.md
```

## Como usar localmente

Basta abrir o `index.html` no navegador (duplo clique) — os dados do banco
de questões e das placas estão embutidos em arquivos `.js`, então funciona
mesmo sem servidor.

Se preferir servir por HTTP (opcional):

```bash
python3 -m http.server 8000
# depois acesse http://localhost:8000
```

## Como publicar no GitHub Pages

1. Suba esta pasta inteira para um repositório no GitHub.
2. No repositório, vá em **Settings → Pages**.
3. Em **Source**, selecione a branch (ex: `main`) e a pasta `/ (root)`.
4. Salve. Em alguns minutos o site fica disponível em
   `https://<seu-usuario>.github.io/<nome-do-repositorio>/`.

## Fontes dos dados

- **Questões**: Banco Nacional de Questões (CNH do Brasil).
- **Placas**: Mosaico de Placas de Sinalização (CNH do Brasil / SERPRO),
  material complementar oficial do curso de primeira habilitação.

Este material deriva de conteúdo oficial de órgãos de trânsito; respeite os
termos de uso ao redistribuir ou adaptar.
