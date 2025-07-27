export function startScene1() {
    console.log("Scene1 started");
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas size
    canvas.width = 1024;
    canvas.height = 512;
    
    // Initialize global object count
    window.globalObjectCount = window.globalObjectCount || 0;
    
    // Scene assets
    const assets = {
        background: new Image(),
        idle: new Image(),
        right: new Image(),
        left: new Image(),
        up: new Image(),
        bothtwo: new Image(),
        object: new Image(),
        star: new Image(),
        banWalking: new Image(),
        banIdle: new Image()
    };
    
    // Audio setup
    const audio = new Audio();
    audio.loop = true;
    let isMusicPlaying = false;
    let audioLoaded = false;

    // Load audio file from the correct path
    function loadAudio() {
        // Using relative path from your HTML file to the song
        audio.src = 'song/coco.mp3';
        audio.load();
        
        audio.addEventListener('canplaythrough', () => {
            console.log("Audio loaded successfully");
            audioLoaded = true;
            if (assetsLoaded + assetsFailed === totalAssets) {
                toggleMusic();
            }
        });
        
        audio.addEventListener('error', (e) => {
            console.error("Audio loading error:", e);
            audioLoaded = false;
            updateMusicIndicator(false, true);
        });
    }
    
    // Track loading state
    let assetsLoaded = 0;
    let assetsFailed = 0;
    const totalAssets = Object.keys(assets).length;
    
    function handleAssetLoad() {
        assetsLoaded++;
        checkAllAssetsLoaded();
    }
    
    function handleAssetError(error) {
        console.error("Asset failed to load", error);
        assetsFailed++;
        checkAllAssetsLoaded();
    }
    
    function checkAllAssetsLoaded() {
        if (assetsLoaded + assetsFailed === totalAssets) {
            if (assetsFailed > 0) {
                console.error(`${assetsFailed} assets failed to load`);
            } else {
                console.log("All assets loaded successfully");
                startGameLoop();
                if (audioLoaded) {
                    toggleMusic();
                }
            }
        }
    }
    
    // Load assets with proper error handling
    const loadImage = (img, src) => {
        img.onload = handleAssetLoad;
        img.onerror = handleAssetError;
        img.src = src;
    };
    
    loadImage(assets.background, 'backgrounds/park.png');
    loadImage(assets.idle, 'sprites/melika.png');
    loadImage(assets.right, 'sprites/melikaright.png');
    loadImage(assets.left, 'sprites/melikaleft.png');
    loadImage(assets.up, 'sprites/melikaup.png');
    loadImage(assets.bothtwo, 'sprites/bothtwo.png');
    loadImage(assets.object, 'sprites/object.png');
    loadImage(assets.star, 'sprites/star.png');
    loadImage(assets.banWalking, 'sprites/banwalking.png');
    loadImage(assets.banIdle, 'sprites/ban.png');
    
    // Load audio
    loadAudio();
    
    // Animation states
    const bothtwoAnim = {
        frame: 0,
        accumulator: 0,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        fps: 3
    };
    
    const starAnim = {
        frame: 0,
        accumulator: 0,
        frameCount: 2,
        frameWidth: 626,
        frameHeight: 626,
        fps: 3,
        visible: false
    };
    
    // Ban character state
    const banAnim = {
        walking: {
            frame: 0,
            accumulator: 0,
            frameCount: 2,
            frameWidth: 1024,
            frameHeight: 1024,
            fps: 3
        },
        idle: {
            frame: 0,
            accumulator: 0,
            frameCount: 2,
            frameWidth: 1024,
            frameHeight: 1024,
            fps: 7
        }
    };
    
    const ban = {
        x: -200, // Start off-screen
        y: 265,
        width: 200,
        height: 200,
        speed: 2,
        targetX: 50,
        state: 'walking', // 'walking' or 'idle'
        visible: false,
        dialogueActive: false,
        dialogueIndex: 0,
        typing: false,
        displayText: "",
        currentCharIndex: 0,
        typingAccumulator: 0
    };
    
    // Character state
    const character = {
        x: 10,
        y: 270,
        width: 200,
        height: 200,
        speed: 4,
        isMoving: false,
        isJumping: false,
        yVelocity: 0,
        direction: 'right'
    };
    
    // Object state
    const object = {
        x: 650,
        y: 420,
        width: 40,
        height: 40,
        visible: false
    };
    
    // Door trigger area
    const doorTrigger = {
        x: 950,
        y: 250,
        width: 50,
        height: 200
    };
    
    let objectCollected = false;
    const collectedObjects = [];
    
    // Input handling
    const keys = {
        ArrowLeft: false,
        ArrowRight: false,
        ArrowUp: false,
        Space: false,
        KeyA: false,
        KeyM: false
    };
    
    // Dialogue states
    const firstDialogue = [
        { name: "سهراب", text: "چرا داری میلرزی؟" },
        { name: "ارغوان", text: "توهم داری میلرزی." },
        { name: "سهراب", text: "آره ولی بندری نمیزنم که" },
        { name: "ارغوان", text: "اون ستاره عه شبیه کیر نیست؟" },
        { name: "سهراب", text: "هست چرا، خوشحالم کسی نمیشنوه صدامونو" },
        { name: "ارغوان", text: "باورت میشه کل شبو اینجا بودیم؟" },
        { name: "سهراب", text: "باورم نمیشه 3 سال دیگه هم دستتو گرفتم." }
    ];
    
    const secondDialogue = [
        { name: "سهراب", text: "به نظرت چی آرزو کردم؟" },
        { name: "ارغوان", text: "فقط منم که حس میکنم اینجا شبیه دنیای پیکسلیه؟" }
    ];
    
    const banDialogue = [
        { name: "ارغوان", text: "تو کی ای؟" },
        { name: "بندری موسی", text: "دیدم بندری میزنن اومدم دور هم باشیم تو کی ای؟" }
    ];
    
    let currentDialogue = firstDialogue;
    let bothtwoDialogueActive = false;
    let bothtwoDialogueIndex = 0;
    let bothtwoTyping = false;
    let bothtwoDisplayText = "";
    let bothtwoTypingAccumulator = 0;
    let bothtwoCurrentCharIndex = 0;
    const bothtwoTypingSpeed = 30;

    // Star fade variables
    let starFade = 0;
    let starFadingIn = false;
    let starFadingOut = false;

    // Scene transition state
    let transitioning = false;
    const transitionDuration = 1000; // 1 second

    // Music control functions
    function toggleMusic() {
        if (!audioLoaded) {
            console.log("Audio not loaded, cannot play");
            updateMusicIndicator(false, true);
            return;
        }
        
        if (isMusicPlaying) {
            audio.pause();
            isMusicPlaying = false;
        } else {
            audio.play()
                .then(() => {
                    isMusicPlaying = true;
                })
                .catch(e => {
                    console.error("Audio play failed:", e);
                    isMusicPlaying = false;
                    audioLoaded = false;
                    updateMusicIndicator(false, true);
                });
        }
        updateMusicIndicator(isMusicPlaying);
    }

    function updateMusicIndicator(playing, error = false) {
        const musicIndicator = document.getElementById('musicIndicator');
        if (musicIndicator) {
            if (error) {
                musicIndicator.textContent = '❌ Music Error';
                musicIndicator.style.color = '#ff6b6b';
            } else {
                musicIndicator.textContent = playing ? '🔊 Music: ON' : '🔇 Music: OFF';
                musicIndicator.style.color = 'white';
            }
            
            musicIndicator.style.display = 'block';
            musicIndicator.style.opacity = '1';
            setTimeout(() => {
                musicIndicator.style.opacity = '0';
                setTimeout(() => {
                    musicIndicator.style.display = 'none';
                }, 500);
            }, 2000);
        }
    }

    function startTypewriterEffect(dialogueArray, index) {
        if (dialogueArray === currentDialogue) {
            bothtwoDisplayText = "";
            bothtwoTyping = true;
            bothtwoCurrentCharIndex = 0;
            bothtwoTypingAccumulator = 0;
        } else if (dialogueArray === banDialogue) {
            ban.displayText = "";
            ban.typing = true;
            ban.currentCharIndex = 0;
            ban.typingAccumulator = 0;
        }
        document.getElementById('dialogText').textContent = "";
    }

    function updateTypewriterEffect(dialogueArray, index, delta) {
        let typing, displayText, currentCharIndex, typingAccumulator, typingSpeed;
        
        if (dialogueArray === currentDialogue) {
            if (!bothtwoTyping) return;
            typing = bothtwoTyping;
            displayText = bothtwoDisplayText;
            currentCharIndex = bothtwoCurrentCharIndex;
            typingAccumulator = bothtwoTypingAccumulator;
            typingSpeed = bothtwoTypingSpeed;
        } else if (dialogueArray === banDialogue) {
            if (!ban.typing) return;
            typing = ban.typing;
            displayText = ban.displayText;
            currentCharIndex = ban.currentCharIndex;
            typingAccumulator = ban.typingAccumulator;
            typingSpeed = bothtwoTypingSpeed;
        } else {
            return;
        }
        
        typingAccumulator += delta;
        const charsToAdd = Math.floor(typingAccumulator / typingSpeed);
        
        if (charsToAdd > 0) {
            const remainingChars = dialogueArray[index].text.length - currentCharIndex;
            const chars = Math.min(charsToAdd, remainingChars);
            
            if (chars > 0) {
                displayText += dialogueArray[index].text.substr(
                    currentCharIndex, chars
                );
                currentCharIndex += chars;
                document.getElementById('dialogText').textContent = displayText;
            }
            
            typingAccumulator -= chars * typingSpeed;
            
            if (currentCharIndex >= dialogueArray[index].text.length) {
                if (dialogueArray === currentDialogue) {
                    bothtwoTyping = false;
                } else if (dialogueArray === banDialogue) {
                    ban.typing = false;
                }
            }
        }
        
        // Update the appropriate variables
        if (dialogueArray === currentDialogue) {
            bothtwoDisplayText = displayText;
            bothtwoCurrentCharIndex = currentCharIndex;
            bothtwoTypingAccumulator = typingAccumulator;
        } else if (dialogueArray === banDialogue) {
            ban.displayText = displayText;
            ban.currentCharIndex = currentCharIndex;
            ban.typingAccumulator = typingAccumulator;
        }
    }

    function handleKeyDown(e) {
        if (e.key === ' ') {
            e.preventDefault();
        }
        
        if ((bothtwoDialogueActive || ban.dialogueActive) && e.key === ' ') {
            let dialogueArray, index;
            
            if (bothtwoDialogueActive) {
                dialogueArray = currentDialogue;
                index = bothtwoDialogueIndex;
                
                if (bothtwoTyping) {
                    // Complete current line
                    bothtwoDisplayText = dialogueArray[index].text;
                    bothtwoTyping = false;
                    bothtwoCurrentCharIndex = dialogueArray[index].text.length;
                    document.getElementById('dialogText').textContent = bothtwoDisplayText;
                } else {
                    bothtwoDialogueIndex++;
                    if (bothtwoDialogueIndex < dialogueArray.length) {
                        startTypewriterEffect(dialogueArray, bothtwoDialogueIndex);
                        document.getElementById('dialogName').textContent = dialogueArray[bothtwoDialogueIndex].name;
                    } else {
                        bothtwoDialogueActive = false;
                        document.getElementById('dialogContainer').style.display = 'none';
                        
                        // After first dialogue ends, show object
                        if (currentDialogue === firstDialogue) {
                            object.visible = true;
                        }
                        // After second dialogue ends, make Ban appear
                        else if (currentDialogue === secondDialogue) {
                            starFadingOut = true;
                            // Make Ban appear and walk in after star fades out
                            setTimeout(() => {
                                ban.visible = true;
                                ban.state = 'walking';
                            }, 600); // Match this with star fade out duration
                        }
                    }
                }
            } else if (ban.dialogueActive) {
                dialogueArray = banDialogue;
                index = ban.dialogueIndex;
                
                if (ban.typing) {
                    // Complete current line
                    ban.displayText = dialogueArray[index].text;
                    ban.typing = false;
                    ban.currentCharIndex = dialogueArray[index].text.length;
                    document.getElementById('dialogText').textContent = ban.displayText;
                } else {
                    ban.dialogueIndex++;
                    if (ban.dialogueIndex < dialogueArray.length) {
                        startTypewriterEffect(dialogueArray, ban.dialogueIndex);
                        document.getElementById('dialogName').textContent = dialogueArray[ban.dialogueIndex].name;
                    } else {
                        ban.dialogueActive = false;
                        document.getElementById('dialogContainer').style.display = 'none';
                    }
                }
            }
            return;
        }
        
        if (transitioning) return;
        
        switch (e.key) {
            case 'ArrowLeft':
                keys.ArrowLeft = true;
                character.direction = 'left';
                character.isMoving = true;
                break;
            case 'ArrowRight':
                keys.ArrowRight = true;
                character.direction = 'right';
                character.isMoving = true;
                break;
            case 'ArrowUp':
                if (!character.isJumping) {
                    keys.ArrowUp = true;
                    character.isJumping = true;
                    character.yVelocity = -12;
                }
                break;
            case ' ':
                keys.Space = true;
                // Check for door interaction
                const charRect = {
                    x: character.x,
                    y: character.y,
                    width: character.width,
                    height: character.height
                };
                if (checkCollision(charRect, doorTrigger)) {
                    startSceneTransition('scene2');
                }
                
                // Check for Ban interaction
                if (ban.visible && ban.state === 'idle') {
                    const banRect = {
                        x: ban.x,
                        y: ban.y,
                        width: ban.width,
                        height: ban.height
                    };
                    
                    if (checkCollision(charRect, banRect)) {
                        ban.dialogueActive = true;
                        ban.dialogueIndex = 0;
                        currentDialogue = banDialogue;
                        startTypewriterEffect(banDialogue, 0);
                        document.getElementById('dialogContainer').style.display = 'flex';
                        document.getElementById('dialogName').textContent = banDialogue[0].name;
                    }
                }
                break;
            case 'a':
            case 'A':
                keys.KeyA = true;
                break;
            case 'm':
            case 'M':
                if (!keys.KeyM) {
                    toggleMusic();
                }
                keys.KeyM = true;
                break;
        }
    }
    
    function handleKeyUp(e) {
        switch (e.key) {
            case 'ArrowLeft':
                keys.ArrowLeft = false;
                break;
            case 'ArrowRight':
                keys.ArrowRight = false;
                break;
            case 'ArrowUp':
                keys.ArrowUp = false;
                break;
            case ' ':
                keys.Space = false;
                break;
            case 'a':
            case 'A':
                keys.KeyA = false;
                break;
            case 'm':
            case 'M':
                keys.KeyM = false;
                break;
        }
        
        character.isMoving = keys.ArrowLeft || keys.ArrowRight;
    }
    
    function startSceneTransition(targetScene) {
        if (transitioning) return;
        transitioning = true;
        const overlay = document.getElementById('fadeOverlay');
        overlay.style.opacity = 1;

        setTimeout(() => {
            console.log("Transitioning to:", targetScene);
            dispose();
            import(`./${targetScene}.js`).then(module => {
                module[`start${targetScene.charAt(0).toUpperCase() + targetScene.slice(1)}`]();
            });
        }, transitionDuration);
    }
    
    function checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        );
    }
    
    function update(delta) {
        if (transitioning) return;
        
        // Character movement
        if (keys.ArrowLeft) {
            character.x = Math.max(0, character.x - character.speed);
        }
        if (keys.ArrowRight) {
            character.x = Math.min(canvas.width - character.width, character.x + character.speed);
        }
    
        // Jump physics
        if (character.isJumping) {
            character.y += character.yVelocity;
            character.yVelocity += 0.5;
            
            if (character.y >= 270) {
                character.y = 270;
                character.isJumping = false;
                character.yVelocity = 0;
            }
        }
    
        // Update bothtwo animation
        bothtwoAnim.accumulator += delta;
        const bothtwoFrameDuration = 1000 / bothtwoAnim.fps;
        while (bothtwoAnim.accumulator >= bothtwoFrameDuration) {
            bothtwoAnim.accumulator -= bothtwoFrameDuration;
            bothtwoAnim.frame = (bothtwoAnim.frame + 1) % bothtwoAnim.frameCount;
        }
        
        // Update Ban animation
        if (ban.visible) {
            const currentAnim = ban.state === 'walking' ? banAnim.walking : banAnim.idle;
            currentAnim.accumulator += delta;
            const frameDuration = 1000 / currentAnim.fps;
            
            while (currentAnim.accumulator >= frameDuration) {
                currentAnim.accumulator -= frameDuration;
                currentAnim.frame = (currentAnim.frame + 1) % currentAnim.frameCount;
            }
            
            // Move Ban if walking
            if (ban.state === 'walking') {
                ban.x += ban.speed;
                if (ban.x >= ban.targetX) {
                    ban.x = ban.targetX;
                    ban.state = 'idle';
                }
            }
        }
        
        // Check proximity to bothtwo
        const bothtwoRect = {
            x: canvas.width - (bothtwoAnim.frameWidth * 0.20) - 200,
            y: 250,
            width: bothtwoAnim.frameWidth * 0.20,
            height: bothtwoAnim.frameHeight * 0.20
        };
        
        const characterRect = {
            x: character.x,
            y: character.y,
            width: character.width,
            height: character.height
        };
        
        if (checkCollision(characterRect, bothtwoRect)) {
            if (keys.Space && !bothtwoDialogueActive && !ban.dialogueActive) {
                bothtwoDialogueActive = true;
                bothtwoDialogueIndex = 0;
                
                // If star is visible, use second dialogue
                if (starAnim.visible) {
                    currentDialogue = secondDialogue;
                }
                
                startTypewriterEffect(currentDialogue, 0);
                document.getElementById('dialogContainer').style.display = 'flex';
                document.getElementById('dialogName').textContent = currentDialogue[0].name;
            }
        }
    
        if (bothtwoDialogueActive) {
            updateTypewriterEffect(currentDialogue, bothtwoDialogueIndex, delta);
        }
        
        if (ban.dialogueActive) {
            updateTypewriterEffect(banDialogue, ban.dialogueIndex, delta);
        }
        
        // Check for object pickup
        if (object.visible && !objectCollected && keys.KeyA) {
            const objectRect = {
                x: object.x,
                y: object.y,
                width: object.width,
                height: object.height
            };
            
            if (checkCollision(characterRect, objectRect)) {
                objectCollected = true;
                object.visible = false;
                window.globalObjectCount++;
                collectedObjects.push({
                    x: 20 + (collectedObjects.length * 45),
                    y: 20
                });
                starAnim.visible = true;
                starFade = 0;
                starFadingIn = true;
            }
        }
        
        // Update star animation
        if (starAnim.visible) {
            starAnim.accumulator += delta;
            const starFrameDuration = 1000 / starAnim.fps;
            while (starAnim.accumulator >= starFrameDuration) {
                starAnim.accumulator -= starFrameDuration;
                starAnim.frame = (starAnim.frame + 1) % starAnim.frameCount;
            }
            
            // Handle star fade in/out
            if (starFadingIn && starFade < 1) {
                starFade += delta / 600;
                if (starFade >= 1) {
                    starFade = 1;
                    starFadingIn = false;
                }
            }
            else if (starFadingOut && starFade > 0) {
                starFade -= delta / 600;
                if (starFade <= 0) {
                    starFade = 0;
                    starFadingOut = false;
                    starAnim.visible = false;
                }
            }
        }
    }
    
    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background if loaded
        if (assets.background.complete && !assets.background.error) {
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        }

        // Draw bothtwo animation
        if (assets.bothtwo.complete && !assets.bothtwo.error) {
            const scale = 0.20;
            const drawWidth = bothtwoAnim.frameWidth * scale;
            const drawHeight = bothtwoAnim.frameHeight * scale;
            const x = canvas.width - drawWidth - 200;
            const y = 250;
            
            ctx.drawImage(
                assets.bothtwo,
                0, bothtwoAnim.frame * bothtwoAnim.frameHeight,
                bothtwoAnim.frameWidth, bothtwoAnim.frameHeight,
                x, y,
                drawWidth, drawHeight
            );
        }

        // Draw Ban character
        if (ban.visible && assets.banWalking.complete && !assets.banWalking.error && assets.banIdle.complete && !assets.banIdle.error) {
            const currentAnim = ban.state === 'walking' ? banAnim.walking : banAnim.idle;
            const sprite = ban.state === 'walking' ? assets.banWalking : assets.banIdle;
            const scale = 0.20;
            const drawWidth = currentAnim.frameWidth * scale;
            const drawHeight = currentAnim.frameHeight * scale;
            
            ctx.drawImage(
                sprite,
                0, currentAnim.frame * currentAnim.frameHeight,
                currentAnim.frameWidth, currentAnim.frameHeight,
                ban.x, ban.y,
                drawWidth, drawHeight
            );
        }

        // Draw collectible object
        if (object.visible && assets.object.complete && !assets.object.error) {
            ctx.drawImage(assets.object, object.x, object.y, object.width, object.height);
        }

        // Draw character
        let sprite = assets.idle;
        if (character.isJumping && assets.up.complete && !assets.up.error) {
            sprite = assets.up;
        } else if (character.isMoving) {
            if (character.direction === 'left' && assets.left.complete && !assets.left.error) {
                sprite = assets.left;
            } else if (character.direction === 'right' && assets.right.complete && !assets.right.error) {
                sprite = assets.right;
            }
        }
        
        if (sprite.complete && !sprite.error) {
            ctx.drawImage(sprite, character.x, character.y, character.width, character.height);
        }

        // Draw collected objects
        if (assets.object.complete && !assets.object.error) {
            for (let i = 0; i < window.globalObjectCount; i++) {
                const posX = 20 + (i * 45);
                const posY = 20;
                ctx.drawImage(assets.object, posX, posY, 40, 40);
            }
        }

        // Draw star effect
        if (starAnim.visible && assets.star.complete && !assets.star.error) {
            const frameY = starAnim.frame * starAnim.frameHeight;
            const scale = 0.12;
            const drawWidth = starAnim.frameWidth * scale;
            const drawHeight = starAnim.frameHeight * scale;
            ctx.save();
            ctx.globalAlpha = starFade;
            ctx.drawImage(
                assets.star,
                0, frameY,
                starAnim.frameWidth, starAnim.frameHeight,
                (canvas.width - drawWidth) / 2, 50,
                drawWidth, drawHeight
            );
            ctx.restore();
        }

        // Debug: Draw door trigger area
        if (false) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillRect(doorTrigger.x, doorTrigger.y, doorTrigger.width, doorTrigger.height);
        }
    }
    
    // Game loop management
    let animationFrameId = null;
    let lastTime = 0;
    
    function gameLoop(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const delta = timestamp - lastTime;
        lastTime = timestamp;
        
        update(delta);
        render();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    function startGameLoop() {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
    
    // Event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    // Cleanup function
    function dispose() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
        
        // Clean up assets
        Object.values(assets).forEach(asset => {
            asset.onload = null;
            asset.onerror = null;
            if (asset.src) {
                asset.src = '';
            }
        });
        
        // Clean up audio
        audio.pause();
        audio.src = '';
    }
    
    return {
        dispose
    };
}