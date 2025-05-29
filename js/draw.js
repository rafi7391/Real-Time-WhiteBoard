// Drawing functionality
let isDrawing = false;
let startX, startY;
let currentShape = "rectangle";
let textInput = null;
let boardHistory = [];
let historyIndex = -1;
let MAX_HISTORY = 50;

// Initialize drawing functionality
function initDrawing() {
    const board = document.querySelector(".board");
    
    // Add canvas container
    const canvasContainer = document.createElement("div");
    canvasContainer.className = "canvas-container";
    board.parentNode.insertBefore(canvasContainer, board);
    canvasContainer.appendChild(board);
    
    // Create text input container
    const textInputContainer = document.createElement("div");
    textInputContainer.className = "text-input-container";
    textInputContainer.innerHTML = `<textarea class="text-input"></textarea>`;
    document.body.appendChild(textInputContainer);
    
    // Save initial canvas state
    saveCanvasState();
    
    // Set up event listeners
    board.addEventListener("mousedown", startDrawing);
    board.addEventListener("mousemove", draw);
    board.addEventListener("mouseup", stopDrawing);
    board.addEventListener("mouseout", stopDrawing);
    
    // Touch events for mobile
    board.addEventListener("touchstart", handleTouchStart);
    board.addEventListener("touchmove", handleTouchMove);
    board.addEventListener("touchend", handleTouchEnd);
    
    // Undo/Redo buttons
    document.getElementById("undo").addEventListener("click", undo);
    document.getElementById("redo").addEventListener("click", redo);
    
    // Zoom buttons
    document.getElementById("zoom-in").addEventListener("click", zoomIn);
    document.getElementById("zoom-out").addEventListener("click", zoomOut);
}

// Start drawing
function startDrawing(e) {
    isDrawing = true;
    const rect = board.getBoundingClientRect();
    startX = (e.clientX - rect.left) / zoomLevel;
    startY = (e.clientY - rect.top) / zoomLevel;
    
    // Handle different tools
    if (currentTool === "pencil" || currentTool === "eraser") {
        const context = board.getContext("2d");
        context.beginPath();
        context.moveTo(startX, startY);
        
        if (currentTool === "eraser") {
            context.globalCompositeOperation = "destination-out";
            context.lineWidth = widthMap[currentWidth] * 3; // Bigger eraser
        } else {
            context.globalCompositeOperation = "source-over";
            context.lineWidth = widthMap[currentWidth];
        }
    } else if (currentTool === "text") {
        const textInputContainer = document.querySelector(".text-input-container");
        textInputContainer.style.left = e.clientX + "px";
        textInputContainer.style.top = e.clientY + "px";
        textInputContainer.style.display = "block";
        
        const textInput = document.querySelector(".text-input");
        textInput.focus();
        textInput.addEventListener("blur", addTextToCanvas);
    }
}

// Draw on canvas
function draw(e) {
    if (!isDrawing) return;
    
    const rect = board.getBoundingClientRect();
    const x = (e.clientX - rect.left) / zoomLevel;
    const y = (e.clientY - rect.top) / zoomLevel;
    
    const context = board.getContext("2d");
    
    if (currentTool === "pencil" || currentTool === "eraser") {
        context.lineTo(x, y);
        context.stroke();
    } else if (currentTool === "shape") {
        // Clear and redraw canvas to show shape preview
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = board.width;
        tempCanvas.height = board.height;
        const tempContext = tempCanvas.getContext("2d");
        tempContext.drawImage(board, 0, 0);
        
        context.clearRect(0, 0, board.width, board.height);
        context.drawImage(tempCanvas, 0, 0);
        
        // Draw shape preview
        drawShape(context, startX, startY, x, y, currentShape);
    }
}

// Stop drawing
function stopDrawing(e) {
    if (!isDrawing) return;
    
    if (currentTool === "pencil" || currentTool === "eraser") {
        board.getContext("2d").closePath();
        board.getContext("2d").globalCompositeOperation = "source-over"; // Reset composite operation
    } else if (currentTool === "shape") {
        const rect = board.getBoundingClientRect();
        const x = (e.clientX - rect.left) / zoomLevel;
        const y = (e.clientY - rect.top) / zoomLevel;
        
        const context = board.getContext("2d");
        drawShape(context, startX, startY, x, y, currentShape);
    }
    
    isDrawing = false;
    saveCanvasState();
}

// Draw shape
function drawShape(context, startX, startY, endX, endY, shape) {
    context.beginPath();
    
    switch (shape) {
        case "rectangle":
            context.rect(startX, startY, endX - startX, endY - startY);
            break;
        case "circle":
            const radius = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            context.arc(startX, startY, radius, 0, 2 * Math.PI);
            break;
        case "triangle":
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            context.lineTo(startX - (endX - startX), endY);
            context.closePath();
            break;
        case "line":
            context.moveTo(startX, startY);
            context.lineTo(endX, endY);
            break;
    }
    
    context.stroke();
}

// Add text to canvas
function addTextToCanvas(e) {
    const textInput = document.querySelector(".text-input");
    const text = textInput.value.trim();
    
    if (text) {
        const context = board.getContext("2d");
        context.font = "16px Arial";
        context.fillStyle = colorMap[currentColor];
        
        const textInputContainer = document.querySelector(".text-input-container");
        const rect = board.getBoundingClientRect();
        const x = (parseInt(textInputContainer.style.left) - rect.left) / zoomLevel;
        const y = (parseInt(textInputContainer.style.top) - rect.top) / zoomLevel + 16; // Add font size to y position
        
        context.fillText(text, x, y);
        saveCanvasState();
    }
    
    // Reset text input
    textInput.value = "";
    document.querySelector(".text-input-container").style.display = "none";
}

// Handle touch events
function handleTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousedown", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        board.dispatchEvent(mouseEvent);
    }
}

function handleTouchMove(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent("mousemove", {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        board.dispatchEvent(mouseEvent);
    }
}

function handleTouchEnd(e) {
    e.preventDefault();
    const mouseEvent = new MouseEvent("mouseup", {});
    board.dispatchEvent(mouseEvent);
}

// Save canvas state for undo/redo
function saveCanvasState() {
    // Remove any redo states
    if (historyIndex < boardHistory.length - 1) {
        boardHistory = boardHistory.slice(0, historyIndex + 1);
    }
    
    // Create a copy of the current canvas
    const canvasCopy = document.createElement("canvas");
    canvasCopy.width = board.width;
    canvasCopy.height = board.height;
    canvasCopy.getContext("2d").drawImage(board, 0, 0);
    
    // Add to history
    boardHistory.push(canvasCopy);
    historyIndex++;
    
    // Limit history size
    if (boardHistory.length > MAX_HISTORY) {
        boardHistory.shift();
        historyIndex--;
    }
    
    // Update undo/redo buttons
    updateUndoRedoButtons();
}

// Update undo/redo buttons
function updateUndoRedoButtons() {
    const undoBtn = document.getElementById("undo");
    const redoBtn = document.getElementById("redo");
    
    if (historyIndex <= 0) {
        undoBtn.classList.add("disabled");
    } else {
        undoBtn.classList.remove("disabled");
    }
    
    if (historyIndex >= boardHistory.length - 1) {
        redoBtn.classList.add("disabled");
    } else {
        redoBtn.classList.remove("disabled");
    }
}

// Undo
function undo() {
    if (historyIndex > 0) {
        historyIndex--;
        restoreCanvasState();
    }
}

// Redo
function redo() {
    if (historyIndex < boardHistory.length - 1) {
        historyIndex++;
        restoreCanvasState();
    }
}

// Restore canvas state
function restoreCanvasState() {
    const context = board.getContext("2d");
    context.clearRect(0, 0, board.width, board.height);
    context.drawImage(boardHistory[historyIndex], 0, 0);
    
    // Update undo/redo buttons
    updateUndoRedoButtons();
}

// Zoom in
function zoomIn() {
    zoomLevel = Math.min(zoomLevel + 0.1, 3);
    applyZoom();
}

// Zoom out
function zoomOut() {
    zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
    applyZoom();
}

// Apply zoom
function applyZoom() {
    board.style.transform = `scale(${zoomLevel})`;
    board.style.transformOrigin = "0 0";
    
    // Update mini-map
    updateMiniMap();
}

// Initialize on load
window.addEventListener("load", initDrawing);