import type { RequestHandler } from './$types';

export const prerender = false;

/**
 * OpenSearch descriptor so browsers can install the site as a search engine and
 * route queries through the root `?q={searchTerms}` search page.
 */
export const GET: RequestHandler = ({ url }) => {
  const origin = url.origin;
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/" xmlns:moz="http://www.mozilla.org/2006/browser/search/">
  <ShortName>Lefine</ShortName>
  <Description>Search Lefine lepos, pages, and widgets</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/svg+xml">${origin}/favicon.svg</Image>
  <Url type="text/html" method="get" template="${origin}/?q={searchTerms}"/>
  <Url type="application/opensearchdescription+xml" rel="self" template="${origin}/opensearch.xml"/>
  <moz:SearchForm>${origin}/</moz:SearchForm>
</OpenSearchDescription>
`;

  return new Response(xml, {
    headers: {
      'content-type': 'application/opensearchdescription+xml; charset=utf-8',
      'cache-control': 'public, max-age=3600'
    }
  });
};
