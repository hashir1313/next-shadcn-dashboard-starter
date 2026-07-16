import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublicPageData } from '@/features/public-page/api/service';
import PublicProjectView from '@/features/public-page/components/public-project-view';

type PageProps = {
  params: Promise<{ userId: string; projectSlug: string }>;
};

export async function generateMetadata(props: PageProps): Promise<Metadata> {
  const params = await props.params;
  try {
    const data = await getPublicPageData(params.userId, params.projectSlug);
    const title = `${data.project.name} — ${data.freelancer.displayName}`;
    const description = data.project.description || `Project progress for ${data.project.name}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        type: 'website'
      }
    };
  } catch {
    return { title: 'Project Not Found' };
  }
}

export default async function PublicProjectPage(props: PageProps) {
  const params = await props.params;
  const data = await getPublicPageData(params.userId, params.projectSlug);

  return <PublicProjectView data={data} />;
}
