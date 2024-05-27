const radioContainers = document.querySelectorAll('.radio-container');
const submitBtn = document.getElementById('submitBtn');
const resultQuiz = document.getElementById('result-quiz');


radioContainers.forEach(container => {
    const radioInputs = container.querySelectorAll('input[type="radio"]');
    
    radioInputs.forEach(input => {
        input.addEventListener('click', function() {
            radioInputs.forEach(radio => {
                if (radio !== input) {
                    radio.checked = false;
                }
            });
        });
    });
});

submitBtn.addEventListener('click', function() {
    const radioInputs = document.querySelectorAll('input[type="radio"]');

    let totalPoints = 0;
    radioInputs.forEach(input => {
        if (input.checked) {
            totalPoints += parseInt(input.value);
        }
    });

    if(totalPoints >= 45) {
        resultQuiz.textContent = "Very High team cohesion";
    } else if(totalPoints < 45 && totalPoints >= 38) {
        resultQuiz.textContent = "High team cohesion";
    } else if(totalPoints < 38 && totalPoints >= 28) {
        resultQuiz.textContent = "Neutral team cohesion";
    } else if(totalPoints < 28 && totalPoints >= 20) {
        resultQuiz.textContent = "Low team cohesion";
    } else if(totalPoints > 20) {
        resultQuiz.textContent = "Very low team cohesion";
    } else {
        console.log("Something went wrong");
    }

    console.log("Total points: ", totalPoints);
});