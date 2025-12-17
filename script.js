// Game State
let currentStep = 0;
let bradCoin = 1000; // Start at $1000 USD value
let userData = {};
let beemovieLine = 0;
let coolnessScore = 0;
let startTime = Date.now();
let profilePicDataURL = localStorage.getItem('profilePicDataURL') || null; // Store profile picture for later use

// Tracking
let trackingData = {
    clicks: 0,
    popupsDismissed: 0,
    formsSubmitted: 0,
    filesUploaded: 0,
    rightsSurrendered: [],
    violations: []
};

// Cosmetics
const cosmetics = [
    { id: 'sunglasses', name: 'Cool Sunglasses', price: 450, coolness: 30, effect: 'filter: brightness(1.1);', visual: 'sunglasses' },
    { id: 'hat', name: 'Black Hat', price: 600, coolness: 25, effect: 'filter: saturate(1.3);', visual: 'hat' },
    { id: 'glow', name: 'Neon Poop', price: 800, coolness: 40, effect: 'box-shadow: 0 0 20px #4285f4;', visual: null },
    { id: 'border', name: 'RGB Lights', price: 400, coolness: 20, effect: 'border: 3px solid; border-image: linear-gradient(45deg, red, yellow, green, blue) 1;', visual: null }
];

let purchasedCosmetics = [];

// Update cosmetics shop prices every second
setInterval(() => {
    if (document.querySelector('.cosmetics-popup')) {
        updateCosmeticsShop();
    }
}, 1000);

// Apply cosmetic visuals
function applyCosmeticVisual(cosmeticId) {
    const container = document.querySelector('.captcha-container');
    
    if (cosmeticId === 'sunglasses') {
        // Add sunglasses emoji to top-right corner
        const sunglasses = document.createElement('div');
        sunglasses.className = 'cosmetic-visual sunglasses-visual';
        sunglasses.innerHTML = '😎';
        sunglasses.style.cssText = `
            position: absolute;
            top: 10px;
            right: 10px;
            font-size: 60px;
            z-index: 100;
            animation: float 3s ease-in-out infinite;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        `;
        container.style.position = 'relative';
        container.appendChild(sunglasses);
    }
    
    if (cosmeticId === 'hat') {
        // Add top hat emoji to top-left corner
        const hat = document.createElement('div');
        hat.className = 'cosmetic-visual hat-visual';
        hat.innerHTML = '🎩';
        hat.style.cssText = `
            position: absolute;
            top: -30px;
            left: 50%;
            transform: translateX(-50%);
            font-size: 70px;
            z-index: 100;
            animation: tilt 2s ease-in-out infinite;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.3));
        `;
        container.style.position = 'relative';
        container.appendChild(hat);
    }
}

// Obfuscate the login code - stored in multiple places to make it harder to find
const codeFragments = ['100', '625'];
const getLoginCode = () => codeFragments.join('');

// Bee Movie script (truncated for demo, with hidden code)
const beeMovieScript = [
    "According to all known laws of aviation, there is no way a bee should be able to fly.",
    "Its wings are too small to get its fat little body off the ground.",
    "The bee, of course, flies anyway because bees don't care what humans think is impossible.",
    "Yellow, black. Yellow, black. Yellow, black. Yellow, black.",
    "Ooh, black and yellow! Let's shake it up a little.",
    "Barry! Breakfast is ready!",
    "Coming! Hang on a second.",
    "Hello? Barry? Adam? Can you believe this is happening?",
    "I can't. I'll pick you up. Looking sharp.",
    "Use the stairs. Your father paid good money for those.",
    "Sorry. I'm excited. Here's the graduate. We're very proud of you, son.",
    "A perfect report card, all B's. Very proud.",
    "Ma! I got a thing going here. You got lint on your fuzz.",
    "Ow! That's me! Wave to us! We'll be in row 118,000.",
    `Your one-time login code is ${getLoginCode()}`,  // THE HIDDEN CODE!
    "Bye! Barry, I told you, stop flying in the house!",
    "Hey, Adam. Hey, Barry. Is that fuzz gel?",
    "A little. Special day, graduation.",
    "Never thought I'd make it. Three days grade school, three days high school.",
    "Those were awkward. Three days college. I'm glad I took a day and hitchhiked around the hive."
];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeChatbot();
    initializeSteps();
    startRandomPopups();
    
    // Skip menu keyboard shortcut (Ctrl + Shift + S)
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'S') {
            e.preventDefault();
            showSkipMenu();
        }
    });
    
    // Check for URL skip parameter (?skip=12)
    const urlParams = new URLSearchParams(window.location.search);
    const skipTo = urlParams.get('skip');
    if (skipTo) {
        setTimeout(() => {
            skipToStep(parseInt(skipTo));
        }, 500);
    }
    
    // Track all clicks
    document.addEventListener('click', () => {
        trackingData.clicks++;
    });
    
    // Anti-inspect element measures (mostly for fun/annoyance)
    // Disable right-click on chatbot
    const chatbot = document.getElementById('chatbot');
    chatbot.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        showSuccess('Nice try!');
        return false;
    });
    
    // Detect if DevTools is open (won't prevent it but adds to the annoyance)
    let devtoolsOpen = false;
    const detectDevTools = () => {
        const threshold = 160;
        if (window.outerWidth - window.innerWidth > threshold || 
            window.outerHeight - window.innerHeight > threshold) {
            if (!devtoolsOpen) {
                devtoolsOpen = true;
                console.clear();
                console.log('%cHey! Stop trying to cheat!', 'font-size: 24px; color: red; font-weight: bold;');
                console.log('%cThe code is hidden for a reason...', 'font-size: 16px; color: orange;');
            }
        } else {
            devtoolsOpen = false;
        }
    };
    setInterval(detectDevTools, 1000);
});

// Chatbot
function initializeChatbot() {
    const chatbot = document.getElementById('chatbot');
    const minimize = document.querySelector('.chatbot-minimize');
    const messages = document.getElementById('chatbot-messages');
    
    minimize.addEventListener('click', () => {
        chatbot.classList.toggle('minimized');
        minimize.textContent = chatbot.classList.contains('minimized') ? '+' : '−';
    });
    
    // Start streaming bee movie
    streamBeeMovie();
}

function streamBeeMovie() {
    const messages = document.getElementById('chatbot-messages');
    
    function addLine() {
        if (beemovieLine < beeMovieScript.length) {
            const div = document.createElement('div');
            div.className = 'chatbot-message';
            
            const currentLine = beeMovieScript[beemovieLine];
            
            // Highlight the line with the code
            if (currentLine.includes('100625')) {
                div.classList.add('highlight');
            }
            
            // Obfuscate the text content from inspect element
            // Store actual text but don't set it directly
            div.setAttribute('data-content', btoa(currentLine)); // base64 encode
            div.textContent = currentLine;
            
            messages.appendChild(div);
            
            // Auto-scroll to bottom by removing old messages
            // Keep only the last 5 messages visible
            const allMessages = messages.querySelectorAll('.chatbot-message');
            if (allMessages.length > 5) {
                allMessages[0].remove();
            }
            
            beemovieLine++;
            setTimeout(addLine, Math.random() * 3000 + 2000); // Random delay 2-5 seconds
        }
    }
    
    addLine();
}

// Step Management
function initializeSteps() {
    // Step 0: Initial reCAPTCHA
    const checkbox = document.getElementById('not-robot-checkbox');
    checkbox.addEventListener('change', (e) => {
        if (e.target.checked) {
            setTimeout(() => {
                nextStep();
            }, 1000);
        }
    });
    
    // Step 1: Brad Face Puzzle
    initializePuzzle();
    
    // Ad Break 1
    const adClose1 = document.getElementById('ad-close-1');
    const adVideo1 = document.getElementById('ad-video-1');
    
    // Disable close button initially
    adClose1.disabled = true;
    adClose1.style.opacity = '0.5';
    adClose1.style.cursor = 'not-allowed';
    
    // Enable close button when video ends
    adVideo1.addEventListener('ended', () => {
        adClose1.disabled = false;
        adClose1.style.opacity = '1';
        adClose1.style.cursor = 'pointer';
        showSuccess('You can now close the ad');
    });
    
    adClose1.addEventListener('click', () => {
        if (!adClose1.disabled) {
            nextStep();
        }
    });
    
    // Step 3: Signup Form
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', (e) => {
        e.preventDefault();
        userData.name = document.getElementById('signup-name').value;
        userData.email = document.getElementById('signup-email').value;
        userData.password = document.getElementById('signup-password').value;
        
        // Store in localStorage
        localStorage.setItem('userData', JSON.stringify(userData));
        
        trackingData.formsSubmitted++;
        
        // Show loading then success
        showLoading();
        setTimeout(() => {
            hideLoading();
            showSuccess('Account created successfully! ✓');
            
            // Show creepy IP tracking popup
            setTimeout(() => {
                showIPTrackingPopup();
            }, 2000);
            
            setTimeout(nextStep, 800);
        }, 1500);
    });
    
    // Step 3: Cookie Notice
    document.getElementById('cookie-accept').addEventListener('click', () => {
        showSuccess('Cookies accepted! (All 847 partners notified)');
        setTimeout(nextStep, 1000);
    });
    
    document.getElementById('cookie-settings').addEventListener('click', () => {
        // Dark pattern: settings button also just continues
        alert('There are no settings. You must accept all cookies.');
    });
    
    // Step 4: Credit Card Form
    const cardForm = document.getElementById('credit-card-form');
    
    // Format card number as user types
    const cardNumber = document.getElementById('card-number');
    cardNumber.addEventListener('input', formatCardNumber);
    
    const cardExpiry = document.getElementById('card-expiry');
    cardExpiry.addEventListener('input', formatExpiry);
    
    cardForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        userData.cardNumber = cardNumber.value;
        userData.cardExpiry = cardExpiry.value;
        userData.cardCVV = document.getElementById('card-cvv').value;
        
        trackingData.formsSubmitted++;
        
        showLoading();
        setTimeout(() => {
            hideLoading();
            showSuccess('Age verified! Converting to BradCoin...');
            setTimeout(nextStep, 1200);
        }, 2000);
    });
    
    // Step 5: Crypto Conversion
    document.getElementById('continue-crypto').addEventListener('click', () => {
        // Show BradCoin counter
        document.getElementById('bradcoin-counter').style.display = 'flex';
        showSuccess('BradCoin acquired! Check out the shop!');
        
        // Show cosmetics popup after a delay
        setTimeout(() => {
            showCosmeticsPopup();
        }, 2000);
        
        setTimeout(nextStep, 1000);
    });
    
    // Step 6: TOS Agreement
    const tosScroll = document.getElementById('tos-scroll');
    const tosAgree = document.getElementById('tos-agree');
    const tosNotice = document.getElementById('tos-notice');
    
    tosScroll.addEventListener('scroll', () => {
        // Check if scrolled to bottom
        if (tosScroll.scrollTop + tosScroll.clientHeight >= tosScroll.scrollHeight - 10) {
            tosAgree.disabled = false;
            tosNotice.style.display = 'none';
        }
    });
    
    tosAgree.addEventListener('click', () => {
        trackingData.rightsSurrendered.push('Agreed to binding arbitration');
        trackingData.rightsSurrendered.push('Waived right to jury trial');
        trackingData.rightsSurrendered.push('Waived right to class action lawsuit');
        trackingData.rightsSurrendered.push('Consented to data sharing with 847 partners');
        trackingData.rightsSurrendered.push('Granted perpetual license to all uploaded content');
        
        showSuccess('Terms accepted!');
        setTimeout(nextStep, 800);
    });
    
    document.getElementById('tos-decline').addEventListener('click', () => {
        if (confirm('If you decline, you will lose all progress. Are you sure?')) {
            location.reload();
        }
    });
    
    // Step 7: One-Time Login Code
    const codeForm = document.getElementById('code-form');
    const codeInput = document.getElementById('login-code');
    const codeError = document.getElementById('code-error');
    
    codeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const code = codeInput.value;
        
        if (code === getLoginCode()) {
            trackingData.formsSubmitted++;
            trackingData.rightsSurrendered.push('Agreed to unlimited data sharing');
            showSuccess('Code verified!');
            setTimeout(nextStep, 800);
        } else {
            codeError.textContent = 'Invalid code. Please check the chatbot and try again.';
            codeError.style.display = 'block';
            codeInput.style.borderColor = '#ea4335';
        }
    });
    
    // Step 9: Profile Setup
    const profileForm = document.getElementById('profile-form');
    const profilePicInput = document.getElementById('profile-pic');
    const profileSubmit = document.getElementById('profile-submit');
    
    let profilePicFile = null;
    
    setupFileUpload('profile-pic-upload', profilePicInput, (file, dataURL) => {
        profilePicFile = file;
        
        // Update GLOBAL variable (declared at top of file)
        window.profilePicDataURL = dataURL;
        profilePicDataURL = dataURL; // Also update in case window doesn't work
        
        userData.profilePic = file.name;
        
        // Save to localStorage
        localStorage.setItem('profilePicDataURL', dataURL);
        
        console.log('Profile pic uploaded, dataURL length:', dataURL?.length); // Debug
        
        // Enable submit button when profile pic is uploaded
        profileSubmit.disabled = false;
    });
    
    profileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        trackingData.filesUploaded++;
        trackingData.formsSubmitted++;
        
        console.log('Submitting profile form, profilePicDataURL exists:', !!profilePicDataURL); // Debug
        
        showLoading();
        setTimeout(() => {
            hideLoading();
            showSuccess('Profile setup complete!');
            setTimeout(nextStep, 800);
        }, 1500);
    });
    
    // Step 9: OAuth Login
    document.getElementById('google-login').addEventListener('click', () => {
        handleOAuthLogin('Google');
    });
    
    document.getElementById('meta-login').addEventListener('click', () => {
        handleOAuthLogin('Meta');
    });
    
    document.getElementById('amazon-login').addEventListener('click', () => {
        handleOAuthLogin('Amazon');
    });
    
    // Step 11: Coolness Gate
    document.getElementById('retry-coolness').addEventListener('click', () => {
        updateCoolnessScore();
        
        if (coolnessScore >= 100) {
            showSuccess('Coolness requirement met!');
            setTimeout(nextStep, 1000);
        } else {
            showSuccess(`Still need ${100 - coolnessScore} more coolness points!`);
            
            // Only show hack offer if not already shown and user hasn't already used it
            if (!userData.hackOffered && !userData.usedHack) {
                setTimeout(showHackOffer, 2000);
            }
        }
    });
    
    // Step 11: Feed
    document.getElementById('continue-final').addEventListener('click', () => {
        nextStep();
        populateDashboard();
    });
}

function nextStep() {
    // Get current step element
    const current = document.getElementById(`step-${currentStep}`);
    
    if (current) {
        // Add exit animation
        current.classList.add('exiting');
        
        // Wait for exit animation to complete
        setTimeout(() => {
            current.classList.remove('active', 'exiting');
            
            // Show next step
            currentStep++;
            const next = document.getElementById(`step-${currentStep}`);
            
            if (next) {
                next.classList.add('active');
                
                // Special handling for crypto step
                if (currentStep === 6) {
                    startCryptoDevaluation();
                }
                
                // Special handling for coolness gate
                if (currentStep === 11) {
                    updateCoolnessScore();
                }
                
                // Special handling for feed
                if (currentStep === 12) {
                    initializeFeed();
                }
                
                // Reset puzzle state for step 1
                if (currentStep === 1) {
                    placedPieces = 0;
                    puzzlePieces.forEach(p => p.placed = false);
                }
            }
        }, 400); // Match the fadeOutSlide animation duration
    } else {
        // No current step, just show the next one
        currentStep++;
        const next = document.getElementById(`step-${currentStep}`);
        
        if (next) {
            next.classList.add('active');
            
            if (currentStep === 6) {
                startCryptoDevaluation();
            }
            
            if (currentStep === 11) {
                updateCoolnessScore();
            }
            
            if (currentStep === 12) {
                initializeFeed();
            }
        }
    }
}

// Brad Face Puzzle
let puzzlePieces = [];
let placedPieces = 0;
let fullImage = null;

function initializePuzzle() {
    const canvas = document.getElementById('puzzle-canvas');
    const ctx = canvas.getContext('2d');
    const pieceContainer = document.querySelector('.puzzle-piece-container');
    
    // Load Brad's photo
    const img = new Image();
    img.onload = () => {
        fullImage = img;
        
        // Define puzzle pieces (9 pieces - 3x3 grid)
        const pieceWidth = 400 / 3;
        const pieceHeight = 400 / 3;
        
        puzzlePieces = [];
        
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const pieceX = col * pieceWidth;
                const pieceY = row * pieceHeight;
                
                puzzlePieces.push({
                    x: pieceX,
                    y: pieceY,
                    width: pieceWidth,
                    height: pieceHeight,
                    placed: false
                });
            }
        }
        
        // Draw the canvas with empty slots
        drawPuzzleCanvas();
        
        // Shuffle and create draggable pieces
        const shuffled = [...puzzlePieces].sort(() => Math.random() - 0.5);
        pieceContainer.innerHTML = ''; // Clear existing
        
        shuffled.forEach((piece, index) => {
            const pieceCanvas = document.createElement('canvas');
            pieceCanvas.width = piece.width;
            pieceCanvas.height = piece.height;
            pieceCanvas.className = 'puzzle-piece draggable';
            pieceCanvas.dataset.index = puzzlePieces.indexOf(piece);
            
            const pieceCtx = pieceCanvas.getContext('2d');
            pieceCtx.drawImage(img, piece.x, piece.y, piece.width, piece.height, 0, 0, piece.width, piece.height);
            
            pieceContainer.appendChild(pieceCanvas);
            makePuzzlePieceDraggable(pieceCanvas, piece);
        });
    };
    
    img.onerror = () => {
        console.error('Failed to load brad.png, using placeholder');
        // Fallback to placeholder if brad.png doesn't exist
        img.src = createBradPlaceholder();
    };
    
    // Try to load brad.png first
    img.src = 'brad.png';
}

function drawPuzzleCanvas() {
    const canvas = document.getElementById('puzzle-canvas');
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw placed pieces and empty slots
    puzzlePieces.forEach(piece => {
        if (piece.placed) {
            // Draw the actual image piece
            ctx.drawImage(fullImage, piece.x, piece.y, piece.width, piece.height, piece.x, piece.y, piece.width, piece.height);
        } else {
            // Draw empty slot
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(piece.x, piece.y, piece.width, piece.height);
            ctx.strokeStyle = '#ddd';
            ctx.lineWidth = 2;
            ctx.strokeRect(piece.x, piece.y, piece.width, piece.height);
        }
    });
}

function makePuzzlePieceDraggable(element, piece) {
    let isDragging = false;
    let offsetX, offsetY;
    
    element.addEventListener('mousedown', (e) => {
        if (piece.placed) return;
        
        isDragging = true;
        
        // Calculate offset from mouse to element top-left
        const rect = element.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        
        element.classList.add('dragging');
        element.style.zIndex = '1000';
        element.style.position = 'fixed';
        
        // Immediately position under cursor
        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        // Position element so it stays under cursor
        element.style.left = (e.clientX - offsetX) + 'px';
        element.style.top = (e.clientY - offsetY) + 'px';
    });
    
    document.addEventListener('mouseup', (e) => {
        if (!isDragging) return;
        
        isDragging = false;
        element.classList.remove('dragging');
        element.style.zIndex = '1';
        
        // Check if piece is in correct position
        const canvas = document.getElementById('puzzle-canvas');
        const canvasRect = canvas.getBoundingClientRect();
        const pieceRect = element.getBoundingClientRect();
        
        const pieceCenterX = pieceRect.left + pieceRect.width / 2;
        const pieceCenterY = pieceRect.top + pieceRect.height / 2;
        
        const targetCenterX = canvasRect.left + piece.x + piece.width / 2;
        const targetCenterY = canvasRect.top + piece.y + piece.height / 2;
        
        const distance = Math.sqrt(
            Math.pow(pieceCenterX - targetCenterX, 2) + 
            Math.pow(pieceCenterY - targetCenterY, 2)
        );
        
        // Snap threshold
        if (distance < 50) {
            // Correct placement!
            piece.placed = true;
            placedPieces++;
            
            // Animate snap into place
            element.style.transition = 'all 0.3s ease';
            element.style.left = (canvasRect.left + piece.x) + 'px';
            element.style.top = (canvasRect.top + piece.y) + 'px';
            element.style.opacity = '0';
            
            setTimeout(() => {
                element.remove();
                drawPuzzleCanvas();
                
                // Check if all pieces are placed
                if (placedPieces === puzzlePieces.length) {
                    setTimeout(() => {
                        showSuccess('Puzzle completed! 🎉');
                        setTimeout(nextStep, 1500);
                    }, 500);
                }
            }, 300);
        } else {
            // Wrong position - reset to original position in container
            element.style.transition = 'all 0.3s ease';
            element.style.position = 'relative';
            element.style.left = '0';
            element.style.top = '0';
            
            setTimeout(() => {
                element.style.transition = '';
            }, 300);
        }
    });
}

function createBradPlaceholder() {
    // Create a canvas to generate a placeholder image
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = 400;
    tempCanvas.height = 400;
    const ctx = tempCanvas.getContext('2d');
    
    // Create gradient background
    const gradient = ctx.createLinearGradient(0, 0, 400, 400);
    gradient.addColorStop(0, '#4285f4');
    gradient.addColorStop(1, '#34a853');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 400, 400);
    
    // Draw text
    ctx.fillStyle = 'white';
    ctx.font = 'bold 60px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BRAD', 200, 180);
    ctx.font = 'bold 40px Arial';
    ctx.fillText('ROSEN', 200, 240);
    
    return tempCanvas.toDataURL();
}



// Crypto Devaluation (actual devaluation - value decreases)
let cryptoInterval = null;

function startCryptoDevaluation() {
    const canvas = document.getElementById('crypto-chart-canvas');
    const ctx = canvas.getContext('2d');
    
    let time = 0;
    const dataPoints = [];
    let currentValue = 1000; // Start at $1000 USD
    bradCoin = 1000; // Initialize at $1000
    
    // Initialize chart
    for (let i = 0; i < 50; i++) {
        dataPoints.push(1000);
    }
    
    function updateCrypto() {
        time++;
        
        // DECREASE USD value of BradCoin (slow decay)
        // Only decrease if user hasn't manually spent below this
        if (bradCoin >= currentValue * 0.995) {
            bradCoin = Math.max(0.01, bradCoin * 0.995); // Lose 0.5% per update (slow decay)
        }
        currentValue = bradCoin;
        
        dataPoints.push(bradCoin);
        if (dataPoints.length > 50) {
            dataPoints.shift();
        }
        
        // Update displays
        updateBradCoinDisplay();
        
        // Draw chart
        drawChart(ctx, dataPoints);
        
        // Continue updating (run longer to show decay)
        if (time < 200) {
            cryptoInterval = setTimeout(updateCrypto, 200);
        }
    }
    
    updateCrypto();
}

function drawChart(ctx, data) {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 20;
    
    ctx.clearRect(0, 0, width, height);
    
    // Draw grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (height - 2 * padding) * i / 5;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
    }
    
    // Draw line
    const maxVal = Math.max(...data);
    const minVal = Math.min(...data);
    const range = maxVal - minVal || 1;
    
    // Color based on trend - RED when going DOWN (losing value)
    const currentVal = data[data.length - 1];
    const startVal = data[0];
    ctx.strokeStyle = currentVal < startVal * 0.5 ? '#ea4335' : currentVal < startVal * 0.7 ? '#fbbc04' : '#34a853';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((val, i) => {
        const x = padding + (width - 2 * padding) * i / (data.length - 1);
        const y = height - padding - (height - 2 * padding) * (val - minVal) / range;
        
        if (i === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    
    ctx.stroke();
}

// Input Formatting
function formatCardNumber(e) {
    let value = e.target.value.replace(/\s/g, '');
    let formattedValue = value.match(/.{1,4}/g)?.join(' ') || value;
    e.target.value = formattedValue;
}

function formatExpiry(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    e.target.value = value;
}

// Get user's approximate location (for the IP tracking feature)
async function getUserIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error('Failed to get IP:', error);
        return 'Unable to detect';
    }
}

async function getUserLocation() {
    try {
        // Using ipapi.co for geolocation (free, HTTPS, no key needed)
        const response = await fetch('https://ipapi.co/json/');
        const data = await response.json();
        
        if (data.city && data.region && data.country_name) {
            return `${data.city}, ${data.region}, ${data.country_name}`;
        }
        return 'Location unavailable';
    } catch (error) {
        console.error('Failed to get location:', error);
        return 'Location unavailable';
    }
}

// Success notification for smooth transitions
function showSuccess(message) {
    const notification = document.createElement('div');
    notification.className = 'success-notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 2000);
}

// Loading spinner
function showLoading() {
    const loader = document.createElement('div');
    loader.id = 'loading-spinner';
    loader.className = 'loading-spinner';
    loader.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loader);
}

function hideLoading() {
    const loader = document.getElementById('loading-spinner');
    if (loader) {
        loader.remove();
    }
}

// Cosmetics Shop
let cosmeticsShopVisible = false;

function showCosmeticsPopup() {
    // Check if already exists
    let popup = document.querySelector('.cosmetics-popup');
    
    if (!popup) {
        popup = document.createElement('div');
        popup.className = 'cosmetics-popup';
        popup.innerHTML = `
            <div class="cosmetics-header" onclick="toggleCosmeticsShop()">
                <h3>🛍️ Cosmetics Shop</h3>
                <button class="cosmetics-minimize" onclick="event.stopPropagation(); toggleCosmeticsShop();">−</button>
            </div>
            <div class="cosmetics-content" id="cosmetics-items">
                ${renderCosmeticsItems()}
            </div>
        `;
        document.body.appendChild(popup);
        cosmeticsShopVisible = true;
    } else {
        // Just show it if it was hidden
        popup.style.display = 'block';
        popup.classList.remove('minimized');
        cosmeticsShopVisible = true;
    }
}

function toggleCosmeticsShop() {
    const popup = document.querySelector('.cosmetics-popup');
    if (popup) {
        popup.classList.toggle('minimized');
    }
}

function renderCosmeticsItems() {
    return cosmetics.map(item => {
        const isOwned = purchasedCosmetics.find(c => c.id === item.id);
        const usdPrice = item.price;
        const bradCoinCost = bradCoin > 0 ? (usdPrice / bradCoin).toFixed(2) : '∞';
        
        return `
            <div class="cosmetic-item ${isOwned ? 'owned' : ''}" id="cosmetic-${item.id}">
                <div class="cosmetic-info">
                    <div class="cosmetic-name">${item.name}</div>
                    <div class="cosmetic-price">
                        $${usdPrice} USD
                        <br>
                        <span style="font-size: 11px; color: #999;">(${bradCoinCost} BradCoin)</span>
                    </div>
                </div>
                <button class="cosmetic-buy" onclick="buyCosmetic('${item.id}')" id="buy-${item.id}" ${isOwned ? 'disabled' : ''}>
                    ${isOwned ? '✓ Owned' : 'Buy'}
                </button>
            </div>
        `;
    }).join('');
}

function updateCosmeticsShop() {
    const container = document.getElementById('cosmetics-items');
    if (container) {
        container.innerHTML = renderCosmeticsItems();
    }
}

function buyCosmetic(id) {
    const item = cosmetics.find(c => c.id === id);
    if (!item) return;
    
    const usdPrice = item.price;
    const bradCoinCost = usdPrice / bradCoin;
    
    // Check if already owned
    if (purchasedCosmetics.find(c => c.id === id)) {
        showSuccess('You already own this!');
        return;
    }
    
    // Check if can afford (need at least the USD equivalent)
    if (bradCoin < 0.01) {
        showSuccess('BradCoin value too low! Wait for it to drop more...');
        return;
    }
    
    if (bradCoinCost > 1) {
        showSuccess(`You need ${bradCoinCost.toFixed(2)} BradCoin (worth $${usdPrice}). You only have 1 BradCoin!`);
        return;
    }
    
    // Can afford! Deduct from BradCoin by reducing its value
    const newValue = bradCoin - usdPrice;
    if (newValue < 0) {
        showSuccess(`Not enough BradCoin value! Need $${usdPrice}, you have $${bradCoin.toFixed(2)}`);
        return;
    }
    
    // Purchase successful
    bradCoin = Math.max(0.01, newValue);
    purchasedCosmetics.push(item);
    coolnessScore += item.coolness;
    
    // Apply visual effect to the container
    const container = document.querySelector('.captcha-container');
    const currentStyle = container.getAttribute('style') || '';
    container.setAttribute('style', currentStyle + item.effect);
    
    // Apply visual element if it has one
    if (item.visual) {
        applyCosmeticVisual(item.id);
    }
    
    // Update displays
    updateBradCoinDisplay();
    updateCosmeticsShop();
    
    showSuccess(`${item.name} purchased! +${item.coolness} coolness`);
}

function updateBradCoinDisplay() {
    const counterEl = document.getElementById('counter-amount');
    const valueEl = document.getElementById('bradcoin-value');
    
    if (counterEl) {
        counterEl.textContent = bradCoin.toFixed(2);
    }
    if (valueEl) {
        valueEl.textContent = `1 BradCoin = $${bradCoin.toFixed(2)}`;
    }
}

function updateCoolnessScore() {
    const scoreEl = document.getElementById('coolness-score');
    const barEl = document.getElementById('coolness-bar');
    
    scoreEl.textContent = coolnessScore;
    barEl.style.width = Math.min(coolnessScore, 100) + '%';
}

// Hack Offer
function showHackOffer() {
    userData.hackOffered = true;
    
    const hackPrice = 200;
    const canAfford = bradCoin >= hackPrice;
    
    const overlay = document.createElement('div');
    overlay.className = 'hack-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'hack-popup';
    popup.innerHTML = `
        <div class="hack-header">
            <h3>Bypass Available</h3>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Exclusive offer from the Support Team</p>
        </div>
        <div class="hack-content">
            <div class="hack-warning">
                <p><strong>Warning:</strong> This tool bypasses DRM protections and violates the Terms of Service. Use at your own risk.</p>
            </div>
            <p style="text-align: center; color: #666; margin-bottom: 20px;">
                Instantly unlock all cosmetics and gain 100+ coolness points
            </p>
            <div class="hack-price">
                $${hackPrice} USD
                <span class="hack-price-small">Current BradCoin value: $${bradCoin.toFixed(2)}</span>
                ${!canAfford ? '<span class="hack-price-small" style="color: #ea4335; display: block; margin-top: 8px;">Insufficient funds - Try not to spend on useless stuff next time!</span>' : ''}
            </div>
            <div class="hack-buttons">
                <button class="hack-decline" onclick="closeHackOffer()">No Thanks</button>
                <button class="hack-accept" onclick="acceptHack()" ${!canAfford ? 'disabled style="opacity: 0.5; cursor: not-allowed;"' : ''}>Accept Offer</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

function closeHackOffer() {
    document.querySelector('.hack-overlay')?.remove();
    document.querySelector('.hack-popup')?.remove();
}

function acceptHack() {
    const hackPrice = 200;
    
    // Check if can afford
    if (bradCoin < hackPrice) {
        showSuccess(`Need $${hackPrice}, you only have $${bradCoin.toFixed(2)}!`);
        return;
    }
    
    // Deduct the cost
    bradCoin -= hackPrice;
    updateBradCoinDisplay();
    
    // Apply all cosmetics
    cosmetics.forEach(item => {
        if (!purchasedCosmetics.find(c => c.id === item.id)) {
            purchasedCosmetics.push(item);
            coolnessScore += item.coolness;
            
            // Apply visual effect
            const container = document.querySelector('.captcha-container');
            const currentStyle = container.getAttribute('style') || '';
            container.setAttribute('style', currentStyle + item.effect);
            
            // Apply visual element if it has one
            if (item.visual) {
                applyCosmeticVisual(item.id);
            }
        }
    });
    
    // Add violation
    trackingData.violations.push('DRM circumvention (used unauthorized bypass tool)');
    trackingData.violations.push('Terms of Service violation (used prohibited third-party tools)');
    
    userData.usedHack = true;
    
    // Update displays
    updateCoolnessScore();
    updateCosmeticsShop();
    
    closeHackOffer();
    showSuccess('All cosmetics unlocked!');
    
    // Automatically proceed to next step - no need to click retry button
    setTimeout(() => {
        nextStep();
    }, 1500);
}

// File Upload
function setupFileUpload(containerId, inputEl, callback) {
    const container = document.getElementById(containerId);
    
    container.addEventListener('click', () => {
        inputEl.click();
    });
    
    container.addEventListener('dragover', (e) => {
        e.preventDefault();
        container.style.borderColor = '#4285f4';
    });
    
    container.addEventListener('dragleave', () => {
        container.style.borderColor = '#ccc';
    });
    
    container.addEventListener('drop', (e) => {
        e.preventDefault();
        container.style.borderColor = '#ccc';
        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileUpload(file, container, callback);
        }
    });
    
    inputEl.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            handleFileUpload(file, container, callback);
        }
    });
}

function handleFileUpload(file, container, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const dataURL = e.target.result;
        container.classList.add('has-file');
        container.innerHTML = `
            <img src="${dataURL}" class="upload-preview" alt="Preview">
            <p style="margin-top: 12px; font-size: 13px; color: #34a853;">✓ ${file.name}</p>
        `;
        callback(file, dataURL);
    };
    reader.readAsDataURL(file);
}

// OAuth
function handleOAuthLogin(provider) {
    userData.oauthProvider = provider;
    trackingData.formsSubmitted++;
    
    showLoading();
    setTimeout(() => {
        hideLoading();
        showSuccess(`Connected with ${provider}!`);
        
        setTimeout(() => {
            // Check coolness first
            updateCoolnessScore();
            nextStep();
            
            // If coolness is too low, they'll be blocked at step 10
        }, 800);
    }, 2000);
}

// Feed
function initializeFeed() {
    console.log('Feed initialized, profilePicDataURL:', profilePicDataURL?.substring(0, 50)); // Debug
    
    const feedPosts = document.getElementById('feed-posts');
    const posts = [
        {
            type: 'rage',
            user: 'ControversialTakes',
            time: '2h ago',
            content: 'Hot take: Pineapple on pizza is actually a hate crime. If you disagree, you\'re part of the problem. This is the hill I will die on.',
            avatar: 'C'
        },
        {
            type: 'uplifting',
            user: 'WholesomeMemes',
            time: '1h ago',
            content: 'Just saw someone help an elderly person cross the street and then a dog gave them a high five. Faith in humanity: restored.',
            avatar: 'W'
        },
        {
            type: 'rage',
            user: 'TechBroOpinions',
            time: '30m ago',
            content: 'People who use light mode are objectively wrong and probably sociopaths. I don\'t make the rules. Dark mode or delete your account.',
            avatar: 'T'
        }
    ];
    
    let postsShown = 0;
    
    function showNextPost() {
        if (postsShown < posts.length) {
            const post = posts[postsShown];
            const postEl = document.createElement('div');
            postEl.className = 'feed-post';
            
            // Use profile picture for second post if available
            console.log('Showing post', postsShown, 'profilePicDataURL exists:', !!profilePicDataURL); // Debug
            
            const avatarContent = (postsShown === 1 && profilePicDataURL) 
                ? `<img src="${profilePicDataURL}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover; border: 2px solid #ddd;" alt="Profile">`
                : `<div class="post-avatar">${post.avatar}</div>`;
            
            postEl.innerHTML = `
                <div class="post-header">
                    ${avatarContent}
                    <div>
                        <div class="post-user">${post.user}</div>
                        <div class="post-time">${post.time}</div>
                    </div>
                </div>
                <div class="post-content">${post.content}</div>
                <div class="post-actions">
                    <span class="post-action">Like</span>
                    <span class="post-action">Comment</span>
                    <span class="post-action">Share</span>
                </div>
            `;
            feedPosts.appendChild(postEl);
            postsShown++;
            
            // Trigger copyright popup after showing the post with profile pic
            if (postsShown === 2 && profilePicDataURL) {
                console.log('Triggering copyright popup in 2 seconds...'); // Debug
                setTimeout(() => {
                    console.log('Showing copyright popup now'); // Debug
                    showCopyrightViolationPopup();
                }, 2000);
            } else {
                console.log('Not triggering popup - postsShown:', postsShown, 'profilePicDataURL:', !!profilePicDataURL); // Debug
            }
            
            if (postsShown >= posts.length) {
                document.getElementById('feed-end').style.display = 'block';
            }
        }
    }
    
    // Show posts with delay
    showNextPost();
    setTimeout(showNextPost, 2000);
    setTimeout(showNextPost, 4000);
}

// Copyright Violation Popup
function showCopyrightViolationPopup() {
    const overlay = document.createElement('div');
    overlay.className = 'hack-overlay';
    
    const popup = document.createElement('div');
    popup.className = 'hack-popup';
    popup.innerHTML = `
        <div class="hack-header" style="background: linear-gradient(135deg, #ea4335 0%, #c5221f 100%);">
            <h3>Copyright Violation Detected</h3>
            <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Legal Notice</p>
        </div>
        <div class="hack-content">
            <div class="hack-warning">
                <p><strong>Notice:</strong> Our automated systems have detected that your profile picture may contain copyrighted material.</p>
            </div>
            <p style="text-align: center; color: #666; margin: 20px 0; line-height: 1.6;">
                Using copyrighted characters as profile pictures may violate intellectual property rights. 
                You must download and review the evidence before proceeding.
            </p>
            <div class="hack-buttons">
                <button class="hack-accept" onclick="downloadProfilePicAndClose()" style="width: 100%;">
                    Download Evidence & Continue
                </button>
            </div>
            <p style="font-size: 11px; color: #999; margin-top: 12px; text-align: center;">
                You cannot proceed without downloading the evidence file.
            </p>
        </div>
    `;
    
    document.body.appendChild(overlay);
    document.body.appendChild(popup);
}

function downloadProfilePicAndClose() {
    if (!profilePicDataURL) return;
    
    // Create download link
    const link = document.createElement('a');
    link.href = profilePicDataURL;
    link.download = 'copyright_evidence.png';
    link.click();
    
    // Add violation
    trackingData.violations.push('Copyright infringement (unauthorized redistribution of copyrighted material)');
    trackingData.violations.push('DMCA violation (downloaded and redistributed protected content)');
    
    // Close popup
    document.querySelector('.hack-overlay')?.remove();
    document.querySelector('.hack-popup')?.remove();
    
    showSuccess('Evidence downloaded. Violation recorded.');
}

// Dashboard Population
async function populateDashboard() {
    // Get real IP address and location
    const ipAddress = await getUserIP();
    const location = await getUserLocation();
    
    // Personal data
    document.getElementById('collected-name').textContent = userData.name || '—';
    document.getElementById('collected-email').textContent = userData.email || '—';
    document.getElementById('collected-password').textContent = userData.password || '—';
    document.getElementById('collected-card').textContent = userData.cardNumber || '—';
    document.getElementById('collected-ip').textContent = ipAddress;
    document.getElementById('collected-browser').textContent = navigator.userAgent.split(' ').slice(-2).join(' ');
    document.getElementById('collected-screen').textContent = `${window.screen.width}x${window.screen.height}`;
    
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    document.getElementById('collected-time').textContent = `${minutes}m ${seconds}s`;
    
    // Add location to the data grid
    const ipItem = document.getElementById('collected-ip').parentElement;
    const locationItem = document.createElement('div');
    locationItem.className = 'data-item';
    locationItem.innerHTML = `<strong>Location:</strong> <span>${location}</span>`;
    ipItem.parentElement.insertBefore(locationItem, ipItem.nextSibling);
    
    // Behavioral data
    document.getElementById('total-clicks').textContent = trackingData.clicks;
    document.getElementById('popups-dismissed').textContent = trackingData.popupsDismissed;
    document.getElementById('forms-submitted').textContent = trackingData.formsSubmitted;
    document.getElementById('files-uploaded').textContent = trackingData.filesUploaded;
    
    // Rights surrendered
    const rightsList = document.getElementById('rights-list');
    trackingData.rightsSurrendered.forEach(right => {
        const li = document.createElement('li');
        li.textContent = '✓ ' + right;
        rightsList.appendChild(li);
    });
    
    // Violations
    const violationsList = document.getElementById('violations-list');
    trackingData.violations.forEach(violation => {
        const li = document.createElement('li');
        li.textContent = violation;
        violationsList.appendChild(li);
    });
}

// Random Popup Ads
function startRandomPopups() {    
    function createPopup() {
        const popup = document.createElement('div');
        popup.className = 'popup-ad';
        popup.style.left = Math.random() * (window.innerWidth - 300) + 'px';
        popup.style.top = Math.random() * (window.innerHeight - 200) + 'px';
        
        popup.innerHTML = `
            <button class="popup-close" onclick="this.parentElement.remove(); trackingData.popupsDismissed++;">×</button>
            <p style="text-align: center; margin-bottom: 12px; font-weight: bold;">Class Meme Alert! 🎓</p>
            <p style="font-size: 12px; color: #666;">Check out these dank memes from CS 183!</p>
        `;
        
        document.getElementById('popup-container').appendChild(popup);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (popup.parentElement) {
                popup.remove();
            }
        }, 10000);
    }
    
    // Create popup every 15-30 seconds
    setInterval(() => {
        if (currentStep > 2 && Math.random() > 0.5) {
            createPopup();
        }
    }, 20000);
}

// IP Tracking Popup (shows after signup)
async function showIPTrackingPopup() {
    const ip = await getUserIP();
    const location = await getUserLocation();
    
    const popup = document.createElement('div');
    popup.className = 'popup-ad';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.maxWidth = '400px';
    popup.style.border = '3px solid #ea4335';
    popup.style.zIndex = '1500';
    
    popup.innerHTML = `
        <button class="popup-close" onclick="this.parentElement.remove(); trackingData.popupsDismissed++;">×</button>
        <div style="padding: 10px; text-align: center;">
            <h3 style="margin: 0 0 12px 0; color: #ea4335;">Security Notice</h3>
            <p style="margin-bottom: 12px; font-size: 13px;">We've detected your connection:</p>
            <div style="background: #f9f9f9; padding: 12px; border-radius: 6px; margin-bottom: 12px;">
                <p style="margin: 4px 0; font-size: 13px;"><strong>IP Address:</strong> ${ip}</p>
                <p style="margin: 4px 0; font-size: 13px;"><strong>Location:</strong> ${location}</p>
            </div>
            <p style="font-size: 11px; color: #666; line-height: 1.4;">This information is stored for security purposes and may be shared with our 847 partners.</p>
        </div>
    `;
    
    document.getElementById('popup-container').appendChild(popup);
    
    // Auto-remove after 8 seconds
    setTimeout(() => {
        if (popup.parentElement) {
            popup.remove();
            trackingData.popupsDismissed++;
        }
    }, 8000);
}

// Skip Menu Functions
function showSkipMenu() {
    document.getElementById('skip-menu').style.display = 'block';
    document.getElementById('skip-overlay').style.display = 'block';
}

function closeSkipMenu() {
    document.getElementById('skip-menu').style.display = 'none';
    document.getElementById('skip-overlay').style.display = 'none';
}

function skipToStep(targetStep) {
    console.log('Skipping to step:', targetStep);
    
    // Auto-fill required data based on target step
    if (targetStep >= 3) {
        // Need account data
        userData.name = "Brad Rosen";
        userData.email = "brad.rosen@yale.edu";
        userData.password = "SecurePass123!";
    }
    
    if (targetStep >= 5) {
        // Need card data
        userData.cardNumber = "1234 5678 9012 3456";
        userData.cardExpiry = "12/25";
        userData.cardCVV = "123";
    }
    
    if (targetStep >= 6) {
        // Need BradCoin - show counter and start devaluation
        bradCoin = 1000;
        const counter = document.getElementById('bradcoin-counter');
        if (counter) {
            counter.style.display = 'flex';
        }
    }
    
    if (targetStep >= 9) {
        // Need profile pic for feed - create placeholder
        if (!profilePicDataURL) {
            profilePicDataURL = createPlaceholderProfilePic();
            localStorage.setItem('profilePicDataURL', profilePicDataURL);
        }
    }
    
    if (targetStep >= 11) {
        // Need coolness - auto-apply all cosmetics
        bradCoin = 200; // Set to hack price
        userData.usedHack = true;
        coolnessScore = 115;
        
        // Apply all cosmetics
        cosmetics.forEach(item => {
            if (!purchasedCosmetics.find(c => c.id === item.id)) {
                purchasedCosmetics.push(item);
                const container = document.querySelector('.captcha-container');
                const currentStyle = container.getAttribute('style') || '';
                container.setAttribute('style', currentStyle + item.effect);
                if (item.visual) {
                    applyCosmeticVisual(item.id);
                }
            }
        });
        
        // Show BradCoin counter
        const counter = document.getElementById('bradcoin-counter');
        if (counter) {
            counter.style.display = 'flex';
        }
    }
    
    // Hide all steps
    document.querySelectorAll('.step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStepEl = document.getElementById(`step-${targetStep}`);
    if (targetStepEl) {
        targetStepEl.classList.add('active');
        currentStep = targetStep;
        
        // Trigger step-specific initialization
        if (targetStep === 6) {
            setTimeout(() => {
                startCryptoDevaluation();
                setTimeout(() => showCosmeticsPopup(), 1000);
            }, 100);
        }
        if (targetStep === 11) {
            updateCoolnessScore();
        }
        if (targetStep === 12) {
            initializeFeed();
        }
        if (targetStep === 13) {
            populateDashboard();
        }
    }
    
    closeSkipMenu();
    showSuccess(`Skipped to Step ${targetStep}!`);
}

function createPlaceholderProfilePic() {
    // Create a simple canvas with initials
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#4285f4';
    ctx.fillRect(0, 0, 100, 100);
    ctx.fillStyle = 'white';
    ctx.font = 'bold 40px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BR', 50, 50);
    
    return canvas.toDataURL();
}