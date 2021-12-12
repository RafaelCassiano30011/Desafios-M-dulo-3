import { GetStaticProps } from 'next';
import Link from 'next/dist/client/link';

import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home(Props: HomeProps) {
  const posts = Props.postsPagination.results;

  return (
    <>
      <main>
        <article className={styles.containerPost}>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a href={post.uid}>
                <h4 className={styles.postTitle}>{post.data.title}</h4>
                <p>{post.data.subtitle}</p>
                <div>
                  <time>{post.first_publication_date}</time>
                  <span>{post.data.author}</span>
                </div>
              </a>
            </Link>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      fetch: ['post.title', 'post.content', 'post.author', 'post.subtitle'],
      pageSize: 100,
    }
  );

  const data = postsResponse.results.map(item => {
    return {
      uid: item.uid,

      data: {
        title: item.data.title,
        subtitle: item.data.subtitle ? item.data.subtitle : '',
        author: item.data.author,
      },
      first_publication_date: new Date(
        item.first_publication_date
      ).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      }),
    };
  });

  return {
    props: {
      postsPagination: {
        results: data,
        next_page: '1',
      },
    },
  };
};
