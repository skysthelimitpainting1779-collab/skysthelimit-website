import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Sky’s the Limit Painting Estimator',
    short_name: 'Sky Estimator',
    description: 'Mobile contractor estimating workspace for Sky’s the Limit Painting LLC.',
    start_url: '/portal/estimator',
    display: 'standalone',
    background_color: '#f1f5f9',
    theme_color: '#ea580c',
    icons: [
      {
        src: '/brand/gbp/SkyGBP_Exterior_Action_Logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
