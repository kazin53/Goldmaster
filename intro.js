const introScreen = document.getElementById('introScreen');

    function showLoadingScreen() {
        // Esconde tela de título
        introScreen.style.display = 'none';

        // Mostra tela de carregamento
        const loadingScreen = document.getElementById('loadingScreen');
        loadingScreen.style.display = 'flex';
        loadingScreen.style.backgroundImage = "url('fundo.png')"; 

        const bar = document.getElementById('loadingBar');
        let progress = 0;

        // Anima barra de carregamento
        const interval = setInterval(() => {
            progress += Math.random() * 10;
            if(progress >= 100) progress = 100;
            bar.style.width = progress + '%';
            if(progress === 100) clearInterval(interval);
        }, 300);

        // Espera 5 segundos e vai para lobby.html
        setTimeout(() => {
            window.location.href = 'lobby.html';
        }, 5000);
    }
    
    // A função handleFirstInteraction e os Event Listeners foram removidos.
    // O carregamento é iniciado automaticamente após 8 segundos, simulando
    // o tempo original de espera da tela de título.
    console.log("Iniciando transição automática para a tela de carregamento em 8 segundos...");
    setTimeout(showLoadingScreen, 8000); 