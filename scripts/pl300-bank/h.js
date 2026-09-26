// Shorthand for one question: skill, type, difficulty, tag, question, options, answer, explanation, why-per-option, Arabic takeaway, reference keys
module.exports = (s, type, diff, tag, q, opts, ans, exp, why, ar, refs) => {
  const o = { s, type, diff, tag, q, opts, ans, exp, why, ar, refs };
  if (type === 'multi') o.n = ans.length;
  return o;
};
