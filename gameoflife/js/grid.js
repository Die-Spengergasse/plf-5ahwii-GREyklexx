"use strict";

import { Component } from "./component.js";
import { Cell } from "./cell.js";
import { PATTERNS } from "./patterns.js";
import { GameHistory } from "./history.js";

const SHIFT_FACTOR = 5;
const DEFAULT_HISTORY_SIZE = 100;

export class Grid extends Component {
    columns;
    rows;
    cells;
    elements;
    intervalId;
    offset_x;
    offset_y;

    constructor(parent, anchor, columns, rows) {
        super(parent, anchor);
        this.columns = columns;
        this.rows = rows;
        this.initializeGrid();
        this.offset_x = 0;
        this.offset_y = 0;
        this.cells = {};
        this.elements = new Map();
        this.createCells();
        this.initializeHistory();
    }

    initializeHistory() {
        this.history = new GameHistory(
            null,
            document.body,
            DEFAULT_HISTORY_SIZE,
        );
        this.history.domElement.addEventListener(
            "stateRestore",
            (e) => this.restoreFromHistory(e.detail),
        );
    }

    restoreFromHistory(state) {
        this.pause();
        this.reset();
        state.cells.forEach(([row, col]) => {
            this.getCell(row, col).setLiving(true);
        });
        this.displayLiveCount();
    }

    initializeGrid() {
        const gridElement = document.createElement("div");
        this.addToDom(gridElement);
        this.domElement.style.gridTemplateColumns =
            `repeat(${this.columns}, 1fr)`;
        this.domElement.style.gridTemplateRows = `repeat(${this.rows}, 1fr)`;
        this.domElement.id = "grid";

        "border border-2 p-1 border-dark-subtle mx-auto"
            .split(" ")
            .forEach((cls) => this.domElement.classList.add(cls));
    }

    createCells() {
        for (let row = 0; row < this.rows; row++) {
            for (let column = 0; column < this.columns; column++) {
                const cell = document.createElement("div");
                this.domElement.appendChild(cell);

                cell.addEventListener(
                    "click",
                    () => this.toggleLiving(row, column),
                );

                const idx = `${row}/${column}`;
                cell.id = idx;
                this.elements.set(idx, cell);
            }
        }
    }

    toggleLiving(row, column) {
        this.getCell(row, column).toggleLiving();
        this.displayLiveCount();
    }

    getCell(row, column, obj = this.cells) {
        if (!obj.hasOwnProperty(row)) {
            obj[row] = {};
        }
        if (!obj[row].hasOwnProperty(column)) {
            obj[row][column] = new Cell(row, column, this);
        }
        return obj[row][column];
    }

    *cellIterator() {
        for (let row in this.cells) {
            for (let column in this.cells[row]) {
                yield this.cells[row][column];
            }
        }
    }

    ageOneGeneration() {
        // Calculate all future states
        [...this.cellIterator()].forEach((cell) => cell.calculateLivingThen());
        [...this.cellIterator()].forEach((cell) => {
            cell.livingThen ?? cell.calculateLivingThen();
        });

        // Update to next generation
        [...this.cellIterator()].forEach((cell) =>
            cell.advanceToNextGeneration()
        );

        // Transfer living cells and update
        const futureCells = {};
        [...this.cellIterator()].forEach((cell) => {
            if (cell.living) {
                this.getCell(cell.row, cell.column, futureCells).setLiving();
            }
        });

        // Update state and history
        this.cells = futureCells;
        const liveCount =
            [...this.cellIterator()].filter((cell) => cell.living).length;
        this.history.addState(this.cells, liveCount);
        this.displayLiveCount();
    }

    shift(direction) {
        const offsets = {
            left: { x: -1, y: 0 },
            right: { x: 1, y: 0 },
            up: { x: 0, y: -1 },
            down: { x: 0, y: 1 },
        };

        const offset = offsets[direction];
        if (!offset) {
            console.warn("Grid.shift: unknown direction:", direction);
            return;
        }

        const offsetRow = offset.y * SHIFT_FACTOR;
        const offsetColumn = offset.x * SHIFT_FACTOR;

        this.offset_x += offsetColumn;
        this.offset_y += offsetRow;

        this.updateOffsetDisplay();
        this.shiftCells(offsetRow, offsetColumn);
    }

    updateOffsetDisplay() {
        const offsetXButton = document.querySelector("#offset-x");
        const offsetYButton = document.querySelector("#offset-y");
        offsetXButton.textContent = `_x: ${this.offset_x}`;
        offsetYButton.textContent = `_y: ${this.offset_y}`;
    }

    shiftCells(offsetRow, offsetColumn) {
        const futureCells = {};
        [...this.cellIterator()].forEach((cell) => {
            this.getCell(
                cell.row + offsetRow,
                cell.column + offsetColumn,
                futureCells,
            ).setLiving();
            cell.setLiving(false);
        });

        this.cells = futureCells;
        [...this.cellIterator()].forEach((cell) => cell.updateDisplay());
    }

    displayLiveCount() {
        const liveCount =
            [...this.cellIterator()].filter((cell) => cell.living).length;
        const livecountButton = document.querySelector("#livecount");
        livecountButton.textContent = `#: ${liveCount}`;
    }

    getGoing(intervalDelay = 250) {
        if (this.intervalId !== undefined) {
            console.warn("Grid.getGoing: already running");
            return;
        }
        this.intervalId = setInterval(
            () => this.ageOneGeneration(),
            intervalDelay,
        );
    }

    pause() {
        clearInterval(this.intervalId);
        this.intervalId = undefined;
    }

    reset() {
        this.pause();
        [...this.cellIterator()].forEach((cell) => cell.setLiving(false));
        this.cells = {};
        this.displayLiveCount();
        // Reset history with initial empty state
        this.history.states = [];
        this.history.currentIndex = -1;
        this.history.addState(this.cells, 0);
    }

    setPattern(patternName) {
        const pattern = PATTERNS[patternName];
        if (!pattern) {
            console.warn("Grid.setPattern: unknown pattern:", patternName);
            return;
        }

        pattern.forEach(([row, column]) => {
            this.getCell(row, column).setLiving(true);
        });

        this.displayLiveCount();
    }
}
