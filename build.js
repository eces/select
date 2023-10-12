const pkg = require('./package.json')

// esbuild ./bin/cli --bundle --minify --legal-comments=inline --external:react-native-fs --external:react-native-fetch-blob --external:pg-native 
// --platform=node --target=node16.15  --outfile=cli.dist.js --define:process.env.ONPREM=true 

require('esbuild').buildSync({
  entryPoints: ['./cli'],
  outfile: 'cli.dist.js',
  bundle: true,
  minify: true,
  legalComments: 'inline',
  platform: 'node',
  target: 'node16.16',
  define: {
    'process.env.__SELECT_BUILD': 'true',
  },
  logLevel: 'info',
  packages: 'external',
  // external: [
  //   'alasql',
  //   'pg-native',
  //   // ...Object.keys(pkg.dependencies),
  //   ...Object.keys(pkg.peerDependencies || {})
  // ],
})