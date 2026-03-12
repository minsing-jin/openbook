import { ReaderWorkspace } from "../../../components/reader-workspace";

export default function ReaderRoute({
  params
}: {
  params: {
    id: string;
  };
}) {
  return <ReaderWorkspace itemId={params.id} />;
}
