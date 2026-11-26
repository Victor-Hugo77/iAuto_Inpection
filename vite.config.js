import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import javascriptObfuscator from 'vite-plugin-javascript-obfuscator'
import fs from 'fs'
import path from 'path'

function localPersistencePlugin() {
    const dataDir = path.resolve(__dirname, 'data')
    const backupFile = path.join(dataDir, 'backup.json')

    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true })
    }

    return {
        name: 'local-persistence-plugin',
        configureServer(server) {
            server.middlewares.use('/api/storage', (req, res, next) => {
                if (req.method === 'GET') {
                    if (fs.existsSync(backupFile)) {
                        const data = fs.readFileSync(backupFile, 'utf-8')
                        res.setHeader('Content-Type', 'application/json')
                        res.end(data)
                    } else {
                        res.setHeader('Content-Type', 'application/json')
                        res.end(JSON.stringify({ models: [], images: [], activeModel: null }))
                    }
                    return
                }

                if (req.method === 'POST') {
                    let body = ''
                    req.on('data', chunk => { body += chunk })
                    req.on('end', () => {
                        try {
                            fs.writeFileSync(backupFile, body, 'utf-8')
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ success: true }))
                        } catch (err) {
                            res.statusCode = 500
                            res.setHeader('Content-Type', 'application/json')
                            res.end(JSON.stringify({ error: err.message }))
                        }
                    })
                    return
                }

                next()
            })
        }
    }
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        localPersistencePlugin(),
        javascriptObfuscator({
            compact: true,
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,
            debugProtection: true,
            debugProtectionInterval: 2000,
            disableConsoleOutput: true,
            identifierNamesGenerator: 'hexadecimal',
            log: false,
            numbersToExpressions: true,
            renameGlobals: false,
            selfDefending: true,
            simplify: true,
            splitStrings: true,
            splitStringsChunkLength: 10,
            stringArray: true,
            stringArrayCallsTransform: true,
            stringArrayEncoding: ['base64'],
            stringArrayThreshold: 0.75,
            unicodeEscapeSequence: false
        })
    ],
    server: {
        port: 5173,
        strictPort: true,
        host: true
    },
    build: {
        minify: 'terser',
        sourcemap: false,
        terserOptions: {
            compress: {
                drop_console: true,
                drop_debugger: true
            }
        }
    }
})
