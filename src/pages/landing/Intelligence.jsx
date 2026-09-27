import { CheckCheck, FileScan, Tags } from 'lucide-react';
import { Section } from './Section.jsx';
import styles from './Intelligence.module.css';

const POINTS = [
  { icon: FileScan, title: 'Document details, without the typing', text: 'Accora reads invoices and receipts and prepares the important fields for your review. If automatic extraction is unavailable, you can enter the details yourself.' },
  { icon: Tags, title: 'A category to start from', text: 'Category suggestions help organize your spending. You can change the suggestion before saving.' },
  { icon: CheckCheck, title: 'Your approval comes first', text: 'Check the vendor, date, amount, tax, currency, invoice number and line items. Approve when everything looks right.' },
];

export function AiSection() {
  return (
    <Section id="ai" eyebrow="Document processing" title="Less manual work. You stay in control."
      lead="AI works quietly inside Accora to help read your documents. Your workflow stays simple: upload, review and approve."
      align="start" tone="band">
      <div className={styles.aiPoints}>
        {POINTS.map((point) => (
          <div key={point.title} className={styles.aiPoint}>
            <point.icon size={20} aria-hidden="true" className={styles.aiIcon} />
            <div><h3 className={styles.aiTitle}>{point.title}</h3><p className={styles.aiText}>{point.text}</p></div>
          </div>
        ))}
      </div>
    </Section>
  );
}
