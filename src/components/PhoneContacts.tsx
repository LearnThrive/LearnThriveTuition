import { siteConfig } from "@/lib/site";
import styles from "./PhoneContacts.module.css";

export interface PhoneContactsProps {
  layout?: "inline" | "stacked";
  /** Punctuation that belongs to the last number (e.g. a closing full stop in a sentence). Placed
      directly after the last link, with no space, so in the inline layout it wraps with the number
      instead of landing on a line of its own. It sits outside the link, so the link's accessible
      name stays exactly the number. */
  suffix?: string;
}

export function PhoneContacts({ layout = "inline", suffix }: PhoneContactsProps) {
  const contacts = siteConfig.phoneContacts;
  return (
    <span className={`${styles.contacts} ${styles[layout]}`}>
      {contacts.map((contact, index) => (
        <span className={styles.contact} key={contact.phoneHref}>
          <strong className={styles.name}>{contact.name}:</strong>
          <a className={styles.link} href={`tel:${contact.phoneHref}`}>
            {contact.phoneDisplay}
          </a>
          {suffix && index === contacts.length - 1 ? suffix : null}
        </span>
      ))}
    </span>
  );
}
