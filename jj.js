let p2p;
let remotePlayers = new Map();
const PLAYER_COLORS = [0xFF0000, 0x0000FF, 0x00FF00, 0xFFFF00, 0xFF00FF];
let lastNetworkUpdate = 0;
const NETWORK_UPDATE_RATE = 100; // ms


// Variáveis do jogo
let scene, camera, renderer, player, ground, machine, coins = [], particles = [];
let keys = {}, gameRunning = false; // MUDADO para false para esperar o lobby
let playerVelocity = { x: 0, y: 0, z: 0 };

// Sistema de progressão
let playerLevel = 1;
let coinsCarried = 0;
let coinsStored = 0;
let experience = 0;
let maxCarryCapacity = 5;
let playerSpeed = 0.06;
let collectionRange = 1.2;

// =====================================
// VARIÁVEIS MULTIPLAYER (adicionar após as variáveis existentes)
// =====================================

// Configurações de nível
const levelRequirements = [0, 10, 25, 50, 100, 175, 275, 400, 550, 750, 1000];

// Aumentando o tamanho do mundo em 4x (dobrando a largura e o comprimento)
const worldSize = 200;

let nearMachine = false;

// Variáveis do joystick mobile
let joystickInput = { x: 0, z: 0 };
let joystickActive = false;
const JOYSTICK_DEADZONE = 0.15;
let dashCooldown = 0;
const MAX_DASH_COOLDOWN = 3000; // 3 segundos

// ====================================
// OBJETO GAME LOBBY
// ====================================

// ====================================
// OBJETO GAME LOBBY (COMPLETO E CORRIGIDO)
// ====================================

const gameLobby = {
    p2p: null,
    localId: null,
    isHost: false,
    lobbyUI: null,
    statusText: null,
    createBtn: null,
    joinBtn: null,
    startBtn: null,
    offerInput: null,
    answerInput: null,
    connectAnswerBtn: null,
    connectOfferBtn: null,

    init: function(p2pInstance) {
        // DEFINIR todas as referências DOM aqui
        this.p2p = p2pInstance;
        this.localId = p2pInstance.localPlayerId;
        this.lobbyUI = document.getElementById('lobbyUI');
        this.statusText = document.getElementById('connectionStatus');
        this.createBtn = document.getElementById('createRoomBtn');
        this.joinBtn = document.getElementById('joinRoomBtn');
        this.startBtn = document.getElementById('startGameBtn');
        this.offerInput = document.getElementById('hostCode');
        this.answerInput = document.getElementById('guestCode');
        this.connectAnswerBtn = document.getElementById('connectAnswerBtn');
        this.connectOfferBtn = document.getElementById('connectOfferBtn');

        // Configurar UI
        if (this.lobbyUI) {
            this.lobbyUI.style.display = 'flex';
        }
        this.statusText.textContent = `Seu ID: ${this.localId} | Escolha uma opção.`;
        
        // Atualizar display do ID local
        const localIdDisplay = document.getElementById('localPlayerIdDisplay');
        if (localIdDisplay) {
            localIdDisplay.textContent = this.localId;
        }

        // Configurar event listeners
        this.createBtn.onclick = () => this.createRoom();
        this.joinBtn.onclick = () => this.promptForOffer();
        this.startBtn.onclick = () => this.startGame();
        this.connectAnswerBtn.onclick = () => this.handleHostAnswerFromInput();

        this.startBtn.style.display = 'none';
    },

    createRoom: async function() {
        try {
            this.isHost = true;
            this.statusText.textContent = "Criando sala...";
            const offer = await this.p2p.createRoom();

            // Esconder botões de ação e exibir o campo de offer para o convidado
            this.createBtn.style.display = 'none';
            this.joinBtn.style.display = 'none';

            // Exibir o offer e o campo para o Answer
            this.offerInput.value = JSON.stringify(offer);
            this.offerInput.readOnly = true;
            document.getElementById('offerContainer').style.display = 'block';
            document.getElementById('answerContainer').style.display = 'block';

            this.statusText.textContent = "COPIE este OFFER e envie ao seu amigo.";

        } catch (error) {
            this.statusText.textContent = `ERRO ao criar sala: ${error}`;
            console.error(error);
        }
    },

    promptForOffer: function() {
        // Esconder botões de ação
        this.createBtn.style.display = 'none';
        this.joinBtn.style.display = 'none';

        // Exibir apenas o campo para inserir o Offer
        document.getElementById('offerContainer').style.display = 'block';
        this.offerInput.placeholder = "Cole o Offer do Host aqui...";
        this.offerInput.readOnly = false;
        this.offerInput.value = "";
        
        // Mudar a ação do campo Offer para processar
        document.getElementById('offerLabel').textContent = "Código do Host (Offer):";
        this.connectOfferBtn.style.display = 'inline-block';
        this.connectOfferBtn.onclick = () => this.handleGuestOfferFromInput();

        this.statusText.textContent = "Cole o código do Host (Offer) e conecte.";
    },

    handleGuestOfferFromInput: async function() {
        const offerData = this.offerInput.value;
        if (!offerData) {
            alert("Insira o código do Offer.");
            return;
        }

        try {
            this.statusText.textContent = "Processando Offer...";
            const offer = JSON.parse(offerData);
            const answer = await this.p2p.handleOffer(offer);

            if (answer) {
                // Esconder o container de Offer e mostrar o Answer
                document.getElementById('offerContainer').style.display = 'none';
                this.connectOfferBtn.style.display = 'none';

                this.answerInput.value = JSON.stringify(answer);
                this.answerInput.readOnly = true;
                document.getElementById('answerContainer').style.display = 'block';
                this.connectAnswerBtn.style.display = 'none'; // Guest não usa este botão

                this.statusText.textContent = "COPIE e envie este ANSWER de volta para o Host!";
                // O guest só espera agora
            }
        } catch (error) {
            this.statusText.textContent = `ERRO ao processar Offer: ${error}`;
            console.error(error);
        }
    },

    handleHostAnswerFromInput: async function() {
        if (!this.isHost) return;

        const answerData = this.answerInput.value;
        if (!answerData) {
            alert("Insira o código do Answer do Guest.");
            return;
        }

        try {
            this.statusText.textContent = "Finalizando conexão...";
            const answer = JSON.parse(answerData);
            await this.p2p.handleAnswer(answer);
            // O callback onPlayerConnected será chamado se for bem-sucedido
        } catch (error) {
            this.statusText.textContent = `ERRO ao processar Answer: ${error}`;
            console.error(error);
        }
    },

    onConnected: function() {
        this.statusText.textContent = "Conectado com sucesso!";

        if (this.isHost) {
            this.startBtn.style.display = 'block';
            this.statusText.textContent = "Conectado! Pressione 'INICIAR JOGO' para começar.";
        } else {
            this.statusText.textContent = "Conectado! Aguarde o Host iniciar o jogo.";
        }
    },

    startGame: function() {
        if (!this.isHost) return;
        
        // Esconder lobby UI
        this.lobbyUI.style.display = 'none';
        
        // Iniciar o jogo localmente
        gameRunning = true;
        // Enviar mensagem para o Guest iniciar o jogo
        this.p2p.send({ type: 'game_start' });
        
        // Esconder controles do lobby e mostrar controles de jogo
        document.getElementById('ui').style.display = 'block';
        document.getElementById('mobileControls').style.display = 'flex';
    },

    // Apenas para fins de depuração ou feedback
    updateStatus: function() {
        if (this.p2p && this.p2p.isConnected() && !gameRunning) {
            // Este status é atualizado pelos callbacks onConnected.
            // Apenas evita que o status desapareça se o p2p estiver conectado.
        }
    }
}; // ← FECHAMENTO CORRETO DO OBJETO
// ====================================
// FUNÇÕES DE JOGO (RENDERIZAÇÃO, LÓGICA, INPUT)
// ====================================

function init() {
    // Esconde o overlay de lobby e mostra o container do jogo
    document.getElementById('gameContainer').style.display = 'block';
    
    // 1. Inicializa o Multiplayer (Lobby)
    initMultiplayer();

    // 2. Cria a Cena e o Renderer
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Cor de céu azul claro
    
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameContainer').appendChild(renderer.domElement);

    // 3. Configura a Câmera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 10);

    // 4. Adiciona Iluminação
    const ambientLight = new THREE.AmbientLight(0x404040, 5); // Luz suave
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 4);
    directionalLight.position.set(10, 50, 10);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 100;
    directionalLight.shadow.camera.left = -worldSize / 2;
    directionalLight.shadow.camera.right = worldSize / 2;
    directionalLight.shadow.camera.top = worldSize / 2;
    directionalLight.shadow.camera.bottom = -worldSize / 2;
    scene.add(directionalLight);

    // 5. Cria o Chão
    createGround();
    
    // 6. Cria o Player Local
    createPlayer();

    // 7. Cria a Máquina Central
    createMachine();
    
    // 8. Cria os itens do jogo
    createCoins(100);
    createZombies(25);
    createLeaves(30);
    createChickens(10);
    
    // 9. Controles (OrbitControls para visão 3ª pessoa)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // para um movimento mais suave
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.minDistance = 3;
    controls.maxDistance = 15;
    controls.maxPolarAngle = Math.PI / 2.2; // Não deixa a câmera ir abaixo do chão
    controls.minPolarAngle = Math.PI / 8;
    controls.target.copy(player.position);
    controls.update();
    
    // 10. Configura os Listeners de Input
    setupInputListeners();
    setupMobileControls();
    
    // 11. Inicia o loop de renderização (animate)
    animate();

    // 12. Redimensionamento da janela
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Criação de Objetos

function createGround() {
    const textureLoader = new THREE.TextureLoader();
    const grassTexture = textureLoader.load('https://threejs.org/examples/textures/crate.gif'); // Use uma textura de grama real se tiver!
    grassTexture.wrapS = THREE.RepeatWrapping;
    grassTexture.wrapT = THREE.RepeatWrapping;
    grassTexture.repeat.set(worldSize / 2, worldSize / 2);

    const geometry = new THREE.PlaneGeometry(worldSize, worldSize);
    const material = new THREE.MeshLambertMaterial({ map: grassTexture, color: 0x6B8E23 }); // Cor de grama
    ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
}

function createPlayer() {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
    const material = new THREE.MeshLambertMaterial({ color: PLAYER_COLORS[0] });
    player = new THREE.Mesh(geometry, material);
    player.position.y = 1;
    player.castShadow = true;
    scene.add(player);
}

function createRemotePlayer(id, colorIndex = 1) {
    const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 32);
    // Usa uma cor diferente para diferenciar
    const material = new THREE.MeshLambertMaterial({ color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length] }); 
    const remotePlayer = new THREE.Mesh(geometry, material);
    remotePlayer.position.y = 1;
    remotePlayer.castShadow = true;
    scene.add(remotePlayer);
    
    // Adiciona o nome do jogador
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = 'Bold 40px Arial';
    context.fillStyle = 'rgba(255, 255, 255, 0.95)';
    context.fillText(id, 0, 40);
    
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(6, 3, 1);
    sprite.position.y = 2.5; // Acima da cabeça do jogador
    remotePlayer.add(sprite); // Anexa o nome ao mesh do jogador

    remotePlayers.set(id, { mesh: remotePlayer, targetPosition: remotePlayer.position.clone(), targetRotation: remotePlayer.rotation.clone() });
}

function removeRemotePlayer(id) {
    const remotePlayer = remotePlayers.get(id);
    if (remotePlayer) {
        scene.remove(remotePlayer.mesh);
        remotePlayers.delete(id);
    }
}

function createMachine() {
    const geometry = new THREE.BoxGeometry(4, 8, 4);
    const material = new THREE.MeshStandardMaterial({ color: 0x808080 });
    machine = new THREE.Mesh(geometry, material);
    machine.position.y = 4;
    machine.position.set(0, 4, 0); // Centro do mapa
    machine.castShadow = true;
    machine.receiveShadow = true;
    scene.add(machine);

    // Adiciona um emissor de luz no topo da máquina
    const light = new THREE.PointLight(0xFFD700, 3, 20);
    light.position.set(0, 8, 0);
    machine.add(light);
}

function createCoins(count) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.3 });
    
    for (let i = 0; i < count; i++) {
        const coin = new THREE.Mesh(geometry, material);
        // Posição aleatória dentro do limite do mundo
        coin.position.x = (Math.random() - 0.5) * worldSize * 0.9;
        coin.position.z = (Math.random() - 0.5) * worldSize * 0.9;
        coin.position.y = 0.5;
        coin.rotation.x = Math.PI / 2; // Gira para parecer uma moeda no chão
        coin.userData = { isCoin: true, value: 1 };
        scene.add(coin);
        coins.push(coin);
    }
}

function createZombies(count) {
    // Adicione a lógica para criar inimigos, se desejar. Por enquanto, vazia.
}

function createLeaves(count) {
    // Adicione a lógica para criar folhas/itens estéticos, se desejar. Por enquanto, vazia.
}

function createChickens(count) {
    // Adicione a lógica para criar galinhas/npcs, se desejar. Por enquanto, vazia.
}

function spawnCoin(position) {
    const geometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0xFFD700, metalness: 0.8, roughness: 0.3 });
    
    const coin = new THREE.Mesh(geometry, material);
    coin.position.copy(position);
    coin.position.y = 0.5; // Garante que a moeda esteja no chão
    coin.rotation.x = Math.PI / 2; 
    coin.userData = { isCoin: true, value: 1 };
    scene.add(coin);
    coins.push(coin);
    
    // Se estiver conectado, informa aos outros jogadores sobre a nova moeda
    if (p2p && p2p.isConnected()) {
        p2p.send({ 
            type: 'spawn_coin', 
            id: coin.uuid,
            x: coin.position.x, 
            z: coin.position.z 
        });
    }
}


// Lógica do Jogo

function updatePlayer() {
    // Aplica a velocidade de queda (gravidade simulada)
    playerVelocity.y -= 0.005; 
    
    // Movimento do Jogador baseado no input (teclado/joystick)
    let moveDirection = new THREE.Vector3(joystickInput.x, 0, joystickInput.z);
    
    // Normaliza a direção para evitar movimento mais rápido na diagonal
    if (moveDirection.length() > 1) {
        moveDirection.normalize();
    }
    
    // Se o movimento for maior que a deadzone (ou keys pressionadas no desktop)
    if (moveDirection.length() > JOYSTICK_DEADZONE || keys['w'] || keys['s'] || keys['a'] || keys['d']) {
        
        // 1. Calcula a direção de movimento com base na câmera
        const cameraDirection = controls.getDirection(new THREE.Vector3());
        cameraDirection.y = 0; // Remove a componente Y (olhar para cima/baixo)
        cameraDirection.normalize();

        // Cria uma matriz de rotação a partir da direção da câmera
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.lookAt(cameraDirection, new THREE.Vector3(0, 0, 0), player.up);

        // Clona a direção de movimento baseada no input
        let finalDirection = new THREE.Vector3(0, 0, 0);

        if (keys['w']) finalDirection.z -= 1;
        if (keys['s']) finalDirection.z += 1;
        if (keys['a']) finalDirection.x -= 1;
        if (keys['d']) finalDirection.x += 1;

        if (joystickActive) {
            finalDirection.x = joystickInput.x;
            finalDirection.z = joystickInput.z;
        }

        // Transforma o input no espaço do mundo usando a rotação da câmera
        finalDirection.applyMatrix4(rotationMatrix);
        
        if (finalDirection.length() > 0) {
            finalDirection.normalize();
        }
        
        // Aplica o movimento ao player
        player.position.x += finalDirection.x * playerSpeed;
        player.position.z += finalDirection.z * playerSpeed;

        // Rotação do jogador para olhar na direção do movimento
        const targetRotation = Math.atan2(finalDirection.x, finalDirection.z);
        // Interpolação suave da rotação para evitar mudanças bruscas
        player.rotation.y += (targetRotation - player.rotation.y) * 0.1;
    }

    // Aplica o dash (se houver)
    if (keys['shift'] && dashCooldown <= 0) {
        // Implementar a lógica do dash aqui
        // Exemplo: 
        // playerVelocity.z = -playerSpeed * 5; // Dash para frente
        // dashCooldown = MAX_DASH_COOLDOWN;
        // keys['shift'] = false; // Consome o dash
        triggerDash();
    }

    // Aplica a velocidade de salto
    player.position.y += playerVelocity.y;

    // Colisão com o chão
    if (player.position.y < 1) {
        player.position.y = 1;
        playerVelocity.y = 0; // Para a queda
        keys['space'] = false; // Permite pular novamente
    }
    
    // Limites do mundo
    const halfWorld = worldSize / 2 - 1; // 1 é para a "largura" do jogador
    player.position.x = Math.max(-halfWorld, Math.min(halfWorld, player.position.x));
    player.position.z = Math.max(-halfWorld, Math.min(halfWorld, player.position.z));
    
    // Atualiza a posição da câmera para seguir o jogador
    controls.target.copy(player.position);
}

function updateCoins() {
    let collectedCount = 0;
    
    // Verifica a colisão com moedas
    for (let i = coins.length - 1; i >= 0; i--) {
        const coin = coins[i];
        
        // Gira a moeda para um efeito visual
        coin.rotation.z += 0.05;

        // Distância entre player e coin no plano XZ
        const distance = player.position.distanceTo(coin.position);

        if (distance < collectionRange) {
            if (coinsCarried < maxCarryCapacity) {
                // Colisão detectada e capacidade disponível
                scene.remove(coin);
                coins.splice(i, 1);
                coinsCarried++;
                collectedCount++;
            } else {
                // Capacidade esgotada
                // Não faz nada, a moeda fica no lugar
            }
        }
    }
    
    // Se moedas foram coletadas e a rede estiver ativa, informa a rede para removê-las
    if (collectedCount > 0 && p2p && p2p.isConnected()) {
        // Enviar o UUID das moedas removidas ou a nova contagem (a remoção pelo UUID é mais robusta)
        // Por simplicidade, faremos apenas o envio do estado de coleta/moedas restantes.
        // Se quisermos remover a moeda de verdade no lado do Guest, precisaríamos do UUID.
        // Mas como a coleta é local, por enquanto fica assim.
    }
    
    // Checa proximidade com a Máquina
    const distanceToMachine = player.position.distanceTo(machine.position);
    nearMachine = distanceToMachine < 5;
    
    const machineHint = document.getElementById('machineHint');
    if (nearMachine) {
        machineHint.style.display = 'block';
    } else {
        machineHint.style.display = 'none';
    }
}

function depositCoins() {
    if (nearMachine && coinsCarried > 0) {
        coinsStored += coinsCarried;
        experience += coinsCarried;
        coinsCarried = 0;
        
        // Tenta subir de nível
        checkLevelUp();
        
        // Se estiver em jogo multiplayer, envia o estado atualizado para a rede
        if (p2p && p2p.isConnected()) {
            sendPlayerState();
        }
    }
}

function checkLevelUp() {
    if (playerLevel < levelRequirements.length && experience >= levelRequirements[playerLevel]) {
        playerLevel++;
        applyLevelUpBonus();
        showLevelUpNotification();
    }
}

function applyLevelUpBonus() {
    // Aumenta a capacidade de carga a cada nível ímpar
    if (playerLevel % 2 !== 0) {
        maxCarryCapacity += 3;
    }
    // Aumenta a velocidade de movimento a cada nível par
    if (playerLevel % 2 === 0) {
        playerSpeed += 0.01;
    }
    
    // Aumenta o raio de coleta a cada 3 níveis
    if (playerLevel % 3 === 0) {
        collectionRange += 0.2;
    }
}

function showLevelUpNotification() {
    const notification = document.getElementById('levelUpNotification');
    const text = document.getElementById('newLevelText');
    const bonus = document.getElementById('levelUpBonus');
    
    text.textContent = `Nível ${playerLevel}`;
    bonus.textContent = `Capacidade: ${maxCarryCapacity} | Velocidade: ${(playerSpeed * 100).toFixed(1)} | Raio: ${collectionRange.toFixed(1)}`;

    notification.style.display = 'block';
    
    // Aplica um efeito visual
    const gameContainer = document.getElementById('gameContainer');
    const effect = document.createElement('div');
    effect.className = 'screenEffect levelUpEffect';
    gameContainer.appendChild(effect);
    
    // Remove a notificação e o efeito após um tempo
    setTimeout(() => {
        notification.style.display = 'none';
        gameContainer.removeChild(effect);
    }, 4000);
}


function updateZombies() {
    // Lógica dos inimigos (se houver)
}

function updateLeaves() {
    // Lógica das folhas (se houver)
}

function updateChickens() {
    // Lógica das galinhas (se houver)
}

function updateParticles() {
    // Lógica das partículas (se houver)
}

function updateUI() {
    document.getElementById('level').textContent = `Nível: ${playerLevel}`;
    document.getElementById('coinsCarried').textContent = `Moedas: ${coinsCarried}/${maxCarryCapacity}`;
    document.getElementById('coinsStored').textContent = `Armazenadas: ${coinsStored}`;
    document.getElementById('dashStatus').textContent = `Dash: ${dashCooldown <= 0 ? 'Pronto' : (dashCooldown / 1000).toFixed(1) + 's'}`;
    document.getElementById('exp').textContent = `EXP: ${experience} / ${levelRequirements[playerLevel] || 'MAX'}`;

    // Atualiza o estado da UI de acordo com o gameRunning
    if (gameRunning) {
        document.getElementById('ui').style.display = 'block';
        document.getElementById('mobileControls').style.display = 'flex';
        document.getElementById('instructions').style.display = 'block';
        document.getElementById('lobbyUI').style.display = 'none';
    } else {
        document.getElementById('ui').style.display = 'none';
        document.getElementById('mobileControls').style.display = 'none';
        document.getElementById('instructions').style.display = 'none';
        // O lobbyUI é gerenciado pelo próprio objeto gameLobby
    }
}

function animate() {
    requestAnimationFrame(animate);

    if (gameRunning) {
        // Lógica de atualização do jogo principal
        updatePlayer();
        updateCoins();
        updateZombies();
        updateLeaves();
        updateParticles(); // Adicionado para atualizar as partículas
        updateChickens(); // Adicionado para atualizar as galinhas

        // === LINHA ADICIONADA: Envia o estado de movimento para a rede ===
        sendPlayerUpdate();
        
        // Interpola a posição dos jogadores remotos
        remotePlayers.forEach(p => {
            p.mesh.position.lerp(p.targetPosition, 0.3); // Interpola 30% para a posição alvo
            p.mesh.rotation.y += (p.targetRotation.y - p.mesh.rotation.y) * 0.3; // Interpola a rotação
        });

        // Câmera segue o jogador
        if (controls) { // Verifica se controls foi inicializado
            controls.target.copy(player.position);
            controls.update();
        }

        // Diminuir cooldown do dash
        if (dashCooldown > 0) {
            dashCooldown -= (1000 / 60); // Assumindo 60 FPS (16.66ms)
        }
    }

    if (renderer && scene && camera) { // Verificação de segurança
        renderer.render(scene, camera);
    }
    updateUI();
    
    // === LINHA ADICIONADA: Atualiza o status do lobby (mesmo se estiver escondido) ===
    if (gameLobby) gameLobby.updateStatus();
}


// ====================================
// FUNÇÕES DE INPUT
// ====================================

function setupInputListeners() {
    document.addEventListener('keydown', (event) => {
        keys[event.key.toLowerCase()] = true;
        
        // Pulo no desktop
        if (event.key.toLowerCase() === ' ') {
            if (player.position.y <= 1.01) { // Só permite pular se estiver no chão
                playerVelocity.y = 0.1; // Força do pulo
            }
            if (nearMachine) {
                depositCoins();
            }
        }
    });

    document.addEventListener('keyup', (event) => {
        keys[event.key.toLowerCase()] = false;
    });
}

function triggerDash() {
    if (dashCooldown > 0 || player.position.y > 1.01) return; // Não faz dash no ar

    // Calcula a direção atual do jogador
    const dashDirection = controls.getDirection(new THREE.Vector3());
    dashDirection.y = 0; 
    dashDirection.normalize();

    // Dash para a frente
    player.position.x += dashDirection.x * 10;
    player.position.z += dashDirection.z * 10;
    
    // Inicia o cooldown
    dashCooldown = MAX_DASH_COOLDOWN;
}

function setupMobileControls() {
    const joystick = document.getElementById('joystick');
    const joystickKnob = document.getElementById('joystickKnob');
    let startX, startY;

    // Joystck - Início do toque
    joystick.addEventListener('touchstart', (e) => {
        e.preventDefault();
        joystickActive = true;
        const touch = e.touches[0];
        const rect = joystick.getBoundingClientRect();
        startX = rect.left + rect.width / 2;
        startY = rect.top + rect.height / 2;
        
        // Move o knob para a posição inicial do toque para o efeito de "touch and hold anywhere"
        joystickKnob.style.transform = 'translate(-50%, -50%)';
        joystickKnob.style.left = `${touch.clientX - rect.left}px`;
        joystickKnob.style.top = `${touch.clientY - rect.top}px`;
    }, false);

    // Joystick - Movimento do toque
    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const rect = joystick.getBoundingClientRect();
        const center = { x: rect.width / 2, y: rect.height / 2 };
        
        let dx = touch.clientX - startX;
        let dy = touch.clientY - startY;

        // Limita o knob dentro do círculo do joystick
        const maxRadius = rect.width / 2;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxRadius) {
            dx = (dx / distance) * maxRadius;
            dy = (dy / distance) * maxRadius;
        }

        // Posição do knob
        joystickKnob.style.left = `${center.x + dx}px`;
        joystickKnob.style.top = `${center.y + dy}px`;

        // Calcula o input para o jogo (normalizado entre -1 e 1)
        joystickInput.x = dx / maxRadius; // X é para a esquerda/direita
        joystickInput.z = dy / maxRadius; // Z é para frente/trás (no plano do celular)
        
    }, false);

    // Joystick - Fim do toque
    joystick.addEventListener('touchend', (e) => {
        joystickActive = false;
        joystickInput.x = 0;
        joystickInput.z = 0;
        
        // Retorna o knob ao centro (em Three.js, a posição 0,0 do elemento)
        joystickKnob.style.left = '50%';
        joystickKnob.style.top = '50%';
    }, false);
    
    // Botões de Ação Mobile
    document.getElementById('jumpButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (player.position.y <= 1.01) {
            playerVelocity.y = 0.1; // Pulo
        }
        if (nearMachine) {
            depositCoins(); // Deposita se estiver perto da máquina
        }
    });

    document.getElementById('dashButton').addEventListener('touchstart', (e) => {
        e.preventDefault();
        triggerDash();
    });
}

// ====================================
// FUNÇÕES MULTIPLAYER (APÓS AS FUNÇÕES DE JOGO)
// ====================================

/**
 * Função principal para inicializar a rede P2P e o lobby.
 * Corrigida para ficar no escopo global e ser chamada por init().
 */
function initMultiplayer() { 
    // Garante que o lobby UI seja visível
    document.getElementById('lobbyUI').style.display = 'flex';
    document.getElementById('ui').style.display = 'none';

    // Gera um ID local
    const localId = "Player_" + Math.random().toString(36).substring(2, 6).toUpperCase();
    p2p = new WebRTCGame(localId);

    // Configurar callbacks
    p2p.onPlayerConnected = (peerId) => {
        console.log(`Jogador ${peerId} conectado!`);
        createRemotePlayer(peerId, remotePlayers.size + 1); // Adiciona um mesh para o jogador remoto
        gameLobby.onConnected();
        
        // Host deve enviar o estado do jogo (moedas, etc.) ao Guest
        if (p2p.isHost) {
            sendPlayerState(peerId);
            // O Host deve enviar uma mensagem de 'hello' com seu próprio estado
            p2p.send({ 
                type: 'player_state', 
                id: p2p.localPlayerId,
                x: player.position.x, 
                y: player.position.y, 
                z: player.position.z,
                r: player.rotation.y,
                coins: coinsCarried,
                stored: coinsStored,
                level: playerLevel,
            });
        }
    };

    p2p.onPlayerDisconnected = (peerId) => {
        console.log(`Jogador ${peerId} desconectado.`);
        removeRemotePlayer(peerId);
        gameLobby.statusText.textContent = "Um jogador desconectou. O lobby foi reaberto.";
        gameRunning = false;
        // Reinicializa o lobby para permitir uma nova conexão
        gameLobby.lobbyUI.style.display = 'flex';
        gameLobby.init(p2p);
    };

    p2p.onDataReceived = handleNetworkData;

    // Inicializa o objeto do lobby com a instância p2p
    gameLobby.init(p2p);
} 

/**
 * Envia a posição e rotação do jogador para o peer.
 * Chamado a cada frame (ou a cada NETWORK_UPDATE_RATE).
 */
function sendPlayerUpdate() {
    const now = performance.now();
    if (now - lastNetworkUpdate < NETWORK_UPDATE_RATE) {
        return; // Não envia se o tempo não passou
    }
    lastNetworkUpdate = now;

    if (p2p && p2p.isConnected()) {
        const data = {
            type: 'player_update',
            x: player.position.x.toFixed(2),
            y: player.position.y.toFixed(2),
            z: player.position.z.toFixed(2),
            r: player.rotation.y.toFixed(2)
        };
        p2p.send(data);
    }
}

/**
 * Envia o estado completo do jogador (coins, level, etc.) para o peer.
 * Chamado quando há uma mudança importante (depósito, level up).
 */
function sendPlayerState(targetPeerId = null) {
    if (p2p && p2p.isConnected()) {
        const data = {
            type: 'player_state',
            x: player.position.x.toFixed(2),
            y: player.position.y.toFixed(2),
            z: player.position.z.toFixed(2),
            r: player.rotation.y.toFixed(2),
            coins: coinsCarried,
            stored: coinsStored,
            level: playerLevel,
            // Adicione outras variáveis de estado aqui
        };
        // Se targetPeerId for nulo, envia para todos
        if (targetPeerId) {
            // Se WebRTCGame tiver um método sendTo(peerId, data)
            // p2p.sendTo(targetPeerId, data); 
            p2p.send(data); // Por simplicidade, envia para o único peer conectado
        } else {
            p2p.send(data);
        }
    }
}

/**
 * Função que lida com todos os dados recebidos da rede.
 */
function handleNetworkData(peerId, data) {
    const remotePlayer = remotePlayers.get(peerId);

    switch (data.type) {
        case 'player_update':
            // Recebeu uma atualização de movimento
            if (remotePlayer) {
                // Configura a posição alvo para interpolação
                remotePlayer.targetPosition.set(
                    parseFloat(data.x), 
                    parseFloat(data.y), 
                    parseFloat(data.z)
                );
                remotePlayer.targetRotation.y = parseFloat(data.r);
            }
            break;
        case 'player_state':
            // Recebeu uma atualização de estado (coins, level, etc.)
            if (remotePlayer) {
                // Atualiza o estado do jogador remoto (opcionalmente)
            }
            // Se for o host, pode ignorar o estado do guest, ou vice-versa.
            break;
        case 'game_start':
            // Guest recebeu o comando para iniciar o jogo
            if (!gameLobby.isHost) {
                gameLobby.lobbyUI.style.display = 'none';
                gameRunning = true;
                // Exibir UI e controles
                document.getElementById('ui').style.display = 'block';
                document.getElementById('mobileControls').style.display = 'flex';
            }
            break;
        case 'spawn_coin':
            // Lógica para spawnar uma moeda no lado remoto
            // Note: A remoção de moedas requer um sistema de ID para moedas mais robusto
            break;
        // Adicione outros tipos de mensagens de jogo (ex: 'hit', 'item_collected')
    }
}


// **********************************
// FUNÇÕES DE FULLSCREEN (CORRIGIDAS)
// **********************************

// Ativar fullscreen em qualquer elemento
function requestFullscreen(element) {
    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.mozRequestFullScreen) { // Firefox
        element.mozRequestFullScreen();
    } else if (element.webkitRequestFullscreen) { // Chrome, Safari e Opera
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // IE/Edge
        element.msRequestFullscreen();
    }
}

/**
 * CORREÇÃO DE SINTAXE: Esta função agora está FECHADA corretamente
 * e NÃO contém outras funções aninhadas que causavam erros de escopo.
 */
function enableFullscreenOnFirstTap() {
    const tapPrompt = document.getElementById("tapPrompt");
    if (!tapPrompt) {
        console.error("Elemento #tapPrompt não encontrado! Iniciando init() diretamente.");
        init(); // Inicia o jogo se o prompt não for encontrado (ex: em desktop)
        return; 
    }
    
    // Função local que será chamada no primeiro clique/toque
    function activateFullscreen() {
        requestFullscreen(document.documentElement); // Pede tela cheia para todo o documento

        // Esconde o overlay de instrução
        if (tapPrompt) {
            tapPrompt.style.display = "none";
        }

        // Remove os listeners (só precisa 1 toque)
        document.removeEventListener("click", activateFullscreen);
        document.removeEventListener("touchstart", activateFullscreen);
        
        // O jogo pode começar agora
        init();
    }

    // Adiciona os event listeners para iniciar o jogo e o fullscreen
    document.addEventListener("click", activateFullscreen);
    document.addEventListener("touchstart", activateFullscreen);
}
// Chame a função de tela cheia logo no início.
enableFullscreenOnFirstTap();


