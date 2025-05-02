document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('mentorForm');
    const photoInput = document.getElementById('profilePhoto');
    const photoPreview = document.getElementById('profilePhotoPreview');
    const statusBtns = document.querySelectorAll('.status-btn');
    const collegeSection = document.getElementById('collegeSection');
    const workingSection = document.getElementById('workingSection');

    const countriesData = {
        "United States": ["New York", "Los Angeles", "Chicago", "Houston", "Phoenix", "Philadelphia", "San Antonio", "San Diego", "Dallas", "San Jose"],
        "India": ["Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad", "Jaipur", "Surat"],
        "United Kingdom": ["London", "Birmingham", "Leeds", "Glasgow", "Sheffield", "Manchester", "Edinburgh", "Liverpool", "Bristol", "Cardiff"],
        "Canada": ["Toronto", "Montreal", "Vancouver", "Calgary", "Edmonton", "Ottawa", "Quebec City", "Winnipeg", "Hamilton", "Halifax"],
        "Australia": ["Sydney", "Melbourne", "Brisbane", "Perth", "Adelaide", "Gold Coast", "Canberra", "Newcastle", "Wollongong", "Logan City"],
        "Germany": ["Berlin", "Hamburg", "Munich", "Cologne", "Frankfurt", "Stuttgart", "Düsseldorf", "Leipzig", "Dortmund", "Essen"],
        "France": ["Paris", "Marseille", "Lyon", "Toulouse", "Nice", "Nantes", "Strasbourg", "Montpellier", "Bordeaux", "Lille"],
        "Japan": ["Tokyo", "Yokohama", "Osaka", "Nagoya", "Sapporo", "Fukuoka", "Kobe", "Kyoto", "Kawasaki", "Saitama"],
        "China": ["Shanghai", "Beijing", "Guangzhou", "Shenzhen", "Chengdu", "Xi'an", "Hangzhou", "Wuhan", "Chongqing", "Nanjing"],
        "Brazil": ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Manaus", "Curitiba", "Recife", "Porto Alegre"]
    };

    const countryOfBirthSelect = document.getElementById('countryOfBirth');
    const currentCountrySelect = document.getElementById('currentCountry');
    const currentCitySelect = document.getElementById('currentCity');

    const countries = Object.keys(countriesData).sort();
    countries.forEach(country => {
        countryOfBirthSelect.add(new Option(country, country));
        currentCountrySelect.add(new Option(country, country));
    });

    currentCountrySelect.addEventListener('change', () => {
        const selectedCountry = currentCountrySelect.value;
        currentCitySelect.innerHTML = '<option value="">Select your current city</option>';
        
        if (selectedCountry && countriesData[selectedCountry]) {
            countriesData[selectedCountry].sort().forEach(city => {
                currentCitySelect.add(new Option(city, city));
            });
            currentCitySelect.disabled = false;
        } else {
            currentCitySelect.disabled = true;
        }
    });

    currentCitySelect.disabled = true;

    photoInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) { // 5MB
                alert('File size must be less than 5MB');
                photoInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                photoPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    statusBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            statusBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const status = this.dataset.status;
            if (status === 'student') {
                collegeSection.classList.remove('hidden');
                workingSection.classList.add('hidden');
                document.getElementById('workingField').removeAttribute('required');
                document.getElementById('collegeName').setAttribute('required', '');
            } else {
                collegeSection.classList.add('hidden');
                workingSection.classList.remove('hidden');
                document.getElementById('collegeName').removeAttribute('required');
                document.getElementById('workingField').setAttribute('required', '');
            }
        });
    });

    const documentInputs = ['idProof', 'collegeId', 'addressProof', 'additionalDoc'];
    
    documentInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        const preview = document.getElementById(`${inputId}Preview`);
        
        if (input && preview) {
            input.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                        alert('File size should not exceed 5MB');
                        input.value = '';
                        return;
                    }

                    if (!file.type.startsWith('image/')) {
                        alert('Please upload an image file');
                        input.value = '';
                        return;
                    }

                    const reader = new FileReader();
                    reader.onload = (e) => {
                        const icon = preview.querySelector('i');
                        const img = preview.querySelector('img');
                        
                        if (icon) icon.style.display = 'none';
                        if (img) {
                            img.style.display = 'block';
                            img.src = e.target.result;
                        }
                    };
                    reader.readAsDataURL(file);
                }
            });
        }
    });

    const loanYes = document.getElementById('loanYes');
    const loanNo = document.getElementById('loanNo');
    const loanDetailsSection = document.getElementById('loanDetailsSection');

    if (loanYes && loanNo && loanDetailsSection) {
        const toggleLoanDetails = (show) => {
            loanDetailsSection.classList.toggle('hidden', !show);
            const loanInputs = loanDetailsSection.querySelectorAll('input');
            loanInputs.forEach(input => {
                input.required = show;
            });
        };

        loanYes.addEventListener('change', () => toggleLoanDetails(true));
        loanNo.addEventListener('change', () => toggleLoanDetails(false));
    }

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        const requiredDocs = ['idProof', 'collegeId', 'addressProof'];
        for (const docId of requiredDocs) {
            const input = document.getElementById(docId);
            if (!input.files || !input.files[0]) {
                alert(`Please upload your ${docId.replace(/([A-Z])/g, ' $1').toLowerCase()}`);
                return;
            }
        }
        const status = document.querySelector('.status-btn.active').dataset.status;
        const selectedTimeSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'))
            .map(input => input.value);
        const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'))
            .map(input => input.value);
        const formData = new FormData();
        formData.append('profilePhoto', photoInput.files[0]);
        formData.append('name', document.getElementById('name').value);
        formData.append('about', document.getElementById('about').value);
        formData.append('countryOfBirth', countryOfBirthSelect.value);
        formData.append('currentCountry', currentCountrySelect.value);
        formData.append('currentCity', currentCitySelect.value);
        formData.append('status', status);
        
        if (status === 'student') {
            formData.append('collegeName', document.getElementById('collegeName').value);
        } else {
            formData.append('workingField', document.getElementById('workingField').value);
        }

        formData.append('price30', document.getElementById('price30').value);
        formData.append('price60', document.getElementById('price60').value);
        formData.append('timeSlots', JSON.stringify(selectedTimeSlots));
        formData.append('days', JSON.stringify(selectedDays));
        documentInputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input.files[0]) {
                formData.append(inputId, input.files[0]);
            }
        });

        try {
            const response = await fetch('/api/mentor/register', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                alert('Application submitted successfully!');
                window.location.href = '/dashboard';
            } else {
                throw new Error(data.error || 'Failed to submit application');
            }
        } catch (error) {
            console.error('Error submitting application:', error);
            alert(error.message);
        }
    });
}); 