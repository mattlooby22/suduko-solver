# Sudoku Solver

An interactive Sudoku puzzle solver built with React that allows you to solve puzzles manually or watch the backtracking algorithm solve them automatically.

![Sudoku Solver Screenshot](https://via.placeholder.com/800x450.png?text=Sudoku+Solver+Screenshot)

## Features

- Interactive 9x9 Sudoku grid with checkerboard-style 3x3 sections
- Keyboard navigation using arrow keys
- Two solving modes:
  - **Solve**: Instantly completes the puzzle
  - **Solve Slowly**: Visually demonstrates the backtracking algorithm step-by-step
- Stop button to interrupt the solving animation at any point
- Visual feedback during slow solving:
  - Green flashing for successful number placements
  - Red flashing when backtracking
- Clear button to reset the board
- Input validation ensures only valid numbers are entered
- **User-entered cell preservation**:
  - User-entered values are visually distinguished with bold, black text
  - Solver preserves user-entered values, never modifying them during backtracking
  - Ensures the original puzzle integrity is maintained
- **Configuration management**:
  - Save up to 5 board configurations with timestamps
  - Load saved configurations with confirmation dialog
  - Delete saved configurations when no longer needed
  - Configurations persisted in local storage

## Installation

To install and set up the project locally:

```bash
# Clone the repository
git clone https://github.com/mattlooby22/sudoku-solver.git

# Navigate to the project directory
cd sudoku-solver

# Install dependencies
npm install
```

## Running the Application

To run the application in development mode:

```bash
npm start
```

This will start the development server. Open [http://localhost:3000](http://localhost:3000) in your browser to use the application.

## How to Use

1. **Manual Solving**:
   - Click on a cell and type a number from 1-9
   - Navigate between cells using arrow keys
   - The selected cell is highlighted with a blue outline

2. **Automatic Solving**:
   - Click "Solve" to instantly fill in the solution
   - Click "Solve Slowly" to watch the algorithm solve step-by-step
   - The slow solver shows green flashes for placed numbers and red flashes for backtracking
   - Click "Stop Solving" to interrupt the slow solving process at any point
   - User-entered values (original puzzle numbers) are preserved during solving

3. **Managing Board Configurations**:
   - Click "Save Configuration" to save the current board state
   - View saved configurations in the sidebar
   - Click "Load" to restore a saved configuration (with confirmation)
   - Click "Delete" to remove a saved configuration

4. **Reset the Board**:
   - Click "Clear" to reset the entire board and remove all values

## How It Works

The Sudoku solver uses a backtracking algorithm to find solutions:

1. Start with an empty or partially filled grid
2. Find an empty cell (skipping any user-entered cells)
3. Try placing digits 1-9, checking validity for each number
4. If a digit is valid, recursively attempt to fill the grid using steps 2-4
5. If no digit works, backtrack to the previous cell and try a different digit

The "Solve Slowly" option visualizes this process, showing each step of the algorithm including backtracking steps when a particular path doesn't lead to a solution. During solving:

- User-entered cells are treated as fixed constraints and never modified
- Green flashing indicates a successful number placement
- Red flashing indicates backtracking when a dead-end is reached
- The algorithm automatically respects the rules of Sudoku (no repeats in rows, columns, or 3x3 boxes)

## Technologies Used

- React
- JavaScript
- CSS Grid for layout
- React Hooks (useState, useEffect, useRef)

## Building for Production

To build the app for production:

```bash
npm run build
```

This creates an optimized production build in the `build` folder that can be deployed to a web server.
