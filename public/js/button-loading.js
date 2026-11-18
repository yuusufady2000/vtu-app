
document.addEventListener('submit', function (event) {
    const form = event.target;

    if (!form.matches('form') || form.dataset.noLoading === 'true') {
        return;
    }

    const buttons = form.querySelectorAll(
        'button[type="submit"], button:not([type])'
    );

    buttons.forEach(button => {
        if (button.disabled) return;

        button.dataset.originalText = button.innerHTML;
        button.disabled = true;
        button.classList.add('is-loading');

        button.innerHTML = `
            <span class="loading-spinner"></span>
            Processing...
        `;
    });
});
