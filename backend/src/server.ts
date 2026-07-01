import 'dotenv/config';
import app, { httpServer } from "./app.js";
import { drizzle } from 'drizzle-orm/node-postgres';
import { initSocket } from './socket/index.ts';

const db = drizzle(process.env.DATABASE_URL!);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || 'localhost';

app.get('/', (req, res) => {
  res.send('Hello 66Partners!');
});

initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`API 66Partners listening on port ${PORT}`);
  console.log(`Accessible at http://${HOST}:${PORT}`);
  if (process.env.NODE_ENV) console.log(`Environment: ${process.env.NODE_ENV}`);
});


