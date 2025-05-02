document.addEventListener('DOMContentLoaded', () => {
    const verifyForm = document.querySelector('form.auth-form');
    if (verifyForm) {
        verifyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(verifyForm);
                const response = await fetch('/verify', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        otp: formData.get('otp')
                    })
                });

                const data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect || '/login';
                } else {
                    throw new Error(data.error || 'Verification failed');
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }
}); 