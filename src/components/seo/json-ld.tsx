import { serializeJsonLd } from "@/lib/seo/serialize-json-ld";

type JsonLdProps = {
  data: Record<string, unknown>;
};

/** Renders schema.org JSON-LD. JSON-LD does not need script execution. */
export function JsonLd({ data }: JsonLdProps) {
  return (
    <template
      // Using <template> avoids the React warning about <script> tags.
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
