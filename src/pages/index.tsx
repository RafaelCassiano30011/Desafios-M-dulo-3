import { GetStaticProps } from 'next';
import Link from 'next/dist/client/link';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Prismic from '@prismicio/client';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

import Head from 'next/head';
import Header from '../components/Header';

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

export default function Home({ postsPagination }) {
  const formattedPost = postsPagination.results.map((post: Post) => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });
  const [posts, setPosts] = useState<Post[]>(formattedPost);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [CurrentPage, setCurrentPage] = useState(1);

  const handleNextPage = async () => {
    if (CurrentPage !== 1 && nextPage === null) {
      return;
    }

    const response = await fetch(`${nextPage}`);

    const postsResults = await response.json();
    console.log(postsResults);

    const newPosts = postsResults.results.map(post => {
      return {
        uid: post.uid,

        data: {
          title: post.data.title,
          subtitle: post.data.subtitle ? post.data.subtitle : '',
          author: post.data.author,
        },
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });

    setPosts([...posts, ...newPosts]);
    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);
  };

  return (
    <>
      <Head>
        <title>Home | SpaceTraveling</title>
      </Head>

      <main className={styles.containerPost}>
        <Header />
        <div>
          {posts.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a href={post.uid}>
                <strong className={styles.postTitle}>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <ul>
                  <li>
                    {<FiCalendar />}
                    {post.first_publication_date}
                  </li>

                  <li>
                    {<FiUser />}
                    <p>{post.data.author}</p>
                  </li>
                </ul>
              </a>
            </Link>
          ))}
        </div>
        {nextPage && (
          <button onClick={handleNextPage} type="button">
            Carregar mais posts
          </button>
        )}
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      // fetch: ['post.title', 'post.content', 'post.author', 'post.subtitle'],
      pageSize: 1,
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
      first_publication_date: item.first_publication_date,
    };
  });

  return {
    props: {
      postsPagination: {
        results: data,
        next_page: postsResponse.next_page,
      },
    },
  };
};
