const countries = {
    "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Lucknow"],
    "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
    "United Kingdom": ["London", "Manchester", "Birmingham", "Leeds", "Glasgow", "Liverpool", "Bristol", "Edinburgh", "Sheffield", "Cardiff"],
    "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Ottawa", "Edmonton", "Quebec City", "Winnipeg", "Hamilton", "Halifax"],
    "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Newcastle", "Canberra", "Wollongong", "Hobart"],
    "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"],
    "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
    "Japan": ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama"],
    "Singapore": ["Central Area", "Tampines", "Jurong East", "Woodlands", "Punggol", "Ang Mo Kio", "Sengkang", "Yishun", "Bedok", "Clementi"],
    "UAE": ["Dubai", "Abu Dhabi", "Sharjah", "Ajman", "Al Ain", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain", "Dubai Silicon Oasis", "Dubai Marina"]
};

document.addEventListener('DOMContentLoaded', () => {
    const countryOfBirthSelect = document.getElementById('countryOfBirth');
    const currentCountrySelect = document.getElementById('currentCountry');
    const currentCitySelect = document.getElementById('currentCity');
    const applicationStatus = document.getElementById('applicationStatus');
    const mentorForm = document.getElementById('mentorForm');
    Object.keys(countries).forEach(country => {
        const option = new Option(country, country);
        countryOfBirthSelect.add(option.cloneNode(true));
        currentCountrySelect.add(option);
    });
    currentCountrySelect.addEventListener('change', (e) => {
        const selectedCountry = e.target.value;
        currentCitySelect.innerHTML = '<option value="">Select your current city</option>';
        
        if (selectedCountry && countries[selectedCountry]) {
            countries[selectedCountry].forEach(city => {
                currentCitySelect.add(new Option(city, city));
            });
        }
    });
    const fileInputs = document.querySelectorAll('input[type="file"][required]');
    fileInputs.forEach(input => {
        input.removeAttribute('required');
        input.addEventListener('change', () => {
            if (input.files.length > 0) {
                input.setCustomValidity('');
            } else {
                input.setCustomValidity('Please select a file');
            }
        });
    });
    if (mentorForm) {
        mentorForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            let isValid = true;
            fileInputs.forEach(input => {
                if (input.files.length === 0) {
                    input.setCustomValidity('Please select a file');
                    isValid = false;
                } else {
                    input.setCustomValidity('');
                }
            });

            if (!isValid) {
                alert('Please upload all required documents');
                return;
            }

            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) submitBtn.disabled = true;

            try {
                const formData = new FormData(mentorForm);
                const timeSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'))
                    .map(input => input.value);
                const days = Array.from(document.querySelectorAll('input[name="days"]:checked'))
                    .map(input => input.value);

                formData.set('timeSlots', JSON.stringify(timeSlots));
                formData.set('days', JSON.stringify(days));
                const activeStatusBtn = document.querySelector('.status-btn.active');
                if (activeStatusBtn) {
                    formData.set('status', activeStatusBtn.dataset.status);
                }
                const response = await fetch('/api/mentor/register', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();
                
                if (data.success) {
                    if (applicationStatus) {
                        applicationStatus.textContent = 'Application Under Review';
                        applicationStatus.className = 'application-status status-pending';
                        applicationStatus.style.display = 'block';
                    }
                    alert('Application submitted successfully!');
                    window.location.reload();
                } else {
                    throw new Error(data.error || 'Failed to submit application');
                }
            } catch (error) {
                alert(error.message || 'Failed to submit application');
            } finally {
                if (submitBtn) submitBtn.disabled = false;
            }
        });
    }
    fetch('/api/mentor/application-status')
        .then(response => {
            if (!response.ok) {
                if (response.status === 404) {
                    return { status: null };
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status) {
                if (applicationStatus) {
                    applicationStatus.textContent = data.status === 'pending' ? 'Application Under Review' :
                                                 data.status === 'approved' ? 'Application Approved' :
                                                 'Application Rejected';
                    applicationStatus.className = `application-status status-${data.status}`;
                    applicationStatus.style.display = 'block';
                }

                if (data.status === 'rejected' && data.message) {
                    const rejectionMessage = document.createElement('div');
                    rejectionMessage.className = 'rejection-message';
                    rejectionMessage.textContent = data.message;
                    if (applicationStatus) {
                        applicationStatus.after(rejectionMessage);
                        rejectionMessage.style.display = 'block';
                    }
                }

                if ((data.status === 'pending' || data.status === 'approved') && mentorForm) {
                    const inputs = mentorForm.querySelectorAll('input, select, textarea, button');
                    inputs.forEach(input => input.disabled = true);
                }
            }
        })
        .catch(error => {
            console.error('Error fetching application status:', error);
        });
}); 