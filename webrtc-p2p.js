class WebRTCGame {
    constructor(localPlayerId) {
        this.localPlayerId = localPlayerId;
        this.peers = new Map();
        this.isHost = false;
        this.connection = null;
        this.dataChannel = null;
        
        this.config = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        };

        // Callbacks
        this.onPlayerConnected = (peerId) => console.log(`Player ${peerId} connected`);
        this.onPlayerDisconnected = (peerId) => console.log(`Player ${peerId} disconnected`);
        this.onDataReceived = (peerId, data) => console.log(`Data from ${peerId}:`, data);
        this.onError = (message) => console.error(`[P2P Error]: ${message}`);
        this.onSignal = (type, data) => console.log(`[Signal ${type}]:`, data);
    }

    // HOST: Criar sala
    async createRoom() {
        this.isHost = true;
        this.connection = new RTCPeerConnection(this.config);
        this.dataChannel = this.connection.createDataChannel("game", { ordered: true });
        
        this._setupDataChannel();
        this._setupConnectionEvents();
        
        const offer = await this.connection.createOffer();
        await this.connection.setLocalDescription(offer);
        
        // Retorna o offer para ser compartilhado
        return {
            type: 'offer',
            sdp: offer,
            senderId: this.localPlayerId
        };
    }

    // GUEST: Entrar na sala
    async joinRoom(offerData) {
        this.isHost = false;
        this.connection = new RTCPeerConnection(this.config);
        
        this._setupConnectionEvents();
        
        // Configurar o offer recebido
        await this.connection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
        
        // Criar answer
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        
        return {
            type: 'answer', 
            sdp: answer,
            senderId: this.localPlayerId
        };
    }

    // HOST: Processar answer do guest
    async handleAnswer(answerData) {
        if (!this.isHost) return;
        
        await this.connection.setRemoteDescription(new RTCSessionDescription(answerData.sdp));
    }

    // GUEST: Processar offer do host
    async handleOffer(offerData) {
        if (this.isHost) return;
        
        await this.connection.setRemoteDescription(new RTCSessionDescription(offerData.sdp));
        const answer = await this.connection.createAnswer();
        await this.connection.setLocalDescription(answer);
        
        return {
            type: 'answer',
            sdp: answer,
            senderId: this.localPlayerId
        };
    }

    _setupDataChannel() {
        if (!this.dataChannel) return;

        this.dataChannel.onopen = () => {
            console.log('Data channel opened');
            this.onPlayerConnected('remote-player');
        };

        this.dataChannel.onclose = () => {
            console.log('Data channel closed');
            this.onPlayerDisconnected('remote-player');
        };

        this.dataChannel.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this.onDataReceived('remote-player', data);
            } catch (e) {
                console.error('Error parsing message:', e);
            }
        };
    }

    _setupConnectionEvents() {
        this.connection.ondatachannel = (event) => {
            this.dataChannel = event.channel;
            this._setupDataChannel();
        };

        this.connection.onicecandidate = (event) => {
            if (event.candidate) {
                console.log('New ICE candidate:', event.candidate);
            }
        };

        this.connection.onconnectionstatechange = () => {
            console.log('Connection state:', this.connection.connectionState);
        };
    }

    // Enviar dados para o peer
    send(data) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(JSON.stringify(data));
        }
    }

    // Broadcast (para futuras expansões)
    broadcast(data) {
        this.send(data);
    }

    // Verificar se está conectado
    isConnected() {
        return this.dataChannel && this.dataChannel.readyState === 'open';
    }

    // Contagem de conexões
    getConnectionCount() {
        return this.isConnected() ? 1 : 0;
    }
}