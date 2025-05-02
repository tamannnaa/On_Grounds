document.addEventListener('DOMContentLoaded', () => {
    const notificationBtn = document.querySelector('.icon-btn[title="Notifications"]');
    if (notificationBtn) {
        notificationBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Notifications',
                text: 'No new notifications',
                icon: 'info',
                confirmButtonColor: '#331B3F'
            });
        });
    }

    const messageBtn = document.querySelector('.icon-btn[title="Messages"]');
    if (messageBtn) {
        messageBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Messages',
                text: 'No new messages',
                icon: 'info',
                confirmButtonColor: '#331B3F'
            });
        });
    }

    const referBtn = document.querySelector('.refer-btn');
    if (referBtn) {
        referBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Refer a Friend',
                html: `
                    <p>Share this link with your friends:</p>
                    <input type="text" id="referral-link" 
                           value="${window.location.origin}/signup?ref=${Math.random().toString(36).substring(7)}" 
                           readonly class="swal2-input">
                `,
                confirmButtonText: 'Copy Link',
                confirmButtonColor: '#331B3F',
                showCancelButton: true,
                cancelButtonText: 'Close'
            }).then((result) => {
                if (result.isConfirmed) {
                    const link = document.getElementById('referral-link');
                    link.select();
                    document.execCommand('copy');
                    Swal.fire({
                        title: 'Copied!',
                        text: 'Referral link copied to clipboard',
                        icon: 'success',
                        confirmButtonColor: '#331B3F',
                        timer: 1500
                    });
                }
            });
        });
    }
    const languageLinks = document.querySelectorAll('.dropdown-content a');
    languageLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const language = e.target.textContent;
            const currencyBtn = e.target.closest('.dropdown').querySelector('.dropdown-btn');
            if (currencyBtn) {
                currencyBtn.innerHTML = `<i class="fas fa-globe"></i> ${language}`;
            }
        });
    });
    const mentorBtn = document.querySelector('.mentor-btn');
    if (mentorBtn) {
        mentorBtn.addEventListener('click', () => {
            Swal.fire({
                title: 'Become a Mentor',
                html: `
                    <div style="text-align: left;">
                        <h3 style="margin-bottom: 1rem;">Benefits of being a mentor:</h3>
                        <ul style="list-style-type: none; padding: 0;">
                            <li style="margin: 0.5rem 0;"><i class="fas fa-check-circle" style="color: #331B3F;"></i> Share your knowledge</li>
                            <li style="margin: 0.5rem 0;"><i class="fas fa-check-circle" style="color: #331B3F;"></i> Earn while teaching</li>
                            <li style="margin: 0.5rem 0;"><i class="fas fa-check-circle" style="color: #331B3F;"></i> Flexible schedule</li>
                            <li style="margin: 0.5rem 0;"><i class="fas fa-check-circle" style="color: #331B3F;"></i> Build your profile</li>
                        </ul>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Apply Now',
                cancelButtonText: 'Maybe Later',
                confirmButtonColor: '#331B3F',
                cancelButtonColor: '#ACC7B4'
            }).then((result) => {
                if (result.isConfirmed) {
                    window.location.href = '/mentor/apply';
                }
            });
        });
    }
}); 