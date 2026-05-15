export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async ({
  request
}) => {
  try {
    const {
      code,
      redirectUri
    } = await request.json();
    const clientId = "d4e5075b1b6e4282a6f7c42090f82f75";
    const clientSecret = "0b7234c6590c48b0a2b354e51ef10cf1";
    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      client_id: clientId,
      client_secret: clientSecret
    });
    const response = await fetch("https://accounts.spotify.com/api/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params.toString()
    });
    if (!response.ok) {
      console.error("Spotify token exchange failed:", await response.text());
      return new Response(JSON.stringify({
        error: "Failed to exchange code"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    const tokenData = await response.json();
    return new Response(JSON.stringify({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error exchanging Spotify code:", error);
    return new Response(JSON.stringify({
      error: "Failed to exchange Spotify code"
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
