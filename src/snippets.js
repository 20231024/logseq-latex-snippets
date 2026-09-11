// Snippets in the Latex Suite format.
//
// options:
//   m  math mode        t  text mode
//   A  trigger immediately when the pattern is typed (otherwise on space)
//   r  trigger is a regular expression
//   w  require a word boundary before the trigger
// replacement placeholders:
//   $0, $1, ...      tab stops; the cursor is placed at $0 (or the lowest one)
//   ${n:default}     tab stop with default text
//   [[0]], [[1]],... capture groups of the trigger regex
//   ${GREEK} ${SYMBOL} ${ACCENT}  snippet variables

export default [
    // ===== Text mode =====
    { trigger: "mk", replacement: "$$0$", options: "tA", description: "Inline math" },
    { trigger: "dm", replacement: "$$\n$0\n$$", options: "tAw", description: "Display math" },

    // ===== Basic operations =====
    { trigger: "sr", replacement: "^{2}", options: "mA" },
    { trigger: "cb", replacement: "^{3}", options: "mA" },
    { trigger: "rd", replacement: "^{$0}$1", options: "mA" },
    { trigger: "_", replacement: "_{$0}$1", options: "mA" },
    { trigger: "sts", replacement: "_\\text{$0}", options: "mA" },
    { trigger: "sq", replacement: "\\sqrt{ $0 }$1", options: "mA" },
    { trigger: "//", replacement: "\\frac{$0}{$1}$2", options: "mA" },
    { trigger: "fr", replacement: "\\frac{$0}{$1}$2", options: "mA" },
    { trigger: "ee", replacement: "e^{ $0 }$1", options: "mA" },
    { trigger: "invs", replacement: "^{-1}", options: "mA" },
    { trigger: "conj", replacement: "^{*}", options: "mA" },
    { trigger: "Re", replacement: "\\mathrm{Re}", options: "mA" },
    { trigger: "Im", replacement: "\\mathrm{Im}", options: "mA" },
    { trigger: "bf", replacement: "\\mathbf{$0}", options: "mA" },
    { trigger: "rm", replacement: "\\mathrm{$0}$1", options: "mA" },
    { trigger: "trace", replacement: "\\mathrm{Tr}", options: "mA" },

    // ===== Accents (regex form must win over the plain form) =====
    { trigger: /([a-zA-Z])ddot/, replacement: "\\ddot{[[0]]}", options: "rmA", priority: 2 },
    { trigger: /([a-zA-Z])dot/, replacement: "\\dot{[[0]]}", options: "rmA", priority: 1 },
    { trigger: /([a-zA-Z])hat/, replacement: "\\hat{[[0]]}", options: "rmA", priority: 1 },
    { trigger: /([a-zA-Z])bar/, replacement: "\\bar{[[0]]}", options: "rmA", priority: 1 },
    { trigger: /([a-zA-Z])tilde/, replacement: "\\tilde{[[0]]}", options: "rmA", priority: 1 },
    { trigger: /([a-zA-Z])und/, replacement: "\\underline{[[0]]}", options: "rmA", priority: 1 },
    { trigger: /([a-zA-Z])vec/, replacement: "\\vec{[[0]]}", options: "rmA", priority: 1 },

    { trigger: "hat", replacement: "\\hat{$0}$1", options: "mA" },
    { trigger: "bar", replacement: "\\bar{$0}$1", options: "mA" },
    { trigger: "ddot", replacement: "\\ddot{$0}$1", options: "mA", priority: 1 },
    { trigger: "dot", replacement: "\\dot{$0}$1", options: "mA" },
    { trigger: "cdot", replacement: "\\cdot", options: "mA" },
    { trigger: "tilde", replacement: "\\tilde{$0}$1", options: "mA" },
    { trigger: "und", replacement: "\\underline{$0}$1", options: "mA" },
    { trigger: "vec", replacement: "\\vec{$0}$1", options: "mA" },
    { trigger: "pmod", replacement: "\\pmod{$0}$1", options: "mA" },

    // ===== Greek letters =====
    { trigger: "@a", replacement: "\\alpha", options: "mA" },
    { trigger: "@b", replacement: "\\beta", options: "mA" },
    { trigger: "@g", replacement: "\\gamma", options: "mA" },
    { trigger: "@G", replacement: "\\Gamma", options: "mA" },
    { trigger: "@d", replacement: "\\delta", options: "mA" },
    { trigger: "@D", replacement: "\\Delta", options: "mA" },
    { trigger: "@e", replacement: "\\epsilon", options: "mA" },
    { trigger: ":e", replacement: "\\varepsilon", options: "mA" },
    { trigger: "@z", replacement: "\\zeta", options: "mA" },
    { trigger: "@t", replacement: "\\theta", options: "mA" },
    { trigger: "@T", replacement: "\\Theta", options: "mA" },
    { trigger: ":t", replacement: "\\vartheta", options: "mA" },
    { trigger: "@i", replacement: "\\iota", options: "mA" },
    { trigger: "@k", replacement: "\\kappa", options: "mA" },
    { trigger: "@l", replacement: "\\lambda", options: "mA" },
    { trigger: "@L", replacement: "\\Lambda", options: "mA" },
    { trigger: "@s", replacement: "\\sigma", options: "mA" },
    { trigger: "@S", replacement: "\\Sigma", options: "mA" },
    { trigger: "@u", replacement: "\\upsilon", options: "mA" },
    { trigger: "@U", replacement: "\\Upsilon", options: "mA" },
    { trigger: "@o", replacement: "\\omega", options: "mA" },
    { trigger: "@O", replacement: "\\Omega", options: "mA" },
    { trigger: "ome", replacement: "\\omega", options: "mA" },
    { trigger: "Ome", replacement: "\\Omega", options: "mA" },

    // ===== Symbols and operators =====
    { trigger: "ooo", replacement: "\\infty", options: "mA" },
    { trigger: "sum", replacement: "\\sum", options: "mA" },
    { trigger: "prod", replacement: "\\prod", options: "mA" },
    { trigger: "lim", replacement: "\\lim_{ $0 \\to $1 } $2", options: "mA" },
    { trigger: "+-", replacement: "\\pm", options: "mA" },
    { trigger: "-+", replacement: "\\mp", options: "mA" },
    { trigger: "...", replacement: "\\dots", options: "mA" },
    { trigger: "nabl", replacement: "\\nabla", options: "mA" },
    { trigger: "xx", replacement: "\\times", options: "mA" },
    { trigger: "**", replacement: "\\cdot", options: "mA" },
    { trigger: "para", replacement: "\\parallel", options: "mA" },
    { trigger: "deg", replacement: "\\degree", options: "mA" },

    // ===== Relations =====
    { trigger: "===", replacement: "\\equiv", options: "mA" },
    { trigger: "!=", replacement: "\\neq", options: "mA" },
    { trigger: ">=", replacement: "\\geq", options: "mA" },
    { trigger: "<=", replacement: "\\leq", options: "mA" },
    { trigger: ">>", replacement: "\\gg", options: "mA" },
    { trigger: "<<", replacement: "\\ll", options: "mA" },
    { trigger: "simm", replacement: "\\sim", options: "mA" },
    { trigger: "sim=", replacement: "\\simeq", options: "mA" },
    { trigger: "prop", replacement: "\\propto", options: "mA" },

    // ===== Arrows =====
    { trigger: "<->", replacement: "\\leftrightarrow ", options: "mA" },
    { trigger: "->", replacement: "\\to", options: "mA" },
    { trigger: "!>", replacement: "\\mapsto", options: "mA" },
    { trigger: "=>", replacement: "\\implies", options: "mA" },
    { trigger: "=<", replacement: "\\impliedby", options: "mA" },

    // ===== Sets =====
    { trigger: "and", replacement: "\\cap", options: "mA" },
    { trigger: "orr", replacement: "\\cup", options: "mA" },
    { trigger: "inn", replacement: "\\in", options: "mA" },
    { trigger: "notin", replacement: "\\not\\in", options: "mA" },
    { trigger: "sub=", replacement: "\\subseteq", options: "mA" },
    { trigger: "sup=", replacement: "\\supseteq", options: "mA" },
    { trigger: "eset", replacement: "\\emptyset", options: "mA" },
    { trigger: "set", replacement: "\\{ $0 \\}$1", options: "mA" },

    // ===== Blackboard letters =====
    { trigger: "LL", replacement: "\\mathcal{L}", options: "mA" },
    { trigger: "HH", replacement: "\\mathcal{H}", options: "mA" },
    { trigger: "CC", replacement: "\\mathbb{C}", options: "mA" },
    { trigger: "RR", replacement: "\\mathbb{R}", options: "mA" },
    { trigger: "ZZ", replacement: "\\mathbb{Z}", options: "mA" },
    { trigger: "NN", replacement: "\\mathbb{N}", options: "mA" },
    { trigger: "QQ", replacement: "\\mathbb{Q}", options: "mA" },

    // ===== Derivatives and integrals =====
    { trigger: "par", replacement: "\\frac{ \\partial $0 }{ \\partial $1 } $2", options: "m" },
    { trigger: "ddt", replacement: "\\frac{d}{dt} ", options: "mA" },
    { trigger: "dint", replacement: "\\int_{$0}^{$1} $2 \\, d$3 $4", options: "mA" },
    { trigger: "oint", replacement: "\\oint", options: "mA" },
    { trigger: "iint", replacement: "\\iint", options: "mA" },
    { trigger: "iiint", replacement: "\\iiint", options: "mA" },

    // ===== Trigonometry =====
    { trigger: /([^\\])(arcsin|sin|arccos|cos|arctan|tan|csc|sec|cot)/, replacement: "[[0]]\\[[1]]", options: "rmA", priority: 1 },
    { trigger: /([^\\])(det)/, replacement: "[[0]]\\[[1]]", options: "rmA", priority: 1 },
    { trigger: /([^\\])int/, replacement: "[[0]]\\int", options: "rmA", priority: -1 },

    // ===== Brackets =====
    { trigger: "avg", replacement: "\\langle $0 \\rangle $1", options: "mA" },
    { trigger: "norm", replacement: "\\lvert $0 \\rvert $1", options: "mA" },
    { trigger: "Norm", replacement: "\\lVert $0 \\rVert $1", options: "mA" },
    { trigger: "ceil", replacement: "\\lceil $0 \\rceil $1", options: "mA" },
    { trigger: "floor", replacement: "\\lfloor $0 \\rfloor $1", options: "mA" },
    { trigger: "mod", replacement: "|$0|$1", options: "mA" },
    { trigger: "lr(", replacement: "\\left( $0 \\right) $1", options: "mA" },
    { trigger: "lr{", replacement: "\\left\\{ $0 \\right\\} $1", options: "mA" },
    { trigger: "lr[", replacement: "\\left[ $0 \\right] $1", options: "mA" },
    { trigger: "lr|", replacement: "\\left| $0 \\right| $1", options: "mA" },
    { trigger: "lra", replacement: "\\left< $0 \\right> $1", options: "mA" },

    // ===== Environments =====
    { trigger: /(?<![A-Za-z])(?<!\\begin\{)(?<!\\end\{)([pbBvV]mat)/, replacement: "\\begin{[[0]]rix}\n$0\n\\end{[[0]]rix}", options: "rMA", priority: 1 },
    { trigger: /(?<![A-Za-z])(?<!\\begin\{)(?<!\\end\{)(matrix|cases|align|array)/, replacement: "\\begin{[[0]]}\n$0\n\\end{[[0]]}", options: "rMA", priority: 1 },

    // ===== Physics =====
    { trigger: "kbt", replacement: "k_{B}T", options: "mA" },
    { trigger: "msun", replacement: "M_{\\odot}", options: "mA" },

    // ===== Quantum mechanics =====
    { trigger: "dag", replacement: "^{\\dagger}", options: "mA" },
    { trigger: "o+", replacement: "\\oplus ", options: "mA" },
    { trigger: "ox", replacement: "\\otimes ", options: "mA" },
    { trigger: "bra", replacement: "\\bra{$0} $1", options: "mA" },
    { trigger: "ket", replacement: "\\ket{$0} $1", options: "mA" },
    { trigger: "brk", replacement: "\\braket{ $0 | $1 } $2", options: "mA" },

    // ===== Chemistry =====
    { trigger: "pu", replacement: "\\pu{ $0 }", options: "mA" },
    { trigger: "cee", replacement: "\\ce{ $0 }", options: "mA" },
    { trigger: "he4", replacement: "{}^{4}_{2}He ", options: "mA" },
    { trigger: "he3", replacement: "{}^{3}_{2}He ", options: "mA" },
    { trigger: "iso", replacement: "{}^{$0}_{$1}$2", options: "mA" },

    // ===== Text environment =====
    { trigger: /\n\s*"/, replacement: "\n\\text{$0 } $1", options: "mrA" },
    { trigger: "text", replacement: "\\text{$0}$1", options: "mA", priority: -1 },
    { trigger: "\"", replacement: "\\text{$0}$1", options: "mA", priority: -1 },

    // ===== More operations =====
    { trigger: /(\d)rt/, replacement: "\\sqrt[[[0]]]{ $0 }$1", options: "mA", description: "Nth root" },
    { trigger: /([^\\])(exp|log|ln)/, replacement: "[[0]]\\[[1]]", options: "rmA" },

    // ===== Derivatives =====
    { trigger: /par([0-9])/, replacement: "\\frac{ \\partial^{[[0]]} ${0:y} }{ \\partial ${1:x}^{[[0]]} } $2", options: "mA" },
    { trigger: /parn/, replacement: "\\frac{ \\partial^{${0:n}} ${1:y} }{ \\partial ${2:x}^{${0:n}} } $2", options: "mA" },
    { trigger: /pa([A-Za-z])([A-Za-z])/, replacement: "\\frac{ \\partial [[0]] }{ \\partial [[1]] } ", options: "rm" },
    { trigger: "ddt", replacement: "\\frac{d}{dt} ", options: "mA" },

    // ===== Integrals and sums =====
    { trigger: "\\int", replacement: "\\int $0 \\, d${1:x} $2", options: "m" },
    { trigger: "dint", replacement: "\\int_{${0:0}}^{${1:1}} $2 \\, d${3:x} $4", options: "mA" },
    { trigger: "oinf", replacement: "\\int_{0}^{\\infty} $0 \\, d${1:x} $2", options: "mA" },
    { trigger: "infi", replacement: "\\int_{-\\infty}^{\\infty} $0 \\, d${1:x} $2", options: "mA" },
    { trigger: /([^\\])int/, replacement: "[[0]]\\int", options: "mA", priority: -1 },
    { trigger: "\\sum", replacement: "\\sum_{${0:i}=${1:1}}^{${2:N}} $3", options: "m" },
    { trigger: "\\prod", replacement: "\\prod_{${0:i}=${1:1}}^{${2:N}} $3", options: "m" },

    // ===== Inverse trig =====
    { trigger: /(arccsc|arcsec|arccot)/, replacement: "\\operatorname{[[0]]}$0", options: "mA", priority: 1 },

    // ===== Subscripts =====
    { trigger: "xnn", replacement: "x_{n}", options: "mA" },
    { trigger: "\\xii", replacement: "x_{i}", options: "mA", priority: 1 },
    { trigger: "xjj", replacement: "x_{j}", options: "mA" },
    { trigger: "xp1", replacement: "x_{n+1}", options: "mA" },
    { trigger: "ynn", replacement: "y_{n}", options: "mA" },
    { trigger: "yii", replacement: "y_{i}", options: "mA" },
    { trigger: "yjj", replacement: "y_{j}", options: "mA" },

    // ===== Taylor expansion =====
    { trigger: "tayl", replacement: "${0:f}(${1:x} + ${2:h}) = ${0:f}(${1:x}) + ${0:f}'(${1:x})${2:h} + ${0:f}''(${1:x}) \\frac{${2:h}^{2}}{2!} + \\dots$3", options: "mA" },

    // ===== Auto letter subscript and space after macros =====
    {
        trigger: /(\\?)([A-Za-z]+)(\d)/,
        replacement: (match) => {
            const isMacro = match[1] === "\\";
            const digit = match[3];
            if (!isMacro) {
                const variable = match[2];
                return `${variable}_{${digit}}`;
            }
            const greek = require("latex-suite").snippetVariables["${GREEK}"];
            const greekPattern = new RegExp("^(?:" + greek + ")$");
            const macroName = match[2];
            if (greekPattern.test(macroName)) {
                return `\\${macroName}_{${digit}}`;
            }
            return `\\${macroName} ${digit}`;
        },
        options: "rmA",
        priority: -1,
        description: "x3 -> x_{3}, \\alpha3 -> \\alpha_{3}, \\leq1 -> \\leq 1",
    },
    // x_{3}4 -> x_{34}, \alpha_{3}4 -> \alpha_{34}
    { trigger: "(\\\\${GREEK}|[A-Za-z])_{(\\d+)}(\\d)", replacement: "[[0]]_{[[1]][[2]]}", options: "rmA", priority: -1 },
    // \dot{x}3 -> \dot{x}_{3}, \dot{x}_{3}4 -> \dot{x}_{34}
    { trigger: "\\\\(${ACCENT})\\{(\\\\${GREEK}|[A-Za-z])\\}(?:_\\{(\\d+)\\})?(\\d)", replacement: "\\[[0]]{[[1]]}_{[[2]][[3]]}", options: "rmA", priority: -1 },
    { trigger: "\\\\(${ACCENT})\\{\\\\(${ACCENT})\\{(\\\\${GREEK}|[A-Za-z])\\}\\}(?:_\\{(\\d+)\\})?(\\d)", replacement: "\\[[0]]{\\[[1]]{[[2]]}}_{[[3]][[4]]}", options: "rmA", priority: -1 },

    // ===== Identity matrix =====
    {
        trigger: /iden(\d)/,
        replacement: (match) => {
            const n = match[1];
            const arr = [];
            for (let j = 0; j < n; j++) {
                arr[j] = [];
                for (let i = 0; i < n; i++) {
                    arr[j][i] = (i === j) ? 1 : 0;
                }
            }
            let output = arr.map(el => el.join(" & ")).join(" \\\\\n");
            output = `\\begin{pmatrix}\n${output}\n\\end{pmatrix}`;
            return output;
        },
        options: "mA",
        description: "N x N identity matrix",
    },

    // ===== Display math when in a list =====
    {
        trigger: /(?<positive_lookbehind>(?:\n|^)[ \t]*>*)(?<marker>\d+[.)]|[-*+])(?<whitespace>[ \t]+)(?<text>.*)dm/,
        replacement: (m) => {
            const { positive_lookbehind, whitespace, text, marker } = m.groups;
            const firstLine = marker + whitespace + text;
            const indent = " ".repeat(marker.length) + whitespace;
            return `${positive_lookbehind}${firstLine}\n${indent}$$\n${indent}$0\n${indent}$$`;
        },
        options: "rtA",
        priority: 2,
    },

    // ===== Auto backslash for greek letters =====
    { trigger: /([^\\])(${GREEK})/, replacement: "[[0]]\\[[1]]", options: "rmA", priority: -1 },
];
