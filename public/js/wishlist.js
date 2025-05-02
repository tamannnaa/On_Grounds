function handleImageError(img) {
    console.log('Image failed to load:', img.src);
    const container = img.parentElement;
    container.innerHTML = '<div class="profile-image-fallback"><i class="fas fa-user"></i></div>';
}

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

async function removeFromWishlist(tutorId) {
    try {
        const result = await Swal.fire({
            title: 'Are you sure?',
            text: "This tutor will be removed from your wishlist",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, remove it!'
        });

        if (result.isConfirmed) {
            const response = await fetch(`/wishlist/toggle`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ tutorId })
            });

            if (response.ok) {
                Swal.fire(
                    'Removed!',
                    'The tutor has been removed from your wishlist.',
                    'success'
                ).then(() => {
                    window.location.reload();
                });
            } else {
                throw new Error('Failed to remove from wishlist');
            }
        }
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        Swal.fire(
            'Error!',
            'Failed to remove the tutor from wishlist.',
            'error'
        );
    }
}