const { default: fetch } = require('node-fetch');

async function login() {
  const response = await fetch('http://localhost:3002/api/sign-in', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'scout@example.com',
      password: 'password',
    }),
  });

  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

login();