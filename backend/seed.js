const Service = require('./models/Service');
const Token = require('./models/Token');

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

const seed = async () => {
  try {
    for (const svc of services) {
      const existing = await Service.findOne({ code: svc.code });
      if (!existing) {
        await Service.create(svc);
        console.log(`Created service: ${svc.name}`);
      } else {
        // Update description or make sure it matches
        existing.name = svc.name;
        existing.description = svc.description;
        existing.averageServiceTime = svc.averageServiceTime;
        if (existing.isOpen === undefined) existing.isOpen = true;
        await existing.save();
        console.log(`Service verified/updated: ${svc.name}`);
      }
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
