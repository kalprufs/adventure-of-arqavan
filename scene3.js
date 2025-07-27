export function startScene3() {
    console.log("🎬 Scene 3 starting...");

    // Fade in from black (only once at scene start)
    const overlay = document.getElementById("fadeOverlay");
    overlay.style.transition = "none";
    overlay.style.opacity = 1;
    setTimeout(() => {
        overlay.style.transition = "opacity 1s";
        overlay.style.opacity = 0;
    }, 10);

    const canvas = document.getElementById("gameCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 1024;
    canvas.height = 512;

    // Stop any previous music
    if (window.currentMusic) {
        window.currentMusic.pause();
        window.currentMusic.currentTime = 0;
        window.currentMusic = null;
    }
    if (window.sceneMusic) {
        window.sceneMusic.pause();
        window.sceneMusic.currentTime = 0;
        window.sceneMusic = null;
    }

    // Initialize THIS scene's music
    const backgroundMusic = new Audio('song/joji.mp3');
    backgroundMusic.volume = 0.5;
    backgroundMusic.loop = true;
    window.sceneMusic = backgroundMusic;

    let musicStarted = false;
    function startBackgroundMusic() {
        if (!musicStarted && window.sceneMusic) {
            window.sceneMusic.play()
                .then(() => {
                    console.log("Scene 3 music started");
                    musicStarted = true;
                })
                .catch(e => console.log("Audio play failed:", e));
        }
    }

    window.globalObjectCount = window.globalObjectCount || 0;

    const assets = {
        background: new Image(),
        idle: new Image(),
        left: new Image(),
        right: new Image(), 
        up: new Image(),
        object: new Image(),
        meli: new Image(),
        sohrabak: new Image(),
        sohrabwalking: new Image()
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

    assets.background.src = "backgrounds/cafe.png";
    assets.background.onload = () => markLoaded("background");

    // Character sprites
    assets.idle.src = "sprites/melika.png";
    assets.idle.onload = () => markLoaded("idle");
    assets.left.src = "sprites/melikaleft.png";
    assets.left.onload = () => markLoaded("left");
    assets.right.src = "sprites/melikaright.png";
    assets.right.onload = () => markLoaded("right");
    assets.up.src = "sprites/melikaup.png";
    assets.up.onload = () => markLoaded("up");
    assets.object.src = "sprites/object.png";
    assets.object.onload = () => markLoaded("object");

    // Scene sprites
    assets.meli.src = "sprites/meli.png";
    assets.meli.onload = () => markLoaded("meli");
    assets.sohrabak.src = "sprites/sohrabak.png";
    assets.sohrabak.onload = () => markLoaded("sohrabak");
    assets.sohrabwalking.src = "sprites/sohrabwalking.png";
    assets.sohrabwalking.onload = () => markLoaded("sohrabwalking");

    // Animation configurations
    const createAnimState = (x, y, scale = 0.15, fps = 3) => ({
        frame: 0,
        timer: 0,
        frameCount: 2,
        frameWidth: 1024,
        frameHeight: 1024,
        fps,
        x,
        y,
        scale,
        visible: true
    });

    // Character animations
    const meliAnim = createAnimState(150, 275, 0.1953);
    
    // Sohrab with modified Y (275) and increased movement (+150)
    const sohrabAnim = {
        ...createAnimState(300, 275, 0.1953),
        state: 'idle',
        targetX: 450,
        moving: false
    };

    // Player character
    const char = {
        x: 10,
        y: 305,
        w: 200,
        h: 200,
        speed: 5,
        jump: false,
        vy: 0,
        dir: "right",
        move: false,
        canInteract: true
    };

    // Dialogue states
    const firstDialogue = [
        { name: "ارغوان", text: "امروز تو باشگاه فول بادی داشتم خستمههه" },
        { name: "سهراب", text: "اخی ناناصی گناه داری که. عیب نداره یه سزار مشت میزنیم." },
        { name: "ارغوان", text: "نه نهه ناهار خوردم. سیگار میزنیم خوبه." },
        { name: "سهراب", text: "والا سیگار قرار بود برسه دستم نرسیده هنوز." }
    ];

    const secondDialogue = [
        { name: "ارغوانه قدیم", text: "سهراب؟" },
        { name: "سهراب", text: "تویی ارغوان؟ نشناختمت. دلم تنگ شده بود برات" },
        { name: "ارغوانه قدیم", text: "اینجا کجاست؟" },
        { name: "سهراب", text: "لاویتائه. مرسی بابت سیگارا ولی بیشتر از اون،" },
        { name: "سهراب", text: "مرسی بابت وجوده تو. چه اونموقع چه الان." },
        { name: "سهراب", text: " مدتی که منتظر سیگارا بودم تونستم بزرگ شدنتو ببینم" },
        { name: "سهراب", text: "از زمانی که سر اتود ذوق میکردی تا سر ماشین جدیدت "},
        { name: "سهراب", text: "نمیدونی چقدر بهت افتخار میکنم..." },
        { name: "سهراب", text: "تو کسی میشی که نمیتونم نبودنشو تصور کنم" },
        { name: "سهراب", text: "سیگار و ضرراشو به جون میخرم اگه تو ساقیش باشی." },
        { name: "سهراب", text: "تو قوی ترین آدمی ای که دیدم" },
        { name: "سهراب", text: "هرکسی که تورو توی زندگیش داره خیلی خوش شانسه" },
        { name: "سهراب", text: "از جمله من." },
        { name: "سهراب", text: "راستی چرا این شلوارت هنوز سوراخه؟" },
        { name: "ارغوانه قدیم", text: "چرا روپوش سفید تنمه؟" },
        { name: "سهراب", text: "مهندس شدی" },
        { name: "ارغوانه قدیم", text: "اسپویل نکن" },
        { name: "سهراب", text: "راستی من سیگارامو گم کردم میتونی بری بیاری باز؟" }
    ];

    const meliDialogue = [
        { name: "ارغوان", text: "سهراب چندبار گفتم جلو منو بگیر شیرین عسل نخورم" }
    ];

    let currentDialogue = null;
    let dialogueIndex = 0;
    let dialogueActive = false;
    let typing = false;
    let displayText = "";
    let typingTimer = 0;
    let currentCharIndex = 0;
    const typingSpeed = 30;

    let firstDialogueCompleted = false;
    let secondDialogueCompleted = false;
    let meliDialogueCompleted = false;
    let endTimer = 0;
    const endDelay = 20000;

    const keys = {};
    let spacePressed = false;
    let initialInteractionMade = false;

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
                
                if (currentDialogue === firstDialogue) {
                    firstDialogueCompleted = true;
                    sohrabAnim.state = 'walking';
                    sohrabAnim.moving = true;
                } else if (currentDialogue === secondDialogue) {
                    secondDialogueCompleted = true;
                    window.globalObjectCount = 0;
                } else if (currentDialogue === meliDialogue) {
                    meliDialogueCompleted = true;
                    endTimer = endDelay;
                }
            }
        }
    }

    function scene3HandleKeyDown(e) {
        // Start music on first interaction
        if (!initialInteractionMade) {
            startBackgroundMusic();
            initialInteractionMade = true;
        }

        // Only process arrow keys for movement
        if (["ArrowLeft", "ArrowRight", "ArrowUp"].includes(e.key)) {
            keys[e.key] = true;

            if (e.key === "ArrowRight") {
                char.dir = "right";
            } else if (e.key === "ArrowLeft") {
                char.dir = "left";
            }

            char.move = keys["ArrowLeft"] || keys["ArrowRight"];

            if (e.key === "ArrowUp" && !char.jump) {
                char.jump = true;
                char.vy = -12;
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
                const charRect = {
                    x: char.x,
                    y: char.y,
                    w: char.w,
                    h: char.h
                };

                if (!firstDialogueCompleted) {
                    const meliRect = {
                        x: meliAnim.x,
                        y: meliAnim.y,
                        w: meliAnim.frameWidth * meliAnim.scale,
                        h: meliAnim.frameHeight * meliAnim.scale
                    };
                    
                    const sohrabRect = {
                        x: sohrabAnim.x,
                        y: sohrabAnim.y,
                        w: sohrabAnim.frameWidth * sohrabAnim.scale,
                        h: sohrabAnim.frameHeight * sohrabAnim.scale
                    };

                    if (checkCollision(charRect, meliRect) || checkCollision(charRect, sohrabRect)) {
                        showDialogue(firstDialogue);
                        e.preventDefault();
                        return;
                    }
                }
                
                if (firstDialogueCompleted && !secondDialogueCompleted && !sohrabAnim.moving) {
                    const sohrabRect = {
                        x: sohrabAnim.x,
                        y: sohrabAnim.y,
                        w: sohrabAnim.frameWidth * sohrabAnim.scale,
                        h: sohrabAnim.frameHeight * sohrabAnim.scale
                    };

                    if (checkCollision(charRect, sohrabRect)) {
                        showDialogue(secondDialogue);
                        e.preventDefault();
                        return;
                    }
                }
                
                if (secondDialogueCompleted && !meliDialogueCompleted) {
                    const meliRect = {
                        x: meliAnim.x,
                        y: meliAnim.y,
                        w: meliAnim.frameWidth * meliAnim.scale,
                        h: meliAnim.frameHeight * meliAnim.scale
                    };

                    if (checkCollision(charRect, meliRect)) {
                        showDialogue(meliDialogue);
                        e.preventDefault();
                        return;
                    }
                }
            }
        }
    }

    function handleKeyUp(e) {
        if (["ArrowLeft", "ArrowRight"].includes(e.key)) {
            keys[e.key] = false;
            char.move = keys["ArrowLeft"] || keys["ArrowRight"];
            
            // Update direction based on which keys are still pressed
            if (keys["ArrowRight"]) {
                char.dir = "right";
            } else if (keys["ArrowLeft"]) {
                char.dir = "left";
            }
        }

        if (e.key === " ") {
            spacePressed = false;
        }
    }

    function checkCollision(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.w &&
            rect1.x + rect1.w > rect2.x &&
            rect1.y < rect2.y + rect2.h &&
            rect1.y + rect1.h > rect2.y
        );
    }

    function updateAnimation(anim, delta) {
        anim.timer += delta;
        const frameDuration = 1000 / anim.fps;
        if (anim.timer >= frameDuration) {
            anim.timer -= frameDuration;
            anim.frame = (anim.frame + 1) % anim.frameCount;
        }
    }

    function drawSprite(sprite, anim) {
        if (!anim.visible || !sprite.complete) return;
        
        const frameY = anim.frame * anim.frameHeight;
        ctx.drawImage(
            sprite,
            0, frameY,
            anim.frameWidth, anim.frameHeight,
            anim.x, anim.y,
            anim.frameWidth * anim.scale,
            anim.frameHeight * anim.scale
        );
    }

    function update(delta) {
        if (dialogueActive) {
            updateTypewriterEffect(delta);
            return;
        }

        // Handle character movement
        if (char.move) {
            if (char.dir === "right") {
                char.x = Math.min(canvas.width - char.w, char.x + char.speed);
            } else if (char.dir === "left") {
                char.x = Math.max(0, char.x - char.speed);
            }
        }

        // Handle jumping
        if (char.jump) {
            char.y += char.vy;
            char.vy += 0.5;
            if (char.y >= 305) {
                char.y = 305;
                char.vy = 0;
                char.jump = false;
            }
        }

        // Update all animations
        updateAnimation(meliAnim, delta);
        
        if (sohrabAnim.state === 'walking') {
            updateAnimation(sohrabAnim, delta);
            
            if (sohrabAnim.moving) {
                sohrabAnim.x += 1;
                if (sohrabAnim.x >= sohrabAnim.targetX) {
                    sohrabAnim.x = sohrabAnim.targetX;
                    sohrabAnim.moving = false;
                    sohrabAnim.state = 'idle';
                }
            }
        } else {
            updateAnimation(sohrabAnim, delta);
        }

        // Update end timer
        if (meliDialogueCompleted && endTimer > 0) {
            endTimer -= delta;
            if (endTimer <= 0) {
                overlay.style.opacity = 1;
                overlay.style.transition = "opacity 2s";
                
                setTimeout(() => {
                    console.log("Scene 3 completed");
                }, 2000);
            }
        }
    }

    function render() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw background
        if (assets.background.complete) {
            ctx.drawImage(assets.background, 0, 0, canvas.width, canvas.height);
        }

        // Draw characters with their animations
        if (sohrabAnim.state === 'walking') {
            drawSprite(assets.sohrabwalking, sohrabAnim);
        } else {
            drawSprite(assets.sohrabak, sohrabAnim);
        }

        drawSprite(assets.meli, meliAnim);

        // Draw main character
        let sprite = assets.idle;
        if (char.jump) sprite = assets.up;
        else if (char.move) sprite = char.dir === "left" ? assets.left : assets.right;

        if (sprite.complete) {
            ctx.drawImage(sprite, char.x, char.y, char.w, char.h);
        }

        // Draw collected objects
        if (assets.object.complete) {
            for (let i = 0; i < window.globalObjectCount; i++) {
                ctx.drawImage(assets.object, 20 + (i * 45), 20, 40, 40);
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
        window.removeEventListener("keydown", scene3HandleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
        if (window.sceneMusic) {
            window.sceneMusic.pause();
            window.sceneMusic.currentTime = 0;
            window.sceneMusic = null;
        }
    }

    window.addEventListener("keydown", scene3HandleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return {
        dispose
    };
}