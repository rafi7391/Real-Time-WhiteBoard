// Sticky Note Functionality
let stickyId = 0;

function createSticky() {
    // Generate a unique id for the sticky note
    const id = "sticky-" + stickyId++;
    const colors = ["yellow", "blue", "green", "pink"];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    // Create sticky note container
    const stickyContainer = document.createElement("div");
    stickyContainer.className = `sticky-container ${randomColor} new`;
    stickyContainer.id = id;
    
    // Position in the center of viewport
    const scrollX = window.scrollX || window.pageXOffset;
    const scrollY = window.scrollY || window.pageYOffset;
    stickyContainer.style.left = (scrollX + window.innerWidth / 2 - 150) + "px";
    stickyContainer.style.top = (scrollY + window.innerHeight / 2 - 100) + "px";
    
    // Create sticky note header
    const stickyHeader = document.createElement("div");
    stickyHeader.className = "sticky-header";
    stickyHeader.innerHTML = `
        <h3>Note ${stickyId}</h3>
        <button class="sticky-close">×</button>
    `;
    
    // Create sticky note content
    const stickyContent = document.createElement("div");
    stickyContent.className = "sticky-content";
    stickyContent.innerHTML = `<textarea class="sticky-textarea" placeholder="Type your note here..."></textarea>`;
    
    // Append elements
    stickyContainer.appendChild(stickyHeader);
    stickyContainer.appendChild(stickyContent);
    document.body.appendChild(stickyContainer);
    
    // Focus the textarea
    const textarea = stickyContainer.querySelector(".sticky-textarea");
    textarea.focus();
    
    // Set up event listeners for moving
    stickyHeader.addEventListener("mousedown", startDragSticky);
    
    // Set up event listener for close button
    stickyContainer.querySelector(".sticky-close").addEventListener("click", () => {
        stickyContainer.classList.add("minimize");
        setTimeout(() => {
            document.body.removeChild(stickyContainer);
            
            // Emit to socket if needed
            if (typeof socket !== 'undefined') {
                socket.emit("delete-sticky", { id });
            }
        }, 300);
    });
    
    // Set up event listener for content changes
    textarea.addEventListener("input", () => {
        // Emit to socket if needed
        if (typeof socket !== 'undefined') {
            socket.emit("update-sticky", {
                id,
                content: textarea.value
            });
        }
    });
    
    // Emit to socket if needed
    if (typeof socket !== 'undefined') {
        socket.emit("add-sticky", {
            id,
            color: randomColor,
            position: {
                left: stickyContainer.style.left,
                top: stickyContainer.style.top
            },
            content: ""
        });
    }
    
    return stickyContainer;
}

// Start dragging sticky note
function startDragSticky(e) {
    e.preventDefault();
    
    const stickyContainer = this.parentElement;
    const initialX = e.clientX;
    const initialY = e.clientY;
    const initialLeft = parseFloat(stickyContainer.style.left);
    const initialTop = parseFloat(stickyContainer.style.top);
    
    function moveSticky(e) {
        stickyContainer.style.left = (initialLeft + e.clientX - initialX) + "px";
        stickyContainer.style.top = (initialTop + e.clientY - initialY) + "px";
    }
    
    function stopMoveSticky() {
        document.removeEventListener("mousemove", moveSticky);
        document.removeEventListener("mouseup", stopMoveSticky);
        
        // Emit to socket if needed
        if (typeof socket !== 'undefined') {
            socket.emit("move-sticky", {
                id: stickyContainer.id,
                position: {
                    left: stickyContainer.style.left,
                    top: stickyContainer.style.top
                }
            });
        }
    }
    
    document.addEventListener("mousemove", moveSticky);
    document.addEventListener("mouseup", stopMoveSticky);
}

// Initialize sticky note functionality
document.addEventListener("DOMContentLoaded", () => {
    const stickyTool = document.getElementById("sticky");
    if (stickyTool) {
        stickyTool.addEventListener("click", () => {
            createSticky();
        });
    }
});