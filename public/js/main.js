document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing form handlers');
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        console.log('Setting up form handler for:', form.action);
        
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('Form submitted:', form.action);
            
            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            console.log('Form data:', { ...data, password: data.password ? '***' : undefined });
            
            try {
                console.log('Sending request to:', form.action);
                const response = await fetch(form.action, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });
                
                console.log('Response status:', response.status);
                console.log('Response headers:', Object.fromEntries([...response.headers]));
                
                const contentType = response.headers.get('content-type');
                console.log('Content-Type:', contentType);
                
                if (!contentType || !contentType.includes('application/json')) {
                    throw new Error(`Expected JSON response but got ${contentType}`);
                }
                
                const result = await response.json();
                console.log('Response data:', result);
                
                if (!response.ok) {
                    throw new Error(result.error || 'Something went wrong');
                }
                
                if (result.success) {
                    console.log('Success response received, redirect to:', result.redirect);
                    
                    if (form.action.includes('/verify')) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Success!',
                            text: 'Email verified successfully!',
                            confirmButtonColor: '#331B3F'
                        }).then(() => {
                            console.log('Redirecting to:', result.redirect);
                            window.location.href = result.redirect;
                        });
                    } else if (form.action.includes('/login')) {
                        Swal.fire({
                            icon: 'success',
                            title: 'Welcome back!',
                            text: 'Login successful!',
                            confirmButtonColor: '#331B3F'
                        }).then(() => {
                            console.log('Redirecting to:', result.redirect);
                            window.location.href = result.redirect;
                        });
                    } else if (form.action.includes('/signup')) {
                        console.log('Signup successful, redirecting to:', result.redirect);
                        window.location.href = result.redirect;
                    }
                }
            } catch (error) {
                console.error('Form submission error:', error);
                
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: error.message,
                    confirmButtonColor: '#331B3F'
                });
                
                form.querySelectorAll('input').forEach(input => {
                    input.classList.add('error');
                    setTimeout(() => input.classList.remove('error'), 500);
                });
            }
        });
    });
}); 