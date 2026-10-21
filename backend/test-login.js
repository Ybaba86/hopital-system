const axios = require('axios');
async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'adama@gmail.com',
      password: 'password123'
    });
    console.log("Success with password123:", res.data);
  } catch (err) {
    console.log("Failed with password123:", err.response?.data);
  }
}
testLogin();
