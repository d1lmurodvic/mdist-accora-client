import { useEffect } from 'react';
import { LandingNav } from './LandingNav.jsx';
import { Hero } from './Hero.jsx';
import { Capabilities, HowItWorks, ProblemSolution, Reports } from './Story.jsx';
import { AiSection } from './Intelligence.jsx';
import { ClosingCta, Footer } from './Closing.jsx';
import styles from './Landing.module.css';

/**
 * The public landing page (PRODUCT_REQUIREMENTS.md #1). Static product story;
 * no customer names, statistics or financial results are claimed, and every
 * figure in the product illustration is labelled as a sample.
 */
export default function Landing() {
  useEffect(() => {
    document.title = 'Accora — Invoice and receipt processing';
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
        <AiSection />
        <ClosingCta />
      </main>
      <Footer />
    </div>
  );
}
