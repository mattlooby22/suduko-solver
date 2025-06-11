import React, { useState, useRef, useEffect } from 'react';
import './App.css';

const initialBoard = Array(9).fill(null).map(() => Array(9).fill(''));

const isValid = (board, row, col, num) => {
  for (let x = 0; x < 9; x++) {
    if (board[row][x] === num || board[x][col] === num) return false;
  }

  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;

  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      if (board[startRow + i][startCol + j] === num) return false;

  return true;
};

// No global solver functions needed - implementations are within the component

function App() {
  const [board, setBoard] = useState(initialBoard);
  const [selectedCell, setSelectedCell] = useState({ row: 0, col: 0 });
  const [flashingCells, setFlashingCells] = useState({});
  const inputRefs = useRef(Array(9).fill().map(() => Array(9).fill().map(() => React.createRef())));

  // Focus the selected cell
  useEffect(() => {
    if (inputRefs.current[selectedCell.row] && inputRefs.current[selectedCell.row][selectedCell.col]) {
      inputRefs.current[selectedCell.row][selectedCell.col].current.focus();
    }
  }, [selectedCell]);

  const handleKeyDown = (e, row, col) => {
    let newRow = row;
    let newCol = col;

    // Handle arrow key navigation
    switch (e.key) {
      case 'ArrowUp':
        newRow = Math.max(0, row - 1);
        break;
      case 'ArrowDown':
        newRow = Math.min(8, row + 1);
        break;
      case 'ArrowLeft':
        newCol = Math.max(0, col - 1);
        break;
      case 'ArrowRight':
        newCol = Math.min(8, col + 1);
        break;
      default:
        // For other keys, let the default behavior happen
        return;
    }

    // Prevent default behavior for arrow keys to avoid scrolling
    e.preventDefault();
    
    // Update the selected cell
    setSelectedCell({ row: newRow, col: newCol });
  };

  const handleChange = (row, col, value) => {
    const newBoard = board.map(r => [...r]);
    if (value === '' || /^[1-9]$/.test(value)) {
      newBoard[row][col] = value;
      setBoard(newBoard);
      
      // Optionally: move to the next cell after input
      if (value !== '' && col < 8) {
        setSelectedCell({ row, col: col + 1 });
      }
    }
  };

  const handleCellClick = (row, col) => {
    setSelectedCell({ row, col });
  };

  const [isSolving, setIsSolving] = useState(false);
  
  // Quick solve method that immediately shows the solution
  const handleSolve = () => {
    // Don't start another solving process if one is already running
    if (isSolving) return;
    
    setIsSolving(true);
    const newBoard = board.map(r => [...r]);
    
    // Simple solver without animation
    const simpleSolve = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === '') {
            for (let num = 1; num <= 9; num++) {
              const val = num.toString();
              if (isValid(board, row, col, val)) {
                board[row][col] = val;
                if (simpleSolve(board)) return true;
                board[row][col] = '';
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    if (simpleSolve(newBoard)) {
      setBoard(newBoard);
      setIsSolving(false);
    } else {
      alert('No solution found!');
      setIsSolving(false);
    }
  };
  
  // Animated solve method that shows the solution step by step
  const handleSolveSlowly = () => {
    // Don't start another solving process if one is already running
    if (isSolving) return;
    
    setIsSolving(true);
    const newBoard = board.map(r => [...r]);
    const solutionSteps = [];
    
    // Modified solver to capture steps
    const solveWithSteps = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          if (board[row][col] === '') {
            for (let num = 1; num <= 9; num++) {
              const val = num.toString();
              if (isValid(board, row, col, val)) {
                board[row][col] = val;
                // Save this step
                solutionSteps.push({
                  row,
                  col,
                  value: val
                });
                if (solveWithSteps(board)) return true;
                // If we backtrack, add a step to clear the cell
                solutionSteps.push({
                  row,
                  col,
                  value: ''
                });
                board[row][col] = '';
              }
            }
            return false;
          }
        }
      }
      return true;
    };

    if (solveWithSteps(newBoard)) {
      // Animate the solution steps - using all steps including backtracking
      const animateSteps = (steps, index = 0) => {
        if (index >= steps.length) {
          // Clear all flash classes when done
          setFlashingCells({});
          setIsSolving(false);
          return;
        }
        
        const step = steps[index];
        const cellKey = `${step.row}-${step.col}`;
        
        // Update the board
        setBoard(prev => {
          const newBoard = prev.map(r => [...r]);
          newBoard[step.row][step.col] = step.value;
          return newBoard;
        });
        
        // Add flash class based on whether we're setting or backtracking
        setFlashingCells({
          [cellKey]: step.value ? 'flash-green' : 'flash-red'
        });
        
        // Clear the flash class and move to next step after a delay
        setTimeout(() => {
          setFlashingCells({});
          animateSteps(steps, index + 1);
        }, 125); // Combined flash duration and delay between steps
      };
      
      // Start the animation with all steps (including backtracking)
      animateSteps(solutionSteps);
      
    } else {
      alert('No solution found!');
      setIsSolving(false);
    }
  };

  const handleClear = () => {
    setBoard(initialBoard);
  };

  return (
    <div className="App">
      <h1>Sudoku Solver</h1>
      <div className="board">
        {board.map((row, rIdx) =>
          row.map((cell, cIdx) => (
            <input
              key={`${rIdx}-${cIdx}`}
              ref={inputRefs.current[rIdx][cIdx]}
              type="text"
              maxLength="1"
              value={cell}
              onChange={(e) => handleChange(rIdx, cIdx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(e, rIdx, cIdx)}
              onClick={() => handleCellClick(rIdx, cIdx)}
              className={`cell 
                ${selectedCell.row === rIdx && selectedCell.col === cIdx ? 'selected' : ''}
                ${flashingCells[`${rIdx}-${cIdx}`] || ''}
              `}
            />
          ))
        )}
      </div>
      <div className="buttons">
        <button onClick={handleSolve} disabled={isSolving}>
          {isSolving ? 'Solving...' : 'Solve'}
        </button>
        <button onClick={handleSolveSlowly} disabled={isSolving}>
          {isSolving ? 'Solving...' : 'Solve Slowly'}
        </button>
        <button onClick={handleClear} disabled={isSolving}>Clear</button>
      </div>
    </div>
  );
}

export default App;