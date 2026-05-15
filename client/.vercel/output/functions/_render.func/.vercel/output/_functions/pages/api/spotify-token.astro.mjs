export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async () => {
  try {
    const clientId = "d4e5075b1b6e4282a6f7c42090f82f75";
    const clientSecret = "0b7234c6590c48b0a2b354e51ef10cf1";
    const params = new URLSearchParams();
    params.append("grant_type", "client_credentials");
    params.append("client_id", clientId);
    params.append("client_secret", clientSecret);
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    if (!response.ok) {
      throw new Error("Failed to get Spotify token");
    }
    const data = await response.json();
    return new Response(JSON.stringify({
      access_token: data.access_token,
      expires_in: data.expires_in
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error getting Spotify token:", error);
    return new Response(JSON.stringify({
      error: "Failed to get Spotify token"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json"
      }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
    __proto__: null,
    POST,
    prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
