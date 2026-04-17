import React from 'react';

export default function About() {
  return (
    <div>
      <div className="about-hero">
        <h1>About NagarSeva</h1>
        <p style={{ opacity: 0.85, fontSize: '1.1rem', maxWidth: 560, margin: '0 auto' }}>
          A citizen-first platform bridging the gap between people and municipal governance for a smarter, cleaner city.
        </p>
      </div>

      <div className="section">
        <div className="about-grid">
          <div>
            <div className="section-badge">Our Mission</div>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', margin: '0.5rem 0 1rem' }}>
              Empowering Every Citizen to Drive Change
            </h2>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8, marginBottom: '1rem' }}>
              NagarSeva was built as a final year project with a real-world mission: to give ordinary citizens a powerful, transparent tool to report civic issues and ensure they are actually resolved.
            </p>
            <p style={{ color: 'var(--text-muted)', lineHeight: 1.8 }}>
              We believe that a clean, safe, and well-maintained city is every citizen's right. By connecting people directly with municipal supervisors and tracking resolution at every step, we make accountability visible.
            </p>
          </div>
          <div style={{ background: 'white', borderRadius: 20, padding: '2rem', boxShadow: 'var(--shadow)' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontFamily: 'Syne, sans-serif' }}>How We Solve the Problem</h3>
            <div className="timeline">
              {[
                { icon: '🗑️', title: 'Garbage Management', desc: 'Citizens report illegal dumping; municipal teams respond with targeted clean-up operations.' },
                { icon: '💡', title: 'Street Light Monitoring', desc: 'Broken lights flagged instantly, reducing safety risks in residential and commercial areas.' },
                { icon: '💧', title: 'Water Leak Detection', desc: 'Government taps and pipeline leaks reported for immediate repair, saving thousands of litres daily.' },
                { icon: '🚿', title: 'Drainage Oversight', desc: 'Overflowing drains reported and tracked to prevent disease and environmental hazards.' },
              ].map((item, i) => (
                <div key={i} className="timeline-item">
                  <div className="timeline-dot">{item.icon}</div>
                  <div>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: '0.87rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <div className="section-header">
            <div className="section-badge">Features</div>
            <h2>What Makes Us Different</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.2rem' }}>
            {[
              { icon: '🔒', title: 'Fully Authenticated', desc: 'JWT-based auth ensures secure access for citizens, supervisors and admins' },
              { icon: '📊', title: 'Real-time Reports', desc: 'Visual dashboards with charts and filters for every stakeholder' },
              { icon: '👷', title: 'Supervisor System', desc: 'Admin allocates complaints to area supervisors for faster resolution' },
              { icon: '📸', title: 'Evidence Upload', desc: 'Citizens can upload photos and videos as proof with Multer storage' },
              { icon: '📍', title: 'Location-based', desc: 'All complaints are tagged with location for accurate field dispatch' },
              { icon: '📱', title: 'Fully Responsive', desc: 'Works seamlessly on mobile, tablet and desktop browsers' },
            ].map((f, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '1.4rem', boxShadow: 'var(--shadow)' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '0.75rem' }}>{f.icon}</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: '4rem' }}>
          <div className="section-header">
            <div className="section-badge">Tech Stack</div>
            <h2>Built With Modern Technologies</h2>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { icon: '⚛️', name: 'React.js', desc: 'Frontend' },
              { icon: '🟢', name: 'Node.js', desc: 'Backend' },
              { icon: '🚂', name: 'Express.js', desc: 'API' },
              { icon: '🍃', name: 'MongoDB', desc: 'Database' },
              { icon: '📦', name: 'Multer', desc: 'File Upload' },
              { icon: '🔐', name: 'JWT', desc: 'Auth' },
            ].map((t, i) => (
              <div key={i} style={{ background: 'white', borderRadius: 14, padding: '1.4rem 2rem', textAlign: 'center', boxShadow: 'var(--shadow)', minWidth: 120 }}>
                <div style={{ fontSize: '2rem' }}>{t.icon}</div>
                <div style={{ fontWeight: 700, color: 'var(--primary)', marginTop: 6 }}>{t.name}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
