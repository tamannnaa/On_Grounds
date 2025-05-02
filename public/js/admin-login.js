const form = document.getElementById('adminLoginForm');
        const errorMessage = document.getElementById('errorMessage');
        const loading = document.getElementById('loading');
        const loginButton = document.getElementById('loginButton');

        
        const ADMIN_USERNAME = 'admin';
        const ADMIN_EMAIL = 'vanshn122@gmail.com';
        const ADMIN_PASSWORD = '123456';

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            errorMessage.style.display = 'none';
            loading.style.display = 'block';
            loginButton.disabled = true;

            const username = document.getElementById('username').value.trim();
            const email = document.getElementById('email').value.trim().toLowerCase();
            const password = document.getElementById('password').value;
            if (username !== ADMIN_USERNAME || email !== ADMIN_EMAIL) {
                errorMessage.textContent = 'Invalid admin credentials';
                errorMessage.style.display = 'block';
                loading.style.display = 'none';
                loginButton.disabled = false;
                return;
            }

            try {
                const response = await fetch('/admin/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username,
                        email,
                        password
                    }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = data.redirect;
                } else {
                    throw new Error(data.error || 'Login failed');
                }
            } catch (error) {
                errorMessage.textContent = error.message || 'An error occurred. Please try again.';
                errorMessage.style.display = 'block';
            } finally {
                loading.style.display = 'none';
                loginButton.disabled = false;
            }
        });
        ['username', 'email', 'password'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => {
                errorMessage.style.display = 'none';
            });
        });