// Face Symmetry Tool - Full Implementation with YouTube Support

(function() {
    'use strict';

    console.log('Face Symmetry Tool loading...');

    class FaceSymmetryTool {
        constructor() {
            this.isActive = false;
            this.isDrawing = false;
            this.startPoint = null;
            this.currentSelection = null;
            this.centerLine = null;
            this.topTick = null;
            this.bottomTick = null;
            this.overlay = null;
            this.selectionBox = null;
            this.controls = null;
            this.mode = 'select'; // 'select', 'centerline', 'ready'
            this.isYouTube = window.location.hostname.includes('youtube.com');
        }

        async activate() {
            if (this.isActive) return;

            console.log('Activating Face Symmetry Tool...');

            await this.waitForBody();

            this.isActive = true;
            this.createInterface();
            this.attachEventListeners();

            // Prevent page scrolling
            document.body.style.overflow = 'hidden';

            console.log('Face Symmetry Tool activated');
        }

        deactivate() {
            if (!this.isActive) return;

            console.log('Deactivating Face Symmetry Tool...');

            this.isActive = false;
            this.cleanup();

            // Restore page scrolling
            document.body.style.overflow = '';

            console.log('Face Symmetry Tool deactivated');
        }

        waitForBody() {
            return new Promise((resolve) => {
                if (document.body) {
                    resolve();
                } else {
                    const observer = new MutationObserver((mutations, obs) => {
                        if (document.body) {
                            obs.disconnect();
                            resolve();
                        }
                    });
                    observer.observe(document.documentElement, {
                        childList: true,
                        subtree: true
                    });
                }
            });
        }

        createInterface() {
            // Create main overlay for drawing
            this.overlay = document.createElement('div');
            this.overlay.id = 'symmetry-main-overlay';
            this.overlay.setAttribute('style', `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                background: rgba(0, 0, 0, 0.1) !important;
                cursor: crosshair !important;
                z-index: 2147483640 !important;
                pointer-events: all !important;
                user-select: none !important;
            `);
            document.body.appendChild(this.overlay);

            // Create selection box (initially hidden)
            this.selectionBox = document.createElement('div');
            this.selectionBox.id = 'symmetry-selection-box';
            this.selectionBox.setAttribute('style', `
                position: fixed !important;
                border: 2px solid rgba(100, 200, 255, 0.8) !important;
                background: rgba(100, 200, 255, 0.08) !important;
                display: none !important;
                z-index: 2147483641 !important;
                pointer-events: none !important;
            `);
            document.body.appendChild(this.selectionBox);

            // Create controls panel
            this.controls = document.createElement('div');
            this.controls.id = 'symmetry-controls';
            this.controls.setAttribute('style', `
                position: fixed !important;
                top: 20px !important;
                right: 20px !important;
                background: rgba(15, 15, 20, 0.92) !important;
                backdrop-filter: blur(10px) !important;
                -webkit-backdrop-filter: blur(10px) !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                color: white !important;
                padding: 16px !important;
                border-radius: 10px !important;
                font-family: Arial, sans-serif !important;
                font-size: 14px !important;
                z-index: 2147483642 !important;
                min-width: 210px !important;
            `);

            const platformText = this.isYouTube ? 'YouTube detected - Using tab capture' : 'Standard capture mode';
            this.updateControls(`${platformText}<br>Draw a rectangle around the face`);
        }

        updateControls(status) {
            if (!this.controls) return;

            const btnBase = `color: white; border: none; padding: 8px 14px; margin: 3px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;`;

            if (this.mode === 'select') {
                this.controls.innerHTML = `
                    <div style="margin-bottom: 10px; color: #9ca3af; font-size: 13px;">${status}</div>
                    <button id="reset-btn" style="background: #4b5563; ${btnBase}">Reset</button>
                    <button id="close-btn" style="background: #ef4444; ${btnBase}">Close</button>
                `;
            } else if (this.mode === 'ready') {
                const isProcessing = status.includes('Processing') || status.includes('Analyzing');
                this.controls.innerHTML = `
                    <div style="margin-bottom: 10px; color: #9ca3af; font-size: 13px;">${status}</div>
                    <button id="analyze-face-btn" style="background: ${isProcessing ? '#6b7280' : '#8b5cf6'}; ${btnBase} width: 100%; display: block; padding: 10px; cursor: ${isProcessing ? 'not-allowed' : 'pointer'};" ${isProcessing ? 'disabled' : ''}>Analyze Face</button>
                    <button id="flip-left-btn" style="background: ${isProcessing ? '#6b7280' : '#22c55e'}; ${btnBase} width: 100%; display: block; padding: 10px; cursor: ${isProcessing ? 'not-allowed' : 'pointer'};" ${isProcessing ? 'disabled' : ''}>Mirror Person's Left Side</button>
                    <button id="flip-right-btn" style="background: ${isProcessing ? '#6b7280' : '#22c55e'}; ${btnBase} width: 100%; display: block; padding: 10px; cursor: ${isProcessing ? 'not-allowed' : 'pointer'};" ${isProcessing ? 'disabled' : ''}>Mirror Person's Right Side</button>
                    <div style="margin-top: 4px;">
                        <button id="reset-btn" style="background: #4b5563; ${btnBase}">Reset</button>
                        <button id="close-btn" style="background: #ef4444; ${btnBase}">Close</button>
                    </div>
                `;
            }

            document.body.appendChild(this.controls);

            // Add button event listeners
            this.addControlEventListeners();
        }

        addControlEventListeners() {
            const resetBtn = document.getElementById('reset-btn');
            const closeBtn = document.getElementById('close-btn');
            const flipLeftBtn = document.getElementById('flip-left-btn');
            const flipRightBtn = document.getElementById('flip-right-btn');
            const analyzeFaceBtn = document.getElementById('analyze-face-btn');

            if (resetBtn) {
                resetBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.removeExistingResults();
                    this.reset();
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.deactivate();
                });
            }

            if (flipLeftBtn && !flipLeftBtn.disabled) {
                flipLeftBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.flipFace('right'); // Swapped: person's left is viewer's right
                });
            }

            if (flipRightBtn && !flipRightBtn.disabled) {
                flipRightBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.flipFace('left'); // Swapped: person's right is viewer's left
                });
            }

            if (analyzeFaceBtn && !analyzeFaceBtn.disabled) {
                analyzeFaceBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.analyzeGeneral();
                });
            }
        }

        attachEventListeners() {
            // Mouse event handlers
            this.mouseDownHandler = (e) => this.handleMouseDown(e);
            this.mouseMoveHandler = (e) => this.handleMouseMove(e);
            this.mouseUpHandler = (e) => this.handleMouseUp(e);
            this.keyHandler = (e) => this.handleKeyPress(e);

            // Attach to overlay
            this.overlay.addEventListener('mousedown', this.mouseDownHandler, true);
            document.addEventListener('mousemove', this.mouseMoveHandler, true);
            document.addEventListener('mouseup', this.mouseUpHandler, true);
            document.addEventListener('keydown', this.keyHandler, true);

            // Prevent default behaviors
            this.overlay.addEventListener('contextmenu', (e) => e.preventDefault(), true);
            this.overlay.addEventListener('selectstart', (e) => e.preventDefault(), true);
            this.overlay.addEventListener('dragstart', (e) => e.preventDefault(), true);
        }

        handleMouseDown(e) {
            if (!this.isActive || this.mode !== 'select') return;

            // Don't interfere with control buttons
            if (e.target.closest('#symmetry-controls')) return;

            e.preventDefault();
            e.stopPropagation();

            this.isDrawing = true;
            this.startPoint = { x: e.clientX, y: e.clientY };

            // Show selection box at start point
            this.selectionBox.setAttribute('style', `
                position: fixed !important;
                border: 2px solid rgba(100, 200, 255, 0.8) !important;
                background: rgba(100, 200, 255, 0.08) !important;
                display: block !important;
                z-index: 2147483641 !important;
                pointer-events: none !important;
                left: ${this.startPoint.x}px !important;
                top: ${this.startPoint.y}px !important;
                width: 0px !important;
                height: 0px !important;
            `);
        }

        handleMouseMove(e) {
            if (!this.isActive || !this.isDrawing || this.mode !== 'select') return;

            e.preventDefault();

            const currentPoint = { x: e.clientX, y: e.clientY };
            const width = Math.abs(currentPoint.x - this.startPoint.x);
            const height = Math.abs(currentPoint.y - this.startPoint.y);
            const left = Math.min(this.startPoint.x, currentPoint.x);
            const top = Math.min(this.startPoint.y, currentPoint.y);

            // Update selection box
            this.selectionBox.setAttribute('style', `
                position: fixed !important;
                border: 2px solid rgba(100, 200, 255, 0.8) !important;
                background: rgba(100, 200, 255, 0.08) !important;
                display: block !important;
                z-index: 2147483641 !important;
                pointer-events: none !important;
                left: ${left}px !important;
                top: ${top}px !important;
                width: ${width}px !important;
                height: ${height}px !important;
            `);
        }

        handleMouseUp(e) {
            if (!this.isActive || !this.isDrawing || this.mode !== 'select') return;

            e.preventDefault();
            e.stopPropagation();

            this.isDrawing = false;

            const currentPoint = { x: e.clientX, y: e.clientY };
            const width = Math.abs(currentPoint.x - this.startPoint.x);
            const height = Math.abs(currentPoint.y - this.startPoint.y);
            const left = Math.min(this.startPoint.x, currentPoint.x);
            const top = Math.min(this.startPoint.y, currentPoint.y);

            // Check minimum size
            if (width < 50 || height < 50) {
                this.selectionBox.style.display = 'none';
                this.updateControls('Selection too small. Try again.');
                return;
            }

            // Store selection
            this.currentSelection = { left, top, width, height };

            // Create centerline tick marks
            this.createCenterlineTicks();

            // Switch to ready mode
            this.mode = 'ready';
            this.updateControls('Drag the red marks to adjust centerline');
        }

        handleKeyPress(e) {
            if (!this.isActive) return;

            if (e.key === 'Escape') {
                e.preventDefault();
                this.deactivate();
            }
        }

        createCenterlineTicks() {
            const centerX = this.currentSelection.left + this.currentSelection.width / 2;
            const tickLength = 20;

            // Create top tick mark
            this.topTick = document.createElement('div');
            this.topTick.id = 'symmetry-top-tick';
            this.topTick.setAttribute('style', `
                position: fixed !important;
                left: ${centerX - 2}px !important;
                top: ${this.currentSelection.top - tickLength}px !important;
                width: 5px !important;
                height: ${tickLength}px !important;
                background: #ff0000 !important;
                border-radius: 2px !important;
                cursor: ew-resize !important;
                z-index: 2147483643 !important;
                pointer-events: all !important;
            `);

            // Create bottom tick mark
            this.bottomTick = document.createElement('div');
            this.bottomTick.id = 'symmetry-bottom-tick';
            this.bottomTick.setAttribute('style', `
                position: fixed !important;
                left: ${centerX - 2}px !important;
                top: ${this.currentSelection.top + this.currentSelection.height}px !important;
                width: 5px !important;
                height: ${tickLength}px !important;
                background: #ff0000 !important;
                border-radius: 2px !important;
                cursor: ew-resize !important;
                z-index: 2147483643 !important;
                pointer-events: all !important;
            `);

            document.body.appendChild(this.topTick);
            document.body.appendChild(this.bottomTick);

            // Store the centerline position
            this.centerLine = centerX;

            this.makeTicksDraggable();
        }

        makeTicksDraggable() {
            let isDragging = false;
            let startX = 0;
            let initialLeft = 0;

            const onMouseDown = (e) => {
                e.preventDefault();
                e.stopPropagation();
                isDragging = true;
                startX = e.clientX;
                initialLeft = this.centerLine;
            };

            const onMouseMove = (e) => {
                if (!isDragging) return;
                e.preventDefault();

                const deltaX = e.clientX - startX;
                let newLeft = initialLeft + deltaX;

                // Constrain to selection bounds
                const minLeft = this.currentSelection.left + 5;
                const maxLeft = this.currentSelection.left + this.currentSelection.width - 5;
                newLeft = Math.max(minLeft, Math.min(maxLeft, newLeft));

                this.centerLine = newLeft;
                this.topTick.style.left = (newLeft - 2) + 'px';
                this.bottomTick.style.left = (newLeft - 2) + 'px';
            };

            const onMouseUp = (e) => {
                if (!isDragging) return;
                e.preventDefault();
                e.stopPropagation();
                isDragging = false;
            };

            this.topTick.addEventListener('mousedown', onMouseDown);
            this.bottomTick.addEventListener('mousedown', onMouseDown);
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        }

        async flipFace(direction) {
            if (!this.currentSelection || this.centerLine === null) return;

            try {
                this.updateControls('Processing image...');

                const centerlineOffset = this.centerLine - this.currentSelection.left;

                console.log(`${direction} side mirror - centerline offset: ${centerlineOffset}`);

                // Use appropriate capture method based on platform
                const sourceCanvas = await this.captureAreaSmart();
                console.log(`Source canvas captured: ${sourceCanvas.width}x${sourceCanvas.height}`);

                const flippedCanvas = this.createFlippedImage(sourceCanvas, direction, centerlineOffset);
                console.log(`Flipped canvas created: ${flippedCanvas.width}x${flippedCanvas.height}`);

                this.removeExistingResults();
                this.showResult(flippedCanvas, direction);

                // Reset controls back to ready state
                this.updateControls('Drag the red marks to adjust centerline');

            } catch (error) {
                console.error('Error creating flipped face:', error);
                this.updateControls('Error processing image. Try again.');
            }
        }

        async captureAreaSmart() {
            // Use different capture methods based on the platform
            if (this.isYouTube || this.shouldUseTabCapture()) {
                console.log('Using tab capture method for protected content');
                return await this.captureUsingTabCapture();
            } else {
                console.log('Using DOM-based capture method');
                return await this.captureAreaDOM();
            }
        }

        shouldUseTabCapture() {
            // Detect if we're dealing with protected content
            const protectedDomains = ['youtube.com', 'netflix.com', 'hulu.com', 'disney.com', 'twitch.tv'];
            const currentDomain = window.location.hostname.toLowerCase();

            return protectedDomains.some(domain => currentDomain.includes(domain)) ||
                   document.querySelector('video[src*="blob:"]') ||
                   document.querySelector('video[crossorigin]') ||
                   window.location.protocol === 'https:' && document.querySelector('video');
        }

        async captureUsingTabCapture() {
            // Hide UI elements
            const overlayDisplay = this.overlay.style.display;
            const selectionDisplay = this.selectionBox.style.display;
            const controlsDisplay = this.controls.style.display;
            const topTickDisplay = this.topTick ? this.topTick.style.display : '';
            const bottomTickDisplay = this.bottomTick ? this.bottomTick.style.display : '';

            this.overlay.style.display = 'none';
            this.selectionBox.style.display = 'none';
            this.controls.style.display = 'none';
            if (this.topTick) this.topTick.style.display = 'none';
            if (this.bottomTick) this.bottomTick.style.display = 'none';

            // Hide existing results
            const existingResults = document.querySelectorAll('#symmetry-result-dialog');
            const resultDisplays = [];
            existingResults.forEach((result, index) => {
                resultDisplays[index] = result.style.display;
                result.style.display = 'none';
            });

            return new Promise((resolve, reject) => {
                // Wait for UI to hide completely
                setTimeout(() => {
                    // Request tab capture from background script
                    chrome.runtime.sendMessage({action: 'captureTab'}, (response) => {
                        // Restore UI
                        this.overlay.style.display = overlayDisplay;
                        this.selectionBox.style.display = selectionDisplay;
                        this.controls.style.display = controlsDisplay;
                        if (this.topTick) this.topTick.style.display = topTickDisplay;
                        if (this.bottomTick) this.bottomTick.style.display = bottomTickDisplay;

                        // Restore result dialogs
                        existingResults.forEach((result, index) => {
                            result.style.display = resultDisplays[index];
                        });

                        if (response && response.success) {
                            // Convert captured tab to canvas and crop to selection
                            const img = new Image();
                            img.onload = () => {
                                const canvas = document.createElement('canvas');
                                const ctx = canvas.getContext('2d');

                                canvas.width = this.currentSelection.width;
                                canvas.height = this.currentSelection.height;

                                // Calculate pixel ratio for high DPI displays
                                const pixelRatio = window.devicePixelRatio || 1;

                                // Crop the captured image to our selection area
                                ctx.drawImage(
                                    img,
                                    this.currentSelection.left * pixelRatio,
                                    this.currentSelection.top * pixelRatio,
                                    this.currentSelection.width * pixelRatio,
                                    this.currentSelection.height * pixelRatio,
                                    0,
                                    0,
                                    canvas.width,
                                    canvas.height
                                );

                                resolve(canvas);
                            };
                            img.onerror = () => reject(new Error('Failed to load captured image'));
                            img.src = response.dataUrl;
                        } else {
                            reject(new Error(response ? response.error : 'Tab capture failed'));
                        }
                    });
                }, 300); // Longer delay for YouTube
            });
        }

        async captureAreaDOM() {
            // Original DOM-based capture method for non-protected content
            const overlayDisplay = this.overlay.style.display;
            const selectionDisplay = this.selectionBox.style.display;
            const controlsDisplay = this.controls.style.display;
            const topTickDisplay = this.topTick ? this.topTick.style.display : '';
            const bottomTickDisplay = this.bottomTick ? this.bottomTick.style.display : '';

            this.overlay.style.display = 'none';
            this.selectionBox.style.display = 'none';
            this.controls.style.display = 'none';
            if (this.topTick) this.topTick.style.display = 'none';
            if (this.bottomTick) this.bottomTick.style.display = 'none';

            const existingResults = document.querySelectorAll('#symmetry-result-dialog');
            const resultDisplays = [];
            existingResults.forEach((result, index) => {
                resultDisplays[index] = result.style.display;
                result.style.display = 'none';
            });

            return new Promise((resolve) => {
                setTimeout(() => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    canvas.width = this.currentSelection.width;
                    canvas.height = this.currentSelection.height;

                    let captured = false;

                    try {
                        // Find elements in the selection area
                        const centerX = this.currentSelection.left + this.currentSelection.width / 2;
                        const centerY = this.currentSelection.top + this.currentSelection.height / 2;
                        const elements = document.elementsFromPoint(centerX, centerY);

                        for (const element of elements) {
                            try {
                                if (element.tagName === 'IMG' && element.complete && element.naturalWidth > 0) {
                                    const rect = element.getBoundingClientRect();
                                    const scaleX = element.naturalWidth / rect.width;
                                    const scaleY = element.naturalHeight / rect.height;

                                    const sx = Math.max(0, (this.currentSelection.left - rect.left) * scaleX);
                                    const sy = Math.max(0, (this.currentSelection.top - rect.top) * scaleY);
                                    const sw = this.currentSelection.width * scaleX;
                                    const sh = this.currentSelection.height * scaleY;

                                    ctx.drawImage(element, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                                    captured = true;
                                    console.log('Successfully captured image element');
                                    break;
                                } else if (element.tagName === 'CANVAS') {
                                    const rect = element.getBoundingClientRect();
                                    const scaleX = element.width / rect.width;
                                    const scaleY = element.height / rect.height;

                                    const sx = Math.max(0, (this.currentSelection.left - rect.left) * scaleX);
                                    const sy = Math.max(0, (this.currentSelection.top - rect.top) * scaleY);
                                    const sw = this.currentSelection.width * scaleX;
                                    const sh = this.currentSelection.height * scaleY;

                                    ctx.drawImage(element, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
                                    captured = true;
                                    console.log('Successfully captured canvas element');
                                    break;
                                }
                            } catch (elementError) {
                                console.log('Failed to capture element:', elementError.message);
                                continue;
                            }
                        }
                    } catch (error) {
                        console.warn('DOM capture process failed:', error);
                    }

                    if (!captured) {
                        console.log('No real image captured, creating demo face');
                        this.createDemoFace(ctx, canvas.width, canvas.height);
                    }

                    // Restore UI
                    this.overlay.style.display = overlayDisplay;
                    this.selectionBox.style.display = selectionDisplay;
                    this.controls.style.display = controlsDisplay;
                    if (this.topTick) this.topTick.style.display = topTickDisplay;
                    if (this.bottomTick) this.bottomTick.style.display = bottomTickDisplay;

                    existingResults.forEach((result, index) => {
                        result.style.display = resultDisplays[index];
                    });

                    resolve(canvas);
                }, 200);
            });
        }

        removeExistingResults() {
            const existingResults = document.querySelectorAll('#symmetry-result-dialog');
            existingResults.forEach(result => {
                if (result.parentNode) {
                    result.parentNode.removeChild(result);
                }
            });
        }

        createDemoFace(ctx, width, height) {
            // Create a realistic demo face for testing the mirroring functionality
            console.log(`Creating demo face: ${width}x${height}`);

            // Background
            ctx.fillStyle = '#e8c5a0'; // Skin tone
            ctx.fillRect(0, 0, width, height);

            const centerX = width / 2;
            const centerY = height / 2;

            // Make the face slightly asymmetric to test mirroring

            // Left eye (viewer's left, person's right)
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(centerX - width * 0.15, centerY - height * 0.1, width * 0.05, height * 0.03, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Left eyebrow
            ctx.fillStyle = '#654321';
            ctx.fillRect(centerX - width * 0.22, centerY - height * 0.18, width * 0.14, height * 0.02);

            // Right eye (viewer's right, person's left) - make it different
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.ellipse(centerX + width * 0.15, centerY - height * 0.08, width * 0.04, height * 0.04, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Right eyebrow - different shape
            ctx.fillStyle = '#654321';
            ctx.beginPath();
            ctx.arc(centerX + width * 0.15, centerY - height * 0.16, width * 0.08, 0, Math.PI);
            ctx.fill();

            // Nose (slightly off-center)
            ctx.fillStyle = '#d4a574';
            ctx.beginPath();
            ctx.ellipse(centerX + width * 0.01, centerY + height * 0.02, width * 0.025, height * 0.06, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Mouth (asymmetric smile)
            ctx.strokeStyle = '#8B4513';
            ctx.lineWidth = Math.max(2, width * 0.008);
            ctx.beginPath();
            ctx.quadraticCurveTo(centerX - width * 0.08, centerY + height * 0.18, centerX, centerY + height * 0.2);
            ctx.quadraticCurveTo(centerX + width * 0.06, centerY + height * 0.22, centerX + width * 0.1, centerY + height * 0.18);
            ctx.stroke();

            // Left cheek mark
            ctx.fillStyle = '#cd9575';
            ctx.beginPath();
            ctx.ellipse(centerX - width * 0.25, centerY + height * 0.05, width * 0.03, height * 0.02, 0, 0, 2 * Math.PI);
            ctx.fill();

            // Hair (asymmetric)
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, 0, width, height * 0.3);
            ctx.fillRect(0, 0, width * 0.6, height * 0.4); // Left side longer

            // Add text to show this is a demo
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.fillRect(5, height - 25, width - 10, 20);
            ctx.fillStyle = '#333';
            ctx.font = `${Math.max(10, width * 0.04)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText('Demo Face - Notice Asymmetry', centerX, height - 8);
        }

        createFlippedImage(sourceCanvas, direction, centerlineOffset) {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            if (direction === 'left') {
                // LEFT SIDE MIRROR: Take left portion, mirror it to create symmetric result
                const sideWidth = centerlineOffset;
                canvas.width = sideWidth * 2;
                canvas.height = sourceCanvas.height;

                console.log(`Creating left mirror: sideWidth=${sideWidth}, output=${canvas.width}x${canvas.height}`);

                // Draw the original left side on the left half
                ctx.drawImage(sourceCanvas, 0, 0, sideWidth, sourceCanvas.height, 0, 0, sideWidth, canvas.height);

                // Draw the mirrored left side on the right half
                ctx.save();
                ctx.translate(sideWidth * 2, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(sourceCanvas, 0, 0, sideWidth, sourceCanvas.height, 0, 0, sideWidth, canvas.height);
                ctx.restore();

            } else {
                // RIGHT SIDE MIRROR: Take right portion, mirror it to create symmetric result
                const rightStart = centerlineOffset;
                const sideWidth = sourceCanvas.width - centerlineOffset;
                canvas.width = sideWidth * 2;
                canvas.height = sourceCanvas.height;

                console.log(`Creating right mirror: sideWidth=${sideWidth}, output=${canvas.width}x${canvas.height}`);

                // Draw the mirrored right side on the left half
                ctx.save();
                ctx.translate(sideWidth, 0);
                ctx.scale(-1, 1);
                ctx.drawImage(sourceCanvas, rightStart, 0, sideWidth, sourceCanvas.height, 0, 0, sideWidth, canvas.height);
                ctx.restore();

                // Draw the original right side on the right half
                ctx.drawImage(sourceCanvas, rightStart, 0, sideWidth, sourceCanvas.height, sideWidth, 0, sideWidth, canvas.height);
            }

            return canvas;
        }

        async analyzeWithGemini(canvas, mode = 'general') {
            // Get API key from storage
            const result = await new Promise((resolve) => {
                chrome.storage.sync.get(['geminiApiKey'], resolve);
            });

            const apiKey = result.geminiApiKey;
            if (!apiKey) {
                throw new Error('NO_API_KEY');
            }

            // Convert canvas to base64 (may fail on tainted cross-origin canvases)
            let base64;
            try {
                const dataUrl = canvas.toDataURL('image/png');
                base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
            } catch (e) {
                console.log('Canvas tainted, falling back to tab capture');
                // Fall back to tab capture: screenshot the visible page and crop to the canvas element
                const rect = canvas.getBoundingClientRect();
                const captureResponse = await new Promise((resolve) => {
                    chrome.runtime.sendMessage({action: 'captureTab'}, resolve);
                });
                if (!captureResponse || !captureResponse.success) {
                    throw new Error('TAINTED_CANVAS');
                }
                const cropBase64 = await new Promise((resolve, reject) => {
                    const img = new Image();
                    img.onload = () => {
                        const pixelRatio = window.devicePixelRatio || 1;
                        const cropCanvas = document.createElement('canvas');
                        cropCanvas.width = rect.width * pixelRatio;
                        cropCanvas.height = rect.height * pixelRatio;
                        const cropCtx = cropCanvas.getContext('2d');
                        cropCtx.drawImage(
                            img,
                            rect.left * pixelRatio,
                            rect.top * pixelRatio,
                            rect.width * pixelRatio,
                            rect.height * pixelRatio,
                            0, 0,
                            cropCanvas.width,
                            cropCanvas.height
                        );
                        resolve(cropCanvas.toDataURL('image/png').replace(/^data:image\/png;base64,/, ''));
                    };
                    img.onerror = () => reject(new Error('TAINTED_CANVAS'));
                    img.src = captureResponse.dataUrl;
                });
                base64 = cropBase64;
            }

            // Build prompt based on mode
            let prompt;
            if (mode === 'left' || mode === 'right') {
                const sideName = mode === 'left' ? 'LEFT' : 'RIGHT';
                const sideInterpretation = mode === 'left'
                    ? 'left side reflects the inner/emotional self'
                    : 'right side reflects the outer/public self';
                prompt = `This image shows a facial symmetry analysis where the person's ${sideName} side has been mirrored to create a full face. You are seeing only that one side, duplicated.

Describe the features on this side — eye shape, brow arch, cheekbone, jawline contour, lip corner, nostril shape — and interpret what they suggest about character and temperament. In many traditions, the ${sideInterpretation} — use that lens. Focus the body of your response on the reading itself.

Keep your response to 2-3 short paragraphs of analysis. At the very end, add a one-line note that this reading draws on the physiognomic frameworks of Peter S. Reznik and Judith A. Hill and is for entertainment/educational purposes. If any features were too obscured or blurry to read, mention them briefly in that same closing line — otherwise skip it.`;
            } else {
                prompt = `Analyze this face photo. Describe the key facial features you can see — eye shape and spacing, brow structure, nose bridge and tip, lip shape, jawline, cheekbone prominence, forehead shape, and overall proportions — and interpret what they suggest about character, temperament, and strengths. Focus the body of your response on the reading itself, not on image quality.

Keep your response to 2-3 short paragraphs of analysis. At the very end, add a one-line note that this reading draws on the physiognomic frameworks of Peter S. Reznik and Judith A. Hill and is for entertainment/educational purposes. If any features were obscured, poorly lit, or otherwise hard to make out, mention them briefly in that same closing line — otherwise skip it.`;
            }

            // Delegate to background script to avoid CORS issues
            const response = await new Promise((resolve) => {
                chrome.runtime.sendMessage(
                    { action: 'geminiAnalyze', apiKey, base64, prompt },
                    resolve
                );
            });

            if (!response || !response.success) {
                const error = response?.error || 'API_ERROR';
                const details = response?.details || '';
                console.error('Gemini analysis failed:', error, details);
                throw new Error(error);
            }

            return response.text;
        }

        showResult(canvas, direction) {
            const resultDiv = document.createElement('div');
            resultDiv.id = 'symmetry-result-dialog';
            resultDiv.setAttribute('style', `
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                background: #1a1a2e !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                border-radius: 12px !important;
                padding: 24px !important;
                z-index: 2147483647 !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow: auto !important;
                color: #e0e0e0 !important;
                font-family: Arial, sans-serif !important;
            `);

            // Swapped labels: direction is already swapped in flipFace(), so we need to swap it back for display
            const sideName = direction === 'left' ? "Person's Right" : "Person's Left";
            const platformText = this.isYouTube ? ' (YouTube)' : '';

            const btnStyle = `color: white; border: none; padding: 10px 16px; margin: 4px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;`;

            resultDiv.innerHTML = `
                <h3 style="margin: 0 0 14px 0; color: #fff; text-align: center; font-size: 16px;">${sideName} Side Mirrored${platformText}</h3>
                <div style="text-align: center; margin: 12px 0;">
                    <button class="result-download-btn" style="background: #22c55e; ${btnStyle}">Download</button>
                    <button class="result-try-again-btn" style="background: #3b82f6; ${btnStyle}">Try Again</button>
                    <button class="result-ai-btn" style="background: #8b5cf6; ${btnStyle}">AI Summary</button>
                    <button class="result-close-btn" style="background: #4b5563; ${btnStyle}">Close</button>
                </div>
                <div class="ai-result-area"></div>
            `;

            canvas.setAttribute('style', `
                max-width: 500px !important;
                max-height: 500px !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                border-radius: 8px !important;
                display: block !important;
                margin: 12px auto !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.3) !important;
            `);

            // Insert canvas before the AI result area
            const aiArea = resultDiv.querySelector('.ai-result-area');
            resultDiv.insertBefore(canvas, aiArea);
            document.body.appendChild(resultDiv);

            // Add event listeners
            const downloadBtn = resultDiv.querySelector('.result-download-btn');
            const tryAgainBtn = resultDiv.querySelector('.result-try-again-btn');
            const closeBtn = resultDiv.querySelector('.result-close-btn');
            const aiBtn = resultDiv.querySelector('.result-ai-btn');

            const downloadHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();

                try {
                    const dataURL = canvas.toDataURL('image/png', 1.0);

                    if (dataURL === 'data:,') {
                        console.error('Canvas is empty or corrupted');
                        alert('Download failed: Image data is empty. Try processing again.');
                        return;
                    }

                    const link = document.createElement('a');
                    link.download = `face-symmetry-${direction}-${Date.now()}.png`;
                    link.href = dataURL;

                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    console.log(`Successfully downloaded ${direction} mirror image`);

                } catch (error) {
                    console.error('Download failed:', error);
                    alert('Download failed. Please try again or use right-click "Save image as..." on the result.');
                }
            };

            const tryAgainHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (resultDiv.parentNode) {
                    resultDiv.parentNode.removeChild(resultDiv);
                }
                this.reset();
            };

            const closeHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (resultDiv.parentNode) {
                    resultDiv.parentNode.removeChild(resultDiv);
                }
            };

            const aiHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                // direction is the viewer-side; convert to person's side for the prompt
                const personSide = direction === 'left' ? 'right' : 'left';
                this.handleAiSummary(canvas, aiArea, aiBtn, personSide);
            };

            if (downloadBtn) downloadBtn.addEventListener('click', downloadHandler);
            if (tryAgainBtn) tryAgainBtn.addEventListener('click', tryAgainHandler);
            if (closeBtn) closeBtn.addEventListener('click', closeHandler);
            if (aiBtn) aiBtn.addEventListener('click', aiHandler);

            console.log('Result dialog created with AI Summary and enhanced download');
        }

        async handleAiSummary(canvas, aiArea, aiBtn, mode = 'general') {
            const proceed = window.confirm(
                'This will send the selected image to Google Gemini for analysis and may incur API charges. Continue?'
            );
            if (!proceed) {
                return;
            }

            // Show loading state
            aiBtn.disabled = true;
            aiBtn.textContent = 'Analyzing...';
            aiBtn.style.background = '#6b7280';
            aiBtn.style.cursor = 'not-allowed';

            aiArea.innerHTML = `
                <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 13px;">
                    Analyzing facial features...
                </div>
            `;

            try {
                const analysisText = await this.analyzeWithGemini(canvas, mode);

                aiArea.innerHTML = `
                    <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 16px; margin-top: 12px; max-height: 200px; overflow-y: auto; font-size: 14px; line-height: 1.6; color: #d1d5db;">
                        <div style="font-style: italic; color: #9ca3af; font-size: 12px; margin-bottom: 10px;">Note: This analysis is based on traditional physiognomic principles and should be taken as a general reference, not a definitive assessment.</div>
                        <div>${analysisText.replace(/\n/g, '<br>')}</div>
                    </div>
                `;

                aiBtn.textContent = 'AI Summary';
                aiBtn.disabled = false;
                aiBtn.style.background = '#8b5cf6';
                aiBtn.style.cursor = 'pointer';

            } catch (error) {
                let message;
                if (error.message === 'NO_API_KEY') {
                    message = 'No API key set. Open the extension popup and add your Gemini API key in Settings.';
                } else if (error.message === 'RATE_LIMIT') {
                    message = 'Rate limit reached. Please wait a moment and try again.';
                } else if (error.message === 'SAFETY_BLOCKED') {
                    message = 'The AI declined to analyze this image. Try a different photo or angle.';
                } else if (error.message === 'TAINTED_CANVAS') {
                    message = 'Could not extract image data from this page. Try downloading the image first and opening it locally.';
                } else {
                    message = 'Failed to analyze image. Check your API key and try again.';
                    console.error('AI analysis error:', error);
                }

                aiArea.innerHTML = `
                    <div style="background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; padding: 12px; margin-top: 12px; font-size: 13px; color: #fca5a5;">
                        ${message}
                    </div>
                `;

                aiBtn.textContent = 'Retry AI Summary';
                aiBtn.disabled = false;
                aiBtn.style.background = '#8b5cf6';
                aiBtn.style.cursor = 'pointer';
            }
        }

        async analyzeGeneral() {
            if (!this.currentSelection || this.centerLine === null) return;

            try {
                this.updateControls('Analyzing face...');

                const sourceCanvas = await this.captureAreaSmart();
                console.log(`General analysis canvas captured: ${sourceCanvas.width}x${sourceCanvas.height}`);

                this.removeExistingResults();
                this.showGeneralResult(sourceCanvas);

                // Reset controls back to ready state
                this.updateControls('Drag the red marks to adjust centerline');

            } catch (error) {
                console.error('Error capturing for general analysis:', error);
                this.updateControls('Error capturing image. Try again.');
            }
        }

        showGeneralResult(canvas) {
            const resultDiv = document.createElement('div');
            resultDiv.id = 'symmetry-result-dialog';
            resultDiv.setAttribute('style', `
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                background: #1a1a2e !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                border-radius: 12px !important;
                padding: 24px !important;
                z-index: 2147483647 !important;
                box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow: auto !important;
                color: #e0e0e0 !important;
                font-family: Arial, sans-serif !important;
            `);

            const btnStyle = `color: white; border: none; padding: 10px 16px; margin: 4px; border-radius: 6px; cursor: pointer; font-size: 13px; transition: background 0.2s;`;

            resultDiv.innerHTML = `
                <h3 style="margin: 0 0 14px 0; color: #fff; text-align: center; font-size: 16px;">Face Analysis</h3>
                <div style="text-align: center; margin: 12px 0;">
                    <button class="result-download-btn" style="background: #22c55e; ${btnStyle}">Download</button>
                    <button class="result-ai-btn" style="background: #8b5cf6; ${btnStyle}">AI Summary</button>
                    <button class="result-close-btn" style="background: #4b5563; ${btnStyle}">Close</button>
                </div>
                <div class="ai-result-area"></div>
            `;

            canvas.setAttribute('style', `
                max-width: 500px !important;
                max-height: 500px !important;
                border: 1px solid rgba(255,255,255,0.1) !important;
                border-radius: 8px !important;
                display: block !important;
                margin: 12px auto !important;
                box-shadow: 0 2px 12px rgba(0,0,0,0.3) !important;
            `);

            const aiArea = resultDiv.querySelector('.ai-result-area');
            resultDiv.insertBefore(canvas, aiArea);
            document.body.appendChild(resultDiv);

            // Add event listeners
            const downloadBtn = resultDiv.querySelector('.result-download-btn');
            const closeBtn = resultDiv.querySelector('.result-close-btn');
            const aiBtn = resultDiv.querySelector('.result-ai-btn');

            if (downloadBtn) {
                downloadBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    try {
                        const dataURL = canvas.toDataURL('image/png', 1.0);
                        if (dataURL === 'data:,') {
                            alert('Download failed: Image data is empty.');
                            return;
                        }
                        const link = document.createElement('a');
                        link.download = `face-analysis-${Date.now()}.png`;
                        link.href = dataURL;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (error) {
                        console.error('Download failed:', error);
                        alert('Download failed. Please try again.');
                    }
                });
            }

            if (closeBtn) {
                closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (resultDiv.parentNode) {
                        resultDiv.parentNode.removeChild(resultDiv);
                    }
                });
            }

            if (aiBtn) {
                aiBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    this.handleAiSummary(canvas, aiArea, aiBtn, 'general');
                });
            }
        }

        reset() {
            this.mode = 'select';
            this.isDrawing = false;
            this.startPoint = null;
            this.currentSelection = null;
            this.centerLine = null;

            if (this.selectionBox) {
                this.selectionBox.style.display = 'none';
            }

            if (this.topTick && this.topTick.parentNode) {
                this.topTick.parentNode.removeChild(this.topTick);
                this.topTick = null;
            }

            if (this.bottomTick && this.bottomTick.parentNode) {
                this.bottomTick.parentNode.removeChild(this.bottomTick);
                this.bottomTick = null;
            }

            const platformText = this.isYouTube ? 'YouTube detected - Using tab capture' : 'Standard capture mode';
            this.updateControls(`${platformText}<br>Draw a rectangle around the face`);
        }

        cleanup() {
            // Remove event listeners
            if (this.overlay && this.mouseDownHandler) {
                this.overlay.removeEventListener('mousedown', this.mouseDownHandler, true);
                document.removeEventListener('mousemove', this.mouseMoveHandler, true);
                document.removeEventListener('mouseup', this.mouseUpHandler, true);
                document.removeEventListener('keydown', this.keyHandler, true);
            }

            // Remove DOM elements
            ['symmetry-main-overlay', 'symmetry-selection-box', 'symmetry-controls', 'symmetry-top-tick', 'symmetry-bottom-tick'].forEach(id => {
                const element = document.getElementById(id);
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            });

            // Remove result dialogs
            const results = document.querySelectorAll('#symmetry-result-dialog');
            results.forEach(result => {
                if (result.parentNode) {
                    result.parentNode.removeChild(result);
                }
            });

            this.overlay = null;
            this.selectionBox = null;
            this.controls = null;
            this.topTick = null;
            this.bottomTick = null;
            this.centerLine = null;
            this.currentSelection = null;
        }
    }

    // Global instance
    window.symmetryTool = new FaceSymmetryTool();

    // Message listener for popup communication
    if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            console.log('Message received:', message);

            try {
                switch (message.action) {
                    case 'activate':
                        window.symmetryTool.activate();
                        sendResponse({status: 'activated'});
                        break;
                    case 'deactivate':
                        window.symmetryTool.deactivate();
                        sendResponse({status: 'deactivated'});
                        break;
                    case 'getStatus':
                        sendResponse({active: window.symmetryTool.isActive});
                        break;
                    default:
                        sendResponse({status: 'unknown action'});
                }
            } catch (error) {
                console.error('Error handling message:', error);
                sendResponse({status: 'error', error: error.message});
            }

            return true;
        });
    }

    console.log('Face Symmetry Tool ready');

})();
