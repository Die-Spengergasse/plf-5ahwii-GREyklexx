"use strict";
class Main {
    master = null;
    guesses = null;

    domMasterField = null;
    domGuessesField = null;
    domNotifyBox = null;

    computerCanGuess = false;
    computerCanEvaluate = false;

    constructor(master, guesses, notify) {
        this.domMasterField = master;
        this.domGuessesField = guesses;
        this.domNotifyBox = notify;
        this.createComputerControls();
    }

    createComputerControls() {
        const controls = document.createElement("div");
        controls.classList.add("computer-controls");

        const guessToggle = document.createElement("button");
        guessToggle.innerText = "Computer raten lassen";
        guessToggle.addEventListener("click", () => {
            this.computerCanGuess = !this.computerCanGuess;
            if (
                this.computerCanGuess && this.guesses.length > 0 &&
                !this.guesses[this.guesses.length - 1].isBewerted
            ) {
                this.guesses[this.guesses.length - 1].autoGuess();
            }
        });

        const evaluateToggle = document.createElement("button");
        evaluateToggle.innerText = "Computer bewerten lassen";
        evaluateToggle.addEventListener("click", () => {
            this.computerCanEvaluate = !this.computerCanEvaluate;
            if (
                this.computerCanEvaluate && this.computerCanGuess &&
                this.guesses.length > 0 &&
                !this.guesses[this.guesses.length - 1].isBewerted
            ) {
                this.guesses[this.guesses.length - 1].bewerte();
            }
        });

        controls.appendChild(guessToggle);
        controls.appendChild(evaluateToggle);
        document.body.insertBefore(controls, this.domMasterField);
    }

    newGame() {
        this.initMaster();
        this.domNotifyBox.value = "";
        this.notify("Neues Spiel gestartet");
        this.initGuesses();
    }

    initGuesses() {
        this.domGuessesField.innerHTML = "";

        this.guesses = [new Guess(this, this.master.getPossibilities())];
        this.domGuessesField.prepend(this.guesses[0].domObj);
    }

    initMaster() {
        this.domMasterField.innerHTML = "";

        this.master = new Master(this);
        this.domMasterField.appendChild(this.master.domObj);
    }

    prependGuess() {
        let guess = new Guess(
            this,
            this.guesses[this.guesses.length - 1].getPossibilities(),
        );
        this.guesses.push(guess);
        this.domGuessesField.prepend(
            this.guesses[this.guesses.length - 1].domObj,
        );
    }

    prependWin() {
        this.guesses.push(new RowWin(this));
        this.domGuessesField.prepend(
            this.guesses[this.guesses.length - 1].domObj,
        );
    }
    notify() {
        let t = new Date().toLocaleTimeString();
        for (let i = 0; i < arguments.length; i++) {
            this.domNotifyBox.value = `${t}: ${arguments[i]}\n` +
                this.domNotifyBox.value;
        }
    }
}
