import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import * as express from 'express';
import { HttpStatusInterceptor } from '@/interceptors/http-status.interceptor';
import { join } from 'node:path';

function parsePort(): number {
  const args = process.argv.slice(2);
  const portIndex = args.indexOf('-p');
  if (portIndex !== -1 && args[portIndex + 1]) {
    const port = parseInt(args[portIndex + 1], 10);
    if (!isNaN(port) && port > 0 && port < 65536) {
      return port;
    }
  }
  return 3000;
}

export async function createApp() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.setGlobalPrefix('api');
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // 全局拦截器：统一将 POST 请求的 201 状态码改为 200
  app.useGlobalInterceptors(new HttpStatusInterceptor());
  app.enableShutdownHooks();

  return app;
}

async function bootstrap() {
  const app = await createApp();

  // 静态文件服务：生产模式下提供 H5 构建产物
  const h5DistPath = join(__dirname, '..', '..', 'dist-web');
  app.use(express.static(h5DistPath));
  app.use((req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(join(h5DistPath, 'index.html'));
    } else {
      next();
    }
  });

  const port = parsePort();
  try {
    await app.listen(port);
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    if (err.code === 'EADDRINUSE') {
      console.error(`Port ${port} in use`);
      process.exit(1);
    } else {
      throw err;
    }
  }
}

// Serverless: export handler, Local: bootstrap
if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
  // Serverless mode — handler exported below
} else {
  bootstrap();
}
