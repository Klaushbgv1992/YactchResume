document.addEventListener('DOMContentLoaded', () => {
    const downloadPngBtn = document.getElementById('downloadPngBtn');
    const resumeElement = document.getElementById('resume-main');
    
    // Function to insert all CSS styles inline to preserve styling with exact dimensions
    function prepareElementForExport(element) {
        // Calculate the height based on the real content, not the min-height
        // First, get all direct child elements
        const children = element.children;
        let totalHeight = 0;
        for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            totalHeight = Math.max(totalHeight, rect.bottom - element.getBoundingClientRect().top);
        }
        
        // Get the actual content dimensions
        const actualHeight = totalHeight; // Use calculated height based on content
        const actualWidth = element.getBoundingClientRect().width;
        
        console.log('Measured content height:', totalHeight);
        
        // Clone the element
        const clone = element.cloneNode(true);
        
        // Create a precisely sized container
        const tempContainer = document.createElement('div');
        tempContainer.className = 'export-container';
        tempContainer.style.position = 'fixed';
        tempContainer.style.left = '-9999px';
        tempContainer.style.top = '0';
        tempContainer.style.width = actualWidth + 'px';
        tempContainer.style.height = actualHeight + 'px'; // Exact content height
        tempContainer.style.overflow = 'hidden'; // Prevent scrolling
        tempContainer.style.backgroundColor = 'white';
        tempContainer.style.margin = '0';
        tempContainer.style.padding = '0';
        document.body.appendChild(tempContainer);

        // Apply exact styling to the clone
        clone.style.margin = '0';
        clone.style.width = '100%';
        clone.style.minHeight = 'unset'; // Remove min-height
        clone.style.height = actualHeight + 'px';
        clone.style.boxShadow = 'none';
        clone.style.transform = 'none';
        clone.style.position = 'relative';
        clone.style.left = '0';
        clone.style.top = '0';

        tempContainer.appendChild(clone);
        
        console.log('Export dimensions:', actualWidth, 'x', actualHeight);
        return { container: tempContainer, clone: clone, width: actualWidth, height: actualHeight };
    }
    
    // PNG Export with simple approach to fix bottom gap
    downloadPngBtn.addEventListener('click', function() {
        // Show loading indicator
        this.textContent = 'Processing...';
        this.disabled = true;
        
        const button = this;
        
        // Use timeout to ensure UI updates
        setTimeout(() => {
            // Create a hidden container
            const container = document.createElement('div');
            container.id = 'temp-export-container';
            container.style.position = 'absolute';
            container.style.left = '-9999px';
            container.style.top = '0';
            container.style.width = '8.5in';
            container.style.backgroundColor = 'white';
            container.style.padding = '0';
            container.style.margin = '0';
            container.style.overflow = 'hidden';
            document.body.appendChild(container);
            
            // Clone the resume and make some adjustments
            const clone = resumeElement.cloneNode(true);
            clone.style.boxShadow = 'none';
            clone.style.border = 'none';
            clone.style.margin = '0';
            clone.style.padding = '0';
            clone.style.width = '8.5in';
            
            // Inject temporary styles to remove extra space
            const styleEl = document.createElement('style');
            styleEl.textContent = `
                .references-section {
                    margin-bottom: 0 !important;
                    padding-bottom: 0 !important;
                }
                .reference-columns {
                    margin-bottom: 0 !important;
                }
                #temp-export-clone {
                    height: auto !important;
                    min-height: auto !important;
                }
            `;
            document.head.appendChild(styleEl);
            
            // Fix the references section
            const referencesSection = clone.querySelector('.references-section');
            if (referencesSection) {
                referencesSection.style.marginBottom = '0';
                referencesSection.style.paddingBottom = '0';
            }
            
            // Insert clone into container
            container.appendChild(clone);
            
            // Use html2canvas to capture the resume with higher quality
            html2canvas(clone, {
                scale: 4, // Increased from 2 to 4 for much higher resolution
                useCORS: true,
                allowTaint: true,
                backgroundColor: 'white',
                scrollX: 0,
                scrollY: 0,
                windowWidth: 8.5 * 96,  // 8.5 inches at 96 DPI
                imageRendering: 'high-quality',
                logging: false,
                removeContainer: false,
                letterRendering: true, // Improves text rendering
                onclone: function(clonedDoc) {
                    // Get the cloned resume
                    const clonedResume = clonedDoc.querySelector('#resume-main');
                    if (clonedResume) {
                        // Force all elements to have no bottom margin/padding
                        const allElements = clonedResume.querySelectorAll('*');
                        allElements.forEach(el => {
                            // Check if this is one of the bottom elements
                            if (el.className.includes('references') ||
                                el.className.includes('reference-columns') ||
                                el.tagName === 'P' && el.closest('.references-section')) {
                                el.style.marginBottom = '0';
                                el.style.paddingBottom = '0';
                            }
                        });
                    }
                }
            }).then(canvas => {
                // Find the content height by scanning the canvas from bottom to top
                const ctx = canvas.getContext('2d');
                const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                
                // Start from the bottom-1 and work up until we find non-white pixels
                let lastContentRow = canvas.height - 1;
                let foundContent = false;
                
                // Look through the bottom 10% of the image to find the last row with content
                const startRow = Math.max(0, canvas.height - Math.floor(canvas.height * 0.1));
                
                outerLoop:
                for (let y = canvas.height - 1; y >= startRow; y--) {
                    for (let x = 0; x < canvas.width; x++) {
                        const index = (y * canvas.width + x) * 4;
                        // Check if pixel is not white (255,255,255) and not transparent
                        if (pixelData[index] !== 255 || 
                            pixelData[index + 1] !== 255 || 
                            pixelData[index + 2] !== 255 || 
                            pixelData[index + 3] !== 0) {
                                lastContentRow = y;
                                foundContent = true;
                                break outerLoop;
                        }
                    }
                }
                
                // If we found a content row, crop to it (plus 1 pixel buffer)
                let cropHeight = lastContentRow + 1;
                if (!foundContent) {
                    cropHeight = canvas.height; // No cropping needed
                }
                
                // Create a new canvas with the cropped height
                const croppedCanvas = document.createElement('canvas');
                croppedCanvas.width = canvas.width;
                croppedCanvas.height = cropHeight;
                
                // Draw only the content portion
                const croppedCtx = croppedCanvas.getContext('2d');
                croppedCtx.drawImage(canvas, 0, 0);
                
                // Generate download link
                // Apply some sharpening to the image to enhance text clarity
                const sharpCanvas = document.createElement('canvas');
                sharpCanvas.width = croppedCanvas.width;
                sharpCanvas.height = croppedCanvas.height;
                const sharpCtx = sharpCanvas.getContext('2d');
                
                // Apply image smoothing for better output quality
                sharpCtx.imageSmoothingEnabled = true;
                sharpCtx.imageSmoothingQuality = 'high';
                
                // Draw the image onto the final canvas
                sharpCtx.drawImage(croppedCanvas, 0, 0);
                
                // Create the download link with maximum quality
                const a = document.createElement('a');
                a.href = sharpCanvas.toDataURL('image/png', 1.0);
                a.download = 'heinrich_schroder_resume.png';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                
                // Clean up
                document.body.removeChild(container);
                document.head.removeChild(styleEl);
                
                // Reset button
                button.textContent = 'Download as PNG';
                button.disabled = false;
            }).catch(error => {
                console.error('PNG generation failed:', error);
                if (document.body.contains(container)) {
                    document.body.removeChild(container);
                }
                const styleEl = document.getElementById('temp-export-styles');
                if (styleEl) {
                    document.head.removeChild(styleEl);
                }
                button.textContent = 'Error - Try Again';
                button.disabled = false;
            });
        }, 100);
    });
});
