const countries = {
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

document.addEventListener('DOMContentLoaded', () => {
    const countrySelect = document.getElementById('countryOfBirth');
    const citySelect = document.getElementById('cityOfBirth');

    if (countrySelect && citySelect) {
        Object.keys(countries).sort().forEach(country => {
            const option = document.createElement('option');
            option.value = country;
            option.textContent = country;
            countrySelect.appendChild(option);
        });
        countrySelect.addEventListener('change', () => {
            const selectedCountry = countrySelect.value;
            citySelect.innerHTML = '<option value="">Select City</option>';
            
            if (selectedCountry && countries[selectedCountry]) {
                countries[selectedCountry].sort().forEach(city => {
                    const option = document.createElement('option');
                    option.value = city;
                    option.textContent = city;
                    citySelect.appendChild(option);
                });
                citySelect.disabled = false;
            } else {
                citySelect.disabled = true;
            }
        });
        citySelect.disabled = true;
    }
}); 