import styles from './header.module.scss';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Header() {
  const { pathname } = useRouter();

  return (
    <header
      className={`${styles.container} ${pathname === '/' ? styles.home : ``}`}
    >
      <Link href="/">
        <img src="/images/logo.svg" alt="logo" />
      </Link>
    </header>
  );
}
