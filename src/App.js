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
  const [userEnteredCells, setUserEnteredCells] = useState({}); // Track user-entered cells
  const [savedConfigs, setSavedConfigs] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [configToLoad, setConfigToLoad] = useState(null);
  const inputRefs = useRef(Array(9).fill().map(() => Array(9).fill().map(() => React.createRef())));

  // Load saved configurations from localStorage on initial render
  useEffect(() => {
    const savedConfigsFromStorage = localStorage.getItem('sudokuConfigs');
    if (savedConfigsFromStorage) {
      setSavedConfigs(JSON.parse(savedConfigsFromStorage));
    }
  }, []);

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
      
      // Track user-entered cells (or remove tracking if cell is cleared)
      setUserEnteredCells(prev => {
        const key = `${row}-${col}`;
        const newUserEnteredCells = { ...prev };
        
        if (value === '') {
          // If cell is cleared, remove from user-entered cells
          delete newUserEnteredCells[key];
        } else {
          // Mark cell as user-entered
          newUserEnteredCells[key] = true;
        }
        
        return newUserEnteredCells;
      });
      
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
  const [solveMethod, setSolveMethod] = useState(null); // 'slow' or 'fast' or null
  const solveTimeoutRef = useRef(null); // To track timeouts for cancellation
  const [solveTime, setSolveTime] = useState({ startTime: null, endTime: null }); // Track solving duration
  const [elapsedTime, setElapsedTime] = useState(null); // Display time during solving
  const timerIntervalRef = useRef(null); // For tracking the timer interval
  
  // Function to stop the solving process
  // State to track if solving was manually stopped
  const [solvingStopped, setSolvingStopped] = useState(false);
  
  // Format milliseconds to "0.00s" format
  const formatTime = (ms) => {
    return `${(ms / 1000).toFixed(2)}s`;
  };
  
  const handleStop = () => {
    // Clear any pending timeouts
    if (solveTimeoutRef.current) {
      clearTimeout(solveTimeoutRef.current);
      solveTimeoutRef.current = null;
    }
    
    // Stop the timer
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset the solving state and set stopped flag
    setIsSolving(false);
    setSolveMethod(null);
    setSolvingStopped(true);
    setElapsedTime(null);
    
    // Clear the stopped flag after 3 seconds
    setTimeout(() => {
      setSolvingStopped(false);
    }, 3000);
  };

  // Quick solve method that immediately shows the solution
  const handleSolve = () => {
    // Don't start another solving process if one is already running
    if (isSolving && solveMethod !== 'slow') return;
    
    // If we're currently solving slowly, stop that process first
    if (isSolving && solveMethod === 'slow') {
      handleStop();
    }
    
    setIsSolving(true);
    setSolveMethod('fast');
    
    // Start the timer
    const startTime = Date.now();
    setSolveTime({ startTime, endTime: null });
    setElapsedTime('0.00s');
    
    const newBoard = board.map(r => [...r]);
    
    // Simple solver without animation
    const simpleSolve = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          // Skip cells that were entered by the user
          const cellKey = `${row}-${col}`;
          if (board[row][col] === '' && !userEnteredCells[cellKey]) {
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
      const endTime = Date.now();
      setBoard(newBoard);
      setIsSolving(false);
      setSolveTime(prev => ({ ...prev, endTime }));
      setElapsedTime(formatTime(endTime - startTime));
      
      // Flash the solve time for 3 seconds
      setTimeout(() => {
        setElapsedTime(null);
      }, 3000);
    } else {
      alert('No solution found!');
      setIsSolving(false);
      setElapsedTime(null);
    }
  };
  
  // Animated solve method that shows the solution step by step
  const handleSolveSlowly = () => {
    // Don't start another solving process if one is already running
    if (isSolving) return;
    
    setIsSolving(true);
    setSolveMethod('slow');
    
    // Start the timer
    const startTime = Date.now();
    setSolveTime({ startTime, endTime: null });
    setElapsedTime('0.00s');
    
    // Set up interval to update elapsed time every 100ms
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setElapsedTime(formatTime(elapsed));
    }, 100);
    
    const newBoard = board.map(r => [...r]);
    const solutionSteps = [];
    
    // Modified solver to capture steps
    const solveWithSteps = (board) => {
      for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
          // Skip cells that were entered by the user
          const cellKey = `${row}-${col}`;
          if (board[row][col] === '' && !userEnteredCells[cellKey]) {
            for (let num = 1; num <= 9; num++) {
              const val = num.toString();
              if (isValid(board, row, col, val)) {
                board[row][col] = val;
                // Save this step
                solutionSteps.push({
                  row,
                  col,
                  value: val,
                  isUserEntered: false
                });
                if (solveWithSteps(board)) return true;
                // If we backtrack, add a step to clear the cell (only for non-user cells)
                solutionSteps.push({
                  row,
                  col,
                  value: '',
                  isUserEntered: false
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
          setSolveMethod(null);
          
          // Stop the timer and record end time
          const endTime = Date.now();
          setSolveTime(prev => ({ ...prev, endTime }));
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          
          // Keep showing the final time for 3 seconds
          setTimeout(() => {
            setElapsedTime(null);
          }, 3000);
          
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
        solveTimeoutRef.current = setTimeout(() => {
          setFlashingCells({});
          animateSteps(steps, index + 1);
        }, 75); // Combined flash duration and delay between steps
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
    setConfigToLoad(null);
    setFlashingCells({});  // Clear any flashing cells (red/green)
    setUserEnteredCells({}); // Reset user-entered cells tracking
    setElapsedTime(null); // Clear timer display
    
    // If there's an ongoing solving animation, stop it
    if (solveTimeoutRef.current) {
      clearTimeout(solveTimeoutRef.current);
      solveTimeoutRef.current = null;
    }
    
    // If timer is running, stop it
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    // Reset solving states
    setIsSolving(false);
    setSolveMethod(null);
  };
  
  // Function to save current board configuration
  const handleSaveConfig = () => {
    if (savedConfigs.length >= 5) {
      alert("You've reached the maximum of 5 saved configurations. Please delete one before saving.");
      return;
    }
    
    const newConfig = {
      id: Date.now(),
      name: `Config ${savedConfigs.length + 1}`,
      board: board.map(row => [...row]),
      date: new Date().toLocaleDateString()
    };
    
    const updatedConfigs = [...savedConfigs, newConfig];
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('sudokuConfigs', JSON.stringify(updatedConfigs));
  };
  
  // Function to initiate loading a configuration
  const handleLoadConfig = (config) => {
    setConfigToLoad(config);
    setShowConfirmation(true);
  };
  
  // Function to confirm and complete loading a configuration
  const confirmLoadConfig = () => {
    if (configToLoad) {
      setBoard(configToLoad.board);
      setShowConfirmation(false);
      setConfigToLoad(null);
      
      // When loading a saved config, mark all non-empty cells as user-entered
      const newUserEnteredCells = {};
      configToLoad.board.forEach((row, rowIdx) => {
        row.forEach((cell, colIdx) => {
          if (cell !== '') {
            newUserEnteredCells[`${rowIdx}-${colIdx}`] = true;
          }
        });
      });
      setUserEnteredCells(newUserEnteredCells);
    }
  };
  
  // Function to cancel loading a configuration
  const cancelLoadConfig = () => {
    setShowConfirmation(false);
    setConfigToLoad(null);
  };
  
  // Function to delete a saved configuration
  const handleDeleteConfig = (configId) => {
    const updatedConfigs = savedConfigs.filter(config => config.id !== configId);
    setSavedConfigs(updatedConfigs);
    localStorage.setItem('sudokuConfigs', JSON.stringify(updatedConfigs));
  };

  return (
    <div className="App">
      <h1>Sudoku Solver</h1>
      <div className="game-container">
        <div className="board-section">
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
                    ${userEnteredCells[`${rIdx}-${cIdx}`] ? 'user-entered' : ''}
                  `}
                />
              ))
            )}
          </div>
          <div className="buttons">
            <button onClick={handleSolve} disabled={isSolving}>
              {isSolving && solveMethod === 'fast' ? 'Solving...' : 'Solve'}
            </button>
            <button onClick={handleSolveSlowly} disabled={isSolving}>
              {isSolving && solveMethod === 'slow' ? 'Solving...' : 'Solve Slowly'}
            </button>
            {isSolving && solveMethod === 'slow' && (
              <button className="stop-button" onClick={handleStop}>
                Stop Solving
              </button>
            )}
            <button onClick={handleClear} disabled={isSolving}>Clear</button>
            <button onClick={handleSaveConfig} disabled={isSolving || savedConfigs.length >= 5}>
              Save Configuration
            </button>
            
            {/* Timer Display */}
            {elapsedTime && (
              <div className="timer-display">
                {isSolving ? "Solving time: " : "Solved in: "}{elapsedTime}
              </div>
            )}
            
            {solvingStopped && (
              <div className="status-message">Solving process stopped successfully</div>
            )}
          </div>
        </div>
        
        <div className="saved-configs">
          <h2>Saved Configurations</h2>
          {savedConfigs.length === 0 ? (
            <p>No saved configurations. You can save up to 5.</p>
          ) : (
            <div className="configs-list">
              {savedConfigs.map((config) => (
                <div key={config.id} className="config-item">
                  <div className="config-info">
                    <h3>{config.name}</h3>
                    <p>Saved on: {config.date}</p>
                  </div>
                  <div className="config-preview">
                    {/* Simplified board preview */}
                    <div className="mini-board">
                      {Array(3).fill().map((_, i) => (
                        <div key={i} className="mini-row">
                          {Array(3).fill().map((_, j) => (
                            <div key={j} className="mini-cell"></div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="config-actions">
                    <button onClick={() => handleLoadConfig(config)}>Load</button>
                    <button onClick={() => handleDeleteConfig(config.id)}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* Confirmation Dialog */}
      {showConfirmation && configToLoad && (
        <div className="confirmation-dialog">
          <div className="dialog-content">
            <h3>Load Configuration</h3>
            <p>Are you sure you want to load {configToLoad.name}? This will replace your current board.</p>
            <div className="dialog-buttons">
              <button onClick={confirmLoadConfig}>Yes, Load It</button>
              <button onClick={cancelLoadConfig}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;