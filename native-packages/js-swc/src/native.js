let parts = [process.platform, process.arch];
if (process.platform === 'linux') {
  const {MUSL, family} = require('detect-libc');
  if (family === MUSL) {
    parts.push('musl');
  } else if (process.arch === 'arm') {
    parts.push('gnueabihf');
  } else {
    parts.push('gnu');
  }
} else if (process.platform === 'win32') {
  parts.push('msvc');
}

module.exports = process.env.SWC_WASM
  ? (() => {
      let wasm = require('../wasm/pkg/');
      return {
        transform: (...args) => {
          let result = wasm.transform(...args);
          return {
            ...result,
            hoist_result: {
              ...result.hoist_result,
              exported_symbols: Object.fromEntries([
                ...result.hoist_result.exported_symbols,
              ]),
            },
          };
        },
      };
    })()
  : require(`../parcel-swc.${parts.join('-')}.node`);
