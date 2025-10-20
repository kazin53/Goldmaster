        // Variáveis globais
        let scene, camera, renderer, character;
        let objects = [];
        let menuOpen = false;
        let musicEnabled = false;
        let fpsCounter = 0;
        let lastTime = 0;
        let backgroundMusic; 
        
        // CORREÇÃO: Pegar as dimensões da janela uma única vez no início
        const initialWidth = window.innerWidth;
        const initialHeight = window.innerHeight;

        // Configuração inicial
        function init() {
            // Criar cena
            scene = new THREE.Scene();
            scene.fog = new THREE.Fog(0x404040, 50, 200);

            // Configurar câmera - Usando as dimensões iniciais
            camera = new THREE.PerspectiveCamera(75, initialWidth / initialHeight, 0.1, 1000); 
            camera.position.set(0, 5, 10);

            // Configurar renderer - Usando as dimensões iniciais
            renderer = new THREE.WebGLRenderer({ 
                canvas: document.getElementById('canvas3d'),
                antialias: true 
            });
            renderer.setSize(initialWidth, initialHeight); 
            renderer.setClearColor(0x87CEEB);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;

            // Criar personagem
            createRobloxCharacter(); 

            // Criar ambiente
            createEnvironment(); 

            // Configurar iluminação
            setupLighting(); 

            // Configurar controles e responsividade
            setupControls(); 

            // Configurar áudio
            setupAudio(); 

            // Iniciar loop de animação
            animate(); 

            // Simular carregamento
            simulateLoading(); 
        }

        // NOVO: Função de configuração de áudio
        function setupAudio() {
            // Cria um novo objeto de áudio para a música de fundo
            backgroundMusic = new Audio('music001xf.mp3'); 
            backgroundMusic.loop = true; 

            // Define o volume inicial a partir do slider (50/100)
            const volumeSlider = document.getElementById('musicVolume'); 
            const initialVolume = parseInt(volumeSlider.value) / 100;
            backgroundMusic.volume = initialVolume; 

            // Adiciona um listener para atualizar o volume em tempo real
            volumeSlider.addEventListener('input', () => { 
                backgroundMusic.volume = parseInt(volumeSlider.value) / 100; 
            });
            
            // Adiciona um listener para garantir que a música só comece a tocar APÓS a interação do usuário.
            document.body.addEventListener('click', function() {
                if (musicEnabled && backgroundMusic.paused) {
                    backgroundMusic.play().catch(error => {
                        console.log('Erro ao tentar tocar a música: ', error);
                    });
                }
            }, { once: true });
        }


        function createRobloxCharacter() {
            character = new THREE.Group();
            character.position.set(0, 1.5, 0); 
            scene.add(character);

            const skinMaterial = new THREE.MeshLambertMaterial({ color: 0xF1C27D });
            const shirtMaterial = new THREE.MeshLambertMaterial({ color: 0x4444aa });
            const pantsMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
            const hairMaterial = new THREE.MeshLambertMaterial({ color: 0x2B1B0E });
            const eyeMaterial = new THREE.MeshLambertMaterial({ color: 0x000000 });
            const mouthMaterial = new THREE.MeshLambertMaterial({ color: 0xAA0000 });

            // Cabeça
            const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.6), skinMaterial);
            head.position.set(0, 1.7, 0);
            head.castShadow = true;
            character.add(head);

            // Cabelo
            const hair = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.3, 0.65), hairMaterial);
            hair.position.set(0, 1.99, 0);
            hair.castShadow = true;
            character.add(hair);

            // Olhos
            const eyeGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.02);
            const leftEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            leftEye.position.set(-0.15, 1.71, 0.31);
            character.add(leftEye);

            const rightEye = new THREE.Mesh(eyeGeometry, eyeMaterial);
            rightEye.position.set(0.15, 1.71, 0.31);
            character.add(rightEye);

            // Boca
            const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.05, 0.02), mouthMaterial);
            mouth.position.set(0, 1.5, 0.31);
            character.add(mouth);

            // Corpo
            const body = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.1, 0.4), shirtMaterial);
            body.position.set(0, 0.8, 0);
            body.castShadow = true;
            character.add(body);

            // Braços
            const armGeometry = new THREE.BoxGeometry(0.25, 1.0, 0.25);
            const armMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });

            const leftArmGroup = new THREE.Group();
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.y = -0.5;
            leftArm.castShadow = true;
            leftArmGroup.add(leftArm);
            leftArmGroup.position.set(-0.625, 1.5, 0);
            character.add(leftArmGroup);

            const rightArmGroup = new THREE.Group();
            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.y = -0.5;
            rightArm.castShadow = true;
            rightArmGroup.add(rightArm);
            rightArmGroup.position.set(0.625, 1.5, 0);
            character.add(rightArmGroup);

            // Pernas
            const legGeometry = new THREE.BoxGeometry(0.35, 1.2, 0.35);

            const leftLegGroup = new THREE.Group();
            const leftLeg = new THREE.Mesh(legGeometry, pantsMaterial);
            leftLeg.position.y = -0.6;
            leftLeg.castShadow = true;
            leftLegGroup.add(leftLeg);
            leftLegGroup.position.set(-0.25, 0.2, 0);
            character.add(leftLegGroup);

            const rightLegGroup = new THREE.Group();
            const rightLeg = new THREE.Mesh(legGeometry, pantsMaterial);
            rightLeg.position.y = -0.6;
            rightLeg.castShadow = true;
            rightLegGroup.add(rightLeg);
            rightLegGroup.position.set(0.25, 0.2, 0);
            character.add(rightLegGroup);

            // Posicionar câmera para vista fixa do personagem (mais próxima)
            camera.position.set(0, 4, 8);
            camera.lookAt(character.position);
        }

        function createEnvironment() {
            // Chão de grama com textura natural
            const floorGeometry = new THREE.PlaneGeometry(200, 200, 50, 50); 
            const grassMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4A7C59,
                transparent: true
            });
            const floor = new THREE.Mesh(floorGeometry, grassMaterial);
            floor.rotation.x = -Math.PI / 2;
            floor.receiveShadow = true;
            
            // Adicionar variação na altura da grama
            const vertices = floor.geometry.attributes.position.array;
            for (let i = 2; i < vertices.length; i += 3) {
                vertices[i] += (Math.random() - 0.5) * 0.1;
            }
            floor.geometry.attributes.position.needsUpdate = true;
            floor.geometry.computeVertexNormals();
            
            scene.add(floor);
            objects.push(floor);

            // Criar tufos de grama detalhados
            createDetailedGrass(); 

            // Criar paisagem natural
            createNaturalLandscape(); 
        }

        function createDetailedGrass() {
            // Criar tufos de grama individuais para mais realismo
            for (let i = 0; i < 200; i++) {
                const grassTuft = new THREE.Group();
                
                // Criar várias lâminas de grama por tufo
                for (let j = 0; j < 5 + Math.random() * 8; j++) {
                    const grassBlade = new THREE.Mesh(
                        new THREE.PlaneGeometry(0.05, 0.3 + Math.random() * 0.4),
                        new THREE.MeshLambertMaterial({ 
                            color: new THREE.Color().setHSL(0.25 + Math.random() * 0.1, 0.6 + Math.random() * 0.3, 0.3 + Math.random() * 0.2),
                            side: THREE.DoubleSide,
                            transparent: true,
                            opacity: 0.8 + Math.random() * 0.2
                        })
                    );
                    
                    // Posicionar e rotacionar cada lâmina
                    grassBlade.position.set(
                        (Math.random() - 0.5) * 0.2,
                        (0.15 + Math.random() * 0.2),
                        (Math.random() - 0.5) * 0.2
                    );
                    grassBlade.rotation.y = Math.random() * Math.PI * 2;
                    grassBlade.rotation.z = (Math.random() - 0.5) * 0.3;
                    
                    grassTuft.add(grassBlade);
                }
                
                // Posicionar tufo aleatoriamente
                grassTuft.position.set(
                    (Math.random() - 0.5) * 60,
                    0,
                    (Math.random() - 0.5) * 60
                );
                
                scene.add(grassTuft);
            }
        }

        function createNaturalLandscape() {
            // Criar montanhas ao fundo
            createMountains(); 
            
            // Criar árvores espalhadas
            createTrees(); 
            
            // Criar rochas e pedras
            createRocks(); 
            
            // Criar flores e detalhes na grama
            createFlowers(); 
        }

        function createMountains() {
            // Criar uma única grande montanha majestosa
            createMajesticMountain(0, -80, 35, 40, 0x8B7355); 
        }

        function createMajesticMountain(x, z, baseWidth, height, color) {
            const mountainGroup = new THREE.Group();
            
            // Base da montanha (mais larga e imponente)
            const baseGeometry = new THREE.CylinderGeometry(baseWidth * 0.9, baseWidth, height * 0.3, 16);
            const baseMountain = new THREE.Mesh(baseGeometry, new THREE.MeshLambertMaterial({ color: color }));
            baseMountain.position.y = height * 0.15;
            baseMountain.castShadow = true;
            baseMountain.receiveShadow = true;
            mountainGroup.add(baseMountain);

            // Meio da montanha
            const midGeometry = new THREE.CylinderGeometry(baseWidth * 0.6, baseWidth * 0.8, height * 0.3, 14);
            const midMountain = new THREE.Mesh(midGeometry, new THREE.MeshLambertMaterial({ 
                color: new THREE.Color(color).multiplyScalar(0.9) 
            }));
            midMountain.position.y = height * 0.4;
            midMountain.castShadow = true;
            midMountain.receiveShadow = true;
            mountainGroup.add(midMountain);

            // Parte superior da montanha
            const upperGeometry = new THREE.CylinderGeometry(baseWidth * 0.3, baseWidth * 0.5, height * 0.25, 12);
            const upperMountain = new THREE.Mesh(upperGeometry, new THREE.MeshLambertMaterial({ 
                color: new THREE.Color(color).multiplyScalar(0.8) 
            }));
            upperMountain.position.y = height * 0.675;
            upperMountain.castShadow = true;
            upperMountain.receiveShadow = true;
            mountainGroup.add(upperMountain);

            // Pico da montanha
            const peakGeometry = new THREE.CylinderGeometry(baseWidth * 0.05, baseWidth * 0.2, height * 0.2, 10);
            const peak = new THREE.Mesh(peakGeometry, new THREE.MeshLambertMaterial({ 
                color: new THREE.Color(color).multiplyScalar(0.7) 
            }));
            peak.position.y = height * 0.85;
            peak.castShadow = true;
            peak.receiveShadow = true;
            mountainGroup.add(peak);

            // Neve no topo - camada principal
            const mainSnowGeometry = new THREE.CylinderGeometry(baseWidth * 0.03, baseWidth * 0.15, height * 0.15, 10);
            const mainSnow = new THREE.Mesh(mainSnowGeometry, new THREE.MeshLambertMaterial({ color: 0xFFFAFA }));
            mainSnow.position.y = height * 0.925;
            mainSnow.castShadow = true;
            mainSnow.receiveShadow = true;
            mountainGroup.add(mainSnow);

            // Traços de neve - detalhes adicionais
            for (let i = 0; i < 6; i++) {
                const snowPatchGeometry = new THREE.SphereGeometry(0.8 + Math.random() * 0.5, 8, 6);
                const snowPatch = new THREE.Mesh(snowPatchGeometry, new THREE.MeshLambertMaterial({ color: 0xF0F8FF }));
                
                const angle = (i / 6) * Math.PI * 2;
                const distance = baseWidth * 0.12 + Math.random() * baseWidth * 0.08;
                snowPatch.position.set(
                    Math.cos(angle) * distance,
                    height * 0.8 + Math.random() * height * 0.1,
                    Math.sin(angle) * distance
                );
                snowPatch.scale.y = 0.3 + Math.random() * 0.2;
                snowPatch.castShadow = true;
                snowPatch.receiveShadow = true;
                mountainGroup.add(snowPatch);
            }

            // Traços de neve nas encostas
            for (let i = 0; i < 8; i++) {
                const snowStreakGeometry = new THREE.CylinderGeometry(0.2, 0.4, 3 + Math.random() * 2, 6);
                const snowStreak = new THREE.Mesh(snowStreakGeometry, new THREE.MeshLambertMaterial({ color: 0xF5F5F5 }));
                
                const angle = (i / 8) * Math.PI * 2;
                const distance = baseWidth * 0.2 + Math.random() * baseWidth * 0.15;
                snowStreak.position.set(
                    Math.cos(angle) * distance,
                    height * 0.7 + Math.random() * height * 0.15,
                    Math.sin(angle) * distance
                );
                snowStreak.rotation.z = (Math.random() - 0.5) * 0.5;
                snowStreak.castShadow = true;
                snowStreak.receiveShadow = true;
                mountainGroup.add(snowStreak);
            }

            // Adicionar detalhes rochosos
            for (let i = 0; i < 5; i++) {
                const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 3 + 1);
                const rock = new THREE.Mesh(rockGeometry, new THREE.MeshLambertMaterial({ 
                    color: new THREE.Color(color).multiplyScalar(0.6) 
                }));
                rock.position.set(
                    (Math.random() - 0.5) * baseWidth * 0.7,
                    Math.random() * height * 0.5,
                    (Math.random() - 0.5) * baseWidth * 0.7
                );
                rock.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                rock.castShadow = true;
                rock.receiveShadow = true;
                mountainGroup.add(rock);
            }

            // Adicionar arbustos ao redor da base da montanha
            for (let i = 0; i < 12; i++) {
                const bushGroup = new THREE.Group();
                
                // Corpo do arbusto
                const bushGeometry = new THREE.SphereGeometry(0.6 + Math.random() * 0.8, 8, 6);
                const bushMaterial = new THREE.MeshLambertMaterial({ color: 0x355E3B });
                const bush = new THREE.Mesh(bushGeometry, bushMaterial);
                bush.scale.y = 0.5 + Math.random() * 0.4;
                bush.castShadow = true;
                bush.receiveShadow = true;
                bushGroup.add(bush);
                
                // Posicionar arbustos ao redor da base da montanha
                const angle = (i / 12) * Math.PI * 2;
                const distance = baseWidth * 0.9 + Math.random() * baseWidth * 0.3;
                bushGroup.position.set(
                    Math.cos(angle) * distance,
                    0,
                    Math.sin(angle) * distance
                );
                
                mountainGroup.add(bushGroup);
            }

            mountainGroup.position.set(x, 0, z);
            scene.add(mountainGroup);
            objects.push(mountainGroup);
        }

        function createTrees() {
            // Criar várias árvores espalhadas
            for (let i = 0; i < 20; i++) {
                const treeGroup = new THREE.Group();
                
                // Tronco da árvore
                const trunkGeometry = new THREE.CylinderGeometry(0.3, 0.4, 3);
                const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
                const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
                trunk.position.y = 1.5;
                trunk.castShadow = true;
                trunk.receiveShadow = true;
                treeGroup.add(trunk);

                // Copa da árvore
                const leavesGeometry = new THREE.SphereGeometry(2, 8, 6);
                const leavesMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
                const leaves = new THREE.Mesh(leavesGeometry, leavesMaterial);
                leaves.position.y = 4;
                leaves.castShadow = true;
                leaves.receiveShadow = true;
                treeGroup.add(leaves);

                // Posicionar árvore aleatoriamente
                treeGroup.position.set(
                    (Math.random() - 0.5) * 150,
                    0,
                    (Math.random() - 0.5) * 150
                );

                // Evitar colocar árvores muito perto do centro
                if (Math.abs(treeGroup.position.x) < 10 && Math.abs(treeGroup.position.z) < 10) {
                    continue;
                }

                scene.add(treeGroup);
                objects.push(treeGroup);
            }
        }

        function createRocks() {
            // Criar pedras espalhadas
            for (let i = 0; i < 15; i++) {
                const rockGeometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5);
                const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
                const rock = new THREE.Mesh(rockGeometry, rockMaterial);
                
                rock.position.set(
                    (Math.random() - 0.5) * 100,
                    Math.random() * 0.5,
                    (Math.random() - 0.5) * 100
                );
                
                rock.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                rock.castShadow = true;
                rock.receiveShadow = true;
                scene.add(rock);
                objects.push(rock);
            }
        }

        function createFlowers() {
            // Criar flores coloridas espalhadas
            const flowerColors = [0xFF69B4, 0xFF4500, 0xFFD700, 0x9370DB, 0x00CED1];
            
            for (let i = 0; i < 30; i++) {
                const flowerGroup = new THREE.Group();
                
                // Haste da flor
                const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.5);
                const stemMaterial = new THREE.MeshLambertMaterial({ color: 0x2D5016 });
                const stem = new THREE.Mesh(stemGeometry, stemMaterial);
                stem.position.y = 0.25;
                flowerGroup.add(stem);

                // Flor
                const flowerGeometry = new THREE.SphereGeometry(0.1, 6, 4);
                const flowerColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
                const flowerMaterial = new THREE.MeshLambertMaterial({ color: flowerColor });
                const flower = new THREE.Mesh(flowerGeometry, flowerMaterial);
                flower.position.y = 0.5;
                flowerGroup.add(flower);

                flowerGroup.position.set(
                    (Math.random() - 0.5) * 80,
                    0,
                    (Math.random() - 0.5) * 80
                );

                scene.add(flowerGroup);
            }
        }

        function setupLighting() {
            // Luz ambiente
            const ambientLight = new THREE.AmbientLight(0x404040, 0.4); 
            scene.add(ambientLight);

            // Luz direcional (sol)
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(50, 50, 25);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.5;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -50;
            directionalLight.shadow.camera.right = 50;
            directionalLight.shadow.camera.top = 50;
            directionalLight.shadow.camera.bottom = -50;
            scene.add(directionalLight);

            // Luzes pontuais nos pilares
            for (let i = 0; i < 4; i++) {
                const pointLight = new THREE.PointLight(0xffffff, 0.5, 20);
                const angle = (i / 4) * Math.PI * 2;
                pointLight.position.set(Math.cos(angle) * 12, 8, Math.sin(angle) * 12);
                scene.add(pointLight);
            }
        }

        function setupControls() {
            // Adiciona o event listener para garantir a responsividade
            window.addEventListener('resize', onWindowResize, false); 
        }

        // Função principal de responsividade
        function onWindowResize() {
            // 1. Atualiza a proporção (aspect ratio) da câmera
            camera.aspect = window.innerWidth / window.innerHeight; 
            
            // 2. Atualiza a matriz de projeção da câmera (OBRIGATÓRIO)
            camera.updateProjectionMatrix(); 
            
            // 3. Redimensiona o renderizador para o novo tamanho da janela
            renderer.setSize(window.innerWidth, window.innerHeight); 
        }

        function animate(currentTime) {
            requestAnimationFrame(animate); 
            updateFPS(currentTime); 
            renderer.render(scene, camera); 
        }

        function simulateLoading() {
            let progress = 0;
            const loadingInterval = setInterval(() => {
                progress += Math.random() * 15;
                if (progress >= 100) {
                    progress = 100;
                    clearInterval(loadingInterval);
                    setTimeout(() => {
                        document.getElementById('loadingScreen').style.opacity = '0';
                        setTimeout(() => {
                            document.getElementById('loadingScreen').style.display = 'none';
                        }, 500);
                    }, 500);
                }
                document.getElementById('loadingProgress').style.width = progress + '%';
            }, 100);
        }

        // Função para alternar o menu
        function toggleMenu() { 
            menuOpen = !menuOpen;
            const menu = document.getElementById('settingsMenu');
            if (menuOpen) {
                menu.classList.add('active');
            } else {
                menu.classList.remove('active');
            }
        }

        // Função para fechar o menu
        function closeMenu() { 
            menuOpen = false;
            const menu = document.getElementById('settingsMenu');
            menu.classList.remove('active');
        }

        // Adicionar evento para fechar menu ao clicar fora
        document.addEventListener('click', function(event) { 
            if (menuOpen) {
                const menuContainer = document.querySelector('.menu-container');
                const isClickInsideMenu = menuContainer.contains(event.target);
                
                if (!isClickInsideMenu) {
                    closeMenu();
                }
            }
        });

        // FUNÇÃO DE ÁUDIO 
        function toggleMusic() { 
            const checkbox = document.getElementById('musicToggle');
            musicEnabled = checkbox.checked;
            
            if (musicEnabled) {
                // Tenta reproduzir a música. A reprodução é assíncrona.
                backgroundMusic.play().then(() => {
                    console.log('Música ativada: music001xf.mp3');
                    showNotification('🎵 Música ativada', 'success');
                }).catch(error => {
                    console.log('Erro ao tentar tocar a música (pode ser bloqueio de autoplay):', error);
                    showNotification('⚠️ Música bloqueada (necessita clique)', 'info');
                });

            } else {
                // Pausa a música e redefine para o início
                backgroundMusic.pause(); 
                backgroundMusic.currentTime = 0; 
                console.log('Música desativada');
                showNotification('🔇 Música desativada', 'info'); 
            }
        }

        // Função para mostrar notificações
        function showNotification(message, type) { 
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(0)';
            }, 100);
            
            setTimeout(() => {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, 3000);
        }

        // Função para contar FPS
        function updateFPS(currentTime) { 
            if (lastTime === 0) {
                lastTime = currentTime;
                return;
            }
            
            const deltaTime = currentTime - lastTime;
            fpsCounter = Math.round(1000 / deltaTime);
            
            const fpsElement = document.getElementById('fpsCounter');
            if (fpsElement) {
                fpsElement.textContent = fpsCounter;
            }
            
            lastTime = currentTime;
        }

        // Função para atualizar display do volume
        function updateVolumeDisplay(value) { 
            document.getElementById('volumeValue').textContent = value;
        }

        // Função para atualizar display da sensibilidade
        function updateSensitivityDisplay(value) { 
            document.getElementById('sensitivityValue').textContent = value;
        }

        // Função para iniciar o jogo
        function startGame() { 
            window.open('car.html', '_blank', 'noopener,noreferrer');
        }

        // Inicializar quando a página carregar
        window.addEventListener('load', init);