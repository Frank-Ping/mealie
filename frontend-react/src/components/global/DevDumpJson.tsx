interface Props {
  data: Record<string, unknown>;
}

export default function DevDumpJson({ data }: Props) {
  const props = /* props via generated interface + destructured signature */

  const prettyJson = JSON.stringify(data, null, 2);

  return (
    <>
  <pre>
    {prettyJson}
  </pre>
    </>
  );
}
