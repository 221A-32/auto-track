import js from '@eslint/js'
import { defineConfig } from 'eslint/config'
import stylistic from '@stylistic/eslint-plugin'
import globals from 'globals'
import tseslint from 'typescript-eslint'

const contextQuotes = {
    meta: {
        type: "layout",
        fixable: "code",
        schema: [],
        messages: {
            wrongQuote: "Expected {{style}} quotes for this string"
        }
    },

    create(context) {
        const sourceCode = context.sourceCode

        return {
            Literal(node) {
                if (typeof node.value !== "string") {
                    return
                }

                const raw = sourceCode.getText(node)

                if (raw[0] !== "'" && raw[0] !== "\"") {
                    return
                }

                const parent = node.parent

                const isImportSpecifier = (
                    ([ "ImportDeclaration", "ImportExpression" ].includes(parent?.type) && parent.source === node)
                    || (parent?.type === "TSExternalModuleReference" && parent.expression === node)
                    || (parent?.type === "TSImportType" && parent.argument === node)
                    || (parent?.type === "TSLiteralType" && parent.parent?.type === "TSImportType")
                )

                const isTypeLiteral = parent?.type === "TSLiteralType"

                if (isTypeLiteral && !isImportSpecifier) {
                    return
                }

                const expected = isImportSpecifier ? "'" : "\""

                if (raw[0] === expected) {
                    return
                }

                context.report({
                    node,
                    messageId: "wrongQuote",
                    data: {
                        style: isImportSpecifier ? "single" : "double"
                    },

                    fix(fixer) {
                        const quoted = JSON.stringify(node.value)
                        const replacement = expected === "\"" ? quoted : "'" + quoted.slice(1, -1).replace(/\\"/g, "\"").replace(/'/g, "\\'") + "'"

                        return fixer.replaceText(node, replacement)
                    }
                })
            }
        }
    }
}

export default defineConfig(
    {
        ignores: [
            "**/node_modules/**",
            "**/dist/**",
            "**/src/generated/**"
        ]
    },

    {
        files: [
            "**/*.{js,mjs,ts}"
        ],

        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            tseslint.configs.stylistic,

            stylistic.configs.customize({
                indent: 4,
                quotes: "double",
                semi: false,
                jsx: true
            })
        ],

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },

        plugins: {
            local: {
                rules: {
                    "context-quotes": contextQuotes
                }
            }
        },

        rules: {
            /* Spacing */
            "@stylistic/array-bracket-spacing": [ "error", "always" ],
            "@stylistic/operator-linebreak": [ "error", "before" ],
            "@stylistic/max-statements-per-line": [ "off" ],

            /* Comma */
            "@stylistic/comma-dangle": [ "error", "never" ],

            /* Quotes */
            "local/context-quotes": [ "error" ],
            "@stylistic/quotes": [ "off" ],
            "@stylistic/jsx-quotes": [ "error", "prefer-double" ],
            "@stylistic/quote-props": [ "off" ],

            /* Semi */
            "@stylistic/semi": [ "error", "never", { beforeStatementContinuationChars: "always" } ],
            "@stylistic/member-delimiter-style": [
                "error",
                {
                    multiline: {
                        delimiter: "none",
                        requireLast: false
                    },
                    singleline: {
                        delimiter: "semi",
                        requireLast: false
                    }
                }
            ],

            /* Braces */
            curly: [ "error", "all" ]
        }
    }
)
