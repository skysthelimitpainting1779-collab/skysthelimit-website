interface JsonLdProps {
  data: unknown;
}

function serializeJsonLd(data: unknown) {
  // Escape '<' so data from any future CMS field cannot close this script element.
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
