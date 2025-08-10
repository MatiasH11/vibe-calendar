import app from './app';
import { env } from './config/environment';

const server = app.listen(env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[server]: Server is running at http://localhost:${env.PORT}`);
});

export default server;


