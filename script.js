const { ipcRenderer } = require('electron');

// A chave do TMDB fica em config.js, que não vai para o git. O modelo está em config.example.js.
const TMDB_API_KEY = window.CONFIG?.TMDB_API_KEY ?? '';

// --- ELEMENTOS DO DOM ---
const root = document.documentElement;
const sidebarImg = document.getElementById('sidebar-img');
const sidebarNome = document.getElementById('sidebar-nome');
const inputNomePerfil = document.getElementById('input-nome-perfil');
const btnSalvarNome = document.getElementById('btn-salvar-nome');
const tituloPagina = document.getElementById('titulo-pagina');

const modalForm = document.getElementById('modal-dorama');
const modalDetalhes = document.getElementById('modal-detalhes');
const btnAbrirModal = document.getElementById('btn-abrir-modal');
const btnFecharModalForm = document.getElementById('btn-fechar-modal');
const btnFecharModalDetalhes = document.getElementById('btn-fechar-detalhes');

const formDorama = document.getElementById('form-dorama');
const gridDoramas = document.getElementById('grid-doramas');
const containerFiltros = document.getElementById('container-filtros');
const dashboardContainer = document.getElementById('dashboard-container');
const inputId = document.getElementById('dorama-id');
const modalTitulo = document.getElementById('modal-titulo');
const inputBusca = document.getElementById('input-busca');
const selectOrdenacao = document.getElementById('filtro-ordenacao');
const btnBuscarApi = document.getElementById('btn-buscar-api');

const menuInicio = document.getElementById('menu-inicio');
const menuTop10 = document.getElementById('menu-top10');
const menuAssistindo = document.getElementById('menu-assistindo');
const menuPerfil = document.getElementById('menu-perfil'); 

let doramas = [];
let filtroSidebarAtual = 'inicio'; 
let meuGrafico = null; 

// --- SISTEMA DE NOME E PERFIL ---
function atualizarPerfilUsuario(nome, corTemaHex) {
    const nomeFinal = nome || 'Usuário';
    localStorage.setItem('doramaUserName', nomeFinal);
    
    sidebarNome.innerText = nomeFinal;
    inputNomePerfil.value = nomeFinal;
    
    const corFundo = (corTemaHex || '#e11d48').replace('#', '');
    sidebarImg.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(nomeFinal)}&background=${corFundo}&color=fff&bold=true`;
    
    if (filtroSidebarAtual === 'perfil') {
        tituloPagina.innerText = `Estatísticas de ${nomeFinal}`;
    }
}

btnSalvarNome.addEventListener('click', () => {
    const novoNome = inputNomePerfil.value.trim();
    if (novoNome) {
        const corAtual = localStorage.getItem('doramaTemaCor') || '#e11d48';
        atualizarPerfilUsuario(novoNome, corAtual);
        
        const iconeOriginal = btnSalvarNome.innerHTML;
        btnSalvarNome.innerHTML = '<i class="ph-bold ph-thumbs-up"></i>';
        btnSalvarNome.style.background = '#10b981';
        setTimeout(() => {
            btnSalvarNome.innerHTML = iconeOriginal;
            btnSalvarNome.style.background = 'var(--primary)';
        }, 1500);
    }
});

// --- SISTEMA DE TEMAS (CORES DINÂMICAS) ---
function aplicarTema(cor, glow) {
    root.style.setProperty('--primary', cor);
    root.style.setProperty('--primary-glow', glow);
    localStorage.setItem('doramaTemaCor', cor);
    localStorage.setItem('doramaTemaGlow', glow);

    document.querySelectorAll('.color-btn').forEach(btn => {
        if(btn.dataset.color === cor) btn.classList.add('active');
        else btn.classList.remove('active');
    });

    const nomeAtual = localStorage.getItem('doramaUserName') || 'Usuário';
    atualizarPerfilUsuario(nomeAtual, cor);
}

const temaSalvo = localStorage.getItem('doramaTemaCor');
const glowSalvo = localStorage.getItem('doramaTemaGlow');
const nomeSalvo = localStorage.getItem('doramaUserName');

if (temaSalvo && glowSalvo) aplicarTema(temaSalvo, glowSalvo);
atualizarPerfilUsuario(nomeSalvo || 'Angelo', temaSalvo || '#e11d48'); 

document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        aplicarTema(btn.dataset.color, btn.dataset.glow);
    });
});

// --- LÓGICA DA API E DORAMAS ---
btnBuscarApi.addEventListener('click', async () => {
    const tituloDorama = document.getElementById('titulo').value.trim();
    if (!tituloDorama) return alert('Digite o título antes de buscar!');
    if (!TMDB_API_KEY) return alert('Coloque sua chave do TMDB no arquivo config.js. O README explica como.');

    btnBuscarApi.innerHTML = '<i class="ph ph-spinner ph-spin"></i>';

    try {
        const urlBusca = `https://api.themoviedb.org/3/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(tituloDorama)}&language=pt-BR`;
        const resBusca = await fetch(urlBusca);
        const dadosBusca = await resBusca.json();

        if (dadosBusca.results && dadosBusca.results.length > 0) {
            const idDorama = dadosBusca.results[0].id;
            
            const urlDetalhes = `https://api.themoviedb.org/3/tv/${idDorama}?api_key=${TMDB_API_KEY}&language=pt-BR&append_to_response=credits`;
            const resDetalhes = await fetch(urlDetalhes);
            const dadosDetalhes = await resDetalhes.json();

            if (dadosDetalhes.poster_path) document.getElementById('imagem').value = `https://image.tmdb.org/t/p/w600_and_h900_bestv2${dadosDetalhes.poster_path}`;
            document.getElementById('titulo').value = dadosDetalhes.name;
            document.getElementById('sinopse').value = dadosDetalhes.overview || "Sinopse não disponível em português.";
            document.getElementById('episodios').value = dadosDetalhes.number_of_episodes || "";
            document.getElementById('episodios_assistidos').value = "0"; 

            let elencoFormatado = [];
            if (dadosDetalhes.credits && dadosDetalhes.credits.cast) {
                const castBruto = dadosDetalhes.credits.cast.slice(0, 8);
                elencoFormatado = castBruto.map(ator => ({
                    nome: ator.name,
                    personagem: ator.character,
                    foto: ator.profile_path ? `https://image.tmdb.org/t/p/w200${ator.profile_path}` : null
                }));
            }
            
            document.getElementById('elenco').value = JSON.stringify(elencoFormatado);

        } else {
            alert('Nenhum dorama encontrado.');
        }
    } catch (erro) {
        console.error("Erro no TMDB:", erro);
        alert('Erro ao conectar com a API.');
    } finally {
        btnBuscarApi.innerHTML = '<i class="ph-bold ph-magnifying-glass"></i>';
    }
});

function alterarAba(novaAba, evento, titulo) {
    if (evento) evento.preventDefault(); 
    
    document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
    document.getElementById('menu-perfil').classList.remove('active');
    
    if (novaAba === 'perfil') document.getElementById('menu-perfil').classList.add('active');
    else evento.currentTarget.classList.add('active');

    filtroSidebarAtual = novaAba;
    
    if(novaAba === 'perfil') {
        const nomeAtual = localStorage.getItem('doramaUserName') || 'Usuário';
        tituloPagina.innerText = `Estatísticas de ${nomeAtual}`;
    } else {
        tituloPagina.innerText = titulo;
    }

    if (novaAba === 'perfil') {
        gridDoramas.style.display = 'none';
        containerFiltros.style.display = 'none';
        dashboardContainer.style.display = 'flex';
        renderizarDashboard(); 
    } else {
        gridDoramas.style.display = 'grid';
        containerFiltros.style.display = 'block';
        dashboardContainer.style.display = 'none';
        
        if (novaAba === 'top10') {
            selectOrdenacao.value = 'maior-nota';
            selectOrdenacao.disabled = true; 
        } else {
            selectOrdenacao.disabled = false;
        }
        inputBusca.value = '';
        atualizarTela();
    }
}

menuInicio.addEventListener('click', (e) => alterarAba('inicio', e, 'Sua Coleção'));
menuTop10.addEventListener('click', (e) => alterarAba('top10', e, 'Meu Top 10'));
menuAssistindo.addEventListener('click', (e) => alterarAba('assistindo', e, 'Assistindo Atualmente'));
menuPerfil.addEventListener('click', (e) => alterarAba('perfil', e, '')); 

function renderizarDashboard() {
    const totalDoramas = doramas.length;
    const doramasComNota = doramas.filter(d => d.nota > 0);
    const somaNotas = doramasComNota.reduce((acc, d) => acc + d.nota, 0);
    const mediaGeral = doramasComNota.length > 0 ? (somaNotas / doramasComNota.length).toFixed(1) : "0.0";
    const totalEpsAssistidos = doramas.reduce((acc, d) => acc + (d.episodios_assistidos || 0), 0);
    
    let tempoFormatado = `${totalEpsAssistidos}h`;
    if (totalEpsAssistidos > 24) {
        const dias = Math.floor(totalEpsAssistidos / 24);
        const horas = totalEpsAssistidos % 24;
        tempoFormatado = `${dias}d ${horas}h`;
    }

    document.getElementById('dash-total').innerText = totalDoramas;
    document.getElementById('dash-media').innerText = mediaGeral;
    document.getElementById('dash-eps').innerText = totalEpsAssistidos;
    document.getElementById('dash-tempo').innerText = tempoFormatado;

    const statusCount = {
        'Finalizado': doramas.filter(d => d.status === 'Finalizado').length,
        'Assistindo': doramas.filter(d => d.status === 'Assistindo').length,
        'Quero Assistir': doramas.filter(d => d.status === 'Quero Assistir').length,
        'Dropado': doramas.filter(d => d.status === 'Dropado').length
    };

    const ctx = document.getElementById('graficoStatus').getContext('2d');
    if (meuGrafico) meuGrafico.destroy();

    meuGrafico = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Finalizado', 'Assistindo', 'Quero Assistir', 'Dropado'],
            datasets: [{
                data: [statusCount['Finalizado'], statusCount['Assistindo'], statusCount['Quero Assistir'], statusCount['Dropado']],
                backgroundColor: ['#10b981', '#3b82f6', '#fbbf24', '#ef4444'],
                borderWidth: 0,
                hoverOffset: 4
            }]
        },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#a1a1aa', padding: 20 } } } }
    });
}

function abrirModalForm() {
    formDorama.reset();
    inputId.value = '';
    document.getElementById('elenco').value = '';
    modalTitulo.innerText = 'Adicionar Dorama';
    modalForm.classList.add('active');
    setTimeout(() => document.getElementById('titulo').focus(), 100);
}

function fecharModais() {
    modalForm.classList.remove('active');
    modalDetalhes.classList.remove('active');
    formDorama.reset();
}

function abrirModalEdicao(id) {
    const dorama = doramas.find(d => d.id === id);
    if (!dorama) return;

    inputId.value = dorama.id;
    document.getElementById('titulo').value = dorama.titulo;
    document.getElementById('nota').value = dorama.nota;
    document.getElementById('status').value = dorama.status;
    document.getElementById('imagem').value = dorama.img;
    document.getElementById('sinopse').value = dorama.sinopse || '';
    document.getElementById('episodios').value = dorama.episodios || '';
    document.getElementById('episodios_assistidos').value = dorama.episodios_assistidos || 0;
    document.getElementById('elenco').value = dorama.elenco || '';
    
    modalTitulo.innerText = 'Editar Dorama';
    modalForm.classList.add('active');
    setTimeout(() => document.getElementById('titulo').focus(), 100);
}

function abrirModalDetalhes(id) {
    const dorama = doramas.find(d => d.id === id);
    if (!dorama) return;

    const imagemFallback = dorama.img ? dorama.img : `https://ui-avatars.com/api/?name=${dorama.titulo}&background=e11d48&color=fff&size=512`;

    document.getElementById('detalhes-img').src = imagemFallback;
    document.getElementById('detalhes-titulo').innerText = dorama.titulo;
    document.getElementById('detalhes-nota').innerText = dorama.nota.toFixed(1);
    document.getElementById('detalhes-status').innerText = dorama.status;
    
    const totalEps = dorama.episodios ? dorama.episodios : '?';
    document.getElementById('detalhes-episodios').innerText = `${dorama.episodios_assistidos || 0} / ${totalEps} eps`;
    document.getElementById('detalhes-sinopse').innerText = dorama.sinopse || "Nenhuma sinopse cadastrada.";

    const containerElenco = document.getElementById('detalhes-elenco');
    containerElenco.innerHTML = ''; 

    if (dorama.elenco) {
        try {
            const elencoArray = JSON.parse(dorama.elenco); 
            if (elencoArray.length > 0) {
                elencoArray.forEach(ator => {
                    const fotoAtor = ator.foto ? ator.foto : `https://ui-avatars.com/api/?name=${ator.nome}&background=334155&color=fff`;
                    const divAtor = document.createElement('div');
                    divAtor.classList.add('elenco-item');
                    divAtor.innerHTML = `
                        <img src="${fotoAtor}" alt="${ator.nome}" class="elenco-img">
                        <span class="elenco-nome">${ator.nome}</span>
                        <span class="elenco-personagem">${ator.personagem}</span>
                    `;
                    containerElenco.appendChild(divAtor);
                });
            } else {
                containerElenco.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Elenco não informado.</p>';
            }
        } catch (e) {
            containerElenco.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Erro ao carregar o elenco.</p>';
        }
    } else {
        containerElenco.innerHTML = '<p style="color: var(--text-muted); font-size: 0.9rem;">Elenco não informado.</p>';
    }

    modalDetalhes.classList.add('active');
}

async function adicionarEpisodioRápido(id) {
    const dorama = doramas.find(d => d.id === id);
    if (!dorama) return;

    dorama.episodios_assistidos = (dorama.episodios_assistidos || 0) + 1;

    if (dorama.episodios > 0 && dorama.episodios_assistidos >= dorama.episodios) {
        dorama.episodios_assistidos = dorama.episodios; 
        dorama.status = 'Finalizado';
        alert(`🎉 Parabéns! Você finalizou ${dorama.titulo}!`);
    }

    try {
        const doramaAtualizado = await ipcRenderer.invoke('update-dorama', dorama);
        const index = doramas.findIndex(d => d.id === doramaAtualizado.id);
        doramas[index] = doramaAtualizado;
        atualizarTela();
    } catch (erro) {
        console.error(erro);
    }
}

async function apagarDorama(id) {
    if (confirm("Tens a certeza que desejas apagar este dorama do teu ranking?")) {
        try {
            await ipcRenderer.invoke('delete-dorama', id);
            doramas = doramas.filter(d => d.id !== id);
            if (filtroSidebarAtual === 'perfil') renderizarDashboard();
            else atualizarTela();
        } catch (erro) {
            console.error(erro);
        }
    }
}

btnAbrirModal.addEventListener('click', abrirModalForm);
btnFecharModalForm.addEventListener('click', fecharModais);
btnFecharModalDetalhes.addEventListener('click', fecharModais);

modalForm.addEventListener('click', (e) => { if (e.target === modalForm) fecharModais(); });
modalDetalhes.addEventListener('click', (e) => { if (e.target === modalDetalhes) fecharModais(); });

function atualizarTela() {
    let listaProcessada = [...doramas];

    if (filtroSidebarAtual === 'assistindo') listaProcessada = listaProcessada.filter(d => d.status === 'Assistindo');
    const termo = inputBusca.value.toLowerCase();
    if (termo) listaProcessada = listaProcessada.filter(d => d.titulo.toLowerCase().includes(termo));

    const criterio = selectOrdenacao.value;
    if (criterio === 'maior-nota' || filtroSidebarAtual === 'top10') listaProcessada.sort((a, b) => b.nota - a.nota);
    else if (criterio === 'recentes') listaProcessada.sort((a, b) => b.id - a.id);
    else if (criterio === 'alfabetica') listaProcessada.sort((a, b) => a.titulo.localeCompare(b.titulo));

    if (filtroSidebarAtual === 'top10') listaProcessada = listaProcessada.slice(0, 10);
    renderizarDoramas(listaProcessada);
}

inputBusca.addEventListener('input', atualizarTela);
selectOrdenacao.addEventListener('change', atualizarTela);

function renderizarDoramas(lista) {
    gridDoramas.innerHTML = ''; 
    if (lista.length === 0) {
        gridDoramas.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: var(--text-muted);"><p>Nenhum dorama encontrado.</p></div>`;
        return;
    }

    lista.forEach((dorama, index) => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.style.animationDelay = `${index * 0.05}s`; 
        
        const imagemSrc = dorama.img ? dorama.img : `https://ui-avatars.com/api/?name=${encodeURIComponent(dorama.titulo)}&background=e11d48&color=fff&size=512`;
        let rankingBadge = '';
        if (filtroSidebarAtual === 'top10') {
            const cores = ['#fbbf24', '#9ca3af', '#cd7f32']; 
            const cor = index < 3 ? cores[index] : 'rgba(255,255,255,0.2)';
            rankingBadge = `<div style="position: absolute; top: -10px; left: -10px; background: ${cor}; width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 1.2rem; color: white; z-index: 30; box-shadow: 0 4px 10px rgba(0,0,0,0.5); border: 3px solid var(--bg-panel);">#${index + 1}</div>`;
        }

        let percentual = 0;
        let btnPlusOneHTML = '';
        if (dorama.episodios && dorama.episodios > 0) {
            percentual = ((dorama.episodios_assistidos || 0) / dorama.episodios) * 100;
            if (percentual > 100) percentual = 100;
            if (dorama.status === 'Assistindo' && (dorama.episodios_assistidos || 0) < dorama.episodios) {
                btnPlusOneHTML = `<button class="btn-icon plus" title="Assisti +1 Episódio"><i class="ph-bold ph-plus"></i></button>`;
            }
        } else if (dorama.status === 'Assistindo') {
            btnPlusOneHTML = `<button class="btn-icon plus" title="Assisti +1 Episódio"><i class="ph-bold ph-plus"></i></button>`;
        }

        const totalEpsDisplay = dorama.episodios ? dorama.episodios : '?';

        card.innerHTML = `
            <div class="card-img-container">
                ${rankingBadge}
                <div class="card-actions">
                    ${btnPlusOneHTML}
                    <button class="btn-icon edit" title="Editar"><i class="ph ph-pencil-simple"></i></button>
                    <button class="btn-icon delete" title="Apagar"><i class="ph ph-trash"></i></button>
                </div>
                <div class="nota-badge"><i class="ph-fill ph-star"></i> ${dorama.nota.toFixed(1)}</div>
                <img src="${imagemSrc}" alt="Capa">
                <div class="progress-container"><div class="progress-bar" style="width: ${percentual}%"></div></div>
                <div class="card-info">
                    <h3>${dorama.titulo}</h3>
                    <div style="display: flex; gap: 8px; margin-top: 4px;">
                        <span class="status-badge">${dorama.status}</span>
                        <span class="status-badge" style="background: rgba(255,255,255,0.05);">${dorama.episodios_assistidos || 0}/${totalEpsDisplay}</span>
                    </div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => abrirModalDetalhes(dorama.id));

        const btnEdit = card.querySelector('.edit');
        const btnDelete = card.querySelector('.delete');
        const btnPlus = card.querySelector('.plus');

        btnEdit.addEventListener('click', (e) => { e.stopPropagation(); abrirModalEdicao(dorama.id); });
        btnDelete.addEventListener('click', (e) => { e.stopPropagation(); apagarDorama(dorama.id); });
        if (btnPlus) btnPlus.addEventListener('click', (e) => { e.stopPropagation(); adicionarEpisodioRápido(dorama.id); });

        gridDoramas.appendChild(card);
    });
}

async function carregarDados() {
    try { doramas = await ipcRenderer.invoke('get-doramas'); atualizarTela(); } 
    catch (erro) { console.error(erro); }
}

formDorama.addEventListener('submit', async (e) => {
    e.preventDefault(); 
    
    const idAtual = inputId.value;
    let assistidos = parseInt(document.getElementById('episodios_assistidos').value) || 0;
    let totalEps = parseInt(document.getElementById('episodios').value) || 0;
    let statusAtual = document.getElementById('status').value;

    if (totalEps > 0 && assistidos >= totalEps) {
        assistidos = totalEps;
        statusAtual = 'Finalizado';
    }

    const doramaDados = {
        titulo: document.getElementById('titulo').value,
        nota: parseFloat(document.getElementById('nota').value),
        status: statusAtual,
        img: document.getElementById('imagem').value,
        sinopse: document.getElementById('sinopse').value,
        episodios: totalEps,
        episodios_assistidos: assistidos,
        elenco: document.getElementById('elenco').value 
    };
    
    try {
        if (idAtual) {
            doramaDados.id = parseInt(idAtual);
            const doramaAtualizado = await ipcRenderer.invoke('update-dorama', doramaDados);
            const index = doramas.findIndex(d => d.id === doramaAtualizado.id);
            doramas[index] = doramaAtualizado;
        } else {
            const doramaSalvo = await ipcRenderer.invoke('add-dorama', doramaDados);
            doramas.push(doramaSalvo);
        }
        
        if (filtroSidebarAtual !== 'perfil') {
            document.querySelectorAll('.menu-item').forEach(item => item.classList.remove('active'));
            menuInicio.classList.add('active');
            filtroSidebarAtual = 'inicio';
            tituloPagina.innerText = 'Sua Coleção';
            selectOrdenacao.disabled = false;
            atualizarTela();
        } else {
            renderizarDashboard();
        }
        
        inputBusca.value = '';
        fecharModais();
    } catch (erro) {
        console.error(erro);
    }
});

carregarDados();