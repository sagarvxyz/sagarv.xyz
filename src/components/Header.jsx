import Button from "./Button";
import styles from "./Header.module.css";
export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <a aria-label="logo" href="/" className={styles.logo}>
          Sagar Velagala
        </a>
        <nav className={styles.nav}>
          <Button label="menu" variant="secondary" />
        </nav>
      </div>
    </header>
  );
}
