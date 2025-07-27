// Game initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId = null;
let running = true;

// Game configuration
const config = {
    character: {
        width: 200,
        height: 200,
        startX: 10,
        startY: 285,
        speed: 4,
        jumpPower: 10,
        gravity: 0.5,
        walkAnimationSpeed: 0.2
    },
    elahe: {
        x: 520,
        y: 255,
        width: 200,
        height: 200,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        animationSpeed: 2
    },
    mahsa: {
        x: 320,
        y: 248,
        width: 200,
        height: 200,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        animationSpeed: 2
    },
    sohrab: {
        x: 700,
        y: 261,
        width: 181,
        height: 181,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        animationSpeed: 2
    },
    items: {
        size: 40,
        spawnPositions: [
            { x: 150, y: 450 }
        ],
        collectionRange: 100
    },
    interactionRange: 150,
    sohrabInteractionRange: 60,
    dialogue: {
        typingSpeed: 30,
        skipSpeed: 5
    },
    audio: {
        volume: 0.5,
        fadeDuration: 1000
    },
    scenes: {
        doorTrigger: {
            x: 950,
            y: 250,
            width: 50,
            height: 200
        }
    },
    dialogues: {
        elahe: [
            { name: "الهه اسمائیلی فر", text: "سلام ارغوااان چقدر درس خوندی؟؟ مهساچند درصد زد؟" },
            { name: "الهه اسمائیلی فر", text: "راستی میدونستی قراره ازدواج کنم؟" },
            { name: "الهه اسمائیلی فر", text: "مطمئنم هیچوقت جدا نمیشیم!" },
            { name: "الهه اسمائیلی فر", text: "خودم میرم اصلا از مهسا میپرسم خدافظ!" }
        ],
        mahsa: [
            { name: "مهسا مظفری", text: "اگه قرار بود بیام اینجا معلم از رو بخونه خونه میموندم." },
            { name: "مهسا مظفری", text: "این معلم ریاضیه هیچی بارش نیست بریم اعتراض." }
        ],
        sohrab: [
            { name: "سهراب", text: "سلام فرخی." },
            { name: "سهراب", text: "چقدر مانتو مدرسه بهت میاد." },
            { name: "سهراب", text: "چیزی که میخوام بگم شبیه بازیه..." },
            { name: "سهراب", text: "مادوکسمو گم کردم راستش." },
            { name: "سهراب", text: "گفتم شاید تو بتونی پیدا کنی چند نخ" },
            { name: "سهراب", text: "هرموقع هرجا سیگارمو دیدی دکمه‌ی a رو بزن" },
            { name: "سهراب", text: "خیلی طول نمیکشه..." },
            { name: "سهراب", text: "جوری نیست که دو سال و نیم طول بکشه." },
            { name: "سهراب", text: "همین، میبینمت پس." },
            { name: "سهراب", text: "فعلا!" }
        ],
        mahsa_repeat: [
            { name: "مهسا", text: "چاییت کو؟" },
            { name: "مهسا", text: "وای الهه داره نگام میکنه" }
        ],
        elahe_repeat: [
            { name: "الهه", text: "رفتی بپرسی ازش؟" }
        ],
        sohrab_repeat: [
            { name: "سهراب", text: "ملکا پیدا کردیشون؟" },
            { name: "سهراب", text: "وایسا ببینم این قلبه تو چشمت؟" }
        ]
    }
};

// Game state
const game = {
    assets: {
        background: null,
        idle: null,
        right: null,
        left: null,
        up: null,
        elahe: null,
        mahsa: null,
        sohrab: null,
        item: null,
        dialogBox: null,
        spaceHint: null
    },
    character: {
        x: config.character.startX,
        y: config.character.startY,
        direction: 'right',
        isMoving: false,
        isJumping: false,
        yVelocity: 0,
        walkFrame: 0
    },
    npcs: {
        elahe: { canInteract: false, currentFrame: 0, frameTimer: 0 },
        mahsa: { canInteract: false, currentFrame: 0, frameTimer: 0 },
        sohrab: { canInteract: false, currentFrame: 0, frameTimer: 0 }
    },
    items: {
        collected: [],
        available: []
    },
    keys: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        Space: false,
        KeyA: false
    },
    currentDialogue: null,
    currentNpc: null,
    dialogueIndex: 0,
    dialogue: {
        currentText: "",
        displayText: "",
        typing: false,
        typingTimer: 0,
        currentCharIndex: 0
    },
    lastTime: 0,
    debug: {
        showCollisionAreas: false
    },
    spaceHint: {
        visible: true,
        frame: 0,
        timer: 0,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        fps: 3
    },
    itemsVisible: false,
    audio: {
        music: null,
        isPlaying: false
    },
    sceneState: {
        canExit: false,
        transitioning: false
    },
    npcTalked: {
        elahe: false,
        mahsa: false,
        sohrab: false
    }
};

// Load assets
function loadAssets() {
    return new Promise((resolve) => {
        const assets = [
            { name: 'background', path: 'backgrounds/classroom.png' },
            { name: 'idle', path: 'sprites/melika.png' },
            { name: 'right', path: 'sprites/melikaright.png' },
            { name: 'left', path: 'sprites/melikaleft.png' },
            { name: 'up', path: 'sprites/melikaup.png' },
            { name: 'elahe', path: 'sprites/elahe.png' },
            { name: 'mahsa', path: 'sprites/mahsa.png' },
            { name: 'sohrab', path: 'sprites/sohrab.png' },
            { name: 'item', path: 'sprites/object.png' },
            { name: 'dialogBox', path: 'sprites/dialogue.png' },
            { name: 'spaceHint', path: 'sprites/space.png' }
        ];

        let loaded = 0;
        assets.forEach(asset => {
            game.assets[asset.name] = new Image();
            game.assets[asset.name].src = asset.path;
            game.assets[asset.name].onload = () => {
                loaded++;
                if (loaded === assets.length) resolve();
            };
        });
    });
}

// Initialize items
function initItems() {
    game.items.available = config.items.spawnPositions.map(pos => ({
        x: pos.x,
        y: pos.y,
        collected: false
    }));
    game.items.collected = [];
}

// Check item collection
function checkItemCollection() {
    game.items.available = game.items.available.filter(item => {
        if (item.collected) return false;
        
        const charCenterX = game.character.x + config.character.width/2;
        const charCenterY = game.character.y + config.character.height/2;
        const itemCenterX = item.x + config.items.size/2;
        const itemCenterY = item.y + config.items.size/2;
        
        const dx = charCenterX - itemCenterX;
        const dy = charCenterY - itemCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < config.items.collectionRange && game.keys.KeyA) {
            item.collected = true;
            game.items.collected.push({
                x: 20 + (game.items.collected.length * 45),
                y: 20
            });
            return false;
        }
        return true;
    });
}

// Render items
function renderItems() {
    if (!game.itemsVisible) return;

    game.items.available.forEach(item => {
        if (!item.collected && game.assets.item?.complete) {
            ctx.drawImage(
                game.assets.item,
                item.x,
                item.y,
                config.items.size,
                config.items.size
            );
        }
    });

    game.items.collected.forEach(pos => {
        if (game.assets.item?.complete) {
            ctx.drawImage(
                game.assets.item,
                pos.x,
                pos.y,
                config.items.size,
                config.items.size
            );
        }
    });
}

// Typewriter effect
function startTypewriterEffect(text) {
    game.dialogue.currentText = text;
    game.dialogue.displayText = "";
    game.dialogue.typing = true;
    game.dialogue.currentCharIndex = 0;
    game.dialogue.typingTimer = 0;
    document.getElementById('dialogText').textContent = "";
}

function updateTypewriterEffect(deltaTime) {
    if (!game.dialogue.typing) return;
    
    game.dialogue.typingTimer += deltaTime;
    const speed = game.keys.Space ? config.dialogue.skipSpeed : config.dialogue.typingSpeed;
    
    while (game.dialogue.typingTimer >= speed && 
           game.dialogue.currentCharIndex < game.dialogue.currentText.length) {
        game.dialogue.displayText += game.dialogue.currentText.charAt(game.dialogue.currentCharIndex);
        game.dialogue.currentCharIndex++;
        game.dialogue.typingTimer -= speed;
        document.getElementById('dialogText').textContent = game.dialogue.displayText;
    }
    
    if (game.dialogue.currentCharIndex >= game.dialogue.currentText.length) {
        game.dialogue.typing = false;
    }
}

function completeTypewriterEffect() {
    if (game.dialogue.typing) {
        game.dialogue.displayText = game.dialogue.currentText;
        game.dialogue.typing = false;
        document.getElementById('dialogText').textContent = game.dialogue.displayText;
        return true;
    }
    return false;
}

// Dialogue system
function showDialogue(npc) {
    let dialogueKey = npc;
    if (game.npcTalked[npc]) {
        dialogueKey = npc + '_repeat';
    }
    game.currentNpc = npc;
    game.currentDialogue = config.dialogues[dialogueKey];
    game.dialogueIndex = 0;
    game.dialogue.currentText = game.currentDialogue[0].text;
    game.dialogue.displayText = "";
    game.dialogue.typing = true;
    game.dialogue.typingTimer = 0;
    game.dialogue.currentCharIndex = 0;
    updateDialogueBox();
    document.getElementById('dialogContainer').style.display = 'flex';
}

function updateDialogueBox() {
    const current = game.currentDialogue[game.dialogueIndex];
    document.getElementById('dialogName').textContent = current.name;
    startTypewriterEffect(current.text);
}

function nextDialogue() {
    if (!game.currentDialogue) return;
    game.dialogueIndex++;
    if (game.dialogueIndex < game.currentDialogue.length) {
        game.dialogue.currentText = game.currentDialogue[game.dialogueIndex].text;
        game.dialogue.displayText = "";
        game.dialogue.typing = true;
        game.dialogue.typingTimer = 0;
        game.dialogue.currentCharIndex = 0;
    } else {
        if (game.currentNpc && !game.npcTalked[game.currentNpc]) {
            game.npcTalked[game.currentNpc] = true;
        }
        game.currentDialogue = null;
        game.currentNpc = null;
    }

    const endOfDialogue = !game.currentDialogue || game.dialogueIndex >= game.currentDialogue.length;
    if (endOfDialogue) {
        document.getElementById('dialogContainer').style.display = 'none';
    }
}

// Update NPC animations
function updateNpcAnimations(deltaTime, npcKey) {
    const npc = game.npcs[npcKey];
    npc.frameTimer += deltaTime;
    const frameInterval = 1000 / config[npcKey].animationSpeed;
    
    if (npc.frameTimer >= frameInterval) {
        npc.frameTimer = 0;
        npc.currentFrame = (npc.currentFrame + 1) % config[npcKey].frameCount;
    }
}

// Check interactions
function checkInteractions() {
    // Elahe
    const dxElahe = game.character.x - config.elahe.x;
    const dyElahe = game.character.y - config.elahe.y;
    game.npcs.elahe.canInteract = Math.sqrt(dxElahe * dxElahe + dyElahe * dyElahe) < config.interactionRange;

    // Mahsa
    const dxMahsa = game.character.x - config.mahsa.x;
    const dyMahsa = game.character.y - config.mahsa.y;
    game.npcs.mahsa.canInteract = Math.sqrt(dxMahsa * dxMahsa + dyMahsa * dyMahsa) < config.interactionRange;

    // Sohrab
    const dxSohrab = game.character.x - config.sohrab.x;
    const dySohrab = game.character.y - config.sohrab.y;
    const distance = Math.sqrt(dxSohrab * dxSohrab + dySohrab * dySohrab);
    game.npcs.sohrab.canInteract = distance < config.sohrabInteractionRange;
}

// Audio functions
function startBackgroundMusic() {
    game.audio.music = document.getElementById('backgroundMusic');
    game.audio.music.volume = config.audio.volume;
    game.audio.music.play()
        .then(() => game.audio.isPlaying = true)
        .catch(e => console.log("Audio play failed:", e));
}

function fadeOutMusic() {
    const fadeInterval = setInterval(() => {
        if (game.audio.music.volume > 0.1) {
            game.audio.music.volume -= 0.05;
        } else {
            game.audio.music.pause();
            game.audio.isPlaying = false;
            clearInterval(fadeInterval);
        }
    }, config.audio.fadeDuration / 20);
}

// Scene transition
function startSceneTransition(targetScene) {
    if (game.sceneState.transitioning) return;
    game.sceneState.transitioning = true;
    const overlay = document.getElementById('fadeOverlay');
    overlay.style.opacity = 1;

    fadeOutMusic();

    setTimeout(() => {
        console.log("Transitioning to:", targetScene);
        overlay.style.opacity = 0;
        game.sceneState.transitioning = false;

        if (targetScene === 'scene1') {
            running = false;
            if (gameLoopId) cancelAnimationFrame(gameLoopId);
            window.removeEventListener('keydown', handleKeyDown);
            window.removeEventListener('keyup', handleKeyUp);
            import('./scenes/scene1.js').then(module => {
                module.startScene1();
            });
        }
    }, config.audio.fadeDuration);
}

// Update space hint animation
function updateSpaceHint(deltaTime) {
    if (!game.spaceHint.visible) return;
    game.spaceHint.timer += deltaTime;
    const frameDuration = 1000 / game.spaceHint.fps;
    if (game.spaceHint.timer >= frameDuration) {
        game.spaceHint.timer -= frameDuration;
        game.spaceHint.frame = (game.spaceHint.frame + 1) % game.spaceHint.frameCount;
    }
}

// Update game state
function update(timestamp) {
    const deltaTime = timestamp - game.lastTime;
    game.lastTime = timestamp;
    
    if (!game.currentDialogue && !game.sceneState.transitioning) {
        updateNpcAnimations(deltaTime, 'elahe');
        updateNpcAnimations(deltaTime, 'mahsa');
        updateNpcAnimations(deltaTime, 'sohrab');
        updateSpaceHint(deltaTime);

        if (game.keys.ArrowLeft) {
            game.character.x -= config.character.speed;
            game.character.x = Math.max(0, game.character.x);
            game.character.walkFrame += config.character.walkAnimationSpeed;
        }
        if (game.keys.ArrowRight) {
            game.character.x += config.character.speed;
            game.character.x = Math.min(canvas.width - config.character.width, game.character.x);
            game.character.walkFrame += config.character.walkAnimationSpeed;
        }

        if (game.character.isJumping) {
            game.character.y += game.character.yVelocity;
            game.character.yVelocity += config.character.gravity;

            if (game.character.y >= config.character.startY) {
                game.character.y = config.character.startY;
                game.character.isJumping = false;
                game.character.yVelocity = 0;
            }
        }

        checkInteractions();
        checkItemCollection();

        // Door transition check
        if (game.keys.Space && 
            game.character.x + config.character.width > config.scenes.doorTrigger.x &&
            game.character.y + config.character.height > config.scenes.doorTrigger.y &&
            game.character.y < config.scenes.doorTrigger.y + config.scenes.doorTrigger.height) {
            startSceneTransition('scene1');
        }
    } else {
        updateTypewriterEffect(deltaTime);
    }
}

// Render game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    if (game.assets.background?.complete) {
        ctx.drawImage(game.assets.background, 0, 0, canvas.width, canvas.height);
    }
    
    // Items
    renderItems();
    
    // NPCs
    // Elahe
    if (game.assets.elahe?.complete) {
        const elaheFrameY = game.npcs.elahe.currentFrame * config.elahe.frameHeight;
        ctx.drawImage(
            game.assets.elahe,
            0, elaheFrameY,
            config.elahe.frameWidth,
            config.elahe.frameHeight,
            config.elahe.x,
            config.elahe.y,
            config.elahe.width,
            config.elahe.height
        );
    }
    
    // Mahsa
    if (game.assets.mahsa?.complete) {
        const mahsaFrameY = game.npcs.mahsa.currentFrame * config.mahsa.frameHeight;
        ctx.drawImage(
            game.assets.mahsa,
            0, mahsaFrameY,
            config.mahsa.frameWidth,
            config.mahsa.frameHeight,
            config.mahsa.x,
            config.mahsa.y,
            config.mahsa.width,
            config.mahsa.height
        );
    }
    
    // Space hint
    if (game.spaceHint.visible && game.assets.spaceHint?.complete) {
        const frameY = game.spaceHint.frame * game.spaceHint.frameHeight;
        const scale = 0.15;
        const hintX = config.mahsa.x + (config.mahsa.width / 2) - (game.spaceHint.frameWidth * scale / 2);
        const hintY = config.mahsa.y - 90;

        ctx.drawImage(
            game.assets.spaceHint,
            0, frameY,
            game.spaceHint.frameWidth,
            game.spaceHint.frameHeight,
            hintX,
            hintY,
            game.spaceHint.frameWidth * scale,
            game.spaceHint.frameHeight * scale
        );
    }

    // Sohrab
    if (game.assets.sohrab?.complete) {
        const sohrabFrameY = game.npcs.sohrab.currentFrame * config.sohrab.frameHeight;
        ctx.drawImage(
            game.assets.sohrab,
            0, sohrabFrameY,
            config.sohrab.frameWidth,
            config.sohrab.frameHeight,
            config.sohrab.x,
            config.sohrab.y,
            config.sohrab.width,
            config.sohrab.height
        );
    }
    
    // Main character
    let currentSprite;
    if (game.character.isJumping) {
        currentSprite = game.assets.up;
    } else if (game.character.isMoving) {
        currentSprite = game.character.direction === 'left' ? game.assets.left : game.assets.right;
    } else {
        currentSprite = game.assets.idle;
    }
    
    if (currentSprite?.complete) {
        ctx.drawImage(
            currentSprite,
            game.character.x,
            game.character.y,
            config.character.width,
            config.character.height
        );
    }
}

// Input handling
function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'a') {
        game.keys.KeyA = true;
        checkItemCollection();
    }
    if (key === 'arrowleft') {
        game.keys.ArrowLeft = true;
        game.character.direction = 'left';
        game.character.isMoving = true;
    }
    if (key === 'arrowright') {
        game.keys.ArrowRight = true;
        game.character.direction = 'right';
        game.character.isMoving = true;
    }
    if (key === 'arrowup' || key === ' ') {
        if (key === 'arrowup' && !game.character.isJumping && game.character.y === config.character.startY) {
            game.character.isJumping = true;
            game.character.yVelocity = -config.character.jumpPower;
        }
        if (key === ' ') {
            game.keys.Space = true;
            if (!game.currentDialogue) {
                if (game.npcs.elahe.canInteract) showDialogue('elahe');
                else if (game.npcs.mahsa.canInteract) {
                    showDialogue('mahsa');
                    game.spaceHint.visible = false;
                }
                else if (game.npcs.sohrab.canInteract) {
                    showDialogue('sohrab');
                    game.itemsVisible = true;
                }
            } else if (game.currentDialogue) {
                nextDialogue();
            }
        }
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'a') game.keys.KeyA = false;
    if (key === 'arrowleft') game.keys.ArrowLeft = false;
    if (key === 'arrowright') game.keys.ArrowRight = false;
    if (key === ' ') game.keys.Space = false;
    game.character.isMoving = game.keys.ArrowLeft || game.keys.ArrowRight;
    if (!game.character.isMoving) game.character.direction = 'idle';
}

function setupInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

// Game loop
function gameLoop(timestamp) {
    if (!running) return; // Stop loop if not running
    update(timestamp);
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Initialize game
async function initGame() {
    try {
        await loadAssets();
        initItems();
        setupInput();
        startBackgroundMusic();
        game.lastTime = performance.now();
        gameLoop(game.lastTime);
    } catch (error) {
        console.error("Game failed to start:", error);
    }
}

// Add this in your main.js after a user action (e.g. first keydown or click)
document.addEventListener('keydown', () => {
    const bgm = document.getElementById('backgroundMusic');
    if (bgm && bgm.paused) {
        bgm.volume = 0.5;
        bgm.play();
    }
}, { once: true });

// Start the game
window.addEventListener('load', initGame);