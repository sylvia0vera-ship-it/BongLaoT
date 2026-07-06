import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import * as express from 'express';
import { HttpStatusInterceptor } from '@/interceptors/http-status.interceptor';
import { ExpressAdapter } from '@nestjs/platform-express';

const server = express();
let app: any = null;

async function createApp() {
  if (!app) {
    const adapter = new ExpressAdapter(server);
    app = await NestFactory.create(AppModule, adapter);

    app.enableCors({
      origin: true,
      credentials: true,
    });
    app.setGlobalPrefix('api');
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    app.useGlobalInterceptors(new HttpStatusInterceptor());
    app.enableShutdownHooks();

    await app.init();
  }
  return app;
}

export default async (req: express.Request, res: express.Response) => {
  await createApp();
  server(req, res);
};
