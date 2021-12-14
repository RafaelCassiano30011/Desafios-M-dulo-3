import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { match } from 'assert';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);

    words.map(word => (total += word));
    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  return (
    <>
      <Head>
        <title>{`${post.data.title} | SpaceTraveling`}</title>
      </Head>

      <Header />
      <img className={styles.banner} src={post.data.banner.url} alt="" />
      <main>
        <div className={styles.container}>
          <h1>{post.data.title}</h1>
          <ul className={styles.infoPost}>
            <li>
              <FiCalendar />
              <p>{formattedDate}</p>
            </li>
            <li>
              <FiUser />
              <p>{post.data.author}</p>
            </li>
            <li>
              <FiClock />
              <p>{`${readTime} min`}</p>
            </li>
          </ul>
          {post.data.content.map((content, index) => (
            <article
              key={`${content.heading}-${index}`}
              className={styles.postContent}
            >
              <h2>{content.heading}</h2>
              <div
                dangerouslySetInnerHTML={{
                  __html: RichText.asHtml(content.body),
                }}
              />
              {/* {content.body.map(item2 => (
                <p>{item2.text}</p>
              ))} */}
            </article>
          ))}
        </div>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'post'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return { paths, fallback: true };
};

export const getStaticProps = async ({ params }) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {});

  const post = {
    data: {
      title: response.data.title,
      banner: {
        url: response.data.banner.url,
      },
      author: response.data.author,
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
    first_publication_date: response.first_publication_date,
  };

  return {
    props: {
      post,
    },
  };
};
