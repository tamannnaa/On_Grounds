document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.querySelector('form.auth-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            try {
                const formData = new FormData(loginForm);
                const isSignup = loginForm.querySelector('[name="email"]') !== null;
                
                const endpoint = isSignup ? '/signup' : '/login';
                const formBody = isSignup ? {
                    username: formData.get('username'),
                    email: formData.get('email'),
                    password: formData.get('password')
                } : {
                    username: formData.get('username'),
                    password: formData.get('password')
                };

                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(formBody)
                });

                const data = await response.json();
                
                if (data.success) {
                    window.location.href = data.redirect;
                } else {
                    throw new Error(data.error || `${isSignup ? 'Signup' : 'Login'} failed`);
                }
            } catch (error) {
                alert(error.message);
            }
        });
    }
}); 