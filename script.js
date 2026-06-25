let timerDisplay = document.getElementById("timerValue");
let timerValue = 30;

// function to start the countdown
function startCountdown(){
    const countdownInterval = setInterval(function() {
        // decrement the timer value
        timerValue--;
        // update the timer display
        timerDisplay.textContent = timerValue;

        // stop the countdown when the timer reaches 0
        if (timerValue <= 0) {
            clearInterval(countdownInterval);
            timerDisplay.textContent = '0';
        }
    }, 1000);
}

startCountdown();