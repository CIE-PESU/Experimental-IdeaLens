export const onRequest = async ({ request }: any) => {
    const url = new URL(request.url);

    // The real Supabase URL from your .env.local
    const supabaseUrl = "https://ngyspzbbjmdltlblvrye.supabase.co";

    // Forward the request to Supabase
    // We replace our domain with the Supabase domain
    const targetUrl = request.url.replace(url.origin + "/supabase", supabaseUrl);

    const modifiedRequest = new Request(targetUrl, {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
    });

    // Critical: Overwrite the Host header so Supabase/Cloudflare doesn't reject it
    modifiedRequest.headers.set("Host", new URL(supabaseUrl).host);

    return fetch(modifiedRequest);
};
