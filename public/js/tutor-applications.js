let currentApplicationId = null;

        function showImagePreview(src, title) {
            document.getElementById('imagePreviewImg').src = src;
            document.getElementById('imagePreviewTitle').textContent = title;
            document.getElementById('imagePreviewModal').style.display = 'block';
        }

        function closeImagePreview() {
            document.getElementById('imagePreviewModal').style.display = 'none';
        }

        function showApplicationDetails(applicationId) {
            fetch(`/admin/api/application-details/${applicationId}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        const details = data.application;
                        document.getElementById('detailsStatus').textContent = details.applicationStatus;
                        document.getElementById('detailsReviewedOn').textContent = new Date(details.reviewedAt).toLocaleString();
                        
                        const rejectionReasonElement = document.querySelector('.rejection-reason');
                        if (details.applicationStatus === 'REJECTED' && details.rejectionReason) {
                            document.getElementById('detailsRejectionReason').textContent = details.rejectionReason;
                            rejectionReasonElement.style.display = 'block';
                        } else {
                            rejectionReasonElement.style.display = 'none';
                        }
                        
                        document.getElementById('applicationDetailsModal').style.display = 'block';
                    } else {
                        alert('Failed to fetch application details');
                    }
                })
                .catch(error => {
                    console.error('Error fetching application details:', error);
                    alert('An error occurred while fetching application details');
                });
        }

        function closeApplicationDetails() {
            document.getElementById('applicationDetailsModal').style.display = 'none';
        }

        function showReviewModal(applicationId) {
            currentApplicationId = applicationId;
            document.getElementById('reviewModal').style.display = 'block';
            document.getElementById('applicationStatus').value = 'APPROVED';
            document.getElementById('rejectionReason').value = '';
            document.getElementById('rejectionReasonContainer').style.display = 'none';
        }

        function closeReviewModal() {
            document.getElementById('reviewModal').style.display = 'none';
            currentApplicationId = null;
        }
        document.getElementById('applicationStatus').addEventListener('change', function(e) {
            const rejectionContainer = document.getElementById('rejectionReasonContainer');
            rejectionContainer.style.display = e.target.value === 'REJECTED' ? 'block' : 'none';
        });

        async function updateApplicationStatus() {
            if (!currentApplicationId) {
                alert('No application selected');
                return;
            }

            const status = document.getElementById('applicationStatus').value;
            const rejectionReason = document.getElementById('rejectionReason').value;

            if (status === 'REJECTED' && !rejectionReason.trim()) {
                alert('Please provide a reason for rejection');
                return;
            }

            try {
                const response = await fetch('/admin/api/update-application-status', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        applicationId: currentApplicationId,
                        status,
                        rejectionReason: status === 'REJECTED' ? rejectionReason : null
                    })
                });

                const data = await response.json();
                if (data.success) {
                    alert(status === 'APPROVED' ? 'Application approved successfully!' : 'Application rejected successfully!');
                    closeReviewModal();
                    window.location.reload();
                } else {
                    alert(data.error || 'Failed to update application status');
                }
            } catch (error) {
                console.error('Error updating application status:', error);
                alert('An error occurred while updating the application status. Please try again.');
            }
        }
        document.addEventListener('DOMContentLoaded', function() {
            const images = document.querySelectorAll('img');
            images.forEach(img => {
                img.onerror = function() {
                    this.src = '/images/placeholder.png'; 
                    this.onerror = null; 
                };
            });
        });
        window.onclick = function(event) {
            const modals = document.getElementsByClassName('modal');
            for (let modal of modals) {
                if (event.target === modal) {
                    modal.style.display = 'none';
                }
            }
        }