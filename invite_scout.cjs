const { default: fetch } = require('node-fetch');

const backendUrl = 'http://localhost:5173/api/invite-user';

async function inviteUser() {
  const args = process.argv.slice(2);
  const email = args[args.indexOf('--email') + 1];
  const password = args[args.indexOf('--password') + 1];
  const name = args[args.indexOf('--name') + 1];
  const crewIndex = args.indexOf('--crew');
  const crew = crewIndex !== -1 ? args[crewIndex + 1] : 'Kingfishers';
  const rank = args[args.indexOf('--rank') + 1];

   // console.log('Sending invite for:', { email, name, crew, rank });

   const response = await fetch(backendUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: email,
      user_metadata: {
        userrole: 'scout',
        name: name,
        rank: rank,
        crew: crew,
      },
    }),
  });

  // Log the raw response text before attempting to parse as JSON
  const responseText = await response.text();
  console.log('Raw backend response:', responseText);

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}, body: ${responseText}`);
  }

  const data = JSON.parse(responseText);
  console.log(JSON.stringify(data, null, 2));
}

inviteUser();