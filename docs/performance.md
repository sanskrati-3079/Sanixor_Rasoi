# Performance and latency

“Negligible latency” cannot be guaranteed for generated recipes because a hosted model call and network conditions dominate the request time. The local mock path avoids that external dependency and is intended to return quickly.

The application keeps the request path short:

- One server route and one provider call in the normal AI path.
- Three concise recipes by default, within the requested 3–5 range, to bound output size.
- No database, background queue, or extra model calls.
- One repair call only after malformed output; provider failures and timeouts are returned directly.
- A 20-second provider timeout, bounded request and output sizes, and no logging of request content.

Two local mock API smoke requests recorded 6 ms and 14 ms of server-side route time. These samples exclude browser rendering and network time; they are not a latency benchmark. No p50/p95 baseline has been recorded. Before launch, measure end-to-end p50 and p95 separately for the mock and real provider, along with provider timeout rate, output-repair rate, and response size. Set targets only after running that measurement on the intended deployment region and model.
