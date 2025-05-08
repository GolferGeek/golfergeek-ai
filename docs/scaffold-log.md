# Scaffold Log (v0.1)

This document records the one-time commands used to generate the **v0.1 scaffold** so that students (or future you) can replay or modify the process.

> **Tip:** Students don't have to run these—they can simply clone the tagged repo.  The log exists for transparency and reproducibility.

---

## 1. Initialise a Turborepo workspace
```bash
# Inside the empty repo root
npm init -y                          # create root package.json
npm install -D turbo                 # add Turborepo

# Add basic turbo pipeline
cat > turbo.json <<'EOF'
{
  "$schema": "https://turborepo.org/schema.json",
  "pipeline": {
    "build": { "dependsOn": ["^build"], "outputs": [] },
    "dev":   { "cache": false },
    "start": { "cache": false }
  }
}
EOF
```

## 2. Create the NestJS API app
```bash
mkdir -p apps/api && cd apps/api
npm init -y
npm install @nestjs/core @nestjs/common reflect-metadata rxjs
npm install -D ts-node typescript

# tsconfig with decorators & emit metadata
cat > tsconfig.json <<'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2017",
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "outDir": "dist"
  },
  "include": ["src/**/*"]
}
EOF

mkdir src && cat > src/main.ts <<'EOF'
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { Module, Controller, Get } from '@nestjs/common';

@Controller('health')
class AppController {
  @Get() hello() {
    return { status: 'ok' };
  }
}

@Module({ controllers: [AppController] })
class AppModule {}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
EOF

cd ../../..
```

## 3. Create the Vue 3 front-end
```bash
mkdir -p apps/web && cd apps/web
npm init -y
npm install vue
npm install -D vite @vitejs/plugin-vue

# vite config
cat > vite.config.js <<'EOF'
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
export default defineConfig({ plugins: [vue()], server: { port: 5173 } });
EOF

mkdir src && cat > src/main.js <<'EOF'
import { createApp } from 'vue';
createApp({ template: `<h1>GolferGeek AI scaffold running</h1><p>API → /api/health</p>` }).mount('#app');
EOF

cat > index.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
  <head><meta charset="UTF-8" /><title>GolferGeek AI</title></head>
  <body><div id="app"></div><script type="module" src="/src/main.js"></script></body>
</html>
EOF

cd ../../..
```

## 4. Root scripts & Git ignore
```bash
# Append scripts to root package.json
npx jq '.scripts += {"dev:api":"turbo run start --filter api","dev:web":"turbo run dev --filter web","build":"turbo run build"}' package.json > tmp.$$.json && mv tmp.$$.json package.json

echo "node_modules/\ndist/" >> .gitignore
```

## 5. Docker Compose (optional for students)
```bash
cat > docker-compose.yml <<'EOF'
version: '3.9'
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.api
    ports:
      - '3000:3000'
  web:
    build:
      context: .
      dockerfile: Dockerfile.web
    ports:
      - '8080:80'
EOF
```
(See corresponding `Dockerfile.api` and `Dockerfile.web` in repo.)

## 6. Tag & push
```bash
git add .
git commit -m "v0.1 scaffold: NestJS + Vue + Turbo + Docker"
git tag v0.1
```

---

The repo is now ready for students to clone and run. Subsequent tags (`v0.2`, `v0.3`, …) will be created as labs progress.

*Last updated: May 2025* 