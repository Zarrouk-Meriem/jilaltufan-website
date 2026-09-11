/**
 * Forbids physical left/right Tailwind utilities in className strings.
 * This site is bidirectional; every horizontal direction must be logical
 * (ms-/me-/ps-/pe-/start-/end-/text-start/border-s/rounded-s…).
 */
const PHYSICAL =
  /(^|\s|:)(-?)(ml|mr|pl|pr|left|right|inset-x|scroll-ml|scroll-mr|scroll-pl|scroll-pr|border-l|border-r|rounded-l|rounded-r|rounded-tl|rounded-tr|rounded-bl|rounded-br|text-left|text-right|float-left|float-right|clear-left|clear-right)(-[^\s]+)?(?=\s|$)/

function check(context, node, value) {
  const m = PHYSICAL.exec(value)
  if (m) {
    context.report({
      node,
      message: `Physical direction utility "${m[0].trim()}" — use the logical equivalent (ms/me/ps/pe/start/end/text-start…).`,
    })
  }
}

const rule = {
  meta: {
    type: 'problem',
    docs: { description: 'disallow physical left/right utilities; use logical ones' },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name?.name !== 'className') return
        const v = node.value
        if (!v) return
        if (v.type === 'Literal' && typeof v.value === 'string') check(context, v, v.value)
        if (v.type === 'JSXExpressionContainer') {
          const e = v.expression
          if (e.type === 'TemplateLiteral') {
            for (const q of e.quasis) check(context, q, q.value.raw)
          } else if (e.type === 'CallExpression') {
            for (const a of e.arguments) {
              if (a.type === 'Literal' && typeof a.value === 'string') check(context, a, a.value)
              if (a.type === 'TemplateLiteral')
                for (const q of a.quasis) check(context, q, q.value.raw)
            }
          }
        }
      },
    }
  },
}

export default rule
