const { default: fetch } = require('node-fetch');

async function listAndDeleteUser() {
  // List users
  const listResponse = await fetch('http://localhost:3002/api/list-users');
  const users = await listResponse.json();
  console.log('Users:', JSON.stringify(users, null, 2));

  const targetUserEmail = 'jeanmichelwilliams17@gmail.com';
  const targetUser = users.find(user => user.email === targetUserEmail);

  if (targetUser) {
    console.log(`Found ${targetUserEmail} with ID:`, targetUser.id);
    // Delete user
    const deleteResponse = await fetch('http://localhost:3002/api/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId: targetUser.id,
      }),
    });
    const deleteResult = await deleteResponse.json();
    console.log('Delete Result:', JSON.stringify(deleteResult, null, 2));
  } else {
    console.log(`${targetUserEmail} not found.`);
  }
}

listAndDeleteUser();