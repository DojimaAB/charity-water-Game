let timerDisplay = document.getElementById("timerValue");
let timerValue = 30;
let initialTimerValue = 30; // Store the initial timer value for bonus calculation

// Get references to score and impurities display elements
let scoreDisplay = document.getElementById("scoreValue");
let impuritiesDisplay = document.getElementById("impuritiesValue");

// Get reference to the main content area where droplets will spawn
let contentBox = document.querySelector(".content-box");

// Initialize score and impurities variables
let currentScore = 0;
let currentImpurities = 10;
let initialImpurities = 10; // Store initial impurities for win condition

// Counter to give each spawned droplet a unique ID for tracking
let dropletCounter = 0;

// Game state variables
let gameStarted = false; // Tracks whether the game is running
let gameOver = false; // Tracks if the game has ended (win or lose)
let gamePaused = false; // Tracks if the game is paused
let countdownInterval = null; // Reference to countdown interval for cleanup
let spawnInterval = null; // Reference to spawn interval for cleanup
let pauseBtn = document.getElementById("pauseBtn"); // Reference to pause button

// Function to highlight the score display with a color for feedback
function highlightScore(color) {
  // Add the appropriate highlight class (score-gain or score-loss)
  scoreDisplay.classList.add(color);
  
  // Remove the highlight class after 1 second (1000ms)
  setTimeout(function() {
    scoreDisplay.classList.remove(color);
  }, 1000);
}

// Function to handle clicking on a dynamically spawned dirty droplet
function handleDirtyDropletClick(event) {
  // Only process clicks if the game is active, not paused, and not already over
  if (!gameStarted || gameOver || gamePaused) return;
  
  // Get the clicked droplet element
  const droplet = event.target;
  
  // Add fade-out animation class for smooth disappearance
  droplet.classList.add("fade-out");
  
  // Wait for animation to complete before removing the element
  setTimeout(function() {
    droplet.remove();
  }, 500);
  
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
}

// Function to handle clicking on a dynamically spawned clean droplet
function handleCleanDropletClick(event) {
  // Only process clicks if the game is active, not paused, and not already over
  if (!gameStarted || gameOver || gamePaused) return;
  
  // Get the clicked clean droplet element
  const droplet = event.target;
  
  // Add fade-out animation class for smooth disappearance
  droplet.classList.add("fade-out");
  
  // Wait for animation to complete before removing the element
  setTimeout(function() {
    droplet.remove();
  }, 500);
  
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

// Function to spawn a new clean droplet at a random position
function spawnCleanDroplet() {
  // Create a new image element for the clean droplet
  const newCleanDroplet = document.createElement("img");
  
  // Set the image source to the clean droplet image
  newCleanDroplet.src = "img/cleanDroplet.png";
  newCleanDroplet.alt = "Clean water droplet";
  
  // Give the clean droplet a unique ID for tracking
  newCleanDroplet.id = "clean-droplet-" + dropletCounter;
  dropletCounter++;
  
  // Add the clean-droplet class for styling
  newCleanDroplet.classList.add("clean-droplet");
  
  // Temporarily add to DOM to calculate actual rendered dimensions
  // This is necessary because CSS uses responsive units (vw)
  contentBox.appendChild(newCleanDroplet);
  
  // Get the actual computed dimensions of the clean droplet (accounting for responsive sizing)
  const dropletWidth = newCleanDroplet.offsetWidth;
  const dropletHeight = newCleanDroplet.offsetHeight;
  
  // Get the dimensions of the content box to calculate random positions
  const boxWidth = contentBox.offsetWidth;
  const boxHeight = contentBox.offsetHeight;
  
  // Generate random horizontal position (accounting for actual droplet width)
  const randomX = Math.random() * (boxWidth - dropletWidth);
  
  // Generate random vertical position (accounting for actual droplet height)
  const randomY = Math.random() * (boxHeight - dropletHeight);
  
  // Set the clean droplet's position using inline styles
  newCleanDroplet.style.position = "absolute";
  newCleanDroplet.style.left = randomX + "px";
  newCleanDroplet.style.top = randomY + "px";
  
  // Add click event listener to the newly created clean droplet
  newCleanDroplet.addEventListener("click", handleCleanDropletClick);
  
  // Set a timer to remove the clean droplet after 5 seconds if it hasn't been clicked
  setTimeout(function() {
    // Check if the clean droplet still exists in the DOM (it might have been clicked)
    if (contentBox.contains(newCleanDroplet)) {
      // Add fade-out animation
      newCleanDroplet.classList.add("fade-out");
      
      // Wait for animation to complete before removing
      setTimeout(function() {
        newCleanDroplet.remove();
      }, 300);
    }
  }, 5000);
}

// Function to spawn a new dirty droplet at a random position
function spawnDirtyDroplet() {
  // Create a new image element for the droplet
  const newDroplet = document.createElement("img");
  
  // Set the image source to the dirty droplet image
  newDroplet.src = "img/dirtyDroplet.png";
  newDroplet.alt = "Dirty water droplet";
  
  // Give the droplet a unique ID for tracking
  newDroplet.id = "droplet-" + dropletCounter;
  dropletCounter++;
  
  // Add the dirty-droplet class for styling
  newDroplet.classList.add("dirty-droplet");
  
  // Temporarily add to DOM to calculate actual rendered dimensions
  // This is necessary because CSS uses responsive units (vw)
  contentBox.appendChild(newDroplet);
  
  // Get the actual computed dimensions of the droplet (accounting for responsive sizing)
  const dropletWidth = newDroplet.offsetWidth;
  const dropletHeight = newDroplet.offsetHeight;
  
  // Get the dimensions of the content box to calculate random positions
  const boxWidth = contentBox.offsetWidth;
  const boxHeight = contentBox.offsetHeight;
  
  // Generate random horizontal position (accounting for actual droplet width)
  const randomX = Math.random() * (boxWidth - dropletWidth);
  
  // Generate random vertical position (accounting for actual droplet height)
  const randomY = Math.random() * (boxHeight - dropletHeight);
  
  // Set the droplet's position using inline styles
  newDroplet.style.position = "absolute";
  newDroplet.style.left = randomX + "px";
  newDroplet.style.top = randomY + "px";
  
  // Add click event listener to the newly created droplet
  newDroplet.addEventListener("click", handleDirtyDropletClick);
  
  // Set a timer to remove the droplet after 5 seconds if it hasn't been clicked
  setTimeout(function() {
    // Check if the droplet still exists in the DOM (it might have been clicked)
    if (contentBox.contains(newDroplet)) {
      // Add fade-out animation
      newDroplet.classList.add("fade-out");
      
      // Wait for animation to complete before removing
      setTimeout(function() {
        newDroplet.remove();
      }, 300);
    }
  }, 5000);
}

// Function to start spawning droplets at regular intervals
function startSpawningDroplets() {
  // Spawn a new droplet every 1 second (1000 milliseconds) for increased difficulty
  // This creates a steady stream of dirty and clean droplets for the player to click
  spawnInterval = setInterval(function() {
    // Only spawn droplets if the game is still running (timer > 0) and not paused
    if (timerValue > 0 && !gamePaused) {
      // Randomly decide whether to spawn a dirty or clean droplet (70% dirty, 30% clean)
      const dropletType = Math.random();
      if (dropletType < 0.7) {
        spawnDirtyDroplet();
      } else {
        spawnCleanDroplet();
      }
    } else if (timerValue <= 0) {
      // Stop spawning droplets when the game timer reaches 0
      clearInterval(spawnInterval);
    }
  }, 1000);
}

// Function to display the pause menu screen
function showPauseMenu() {
  // Set pause flag
  gamePaused = true;
  
  // Stop the countdown timer
  clearInterval(countdownInterval);
  
  // Stop spawning new droplets
  clearInterval(spawnInterval);
  
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

// Function to resume the game from pause
function resumeGame() {
  // Remove the pause menu
  const pauseMenu = document.getElementById("pauseMenu");
  if (pauseMenu) {
    pauseMenu.remove();
  }
  
  // Set pause flag to false
  gamePaused = false;
  
  // Resume the countdown timer
  startCountdown();
  
  // Resume spawning droplets
  startSpawningDroplets();
}

// Function to handle the pause button click
function handlePauseButtonClick() {
  // Only allow pause if the game is actively running
  if (gameStarted && !gameOver) {
    showPauseMenu();
  }
}

// Function to display the win screen with bonus points
function winGame() {
  // Set game over flag to prevent further interactions
  gameOver = true;
  gameStarted = false;
  
  // Stop the countdown timer
  clearInterval(countdownInterval);
  
  // Stop spawning new droplets
  clearInterval(spawnInterval);
  
  // Calculate bonus points based on remaining time (50 points per second)
  const bonusPoints = timerValue * 50;
  currentScore += bonusPoints;
  scoreDisplay.textContent = currentScore;
  
  // Clear any remaining droplets on the screen
  const droplets = contentBox.querySelectorAll(".dirty-droplet");
  droplets.forEach(droplet => droplet.remove());
  
  // Create and display the win screen
  const winScreen = document.createElement("div");
  winScreen.className = "game-result-screen win-screen";
  winScreen.innerHTML = `
    <h2 class="result-title">YOU WIN!</h2>
    <p class="result-message">All impurities purified!</p>
    <p class="bonus-message">Bonus: +${bonusPoints} points (${timerValue}s × 50)</p>
    <p class="final-score">Final Score: ${currentScore}</p>
    <button class="result-button" onclick="location.reload()">Play Again</button>
  `;
  
  // Add the win screen to the content box
  contentBox.appendChild(winScreen);
}

// Function to display the lose screen when time runs out
function loseGame() {
  // Set game over flag to prevent further interactions
  gameOver = true;
  gameStarted = false;
  
  // Stop spawning new droplets
  clearInterval(spawnInterval);
  
  // Clear any remaining droplets on the screen
  const droplets = contentBox.querySelectorAll(".dirty-droplet");
  droplets.forEach(droplet => droplet.remove());
  
  // Create and display the lose screen
  const loseScreen = document.createElement("div");
  loseScreen.className = "game-result-screen lose-screen";
  loseScreen.innerHTML = `
    <h2 class="result-title">GAME OVER</h2>
    <p class="result-message">Time ran out!</p>
    <p class="impurities-left">Impurities remaining: ${currentImpurities}/${initialImpurities}</p>
    <p class="final-score">Final Score: ${currentScore}</p>
    <button class="result-button" onclick="location.reload()">Try Again</button>
  `;
  
  // Add the lose screen to the content box
  contentBox.appendChild(loseScreen);
}

// Function to display the instruction screen at the start of the game
function showInstructionScreen() {
  // Hide the start button
  const startBtn = document.getElementById("startBtn");
  startBtn.style.display = "none";
  
  // Create and display the instruction screen
  const instructionScreen = document.createElement("div");
  instructionScreen.className = "game-result-screen instruction-screen";
  instructionScreen.id = "instructionScreen";
  instructionScreen.innerHTML = `
    <h2 class="result-title">HOW TO PLAY</h2>
    <div class="instruction-content">
      <div class="instruction-item">
        <p class="instruction-label">✓ DIRTY WATER DROPLETS</p>
        <p class="instruction-text">Click on these to eliminate impurities and gain <span class="highlight-green">+50 POINTS</span></p>
      </div>
      <div class="instruction-item">
        <p class="instruction-label">✗ CLEAN WATER DROPLETS</p>
        <p class="instruction-text">Avoid clicking these or you will lose <span class="highlight-red">50 POINTS</span></p>
      </div>
      <div class="instruction-item">
        <p class="instruction-label">⏱ TIME LIMIT</p>
        <p class="instruction-text">Eliminate all <span class="highlight-yellow">10 IMPURITIES</span> before time runs out!</p>
      </div>
    </div>
    <button class="result-button" onclick="startGameplay()">START</button>
  `;
  
  // Add the instruction screen to the content box
  contentBox.appendChild(instructionScreen);
}

// Function to start the actual gameplay after viewing instructions
function startGameplay() {
  // Remove the instruction screen
  const instructionScreen = document.getElementById("instructionScreen");
  if (instructionScreen) {
    instructionScreen.remove();
  }
  
  // Set game state flags
  gameStarted = true;
  gameOver = false;
  gamePaused = false;
  
  // Reset timer value to initial value
  timerValue = initialTimerValue;
  timerDisplay.textContent = timerValue;
  
  // Start the countdown timer
  startCountdown();
  
  // Start spawning dirty and clean droplets
  startSpawningDroplets();
}

// Function to start the game when the player clicks the start button
function startGame() {
  // Show the instruction screen instead of starting immediately
  showInstructionScreen();
}

// Function to start the countdown timer
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

// Add event listener to the start button
document.getElementById("startBtn").addEventListener("click", startGame);

// Add event listener to the pause button
pauseBtn.addEventListener("click", handlePauseButtonClick);