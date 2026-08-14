export default function AboutPage() {
  return (
    <section className="panel about-body">
      <h2 style={{ fontFamily: 'var(--font-display)', marginTop: 0 }}>About this booster seat</h2>
      <p>
        Copy this repo when starting a new CRUD app. Replace <code>src/</code> with your product,
        keep <code>.github/</code>, <code>.cursor/</code>, <code>.claude/</code>,{' '}
        <code>board/</code>, and <code>fireguard/</code> unless you intentionally diverge.
      </p>
      <p>
        Stack guides: <code>docs/stacks/react-pages.md</code> (default SPA) and{' '}
        <code>docs/stacks/electron.md</code> (desktop conversion). Agents must run a{' '}
        <strong>red team review</strong> before calling work done — see{' '}
        <code>.ai-instructions.md</code>.
      </p>
      <p>
        Full fork checklist: <code>docs/using-this-template.md</code>.
      </p>
    </section>
  );
}
