// Shapes Drawing Functionality
let shapesStartX, shapesStartY;
let shapesEndX, shapesEndY;
let isDrawingShape = false;
let shapePreviewCanvas = null;

// Initialize shapes functionality
function initShapes() {
    // Set up shape tools
    const shapeOptions = document.querySelectorAll(".shape-option");
    shapeOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove active class from all shape options
            shapeOptions.forEach(o => o.classList.remove("active"));
            
            // Add active class to selected shape option
            option.classList.add("active");
            
            // Set current tool to shape and shape type
            currentTool = "shape";
            currentShape = option.dataset.shape;
            
            // Update cursor
            updateCursor();
        });
    });
    
    // Create shape preview canvas
    createShapePreviewCanvas();
    
    // Set up event listeners
    const board = document.querySelector(".board");
    board.addEventListener("mousedown", startShapeDrawing);
    board.addEventListener("mousemove", drawShapePreview);
    board.addEventListener("mouseup", finishShapeDrawing);
    
    // Touch events for mobile
    board.addEventListener("touchstart", handleShapeTouchStart);
    board.addEventListener("touchmove", handleShapeTouchMove);
    board.addEventListener("touchend", handleShapeTouchEnd);
}

// Create shape preview canvas
function createShapePreviewCanvas() {
    shapePreviewCanvas = document.createElement("canvas");
    shapePreviewCanvas.className = "shape-preview-canvas";
    shapePreviewCanvas.style.position = "absolute";
    shapePreviewCanvas.style.top = "0";
    shapePreviewCanvas.style.left = "0";
    shapePreviewCanvas.style.pointerEvents = "none";
    shapePreviewCanvas.style.zIndex = "20";
    document.querySelector(".canvas-container").appendChild(shapePreviewCanvas);
    
    // Set canvas size
    resizeShapePreviewCanvas();
    
    // Handle window resize
    window.addEventListener("resize", resizeShapePreviewCanvas);
}

// Resize shape preview canvas
function resizeShapePreviewCanvas() {
    if (!shapePreviewCanvas) return;
    
    shapePreviewCanvas.width = window.innerWidth;
    shapePreviewCanvas.height = window.innerHeight;
}

// Start shape drawing
function startShapeDrawing(e) {
    if (currentTool !== "shape") return;
    
    isDrawingShape = true;
    
    const rect = board.getBoundingClientRect();
    shapesStartX = (e.clientX - rect.left) / zoomLevel;
    shapesStartY = (e.clientY - rect.top) / zoomLevel;
    
    // Clear preview canvas
    const context = shapePreviewCanvas.getContext("2d");
    context.clearRect(0, 0, shapePreviewCanvas.width, shapePreviewCanvas.height);
}

// Draw shape preview
function drawShapePreview(e) {
    if (!isDrawingShape || currentTool !== "shape") return;
    
    const rect = board.getBoundingClientRect();
    shapesEndX = (e.clientX - rect.left) / zoomLevel;
    shapesEndY = (e.clientY - rect.top) / zoomLevel;
    
    // Clear preview canvas
    const context = shapePreviewCanvas.getContext("2d");
    context.clearRect(0, 0, shapePreviewCanvas.width, shapePreviewCanvas.height);
    
    // Set context properties
    context.strokeStyle = colorMap[currentColor];
    context.lineWidth = widthMap[currentWidth];
    context.lineCap = "round";
    context.lineJoin = "round";
    
    // Draw shape preview
    drawShapeOnContext(context, shapesStartX, shapesStartY, shapesEndX, shapesEndY, currentShape);
}

// Finish shape drawing
function finishShapeDrawing(e) {
    if (!isDrawingShape || currentTool !== "shape") return;
    
    const rect = board.getBoundingClientRect();
    shapesEndX = (e.clientX - rect.left) / zoomLevel;
    shapesEndY = (e.clientY - rect.top) / zoomLevel;
    
    // Clear preview canvas
    const previewContext = shapePreviewCanvas.getContext("2d");
    previewContext.clearRect(0, 0, shapePreviewCanvas.width, shapePreviewCanvas.height);
    
    // Draw final shape on main canvas
    const context = board.getContext("2d");
    context.strokeStyle = colorMap[currentColor];
    context.lineWidth = widthMap[currentWidth];
    
    drawShapeOnContext(context, shapesStartX, shapesStartY, shapesEndX, shapesEndY, currentShape);
    
    isDrawingShape = false;
    
    // Save to history
    saveCanvasState();
}

// Draw shape on context
function drawShapeOnContext(context, startX, startY, endX, endY, shape) {
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

// Handle touch events for shapes
function handleShapeTouchStart(e) {
    if (currentTool !== "shape") return;
    
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

function handleShapeTouchMove(e) {
    if (currentTool !== "shape") return;
    
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

function handleShapeTouchEnd(e) {
    if (currentTool !== "shape") return;
    
    e.preventDefault();
    const mouseEvent = new MouseEvent("mouseup", {});
    board.dispatchEvent(mouseEvent);
}

// Initialize on load
window.addEventListener("load", initShapes);