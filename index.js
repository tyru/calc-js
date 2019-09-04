(function () {
  'use strict';

  // expr = ws plus ws
  // plus = multiply ws ('+' ws plus)? | multiply ws ('-' ws plus)?
  // multiply = atom ws ('*' ws multiply)? | atom ws ('/' ws multiply)?
  // atom = sign ws ('0' - '9') | sign ws ('1' - '9') ('0' - '9')* | '(' ws expr ws ')'
  // ws = (' ' | '\t' | '\r' | '\n')*
  // sign = '+' | '-'
  function calculate(expr) {
    const $result = document.getElementById('result');
    const $error = document.getElementById('error');
    $result.value = '';
    $error.value = '';
    try {
      const [result, rest] = parseExpr(expr);
      if (rest.length !== 0) {
        throw new Error('trailing expression(s) exist');
      }
      $result.value = result();
    } catch (e) {
      $error.value = e;
    }
  }

  function parseExpr(expr) {
    expr = skipSpace(expr);
    const [result, rest] = parsePlus(expr);
    rest = skipSpace(rest);
    return [result, rest];
  }

  function parsePlus(expr) {
    let rest;
    const [lhs, rest] = parseMultiply(expr);
    rest = skipSpace(rest);
    if (rest === '') {
      return lhs;
    }
    const c = rest.charAt(0);
    if (c === '+' || c === '-') {
      rest = skipSpace(rest);
      const [rhs, rest] = parsePlus(rest.slice(1));
      return [c === '+' ? () => lhs() + rhs() : () => lhs() - rhs(), rest];
    } else {
      throw new Error('invalid expression: expected "+" or "-" but got "' + c + '"');
    }
  }

  function parseMultiply(expr) {
    let rest;
    const [lhs, rest] = parseAtom(expr);
    rest = skipSpace(rest);
    if (rest === '') {
      return lhs;
    }
    const c = rest.charAt(0);
    if (c === '*' || c === '/') {
      rest = skipSpace(rest);
      const [rhs, rest] = parseMultiply(rest.slice(1));
      return [c === '*' ? () => lhs() * rhs() : () => lhs() / rhs(), rest];
    }
    throw new Error('invalid expression: expected "*" or "/" but got "' + c + '"');
  }

  function parseAtom(expr) {
    if (expr === '') {
      throw new Error('empty expression');
    }
    let minus = 1;
    switch (expr.charAt(0)) {
      case '-':
        minus = -1;
      case '+':
        expr = skipSpace(expr.slice(1));
    }
    const c = expr.charAt(0);
    if (isDigit(c)) {
      let pos = 1;
      while (isDigit(expr.charAt(pos))) {
        pos++;
      }
      const s = expr.slice(0, pos);
      const n = parseInt(s, 10);
      return () => minus * n;
    } else if (c === '(') {
      const [result, rest] = parseExpr(skipSpace(expr.slice(1)));
      rest = skipSpace(rest);
      if (c !== ')') {
        throw new Error('expected ")" but got "' + c + '"');
      }
      return [() => minus * result(), rest];
    }
    throw new Error('expected digit or "(" but got "' + c + '"');
  }

  function skipSpace(str) {
    return str.trimLeft();
  }

  function isDigit(c) {
    switch (c) {
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        return true;
    }
    return false;
  }

  document.getElementById('expression')
    .addEventListener('keyup', (e) => calculate(e.target.value));
})();
