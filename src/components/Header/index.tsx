import styles from './header.module.scss';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  return (
    <header className={styles.container}>
      <Link href="/">
        <img src="/images/logo.svg" alt="logo" />
      </Link>
    </header>
  );
}
