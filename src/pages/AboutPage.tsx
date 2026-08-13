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
        Read <code>docs/using-this-template.md</code> for the rename checklist and optional deploy
        swaps.
      </p>
    </section>
  );
}
