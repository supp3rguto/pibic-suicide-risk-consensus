import DemoBanner from "@/components/DemoBanner";
import MetricsDashboard from "@/components/MetricsDashboard";
import { loadDataset } from "@/lib/dataset";

export default function AnalyticsPage() {
  const { metadata, results } = loadDataset();

  return (
    <>
      {metadata.is_demo ? <DemoBanner /> : null}
      <MetricsDashboard records={results} metadata={metadata} />
    </>
  );
}
