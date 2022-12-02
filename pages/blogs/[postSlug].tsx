import {
  GetStaticPaths,
  GetStaticProps,
  InferGetStaticPropsType,
  NextPage,
} from "next";
import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { ParsedUrlQuery } from "querystring";
import { MDXRemote, MDXRemoteSerializeResult } from "next-mdx-remote";
import { serialize } from "next-mdx-remote/serialize";

type Props = InferGetStaticPropsType<typeof getStaticProps>;

const SinglePage: NextPage<Props> = ({ post }) => {
  const { content, title } = post;
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="font-bold text-4xl py-5">{title}</h1>
      <div className="prose pb-10">
        <MDXRemote {...content} />
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = () => {
  // Reading paths
  const dirPathToRead = path.join(process.cwd(), "posts");
  const dirs = fs.readdirSync(dirPathToRead);
  const paths = dirs.map((filename) => {
    const filePathToRead = path.join(process.cwd(), "posts/" + filename);
    const fileContent = fs.readFileSync(filePathToRead, { encoding: "utf-8" });
    return { params: { postSlug: matter(fileContent).data.slug } };
  });

  //console.log(paths);

  // fallback options
  // false => will return 404 page for unknown slug
  //blocking => will try to get data from pregenerated pages and if there no page, it will hang the browser and then try to generate the page on reload.
  //true => return the fake page for sometime and once the data is ready, it will serve them as props.

  return {
    paths,
    fallback: "blocking", // will address this later.
  };
};

interface IStaticProps extends ParsedUrlQuery {
  postSlug: string;
}

type Post = {
  post: {
    title: string;
    content: MDXRemoteSerializeResult;
  };
};

export const getStaticProps: GetStaticProps<Post> = async (context) => {
  const { params } = context;
  const { postSlug } = params as any;

  try {
    const filePathToRead = path.join(
      process.cwd(),
      "posts/" + postSlug + ".md"
    );
    const fileContent = fs.readFileSync(filePathToRead, { encoding: "utf-8" });
    // const { content, data } = matter(fileContent);

    const source: any = await serialize(fileContent, {
      parseFrontmatter: true,
    });

    return {
      props: {
        post: {
          content: source,
          title: source.frontmatter.title,
        },
      },
    };
  } catch (error) {
    return {
      notFound: true,
    };
  }
};

export default SinglePage;
