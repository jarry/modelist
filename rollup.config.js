export default {
  input: './src/index.js',
  output: [
    {
      file: './dist/modelist.cjs.js',
      format: 'cjs'
    },
    {
    file: './dist/modelist.esm.js',
    format: 'esm'
  }],
  // sourceMap: 'inline',
  // plugins: [
    // babel({
    //   exclude: 'node_modules/**',
    // }),
    // uglify()
  // ]
}