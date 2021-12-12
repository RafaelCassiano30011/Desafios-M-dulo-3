import { GetStaticPaths, GetStaticProps } from 'next';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

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
  return (
    <>
      <main>
        <img className={styles.banner} src={post.data.banner.url} alt="" />
        <article className={styles.container}>
          <h1>{post.data.title}</h1>
          <div className={styles.infoPost}>
            <time>{post.first_publication_date}</time>
            <span>{post.data.author}</span>
            <time>4 Min</time>
          </div>
          {post.data.content.map(item => (
            <div className={styles.postContent}>
              <h2>{item.heading}</h2>
              {item.body.map(item2 => (
                <p>{item2.text}</p>
              ))}
            </div>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths = async () => {
  const prismic = getPrismicClient();
  // const posts = await prismic.query(TODO);

  return { paths: [], fallback: 'blocking' };
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
      content: response.data.content,
    },
    first_publication_date: new Date(
      response.first_publication_date
    ).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }),
  };

  return {
    props: {
      post,
    },
  };
};
