const WeatherAPI = {
  async getCurrent(lat, lon) {
    const r = await fetch(`${CONFIG.BASE_URL}/weather?lat=${lat}&lon=${lon}&units=${getTempParam()}&appid=${CONFIG.API_KEY}`);
    if (!r.ok) { const d = await r.json(); throw new Error(d.message || `API ${r.status}`); }
    return r.json();
  },
  async getForecast(lat, lon) {
    const r = await fetch(`${CONFIG.BASE_URL}/forecast?lat=${lat}&lon=${lon}&units=${getTempParam()}&appid=${CONFIG.API_KEY}`);
    if (!r.ok) throw new Error(`Forecast API ${r.status}`);
    return r.json();
  },
  async getAirQuality(lat, lon) {
    const r = await fetch(`${CONFIG.BASE_URL}/air_pollution?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`);
    if (!r.ok) throw new Error(`AQI API ${r.status}`);
    return r.json();
  },
  async getAirQualityForecast(lat, lon) {
    const r = await fetch(`${CONFIG.BASE_URL}/air_pollution/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.API_KEY}`);
    if (!r.ok) throw new Error(`AQI Forecast API ${r.status}`);
    return r.json();
  },
  getIconUrl: (icon, size = 2) => `${CONFIG.ICON_URL}/${icon}@${size}x.png`,
  windDir(deg) {
    const d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
    return d[Math.round(deg / 22.5) % 16];
  },
  formatTime(unix, off = 0) {
    const d = new Date((unix + off) * 1000);
    const h = d.getUTCHours(), m = String(d.getUTCMinutes()).padStart(2,'0');
    return `${h%12||12}:${m} ${h>=12?'PM':'AM'}`;
  },
  shortDay(unix, off = 0) {
    return new Date((unix + off) * 1000).toLocaleDateString('en-US', { weekday:'short', timeZone:'UTC' });
  },
  fullDay(unix, off = 0) {
    return new Date((unix + off) * 1000).toLocaleDateString('en-US', { weekday:'long', month:'short', day:'numeric', timeZone:'UTC' });
  },
  groupByDay(list) {
    const days = {};
    list.forEach(i => {
      const d = new Date(i.dt * 1000);
      const k = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      if (!days[k]) days[k] = [];
      days[k].push(i);
    });
    return Object.values(days);
  },
  aqiLabel: (i) => ['','Good','Fair','Moderate','Poor','Very Poor'][i] || '—',
  aqiColor: (i) => ['','#4ade80','#a3e635','#facc15','#fb923c','#f87171'][i] || '#666',
  aqiEmoji: (i) => ['','😊','🙂','😐','😷','⚠️'][i] || '❓',
  beaufort(ms) {
    if (ms<0.5) return 'Calm'; if (ms<1.6) return 'Light air'; if (ms<3.4) return 'Light breeze';
    if (ms<5.5) return 'Gentle breeze'; if (ms<8) return 'Moderate breeze'; if (ms<10.8) return 'Fresh breeze';
    if (ms<13.9) return 'Strong breeze'; if (ms<17.2) return 'Near gale'; if (ms<20.8) return 'Gale';
    return 'Storm';
  },
  comfort(temp, humidity, unit) {
    const c = unit === 'imperial' ? (temp - 32) * 5/9 : temp;
    const hi = c - 0.55 * (1 - humidity/100) * (c - 14.5);
    if (hi < 10) return { label:'Cold',        color:'#60a5fa' };
    if (hi < 20) return { label:'Cool',         color:'#93c5fd' };
    if (hi < 27) return { label:'Comfortable',  color:'#4ade80' };
    if (hi < 32) return { label:'Warm',          color:'#facc15' };
    if (hi < 40) return { label:'Hot',           color:'#fb923c' };
    return { label:'Very Hot', color:'#f87171' };
  },
};
