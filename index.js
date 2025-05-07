module.exports = [
  'Safari >= 15.5',
  'iOS >= 10.3',
  'Chrome >= 109',
  'Samsung >= 26',
  'Firefox >= 115.0',
  'Edge >= 109',
  'Android >= 109',
];

// esbuild target syntax: https://esbuild.github.io/api/#target
module.exports.esbuildTarget = [
  'safari15.5',
  // Esbuild does not support below es6
  // ios10.3 does not support 'const' and requires es5
  // ios11 is the lowest we can support for now
  'ios11',
  'chrome109',
  'firefox115',
  'edge109',
];
