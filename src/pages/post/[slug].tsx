import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';
import Prismic from '@prismicio/client';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Comments from '../../components/Comments';
import preview from '../api/preview';

interface Post {
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  navegation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
  preview: boolean;
}

export default function Post({ post, preview, navegation }: PostProps) {
  const totalWords = post.data.content.reduce((total, contentItem) => {
    if (contentItem.heading) total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);

    words.map(word => (total += word));
    return total;
  }, 0);

  const readTime = Math.ceil(totalWords / 200);
  const router = useRouter();

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }

  const isPostEdited =
  post.first_publication_date !== post.last_publication_date;

let editionDate;
if (isPostEdited) {
  editionDate = format(
    new Date(post.last_publication_date),
    "'* editado em' dd MMM yyyy', às' H':'m",
    {
      locale: ptBR,
    }
  );
}
console.log(editionDate)

  const formattedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy ',
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
          <span>{isPostEdited && editionDate}</span>

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

        <section className={`${styles.navegation} ${commonStyles.container}`}>
          {navegation?.prevPost.length > 0 && (
            <div className={styles.prev}>
              <h3>{navegation.prevPost[0].data.title}</h3>
              <Link href={`/post/${navegation.prevPost[0].uid}`}>
                <a>Post anterior</a>
              </Link>
            </div>
          )}

          {navegation?.nextPost.length > 0 && (
            <div className={styles.next}>
              <h3>{navegation.nextPost[0].data.title}</h3>
              <Link href={`/post/${navegation.nextPost[0].uid}`}>
                <a>Post proximo</a>
              </Link>
            </div>
          )}
        </section>

        <Comments></Comments>

        {preview && (
          <aside>
            <Link href="/api/exit-preview">
              <a className={commonStyles.preview}>Sair do modo Preview</a>
            </Link>
          </aside>
        )}
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

export const getStaticProps = async ({
  params,
  preview = false,
  previewData,
}) => {
  const { slug } = params;

  const prismic = getPrismicClient();
  const response = await prismic.getByUID('post', String(slug), {
    ref: previewData?.ref ? previewData?.ref : null,
  });

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'post')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date]',
    }
  );
  console.log(nextPost);

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
    last_publication_date: response.last_publication_date,
  };

  return {
    props: {
      post,
      navegation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
      preview,
    },
  };
};
