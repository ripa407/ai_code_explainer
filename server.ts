import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import config from './src/config';
import { bootstrapSuperAdmin } from './src/utils/bootstrapSuperAdmin';

const port = Number(config.port) || 50001;

async function main() {
  try {
    await mongoose.connect(config.database_url);

    console.log('Database connected successfully');
    await bootstrapSuperAdmin();

    app.listen(port, () => {
      console.log(`Server running on port ${port}`);
    });
  } catch (error) {
    console.log('Database connection failed', error);
  }
}

main();
