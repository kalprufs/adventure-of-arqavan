// Game initialization
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
let gameLoopId = null;
let running = true;

// Initialize global object count if it doesn't exist
window.globalObjectCount = window.globalObjectCount || 0;

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
    // The initialItem should be defined directly here, not in a separate initItems function
    items: {
        initialItem: { // This is the first collectible item
            x: config.items.spawnPositions[0].x,
            y: config.items.spawnPositions[0].y,
            visible: false, // Initially hidden until Sohrab is interacted with
            collected: false
        },
        // 'collectedItems' now stores ALL collected items from any scene, globally
        collectedItems: [] // This replaces game.items.collected from previous structure
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
            game.assets[asset.name].onerror = (e) => {
                console.error(`Error loading asset: ${asset.path}`, e);
                // Even if one fails, try to load others. Consider more robust error handling for production.
                loaded++; 
                if (loaded === assets.length) resolve();
            };
        });
    });
}

// Check item collection for the initial item in main.js
function checkInitialItemCollection() {
    const item = game.items.initialItem;
    if (!item.visible || item.collected) return; // Only check if visible and not collected

    const charRect = { x: game.character.x, y: game.character.y, width: config.character.width, height: config.character.height };
    const itemRect = { x: item.x, y: item.y, width: config.items.size, height: config.items.size };

    if (checkCollision(charRect, itemRect) && game.keys.KeyA) {
        item.collected = true;
        item.visible = false; // Hide it after collection
        window.globalObjectCount++; // Increment the global count
        console.log("Main scene object collected! Total:", window.globalObjectCount);
        // Add collected item to the global array for rendering in top-left
        game.items.collectedItems.push({ x: item.x, y: item.y, type: 'main' }); 
    }
}


// Render items (now renders initial item if visible, and all collected items from global count)
function renderItems() {
    // Render the initial item if it's visible and not collected
    if (game.items.initialItem.visible && !game.items.initialItem.collected && game.assets.item?.complete) {
        ctx.drawImage(
            game.assets.item,
            game.items.initialItem.x,
            game.items.initialItem.y,
            config.items.size,
            config.items.size
        );
    }

    // Render all collected items (from any scene) in the top-left corner
    if (game.assets.item?.complete) {
        for (let i = 0; i < window.globalObjectCount; i++) {
            ctx.drawImage(
                game.assets.item,
                20 + (i * (config.items.size + 5)), // Offset for each item + padding
                20,
                config.items.size,
                config.items.size
            );
        }
    }
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
    
    // If currently typing, complete the text immediately
    if (game.dialogue.typing) {
        completeTypewriterEffect();
        return;
    }

    game.dialogueIndex++;
    if (game.dialogueIndex < game.currentDialogue.length) {
        updateDialogueBox(); // Start next line of dialogue
    } else {
        if (game.currentNpc && !game.npcTalked[game.currentNpc]) {
            game.npcTalked[game.currentNpc] = true;
        }
        game.currentDialogue = null;
        game.currentNpc = null;
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

// Collision detection utility for characters/objects
function checkCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}


// Check interactions
function checkInteractions() {
    // Elahe
    const charRect = { x: game.character.x, y: game.character.y, width: config.character.width, height: config.character.height };

    const elaheRect = { x: config.elahe.x, y: config.elahe.y, width: config.elahe.width, height: config.elahe.height };
    game.npcs.elahe.canInteract = checkCollision(charRect, elaheRect);

    // Mahsa
    const mahsaRect = { x: config.mahsa.x, y: config.mahsa.y, width: config.mahsa.width, height: config.mahsa.height };
    game.npcs.mahsa.canInteract = checkCollision(charRect, mahsaRect);

    // Sohrab
    const sohrabRect = { x: config.sohrab.x, y: config.sohrab.y, width: config.sohrab.width, height: config.sohrab.height };
    game.npcs.sohrab.canInteract = checkCollision(charRect, sohrabRect);
}

// Audio functions
function startBackgroundMusic() {
    game.audio.music = document.getElementById('backgroundMusic');
    if (game.audio.music) {
        game.audio.music.volume = config.audio.volume;
        game.audio.music.play()
            .then(() => game.audio.isPlaying = true)
            .catch(e => console.log("Audio play failed (user gesture required):", e));
    }
}

function fadeOutMusic() {
    if (!game.audio.music || !game.audio.isPlaying) return;

    const initialVolume = game.audio.music.volume;
    const fadeStep = initialVolume / (config.audio.fadeDuration / 50); // Divide into 50ms steps
    
    const fadeInterval = setInterval(() => {
        if (game.audio.music.volume > fadeStep) {
            game.audio.music.volume -= fadeStep;
        } else {
            game.audio.music.volume = 0;
            game.audio.music.pause();
            game.audio.isPlaying = false;
            clearInterval(fadeInterval);
        }
    }, 50); // Every 50ms
}

// Scene transition
function startSceneTransition(targetScene) {
    if (game.sceneState.transitioning) return;
    game.sceneState.transitioning = true;
    const overlay = document.getElementById('fadeOverlay');
    overlay.style.transition = `opacity ${config.audio.fadeDuration / 1000}s ease-in-out`;
    overlay.style.opacity = 1;

    fadeOutMusic();

    // Clear game loop and event listeners for current scene
    if (gameLoopId) {
        cancelAnimationFrame(gameLoopId);
        gameLoopId = null;
    }
    window.removeEventListener('keydown', handleKeyDown);
    window.removeEventListener('keyup', handleKeyUp);

    setTimeout(() => {
        console.log("Transitioning to:", targetScene);
        if (targetScene === 'scene1') {
            import('./scene1.js').then(module => {
                module.startScene1();
            }).catch(error => {
                console.error("Failed to load Scene 1:", error);
                // Fallback or error display if scene fails to load
            });
        }
        // Fade in new scene (handled by the new scene's initialization or main.js if it returns control)
        // For now, we assume the new scene will manage the overlay fade-out, or we manage it here
        overlay.style.opacity = 0; // Immediately set for fade-in of new scene
        game.sceneState.transitioning = false; // Reset transition flag
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
    
    if (game.currentDialogue) {
        updateTypewriterEffect(deltaTime);
        return; // Pause game logic if dialogue is active
    }
    
    if (game.sceneState.transitioning) {
        return; // Pause game logic during scene transition
    }

    updateNpcAnimations(deltaTime, 'elahe');
    updateNpcAnimations(deltaTime, 'mahsa');
    updateNpcAnimations(deltaTime, 'sohrab');
    updateSpaceHint(deltaTime);

    // Character movement
    if (game.keys.ArrowLeft) {
        game.character.x -= config.character.speed;
        game.character.x = Math.max(0, game.character.x);
        game.character.direction = 'left';
        game.character.isMoving = true;
        game.character.walkFrame = (game.character.walkFrame + config.character.walkAnimationSpeed) % 2; // Assuming 2 frames for walk
    } else if (game.keys.ArrowRight) {
        game.character.x += config.character.speed;
        game.character.x = Math.min(canvas.width - config.character.width, game.character.x);
        game.character.direction = 'right';
        game.character.isMoving = true;
        game.character.walkFrame = (game.character.walkFrame + config.character.walkAnimationSpeed) % 2; // Assuming 2 frames for walk
    } else {
        game.character.isMoving = false;
        game.character.walkFrame = 0; // Reset to idle frame
    }

    // Jumping
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
    checkInitialItemCollection(); // Check for collection of the item in main.js
}

// Render game
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Background
    if (game.assets.background?.complete) {
        ctx.drawImage(game.assets.background, 0, 0, canvas.width, canvas.height);
    }
    
    // Items (including the global collected items)
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
    
    // Space hint (if Mahsa or Sohrab can be interacted with, or item is available)
    const showSpaceHint = 
        (game.npcs.mahsa.canInteract && !game.npcTalked.mahsa && game.spaceHint.visible) ||
        (game.npcs.sohrab.canInteract && !game.npcTalked.sohrab) || // Always show for Sohrab if can interact
        (game.items.initialItem.visible && !game.items.initialItem.collected); // Show if item is there

    if (showSpaceHint && game.assets.spaceHint?.complete) {
        const frameY = game.spaceHint.frame * config.spaceHint.frameHeight;
        const scale = 0.15;
        let hintX, hintY;

        // Position hint near closest interactive element
        if (game.npcs.mahsa.canInteract && !game.npcTalked.mahsa && game.spaceHint.visible) {
             hintX = config.mahsa.x + (config.mahsa.width / 2) - (config.spaceHint.frameWidth * scale / 2);
             hintY = config.mahsa.y - 90;
        } else if (game.npcs.sohrab.canInteract && !game.npcTalked.sohrab) {
             hintX = config.sohrab.x + (config.sohrab.width / 2) - (config.spaceHint.frameWidth * scale / 2);
             hintY = config.sohrab.y - 90;
        } else if (game.items.initialItem.visible && !game.items.initialItem.collected) {
            hintX = game.items.initialItem.x + (config.items.size / 2) - (config.spaceHint.frameWidth * scale / 2);
            hintY = game.items.initialItem.y - 50; // Position above the item
        } else {
            // If no immediate interaction, default to somewhere reasonable or hide
            // This 'else' block might mean the hint should be invisible.
            // Re-evaluate if this hint should be visible at all if not for specific interactions.
            return; // Don't draw hint if no relevant interaction
        }

        ctx.drawImage(
            game.assets.spaceHint,
            0, frameY,
            config.spaceHint.frameWidth,
            config.spaceHint.frameHeight,
            hintX,
            hintY,
            config.spaceHint.frameWidth * scale,
            config.spaceHint.frameHeight * scale
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

    // Debugging: Draw door trigger area (optional, remove in final game)
    // if (game.debug.showCollisionAreas) {
    //     ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
    //     ctx.fillRect(config.scenes.doorTrigger.x, config.scenes.doorTrigger.y, config.scenes.doorTrigger.width, config.scenes.doorTrigger.height);
    // }
}

// Input handling
function handleKeyDown(e) {
    const key = e.key.toLowerCase();
    
    if (key === 'm') { // Toggle music with 'M' key
        if (game.audio.isPlaying) {
            game.audio.music.pause();
            game.audio.isPlaying = false;
            console.log("Music paused.");
        } else {
            game.audio.music.play()
                .then(() => game.audio.isPlaying = true)
                .catch(err => console.error("Failed to play music:", err));
            console.log("Music playing.");
        }
        e.preventDefault(); // Prevent default browser action for 'M'
        return; // Don't process other keys if 'M' was pressed
    }

    // Handle dialogue progression first
    if (game.currentDialogue) {
        if (key === ' ') {
            nextDialogue();
            e.preventDefault(); // Prevent scrolling
        }
        return; // Do not process other inputs if dialogue is active
    }

    // Game controls
    if (key === 'a') {
        game.keys.KeyA = true;
        // The checkInitialItemCollection is now called in update loop
    }
    if (key === 'arrowleft') {
        game.keys.ArrowLeft = true;
    }
    if (key === 'arrowright') {
        game.keys.ArrowRight = true;
    }
    if (key === 'arrowup') {
        if (!game.character.isJumping && game.character.y === config.character.startY) {
            game.character.isJumping = true;
            game.character.yVelocity = -config.character.jumpPower;
        }
    }
    if (key === ' ') {
        game.keys.Space = true;
        // NPC Interactions
        if (game.npcs.elahe.canInteract && !game.npcTalked.elahe) {
            showDialogue('elahe');
        } else if (game.npcs.mahsa.canInteract && !game.npcTalked.mahsa) {
            showDialogue('mahsa');
            game.spaceHint.visible = false; // Hide hint after interacting with Mahsa once
        } else if (game.npcs.sohrab.canInteract && !game.npcTalked.sohrab) {
            showDialogue('sohrab');
            game.items.initialItem.visible = true; // Make item visible after talking to Sohrab
        }
        
        // Scene transition
        const charRect = { x: game.character.x, y: game.character.y, width: config.character.width, height: config.character.height };
        if (checkCollision(charRect, config.scenes.doorTrigger)) {
            // For now, allow transition if character is at door. Add item collection check later if needed.
            startSceneTransition('scene1');
        }
        e.preventDefault(); // Prevent default browser action for spacebar (e.g., scrolling)
    }
}

function handleKeyUp(e) {
    const key = e.key.toLowerCase();
    if (key === 'a') game.keys.KeyA = false;
    if (key === 'arrowleft') game.keys.ArrowLeft = false;
    if (key === 'arrowright') game.keys.ArrowRight = false;
    if (key === ' ') game.keys.Space = false;
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
        // Removed initItems() call - initialItem is now part of game.items directly
        setupInput();
        startBackgroundMusic(); // Attempt to start music
        game.lastTime = performance.now();
        gameLoop(game.lastTime);
    } catch (error) {
        console.error("Game failed to start:", error);
    }
}

// Start the game when the window loads
window.addEventListener('load', initGame);

// Auto-play audio on first user interaction (for browser policies)
document.addEventListener('keydown', () => {
    const bgm = document.getElementById('backgroundMusic');
    if (bgm && bgm.paused) {
        bgm.volume = config.audio.volume;
        bgm.play();
        game.audio.isPlaying = true;
    }
}, { once: true }); // 'once: true' ensures this listener only runs once
