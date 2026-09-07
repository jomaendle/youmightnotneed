/**
 * The example package.json, shown as the paste box's placeholder and used to
 * build the example report behind "See an example".
 *
 * Deliberately free of imports. scan-form.tsx is a client component and reads
 * this, so anything pulled in here would follow the string into the browser
 * bundle. The report itself is built in example-report.ts, on the server.
 *
 * Five real dependencies that between them land in five different rules and
 * three support tiers, so the example report is not a single row.
 */
export const EXAMPLE_PACKAGE_JSON = `{
  "dependencies": {
    "swiper": "^11.0.0",
    "@floating-ui/react": "^0.26.0",
    "react-wrap-balancer": "^1.1.1",
    "react-modal": "^3.16.1",
    "polished": "^4.3.1"
  }
}`;
