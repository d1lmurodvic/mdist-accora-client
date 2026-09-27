import { useEffect } from 'react';
import { LandingNav } from './LandingNav.jsx';
import { Hero } from './Hero.jsx';
import { Capabilities, HowItWorks, ProblemSolution, Reports } from './Story.jsx';
import { AiSection, IntelligenceSection, Principles } from './Intelligence.jsx';
import { ClosingCta, Footer } from './Closing.jsx';
import styles from './Landing.module.css';

/**
 * The public landing page (PRODUCT_REQUIREMENTS.md #1). Static product story;
 * no customer names, statistics or financial results are claimed, and every
 * figure in the product illustration is labelled as a sample.
 */
export default function Landing() {
  useEffect(() => {
    document.title = 'Accora — From transactions to financial decisions';
    return () => { document.title = 'Accora'; };
  }, []);

  return (
    <div className={styles.page}>
      <a href="#main" className={styles.skip}>Skip to content</a>
      <div className={styles.atmosphere} aria-hidden="true" />
      <LandingNav />
      <main id="main">
        <Hero />
        <ProblemSolution />
        <HowItWorks />
        <Capabilities />
        <Reports />
        <IntelligenceSection />
        <AiSection />
        <Principles />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
