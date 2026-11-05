import js from '@eslint/js'
import { defineConfig, globalIgnores } from 'eslint/config'
import prettier from 'eslint-config-prettier'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default defineConfig([
    // pastas geradas ou de dados: nunca são analisadas
    globalIgnores(['dist/', 'storage/']),

    // regras recomendadas do JavaScript e do TypeScript
    js.configs.recommended,
    tseslint.configs.recommended,

    // código roda no Node: libera globais como process e Buffer
    {
        languageOptions: {
            globals: globals.node,
        },
    },

    // por último: desliga regras de estilo que brigariam com o Prettier
    prettier,
])
