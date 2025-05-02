document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.accept-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            if (confirm('Are you sure you want to accept this booking?')) {
                updateBookingStatus(bookingId, 'confirmed');
            }
        });
    });
    document.querySelectorAll('.reject-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            if (confirm('Are you sure you want to reject this booking?')) {
                updateBookingStatus(bookingId, 'cancelled');
            }
        });
    });
    document.querySelectorAll('.cancel-booking').forEach(button => {
        button.addEventListener('click', function() {
            const bookingId = this.getAttribute('data-booking-id');
            if (confirm('Are you sure you want to cancel this booking?')) {
                updateBookingStatus(bookingId, 'cancelled');
            }
        });
    });
    function updateBookingStatus(bookingId, status) {
        fetch('/book/' + bookingId + '/status', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ status: status })
        })
        .then(response => {
            if (response.ok) {
                window.location.reload();
            } else {
                alert('Failed to update booking status. Please try again.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            alert('An error occurred. Please try again.');
        });
    }
});