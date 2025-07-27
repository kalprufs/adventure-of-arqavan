export function startScene2() {
    console.log("🎬 Scene 2 starting...");

    // Fade in from black
    const overlay = document.getElementById("fadeOverlay");
    if (overlay) {
        overlay.style.transition = "opacity 1s";
        overlay.style.opacity = 0;
    }

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 512;

    // Initialize background music
    const backgroundMusic = new Audio('song/paper.mp3');
    backgroundMusic.volume = 0.5;
    backgroundMusic.loop = true;
    window.currentMusic = backgroundMusic; // Store in global variable

    function startBackgroundMusic() {
        backgroundMusic.play()
            .then(() => console.log("Background music started"))
            .catch(e => console.log("Audio play failed:", e));
    }

    window.globalObjectCount = window.globalObjectCount || 0;

    const assets = {
        background: new Image(),
        idle: new Image(),
        left: new Image(),
        right: new Image(),
        up: new Image(),
        object: new Image(),
        car: new Image(),
        note: new Image()
    };

    let loaded = 0;
    const total = Object.keys(assets).length;

    function markLoaded(name) {
        loaded++;
        console.log(`✅ Loaded: ${name} (${loaded}/${total})`);
        if (loaded === total) {
            console.log("🚀 All assets loaded, starting loop");
            requestAnimationFrame(gameLoop);
        }
    }

    assets.background.src = "backgrounds/concert.png";
    assets.background.onload = () => markLoaded("background");

    const spriteList = {
        idle: "melika.png",
        left: "melikaleft.png",
        right: "melikaright.png",
        up: "melikaup.png",
        object: "object.png",
        car: "car.png",
        note: "note.png"
    };

    for (let key in spriteList) {
        assets[key].src = `sprites/${spriteList[key]}`;
        assets[key].onload = () => markLoaded(key);
    }

    const carAnim = {
        frame: 0,
        timer: 0,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        fps: 2,
        x: 720,
        y: 370
    };

    const noteAnim = {
        currentFrame: 0,
        frameTimer: 0,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        fps: 3,
        x: canvas.width / 2 - 100,
        y: 80,
        visible: false,
        showTimer: 0,
        showDuration: 7000,
        fadeTimer: 0,
        fadeDuration: 1000,
        alpha: 1,
        hasBeenTriggered: false
    };

    const char = {
        x: 10,
        y: 230,
        w: 200,
        h: 200,
        speed: 5,
        jump: false,
        vy: 0,
        dir: "right",
        move: false,
        hasMoved: false,
        canInteract: true
    };

    const object = {
        x: 330,
        y: 300,
        width: 40,
        height: 40,
        visible: false
    };

    let objectCollected = false;
    let hasTalkedToCar = false;
    let carInteractionAvailable = true;

    const initialDialogue = [
        { name: "بازی", text: "یه راهی پیدا کن این مرحله رو رد کنی." },
        { name: "بازی", text: "چشماتون هم خیلی زیباست." },
        { name: "بازی", text: "دکمه اسپیس یادت نره." }
    ];

    const carDialogue = [
        { name: "سهراب", text: "مگه میشه یه آدم اینقد هنرمند باشه." },
        { name: "سهراب", text: "میتونم تا دو ساعت دیگه هم بشینم و گوش بدم." }
    ];

    const carDialogueRepeat = [
        { name: "سهراب", text: "خیلی بهش افتخار میکنم." }
    ];

    let currentDialogue = null;
    let dialogueIndex = 0;
    let dialogueActive = false;
    let typing = false;
    let displayText = "";
    let typingTimer = 0;
    let currentCharIndex = 0;
    const typingSpeed = 30;

    const keys = {};
    let spacePressed = false;

    function startTypewriterEffect(text) {
        displayText = "";
        typing = true;
        currentCharIndex = 0;
        typingTimer = 0;
        document.getElementById('dialogText').textContent = "";
    }

    function updateTypewriterEffect(delta) {
        if (!typing) return;
        typingTimer += delta;
        while (
            typingTimer >= typingSpeed &&
            currentCharIndex < currentDialogue[dialogueIndex].text.length
        ) {
            displayText += currentDialogue[dialogueIndex].text.charAt(currentCharIndex);
            currentCharIndex++;
            typingTimer -= typingSpeed;
            document.getElementById('dialogText').textContent = displayText;
        }
        if (currentCharIndex >= currentDialogue[dialogueIndex].text.length) {
            typing = false;
        }
    }

    function showDialogue(dialogue) {
        currentDialogue = dialogue;
        dialogueIndex = 0;
        dialogueActive = true;
        char.canInteract = false;
        startTypewriterEffect(currentDialogue[0].text);
        document.getElementById('dialogContainer').style.display = 'flex';
        document.getElementById('dialogName').textContent = currentDialogue[0].name;
    }

    function nextDialogue() {
        if (typing) {
            displayText = currentDialogue[dialogueIndex].text;
            typing = false;
            currentCharIndex = currentDialogue[dialogueIndex].text.length;
            document.getElementById('dialogText').textContent = displayText;
        } else {
            dialogueIndex++;
            if (dialogueIndex < currentDialogue.length) {
                startTypewriterEffect(currentDialogue[dialogueIndex].text);
                document.getElementById('dialogName').textContent = currentDialogue[dialogueIndex].name;
            } else {
                dialogueActive = false;
                document.getElementById('dialogContainer').style.display = 'none';
                char.canInteract = true;
                
                if (currentDialogue === carDialogue) {
                    object.visible = true;
                    hasTalkedToCar = true;
                    carInteractionAvailable = false;
                    setTimeout(() => {
                        carInteractionAvailable = true;
                    }, 3000);
                }
            }
        }
    }

    // Named function for global keydown listener to allow proper removal
    function scene2HandleGlobalKeyDown(e) {
        // Start music on first key press if it's paused
        if (backgroundMusic.paused) {
            startBackgroundMusic();
        }
        
        keys[e.key] = true;

        if (!char.hasMoved && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
            char.hasMoved = true;
            showDialogue(initialDialogue);
        }

        if (e.key === "ArrowRight") char.dir = "right";
        if (e.key === "ArrowLeft") char.dir = "left";
        char.move = keys["ArrowLeft"] || keys["ArrowRight"];
        if (e.key === "ArrowUp" && !char.jump) {
            char.jump = true;
            char.vy = -12;
        }

        // Object collection with 'A' key
        if (e.key.toLowerCase() === 'a' && !objectCollected && object.visible && char.canInteract) {
            const charRect = {
                x: char.x,
                y: char.y,
                w: char.w,
                h: char.h
            };
            const objectRect = {
                x: object.x,
                y: object.y,
                w: object.width,
                h: object.height
            };

            if (checkCollision(charRect, objectRect)) {
                objectCollected = true;
                object.visible = false;
                window.globalObjectCount++;
                console.log("Object collected!");
                e.preventDefault();
            }
        }

        if (e.key === " " && !spacePressed) {
            spacePressed = true;
            
            if (dialogueActive) {
                nextDialogue();
                e.preventDefault();
                return;
            }

            if (char.canInteract) {
                // Note interaction
                const charCenterX = char.x + char.w / 2;
                if (charCenterX > canvas.width / 2 - 100 && charCenterX < canvas.width / 2 + 100) {
                    noteAnim.visible = true;
                    noteAnim.hasBeenTriggered = true;
                    noteAnim.showTimer = 0;
                    noteAnim.fadeTimer = 0;
                    noteAnim.alpha = 1;
                    noteAnim.currentFrame = 0;
                    noteAnim.frameTimer = 0;
                }

                // Scene transition check
                if (objectCollected && noteAnim.hasBeenTriggered) {
                    const charRightEdge = char.x + char.w;
                    if (charRightEdge >= canvas.width - 50) {
                        console.log("Transitioning to scene3...");
                        overlay.style.opacity = 1;
                        
                        // STOP CURRENT MUSIC BEFORE TRANSITION
                        if (window.currentMusic) {
                            window.currentMusic.pause();
                            window.currentMusic.currentTime = 0;
                            window.currentMusic = null; // Clear global reference
                        }
                        
                        setTimeout(() => {
                            dispose();
                            // Dynamically import scene3 and access its named export
                            import('./scene3.js').then(({ startScene3 }) => { // Corrected named import
                                if (typeof startScene3 === 'function') {
                                    startScene3();
                                } else {
                                    console.error("Error: startScene3 is not a function after import. Type:", typeof startScene3, "Module:", startScene3);
                                }
                            }).catch(error => {
                                console.error("Failed to load scene3:", error);
                            });
                        }, 1000);
                        e.preventDefault();
                        return;
                    }
                }

                // Car interaction
                if (carInteractionAvailable) {
                    const charRect = {
                        x: char.x,
                        y: char.y,
                        w: char.w,
                        h: char.h
                    };
                    const carRect = {
                        x: carAnim.x,
                        y: carAnim.y,
                        w: carAnim.frameWidth * 0.2,
                        h: carAnim.frameHeight * 0.2
                    };

                    if (checkCollision(charRect, carRect)) {
                        if (hasTalkedToCar && carInteractionAvailable) {
                            showDialogue(carDialogueRepeat);
                            carInteractionAvailable = false;
                            setTimeout(() => {
                                carInteractionAvailable = true;
                            }, 3000);
                        } else if (!hasTalkedToCar) {
                            showDialogue(carDialogue);
                        }
                        e.preventDefault();
                    }
                }
            }
        }
    }

    function handleKeyUp(e) {
        keys[e.key] = false;
        if (e.key === " ") {
            spacePressed = false;
        }
        char.move = keys["ArrowLeft"] || keys["ArrowRight"];
    }

    function checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    function update(delta) {
        if (dialogueActive) {
            updateTypewriterEffect(delta);
            return;
        }

        if (keys["ArrowLeft"]) char.x = Math.max(0, char.x - char.speed);
        if (keys["ArrowRight"]) char.x = Math.min(canvas.width - char.w, char.x + char.speed);

        if (char.jump) {
            char.y += char.vy;
            char.vy += 0.5;
            if (char.y >= 230) {
                char.y = 230;
                char.vy = 0;
                char.jump = false;
            }
        }

        carAnim.timer += delta;
        const carFrameDuration = 1000 / carAnim.fps;
        if (carAnim.timer >= carFrameDuration) {
            carAnim.timer -= carFrameDuration;
            carAnim.frame = (carAnim.frame + 1) % carAnim.frameCount;
        }

        if (noteAnim.visible) {
            noteAnim.frameTimer += delta;
            noteAnim.showTimer += delta;

            const frameDuration = 1000 / noteAnim.fps;
            if (noteAnim.frameTimer >= frameDuration) {
                noteAnim.frameTimer -= frameDuration;
                noteAnim.currentFrame = (noteAnim.currentFrame + 1) % noteAnim.frameCount;
            }

            if (noteAnim.showTimer >= noteAnim.showDuration) {
                noteAnim.fadeTimer += delta;
                noteAnim.alpha = 1 - (noteAnim.fadeTimer / noteAnim.fadeDuration);

                if (noteAnim.fadeTimer >= noteAnim.fadeDuration) {
                    noteAnim.visible = false;
                }
            }
        }
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (assets.background.complete) {
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        }

        if (object.visible && assets.object.complete) {
            ctx.drawImage(assets.object, object.x, object.y, object.width, object.height);
        }

        let sprite = assets.idle;
        if (char.jump) sprite = assets.up;
        else if (char.move) sprite = char.dir === "left" ? assets.left : assets.right;

        if (sprite.complete) {
            ctx.drawImage(sprite, char.x, char.y, char.w, char.h);
        }

        if (assets.car.complete) {
            const frameY = carAnim.frame * carAnim.frameHeight;
            const scale = 0.2;
            ctx.drawImage(
                assets.car,
                0, frameY,
                carAnim.frameWidth,
                carAnim.frameHeight,
                carAnim.x,
                carAnim.y,
                carAnim.frameWidth * scale,
                carAnim.frameHeight * scale // Corrected: Used carAnim.frameHeight
            );
        }

        if (noteAnim.visible && assets.note.complete) {
            const frameY = noteAnim.currentFrame * noteAnim.frameHeight;
            ctx.save();
            ctx.globalAlpha = noteAnim.alpha;
            ctx.drawImage(
                assets.note,
                0, frameY,
                noteAnim.frameWidth,
                noteAnim.frameHeight,
                noteAnim.x,
                noteAnim.y,
                noteAnim.frameWidth * 0.1, // Corrected: Used noteAnim.frameWidth
                noteAnim.frameHeight * 0.1 // Corrected: Used noteAnim.frameHeight
            );
            ctx.restore();
        }

        if (assets.object.complete) {
            for (let i = 0; i < window.globalObjectCount; i++) {
                ctx.drawImage(
                    assets.object,
                    20 + (i * 45),
                    20,
                    40,
                    40
                );
            }
        }
    }

    let lastTime = performance.now();
    function gameLoop(now) {
        const delta = now - lastTime;
        lastTime = now;
        update(delta);
        render();
        requestAnimationFrame(gameLoop);
    }

    function dispose() {
        window.removeEventListener("keydown", scene2HandleGlobalKeyDown); // Correctly remove the named listener
        window.removeEventListener("keyup", handleKeyUp);
        if (window.currentMusic) {
            window.currentMusic.pause();
            window.currentMusic.currentTime = 0;
            window.currentMusic = null; // Clear global reference
        }
    }

    window.addEventListener("keydown", scene2HandleGlobalKeyDown); // Add the named listener
    window.addEventListener("keyup", handleKeyUp);

    return {
        dispose
    };
}
