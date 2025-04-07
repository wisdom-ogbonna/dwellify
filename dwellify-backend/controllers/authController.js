const admin = require('../config/firebase');

const signupUser = async (req, res) => {
  const { fullName, email, password } = req.body;

  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const user = await admin.auth().createUser({
      email,
      password,
      displayName: fullName,
    });

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        uid: user.uid,
        email: user.email,
        fullName: user.displayName,
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { signupUser };
