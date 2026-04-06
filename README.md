# 📺 DoramaRank

![Electron](https://img.shields.io/badge/Electron-191970?style=for-the-badge&logo=Electron&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-323330?style=for-the-badge&logo=javascript&logoColor=F7DF1E)
![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)
![Chart.js](https://img.shields.io/badge/Chart.js-FF6384?style=for-the-badge&logo=chartdotjs&logoColor=white)

O **DoramaRank** é um aplicativo desktop desenvolvido para gerenciar e catalogar doramas (séries asiáticas). Criado com foco na experiência do usuário (UX) e design responsivo, o sistema consome dados em tempo real e oferece um painel analítico completo do consumo de mídia.

## ✨ Funcionalidades Principais

* **Integração com API TMDB:** Busca automática de pôsteres, sinopses, total de episódios e elenco principal diretamente do The Movie Database.
* **Dashboard Analítico:** Painel de estatísticas interativo gerado com Chart.js, mostrando tempo total investido, distribuição de status e média de notas.
* **Banco de Dados Local:** Armazenamento offline seguro utilizando SQLite.
* **Temas Dinâmicos:** Personalização de interface em tempo real utilizando CSS Variables e LocalStorage.
* **Controle de Progresso:** Barra de progresso visual para acompanhar episódios assistidos e recurso de auto-completar ao finalizar uma série.

## 🚀 Como Executar o Projeto

Para rodar o projeto localmente na sua máquina, você precisará do [Node.js](https://nodejs.org/) instalado.

```bash
# Clone o repositório
git clone [https://github.com/AngeloJR-web/doramarank.git](https://github.com/AngeloJR-web/doramarank.git)

# Entre na pasta do projeto
cd doramarank

# Instale as dependências
npm install

# Rode o aplicativo em modo de desenvolvimento
npm start

📦 Download do Instalador (.exe)
Se você deseja apenas usar o aplicativo no Windows sem compilar o código, acesse a aba Releases e baixe a versão mais recente do arquivo DoramaRank Setup.exe.
