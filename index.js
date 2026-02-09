const searchInput = document.querySelector('#search');
const container = document.querySelector('.container');
const formContainer = document.querySelector('.form-container');

let countries = [];
const API_KEY = '316b78acd06e700c7174d4479c570cca'; // Tu API Key verificada

// 1. Obtener Países (Solo campos necesarios para optimizar)
const getCountries = async () => {
  try {
    const res = await fetch('https://restcountries.com/v3.1/all?fields=flags,name,translations,latlng,capital,population,region,subregion,timezones');
    countries = await res.json();
    console.log('Países cargados');
  } catch (error) {
    console.error('Error:', error);
  }
}
getCountries();

// 2. Lógica de Filtrado (Evento Input)
searchInput.addEventListener('input', async e => {
  const searchTerm = e.target.value.toLowerCase().trim();

  // Limpiar y resetear si está vacío
  container.innerHTML = '';
  if (searchTerm === '') {
    formContainer.classList.remove('searching');
    return;
  }

  formContainer.classList.add('searching');

  // FILTRO INTELIGENTE:
  // 1. Define qué nombre se va a mostrar (Español si existe, si no Inglés)
  // 2. Compara si ESE nombre empieza con lo que escribió el usuario
  const filtered = countries.filter(country => {
    const displayName = country.translations.spa 
      ? country.translations.spa.common.toLowerCase() 
      : country.name.common.toLowerCase();
    
    return displayName.startsWith(searchTerm);
  });

  // ORDENAR ALFABÉTICAMENTE:
  filtered.sort((a, b) => {
    const nameA = a.translations.spa ? a.translations.spa.common : a.name.common;
    const nameB = b.translations.spa ? b.translations.spa.common : b.name.common;
    return nameA.localeCompare(nameB);
  });

  // --- MÁQUINA DE ESTADOS (Según instrucciones PDF) ---

  // CASO A: Más de 10 resultados
  if (filtered.length > 10) {
    container.innerHTML = `<p class="info-msg">Demasiados paises, especifica major tu busqueda</p>`;
    return;
  }

  // CASO B: Entre 2 y 10 resultados (Grid)
  if (filtered.length >= 2 && filtered.length <= 10) {
    renderList(filtered);
    return;
  }

  // CASO C: 1 solo resultado (Ficha Completa)
  if (filtered.length === 1) {
    const country = filtered[0];
    const weather = await getWeather(country.latlng[0], country.latlng[1]);
    renderSingle(country, weather);
    return;
  }

  // CASO D: 0 resultados
  if (filtered.length === 0) {
    container.innerHTML = `<p class="info-msg">No se encontraron resultados</p>`;
  }
});

// 3. Función del Clima (OpenWeatherMap)
const getWeather = async (lat, lon) => {
  try {
    const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=es`);
    return await res.json();
  } catch (error) {
    console.error(error);
    return null; // Manejo de errores silencioso para no romper la UI
  }
};

// 4. Renderizado: Lista de tarjetas pequeñas
function renderList(list) {
  const grid = document.createElement('div');
  grid.className = 'countries-grid';

  list.forEach(c => {
    // Usamos la misma lógica del nombre para mostrarlo
    const name = c.translations.spa ? c.translations.spa.common : c.name.common;
    grid.innerHTML += `
      <div class="country-card">
        <img src="${c.flags.svg}" alt="${name}">
        <h3>${name}</h3>
      </div>
    `;
  });
  container.appendChild(grid);
}

// 5. Renderizado: Tarjeta Única con Clima
function renderSingle(c, w) {
  const name = c.translations.spa ? c.translations.spa.common : c.name.common;
  
  // Datos del clima seguros (por si falla la API)
  const temp = w ? w.main.temp.toFixed(2) : '--';
  const desc = w ? w.weather[0].description : 'Sin datos';
  const icon = w ? w.weather[0].icon : '01d';

  container.innerHTML = `
    <div class="single-country-card">
      <div class="flag-side">
        <img src="${c.flags.svg}" class="flag-img" alt="${name}">
        <div class="weather-overlay">
          <img src="https://openweathermap.org/img/wn/${icon}.png" alt="Icono">
          <span>${desc} | ${temp} Celcius</span>
        </div>
      </div>
      <div class="info-side">
        <h2>${name}</h2>
        <p><strong>Capital:</strong> ${c.capital?.[0] || 'N/A'}</p>
        <p><strong>Habitantes:</strong> ${c.population.toLocaleString()}</p>
        <p><strong>Región:</strong> ${c.region}</p>
        <p><strong>Subregión:</strong> ${c.subregion}</p>
        <p><strong>Zona Horaria:</strong> ${c.timezones[0]}</p>
      </div>
    </div>
  `;
}