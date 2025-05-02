console.log('Page loaded. Number of tutor cards:', document.querySelectorAll('.tutor-card').length);
        function handleImageError(img) {
            console.log('Image failed to load:', img.src);
            const container = img.parentElement;
            container.innerHTML = '<div class="profile-image-fallback"><i class="fas fa-user"></i></div>';
        }
        document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('.profile-image-container img');
            console.log('Found profile images:', images.length);
            images.forEach((img, index) => {
                console.log(`Image ${index + 1}:`, {
                    src: img.src,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight,
                    complete: img.complete
                });
            });
        });
        document.querySelectorAll('.read-more-btn').forEach(button => {
            button.addEventListener('click', function() {
                const aboutText = this.parentElement;
                const shortText = aboutText.querySelector('.short-text');
                const fullText = aboutText.querySelector('.full-text');
                
                if (shortText.style.display !== 'none') {
                    shortText.style.display = 'none';
                    fullText.style.display = 'inline';
                    this.textContent = 'Read Less';
                } else {
                    shortText.style.display = 'inline';
                    fullText.style.display = 'none';
                    this.textContent = 'Read More';
                }
            });
        });

        function showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.style.display = 'block';
            setTimeout(() => {
                toast.style.display = 'none';
            }, 3000);
        }

        async function toggleWishlist(button, tutorId) {
            try {
                console.log('\n=== Starting Wishlist Toggle ===');
                console.log('Button:', {
                    element: button,
                    disabled: button.disabled,
                    classList: Array.from(button.classList)
                });
                console.log('Tutor ID:', tutorId);

                button.disabled = true;
                try {
                    console.log('Testing wishlist router...');
                    const testResponse = await fetch('/wishlist/test');
                    const testData = await testResponse.json();
                    console.log('Test response:', testData);
                } catch (testError) {
                    console.error('Test endpoint failed:', testError);
                }

                console.log('Sending wishlist toggle request...');
                const response = await fetch('/wishlist/toggle', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json'
                    },
                    credentials: 'same-origin',
                    body: JSON.stringify({ tutorId })
                });

                console.log('Response received:', {
                    ok: response.ok,
                    status: response.status,
                    statusText: response.statusText,
                    headers: Object.fromEntries(response.headers.entries()),
                    url: response.url
                });

                const contentType = response.headers.get('content-type');
                console.log('Content-Type:', contentType);
                
                if (!response.ok) {
                    console.log('Response not OK');
                    if (response.status === 401) {
                        console.log('User not authenticated, redirecting to login');
                        window.location.href = '/login';
                        return;
                    }

                    let errorMessage;
                    let responseText;
                    
                    try {
                        responseText = await response.text();
                        console.log('Raw response text:', responseText);
                        
                        if (contentType && contentType.includes('application/json')) {
                            const errorData = JSON.parse(responseText);
                            console.log('Parsed error data:', errorData);
                            errorMessage = errorData.message || `HTTP error! status: ${response.status}`;
                        } else {
                            errorMessage = `HTTP error! status: ${response.status}`;
                        }
                    } catch (parseError) {
                        console.error('Error parsing response:', parseError);
                        errorMessage = `HTTP error! status: ${response.status}. Response: ${responseText}`;
                    }
                    
                    throw new Error(errorMessage);
                }

                console.log('Parsing successful response...');
                const data = await response.json();
                console.log('Response data:', data);

                if (data.success) {
                    console.log('Wishlist toggle successful');
                    button.classList.toggle('active');
                    console.log('Updated button state:', {
                        disabled: button.disabled,
                        classList: Array.from(button.classList)
                    });
                    showToast(data.message);
                } else {
                    console.log('Wishlist toggle failed:', data.message);
                    showToast(data.message || 'Error updating wishlist');
                }
            } catch (error) {
                console.error('Wishlist error:', error);
                console.error('Error stack:', error.stack);
                showToast(error.message || 'Error updating wishlist. Please try again.');
            } finally {
                button.disabled = false;
                console.log('=== Wishlist Toggle Completed ===\n');
            }
        }