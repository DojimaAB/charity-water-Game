// ==============================
// HUD AND STATE REFERENCES
// ==============================
let timerDisplay = document.getElementById("timerValue");
let timerValue = 30;
let initialTimerValue = 30; // Store the initial timer value for bonus calculation

// HUD counters (score + impurity progress)
let scoreDisplay = document.getElementById("scoreValue");
let impuritiesDisplay = document.getElementById("impuritiesValue");
let totalImpuritiesDisplay = document.getElementById("totalImpuritiesValue");
let difficultyButtons = document.querySelectorAll(".difficulty-option");
let selectedDifficulty = "easy";
let startSetup = document.getElementById("startSetup");

// Main play area used for droplet spawning + overlays.
let contentBox = document.querySelector(".content-box");

// Initialize score and impurities variables
let currentScore = 0;
let initialImpurities = 15; // Store initial impurities for win condition
let currentImpurities = initialImpurities; // Initialize current impurities with the initial value

// Counter to give each spawned droplet a unique ID for tracking
let dropletCounter = 0;

// Runtime game state flags + interval handles.
let gameStarted = false; // Tracks whether the game is running
let gameOver = false; // Tracks if the game has ended (win or lose)
let gamePaused = false; // Tracks if the game is paused
let countdownInterval = null; // Reference to countdown interval for cleanup
let spawnInterval = null; // Reference to spawn interval for cleanup
let pauseBtn = document.getElementById("pauseBtn"); // Reference to pause button

// Shooting SFX pool used when any droplet is clicked.
const shootingSoundPaths = [
  "sounds/shoot1.mp3",
  "sounds/shoot2.mp3",
  "sounds/shoot3.mp3",
  "sounds/shoot4.mp3",
  "sounds/shoot5.mp3",
  "sounds/shoot6.mp3",
];

// ==============================
// MUSIC AND AUDIO TRACKS
// ==============================
// These paths point to the music files used in each game state.
// Background music settings
const menuThemePath = "sounds/background-music/menuTheme.mp3";
const missionBriefThemePath = "sounds/background-music/missionBriefTheme.mp3";
const backgroundMusicPath = "sounds/background-music/backgroundMusic.mp3";
const winThemePath = "sounds/background-music/winTheme.mp3";
const loseThemePath = "sounds/background-music/loseTheme.mp3";
const menuTheme = new Audio(menuThemePath);
const missionBriefTheme = new Audio(missionBriefThemePath);
const backgroundMusic = new Audio(backgroundMusicPath);
const winTheme = new Audio(winThemePath);
const loseTheme = new Audio(loseThemePath);

menuTheme.loop = true;
menuTheme.volume = 0.2;
missionBriefTheme.loop = true;
missionBriefTheme.volume = 0.2;
backgroundMusic.loop = true;
backgroundMusic.volume = 0.22;
winTheme.loop = false;
winTheme.volume = 0.2;
loseTheme.loop = false;
loseTheme.volume = 0.2;
let activeTheme = null;

// Preset balancing values used by the difficulty selector.
// Each difficulty changes mission time and how many impurities must be cleared.
const difficultyPresets = {
  easy: { time: 30, impurities: 15 },
  medium: { time: 25, impurities: 20 },
  hard: { time: 20, impurities: 25 },
};

// ==============================
// DIALOGUE SCRIPT CONFIG
// ==============================
// This ordered list controls who speaks and what line appears in the intro.
// Intro briefing script shown after start is pressed.
let introStep = 0;
const blackTransitionInMs = 80;
const blackTransitionHoldMs = 750;
const blackTransitionOutMs = 180;
const introDialogueLines = [
  {
    speaker: "JERRY",
    line: "Purifier, we need your help! The impurities are spreading fast.",
  },
  {
    speaker: "THE PURIFIER",
    line: "I'm ready. Tell me the mission details, Jerry.",
  },
  {
    speaker: "JERRY",
    line: "Your mission is simple: clean every DIRTY droplet you find.",
  },
  {
    speaker: "JERRY",
    line: "Avoid CLEAN droplets. They're already safe, so leave them alone.",
  },
  {
    speaker: "JERRY",
    type: "mission-stats",
  },
  {
    speaker: "THE PURIFIER",
    line: "Understood. I'll PURIFY every last drop.",
  },
];

// Function to highlight the score display with a color for feedback
function highlightScore(color) {
  // Add the appropriate highlight class (score-gain or score-loss)
  scoreDisplay.classList.add(color);
  
  // Remove the highlight class after 1 second (1000ms)
  setTimeout(function() {
    scoreDisplay.classList.remove(color);
  }, 1000);
}

// ==============================
// AUDIO AND UI HELPERS
// ==============================
// Plays one random shooting sound for click feedback.
function playShootingSound() {
  const randomIndex = Math.floor(Math.random() * shootingSoundPaths.length);
  const sound = new Audio(shootingSoundPaths[randomIndex]);
  sound.volume = 0.25;

  // Ignore playback errors (for example, browser autoplay restrictions).
  sound.play().catch(function() {});
}


// Starts or resumes looping background music during active gameplay.
function playBackgroundMusic() {
  playTheme(backgroundMusic);
}


// Pauses background music while preserving current playback position.
function pauseBackgroundMusic() {
  if (activeTheme === backgroundMusic) {
    backgroundMusic.pause();
  }
}


// Stops background music and rewinds to the beginning.
function stopBackgroundMusic() {
  if (activeTheme === backgroundMusic) {
    backgroundMusic.pause();
    backgroundMusic.currentTime = 0;
    activeTheme = null;
  }
}


// Switches cleanly between looping theme tracks.
function playTheme(themeTrack) {
  // If another theme is active, stop it first so tracks never overlap.
  if (activeTheme && activeTheme !== themeTrack) {
    activeTheme.pause();
    activeTheme.currentTime = 0;
  }

  activeTheme = themeTrack;
  activeTheme.play().catch(function() {});
}


// Stops whichever theme is currently active.
function stopActiveTheme() {
  if (!activeTheme) return;
  activeTheme.pause();
  activeTheme.currentTime = 0;
  activeTheme = null;
}


// Types a short dialogue line into a target element.
function playSimpleTypewriterText(element, text, speedMs) {
  if (!element) return;

  element.textContent = "";
  let charIndex = 0;

  const typingInterval = setInterval(function() {
    // Reveal one extra character each tick.
    charIndex++;
    element.textContent = text.slice(0, charIndex);

    if (charIndex >= text.length) {
      clearInterval(typingInterval);
    }
  }, speedMs);
}


// ==============================
// DROPLET-RELATED FUNCTIONS
// ==============================
// Shared click handler for both droplet types
function handleDropletClick(event, dropletType) {
  // Only process clicks if the game is active, not paused, and not already over
  if (!gameStarted || gameOver || gamePaused) return;
  
  // Use currentTarget so we always operate on the droplet itself.
  const droplet = event.currentTarget;

  // Guard against rapid double-click/tap registering multiple times.
  if (!droplet || droplet.dataset.processed === "true") return;
  droplet.dataset.processed = "true";
  
  // Add fade-out animation class for smooth disappearance
  droplet.classList.add("fade-out");

  // Make the droplet non-clickable to prevent multiple clicks
  droplet.style.pointerEvents = "none";
  droplet.style.cursor = "default";

  // Trigger audio feedback immediately on valid click.
  playShootingSound();
  
  // Wait for animation to complete before removing the element
  setTimeout(function() {
    droplet.remove();
  }, 500);

  if (dropletType === "dirty") {
    // Increase score by 50 points when dirty droplet is clicked
    currentScore += 50;
    scoreDisplay.textContent = currentScore;

    // Highlight the score in green to indicate points gained
    highlightScore("score-gain");

    // Decrease impurities by 1 (representing one purified droplet)
    if (currentImpurities > 0) {
      currentImpurities--;
      impuritiesDisplay.textContent = currentImpurities;

      // Check if the player has cleared all impurities (win condition)
      if (currentImpurities === 0) {
        winGame();
      }
    }
  } else {
    // Decrease score by 50 points when clean droplet is clicked (penalty)
    currentScore -= 50;
    // Ensure score doesn't go below 0
    if (currentScore < 0) {
      currentScore = 0;
    }
    scoreDisplay.textContent = currentScore;

    // Highlight the score in red to indicate points lost
    highlightScore("score-loss");
  }
}


// Creates one droplet, places it randomly, and wires its interactions.
function spawnDroplet(dropletType) {
  const droplet = document.createElement("img");
  const isDirty = dropletType === "dirty";

  droplet.src = isDirty ? "img/dirtyDroplet.png" : "img/cleanDroplet.png";
  droplet.alt = isDirty ? "Dirty water droplet" : "Clean water droplet";
  droplet.id = (isDirty ? "droplet-" : "clean-droplet-") + dropletCounter;
  dropletCounter++;
  droplet.classList.add(isDirty ? "dirty-droplet" : "clean-droplet");
  droplet.draggable = false;

  // Append first so offset measurements are accurate.
  contentBox.appendChild(droplet);

  // Get dimensions for randomized positioning within the content area.
  // This keeps droplets fully inside the game box.
  const dropletWidth = droplet.offsetWidth;
  const dropletHeight = droplet.offsetHeight;
  const boxWidth = contentBox.offsetWidth;
  const boxHeight = contentBox.offsetHeight;
  const randomX = Math.random() * (boxWidth - dropletWidth);
  const randomY = Math.random() * (boxHeight - dropletHeight);

  droplet.style.position = "absolute";
  droplet.style.left = randomX + "px";
  droplet.style.top = randomY + "px";
  droplet.style.pointerEvents = "auto";

  droplet.addEventListener(
    "click",
    function(event) {
      handleDropletClick(event, dropletType);
    },
    { once: true }
  );

  // Prevent native image dragging from stealing pointer interactions.
  droplet.addEventListener("dragstart", function(event) {
    event.preventDefault();
  });

  // Auto-expire droplets if untouched.
  setTimeout(function() {
    if (contentBox.contains(droplet)) {
      // Disable hit-testing immediately so fading droplets cannot block other clicks.
      droplet.style.pointerEvents = "none";
      droplet.style.cursor = "default";
      droplet.classList.add("fade-out");
      setTimeout(function() {
        droplet.remove();
      }, 300);
    }
  }, 1000);
}


// Removes all active droplets from the play area.
function clearAllDroplets() {
  const droplets = contentBox.querySelectorAll(".dirty-droplet, .clean-droplet");
  droplets.forEach(function(droplet) {
    droplet.remove();
  });
}


// Toggles crosshair cursor for active gameplay.
function setGameplayCrosshair(enabled) {
  contentBox.classList.toggle("gameplay-crosshair", enabled);
}


// Function to start spawning droplets at regular intervals
function startSpawningDroplets() {
  // Spawn a new droplet every 1 second (1000 milliseconds) for increased difficulty
  // This creates a steady stream of dirty and clean droplets for the player to click
  spawnInterval = setInterval(function() {
    // Only spawn droplets if the game is still running (timer > 0) and not paused
    if (timerValue > 0 && !gamePaused) {
      // Randomly decide whether to spawn a dirty or clean droplet (75% dirty, 25% clean)
      const dropletType = Math.random();
      if (dropletType < 0.75) {
        spawnDroplet("dirty");
      } else {
        spawnDroplet("clean");
      }
    } else if (timerValue <= 0) {
      // Stop spawning droplets when the game timer reaches 0
      clearInterval(spawnInterval);
    }
  }, 500);
}



// ==============================
// PAUSE MENU FLOW
// ==============================
// Shows pause overlay and halts timers/spawn loops.
function showPauseMenu() {
  // Do nothing if already paused or pause menu already exists.
  if (gamePaused || document.getElementById("pauseMenu")) {
    return;
  }

  // Set pause flag
  gamePaused = true;
  
  // Stop the countdown timer
  clearInterval(countdownInterval);
  
  // Stop spawning new droplets
  clearInterval(spawnInterval);

  // Pause background music while game is paused.
  pauseBackgroundMusic();

  // Use normal cursor in pause UI.
  setGameplayCrosshair(false);
  
  // Create and display the pause menu screen
  const pauseMenu = document.createElement("div");
  pauseMenu.className = "game-result-screen pause-screen";
  pauseMenu.id = "pauseMenu";
  pauseMenu.innerHTML = `
    <h2 class="result-title">PAUSED</h2>
    <p class="result-message">Game is paused</p>
    <div class="pause-buttons">
      <button class="result-button" onclick="resumeGame()">Continue</button>
      <button class="result-button" onclick="location.reload()">Restart</button>
    </div>
  `;
  
  // Add the pause menu to the content box
  contentBox.appendChild(pauseMenu);
}


// Closes pause overlay and resumes core loops.
function resumeGame() {
  // Remove the pause menu
  const pauseMenu = document.getElementById("pauseMenu");
  if (pauseMenu) {
    pauseMenu.remove();
  }
  
  // Set pause flag to false
  gamePaused = false;

  // Resume background music when gameplay continues.
  playBackgroundMusic();

  // Re-enable crosshair for active gameplay.
  setGameplayCrosshair(true);
  
  // Resume the countdown timer
  startCountdown();
  
  // Resume spawning droplets
  startSpawningDroplets();
}


// Function to handle the pause button click
function handlePauseButtonClick() {
  // Only allow pause if the game is actively running
  if (gameStarted && !gameOver && !gamePaused) {
    showPauseMenu();
  }
}

// ==============================
// WIN AND LOSE SCREENS
// ==============================
// Handles mission success state + end overlay.
function winGame() {
  // Set game over flag to prevent further interactions
  gameOver = true;
  gameStarted = false;
  
  // Stop the countdown timer
  clearInterval(countdownInterval);
  
  // Stop spawning new droplets
  clearInterval(spawnInterval);

  // Stop active theme music when mission ends.
  stopActiveTheme();

  // Switch to mission-complete theme.
  playTheme(winTheme);

  // Restore default cursor in end screen.
  setGameplayCrosshair(false);
  
  // Calculate bonus points based on remaining time (50 points per second)
  const bonusPoints = timerValue * 50;
  currentScore += bonusPoints;
  scoreDisplay.textContent = currentScore;
  
  // Clear any remaining droplets on the screen
  clearAllDroplets();
  
  // Create and display the win screen
  const winScreen = document.createElement("div");
  winScreen.className = "game-result-screen win-screen";
  winScreen.innerHTML = `
    <h2 class="result-title">MISSION COMPLETE</h2>
    <div class="dialogue-avatar-wrap">
      <img class="dialogue-avatar" src="img/jerryPfp.png" alt="Jerry avatar" />
    </div>
    <p class="dialogue-speaker">JERRY</p>
    <p class="result-message dialogue-line" id="winDialogueLine"></p>
    <div class="result-details">
      <p class="bonus-message">Bonus: +${bonusPoints} points (${timerValue}s × 50)</p>
      <p class="final-score">Final Score: ${currentScore}</p>
    </div>
    <div class="dialogue-buttons">
      <button class="result-button" onclick="location.reload()">Play Again</button>
    </div>
  `;
  
  // Add the win screen to the content box
  contentBox.appendChild(winScreen);

  playSimpleTypewriterText(
    document.getElementById("winDialogueLine"),
    '"You did it! The water is clean and safe, Purifier!"',
    30
  );
}


// Handles mission failure state + end overlay.
function loseGame() {
  // Set game over flag to prevent further interactions
  gameOver = true;
  gameStarted = false;
  
  // Stop spawning new droplets
  clearInterval(spawnInterval);

  // Stop active theme music when mission ends.
  stopActiveTheme();

  // Switch to mission-failed theme.
  playTheme(loseTheme);

  // Restore default cursor in end screen.
  setGameplayCrosshair(false);
  
  // Clear any remaining droplets on the screen
  clearAllDroplets();
  
  // Create and display the lose screen
  const loseScreen = document.createElement("div");
  loseScreen.className = "game-result-screen lose-screen";
  loseScreen.innerHTML = `
    <h2 class="result-title">MISSION FAILED</h2>
    <div class="dialogue-avatar-wrap">
      <img class="dialogue-avatar" src="img/jerryPfp.png" alt="Jerry avatar" />
    </div>
    <p class="dialogue-speaker">JERRY</p>
    <p class="result-message dialogue-line" id="loseDialogueLine"></p>
    <div class="result-details">
      <p class="impurities-left">Impurities remaining: ${currentImpurities}/${initialImpurities}</p>
      <p class="final-score">Final Score: ${currentScore}</p>
    </div>
    <div class="dialogue-buttons">
      <button class="result-button" onclick="location.reload()">Try Again</button>
    </div>
  `;
  
  // Add the lose screen to the content box
  contentBox.appendChild(loseScreen);

  playSimpleTypewriterText(
    document.getElementById("loseDialogueLine"),
    '"Oh no! We didn\'t clean all the water in time!"',
    30
  );
}

// ==============================
// DIFFICULTY AND BRIEFING
// ==============================
// Applies selected difficulty and refreshes pre-game HUD values.
function applyDifficulty(mode) {
  const preset = difficultyPresets[mode] || difficultyPresets.easy;
  selectedDifficulty = mode;

  difficultyButtons.forEach(function(button) {
    const isSelected = button.dataset.difficulty === selectedDifficulty;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  initialTimerValue = preset.time;
  initialImpurities = preset.impurities;

  // Keep HUD in sync before gameplay starts.
  if (!gameStarted && !gameOver) {
    timerValue = initialTimerValue;
    currentImpurities = initialImpurities;
    timerDisplay.textContent = "-";
    impuritiesDisplay.textContent = "-";
    totalImpuritiesDisplay.textContent = "-";
  }
}
// Shows the mission briefing overlay before gameplay starts.
function showIntroDialogue() {
  // Briefing flow: show dialogue -> step lines -> transition -> start gameplay.
  // Switch from menu theme into briefing theme.
  playTheme(missionBriefTheme);

  applyDifficulty(selectedDifficulty);

  if (startSetup) {
    startSetup.style.display = "none";
  }

  introStep = 0;

  const dialogueScreen = document.createElement("div");
  dialogueScreen.className = "game-result-screen tutorial-screen";
  dialogueScreen.id = "introDialogueScreen";
  dialogueScreen.innerHTML = `
    <h2 class="result-title">MISSION BRIEFING</h2>
    <div class="dialogue-avatar-wrap">
      <img class="dialogue-avatar" id="dialogueAvatar" src="img/jerryPfp.png" alt="Dialogue speaker avatar" />
    </div>
    <p class="dialogue-speaker" id="dialogueSpeaker"></p>
    <p class="result-message dialogue-line" id="dialogueLine"></p>
    <div class="dialogue-buttons">
      <button class="result-button" id="dialogueNextBtn" type="button">Next</button>
      <button class="result-button dialogue-skip" id="dialogueSkipBtn" type="button">Skip</button>
    </div>
  `;

  contentBox.appendChild(dialogueScreen);

  const dialogueSpeaker = document.getElementById("dialogueSpeaker");
  const dialogueAvatar = document.getElementById("dialogueAvatar");
  const dialogueLine = document.getElementById("dialogueLine");
  const dialogueNextBtn = document.getElementById("dialogueNextBtn");
  const dialogueSkipBtn = document.getElementById("dialogueSkipBtn");
  let isTransitioning = false;
  let typingInterval = null;
  let isTyping = false;
  let activeTypedText = "";
  let activeDialogueMode = "plain";
  const typingSpeedMs = 30;

  // Stops any in-progress typewriter animation.
  function clearTypingAnimation() {
    if (typingInterval) {
      clearInterval(typingInterval);
      typingInterval = null;
    }
    isTyping = false;
  }

  // Escapes text before inserting it as HTML.
  function escapeDialogueText(text) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  // Adds color emphasis to key mission words in dialogue.
  function applyDialogueHighlights(text) {
    const escapedText = escapeDialogueText(text);

    return escapedText.replace(/\b(DIRTY|CLEAN|PURIFY)\b/g, function(match) {
      const upperMatch = match;
      let highlightClass = "dialogue-highlight-purify";

      if (upperMatch === "DIRTY") {
        highlightClass = "dialogue-highlight-dirty";
      } else if (upperMatch === "CLEAN") {
        highlightClass = "dialogue-highlight-clean";
      }

      return `<span class="${highlightClass}">${match}</span>`;
    });
  }

  // Instantly completes the current line.
  function completeTypedLine() {
    clearTypingAnimation();

    if (activeDialogueMode === "mission-stats") {
      dialogueLine.innerHTML = `"You only have <span class="dialogue-emphasis">${initialTimerValue}</span> seconds to purify <span class="dialogue-emphasis">${initialImpurities}</span> impurities to complete your mission."`;
      return;
    }

    dialogueLine.innerHTML = applyDialogueHighlights(activeTypedText);
  }

  // Reveals one dialogue line character-by-character.
  function typeDialogueLine(text) {
    activeDialogueMode = "plain";
    clearTypingAnimation();
    activeTypedText = text;
    dialogueLine.textContent = "";

    let charIndex = 0;
    isTyping = true;

    typingInterval = setInterval(function() {
      charIndex++;
      dialogueLine.innerHTML = applyDialogueHighlights(activeTypedText.slice(0, charIndex));

      if (charIndex >= activeTypedText.length) {
        clearTypingAnimation();
        dialogueLine.innerHTML = applyDialogueHighlights(activeTypedText);
      }
    }, typingSpeedMs);
  }

  // Reveals the mission-stats line with emphasized dynamic values.
  function typeMissionStatsLine() {
    // Build this special line in parts so timer/impurity numbers can be styled separately.
    activeDialogueMode = "mission-stats";
    clearTypingAnimation();
    activeTypedText = `"You only have ${initialTimerValue} seconds to purify ${initialImpurities} impurities to complete your mission."`;
    dialogueLine.innerHTML = "";

    const segments = [
      { kind: "text", value: '"You only have ' },
      { kind: "emphasis", value: `${initialTimerValue}` },
      { kind: "text", value: " seconds to purify " },
      { kind: "emphasis", value: `${initialImpurities}` },
      { kind: "text", value: ' impurities to complete your mission."' },
    ];

    let segmentIndex = 0;

    function typeNextSegment() {
      // Type one segment at a time; emphasis segments are inserted instantly as <span>.
      if (segmentIndex >= segments.length) {
        clearTypingAnimation();
        return;
      }

      const segment = segments[segmentIndex++];

      if (segment.kind === "emphasis") {
        const emphasisSpan = document.createElement("span");
        emphasisSpan.className = "dialogue-emphasis";
        emphasisSpan.textContent = segment.value;
        dialogueLine.appendChild(emphasisSpan);
        typeNextSegment();
        return;
      }

      const textNode = document.createTextNode("");
      dialogueLine.appendChild(textNode);
      let charIndex = 0;

      typingInterval = setInterval(function() {
        charIndex++;
        textNode.nodeValue = segment.value.slice(0, charIndex);

        if (charIndex >= segment.value.length) {
          clearTypingAnimation();
          typeNextSegment();
        }
      }, typingSpeedMs);
    }

    isTyping = true;
    typeNextSegment();
  }

  // Renders one line from the briefing script.
  function renderDialogueStep() {
    // Read the current step, swap speaker/avatar, then type the correct line variant.
    const currentLine = introDialogueLines[introStep];
    dialogueSpeaker.textContent = currentLine.speaker;

    if (currentLine.speaker === "JERRY") {
      dialogueAvatar.src = "img/jerryPfp.png";
      dialogueAvatar.alt = "Jerry avatar";
    } else {
      dialogueAvatar.src = "img/pfp.png";
      dialogueAvatar.alt = "Purifier avatar";
    }

    if (currentLine.type === "mission-stats") {
      typeMissionStatsLine();
    } else {
      typeDialogueLine(`"${currentLine.line}"`);
    }

    if (introStep === introDialogueLines.length - 1) {
      // Final step: change CTA and hide skip so player starts mission from here.
      dialogueNextBtn.textContent = "Start Mission";
      dialogueSkipBtn.style.display = "none";
    } else {
      dialogueNextBtn.textContent = "Next";
      dialogueSkipBtn.style.display = "inline-block";
    }
  }

  // Cleans up briefing overlay and enters gameplay.
  function closeDialogueAndStart() {
    if (isTransitioning) return;
    isTransitioning = true;

    clearTypingAnimation();

    const screen = document.getElementById("introDialogueScreen");
    if (screen) {
      screen.remove();
    }

    const blackout = document.createElement("div");
    blackout.className = "briefing-blackout";
    blackout.style.position = "absolute";
    blackout.style.inset = "0";
    blackout.style.background = "#000";
    blackout.style.borderRadius = "1.75rem";
    blackout.style.opacity = "0";
    blackout.style.pointerEvents = "none";
    blackout.style.zIndex = "6";
    blackout.style.transition = `opacity ${blackTransitionInMs}ms linear`;
    contentBox.appendChild(blackout);

    // Start with a quick cut to black.
    requestAnimationFrame(function() {
      blackout.style.opacity = "1";
      // Play a shot right on the cut-to-black moment.
      playShootingSound();
    });

    setTimeout(function() {
      startGame();
      blackout.style.transition = `opacity ${blackTransitionOutMs}ms ease`;
      blackout.style.opacity = "0";

      setTimeout(function() {
        blackout.remove();
      }, blackTransitionOutMs);
    }, blackTransitionInMs + blackTransitionHoldMs);
  }

  dialogueNextBtn.addEventListener("click", function() {
    if (isTyping) {
      completeTypedLine();
      return;
    }

    if (introStep < introDialogueLines.length - 1) {
      introStep++;
      renderDialogueStep();
      return;
    }

    closeDialogueAndStart();
  });

  dialogueSkipBtn.addEventListener("click", closeDialogueAndStart);

  renderDialogueStep();
}


// Resets values and starts all gameplay loops.
function startGame() {
  // Set game state flags
  gameStarted = true;
  gameOver = false;
  gamePaused = false;

  // Reset game variables
  currentScore = 0;
  currentImpurities = initialImpurities;
  // Reset the score and impurities display
  scoreDisplay.textContent = currentScore;
  impuritiesDisplay.textContent = currentImpurities;
  totalImpuritiesDisplay.textContent = initialImpurities;
  
  // Reset timer value to initial value
  timerValue = initialTimerValue;
  timerDisplay.textContent = timerValue;
  
  // Start the countdown timer
  startCountdown();

  // Start looping background music once the mission begins.
  playBackgroundMusic();

  // Enable crosshair cursor during active mission.
  setGameplayCrosshair(true);
  
  // Start spawning dirty and clean droplets
  startSpawningDroplets();
}


// Countdown loop that ends the game when time reaches zero.
function startCountdown(){
    // Use global countdownInterval variable so we can clear it later if needed
    countdownInterval = setInterval(function() {
        // Decrement the timer value
        timerValue--;
        // Update the timer display
        timerDisplay.textContent = timerValue;

        // Check if the timer has reached 0
        if (timerValue <= 0) {
            // Stop the countdown
            clearInterval(countdownInterval);
            timerDisplay.textContent = '0';
            // Check if player has not won, show lose screen
            if (!gameOver) {
                loseGame();
            }
        }
    }, 1000);
}

// ==============================
// EVENT BINDINGS AND BOOTSTRAP
// ==============================
// Add event listener to the start button
document.getElementById("startBtn").addEventListener("click", showIntroDialogue);

// Update settings when a difficulty button is clicked before mission start
difficultyButtons.forEach(function(button) {
  button.addEventListener("click", function() {
    applyDifficulty(button.dataset.difficulty);
  });
});

// Initialize UI with default difficulty values
applyDifficulty(selectedDifficulty);

// Start menu theme while waiting at the start screen.
playTheme(menuTheme);

// Add event listener to the pause button
pauseBtn.addEventListener("click", handlePauseButtonClick);