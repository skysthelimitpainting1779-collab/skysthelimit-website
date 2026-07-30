import EstimateBuilder from '../../../../../components/estimates/estimate-builder';

export default async function EstimatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EstimateBuilder estimateId={id} />;
}
