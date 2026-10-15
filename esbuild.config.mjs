import esbuild from 'esbuild'

esbuild.buildSync({
    entryPoints: [ "./src/main.ts" ],
    outfile: "./dist/server.bundle.mjs",
    bundle: true,
    sourcemap: true,
    minify: true,
    platform: "node",
    packages: "bundle",
    target: "es2025",
    banner: {
        "js": "/* auto-track © 2026 All-Right-Reserved */"
    },
    legalComments: "eof"
})
