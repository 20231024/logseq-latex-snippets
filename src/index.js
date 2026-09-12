// const fs = require('fs');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};


const is_debugging = false;


/*! For license information please see lsplugin.user.js.LICENSE.txt */


const DEFAULT_LOCALE = "en";
let locale$1 = DEFAULT_LOCALE;
let translations = {};

let user_settings = {};
/*
* The user's settings. E.g. : if (user_settings.wrapwithDollarBracket) { ... }
*/

async function setup({ defaultLocale = DEFAULT_LOCALE, builtinTranslations, }) {
    locale$1 = (await logseq.App.getUserConfigs()).preferredLanguage;
    if (locale$1 === defaultLocale)
        return;
    if (builtinTranslations?.[locale$1] != null) {
        translations = builtinTranslations;
    }
}

function t(key, args) {
    const template = translations[locale$1]?.[key] ?? key;
    if (args == null)
        return template;
    return Object.entries(args).reduce((str, [name, val]) => str.replaceAll(`\${${name}}`, val), template);
}

var zhCN = {
    "Reload user functions": "重新加载用户函数",
    "User defined functions reloaded.": "用户函数已重新加载。",
};



window.clipboard = async () => {
    return await parent.navigator.clipboard.readText() ?? "";
};

window.callPlugin = (key, ...args) => {
    // HACK: Wait some time to allow text update to run first.
    setTimeout(() => logseq.App.invokeExternalPlugin(key, ...args), 50);
    return "";
};

window.callCommand = (key, ...args) => {
    // This function is used to call a command after a delay of 50 milliseconds.
    // HACK: Wait some time to allow text update to run first.
    setTimeout(() => logseq.App.invokeExternalCommand(key, ...args), 50);
    return "";
};

const TRIGGER_IMMEDIATE = 1;
const TRIGGER_REGEX = 4;
const IN_INLINEMATH = 7;
const IN_DISPLAYMATH = 10;
const NOT_IN_MATH = -1;
const PairOpenChars = '{([';
const PairCloseChars = '})]';


let regexRules = [];
let textModeRules = [];
let immediateRules = [];

const evaluate = eval;

let selectedText = "";
/* 
* The selected text is temperarily stored here.
* It is updated in callback function beforeInputHandler; when user types, the selected words will be replaced due to logseq.
* So here is a copy of that deleted words, e.g. to enable bracket behavior of dollar symbols. See function handleSpecialKeys for example.
*/

function init() { // sets up a function that will be called whenever the specified event happens (e.g. keydown, beforeinput)
    const appContainer = parent.document.getElementById("app-container");

    appContainer.addEventListener("keydown", keydownHandler, true); // Capture phase, so we run before Logseq's own editor key handling.
    appContainer.addEventListener("beforeinput", beforeInputHandler); // The DOM beforeinput event fires when the value of an <input> or <textarea> element is about to be modified. But in contrast to the input event, it does not fire on the <select> element.

    // Not every user modification results in beforeinput firing. Also the event may fire but be non-cancelable. This may happen when the modification is done by autocomplete, by accepting a correction from a spell checker, by password manager autofill, by IME, or in other ways. The details vary by browser and OS. To override the edit behavior in all situations, the code needs to handle the input event and possibly revert any modifications that were not handled by the beforeinput handler.

    appContainer.addEventListener("input", inputHandler); // The input event fires when the value of an <input>, <select>, or <textarea> element has been changed as a direct result of a user action (such as typing in a textbox or checking a checkbox).
    // appContainer.addEventListener("compositionend", inputHandler); // represents events that occur due to the user indirectly entering text.
}

function cleanUp() {
    const appContainer = parent.document.getElementById("app-container");

    // appContainer.removeEventListener("compositionend", inputHandler);

    appContainer.removeEventListener("input", inputHandler);
    appContainer.removeEventListener("beforeinput", beforeInputHandler);
    appContainer.removeEventListener("keydown", keydownHandler, true);
}

const SNIPPET_VARIABLES = {
    GREEK: "alpha|beta|gamma|Gamma|delta|Delta|epsilon|varepsilon|zeta|eta|theta|Theta|vartheta|iota|kappa|lambda|Lambda|mu|nu|xi|Xi|pi|Pi|rho|varrho|sigma|Sigma|tau|upsilon|Upsilon|phi|varphi|Phi|chi|psi|Psi|omega|Omega",
    SYMBOL: "pm|mp|times|div|cdot|ast|star|circ|bullet|oplus|ominus|otimes|oslash|odot|dagger|ddagger|cap|cup|uplus|sqcap|sqcup|vee|wedge|setminus|wr|diamond|bigtriangleup|bigtriangledown|triangleleft|triangleright|infty|nabla|partial|forall|exists|nexists|emptyset|varnothing|neg|top|bot|vdash|dashv|models|perp|parallel|mid|nmid|subset|supset|subseteq|supseteq|in|ni|notin|approx|sim|simeq|cong|equiv|propto|neq|geq|leq|gg|ll|to|rightarrow|leftarrow|leftrightarrow|Rightarrow|Leftarrow|Leftrightarrow|mapsto|implies|impliedby|sum|prod|int|oint|iint|iiint|lim|dots|ldots|cdots|vdots|ddots",
    ACCENT: "hat|bar|dot|ddot|tilde|vec|underline|widehat|widetilde|overrightarrow|overleftarrow|overbrace|underbrace",
};

function expandSnippetVariables(str) {
    return str.replace(/\$\{([A-Z_]+)\}/g, (whole, name) => SNIPPET_VARIABLES[name] != null ? SNIPPET_VARIABLES[name] : whole);
}

// Minimal `latex-suite` module so snippet files that call require("latex-suite") still work.
const LATEX_SUITE_STUB = {
    snippetVariables: {
        "${GREEK}": SNIPPET_VARIABLES.GREEK,
        "${SYMBOL}": SNIPPET_VARIABLES.SYMBOL,
        "${ACCENT}": SNIPPET_VARIABLES.ACCENT,
        "${VISUAL}": "",
    },
    ALL_MACROS: [],
};

function requireLatexSuite(name) {
    if (name === "latex-suite") return LATEX_SUITE_STUB;
    throw new Error("Cannot require '" + name + "'");
}

function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function convertLatexSuiteReplacement(repl) {
    // Convert a Latex Suite replacement into this plugin's format:
    //   [[n]]          -> regex capture group n
    //   $0, $1, ...    -> tab stops; the cursor placeholder becomes "@", the rest are dropped
    //   ${n:default}   -> default text, cursor placed after it when n is the cursor placeholder

    repl = repl.replace(/\[\[(\d+)\]\]/g, (m, n) => `\u0001${parseInt(n, 10) + 1}\u0002`); // [[0]] is capture group 1, [[1]] is group 2, ...

    const indices = [];
    let m;
    const placeholder = /\$\{(\d+):[^}]*\}|\$(\d+)/g;
    while ((m = placeholder.exec(repl)) != null) {
        indices.push(m[1] != null ? parseInt(m[1], 10) : parseInt(m[2], 10));
    }
    const cursorIndex = indices.includes(0) ? 0 : (indices.length > 0 ? Math.min(...indices) : null);

    let cursorEmitted = false;
    repl = repl.replace(/\$\{(\d+):([^}]*)\}|\$(\d+)/g, (whole, n1, def, n2) => {
        const n = n1 != null ? parseInt(n1, 10) : parseInt(n2, 10);
        const text = n1 != null ? def : "";
        if (n === cursorIndex && !cursorEmitted) {
            cursorEmitted = true;
            return text + "@";
        }
        return text; // Repeated placeholders are not mirrored; keep their default text only.
    });

    return repl.replace(/\u0001(\d+)\u0002/g, (m, n) => `$${n}`); // Restore capture-group references.
}

function normalizeLatexSuiteRule(rule) {
    // Convert one Latex Suite snippet ({trigger, replacement, options, priority}) into this plugin's internal rule.
    const options = rule.options || "";
    if (options.includes("v") || options.includes("V")) return null; // Visual mode is not supported.
    if (rule.replacement == null || rule.trigger == null) return null;

    const mode = options.includes("m") ? "math" : options.includes("t") ? "text" : "math";
    const immediate = options.includes("A");
    const isRegex = options.includes("r") || rule.trigger instanceof RegExp;
    const wordBoundary = options.includes("w");

    let source;
    let flags = "";
    if (rule.trigger instanceof RegExp) {
        source = rule.trigger.source;
        flags = rule.trigger.flags;
    } else if (isRegex) {
        source = String(rule.trigger);
    } else {
        source = escapeRegExp(String(rule.trigger));
    }

    source = expandSnippetVariables(source);
    if (wordBoundary) source = "(?<![A-Za-z0-9])" + source;
    if (!source.endsWith("$")) source += "$";

    let trigger;
    try {
        trigger = new RegExp(source, flags.replace("g", ""));
    } catch (err) {
        console.warn("Skipping snippet with invalid trigger:", rule.trigger, err);
        return null;
    }

    let repl = null;
    let replFn = null;
    if (typeof rule.replacement === "function") {
        replFn = rule.replacement;
    } else {
        repl = convertLatexSuiteReplacement(expandSnippetVariables(String(rule.replacement)));
    }

    return { trigger, repl, replFn, mode, immediate, priority: rule.priority || 0 };
}

function snippetUrls(name) {
    // Candidate URLs for a plugin file. Logseq's resolveResourceFullUrl resolves against the plugin root,
    // while a bare relative URL resolves against this HTML (which lives in src/). Try both.
    const urls = [];
    try {
        if (typeof logseq.resolveResourceFullUrl === "function") {
            urls.push(logseq.resolveResourceFullUrl("src/" + name));
            urls.push(logseq.resolveResourceFullUrl(name));
        }
    } catch (err) {
        // Ignore and fall back to relative URLs.
    }
    urls.push("./" + name);
    return urls;
}

function resolveSnippetUrl(name) {
    return snippetUrls(name)[0];
}

async function fetchSnippetText(name) {
    // fetch() rejects for a missing file:// URL instead of resolving with ok:false, so each candidate is guarded.
    for (const url of snippetUrls(name)) {
        try {
            const res = await fetch(url);
            if (res.ok) return await res.text();
        } catch (err) {
            // Try the next candidate.
        }
    }
    return null;
}

async function loadLatexSuiteSnippets() {
    // Loads an optional snippets.js written in the Latex Suite format: `export default [ {trigger, replacement, options}, ... ]`.

    // 1) Dynamic import: works when snippets.js is served as a module.
    for (const url of snippetUrls("snippets.js")) {
        try {
            const mod = await import(url);
            if (mod && Array.isArray(mod.default)) return mod.default;
        } catch (err) {
            // Try the next candidate.
        }
    }

    // 2) Fetch and evaluate the module source.
    try {
        let text = await fetchSnippetText("snippets.js");
        if (text == null || text.trim().length === 0) return null;

        if (/export\s+default/.test(text)) {
            text = text.replace(/export\s+default/, "return");
        } else if (/module\.exports\s*=/.test(text)) {
            text = text.replace(/module\.exports\s*=/, "return");
        } else {
            return null;
        }

        const parsed = (new Function("require", text))(requireLatexSuite);
        return Array.isArray(parsed) ? parsed : null;
    } catch (err) {
        console.error("Failed to load snippets.js:", err);
        return null;
    }
}

async function getUserRules() {
    const mathRules = []; // Rules that are triggered inside a latex environment.
    const textRules = []; // Rules that are triggered outside of any latex environment.

    // Preferred format: snippets.js in the Latex Suite style.
    const suite = await loadLatexSuiteSnippets();
    if (suite != null) {
        const normalized = suite
            .map(normalizeLatexSuiteRule)
            .filter(rule => rule != null)
            .sort((a, b) => (b.priority || 0) - (a.priority || 0));

        for (const rule of normalized) {
            if (rule.mode === "text") textRules.push(rule);
            else mathRules.push(rule);
        }

        console.log(`Loaded ${mathRules.length} math and ${textRules.length} text snippets from snippets.js`);
        return { mathRules, textRules };
    }

    // Fallback format: snippets.json groups of {match, replacement}.
    const jsonText = await fetchSnippetText("snippets.json");
    if (jsonText == null) {
        console.error("Could not load snippets.json");
        return { mathRules: [], textRules: [] };
    }
    var config = JSON.parse(jsonText);

    if (is_debugging) {
        console.log("config", config);
    }

    for (const group of Object.keys(config)) {
        const groupIsTextMode = group.toLowerCase() === "textmode";

        for (let i = 0; i < config[group].length; i++) {
            let rule = config[group][i];

            const trigger = user_settings.caseInsensitive
                ? new RegExp(`${rule.match}$`, "i") // The i flag at the end would make the regex case-insensitive.
                : new RegExp(`${rule.match}$`);

            const parsed = { trigger, repl: rule.replacement };

            if (groupIsTextMode || rule.mode === "text") {
                // Text-mode rules fire immediately as soon as the pattern is typed, unless "immediate": false is set.
                parsed.immediate = rule.immediate !== false;
                textRules.push(parsed);
            } else {
                mathRules.push(parsed);
            }
        }

        console.log(`Group ${group} loaded`);
    }

    return { mathRules, textRules };
}

async function reloadUserRules() {
    const { mathRules, textRules } = await getUserRules();

    regexRules = mathRules;
    textModeRules = textRules;

    if (is_debugging) {
        console.log("User rules:", regexRules);
        console.log("Text mode rules:", textModeRules);
    }
}


function getChar(c) {
    switch (c) {
        case "“":
            return "”";
        case "‘":
            return "’";
        default:
            return c;
    }
}
function getOpenPosition(c) {
    switch (c) {
        case "”":
            return PairOpenChars.indexOf("“");
        case "’":
            return PairOpenChars.indexOf("‘");
        default:
            return PairOpenChars.indexOf(c);
    }
}


function getBlockUUID(el) {
    return el.id.replace(/^edit-block-[0-9]+-/, "");
}



function findBarPos(str) {
    for (let i = str.length - 1; i >= 0; i--) {
        if (str[i] === "@") {
            return i - 1;
        }
    }
    return -1;
}

function isInLatex(str) {
    // The editor uses markdown format. Given the text before the cursor (str), decide whether the cursor is currently in latex mode.

    // First, decide whether the cursor is in displaymath latex block, i.e. enclosed in $$...$$.
    const regex_display_boundary = /\$\$/gm; // Regex pattern to match $$. 
    const matches = str.match(regex_display_boundary);
    if (matches && matches.length % 2 === 1) {
        // If there are an odd number of matches, it means the cursor is inside a latex expression

        return IN_DISPLAYMATH;
    }
    str = str.replaceAll(regex_display_boundary, "");

    // Then, decide whether the cursor is in inline math mode, i.e. enclosed in $...$.

    // Construct Regex pattern to match $...$ and remove them from str.
    const regex_inline = /\$(?![\s])([\s\S]+?)(?<![\s])\$/gm; // Regex pattern to match $...$.

    // Remove all matched inline latex
    str = str.replaceAll(regex_inline, "");


    const regex_inline_notend = /\$(?![\s])[\s\S]+$/; // Regex pattern to match $... at the end of the string.

    const matches_inline_notend = str.match(regex_inline_notend);

    if (matches_inline_notend) {
        // If there are an odd number of matches, it means the cursor is inside a latex expression

        return IN_INLINEMATH;
    }

    return NOT_IN_MATH;
}


function findMathEnd(text, cursorPos) {
    // Given the whole textarea value and the cursor position, return the position just after the closing delimiter of the math block the cursor is in, or -1 when not in math / no closing delimiter.

    const mode = isInLatex(text.substring(0, cursorPos));

    if (mode === IN_DISPLAYMATH) {
        const idx = text.indexOf("$$", cursorPos);
        return idx < 0 ? -1 : idx + 2;
    }

    if (mode === IN_INLINEMATH) {
        let idx = text.indexOf("$", cursorPos);
        while (idx >= 0 && text[idx + 1] === "$") { // Skip a "$$" display delimiter.
            idx = text.indexOf("$", idx + 2);
        }
        return idx < 0 ? -1 : idx + 1;
    }

    return -1;
}

function enclosingBraceClose(text, cursorPos) {
    // Return the index of the "}" that closes the innermost "{" the cursor is inside, or -1.
    let depth = 0;
    let open = -1;
    for (let i = cursorPos - 1; i >= 0; i--) {
        const c = text[i];
        if (c === "\\") { i--; continue; } // Skip escaped characters such as "\{".
        if (c === "}") depth++;
        else if (c === "{") {
            if (depth === 0) { open = i; break; }
            depth--;
        }
    }
    if (open < 0) return -1;

    let d = 0;
    for (let i = open; i < text.length; i++) {
        const c = text[i];
        if (c === "\\") { i++; continue; }
        if (c === "{") d++;
        else if (c === "}") {
            d--;
            if (d === 0) return i;
        }
    }
    return -1;
}

function dollarPairDeletionRange(text, pos, key) {
    // Deleting one "$$" delimiter of a display math block should delete its pair too.
    let start = -1;
    if (key === "Backspace" && text.substring(pos - 2, pos) === "$$") start = pos - 2;
    else if (key === "Delete" && text.substring(pos, pos + 2) === "$$") start = pos;
    if (start < 0) return null;

    // Non-overlapping "$$" delimiter positions.
    const positions = [];
    let i = 0;
    while (i < text.length - 1) {
        if (text[i] === "$" && text[i + 1] === "$") {
            positions.push(i);
            i += 2;
        } else {
            i++;
        }
    }

    const idx = positions.indexOf(start);
    if (idx < 0) return null;
    const other = positions[idx % 2 === 0 ? idx + 1 : idx - 1];
    if (other == null) return null;

    const a = Math.min(start, other);
    const b = Math.max(start, other);
    return {
        newContent: text.substring(0, a) + text.substring(a + 2, b) + text.substring(b + 2),
        cursor: a,
    };
}

async function keydownHandler(e) {
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target.nodeName !== "TEXTAREA" || !e.target.parentElement || !e.target.parentElement.classList.contains("block-editor")) return;

    const textarea = e.target;

    if (e.key === "Enter" && !e.shiftKey) {
        // Inside a display math block, Enter inserts a newline instead of splitting the block into a new one.
        const before = textarea.value.substring(0, textarea.selectionStart);
        if (isInLatex(before) === IN_DISPLAYMATH) {
            e.preventDefault();
            e.stopImmediatePropagation();
            await insertNewlineAtCursor(textarea, e, enterInsertText(textarea));
        }
        return;
    }

    if (e.key === "/" && !e.shiftKey && user_settings.autoFraction) {
        // Handle the fraction here, before Logseq's slash-command palette can consume the "/".
        const before = textarea.value.substring(0, textarea.selectionStart);
        if (isInLatex(before) !== NOT_IN_MATH && findNumerator(before) != null) {
            e.preventDefault();
            e.stopImmediatePropagation();
            await handleAutoFraction(textarea, e, before);
        }
        return;
    }

    if (e.key === "Tab" && !e.shiftKey) {
        const before = textarea.value.substring(0, textarea.selectionStart);

        if (isInLatex(before) !== NOT_IN_MATH) {
            // Inside a matrix/align-like environment, Tab inserts the column separator "&".
            const env = currentEnvironment(before);
            if (env != null && ROW_ENVIRONMENT_PATTERN.test(env)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                await insertAtCursor(textarea, e, " & ");
                return;
            }

            // Move out of the innermost "{...}" the cursor is inside.
            const close = enclosingBraceClose(textarea.value, textarea.selectionStart);
            if (close >= textarea.selectionStart) {
                let pos = close + 1;
                if (textarea.value[pos] === "{") pos++; // Step into the following group.
                e.preventDefault();
                e.stopImmediatePropagation();
                textarea.setSelectionRange(pos, pos);
                return;
            }

            // Otherwise jump to the next empty placeholder "{}" inside the current math block.
            const mathEnd = findMathEnd(textarea.value, textarea.selectionStart);
            const searchEnd = mathEnd >= 0 ? mathEnd : textarea.value.length;
            const rel = textarea.value.substring(textarea.selectionStart, searchEnd).indexOf("{}");
            if (rel >= 0) {
                const placeholder = textarea.selectionStart + rel + 1;
                e.preventDefault();
                e.stopImmediatePropagation();
                textarea.setSelectionRange(placeholder, placeholder);
                return;
            }
        }

        // Otherwise, jump out of the current math block. Outside of math, Tab keeps its default behaviour.
        const pos = findMathEnd(textarea.value, textarea.selectionStart);
        if (pos < 0) return;

        e.preventDefault();
        e.stopImmediatePropagation(); // Prevent Logseq's editor from also handling the Tab (indenting the block).
        textarea.setSelectionRange(pos, pos);
        return;
    }

    if ((e.key === "Backspace" || e.key === "Delete") && !e.shiftKey && textarea.selectionStart === textarea.selectionEnd) {
        // Keep the "$$" display math delimiters paired when deleting one of them.
        const range = dollarPairDeletionRange(textarea.value, textarea.selectionStart, e.key);
        if (range != null) {
            e.preventDefault();
            e.stopImmediatePropagation();
            await updateText(textarea, getBlockUUID(e.target), range.newContent, -textarea.selectionStart, 0, range.cursor - range.newContent.length);
        }
    }
}

async function inputHandler(e) {
    if (e.data == null || e.target.nodeName !== "TEXTAREA" || !e.target.parentElement.classList.contains("block-editor") || e.isComposing) return; //  If the event doesn't meet these conditions, or if e.data is null, or if the input is being composed (i.e., the user is in the middle of using an Input Method Editor to enter complex characters), the function returns immediately.

    const textarea = e.target;

    await handleRules(textarea, e) || await handleSpecialKeys(textarea, e);
}

async function beforeInputHandler(e) {
    if (e.target.nodeName !== "TEXTAREA" || !e.target.parentElement.classList.contains("block-editor") || e.isComposing) return;

    // In display math, Enter should insert a newline instead of splitting the block.
    if (e.inputType === "insertParagraph") {
        const textarea = e.target;
        const before = textarea.value.substring(0, textarea.selectionStart);
        if (isInLatex(before) === IN_DISPLAYMATH) {
            e.preventDefault();
            await insertNewlineAtCursor(textarea, e, enterInsertText(textarea));
            return;
        }
    }

    if (e.data == null) return;
    let beforeInputTextArea = e.target;
    selectedText = beforeInputTextArea.value.substring(beforeInputTextArea.selectionStart, beforeInputTextArea.selectionEnd);
}

async function handleRules(textarea, e) {

    // The handleRules function is an asynchronous function that processes special key inputs in a textarea. 
    // It takes two arguments: textarea, which is the textarea element where the input is being entered, and e, which is the event object associated with the input event.

    const char = e.data[e.data.length - 1];
    const text_befor_cursor = textarea.value.substring(0, textarea.selectionStart);

    if (is_debugging) {
        if (char === " ") {
            console.log(`\n text_befor_cursor=${text_befor_cursor}`);
            console.log(`In Latex? ${isInLatex(text_befor_cursor)}`);
        }
    }

    const latex_mode = isInLatex(text_befor_cursor);

    if (char === "/" && latex_mode !== NOT_IN_MATH && user_settings.autoFraction) {
        if (await handleAutoFraction(textarea, e, text_befor_cursor.substring(0, text_befor_cursor.length - 1))) {
            return true;
        }
    }

    if (char === " ") {
        const rules = (latex_mode === NOT_IN_MATH ? textModeRules : regexRules).filter(rule => !rule.immediate);
        if (await handleSnippetRules(textarea, e, rules, latex_mode, true)) {
            return true;
        }
    } else {
        // Immediate snippets: trigger on the typed character itself, without waiting for a space.
        const rules = (latex_mode === NOT_IN_MATH ? textModeRules : regexRules).filter(rule => rule.immediate);
        if (rules.length > 0 && await handleSnippetRules(textarea, e, rules, latex_mode, false)) {
            return true;
        }
    }

    for (const { trigger, repl } of immediateRules) {
        // to be filled later
        return false;
    }

    return false;
}

function expandReplacement(repl, groups) {
    // Expand "$0", "$1", "$2", ... backreferences while leaving every other "$" literal.
    // groups[0] is the whole match, groups[n] is capture group n.
    return repl.replace(/\$(\d+)/g, (whole, num) => {
        const idx = parseInt(num, 10);
        return idx >= 0 && idx < groups.length && groups[idx] != null ? groups[idx] : whole;
    });
}

async function handleSnippetRules(textarea, e, rules, latex_mode, consumeTrailing) {
    const end = textarea.selectionStart - (consumeTrailing ? 1 : 0);

    let text;
    if (latex_mode === NOT_IN_MATH) {
        // Outside of latex there is no opening delimiter. When triggered by a space, that space is consumed too.
        text = textarea.value.substring(0, end);
    } else {
        const lastDollar = textarea.value.substring(0, end).lastIndexOf("$");
        // Find where the latex environment starts.
        text = textarea.value.substring(lastDollar, end); // Since we've already decided whether we are in Latex, we only need those before the cursor
    }

    // Pick the best matching rule: the longest match (smallest index) wins, then the highest priority.
    let best = null;
    for (const rule of rules) {
        const match = text.match(rule.trigger);
        if (match == null) continue;

        if (best == null
            || match.index < best.match.index
            || (match.index === best.match.index && (rule.priority || 0) > (best.rule.priority || 0))) {
            best = { rule, match };
        }
    }

    if (best == null) return false;

    const { trigger, repl, replFn } = best.rule;
    const { match } = best;
    const matchEnd = match.index + match[0].length; // index is the character where the first match starts. matchEnd is the end of the matched string.

    let regexRepl;
    if (typeof replFn === "function") {
        const out = replFn(match);
        if (out == null || out === false) return false;
        regexRepl = convertLatexSuiteReplacement(expandSnippetVariables(String(out)));
    } else {
        regexRepl = text.substring(match.index, matchEnd).replace(trigger, (...args) => expandReplacement(repl, args.slice(0, -2))); // Perform the regex replacement to the substring
    }

    let barPos3 = findBarPos(regexRepl); // Find the position of the bar in the replacement string

    let replacement3 = regexRepl.replace('@', ''); // Remove the cursor symbol '@' from the replacement string.

    if (!(user_settings.DeleteBlankAfterMatchInline) & latex_mode === IN_INLINEMATH) {
        if ((replacement3.slice(-1) !== " ") && (barPos3 == replacement3.length - 1)) {
            replacement3 = replacement3.concat(' '); // Add an extra blank after the replacing sign, since in displaymath it is likely that the formula is very long.
            barPos3 = barPos3 + 1;
        }
    }
    if (!(user_settings.DeleteBlankAfterMatchDisplay) & latex_mode === IN_DISPLAYMATH) {
        if ((replacement3.slice(-1) !== " ") && (barPos3 == replacement3.length - 1)) {
            replacement3 = replacement3.concat(' '); // Add an extra blank after the replacing sign, since in displaymath it is likely that the formula is very long.
            barPos3 = barPos3 + 1;
        }
    }

    replacement3 = replacement3.concat(text.substring(matchEnd));

    // When there is no "@" marker, place the cursor right after the replacement (before the trailing text).
    const tailLen = textarea.value.length - textarea.selectionStart;
    const cursor3 = barPos3 < 0
        ? -tailLen
        : barPos3 - replacement3.length - tailLen + 1;

    if (is_debugging) {
        console.log(`REGEX match \n text=${text} \n str_to_match_start=${text.substring(0, match.index)} \n matchedtext=${text.substring(match.index, matchEnd)} \n barPos3=${barPos3} \n replacement3=${replacement3} \n cursor3=${cursor3} \n delstartoffset = ${-(text.length - match.index - 1)}`);
    }


    const blockUUID3 = getBlockUUID(e.target);

    //await updateText(textarea, blockUUID3, barPos3 < 0 ? `${replacement3}` : `${replacement3}`, -(text.length - match.index - 1), 0, cursor3);
    await updateText(textarea, blockUUID3, replacement3 + textarea.value.substring(textarea.selectionStart), -(text.length - match.index + (consumeTrailing ? 1 : 0)), 0, cursor3);

    return true;
}

const NUMERATOR_BOUNDARY = /[\s+\-*/=<>(),;:\[\]{}&|!$]/;

function matchDelimiterForward(str, pos, open, close) {
    // str[pos] is the opening delimiter. Returns the index of the matching closing delimiter, or -1.
    let depth = 0;
    for (let i = pos; i < str.length; i++) {
        if (str[i] === "\\") { i++; continue; } // Skip escaped characters such as "\{".
        if (str[i] === open) depth++;
        else if (str[i] === close) {
            depth--;
            if (depth === 0) return i;
        }
    }
    return -1;
}

function parseNumeratorBase(str, pos) {
    // Parse a single base token (group, command, number or variable) starting at pos. Returns the index after it, or -1.
    if (pos >= str.length) return -1;
    const c = str[pos];

    if (c === "(" || c === "[" || c === "{") {
        const close = c === "(" ? ")" : c === "[" ? "]" : "}";
        const idx = matchDelimiterForward(str, pos, c, close);
        return idx < 0 ? -1 : idx + 1;
    }

    if (c === "\\") {
        let i = pos + 1;
        if (i >= str.length) return -1;
        if (/[a-zA-Z]/.test(str[i])) {
            while (i < str.length && /[a-zA-Z]/.test(str[i])) i++;
        } else {
            i++; // Escaped single character such as "\{" or "\,".
        }
        // Consume arguments attached to the command, e.g. "\sqrt{2}".
        while (i < str.length && (str[i] === "{" || str[i] === "[")) {
            const close = str[i] === "{" ? "}" : "]";
            const idx = matchDelimiterForward(str, i, str[i], close);
            if (idx < 0) break;
            i = idx + 1;
        }
        return i;
    }

    if (/[0-9.]/.test(c)) {
        let i = pos;
        while (i < str.length && /[0-9.]/.test(str[i])) i++;
        return i;
    }

    if (/[a-zA-Z]/.test(c)) {
        let i = pos;
        while (i < str.length && /[a-zA-Z]/.test(str[i])) i++;
        return i;
    }

    return -1;
}

function parseNumeratorUnit(str, pos) {
    // Parse a base token plus its superscripts / subscripts, e.g. "x_i^2". Returns the index after it, or -1.
    let p = parseNumeratorBase(str, pos);
    if (p < 0) return -1;

    while (p < str.length && (str[p] === "^" || str[p] === "_")) {
        let arg;
        if (str[p + 1] === "{") {
            const idx = matchDelimiterForward(str, p + 1, "{", "}");
            arg = idx < 0 ? -1 : idx + 1;
        } else {
            arg = parseNumeratorBase(str, p + 1);
        }
        if (arg < 0) break;
        p = arg;
    }

    return p;
}

function parseNumeratorExpression(str, start) {
    // Parse a sequence of units (implicit multiplication) starting at start. Returns the end index, or -1 if nothing was parsed.
    let pos = start;
    let count = 0;
    while (pos < str.length) {
        const next = parseNumeratorUnit(str, pos);
        if (next < 0 || next === pos) break;
        pos = next;
        count++;
    }
    return count > 0 ? pos : -1;
}

function findNumerator(str) {
    // Given the text immediately before the typed "/" (without the slash), locate the numerator that should become the fraction.
    // Returns { start, numerator } or null when nothing sensible can be found.

    const end = str.length;
    if (end === 0) return null;

    // The numerator is the longest suffix that parses as a complete sequence of factors.
    let start = -1;
    for (let s = 0; s <= end; s++) {
        if (parseNumeratorExpression(str, s) === end) {
            start = s;
            break;
        }
    }
    if (start < 0) return null;

    // Do not start in the middle of an operator or after a script marker.
    if (start > 0 && (str[start - 1] === "^" || str[start - 1] === "_")) return null;
    if (start > 0 && !NUMERATOR_BOUNDARY.test(str[start - 1])) return null;

    let numerator = str.substring(start);

    // Drop a single pair of outer delimiters, e.g. "(a+b)/" -> "a+b".
    const first = str[start];
    if (first === "(" || first === "[" || first === "{") {
        const close = first === "(" ? ")" : first === "[" ? "]" : "}";
        const idx = matchDelimiterForward(str, start, first, close);
        if (idx === end - 1) {
            numerator = str.substring(start + 1, end - 1);
        }
    }

    if (numerator.length === 0) return null;

    return { start, numerator };
}

async function handleAutoFraction(textarea, e, before) {
    const parsed = findNumerator(before);
    if (parsed == null) return false;

    const blockUUID = getBlockUUID(e.target);
    const replacement = "\\frac{" + parsed.numerator + "}{}";
    const tailLen = textarea.value.length - textarea.selectionStart;

    // Place the cursor inside the empty denominator (right before the final "}").
    const cursorOffset = -1 - tailLen;

    await updateText(
        textarea,
        blockUUID,
        replacement + textarea.value.substring(textarea.selectionStart),
        parsed.start - textarea.selectionStart,
        0,
        cursorOffset
    );

    return true;
}

// LaTeX environments whose rows are separated by "\\". Inside these, Enter inserts " \\" + newline.
const ROW_ENVIRONMENT_PATTERN = /(matrix|align|aligned|cases|array|gather|split|multline|eqnarray|subarray|substack)/;

function currentEnvironment(text) {
    // Return the innermost open \begin{...} environment at the end of `text`, or null.
    const re = /\\(begin|end)\{([^}]*)\}/g;
    const stack = [];
    let m;
    while ((m = re.exec(text)) != null) {
        if (m[1] === "begin") {
            stack.push(m[2]);
        } else {
            const idx = stack.lastIndexOf(m[2]);
            if (idx >= 0) stack.splice(idx, 1);
        }
    }
    return stack.length > 0 ? stack[stack.length - 1] : null;
}

function enterInsertText(textarea) {
    const env = currentEnvironment(textarea.value.substring(0, textarea.selectionStart));
    return (env != null && ROW_ENVIRONMENT_PATTERN.test(env)) ? " \\\\\n" : "\n";
}

async function insertAtCursor(textarea, e, text) {
    // Insert text at the cursor without letting Logseq split the block.
    const blockUUID = getBlockUUID(e.target);

    let insert = text;
    if (insert.startsWith(" ") && textarea.value[textarea.selectionStart - 1] === " ") {
        insert = insert.substring(1); // Avoid a double space.
    }

    const tailLen = textarea.value.length - textarea.selectionEnd;
    await updateText(textarea, blockUUID, insert + textarea.value.substring(textarea.selectionEnd), 0, 0, -tailLen);
}

async function insertNewlineAtCursor(textarea, e, insertText) {
    await insertAtCursor(textarea, e, insertText);
}

async function handleSpecialKeys(textarea, e) {
    if (e.data.length > 1) return false;  // If the input data (e.data) is more than one character, it returns false immediately.

    // Get the character from the input data and its position in PairOpenChars (if it exists).
    const char = getChar(e.data[0]);
    const i = getOpenPosition(char);


    const text = textarea.value
    // Get the character before and after the cursor in the textarea.
    const nextChar = text[textarea.selectionStart];
    const prevChar = text[textarea.selectionStart - 2];

    const prevText = text.substring(0, textarea.selectionStart);

    if (char === "$") {
        const blockUUID = getBlockUUID(e.target);
        if ((isInLatex(prevText) === NOT_IN_MATH) && nextChar === "$") { // If the case is "$abc@$" where @ is the position of cursor, move cursor out of the dollar.
            const replacement = "".concat(text.substring(textarea.selectionStart))
            await updateText(textarea, blockUUID, replacement, -1, 1, -replacement.length + 1);
            return true; // Move cursor out of latex env.
            // NOTE : works only for single dollar.
        }

        if (nextChar === "$" && prevChar === `$` && user_settings.newLineForDisplayMath && textarea.selectionStart === textarea.selectionEnd) {  // Automatically add a new line after typing $$$$
            if(textarea.selectionStart == 2){ // No text before the dollar signs
                const replacement = "$$\n\n$".concat(text.substring(textarea.selectionStart))
                await updateText(textarea, blockUUID, replacement, -2, 2, -replacement.length + 3);
                return true;
            }
            
            if(text[textarea.selectionStart - 3] !== "\n") // If there is no new line before the dollar signs
            {
                const replacement = "\n$$\n\n$".concat(text.substring(textarea.selectionStart))
                await updateText(textarea, blockUUID, replacement, -2, 2, -replacement.length + 4);
                return true;
            }
            else {
            // console.log(`${text[textarea.selectionStart - 3]}, ${text[textarea.selectionStart - 2]}, ${text[textarea.selectionStart - 1]}`);
                const replacement = "$$\n\n$".concat(text.substring(textarea.selectionStart))
                await updateText(textarea, blockUUID, replacement, -2, 2, -replacement.length + 3);
                return true;
            }
        }

        if (user_settings.wrapwithDollarBracket) { // bracket behavior: wrap the selected text with dollar
            const middle_str = selectedText;
            const trim_left = middle_str.trimStart();
            const trim_right = trim_left.trimEnd(); // Remove suffix space
            const l_dollar = middle_str !== trim_left ? " $" : "$";
            const r_dollar = trim_left !== trim_right ? "$ " : "$";
            const replacement = l_dollar + trim_right + r_dollar + text.substring(textarea.selectionStart);

            cursor_offset = -(text.length - textarea.selectionStart)
            if (selectedText.length == 0) {
                cursor_offset = cursor_offset - 1; // If no text is selected, cursor should be placed between the dollar signs.
            }

            await updateText(textarea, blockUUID, replacement, -1, 1, cursor_offset);
        }

        else { // simply replace the selected text.
            const replacement = "$$" + text.substring(textarea.selectionStart);
            await updateText(textarea, blockUUID, replacement, -1, 1, -replacement.length + 1);
        }
        return true;
    }

    if (user_settings.VerticalLineBracket) { // bracket behavior: wrap the selected text with vertical line "|"
        if (char === "|" && prevChar !== "\\" && !(isInLatex(prevText) === NOT_IN_MATH )) {
            const blockUUID = getBlockUUID(e.target);
            if (nextChar === "|") { // If the case is "abc@|" where @ is the position of cursor, move cursor out of the vertical line.
                const replacement = "".concat(text.substring(textarea.selectionStart))
                await updateText(textarea, blockUUID, replacement, -1, 1, -replacement.length + 1);
                return true; // Move cursor out of latex env.
                // NOTE : works only for single dollar.
            }
            if (selectedText !== "") {
                const middle_str = selectedText;
                const trim_left = middle_str.trimStart();
                const trim_right = trim_left.trimEnd(); // Remove suffix space
                const replacement = "|" + trim_right + "|" + text.substring(textarea.selectionStart);
                await updateText(textarea, blockUUID, replacement, -1, 1, -replacement.length + 1);
            }
            return true;
        }
    }

    if (char === "(") {
        const blockUUID = getBlockUUID(e.target);
        const replacement = "()".concat(text.substring(textarea.selectionStart))
        await updateText(textarea, blockUUID, replacement, -1, 1, -replacement.length + 1);
        return true;
    }

    return false;
}



async function updateText(textarea, blockUUID, text, delStartOffset = 0, delEndOffset = 0, cursorOffset = 0, numWrapChars = 1) {
    // First, It calculates the start and end positions of the selection in the textarea, adjusted by delStartOffset and delEndOffset respectively.

    const collapsed = textarea.selectionStart === textarea.selectionEnd;
    const startPos = textarea.selectionStart + delStartOffset; // Start deletion from startPos, which is selectionStart (the cursor position) adjusted by the delStartOffset.
    const endPos = textarea.selectionEnd + delEndOffset;


    const newPos = startPos + text.length + cursorOffset; // It calculates the new cursor position by adding the length of the replacing text and cursorOffset to the start position.
    const content = textarea.value;

    if (is_debugging) {
        console.log(`\n Updatingtext \n string_sel_start = ${content.substring(0, textarea.selectionStart)} \n text=${text} \n startPos=${startPos} \n string_start_pos = ${content.substring(0, startPos)} \n endPos=${endPos} \n newPos=${newPos} \n cursoroffset=${cursorOffset}`)
    }

    try {
        await logseq.Editor.updateBlock(blockUUID, startPos < content.length ? `${content.substring(0, startPos)}${text}` : startPos === content.length ? `${content}${text}` : `${content} ${text}`);

        /* 
          updateBlock: ((srcBlock: BlockIdentity, content: string, opts?: Partial<{
              properties: {};
          }>) => Promise<void>)
  
        */
    } catch (err) {
        reject(err);
    }

    textarea.focus();
    if (cursorOffset != null) {
        textarea.setSelectionRange(collapsed ? newPos : startPos + numWrapChars, collapsed ? newPos : newPos - numWrapChars); // Place cursor by select text of zero length. If not collapsed, the cursor is places at newPos (by setting the selectionRange to have zero length.)
    }
}


async function main() {
    await setup({
        builtinTranslations: {
            "zh-CN": zhCN
        }
    });

    init();
    // reloadUserRules();

    if (is_debugging) {
        console.log("init");
    }


    user_settings = logseq.useSettingsSchema([
        {
            key: "wrapwithDollarBracket",
            type: "boolean",
            default: true,
            description: t("Enable: Wrap selected text with dollars, when dollar is typed.")
        },
        {
            key: "caseInsensitive", // Matching is case insensitive
            type: "boolean",
            default: true,
            description: t("Enable: Matching is case-insensitve.")
        },
        {
            key: "VerticalLineBracket",
            type: "boolean",
            default: false,
            description: t("Enable: In latex environment, wrap selected text with vertical line \"|\", when it is typed.")
        },
        {
            key: "DeleteBlankAfterMatchInline",
            type: "boolean",
            default: true,
            description: t("Enable: Delete the typed blank space in inline math after matching")
        },
        {
            key: "DeleteBlankAfterMatchDisplay",
            type: "boolean",
            default: false,
            description: t("Enable: Delete the typed blank space in display math after matching")
        },
        {
            key: "newLineForDisplayMath",
            type: "boolean",
            default: true,
            description: t("Enable: Automatically add a new line after typing $$$$.")
        },
        {
            key: "autoFraction",
            type: "boolean",
            default: true,
            description: t("Enable: In math mode, typing \"/\" after an expression turns it into a fraction, e.g. 1/ -> \\frac{1}{}.")
        }
    ]).settings;

    await reloadUserRules();

    const settingsOff = logseq.onSettingsChanged(reloadUserRules);


    logseq.App.registerCommandPalette(
        {
            key: "reload-latex-snippets",
            label: t("Reload snippets from the snippets.js")
        }, async () => {
            await reloadUserRules();
            await logseq.UI.showMsg(t("Latex snippets reloaded."));
        });

    logseq.App.registerCommandPalette(
        {
            key: "open-snippets.js",
            label: t("Open snippets.js in external editor")
        }, async () => {
            window.open(resolveSnippetUrl("snippets.js"));
            // await reloadUserRules();
            // await logseq.UI.showMsg(t("Latex snippets reloaded."));
        });

    logseq.Editor.registerSlashCommand(
        "reload latex snippets",
        async () => {
            await reloadUserRules();
            await logseq.UI.showMsg(t("Latex snippets reloaded."));
        }
    );

    logseq.Editor.registerSlashCommand(
        "open snippets.js",
        async () => {
            window.open(resolveSnippetUrl("snippets.js"));
            //await reloadUserRules();
            //await logseq.UI.showMsg(t("Latex snippets reloaded."));
        }
    );



    logseq.beforeunload(() => {
        settingsOff();
        cleanUp();
    });

    console.log("#smart-typing loaded");
}



logseq.ready(main).catch(console.error);
