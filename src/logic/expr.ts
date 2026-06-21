/**
 * qty.expr を評価するための安全な算術サブセット評価器。
 * 許容: 数値、変数 hours、+ - * /、カッコ、ceil / floor、単項マイナス。
 * eval / Function コンストラクタは使わず、自前のトークナイザ＋再帰下降パーサで評価する。
 * 未知の識別子や文字は即座に例外を投げる（呼び出し側でフォールバック）。
 */

type Token =
  | { readonly t: 'num'; readonly v: number }
  | { readonly t: 'op'; readonly v: string }
  | { readonly t: 'lparen' }
  | {readonly t: 'rparen' }
  | { readonly t: 'ident'; readonly v: string };

const ALLOWED_IDENTS = new Set(['ceil', 'floor', 'hours']);

function tokenize(src: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === undefined) break;
    if (c === ' ') {
      i++;
      continue;
    }
    if (c >= '0' && c <= '9') {
      let j = i + 1;
      while (j < src.length && /[0-9.]/.test(src[j] ?? '')) j++;
      const num = Number(src.slice(i, j));
      if (Number.isNaN(num)) throw new Error(`invalid number at ${i}`);
      tokens.push({ t: 'num', v: num });
      i = j;
      continue;
    }
    if (/[a-z]/i.test(c)) {
      let j = i + 1;
      while (j < src.length && /[a-z0-9]/i.test(src[j] ?? '')) j++;
      const name = src.slice(i, j);
      if (!ALLOWED_IDENTS.has(name)) throw new Error(`unknown identifier: ${name}`);
      tokens.push({ t: 'ident', v: name });
      i = j;
      continue;
    }
    if (c === '+' || c === '-' || c === '*' || c === '/') {
      tokens.push({ t: 'op', v: c });
      i++;
      continue;
    }
    if (c === '(') {
      tokens.push({ t: 'lparen' });
      i++;
      continue;
    }
    if (c === ')') {
      tokens.push({ t: 'rparen' });
      i++;
      continue;
    }
    throw new Error(`unexpected character: ${c}`);
  }
  return tokens;
}

class Parser {
  private pos = 0;
  constructor(private readonly tokens: readonly Token[]) {}

  parse(): (hours: number) => number {
    const fn = this.parseExpr();
    if (this.pos !== this.tokens.length) throw new Error('trailing tokens in expression');
    return fn;
  }

  private peek(): Token | undefined {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    const t = this.tokens[this.pos];
    if (!t) throw new Error('unexpected end of expression');
    this.pos++;
    return t;
  }

  // expr := term (('+' | '-') term)*
  private parseExpr(): (hours: number) => number {
    let lhs = this.parseTerm();
    for (;;) {
      const t = this.peek();
      if (t && t.t === 'op' && (t.v === '+' || t.v === '-')) {
        this.advance();
        const rhs = this.parseTerm();
        const op = t.v;
        const l = lhs;
        lhs = (h: number) => (op === '+' ? l(h) + rhs(h) : l(h) - rhs(h));
      } else {
        return lhs;
      }
    }
  }

  // term := unary (('*' | '/') unary)*
  private parseTerm(): (hours: number) => number {
    let lhs = this.parseUnary();
    for (;;) {
      const t = this.peek();
      if (t && t.t === 'op' && (t.v === '*' || t.v === '/')) {
        this.advance();
        const rhs = this.parseUnary();
        const op = t.v;
        const l = lhs;
        lhs = (h: number) => {
          const r = rhs(h);
          if (op === '*') return l(h) * r;
          return r === 0 ? 0 : l(h) / r;
        };
      } else {
        return lhs;
      }
    }
  }

  // unary := '-'? primary
  private parseUnary(): (hours: number) => number {
    const t = this.peek();
    if (t && t.t === 'op' && t.v === '-') {
      this.advance();
      const operand = this.parseUnary();
      return (h: number) => -operand(h);
    }
    return this.parsePrimary();
  }

  // primary := number | hours | ceil(expr) | floor(expr) | '(' expr ')'
  private parsePrimary(): (hours: number) => number {
    const t = this.advance();
    if (t.t === 'num') return () => t.v;
    if (t.t === 'ident') {
      if (t.v === 'hours') return (h: number) => h;
      if (t.v === 'ceil' || t.v === 'floor') {
        const lp = this.advance();
        if (lp.t !== 'lparen') throw new Error(`expected '(' after ${t.v}`);
        const inner = this.parseExpr();
        const rp = this.advance();
        if (rp.t !== 'rparen') throw new Error(`expected ')' after ${t.v}(...)`);
        return t.v === 'ceil' ? (h: number) => Math.ceil(inner(h)) : (h: number) => Math.floor(inner(h));
      }
      throw new Error(`unknown function: ${t.v}`);
    }
    if (t.t === 'lparen') {
      const inner = this.parseExpr();
      const rp = this.advance();
      if (rp.t !== 'rparen') throw new Error("expected ')'");
      return inner;
    }
    throw new Error('unexpected token');
  }
}

/** 式を評価して数値を返す。パース/評価失敗時は例外を投げる。 */
export function evaluateExpr(expr: string, hours: number): number {
  const tokens = tokenize(expr);
  if (tokens.length === 0) throw new Error('empty expression');
  const fn = new Parser(tokens).parse();
  return fn(hours);
}

/** note の "{n}" を計算結果で置換する。 */
export function formatQty(note: string, n: number): string {
  return note.replace('{n}', String(n));
}
