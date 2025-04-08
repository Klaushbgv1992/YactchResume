// Enhanced screenshot utility for perfectly styled resume exports
function captureExactScreenshot(node, fileName) {
    // Get the button for updating UI state
    const downloadBtn = document.getElementById('downloadPngBtn');
    if (downloadBtn) {
        downloadBtn.textContent = 'Processing...';
        downloadBtn.disabled = true;
    }
    
    // Create a copy of the resume in a new div for export
    const exportContainer = document.createElement('div');
    exportContainer.id = 'export-container';
    exportContainer.style.position = 'absolute';
    exportContainer.style.top = '-9999px';
    exportContainer.style.left = '-9999px';
    exportContainer.style.width = '800px'; // Fixed width for consistent output
    exportContainer.style.backgroundColor = 'white';
    exportContainer.style.padding = '0';
    exportContainer.style.margin = '0';
    document.body.appendChild(exportContainer);
    
    // Clone the resume and add it to our container
    const resumeClone = node.cloneNode(true);
    exportContainer.appendChild(resumeClone);
    
    // Make some adjustments to ensure it looks correct
    resumeClone.style.boxShadow = 'none';
    resumeClone.style.margin = '0';
    resumeClone.style.width = '100%';
    
    // Capture the exact visual state with html2canvas
    html2canvas(resumeClone, {
        scale: 2, // Higher resolution
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: 800,
        windowWidth: 800,
        windowHeight: 1200,
        onclone: function(clonedDoc) {
            // Ensure all styles are applied
            const style = clonedDoc.createElement('style');
            Array.from(document.styleSheets).forEach(sheet => {
                try {
                    // Get all the rules from the stylesheet
                    const rules = sheet.cssRules || sheet.rules;
                    for (let i = 0; i < rules.length; i++) {
                        style.appendChild(document.createTextNode(rules[i].cssText));
                    }
                } catch (e) {
                    console.log('Could not access stylesheet rules');
                }
            });
            clonedDoc.head.appendChild(style);
        }
    }).then(canvas => {
        try {
            // Trigger the download
            const link = document.createElement('a');
            link.download = fileName || 'resume.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Cleanup
            document.body.removeChild(exportContainer);
            
            // Reset button
            if (downloadBtn) {
                downloadBtn.textContent = 'Download as PNG';
                downloadBtn.disabled = false;
            }
        } catch (e) {
            console.error('Error saving PNG:', e);
            if (downloadBtn) {
                downloadBtn.textContent = 'Error - Try Again';
                downloadBtn.disabled = false;
            }
            document.body.removeChild(exportContainer);
        }
    }).catch(error => {
        console.error('Error generating screenshot:', error);
        if (downloadBtn) {
            downloadBtn.textContent = 'Error - Try Again';
            downloadBtn.disabled = false;
        }
        document.body.removeChild(exportContainer);
    });
}
