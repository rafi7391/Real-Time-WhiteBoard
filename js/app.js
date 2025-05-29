// Main App JavaScript
let currentTool = "pencil";
let currentColor = "black";
let currentWidth = 1;
let isZooming = false;
let zoomLevel = 1;
let isPanning = false;
let lastPanPoint;
let isDarkMode = false;

const colorMap = {
    "black": "#000000",
    "blue": "#3B82F6",
    "red": "#EF4444",
    "green": "#10B981",
    "yellow": "#F59E0B",
    "purple": "#8B5CF6"
};

const widthMap = {
    "1": 1,
    "3": 3,
    "5": 5
};

// Get DOM elements
const board = document.querySelector(".board");
const toolElements = document.querySelectorAll(".tool");
const colorOptions = document.querySelectorAll(".color-option");
const strokeOptions = document.querySelectorAll(".stroke-option");
const downloadBtn = document.getElementById("download-btn");
const hamburgerMenu = document.querySelector(".hamburger-menu");
const headerActions = document.querySelector(".header-actions");
const fileInput = document.getElementById("file-input");

// Initialize canvas
function initCanvas() {
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    const context = board.getContext("2d");
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokeStyle = colorMap[currentColor];
    context.lineWidth = widthMap[currentWidth];
    
    // Create grid overlay
    createGrid();
    
    // Create loading indicator
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className = "loading-indicator";
    loadingIndicator.innerHTML = `
        <div class="spinner"></div>
        <div class="loading-text">Preparing download...</div>
    `;
    document.body.appendChild(loadingIndicator);
    
    // Create mini-map
    createMiniMap();
    
    // Create shape tools
    createShapeTools();
    
    // Create dark mode toggle
    createDarkModeToggle();
    
    // Create keyboard shortcuts panel
    createShortcutsPanel();
    
    // Update color picker with custom color input
    updateColorPicker();
}

// Set up event listeners
function setupEventListeners() {
    // Tool selection
    toolElements.forEach(tool => {
        tool.addEventListener("click", () => {
            // Remove active class from all tools
            toolElements.forEach(t => t.classList.remove("active"));
            
            // Add active class to selected tool
            tool.classList.add("active");
            tool.classList.add("animate");
            
            // Set current tool
            currentTool = tool.id;
            
            // Update cursor
            updateCursor();
            
            // Remove animation class after animation completes
            setTimeout(() => {
                tool.classList.remove("animate");
            }, 300);
        });
    });
    
    // Color selection
    colorOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove active class from all color options
            colorOptions.forEach(o => o.classList.remove("active"));
            
            // Add active class to selected color option
            option.classList.add("active");
            
            // Set current color
            currentColor = option.dataset.color;
            
            // Update stroke style
            const context = board.getContext("2d");
            context.strokeStyle = colorMap[currentColor];
        });
    });
    
    // Stroke width selection
    strokeOptions.forEach(option => {
        option.addEventListener("click", () => {
            // Remove active class from all stroke options
            strokeOptions.forEach(o => o.classList.remove("active"));
            
            // Add active class to selected stroke option
            option.classList.add("active");
            
            // Set current width
            currentWidth = option.dataset.width;
            
            // Update line width
            const context = board.getContext("2d");
            context.lineWidth = widthMap[currentWidth];
        });
    });
    
    // Download button
    downloadBtn.addEventListener("click", downloadBoard);
    
    // Image upload
    document.getElementById("image-upload").addEventListener("click", () => {
        fileInput.click();
    });
    
    fileInput.addEventListener("change", handleImageUpload);
    
    // Hamburger menu
    hamburgerMenu.addEventListener("click", () => {
        hamburgerMenu.classList.toggle("active");
        headerActions.classList.toggle("active");
    });
    
    // Window resize
    window.addEventListener("resize", () => {
        // Preserve the current drawing
        const tempCanvas = document.createElement("canvas");
        const tempContext = tempCanvas.getContext("2d");
        tempCanvas.width = board.width;
        tempCanvas.height = board.height;
        tempContext.drawImage(board, 0, 0);
        
        // Resize the canvas
        board.width = window.innerWidth;
        board.height = window.innerHeight;
        
        // Restore the drawing
        const context = board.getContext("2d");
        context.lineCap = "round";
        context.lineJoin = "round";
        context.strokeStyle = colorMap[currentColor];
        context.lineWidth = widthMap[currentWidth];
        context.drawImage(tempCanvas, 0, 0);
        
        // Update grid and mini-map
        updateGrid();
        updateMiniMap();
    });
    
    // Dark mode toggle
    const themeToggle = document.querySelector(".theme-toggle");
    if (themeToggle) {
        themeToggle.addEventListener("click", toggleDarkMode);
    }
    
    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
    
    // Custom color input
    const customColorInput = document.getElementById("custom-color-input");
    if (customColorInput) {
        customColorInput.addEventListener("input", function() {
            const preview = document.querySelector(".custom-color-preview");
            preview.style.backgroundColor = this.value;
            
            // Update current color
            colorMap.custom = this.value;
            currentColor = "custom";
            
            // Update stroke style
            const context = board.getContext("2d");
            context.strokeStyle = this.value;
            
            // Remove active class from all color options
            colorOptions.forEach(o => o.classList.remove("active"));
        });
    }
    
    // Close keyboard shortcuts panel
    const closePanel = document.querySelector(".close-panel");
    if (closePanel) {
        closePanel.addEventListener("click", () => {
            document.querySelector(".shortcuts-panel").classList.remove("visible");
        });
    }
    
    // Help button
    const helpBtn = document.getElementById("help-btn");
    if (helpBtn) {
        helpBtn.addEventListener("click", () => {
            document.querySelector(".shortcuts-panel").classList.add("visible");
        });
    }
    
    // Shape tool selection
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
        });
    });
}

// Update cursor based on current tool
function updateCursor() {
    if (currentTool === "pencil") {
        board.style.cursor = "url('assets/pencil-cursor.png') 0 24, crosshair";
    } else if (currentTool === "eraser") {
        board.style.cursor = "url('assets/eraser-cursor.png') 8 8, crosshair";
    } else if (currentTool === "text") {
        board.style.cursor = "text";
    } else if (currentTool === "shape") {
        board.style.cursor = "crosshair";
    } else if (currentTool === "pan") {
        board.style.cursor = "grab";
    } else {
        board.style.cursor = "crosshair";
    }
}

// Download the whiteboard
function downloadBoard() {
    const loadingIndicator = document.querySelector(".loading-indicator");
    loadingIndicator.classList.add("visible");
    
    setTimeout(() => {
        // Create a new canvas with white background
        const downloadCanvas = document.createElement("canvas");
        const downloadContext = downloadCanvas.getContext("2d");
        downloadCanvas.width = board.width;
        downloadCanvas.height = board.height;
        
        // Fill with white background
        downloadContext.fillStyle = isDarkMode ? "#1F2937" : "white";
        downloadContext.fillRect(0, 0, downloadCanvas.width, downloadCanvas.height);
        
        // Draw the board content
        downloadContext.drawImage(board, 0, 0);
        
        // Create download link
        const link = document.createElement("a");
        link.download = "whiteboard-" + new Date().toISOString().slice(0, 10) + ".png";
        link.href = downloadCanvas.toDataURL("image/png");
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        loadingIndicator.classList.remove("visible");
    }, 500);
}

// Handle image upload
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        // Create image element
        const img = new Image();
        img.onload = function() {
            // Call the createImageBox function with the loaded image
            createImageBox(img);
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);
    
    // Reset the file input
    fileInput.value = "";
}

// Create image box
function createImageBox(img) {
    const aspectRatio = img.width / img.height;
    let imgWidth = Math.min(400, img.width);
    let imgHeight = imgWidth / aspectRatio;
    
    // Create container
    const imageContainer = document.createElement("div");
    imageContainer.className = "image-container new";
    imageContainer.style.width = imgWidth + "px";
    
    // Position in the center of viewport
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    imageContainer.style.left = (scrollX + window.innerWidth / 2 - imgWidth / 2) + "px";
    imageContainer.style.top = (scrollY + window.innerHeight / 2 - imgHeight / 2) + "px";
    
    // Create header
    const header = document.createElement("div");
    header.className = "image-header";
    header.innerHTML = `
        <h3>Image</h3>
        <button class="image-close">×</button>
    `;
    
    // Create content
    const content = document.createElement("div");
    content.className = "image-content";
    content.innerHTML = `<img src="${img.src}" alt="Uploaded Image">`;
    
    // Create resize handles
    const resizeSE = document.createElement("div");
    resizeSE.className = "resize-handle se";
    
    // Append elements
    imageContainer.appendChild(header);
    imageContainer.appendChild(content);
    imageContainer.appendChild(resizeSE);
    document.body.appendChild(imageContainer);
    
    // Set up event listeners for moving
    header.addEventListener("mousedown", startDragImage);
    
    // Set up event listener for close button
    imageContainer.querySelector(".image-close").addEventListener("click", () => {
        imageContainer.classList.add("minimize");
        setTimeout(() => {
            document.body.removeChild(imageContainer);
        }, 300);
    });
    
    // Set up event listeners for resizing
    resizeSE.addEventListener("mousedown", startResizeImage);
    
    // Emit to socket if needed
    if (typeof socket !== 'undefined') {
        socket.emit("add-image", {
            src: img.src,
            width: imgWidth,
            height: imgHeight,
            x: imageContainer.style.left,
            y: imageContainer.style.top
        });
    }
}

// Start dragging image
function startDragImage(e) {
    e.preventDefault();
    
    const imageContainer = this.parentElement;
    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialLeft = parseFloat(imageContainer.style.left);
    const initialTop = parseFloat(imageContainer.style.top);
    
    function moveImage(e) {
        imageContainer.style.left = (initialLeft + e.clientX - initialX) + "px";
        imageContainer.style.top = (initialTop + e.clientY - initialY) + "px";
    }
    
    function stopMoveImage() {
        document.removeEventListener("mousemove", moveImage);
        document.removeEventListener("mouseup", stopMoveImage);
        
        // Emit to socket if needed
        if (typeof socket !== 'undefined') {
            socket.emit("move-image", {
                id: imageContainer.id,
                x: imageContainer.style.left,
                y: imageContainer.style.top
            });
        }
    }
    
    document.addEventListener("mousemove", moveImage);
    document.addEventListener("mouseup", stopMoveImage);
}

// Start resizing image
function startResizeImage(e) {
    e.preventDefault();
    
    const handle = this;
    const imageContainer = handle.parentElement;
    const img = imageContainer.querySelector("img");
    const initialWidth = imageContainer.offsetWidth;
    const initialHeight = imageContainer.offsetHeight;
    const initialX = e.clientX;
    const initialY = e.clientY;
    
    function resizeImage(e) {
        const newWidth = initialWidth + (e.clientX - initialX);
        if (newWidth > 100) {
            imageContainer.style.width = newWidth + "px";
            img.style.maxHeight = (newWidth * 0.75) + "px";
        }
    }
    
    function stopResizeImage() {
        document.removeEventListener("mousemove", resizeImage);
        document.removeEventListener("mouseup", stopResizeImage);
        
        // Emit to socket if needed
        if (typeof socket !== 'undefined') {
            socket.emit("resize-image", {
                id: imageContainer.id,
                width: imageContainer.style.width,
                height: imageContainer.style.height
            });
        }
    }
    
    document.addEventListener("mousemove", resizeImage);
    document.addEventListener("mouseup", stopResizeImage);
}

// Create grid overlay
function createGrid() {
    const grid = document.createElement("div");
    grid.className = "grid";
    document.querySelector(".app-container").appendChild(grid);
}

// Update grid
function updateGrid() {
    // Grid is handled via CSS, no need for additional logic
}

// Create mini-map
function createMiniMap() {
    const miniMap = document.createElement("div");
    miniMap.className = "mini-map";
    miniMap.innerHTML = `
        <canvas class="mini-map-canvas"></canvas>
        <div class="mini-map-viewport"></div>
    `;
    document.body.appendChild(miniMap);
    
    updateMiniMap();
}

// Update mini-map
function updateMiniMap() {
    const miniMapCanvas = document.querySelector(".mini-map-canvas");
    const ctx = miniMapCanvas.getContext("2d");
    const miniMapViewport = document.querySelector(".mini-map-viewport");
    
    // Set mini-map canvas size
    miniMapCanvas.width = 200;
    miniMapCanvas.height = 150;
    
    // Draw scaled-down version of the main canvas
    ctx.drawImage(board, 0, 0, board.width, board.height, 0, 0, miniMapCanvas.width, miniMapCanvas.height);
    
    // Update viewport indicator
    const viewportWidth = (window.innerWidth / board.width) * miniMapCanvas.width;
    const viewportHeight = (window.innerHeight / board.height) * miniMapCanvas.height;
    
    miniMapViewport.style.width = viewportWidth + "px";
    miniMapViewport.style.height = viewportHeight + "px";
    miniMapViewport.style.left = (0) + "px";
    miniMapViewport.style.top = (0) + "px";
}

// Create shape tools
function createShapeTools() {
    const shapeTools = document.createElement("div");
    shapeTools.className = "shape-tools";
    shapeTools.innerHTML = `
        <div class="shape-option" data-shape="rectangle">
            <div class="shape-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
            </div>
        </div>
        <div class="shape-option" data-shape="circle">
            <div class="shape-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
            </div>
        </div>
        <div class="shape-option" data-shape="triangle">
            <div class="shape-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 20h18L12 4z"></path>
                </svg>
            </div>
        </div>
        <div class="shape-option" data-shape="line">
            <div class="shape-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="19" x2="19" y2="5"></line>
                </svg>
            </div>
        </div>
    `;
    document.body.appendChild(shapeTools);
}

// Create dark mode toggle
function createDarkModeToggle() {
    const themeToggle = document.createElement("div");
    themeToggle.className = "theme-toggle";
    themeToggle.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
        </svg>
    `;
    document.body.appendChild(themeToggle);
}

// Toggle dark mode
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    isDarkMode = document.body.classList.contains("dark-mode");
    
    const themeToggle = document.querySelector(".theme-toggle");
    if (isDarkMode) {
        themeToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="12" y1="1" x2="12" y2="3"></line>
                <line x1="12" y1="21" x2="12" y2="23"></line>
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                <line x1="1" y1="12" x2="3" y2="12"></line>
                <line x1="21" y1="12" x2="23" y2="12"></line>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
        `;
    } else {
        themeToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
        `;
    }
}

// Create keyboard shortcuts panel
function createShortcutsPanel() {
    const shortcutsPanel = document.createElement("div");
    shortcutsPanel.className = "shortcuts-panel";
    shortcutsPanel.innerHTML = `
        <button class="close-panel">×</button>
        <h2>Keyboard Shortcuts</h2>
        <div class="shortcuts-list">
            <div class="shortcut-key">P</div>
            <div class="shortcut-desc">Pencil Tool</div>
            
            <div class="shortcut-key">E</div>
            <div class="shortcut-desc">Eraser Tool</div>
            
            <div class="shortcut-key">S</div>
            <div class="shortcut-desc">Sticky Note</div>
            
            <div class="shortcut-key">I</div>
            <div class="shortcut-desc">Image Upload</div>
            
            <div class="shortcut-key">Z</div>
            <div class="shortcut-desc">Undo</div>
            
            <div class="shortcut-key">Y</div>
            <div class="shortcut-desc">Redo</div>
            
            <div class="shortcut-key">+</div>
            <div class="shortcut-desc">Zoom In</div>
            
            <div class="shortcut-key">-</div>
            <div class="shortcut-desc">Zoom Out</div>
            
            <div class="shortcut-key">D</div>
            <div class="shortcut-desc">Download Board</div>
            
            <div class="shortcut-key">T</div>
            <div class="shortcut-desc">Toggle Dark Mode</div>
            
            <div class="shortcut-key">?</div>
            <div class="shortcut-desc">Show Shortcuts</div>
        </div>
    `;
    document.body.appendChild(shortcutsPanel);
    
    // Add help button to header
    const headerActions = document.querySelector(".header-actions");
    const helpBtn = document.createElement("button");
    helpBtn.id = "help-btn";
    helpBtn.className = "action-button";
    helpBtn.title = "Keyboard Shortcuts";
    helpBtn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
    `;
    headerActions.insertBefore(helpBtn, headerActions.firstChild);
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    // Don't trigger shortcuts when typing in text areas or inputs
    if (e.target.tagName === "TEXTAREA" || e.target.tagName === "INPUT") {
        return;
    }
    
    switch (e.key.toLowerCase()) {
        case "p":
            document.getElementById("pencil").click();
            break;
        case "e":
            document.getElementById("eraser").click();
            break;
        case "s":
            document.getElementById("sticky").click();
            break;
        case "i":
            document.getElementById("image-upload").click();
            break;
        case "z":
            if (!e.ctrlKey && !e.metaKey) {
                document.getElementById("undo").click();
            }
            break;
        case "y":
            document.getElementById("redo").click();
            break;
        case "+":
        case "=":
            document.getElementById("zoom-in").click();
            break;
        case "-":
            document.getElementById("zoom-out").click();
            break;
        case "d":
            downloadBoard();
            break;
        case "t":
            toggleDarkMode();
            break;
        case "?":
        case "/":
            document.querySelector(".shortcuts-panel").classList.add("visible");
            break;
    }
}

// Update color picker with custom color input
function updateColorPicker() {
    const colorPicker = document.querySelector(".color-picker");
    if (!colorPicker) return;
    
    // Add heading
    const heading = document.createElement("div");
    heading.className = "color-picker-heading";
    heading.textContent = "Colors";
    colorPicker.insertBefore(heading, colorPicker.firstChild);
    
    // Add custom color input
    const customColorInput = document.createElement("div");
    customColorInput.className = "custom-color-input";
    customColorInput.innerHTML = `
        <div class="custom-color-preview" style="background-color: #000000;"></div>
        <input type="color" id="custom-color-input" value="#000000">
    `;
    colorPicker.appendChild(customColorInput);
}

// Initialize the app
function initApp() {
    initCanvas();
    setupEventListeners();
    updateCursor();
    
    // Create default cursor assets
    const cursorImg = new Image();
    cursorImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAABEklEQVR4nO2WMU7DQBBF3xIJWdlyAEQRpfQIm8IFmQtwBMQBCMUBbmCXwgWUFBwhRYqMWJWBHQXwKmOvd+2xJ1VePbP/z+yudHK5/4akFTAFnoAnYAGUHbECnhO/L2DTFyhy8EVg+KLLkCpB3wS3EbHVN0HS/Q9w2yP4uXPPfPfVUwmc90T8I33p7iqj4+B6hK/jO+BeUlfwQ7eSPia4KZLcFsC841G7Wku6/CZ4N4ADPW03wGsX/KHnCTG+bSX4i5/gWlKZkPhA0t4Y/s5x1xM8G/dD0m4Iv+YsM8NfLGmVGC4zfC1pO7r40nGZB/C3oyCtkT2qILxOSZCkJlPZGn4MzFLKz+VyP9cHZuZsrCZTzigAAAAASUVORK5CYII=';
    
    const eraserImg = new Image();
    eraserImg.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAACXBIWXMAAAsTAAALEwEAmpwYAAAA9klEQVR4nO2UMUpDQRCGvyuiNtqI1iJYiJ1YWMTWztLWRi/gARTxDOIVBMH0XsBCsBGxsNDSwkKwk0Q/mYVHeLvZfS+F+MPA/PP/O7Pz5s3Cf0cNuAQ+gC5wD8wC8S3g3aI+AR9oCZNvAZ9OoIdHYFnYaMXBtfMIrJSRHzqY1IbhPOcNzIeE684k7+TzJdx/IGVggLpH3nRyPSIuZaDrZrwZ1q4yvzOukCMv83sF+KjrN1Fykwe/y5BfRMjbZQ3mSshfKHG5a/QcEd8rYbBbxmADmAJm7Pfchb2i5JLnXA5OgBGwbnEf1tf0u0DF//F7+AYVQYgfRfMeEwAAAABJRU5ErkJggg==';
}

// Initialize on load
window.addEventListener("load", initApp);
