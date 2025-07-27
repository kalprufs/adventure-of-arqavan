// Game initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId = null;
let running = true;

// Game configuration
const config = {
    canvas: {
        width: 1024,
        height: 512
    },
    character: {
        width: 64, // Reduced rendered width
        height: 64, // Reduced rendered height
        startX: 10,
        startY: 400,
        speed: 4,
        jumpPower: 10,
        gravity: 0.5,
        walkAnimationSpeed: 0.05,
        sourceFrameWidth: 512, // Original frame size in sprite sheet
        sourceFrameHeight: 512,
        sourceOffsetX: (1024 - 512) / 2,
        sourceOffsetY: (1024 - 512) / 2,
    },
    elahe: {
        x: 520, y: 380, width: 64, height: 64,
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    mahsa: {
        x: 320, y: 380, width: 64, height: 64,
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    sohrab: {
        x: 700, y: 380, width: 64, height: 64,
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    spaceHint: {
        x: 400, y: 100, width: 64, height: 64,
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    object: {
        width: 32,
        height: 32,
        sourceFrameWidth: 100,
        sourceFrameHeight: 100,
        sourceOffsetX: (1024 - 100) / 2,
        sourceOffsetY: (1024 - 100) / 2,
    }
};

// Set initial canvas size
canvas.width = config.canvas.width;
canvas.height = config.canvas.height;

// Game state
const game = {
    currentScene: 'scene0',
    transitioning: false,
    assets: {},
    currentBackgroundMusic: null,
    keys: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        Space: false,
        KeyA: false,
        KeyM: false,
    },
    character: {
        x: config.character.startX,
        y: config.character.startY,
        width: config.character.width,
        height: config.character.height,
        isMoving: false,
        isJumping: false,
        yVelocity: 0,
        direction: 'idle',
        animationFrame: 0,
        lastFrameTime: 0,
    },
    npcs: {
        elahe: {
            x: config.elahe.x,
            y: config.elahe.y,
            currentFrame: 0,
            lastFrameTime: 0,
            dialogueTriggered: false
        },
        mahsa: {
            x: config.mahsa.x,
            y: config.mahsa.y,
            currentFrame: 0,
            lastFrameTime: 0,
            dialogueTriggered: false
        },
        sohrab: {
            x: config.sohrab.x,
            y: config.sohrab.y,
            currentFrame: 0,
            lastFrameTime: 0,
            dialogueTriggered: false
        }
    },
    spaceHintActive: false,
    spaceHintCurrentFrame: 0,
    spaceHintLastFrameTime: 0,
    dialogue: {
        active: false,
        speaker: '',
        text: '',
        currentLine: 0,
        lines: [],
        dialogueBox: document.getElementById('dialogContainer'),
        speakerBox: document.getElementById('speakerName'),
        textBox: document.getElementById('dialogText'),
    },
    items: [],
    collectedObjects: 0,
    door: {
        x: 900,
        y: 350,
        width: 64,
        height: 128
    },
    lastTime: 0,
};

// Dialogue Data
const dialogues = {
    elahe: [
        { speaker: 'Elahe', text: 'Hello, I am Elahe. Welcome to the game.' },
        { speaker: 'Elahe', text: 'Press A to advance dialogue.' },
        { speaker: 'Elahe', text: 'You can move with arrow keys.' }
    ],
    mahsa: [
        { speaker: 'Mahsa', text: 'Hey there! How are you?' },
        { speaker: 'Mahsa', text: 'I hope you enjoy your adventure.' }
    ],
    sohrab: [
        { speaker: 'Sohrab', text: 'Greetings, traveler!' },
        { speaker: 'Sohrab', text: 'Look around for interesting things.' }
    ]
};

// Asset loading
const assetList = [
    { name: 'background', path: 'backgrounds/classroom.png' },
    { name: 'melika', path: 'sprites/melika.png' },
    { name: 'melikaleft', path: 'sprites/melikaleft.png' },
    { name: 'melikaright', path: 'sprites/melikaright.png' },
    { name: 'melikaup', path: 'sprites/melikaup.png' },
    { name: 'elahe', path: 'sprites/elahe.png' },
    { name: 'mahsa', path: 'sprites/mahsa.png' },
    { name: 'sohrab', path: 'sprites/sohrab.png' },
    { name: 'dialogue', path: 'sprites/dialogue.png' },
    { name: 'object', path: 'sprites/object.png' },
    { name: 'space', path: 'sprites/space.png' },
    { name: 'backgroundsong', path: 'song/backgroundsong.mp3', type: 'audio' }
];

let assetsLoaded = 0;
let assetsFailed = 0;
const totalAssets = assetList.length;

async function loadAssets() {
    return new Promise((resolve, reject) => {
        assetList.forEach(asset => {
            if (asset.type === 'audio') {
                const audio = new Audio();
                audio.src = asset.path;
                audio.loop = true;
                game.assets[asset.name] = audio;

                const onCanPlayThrough = () => {
                    assetsLoaded++;
                    console.log(`Loaded audio: ${asset.name}`);
                    audio.removeEventListener('canplaythrough', onCanPlayThrough);
                    audio.removeEventListener('error', onError);
                    if (assetsLoaded + assetsFailed === totalAssets) {
                        resolve();
                    }
                };

                const onError = () => {
                    assetsFailed++;
                    console.error(`Failed to load audio: ${asset.name}`);
                    audio.removeEventListener('canplaythrough', onCanPlayThrough);
                    audio.removeEventListener('error', onError);
                    if (assetsLoaded + assetsFailed === totalAssets) {
                        resolve();
                    }
                };

                audio.addEventListener('canplaythrough', onCanPlayThrough);
                audio.addEventListener('error', onError);
                audio.load();
            } else {
                const img = new Image();
                img.src = asset.path;
                game.assets[asset.name] = img;

                img.onload = () => {
                    assetsLoaded++;
                    console.log(`Loaded image: ${asset.name}`);
                    if (assetsLoaded + assetsFailed === totalAssets) {
                        resolve();
                    }
                };

                img.onerror = (e) => {
                    assetsFailed++;
                    console.error(`Error loading asset: ${asset.name}`, e);
                    if (assetsLoaded + assetsFailed === totalAssets) {
                        reject(new Error(`Failed to load asset: ${asset.name}`));
                    }
                };
            }
        });
    });
}

// Music control
function startBackgroundMusic() {
    if (game.assets.backgroundsong && !game.currentBackgroundMusic) {
        game.currentBackgroundMusic = game.assets.backgroundsong;
        game.currentBackgroundMusic.volume = 0.5;
        game.currentBackgroundMusic.play().catch(e => {
            console.log("Audio play failed (user gesture required):", e);
        });
    }
}

function stopBackgroundMusic() {
    if (game.currentBackgroundMusic) {
        game.currentBackgroundMusic.pause();
        game.currentBackgroundMusic.currentTime = 0;
        game.currentBackgroundMusic = null;
    }
}

function toggleMusic() {
    if (game.currentBackgroundMusic) {
        if (game.currentBackgroundMusic.paused) {
            startBackgroundMusic();
        } else {
            stopBackgroundMusic();
        }
    } else {
        startBackgroundMusic();
    }
}

// Item handling
function createItem(x, y, type) {
    return {
        x: x,
        y: y,
        type: type,
        collected: false
    };
}

function initItems() {
    game.items.push(createItem(150, 450, 'collectable'));
    game.items.push(createItem(600, 200, 'collectable'));
}

// Dialogue system
function startDialogue(speaker, lines) {
    if (game.dialogue.active) return;

    game.dialogue.active = true;
    game.dialogue.speaker = speaker;
    game.dialogue.lines = lines;
    game.dialogue.currentLine = 0;

    game.dialogue.dialogueBox.style.display = 'block';
    updateDialogueDisplay();
}

function updateDialogueDisplay() {
    if (game.dialogue.currentLine < game.dialogue.lines.length) {
        const line = game.dialogue.lines[game.dialogue.currentLine];
        game.dialogue.speakerBox.textContent = line.speaker;
        game.dialogue.textBox.textContent = line.text;
    } else {
        endDialogue();
    }
}

function advanceDialogue() {
    if (game.dialogue.active) {
        game.dialogue.currentLine++;
        updateDialogueDisplay();
    }
}

function endDialogue() {
    game.dialogue.active = false;
    game.dialogue.dialogueBox.style.display = 'none';
    game.dialogue.speakerBox.textContent = '';
    game.dialogue.textBox.textContent = '';

    if (game.character.direction === 'left' && Math.abs(game.character.x - game.npcs.mahsa.x) < 100) {
        game.npcs.mahsa.dialogueTriggered = true;
    }
    if (game.character.direction === 'right' && Math.abs(game.character.x - game.npcs.sohrab.x) < 100) {
        game.npcs.sohrab.dialogueTriggered = true;
    }
    if (game.character.direction === 'idle' && Math.abs(game.character.x - game.npcs.elahe.x) < 100) {
        game.npcs.elahe.dialogueTriggered = true;
    }
}

// Scene Transition
async function startSceneTransition(sceneFileName) {
    if (game.transitioning) return;
    game.transitioning = true;
    stopBackgroundMusic();

    const overlay = document.getElementById('fadeOverlay');
    if (overlay) {
        overlay.style.transition = 'opacity 1s';
        overlay.style.opacity = 1;
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    try {
        const module = await import(`./${sceneFileName}`);
        if (module && typeof module[`start${sceneFileName.charAt(0).toUpperCase() + sceneFileName.slice(1).replace('.js', '')}`] === 'function') {
            module[`start${sceneFileName.charAt(0).toUpperCase() + sceneFileName.slice(1).replace('.js', '')}`]();
        } else {
            console.error(`Error: Entry function 'start${sceneFileName.charAt(0).toUpperCase() + sceneFileName.slice(1).replace('.js', '')}' not found in ${sceneFileName}`);
        }
    } catch (error) {
        console.error(`Failed to load ${sceneFileName}:`, error);
        game.transitioning = false;
        if (overlay) overlay.style.opacity = 0;
        setupInput();
        startBackgroundMusic();
    }
}

// Drawing function
function drawSprite(asset, x, y, width, height, sourceX = 0, sourceY = 0, sourceWidth = asset.width, sourceHeight = asset.height) {
    if (!asset || !asset.complete) { return; }
    ctx.drawImage(asset, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}

// Update game state
function update(timestamp) {
    if (game.transitioning) return;

    const delta = timestamp - game.lastTime;
    game.lastTime = timestamp;

    if (!game.dialogue.active) {
        if (game.keys.ArrowLeft) {
            game.character.x = Math.max(0, game.character.x - config.character.speed * (delta / (1000 / 60)));
            game.character.direction = 'left';
            game.character.isMoving = true;
        } else if (game.keys.ArrowRight) {
            game.character.x = Math.min(canvas.width - game.character.width, game.character.x + config.character.speed * (delta / (1000 / 60)));
            game.character.direction = 'right';
            game.character.isMoving = true;
        } else {
            game.character.isMoving = false;
            game.character.direction = 'idle';
        }

        if (game.keys.ArrowUp && !game.character.isJumping) {
            game.character.isJumping = true;
            game.character.yVelocity = -config.character.jumpPower;
            game.character.direction = 'up';
        }

        if (game.character.isJumping) {
            game.character.y += game.character.yVelocity;
            game.character.yVelocity += config.character.gravity;

            if (game.character.y >= config.character.startY) {
                game.character.y = config.character.startY;
                game.character.isJumping = false;
                game.character.yVelocity = 0;
                game.character.direction = game.character.isMoving ? game.character.direction : 'idle';
            }
        }
    }

    if (game.character.isMoving && !game.character.isJumping) {
        game.character.animationFrame = (game.character.animationFrame + config.character.walkAnimationSpeed) % 2;
    } else {
        game.character.animationFrame = 0;
    }

    [game.npcs.elahe, game.npcs.mahsa, game.npcs.sohrab].forEach((npc, index) => {
        const npcConfig = (index === 0) ? config.elahe : (index === 1) ? config.mahsa : config.sohrab;
        npc.currentFrame = (npc.currentFrame + npcConfig.animationSpeed) % npcConfig.frameCount;
    });

    game.spaceHintLastFrameTime += delta;
    if (game.spaceHintLastFrameTime > 1000 / (config.spaceHint.animationSpeed * 60)) {
        game.spaceHintCurrentFrame = (game.spaceHintCurrentFrame + 1) % config.spaceHint.frameCount;
        game.spaceHintLastFrameTime = 0;
    }

    const characterCenterX = game.character.x + game.character.width / 2;
    game.spaceHintActive = false;
    if (Math.abs(characterCenterX - (game.npcs.elahe.x + config.elahe.width / 2)) < 100 && !game.npcs.elahe.dialogueTriggered) {
        game.spaceHintActive = true;
    } else if (Math.abs(characterCenterX - (game.npcs.mahsa.x + config.mahsa.width / 2)) < 100 && !game.npcs.mahsa.dialogueTriggered) {
        game.spaceHintActive = true;
    } else if (Math.abs(characterCenterX - (game.npcs.sohrab.x + config.sohrab.width / 2)) < 100 && !game.npcs.sohrab.dialogueTriggered) {
        game.spaceHintActive = true;
    } else if (Math.abs(characterCenterX - (game.door.x + game.door.width / 2)) < 100 && !game.transitioning) {
        game.spaceHintActive = true;
    }

    game.items.forEach(item => {
        if (!item.collected &&
            game.character.x < item.x + config.object.width &&
            game.character.x + game.character.width > item.x &&
            game.character.y < item.y + config.object.height &&
            game.character.y + game.character.height > item.y) {
            item.collected = true;
            game.collectedObjects++;
            console.log(`Collected ${game.collectedObjects} objects!`);
        }
    });
}

// Drawing functions
function render() {
    if (game.transitioning) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (game.assets.background && game.assets.background.complete) {
        drawSprite(game.assets.background, 0, 0, canvas.width, canvas.height);
    } else {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw NPCs
    // Elahe
    let elaheSourceX = 0;
    let elaheSourceY = 0;
    if (config.elahe.frameDirection === 'vertical') {
        elaheSourceY = Math.floor(game.npcs.elahe.currentFrame) * config.elahe.frameHeight;
    } else {
        elaheSourceX = Math.floor(game.npcs.elahe.currentFrame) * config.elahe.frameWidth;
    }
    drawSprite(game.assets.elahe, config.elahe.x, config.elahe.y, config.elahe.width, config.elahe.height,
               elaheSourceX, elaheSourceY, config.elahe.frameWidth, config.elahe.frameHeight);

    // Mahsa
    let mahsaSourceX = 0;
    let mahsaSourceY = 0;
    if (config.mahsa.frameDirection === 'vertical') {
        mahsaSourceY = Math.floor(game.npcs.mahsa.currentFrame) * config.mahsa.frameHeight;
    } else {
        mahsaSourceX = Math.floor(game.npcs.mahsa.currentFrame) * config.mahsa.frameWidth;
    }
    drawSprite(game.assets.mahsa, config.mahsa.x, config.mahsa.y, config.mahsa.width, config.mahsa.height,
               mahsaSourceX, mahsaSourceY, config.mahsa.frameWidth, config.mahsa.frameHeight);

    // Sohrab
    let sohrabSourceX = 0;
    let sohrabSourceY = 0;
    if (config.sohrab.frameDirection === 'vertical') {
        sohrabSourceY = Math.floor(game.npcs.sohrab.currentFrame) * config.sohrab.frameHeight;
    } else {
        sohrabSourceX = Math.floor(game.npcs.sohrab.currentFrame) * config.sohrab.frameWidth;
    }
    drawSprite(game.assets.sohrab, config.sohrab.x, config.sohrab.y, config.sohrab.width, config.sohrab.height,
               sohrabSourceX, sohrabSourceY, config.sohrab.frameWidth, config.sohrab.frameHeight);

    // Draw Character
    let characterSprite = game.assets.melika;
    if (game.character.direction === 'left') {
        characterSprite = game.assets.melikaleft;
    } else if (game.character.direction === 'right') {
        characterSprite = game.assets.melikaright;
    } else if (game.character.direction === 'up') {
        characterSprite = game.assets.melikaup;
    }
    
    drawSprite(characterSprite,
               game.character.x, game.character.y,
               config.character.width, config.character.height,
               config.character.sourceOffsetX, config.character.sourceOffsetY,
               config.character.sourceFrameWidth, config.character.sourceFrameHeight);

    // Draw items
    game.items.forEach(item => {
        if (!item.collected && game.assets.object && game.assets.object.complete) {
            drawSprite(game.assets.object, item.x, item.y, config.object.width, config.object.height,
                       config.object.sourceOffsetX, config.object.sourceOffsetY,
                       config.object.sourceFrameWidth, config.object.sourceFrameHeight);
        }
    });

    // Draw Space Hint
    if (game.spaceHintActive && game.assets.space && game.assets.space.complete) {
        let spaceHintSourceX = 0;
        let spaceHintSourceY = 0;
        if (config.spaceHint.frameDirection === 'vertical') {
            spaceHintSourceY = Math.floor(game.spaceHintCurrentFrame) * config.spaceHint.frameHeight;
        } else {
            spaceHintSourceX = Math.floor(game.spaceHintCurrentFrame) * config.spaceHint.frameWidth;
        }
        drawSprite(game.assets.space, config.spaceHint.x, config.spaceHint.y, config.spaceHint.width, config.spaceHint.height,
                   spaceHintSourceX, spaceHintSourceY, config.spaceHint.frameWidth, config.spaceHint.frameHeight);
    }
}

// Input handling
function handleKeyDown(e) {
    if (e.key === ' ') {
        e.preventDefault();
    }

    if (e.key === 'm' || e.key === 'M') {
        if (!game.keys.KeyM) {
            toggleMusic();
            game.keys.KeyM = true;
        }
    }

    if (!game.currentBackgroundMusic || game.currentBackgroundMusic.paused) {
        startBackgroundMusic();
    }

    if (game.transitioning) return;

    switch (e.key) {
        case 'ArrowLeft':
            game.keys.ArrowLeft = true;
            break;
        case 'ArrowRight':
            game.keys.ArrowRight = true;
            break;
        case 'ArrowUp':
            game.keys.ArrowUp = true;
            break;
        case ' ':
            if (!game.keys.Space) {
                game.keys.Space = true;
                if (game.dialogue.active) {
                    advanceDialogue();
                } else if (game.spaceHintActive) {
                    const characterCenterX = game.character.x + game.character.width / 2;

                    if (Math.abs(characterCenterX - (game.npcs.elahe.x + config.elahe.width / 2)) < 100 && !game.npcs.elahe.dialogueTriggered) {
                        startDialogue(dialogues.elahe[0].speaker, dialogues.elahe);
                    } else if (Math.abs(characterCenterX - (game.npcs.mahsa.x + config.mahsa.width / 2)) < 100 && !game.npcs.mahsa.dialogueTriggered) {
                        startDialogue(dialogues.mahsa[0].speaker, dialogues.mahsa);
                    } else if (Math.abs(characterCenterX - (game.npcs.sohrab.x + config.sohrab.width / 2)) < 100 && !game.npcs.sohrab.dialogueTriggered) {
                        startDialogue(dialogues.sohrab[0].speaker, dialogues.sohrab);
                    } else if (Math.abs(characterCenterX - (game.door.x + game.door.width / 2)) < 100) {
                        startSceneTransition('scene1.js');
                    }
                }
            }
            break;
        case 'a':
        case 'A':
            if (!game.keys.KeyA) {
                game.keys.KeyA = true;
                if (game.dialogue.active) {
                    advanceDialogue();
                }
            }
            break;
    }
}

function handleKeyUp(e) {
    switch (e.key) {
        case 'ArrowLeft':
            game.keys.ArrowLeft = false;
            break;
        case 'ArrowRight':
            game.keys.ArrowRight = false;
            break;
        case 'ArrowUp':
            game.keys.ArrowUp = false;
            break;
        case ' ':
            game.keys.Space = false;
            break;
        case 'a':
        case 'A':
            game.keys.KeyA = false;
            break;
        case 'm':
        case 'M':
            game.keys.KeyM = false;
            break;
    }
}

function setupInput() {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
}

// Game loop
function gameLoop(timestamp) {
    if (!running) return;
    const delta = timestamp - game.lastTime;
    game.lastTime = timestamp;

    update(delta);
    render();
    gameLoopId = requestAnimationFrame(gameLoop);
}

// Initialize game
async function initGame() {
    try {
        await loadAssets();
        setupInput();
        startBackgroundMusic();

        initItems();

        game.lastTime = performance.now();
        gameLoop(game.lastTime);
    } catch (error) {
        console.error("Game failed to start:", error);
    }
}

// Start the game when the window loads
window.onload = initGame;
