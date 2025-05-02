const countryData = {
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Liverpool', 'Glasgow', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Leicester'],
    'Canada': ['Toronto', 'Vancouver', 'Montreal', 'Calgary', 'Ottawa', 'Edmonton', 'Winnipeg', 'Quebec City', 'Hamilton', 'Halifax'],
    'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Wollongong', 'Logan City'],
    'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
    'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'],
    'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
    'Japan': ['Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Fukuoka', 'Kobe', 'Kyoto', 'Kawasaki', 'Saitama'],
    'China': ['Shanghai', 'Beijing', 'Guangzhou', 'Shenzhen', 'Chengdu', 'Tianjin', 'Wuhan', 'Dongguan', 'Chongqing', 'Nanjing'],
    'Brazil': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Manaus', 'Curitiba', 'Recife', 'Porto Alegre']
};

const timeSlots = [
    '6:00 AM - 9:00 AM',
    '9:00 AM - 12:00 PM',
    '12:00 PM - 3:00 PM',
    '3:00 PM - 6:00 PM',
    '6:00 PM - 9:00 PM',
    '9:00 PM - 12:00 AM'
];

document.addEventListener('DOMContentLoaded', function() {
    const countrySelect = document.getElementById('country');
    const citySelect = document.getElementById('city');
    const birthCountrySelect = document.getElementById('countryOfBirth');
    const timeSlotsSelect = document.getElementById('timeSlots');
    const settingsForm = document.querySelector('.settings-form');

    initializeCountryDropdowns();
    initializeTimeSlots();

    if (countrySelect) {
        countrySelect.addEventListener('change', updateCityDropdown);
    }
    
    if (settingsForm) {
        settingsForm.addEventListener('submit', handleFormSubmit);
    }

    if (countrySelect && citySelect) {
        updateCityDropdown();
    }

    function initializeCountryDropdowns() {
        const countries = Object.keys(countryData);
        
        if (countrySelect) {
            countries.forEach(country => {
                const option = new Option(country, country);
                countrySelect.add(option);
            });
        }

        if (birthCountrySelect) {
            countries.forEach(country => {
                const option = new Option(country, country);
                birthCountrySelect.add(option);
            });
        }
    }

    function initializeTimeSlots() {
        if (timeSlotsSelect) {
            timeSlots.forEach(slot => {
                const option = new Option(slot, slot);
                timeSlotsSelect.add(option);
            });
        }
    }

    function updateCityDropdown() {
        citySelect.innerHTML = '<option value="">Select a city</option>';
        
        const selectedCountry = countrySelect.value;
        if (selectedCountry && countryData[selectedCountry]) {
            countryData[selectedCountry].forEach(city => {
                const option = new Option(city, city);
                citySelect.add(option);
            });
            citySelect.disabled = false;
        } else {
            citySelect.disabled = true;
        }
    }

    function handleFormSubmit(event) {
        event.preventDefault();
        
        const searchParams = new URLSearchParams();
        
        if (countrySelect && citySelect) {
            const location = citySelect.value ? 
                `${citySelect.value}, ${countrySelect.value}` : 
                countrySelect.value;
            
            if (location) {
                searchParams.append('location', location);
            }
        }

        const priceRange = document.getElementById('priceRange');
        if (priceRange && priceRange.value) {
            const [min, max] = priceRange.value.split('-');
            if (min) searchParams.append('minPrice', min);
            if (max) searchParams.append('maxPrice', max);
        }

        if (timeSlotsSelect && timeSlotsSelect.value) {
            searchParams.append('timeSlot', timeSlotsSelect.value);
        }

        const availableDays = document.getElementById('availableDays');
        if (availableDays && availableDays.value) {
            searchParams.append('availableDays', availableDays.value);
        }

        window.location.href = '/search-tutors?' + searchParams.toString();
    }
}); 