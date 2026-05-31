const js = require('@eslint/js');
const stylistic = require('@stylistic/eslint-plugin');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const tsParser = require('@typescript-eslint/parser');

const tsFiles = ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'];
const tsRecommended = tsPlugin.configs['flat/recommended'].map((config) => (
    config.files ? config : { ...config, files: tsFiles }
));

module.exports = [
    {
        ignores: ['dist/**', 'eslint.config.cjs'],
    },
    js.configs.recommended,
    ...tsRecommended,
    {
        files: tsFiles,
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            '@stylistic': stylistic,
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            'array-bracket-spacing': 'error',
            'block-spacing': 'error',
            camelcase: 'error',
            'computed-property-spacing': 'error',
            'dot-location': ['error', 'property'],
            'eol-last': 'error',
            eqeqeq: 'error',
            'function-call-argument-newline': ['error', 'consistent'],
            'key-spacing': 'error',
            'no-multi-spaces': 'error',
            'no-multiple-empty-lines': 'error',
            'no-trailing-spaces': 'error',
            'no-undef': 'off',
            'no-var': 'error',
            'no-whitespace-before-property': 'error',
            'object-curly-spacing': ['error', 'always'],
            'object-property-newline': ['error', { allowAllPropertiesOnSameLine: true }],
            'operator-linebreak': ['error', 'before'],
            'padded-blocks': ['error', 'never'],
            'semi-spacing': 'error',
            'space-before-blocks': 'error',
            'space-in-parens': 'error',
            'space-unary-ops': ['error', { words: true, nonwords: false }],
            'spaced-comment': 'error',
            'switch-colon-spacing': 'error',
            'unicode-bom': 'error',
            '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: true }],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/comma-spacing': 'error',
            '@stylistic/function-call-spacing': 'error',
            '@stylistic/indent': ['error', 4, { SwitchCase: 1 }],
            '@stylistic/keyword-spacing': 'error',
            '@stylistic/no-extra-semi': 'error',
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/semi': 'error',
            '@stylistic/space-before-function-paren': [
                'error',
                { anonymous: 'never', named: 'never', asyncArrow: 'always' },
            ],
            '@stylistic/space-infix-ops': 'error',
            '@stylistic/type-annotation-spacing': 'error',
            '@typescript-eslint/no-non-null-assertion': 'off',
            '@typescript-eslint/no-unused-expressions': 'error',
            '@typescript-eslint/prefer-optional-chain': 'error',
        },
    },
];
