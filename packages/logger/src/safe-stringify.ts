/**
 * JSON.stringify that never throws on circular references or BigInt values.
 *
 * Circular references are replaced with the string '[Circular]'. The ancestor
 * stack (instead of a plain "seen" set) makes sure only true cycles are
 * flagged — the same object appearing on two sibling branches serializes
 * normally. BigInt values are serialized as strings to avoid precision loss.
 */
export function safeStringify(
  value: any,
  replacer?: ((this: any, key: string, value: any) => any) | null,
  space?: string | number,
): string | undefined {
  const ancestors: any[] = [];
  return JSON.stringify(
    value,
    function (key, val) {
      const replaced = replacer ? replacer.call(this, key, val) : val;
      if (typeof replaced === 'bigint') return replaced.toString();
      if (typeof replaced !== 'object' || replaced === null) return replaced;
      // Boxed BigInts (Object(1n)) are unwrapped by JSON.stringify AFTER the
      // replacer runs and would throw there.
      if (replaced instanceof BigInt) return String(replaced);
      // `this` is the object currently being serialized: pop ancestors until
      // the top of the stack is our parent again.
      while (ancestors.length > 0 && ancestors[ancestors.length - 1] !== this) ancestors.pop();
      if (ancestors.includes(replaced)) return '[Circular]';
      ancestors.push(replaced);
      return replaced;
    },
    space,
  );
}

export default safeStringify;
