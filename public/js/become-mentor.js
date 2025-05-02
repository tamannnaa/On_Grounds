document.addEventListener('DOMContentLoaded', function() {
    const profilePhotoInput = document.getElementById('profilePhoto');
    const profilePreview = document.getElementById('profilePhotoPreview');

    if (profilePhotoInput) {
        profilePhotoInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file && file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    profilePreview.src = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }
    const fileInputs = document.querySelectorAll('input[type="file"].required-file');
    fileInputs.forEach(input => {
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            const inputId = this.id;
            const fileNameDiv = document.getElementById(`${inputId}Name`);
            const statusDiv = document.getElementById(`${inputId}Status`);
            const preview = document.getElementById(`${inputId}Preview`);

            if (file && fileNameDiv && statusDiv && preview) {
                fileNameDiv.textContent = file.name;
                statusDiv.textContent = 'File selected successfully';
                statusDiv.className = 'upload-status success';
                statusDiv.style.display = 'block';
                if (file.type.startsWith('image/')) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        const img = preview.querySelector('img');
                        const icon = preview.querySelector('i');
                        if (img && icon) {
                            img.src = e.target.result;
                            img.style.display = 'block';
                            icon.style.display = 'none';
                        }
                    };
                    reader.readAsDataURL(file);
                }
            }
        });
    });
document.getElementById('mentorForm').addEventListener('submit', async (e) => {
e.preventDefault();
const submitBtn = document.getElementById('submitBtn');
submitBtn.disabled = true;

try {
console.log('Preparing form data for submission...');
const formData = new FormData();
const basicFields = ['name', 'about', 'countryOfBirth', 'currentCountry', 'currentCity', 'collegeName', 'workingField', 'price30', 'price60'];
basicFields.forEach(field => {
    const element = document.getElementById(field);
    if (element) {
        formData.append(field, element.value);
    }
});

const fileFields = ['profilePhoto', 'idProof', 'collegeId', 'addressProof'];
fileFields.forEach(field => {
    const fileInput = document.getElementById(field);
    if (fileInput && fileInput.files[0]) {
        formData.append(field, fileInput.files[0]);
    }
});
const selectedTimeSlots = Array.from(document.querySelectorAll('input[name="timeSlots"]:checked'));
const timeSlots = selectedTimeSlots.map(input => {
    return {
        time: input.value, 
        startTime: input.dataset.start,
        endTime: input.dataset.end,
        duration: 60
    };
});
const selectedDays = Array.from(document.querySelectorAll('input[name="days"]:checked'));
const days = selectedDays.map(input => input.value.charAt(0).toUpperCase() + input.value.slice(1).toLowerCase());

console.log('Time slots to be sent:', timeSlots);
console.log('Days to be sent:', days);
const activeStatusBtn = document.querySelector('.status-btn.active');
const status = activeStatusBtn ? activeStatusBtn.dataset.status : '';
formData.append('status', status);
const hasLoan = document.querySelector('input[name="hasLoan"]:checked').value;
formData.append('hasLoan', hasLoan);

if (hasLoan === 'true') {
    const amount = document.getElementById('loanAmount').value;
    const purpose = document.getElementById('loanPurpose').value;
    if (amount && purpose) {
        formData.append('loanAmount', amount);
        formData.append('loanPurpose', purpose);
    }
}
const languageEntries = document.querySelectorAll('.language-entry');
languageEntries.forEach((entry, index) => {
    const language = entry.querySelector('.language-select').value;
    const proficiency = entry.querySelector('.proficiency-select').value;
    if (language && proficiency) {
        formData.append(`languages[${index}][language]`, language);
        formData.append(`languages[${index}][proficiency]`, proficiency);
    }
});
timeSlots.forEach((slot, index) => {
    formData.append(`timeSlots[${index}][time]`, slot.time);
    formData.append(`timeSlots[${index}][startTime]`, slot.startTime);
    formData.append(`timeSlots[${index}][endTime]`, slot.endTime);
    formData.append(`timeSlots[${index}][duration]`, slot.duration);
});

days.forEach((day, index) => {
    formData.append(`days[${index}]`, day);
});
for (let pair of formData.entries()) {
    console.log(pair[0] + ': ' + pair[1]);
}
const response = await fetch('/api/mentor/register', {
    method: 'POST',
    body: formData
});

if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
}

const data = await response.json();
console.log('Server response:', data);

if (data.success) {
    updateApplicationStatus(data.application);
    alert('Application submitted successfully!');
    disableFormFields();
} else {
    throw new Error(data.error || 'Unknown error occurred');
}
} catch (error) {
console.error('Form submission error:', error);
alert(error.message || 'Failed to submit application. Please try again.');
} finally {
if (submitBtn) {
    submitBtn.disabled = false;
}
}
});
    loadCountries();
    checkApplicationStatus();
});
async function checkApplicationStatus() {
    try {
        console.log('Checking application status...');
        const response = await fetch('/api/mentor/application-status');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log('Application status data:', data);
        
        if (data.application) {
            updateApplicationStatus(data.application);
            if (data.application.applicationStatus === 'REJECTED') {
                showRejectionMessage(data.application.rejectionReason);
                enableFormFields();
            } else if (data.application.applicationStatus === 'PENDING' || data.application.applicationStatus === 'APPROVED') {
                disableFormFields();
            }
            prefillForm(data.application);
        }
    } catch (error) {
        console.error('Error checking application status:', error);
        enableFormFields();
    }
}
function prefillForm(application) {
    console.log('Prefilling form with data:', application);
    const basicFields = ['name', 'about', 'countryOfBirth', 'currentCountry', 'currentCity', 'collegeName', 'workingField', 'price30', 'price60'];
    basicFields.forEach(field => {
        const element = document.getElementById(field);
        if (element && application[field]) {
            element.value = application[field];
        }
    });
    if (application.profilePhoto) {
        const profilePreview = document.getElementById('profilePhotoPreview');
        if (profilePreview) {
            profilePreview.src = application.profilePhoto;
        }
    }
    if (application.status) {
        const statusBtn = document.querySelector(`.status-btn[data-status="${application.status}"]`);
        if (statusBtn) {
            statusBtn.click();
        }
    }
    if (application.timeSlots) {
        application.timeSlots.forEach(slot => {
            const checkbox = document.querySelector(`input[name="timeSlots"][value="${slot.time}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    if (application.days) {
        application.days.forEach(day => {
            const checkbox = document.querySelector(`input[name="days"][value="${day}"]`);
            if (checkbox) checkbox.checked = true;
        });
    }
    if (application.hasLoan !== undefined) {
        const loanRadio = document.querySelector(`input[name="hasLoan"][value="${application.hasLoan ? 'yes' : 'no'}"]`);
        if (loanRadio) {
            loanRadio.checked = true;
            loanRadio.dispatchEvent(new Event('change'));
            
            if (application.hasLoan && application.loanDetails) {
                document.getElementById('loanAmount').value = application.loanDetails.amount || '';
                document.getElementById('loanPurpose').value = application.loanDetails.purpose || '';
            }
        }
    }
    const documentPreviews = {
        'idProof': 'idPreview',
        'collegeId': 'collegeIdPreview',
        'addressProof': 'addressProofPreview'
    };

    Object.entries(documentPreviews).forEach(([docField, previewId]) => {
        if (application.documents && application.documents[docField]) {
            const preview = document.getElementById(previewId);
            if (preview) {
                const img = preview.querySelector('img');
                const icon = preview.querySelector('i');
                if (img && icon) {
                    img.src = application.documents[docField];
                    img.style.display = 'block';
                    icon.style.display = 'none';
                }
            }
        }
    });
}
function enableFormFields() {
    const form = document.getElementById('mentorForm');
    form.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.disabled = false;
    });
    document.getElementById('submitBtn').style.display = 'block';
}
function disableFormFields() {
    const form = document.getElementById('mentorForm');
    form.querySelectorAll('input, select, textarea, button').forEach(el => {
        el.disabled = true;
    });
    document.getElementById('submitBtn').style.display = 'none';
}
async function loadCountries() {
    try {
        const response = await fetch('https://restcountries.com/v3.1/all');
        const countries = await response.json();
        
        const sortedCountries = countries
            .map(country => country.name.common)
            .sort();

        const countrySelects = ['countryOfBirth', 'currentCountry'];
        countrySelects.forEach(selectId => {
            const select = document.getElementById(selectId);
            sortedCountries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                select.appendChild(option);
            });
        });
    } catch (error) {
        console.error('Error loading countries:', error);
    }
}

function updateApplicationStatus(application) {
    console.log('Updating application status:', application);
    const statusElement = document.getElementById('applicationStatus');
    statusElement.className = 'application-status';
    statusElement.classList.add(`status-${application.applicationStatus.toLowerCase()}`);
    statusElement.textContent = `Application Status: ${application.applicationStatus}`;
    statusElement.style.display = 'block';
}

function showRejectionMessage(reason) {
    console.log('Showing rejection message:', reason);
    const messageElement = document.getElementById('rejectionMessage');
    messageElement.innerHTML = `
        <h3>Application Feedback</h3>
        <p>${reason}</p>
        <p>Please review the feedback and make necessary changes before resubmitting your application.</p>
    `;
    messageElement.style.display = 'block';
}

let languageCount = 1;

function addLanguage() {
    const container = document.getElementById('languages-container');
    const entries = container.getElementsByClassName('language-entry');
    const newIndex = entries.length;

    const newEntry = document.createElement('div');
    newEntry.className = 'language-entry';
    newEntry.innerHTML = `
        <div class="language-controls">
            <select class="language-select" name="languages[${newIndex}][language]" required>
                <option value="">Select Language</option>
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Punjabi">Punjabi</option>
                <option value="Spanish">Spanish</option>
                <option value="French">French</option>
                <option value="German">German</option>
                <option value="Chinese">Chinese</option>
                <option value="Japanese">Japanese</option>
            </select>
            <select class="proficiency-select" name="languages[${newIndex}][proficiency]" required>
                <option value="">Select Proficiency</option>
                <option value="Native">Native</option>
                <option value="Advanced">Advanced</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Beginner">Beginner</option>
            </select>
            <button type="button" class="remove-language" onclick="removeLanguage(this)">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    container.appendChild(newEntry);
}

function removeLanguage(button) {
    const entry = button.closest('.language-entry');
    if (document.getElementsByClassName('language-entry').length > 1) {
        entry.remove();
        updateLanguageIndexes();
    }
}

function updateLanguageIndexes() {
    const entries = document.getElementsByClassName('language-entry');
    Array.from(entries).forEach((entry, index) => {
        const languageSelect = entry.querySelector('.language-select');
        const proficiencySelect = entry.querySelector('.proficiency-select');
        
        languageSelect.name = `languages[${index}][language]`;
        proficiencySelect.name = `languages[${index}][proficiency]`;
    });
}

function toggleLoanDetails(show) {
    const loanDetails = document.querySelector('.loan-details');
    if (show) {
        loanDetails.classList.add('visible');
    } else {
        loanDetails.classList.remove('visible');
    }
}
document.querySelector('form').addEventListener('submit', function(e) {
    const hasLoanRadios = document.querySelectorAll('input[name="hasLoan"]');
    let hasLoanSelected = false;
    hasLoanRadios.forEach(radio => {
        if (radio.checked) hasLoanSelected = true;
    });

    if (!hasLoanSelected) {
        e.preventDefault();
        alert('Please select whether you have an education loan or not.');
        return;
    }

    const hasLoan = document.querySelector('input[name="hasLoan"]:checked').value === 'true';
    if (hasLoan) {
        const loanAmount = document.getElementById('loanAmount').value;
        const loanPurpose = document.getElementById('loanPurpose').value;
        
        if (!loanAmount || !loanPurpose) {
            e.preventDefault();
            alert('Please fill in all loan details.');
            return;
        }
    }
    const languages = document.querySelectorAll('.language-entry');
    let isValid = true;
    languages.forEach(entry => {
        const language = entry.querySelector('.language-select').value;
        const proficiency = entry.querySelector('.proficiency-select').value;
        if (!language || !proficiency) {
            isValid = false;
        }
    });

    if (!isValid) {
        e.preventDefault();
        alert('Please fill in all language fields.');
    }
});
document.getElementById('logoutBtn').addEventListener('click', function() {
    window.location.href = '/logout';
});