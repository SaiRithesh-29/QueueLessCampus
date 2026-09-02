const Service = require('./models/Service');
const Token = require('./models/Token');
const User = require('./models/User');

const services = [
  {
    name: 'Canteen',
    code: 'C',
    description: 'College Canteen - Refreshments & Meals',
    averageServiceTime: 5
  },
  {
    name: 'Library',
    code: 'L',
    description: 'College Library - Books Issue & Returns Desk',
    averageServiceTime: 3
  },
  {
    name: 'Counter',
    code: 'CR',
    description: 'General Counter - Fee Payments & Certificates',
    averageServiceTime: 4
  },
  {
    name: 'Office',
    code: 'O',
    description: 'Administrative Office - Student Affairs & Queries',
    averageServiceTime: 7
  }
];

const defaultStaff = {
  name: 'Staff Admin',
  email: 'staff@queueless.com',
  password: 'staff123',
  role: 'staff'
};

const seed = async () => {
  try {
    for (const svc of services) {
      const existing = await Service.findOne({ code: svc.code });
      if (!existing) {
        await Service.create(svc);
        console.log(`Created service: ${svc.name}`);
      } else {
        existing.name = svc.name;
        existing.description = svc.description;
        existing.averageServiceTime = svc.averageServiceTime;
        if (existing.isOpen === undefined) existing.isOpen = true;
        await existing.save();
        console.log(`Service verified/updated: ${svc.name}`);
      }
    }

    const existingStaff = await User.findOne({ email: defaultStaff.email });
    if (!existingStaff) {
      await User.create(defaultStaff);
      console.log(`Created staff account: ${defaultStaff.email} / ${defaultStaff.password}`);
    } else {
      console.log(`Staff account already exists: ${defaultStaff.email}`);
    }

    console.log('Seed completed!');
  } catch (error) {
    console.error('Seed error:', error.message);
  }
};

module.exports = seed;

if (require.main === module) {
  const mongoose = require('mongoose');
  require('dotenv').config();

  mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
      console.log('Connected to MongoDB');
      await seed();
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Failed to connect:', err.message);
      process.exit(1);
    });
}
