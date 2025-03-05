"use strict";

import { Component } from "./component.js";

export class GameHistory extends Component {
    maxSize;
    states = [];
    currentIndex = -1;

    constructor(parent, anchor, maxSize = 100) {
        super(parent, anchor);
        this.maxSize = Math.min(Math.max(1, maxSize), 512);
        this.initializeUI();
    }

    initializeUI() {
        const container = document.createElement("div");
        this.addToDom(container);
        container.id = "history-panel";
        container.className =
            "history-panel d-flex flex-column gap-2 p-3 bg-info-subtle border rounded border-4";

        // Add history size control
        const sizeControl = document.createElement("div");
        sizeControl.className = "d-flex align-items-center gap-2 mb-3";
        sizeControl.innerHTML = `
            <label for="history-size" class="form-label mb-0">History Size:</label>
            <input type="number" class="form-control" id="history-size" 
                   min="1" max="512" value="${this.maxSize}">
        `;
        container.appendChild(sizeControl);

        // Add slot machine display
        const slotDisplay = document.createElement("div");
        slotDisplay.className = "slot-display d-flex flex-column gap-2";
        container.appendChild(slotDisplay);

        // Navigation controls
        const controls = document.createElement("div");
        controls.className = "d-flex justify-content-center gap-2 mt-3";
        controls.innerHTML = `
            <button class="btn btn-outline-primary" id="history-prev">↑</button>
            <button class="btn btn-outline-success" id="history-restore">Restore</button>
            <button class="btn btn-outline-primary" id="history-next">↓</button>
        `;
        container.appendChild(controls);

        // Event listeners
        document.getElementById("history-size").addEventListener(
            "change",
            (e) => {
                this.maxSize = Math.min(
                    Math.max(1, parseInt(e.target.value)),
                    512,
                );
                while (this.states.length > this.maxSize) {
                    this.states.shift();
                    this.currentIndex--;
                }
            },
        );

        document.getElementById("history-prev").addEventListener(
            "click",
            () => this.navigateHistory(-1),
        );
        document.getElementById("history-next").addEventListener(
            "click",
            () => this.navigateHistory(1),
        );
        document.getElementById("history-restore").addEventListener(
            "click",
            () => this.restoreState(),
        );
    }

    addState(cells, liveCount) {
        const previousCount = this.states.length > 0
            ? this.states[this.states.length - 1].liveCount
            : 0;
        const state = {
            cells: this.serializeCells(cells),
            liveCount,
            difference: liveCount - previousCount,
            generation: this.states.length + 1,
            timestamp: Date.now(),
        };

        if (this.states.length >= this.maxSize) {
            this.states.shift();
        }
        this.states.push(state);
        this.currentIndex = this.states.length - 1;
        this.updateDisplay();
    }

    serializeCells(cells) {
        const serialized = [];
        for (const row in cells) {
            for (const col in cells[row]) {
                if (cells[row][col].living) {
                    serialized.push([parseInt(row), parseInt(col)]);
                }
            }
        }
        return serialized;
    }

    navigateHistory(direction) {
        const newIndex = this.currentIndex + direction;
        if (newIndex >= 0 && newIndex < this.states.length) {
            this.currentIndex = newIndex;
            this.updateDisplay();
        }
    }

    restoreState() {
        if (this.currentIndex >= 0 && this.currentIndex < this.states.length) {
            const state = this.states[this.currentIndex];
            this.dispatchEvent(
                new CustomEvent("stateRestore", { detail: state }),
            );
        }
    }

    updateDisplay() {
        const slotDisplay = this.domElement.querySelector(".slot-display");
        slotDisplay.innerHTML = "";

        // Calculate visible range
        const start = Math.max(
            0,
            Math.min(this.currentIndex - 3, this.states.length - 7),
        );
        const end = Math.min(start + 7, this.states.length);

        for (let i = start; i < end; i++) {
            const state = this.states[i];
            const isCurrent = i === this.currentIndex;
            const distance = Math.abs(i - this.currentIndex);
            const scale = Math.max(0.7, 1 - (distance * 0.1));
            const opacity = Math.max(0.5, 1 - (distance * 0.15));

            const entry = document.createElement("div");
            entry.className =
                "history-entry d-flex align-items-center gap-2 p-2 border rounded";
            entry.style.transform = `scale(${scale})`;
            entry.style.opacity = opacity;
            if (isCurrent) entry.classList.add("current");

            const diffColor = state.difference > 0
                ? "text-success"
                : state.difference < 0
                ? "text-danger"
                : "";
            const diffSign = state.difference > 0 ? "+" : "";

            entry.innerHTML = `
                <span class="generation">#${state.generation}</span>
                <div class="density-bar flex-grow-1">
                    ${"■".repeat(Math.min(10, Math.ceil(state.liveCount / 20)))}
                </div>
                <span class="count">${state.liveCount}</span>
                <span class="difference ${diffColor}">(${diffSign}${state.difference})</span>
            `;

            entry.addEventListener("click", () => {
                this.currentIndex = i;
                this.updateDisplay();
            });

            slotDisplay.appendChild(entry);
        }
    }
}
