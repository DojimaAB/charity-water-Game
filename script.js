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
let initialImpurities = 15; // Store initial impurities for win condition
let currentImpurities = initialImpurities; // Initialize current impurities with the initial value

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


// Shared click handler for both droplet types
function handleDropletClick(event, dropletType) {
  // Only process clicks if the game is active, not paused, and not already over
  if (!gameStarted || gameOver || gamePaused) return;
  
  // Get the clicked droplet element
  const droplet = event.target;
  
  // Add fade-out animation class for smooth disappearance
  droplet.classList.add("fade-out");

  // Make the droplet non-clickable to prevent multiple clicks
  droplet.style.pointerEvents = "none";
  
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


// Shared spawn function for clean and dirty droplets
function spawnDroplet(dropletType) {
  const droplet = document.createElement("img");
  const isDirty = dropletType === "dirty";

  droplet.src = isDirty ? "img/dirtyDroplet.png" : "img/cleanDroplet.png";
  droplet.alt = isDirty ? "Dirty water droplet" : "Clean water droplet";
  droplet.id = (isDirty ? "droplet-" : "clean-droplet-") + dropletCounter;
  dropletCounter++;
  droplet.classList.add(isDirty ? "dirty-droplet" : "clean-droplet");

  // Temporarily add to DOM to calculate actual rendered dimensions.
  contentBox.appendChild(droplet);

  // Get dimensions for randomized positioning within the content area.
  const dropletWidth = droplet.offsetWidth;
  const dropletHeight = droplet.offsetHeight;
  const boxWidth = contentBox.offsetWidth;
  const boxHeight = contentBox.offsetHeight;
  const randomX = Math.random() * (boxWidth - dropletWidth);
  const randomY = Math.random() * (boxHeight - dropletHeight);

  droplet.style.position = "absolute";
  droplet.style.left = randomX + "px";
  droplet.style.top = randomY + "px";

  droplet.addEventListener("click", function(event) {
    handleDropletClick(event, dropletType);
  });

  // Remove droplet after 2 seconds if it hasn't been clicked.
  setTimeout(function() {
    if (contentBox.contains(droplet)) {
      droplet.classList.add("fade-out");
      setTimeout(function() {
        droplet.remove();
      }, 300);
    }
  }, 2000);
}


// Function to start spawning droplets at regular intervals
function startSpawningDroplets() {
  // Spawn a new droplet every 1 second (1000 milliseconds) for increased difficulty
  // This creates a steady stream of dirty and clean droplets for the player to click
  spawnInterval = setInterval(function() {
    // Only spawn droplets if the game is still running (timer > 0) and not paused
    if (timerValue > 0 && !gamePaused) {
      // Randomly decide whether to spawn a dirty or clean droplet (60% dirty, 40% clean)
      const dropletType = Math.random();
      if (dropletType < 0.6) {
        spawnDroplet("dirty");
      } else {
        spawnDroplet("clean");
      }
    } else if (timerValue <= 0) {
      // Stop spawning droplets when the game timer reaches 0
      clearInterval(spawnInterval);
    }
  }, 750);
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
    <h2 class="result-title">MISSION COMPLETE</h2>
    <p class="result-message">Dispatcher: "Water is now all clean and safe to drink! It's all thanks to you, The Purifier!"</p>
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
    <h2 class="result-title">MISSION FAILED</h2>
    <p class="result-message">Dispatcher: "Oh no! We didn't clean all the water in time!"</p>
    <p class="impurities-left">Impurities remaining: ${currentImpurities}/${initialImpurities}</p>
    <p class="final-score">Final Score: ${currentScore}</p>
    <button class="result-button" onclick="location.reload()">Try Again</button>
  `;
  
  // Add the lose screen to the content box
  contentBox.appendChild(loseScreen);
}


// Function to start the game when the player clicks the start button
function startGame() {
  // Hide the start button once gameplay begins
  const startBtn = document.getElementById("startBtn");
  startBtn.style.display = "none";

  // Set game state flags
  gameStarted = true;
  gameOver = false;
  gamePaused = false;

  // Reset game variables
  currentScore = 0;
  currentImpurities = initialImpurities;
  // Reset the score and impurities display
  scoreDisplay.textContent = currentScore;
  impuritiesValue.textContent = currentImpurities;
  totalImpuritiesValue.textContent = initialImpurities;
  
  // Reset timer value to initial value
  timerValue = initialTimerValue;
  timerDisplay.textContent = timerValue;
  
  // Start the countdown timer
  startCountdown();
  
  // Start spawning dirty and clean droplets
  startSpawningDroplets();
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