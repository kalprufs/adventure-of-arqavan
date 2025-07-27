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
        width: 200, // Rendered width on canvas
        height: 200, // Rendered height on canvas
        startX: 10,
        startY: 285,
        speed: 4, // Character speed
        jumpPower: 10,
        gravity: 0.5,
        walkAnimationSpeed: 0.05, // Speed of walking animation (reduced for smoother animation)
        // Assuming melika assets are 1024x1024 images, but the actual character is smaller
        // Let's assume the character itself takes up a 512x512 area within the 1024x1024 image, centered.
        sourceFrameWidth: 512,
        sourceFrameHeight: 512,
        sourceOffsetX: (1024 - 512) / 2, // Center the 512x512 within 1024x1024
        sourceOffsetY: (1024 - 512) / 2,
    },
    elahe: {
        x: 520, y: 255, width: 200, height: 200, // Rendered size
        frameWidth: 1024,  // Actual width of ONE frame
        frameHeight: 512,  // Actual height of ONE frame (assuming 1024x1024 image with 2 vertical frames)
        frameCount: 2,     // Number of frames in the sheet
        frameDirection: 'vertical', // 'vertical' or 'horizontal'
        animationSpeed: 0.05 // Speed of animation (reduced)
    },
    mahsa: {
        x: 320, y: 248, width: 200, height: 200, // Rendered size
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    sohrab: {
        x: 700, y: 261, width: 181, height: 181, // Rendered size
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    spaceHint: {
        x: 400, y: 100, width: 100, height: 100, // Rendered size
        frameWidth: 1024,
        frameHeight: 512,
        frameCount: 2,
        frameDirection: 'vertical',
        animationSpeed: 0.05
    },
    object: {
        width: 40,  // Rendered width
        height: 40, // Rendered height
        // Assuming object.png is also a large image (e.g., 1024x1024) with the actual object being smaller and centered.
        sourceFrameWidth: 100, // Make a guess for a smaller source frame
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
    currentScene: 'scene0', // Initial scene
    transitioning: false,
    assets: {}, // Stores loaded image assets
    currentBackgroundMusic: null,
    keys: {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        Space: false,
        KeyA: false, // For dialogue advance
        KeyM: false, // For music toggle
    },
    character: {
        x: config.character.startX,
        y: config.character.startY,
        width: config.character.width,
        height: config.character.height,
        isMoving: false,
        isJumping: false,
        yVelocity: 0,
        direction: 'idle', // 'idle', 'left', 'right', 'up'
        animationFrame: 0, // Current animation frame for walking (if used for individual images)
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
    items: [], // Array to hold collectable items
    collectedObjects: 0, // Global counter for collected objects
    door: {
        x: 900,
        y: 285,
        width: 100,
        height: 150
    },
    lastTime: 0,
};

// Dialogue Data (Example)
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
    { name: 'space', path: 'sprites/space.png' }, // Space hint image
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
                audio.loop = true; // Set loop for background music
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
                audio.load(); // Start loading the audio
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
        game.currentBackgroundMusic.volume = 0.5; // Adjust volume as needed
        game.currentBackgroundMusic.play().catch(e => {
            console.log("Audio play failed (user gesture required):", e);
            // This is expected before user interaction
        });
    }
}

function stopBackgroundMusic() {
    if (game.currentBackgroundMusic) {
        game.currentBackgroundMusic.pause();
        game.currentBackgroundMusic.currentTime = 0; // Reset to start
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
        startBackgroundMusic(); // Try to start if not playing
    }
}

// Item handling
function createItem(x, y, type) {
    return {
        x: x,
        y: y,
        type: type, // e.g., 'collectable'
        collected: false
    };
}

function initItems() {
    // Add items for scene0
    game.items.push(createItem(150, 350, 'collectable'));
    game.items.push(createItem(600, 100, 'collectable'));
    // You can add more items as needed for different scenes
}

// Dialogue system
function startDialogue(speaker, lines) {
    if (game.dialogue.active) return; // Prevent new dialogue if one is active

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

    // Reset NPC dialogue status after dialogue ends if necessary
    if (game.character.direction === 'left' && Math.abs(game.character.x - game.npcs.mahsa.x) < 100) {
        game.npcs.mahsa.dialogueTriggered = true; // Mark as done for this interaction
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
    stopBackgroundMusic(); // Stop current scene's music

    const overlay = document.getElementById('fadeOverlay');
    if (overlay) {
        overlay.style.transition = 'opacity 1s';
        overlay.style.opacity = 1; // Fade to black
    }

    // Wait for fade out
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Cleanup current scene assets/listeners if necessary (add dispose logic to scenes)
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    // Dynamically import the next scene module
    try {
        const module = await import(`./${sceneFileName}`); // Use template literal for path
        // Call the entry function of the new scene, e.g., startScene1()
        if (module && typeof module[`start${sceneFileName.charAt(0).toUpperCase() + sceneFileName.slice(1).replace('.js', '')}`] === 'function') {
            module[`start${sceneFileName.charAt(0).toUpperCase() + sceneFileName.slice(1).replace('.js', '')}`]();
        } else {
            console.error(`Error: Entry function 'start${sceneFileName.charAt(0).toUpperCase() + sceneFileName.slice(1).replace('.js', '')}' not found in ${sceneFileName}`);
        }
    } catch (error) {
        console.error(`Failed to load ${sceneFileName}:`, error);
        // Fallback or error recovery: maybe restart current scene or show error message
        game.transitioning = false; // Allow interaction again
        if (overlay) overlay.style.opacity = 0; // Fade back if error
        setupInput(); // Re-enable input
        startBackgroundMusic(); // Restart music
    }
}

// Generic Drawing function
// This function can draw a full image or a specific frame from a sprite sheet.
function drawSprite(asset, x, y, width, height, sourceX = 0, sourceY = 0, sourceWidth = asset.width, sourceHeight = asset.height) {
    if (!asset || !asset.complete) { return; }
    ctx.drawImage(asset, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
}


// Update game state
function update(timestamp) {
    if (game.transitioning) return;

    const delta = timestamp - game.lastTime;
    game.lastTime = timestamp;

    // Character movement
    if (!game.dialogue.active) { // Only allow movement if no dialogue is active
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
            game.character.direction = 'idle'; // Set to idle if no movement keys are pressed
        }

        // Character jumping
        if (game.keys.ArrowUp && !game.character.isJumping) {
            game.character.isJumping = true;
            game.character.yVelocity = -config.character.jumpPower;
            game.character.direction = 'up'; // Set direction to up when jumping
        }

        // Apply gravity
        if (game.character.isJumping) {
            game.character.y += game.character.yVelocity;
            game.character.yVelocity += config.character.gravity;

            // Prevent falling through floor
            if (game.character.y >= config.character.startY) {
                game.character.y = config.character.startY;
                game.character.isJumping = false;
                game.character.yVelocity = 0;
                game.character.direction = game.character.isMoving ? game.character.direction : 'idle';
            }
        }
    }

    // Update animations
    // Character walking animation (animationFrame is still updated, but only changes sprite for melikaleft/right)
    if (game.character.isMoving && !game.character.isJumping) {
        game.character.animationFrame = (game.character.animationFrame + config.character.walkAnimationSpeed) % 2; // Assuming 2 frames for walk cycle, or just 0/1 for direction change
    } else {
        game.character.animationFrame = 0; // Reset to first frame when idle or jumping
    }

    // NPC animations
    [game.npcs.elahe, game.npcs.mahsa, game.npcs.sohrab].forEach((npc, index) => {
        const npcConfig = (index === 0) ? config.elahe : (index === 1) ? config.mahsa : config.sohrab;
        npc.currentFrame = (npc.currentFrame + npcConfig.animationSpeed) % npcConfig.frameCount;
    });


    // Space Hint animation
    game.spaceHintLastFrameTime += delta;
    if (game.spaceHintLastFrameTime > 1000 / (config.spaceHint.animationSpeed * 60)) { // Adjust speed as needed
        game.spaceHintCurrentFrame = (game.spaceHintCurrentFrame + 1) % config.spaceHint.frameCount;
        game.spaceHintLastFrameTime = 0;
    }


    // Check for NPC interaction proximity
    const characterCenterX = game.character.x + game.character.width / 2;
    // const characterCenterY = game.character.y + game.character.height / 2; // Not used for this proximity check

    game.spaceHintActive = false; // Reset space hint
    if (Math.abs(characterCenterX - (game.npcs.elahe.x + config.elahe.width / 2)) < 100 && !game.npcs.elahe.dialogueTriggered) {
        game.spaceHintActive = true;
    } else if (Math.abs(characterCenterX - (game.npcs.mahsa.x + config.mahsa.width / 2)) < 100 && !game.npcs.mahsa.dialogueTriggered) {
        game.spaceHintActive = true;
    } else if (Math.abs(characterCenterX - (game.npcs.sohrab.x + config.sohrab.width / 2)) < 100 && !game.npcs.sohrab.dialogueTriggered) {
        game.spaceHintActive = true;
    } else if (Math.abs(characterCenterX - (game.door.x + game.door.width / 2)) < 100 && !game.transitioning) {
        game.spaceHintActive = true; // Active near door
    }


    // Check for item collection
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
    if (game.transitioning) {
        return; // Only draw fade overlay if transitioning
    }

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background
    if (game.assets.background && game.assets.background.complete) {
        drawSprite(game.assets.background, 0, 0, canvas.width, canvas.height);
    } else {
        // Fallback for background if not loaded
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Draw NPCs
    // Elahe
    let elaheSourceX = 0;
    let elaheSourceY = 0;
    if (config.elahe.frameDirection === 'vertical') {
        elaheSourceY = Math.floor(game.npcs.elahe.currentFrame) * config.elahe.frameHeight;
    } else { // horizontal
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
    let characterSprite = game.assets.melika; // Default to idle
    if (game.character.direction === 'left') {
        characterSprite = game.assets.melikaleft;
    } else if (game.character.direction === 'right') {
        characterSprite = game.assets.melikaright;
    } else if (game.character.direction === 'up') {
        characterSprite = game.assets.melikaup;
    }
    // Draw character using source offsets and frame dimensions
    drawSprite(characterSprite,
               game.character.x, game.character.y,
               config.character.width, config.character.height,
               config.character.sourceOffsetX, config.character.sourceOffsetY,
               config.character.sourceFrameWidth, config.character.sourceFrameHeight);


    // Draw collected items
    game.items.forEach(item => {
        if (!item.collected && game.assets.object && game.assets.object.complete) {
            drawSprite(game.assets.object, item.x, item.y, config.object.width, config.object.height,
                       config.object.sourceOffsetX, config.object.sourceOffsetY,
                       config.object.sourceFrameWidth, config.object.sourceFrameHeight);
        }
    });

    // Draw Space Hint (if active)
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

    // Draw dialogue box (if active, assuming it's a DOM element, not drawn on canvas)
    // The dialogContainer div handles its own display based on game.dialogue.active
}


// Input handling
function handleKeyDown(e) {
    if (e.key === ' ') {
        e.preventDefault(); // Prevent default space key behavior (like scrolling)
    }

    // Music toggle (M key)
    if (e.key === 'm' || e.key === 'M') {
        if (!game.keys.KeyM) { // Only toggle once per key press
            toggleMusic();
            game.keys.KeyM = true;
        }
    }

    // Start background music on first user gesture if not playing
    if (!game.currentBackgroundMusic || game.currentBackgroundMusic.paused) {
        startBackgroundMusic();
    }


    if (game.transitioning) return; // Prevent input during transition

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
        case ' ': // Space key for interaction
            if (!game.keys.Space) { // Ensure it's not held down
                game.keys.Space = true;
                if (game.dialogue.active) {
                    advanceDialogue();
                } else if (game.spaceHintActive) {
                    // Check interaction with NPCs
                    const characterCenterX = game.character.x + game.character.width / 2;

                    if (Math.abs(characterCenterX - (game.npcs.elahe.x + config.elahe.width / 2)) < 100 && !game.npcs.elahe.dialogueTriggered) {
                        startDialogue(dialogues.elahe[0].speaker, dialogues.elahe);
                    } else if (Math.abs(characterCenterX - (game.npcs.mahsa.x + config.mahsa.width / 2)) < 100 && !game.npcs.mahsa.dialogueTriggered) {
                        startDialogue(dialogues.mahsa[0].speaker, dialogues.mahsa);
                    } else if (Math.abs(characterCenterX - (game.npcs.sohrab.x + config.sohrab.width / 2)) < 100 && !game.npcs.sohrab.dialogueTriggered) {
                        startDialogue(dialogues.sohrab[0].speaker, dialogues.sohrab);
                    } else if (Math.abs(characterCenterX - (game.door.x + game.door.width / 2)) < 100) {
                        // Trigger scene transition when near the door and space is pressed
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
    if (!running) return; // Stop loop if not running
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
        startBackgroundMusic(); // This will try to play, but might fail due to gesture requirement

        // Initialize items for scene0
        initItems(); // Call it once to add items to game.items

        game.lastTime = performance.now();
        gameLoop(game.lastTime);
    } catch (error) {
        console.error("Game failed to start:", error);
    }
}

// Start the game when the window loads
window.onload = initGame;
