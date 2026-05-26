import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

// A simple local API dev helper for Vercel functions
function apiPlugin() {
  return {
    name: 'api-plugin',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.startsWith('/api/generate')) {
          try {
            // Read body
            let body = '';
            await new Promise<void>((resolve, reject) => {
              req.on('data', chunk => body += chunk);
              req.on('end', () => resolve());
              req.on('error', err => reject(err));
            });

            const parsedBody = body ? JSON.parse(body) : {};
            
            // Mock VercelReq / VercelRes
            const mockReq = {
              body: parsedBody,
              method: req.method,
              query: {},
              headers: req.headers
            };

            let status = 200;
            let responseHeaders: Record<string, string> = {
              'Content-Type': 'application/json'
            };

            const mockRes = {
              status(code: number) {
                status = code;
                return this;
              },
              json(data: any) {
                res.writeHead(status, responseHeaders);
                res.end(JSON.stringify(data));
                return this;
              },
              setHeader(name: string, value: string) {
                responseHeaders[name] = value;
                return this;
              },
              send(data: any) {
                res.writeHead(status, responseHeaders);
                res.end(typeof data === 'string' ? data : JSON.stringify(data));
                return this;
              },
              end() {
                res.writeHead(status, responseHeaders);
                res.end();
                return this;
              }
            };

            // Call the handler
            const generateModule = await server.ssrLoadModule('./api/generate.ts');
            await generateModule.default(mockReq, mockRes);
          } catch (err: any) {
            console.error('Local API Plugin Error:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
          }
          return;
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), apiPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
