export default async function handler(req, res) {
  // Setup CORS to allow your frontend to communicate with this endpoint
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*'); // Or specifically 'https://ccs-career-cred-13.web.app'
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { code, redirect_uri } = req.body;
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;

  if (!code || !redirect_uri) {
    return res.status(400).json({ error: 'Missing code or redirect_uri' });
  }

  try {
    // 1. Exchange the code for an Access Token
    const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirect_uri,
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok) {
      return res.status(400).json({ error: tokenData.error_description || 'Failed to get token' });
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch the user's profile info
    const userResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const userData = await userResponse.json();

    if (!userResponse.ok) {
      return res.status(400).json({ error: 'Failed to fetch user data' });
    }

    // Return the required fields to the frontend
    res.status(200).json({
      name: userData.name,
      email: userData.email,
      picture: userData.picture, // The URL of their profile photo
    });
  } catch (error) {
    console.error("LinkedIn Auth Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
