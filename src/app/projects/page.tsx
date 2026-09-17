import ProjectsPage from '../../views/Projects';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Painting Projects in the Twin Cities | Sky's the Limit",
  description: "Real project proof from Sky’s the Limit Painting LLC, including residential painting, commercial repainting, and striping references in the Twin Cities area.",
  alternates: {
    canonical: 'https://www.skysthelimitpaintingllc.com/projects',
  },
};

export default function Projects() {
  return <ProjectsPage />;
}
