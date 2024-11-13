import babel from 'rollup-plugin-babel'
import resolve from 'rollup-plugin-node-resolve'

export default {
    input: './src/index.js',
    output: {
        file: './dist/toy-vue.js',
        name: 'TVue',
        format: 'umd', // esm cjs iife umd
        sourcemap: true,
    },
    plugins: [
        resolve(),
        babel({
            exclude: 'node_modules/**'
        }),
    ]
}