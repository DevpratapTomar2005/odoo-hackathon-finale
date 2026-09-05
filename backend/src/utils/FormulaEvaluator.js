// Tiny, safe arithmetic expression evaluator for FORMULA-based salary rules.
// Deliberately does NOT use eval()/new Function() — only +, -, *, /, %, ()
// and identifiers that must exist in the provided scope are supported.
//
// Example: evaluateFormula("BASIC * 0.1 + HRA", { BASIC: 50000, HRA: 2000 })

export class FormulaError extends Error {}

const TOKEN_REGEX = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+(?:\.\d+)?|[+\-*/%()])\s*/g;

function tokenize(expression) {
  if (typeof expression !== "string" || expression.trim() === "") {
    throw new FormulaError("Formula is empty");
  }

  const tokens = [];
  let lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;

  let match;
  while ((match = TOKEN_REGEX.exec(expression)) !== null) {
    if (match.index !== lastIndex) {
      throw new FormulaError(
        `Invalid character in formula near position ${lastIndex}`,
      );
    }
    tokens.push(match[1]);
    lastIndex = TOKEN_REGEX.lastIndex;
  }

  if (lastIndex !== expression.length) {
    throw new FormulaError("Invalid character in formula");
  }

  return tokens;
}

export function evaluateFormula(expression, scope = {}) {
  const tokens = tokenize(expression);
  let pos = 0;

  const peek = () => tokens[pos];
  const consume = () => tokens[pos++];

  function parseExpression() {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = consume();
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }

  function parseTerm() {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/" || peek() === "%") {
      const op = consume();
      const rhs = parseFactor();
      if (op === "*") {
        value *= rhs;
      } else if (op === "/") {
        if (rhs === 0) throw new FormulaError("Division by zero in formula");
        value /= rhs;
      } else {
        value %= rhs;
      }
    }
    return value;
  }

  function parseFactor() {
    if (peek() === "+" || peek() === "-") {
      const op = consume();
      const value = parseFactor();
      return op === "-" ? -value : value;
    }

    if (peek() === "(") {
      consume();
      const value = parseExpression();
      if (consume() !== ")") {
        throw new FormulaError("Mismatched parentheses in formula");
      }
      return value;
    }

    const token = consume();
    if (token === undefined) {
      throw new FormulaError("Unexpected end of formula");
    }

    if (/^\d/.test(token)) {
      return Number(token);
    }

    if (/^[A-Za-z_]/.test(token)) {
      if (!(token in scope)) {
        throw new FormulaError(`Unknown reference "${token}" in formula`);
      }
      const value = Number(scope[token]);
      return Number.isFinite(value) ? value : 0;
    }

    throw new FormulaError(`Unexpected token "${token}" in formula`);
  }

  const result = parseExpression();

  if (pos !== tokens.length) {
    throw new FormulaError("Unexpected trailing tokens in formula");
  }

  if (!Number.isFinite(result)) {
    throw new FormulaError("Formula did not evaluate to a finite number");
  }

  return result;
}
