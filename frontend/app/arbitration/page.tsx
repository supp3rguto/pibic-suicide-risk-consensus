import ArbitrationPanel from "@/components/ArbitrationPanel";
import DemoBanner from "@/components/DemoBanner";
import { loadDataset } from "@/lib/dataset";

export default function ArbitrationPage() {
  const { metadata, results } = loadDataset();

  return (
    <>
      {metadata.is_demo ? <DemoBanner /> : null}
      <ArbitrationPanel records={results} metadata={metadata} />
    </>
  );
}
