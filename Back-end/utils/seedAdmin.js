require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const seedAdmin = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in .env');
      process.exit(1);
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const email = 'mohd2002monish@gmail.com';
    let user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      user.role = 'owner';
      await user.save();
      console.log(`Updated existing user ${email} to owner role.`);
    } else {
      user = new User({
        email: email.toLowerCase(),
        name: 'Mohd Monish',
        role: 'owner',
        subscriptionTier: 'pro'
      });
      await user.save();
      console.log(`Created new owner user: ${email}`);
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Failed to seed admin user:', error.message);
    process.exit(1);
  }
};

seedAdmin();
