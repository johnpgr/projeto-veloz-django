document.addEventListener('DOMContentLoaded', () => {
    const initializeModals = () => {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            const observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'childList') {
                        const modal = modalContainer.querySelector('dialog');
                        if (modal && !modal.open) {
                            modal.showModal();
                            const focusableElements = modal.querySelectorAll(
                                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                            );
                            const firstFocusableElement = focusableElements[0];
                            const lastFocusableElement = focusableElements[focusableElements.length - 1];

                            if(firstFocusableElement) {
                                firstFocusableElement.focus();
                            }

                            modal.addEventListener('keydown', (e) => {
                                if (e.key === 'Tab') {
                                    if (e.shiftKey) { // Shift + Tab
                                        if (document.activeElement === firstFocusableElement) {
                                            e.preventDefault();
                                            lastFocusableElement.focus();
                                        }
                                    } else { // Tab
                                        if (document.activeElement === lastFocusableElement) {
                                            e.preventDefault();
                                            firstFocusableElement.focus();
                                        }
                                    }
                                }
                            });
                            
                            modal.addEventListener('close', () => {
                                modalContainer.innerHTML = '';
                            }, { once: true });
                        }
                    }
                }
            });
            
            observer.observe(modalContainer, { childList: true });
        }
    };

    initializeModals();

    document.body.addEventListener('htmx:afterSwap', function(event) {
        if (event.detail.target.tagName === 'BODY') {
            initializeModals();
        }
    });
});
