const https = require('https');

const options = {
  hostname: 'cwdrrdgllpxysqmxnavn.supabase.co',
  port: 443,
  path: '/rest/v1/items?select=*',
  method: 'GET',
  headers: {
    'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZHJyZGdsbHB4eXNxbXhuYXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTUxNDYsImV4cCI6MjA3NzU3MTE0Nn0.2tv_Orp33adsPKZzeNYAc06cuwyiu_a1eJEW0xafpeE',
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZHJyZGdsbHB4eXNxbXhuYXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5OTUxNDYsImV4cCI6MjA3NzU3MTE0Nn0.2tv_Orp33adsPKZzeNYAc06cuwyiu_a1eJEW0xafpeE'
  }
};

console.log('Iniciando prueba de conexión a Supabase...');

const req = https.request(options, (res) => {
  let data = '';
  console.log('Código de estado de la respuesta:', res.statusCode);

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Respuesta recibida:');
    try {
      const jsonData = JSON.parse(data);
      console.log(jsonData);
    } catch (e) {
      console.log('La respuesta no es un JSON válido:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('Error durante la petición:', error);
});

req.end();
