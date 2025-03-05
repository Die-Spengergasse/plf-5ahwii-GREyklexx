"use strict";

import { Grid } from "./grid.js";

// Initialize grid with responsive size based on viewport
function calculateGridSize() {
	const minDimension = Math.min(window.innerWidth, window.innerHeight);
	const baseSize = 50; // Default grid size
	const scaleFactor = minDimension < 768 ? 0.7 : 1; // Reduce grid size on smaller screens
	return Math.floor(baseSize * scaleFactor);
}

const gridSize = calculateGridSize();
const grid = new Grid(null, document.querySelector("main"), gridSize, gridSize);

// Event Listeners
document.querySelector("#reset").addEventListener("click", () => grid.reset());
document.querySelector("#go").addEventListener("click", () => grid.getGoing());
document.querySelector("#stop").addEventListener("click", () => grid.pause());

document.querySelector("#form").addEventListener("change", (e) => {
	const pattern = e.target.value;
	if (pattern !== "drop some known figures") {
		grid.setPattern(pattern);
		e.target.value = "drop some known figures";
	}
});

// Navigation Controls
const directions = ["left", "right", "up", "down"];
directions.forEach((direction) => {
	document.querySelector(`#${direction}`).addEventListener("click", () => {
		grid.shift(direction);
	});
});

// Handle window resize
let resizeTimeout;
window.addEventListener("resize", () => {
	clearTimeout(resizeTimeout);
	resizeTimeout = setTimeout(() => {
		const newSize = calculateGridSize();
		if (newSize !== gridSize) {
			location.reload(); // Refresh to apply new grid size
		}
	}, 250); // Debounce resize events
});

// Keyboard Controls for History Navigation
document.addEventListener("keydown", (e) => {
	switch (e.key) {
		case " ": // Space key
			if (grid.intervalId) {
				grid.pause();
			} else {
				grid.getGoing();
			}
			break;
		case "PageUp":
		case "PageDown":
		case "Enter":
			if (!grid.intervalId) { // Only when paused
				switch (e.key) {
					case "PageUp":
						grid.history.navigateHistory(-1);
						break;
					case "PageDown":
						grid.history.navigateHistory(1);
						break;
					case "Enter":
						if (e.ctrlKey) {
							grid.history.restoreState();
						}
						break;
				}
			}
			break;
	}
});

// Initialize history with current state
grid.history.addState(grid.cells, 0);
