"use strict";

import { Component } from "./component.js";

export class GameHistory extends Component {
    maxSize;
    states = [];
    currentIndex = -1;
    currentGeneration = 0;

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

        // Add chart canvas
        const chartContainer = document.createElement("div");
        chartContainer.className = "chart-container mb-3";
        chartContainer.innerHTML = '<canvas id="populationChart"></canvas>';
        container.appendChild(chartContainer);

        // Initialize chart
        const ctx = document.getElementById("populationChart").getContext("2d");
        this.chart = new Chart(ctx, {
            type: "line",
            data: {
                labels: [],
                datasets: [{
                    label: "Population",
                    data: [],
                    borderColor: "rgb(75, 192, 192)",
                    tension: 0.1,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                    },
                },
            },
        });

        // Add history size control
        const sizeControl = document.createElement("div");
        sizeControl.className = "d-flex align-items-center gap-2 mb-3";
        sizeControl.innerHTML = `
            <label for="history-size" class="form-label mb-0">History Size:</label>
            <input type="number" class="form-control" id="history-size" 
                   min="1" max="512" value="${this.maxSize}">
        `;
        container.appendChild(sizeControl);

        // Add scrollable slot machine display
        const slotDisplay = document.createElement("div");
        slotDisplay.className = "slot-display d-flex flex-column gap-2";
        slotDisplay.style.maxHeight = "300px";
        slotDisplay.style.overflowY = "auto";
        container.appendChild(slotDisplay);

        // Add scroll event listener for slot machine effect
        slotDisplay.addEventListener("scroll", () => {
            this.updateSlotMachineEffect(slotDisplay);
        });

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

    updateSlotMachineEffect(slotDisplay) {
        const entries = slotDisplay.querySelectorAll(".history-entry");
        const slotDisplayRect = slotDisplay.getBoundingClientRect();
        const centerY = slotDisplayRect.top + slotDisplayRect.height / 2;

        entries.forEach((entry) => {
            const rect = entry.getBoundingClientRect();
            const entryCenter = rect.top + rect.height / 2;
            const distance = Math.abs(centerY - entryCenter) /
                (rect.height * 2);

            const scale = Math.max(0.7, 1 - (distance * 0.3));
            const opacity = Math.max(0.5, 1 - (distance * 0.5));

            entry.style.transform = `scale(${scale})`;
            entry.style.opacity = opacity;
        });
    }

    addState(cells, liveCount) {
        const previousCount = this.states.length > 0
            ? this.states[this.states.length - 1].liveCount
            : 0;

        this.currentGeneration++;
        const state = {
            cells: this.serializeCells(cells),
            liveCount,
            difference: liveCount - previousCount,
            generation: this.currentGeneration,
            timestamp: Date.now(),
        };

        if (this.states.length >= this.maxSize) {
            this.states.shift();
            if (this.currentIndex > -1) {
                this.currentIndex--;
            }
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
            // Create and dispatch a custom event on the document
            document.dispatchEvent(
                new CustomEvent("gameStateRestore", { detail: state }),
            );
        }
    }

    reset() {
        this.states = [];
        this.currentIndex = -1;
        this.currentGeneration = 0;
        this.updateDisplay();
    }

    updateDisplay() {
        const slotDisplay = this.domElement.querySelector(".slot-display");
        slotDisplay.innerHTML = "";

        // Update chart data
        this.chart.data.labels = this.states.map((state) =>
            `#${state.generation}`
        );
        this.chart.data.datasets[0].data = this.states.map((state) =>
            state.liveCount
        );
        this.chart.update();

        // Display all states in scrollable view
        for (let i = 0; i < this.states.length; i++) {
            const state = this.states[i];
            const isCurrent = i === this.currentIndex;

            const entry = document.createElement("div");
            entry.className =
                "history-entry d-flex align-items-center gap-2 p-2 border rounded";
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
                this.restoreState();
            });

            slotDisplay.appendChild(entry);
        }

        // Update slot machine effect for initial display
        this.updateSlotMachineEffect(slotDisplay);
    }
}
