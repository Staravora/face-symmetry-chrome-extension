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
                border: 2px dashed #00ff00 !important;
                background: rgba(0, 255, 0, 0.1) !important;
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
                background: rgba(0, 0, 0, 0.8) !important;
                color: white !important;
                padding: 15px !important;
                border-radius: 8px !important;
                font-family: Arial, sans-serif !important;
                font-size: 14px !important;
                z-index: 2147483642 !important;
                min-width: 200px !important;
            `);
            
            const platformText = this.isYouTube ? 'YouTube detected - Using tab capture' : 'Standard capture mode';
            this.updateControls(`${platformText}<br>Draw a rectangle around the face`);
        }

        updateControls(status) {
            if (!this.controls) return;
            
            if (this.mode === 'select') {
                this.controls.innerHTML = `
                    <div style="margin-bottom: 10px; color: #ccc;">${status}</div>
                    <button id="reset-btn" style="background: #666; color: white; border: none; padding: 8px 12px; margin: 3px; border-radius: 4px; cursor: pointer;">Reset</button>
                    <button id="close-btn" style="background: #f44336; color: white; border: none; padding: 8px 12px; margin: 3px; border-radius: 4px; cursor: pointer;">Close</button>
                `;
            } else if (this.mode === 'ready') {
                const isProcessing = status.includes('Processing');
                this.controls.innerHTML = `
                    <div style="margin-bottom: 10px; color: #ccc;">${status}</div>
                    <button id="flip-left-btn" style="background: ${isProcessing ? '#999' : '#4CAF50'}; color: white; border: none; padding: 10px; margin: 3px 0; border-radius: 4px; cursor: ${isProcessing ? 'not-allowed' : 'pointer'}; width: 100%; display: block;" ${isProcessing ? 'disabled' : ''}>Mirror Person's Left Side</button>
                    <button id="flip-right-btn" style="background: ${isProcessing ? '#999' : '#4CAF50'}; color: white; border: none; padding: 10px; margin: 3px 0; border-radius: 4px; cursor: ${isProcessing ? 'not-allowed' : 'pointer'}; width: 100%; display: block;" ${isProcessing ? 'disabled' : ''}>Mirror Person's Right Side</button>
                    <button id="reset-btn" style="background: #666; color: white; border: none; padding: 6px 10px; margin: 3px; border-radius: 4px; cursor: pointer;">Reset</button>
                    <button id="close-btn" style="background: #f44336; color: white; border: none; padding: 6px 10px; margin: 3px; border-radius: 4px; cursor: pointer;">Close</button>
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
                border: 2px dashed #00ff00 !important;
                background: rgba(0, 255, 0, 0.1) !important;
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
                border: 2px dashed #00ff00 !important;
                background: rgba(0, 255, 0, 0.1) !important;
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
            const tickLength = 20; // Length of tick marks
            
            // Create top tick mark
            this.topTick = document.createElement('div');
            this.topTick.id = 'symmetry-top-tick';
            this.topTick.setAttribute('style', `
                position: fixed !important;
                left: ${centerX - 1}px !important;
                top: ${this.currentSelection.top - tickLength}px !important;
                width: 3px !important;
                height: ${tickLength}px !important;
                background: #ff0000 !important;
                cursor: ew-resize !important;
                z-index: 2147483643 !important;
                pointer-events: all !important;
            `);
            
            // Create bottom tick mark
            this.bottomTick = document.createElement('div');
            this.bottomTick.id = 'symmetry-bottom-tick';
            this.bottomTick.setAttribute('style', `
                position: fixed !important;
                left: ${centerX - 1}px !important;
                top: ${this.currentSelection.top + this.currentSelection.height}px !important;
                width: 3px !important;
                height: ${tickLength}px !important;
                background: #ff0000 !important;
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
                this.topTick.style.left = (newLeft - 1) + 'px';
                this.bottomTick.style.left = (newLeft - 1) + 'px';
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
            
            canvas.width = sourceCanvas.width;
            canvas.height = sourceCanvas.height;
            
            console.log(`Creating ${direction} mirror: centerline=${centerlineOffset}, canvas=${canvas.width}x${canvas.height}`);
            
            if (direction === 'left') {
                // LEFT SIDE MIRROR: Take left portion, mirror it across the entire canvas
                
                // First draw the original left side normally
                const leftWidth = centerlineOffset;
                ctx.drawImage(sourceCanvas, 0, 0, leftWidth, sourceCanvas.height, 0, 0, leftWidth, canvas.height);
                
                // Then draw the same left side flipped on the right side
                ctx.save();
                ctx.translate(canvas.width, 0);  // Move to right edge
                ctx.scale(-1, 1);  // Flip horizontally
                // Draw left portion starting from the flipped position
                ctx.drawImage(sourceCanvas, 0, 0, leftWidth, sourceCanvas.height, 0, 0, canvas.width - leftWidth, canvas.height);
                ctx.restore();
                
                console.log(`Left mirror: drew left ${leftWidth}px + flipped version`);
                
            } else {
                // RIGHT SIDE MIRROR: Take right portion, mirror it across the entire canvas
                
                const rightStart = centerlineOffset;
                const rightWidth = sourceCanvas.width - centerlineOffset;
                
                // First draw the flipped right side on the left
                ctx.save();
                ctx.translate(centerlineOffset, 0);  // Move to centerline
                ctx.scale(-1, 1);  // Flip horizontally
                // Draw right portion starting from position 0 (which becomes flipped)
                ctx.drawImage(sourceCanvas, rightStart, 0, rightWidth, sourceCanvas.height, 0, 0, centerlineOffset, canvas.height);
                ctx.restore();
                
                // Then draw the original right side normally
                ctx.drawImage(sourceCanvas, rightStart, 0, rightWidth, sourceCanvas.height, rightStart, 0, rightWidth, canvas.height);
                
                console.log(`Right mirror: drew flipped right + original right ${rightWidth}px`);
            }
            
            return canvas;
        }

        showResult(canvas, direction) {
            const resultDiv = document.createElement('div');
            resultDiv.id = 'symmetry-result-dialog';
            resultDiv.setAttribute('style', `
                position: fixed !important;
                top: 50% !important;
                left: 50% !important;
                transform: translate(-50%, -50%) !important;
                background: white !important;
                border: 3px solid #333 !important;
                border-radius: 8px !important;
                padding: 20px !important;
                z-index: 2147483647 !important;
                box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
                max-width: 90vw !important;
                max-height: 90vh !important;
                overflow: auto !important;
            `);
            
            // Swapped labels: direction is already swapped in flipFace(), so we need to swap it back for display
            const sideName = direction === 'left' ? "Person's Right" : "Person's Left";
            const platformText = this.isYouTube ? ' (YouTube)' : '';
            resultDiv.innerHTML = `
                <h3 style="margin-top: 0; color: #333; text-align: center;">${sideName} Side Mirrored${platformText}</h3>
                <div style="text-align: center; margin: 15px 0;">
                    <button class="result-download-btn" style="background: #4CAF50; color: white; border: none; padding: 10px 15px; margin: 5px; border-radius: 4px; cursor: pointer;">Download</button>
                    <button class="result-try-again-btn" style="background: #2196F3; color: white; border: none; padding: 10px 15px; margin: 5px; border-radius: 4px; cursor: pointer;">Try Again</button>
                    <button class="result-close-btn" style="background: #666; color: white; border: none; padding: 10px 15px; margin: 5px; border-radius: 4px; cursor: pointer;">Close</button>
                </div>
            `;
            
            canvas.setAttribute('style', `
                max-width: 500px !important;
                max-height: 500px !important;
                border: 1px solid #ccc !important;
                display: block !important;
                margin: 10px auto !important;
            `);
            
            resultDiv.insertBefore(canvas, resultDiv.lastElementChild);
            document.body.appendChild(resultDiv);
            
            // Add event listeners with proper error handling for downloads
            const downloadBtn = resultDiv.querySelector('.result-download-btn');
            const tryAgainBtn = resultDiv.querySelector('.result-try-again-btn');  
            const closeBtn = resultDiv.querySelector('.result-close-btn');
            
            const downloadHandler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                try {
                    // Create download with more robust method
                    const dataURL = canvas.toDataURL('image/png', 1.0);
                    
                    // Validate the dataURL has actual image data
                    if (dataURL === 'data:,') {
                        console.error('Canvas is empty or corrupted');
                        alert('Download failed: Image data is empty. Try processing again.');
                        return;
                    }
                    
                    const link = document.createElement('a');
                    link.download = `face-symmetry-${direction}-${Date.now()}.png`;
                    link.href = dataURL;
                    
                    // Force download using click simulation
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
            
            if (downloadBtn) downloadBtn.addEventListener('click', downloadHandler);
            if (tryAgainBtn) tryAgainBtn.addEventListener('click', tryAgainHandler);  
            if (closeBtn) closeBtn.addEventListener('click', closeHandler);
            
            console.log('Result dialog created with enhanced download functionality');
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
            const results = document.querySelectorAll('[style*="z-index: 2147483647"]');
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