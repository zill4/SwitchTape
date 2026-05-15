export { renderers } from '../../renderers.mjs';

const prerender = false;
const POST = async () => {
  try {
    let privateKey = "your_base64_private_key";
    const teamId = "your_apple_team_id";
    const keyId = "your_apple_key_id";
    if (!privateKey || !teamId || !keyId) {
      return new Response(JSON.stringify({
        error: "Apple Music not configured"
      }), {
        status: 500,
        headers: {
          "Content-Type": "application/json"
        }
      });
    }
    if (!privateKey.includes("-----BEGIN PRIVATE KEY-----")) {
      privateKey = `-----BEGIN PRIVATE KEY-----
${privateKey}
-----END PRIVATE KEY-----`;
    }
    const header = {
      alg: "ES256",
      kid: keyId
    };
    const now = Math.floor(Date.now() / 1e3);
    const payload = {
      iss: teamId,
      iat: now,
      exp: now + 86400
    };
    const {
      subtle
    } = globalThis.crypto;
    const pemBody = privateKey.replace("-----BEGIN PRIVATE KEY-----", "").replace("-----END PRIVATE KEY-----", "").replace(/\s/g, "");
    const keyData = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0));
    const key = await subtle.importKey("pkcs8", keyData, {
      name: "ECDSA",
      namedCurve: "P-256"
    }, false, ["sign"]);
    const enc = new TextEncoder();
    const toBase64Url = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const headerB64 = btoa(JSON.stringify(header)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const payloadB64 = btoa(JSON.stringify(payload)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const sigInput = enc.encode(`${headerB64}.${payloadB64}`);
    const signature = await subtle.sign({
      name: "ECDSA",
      hash: "SHA-256"
    }, key, sigInput);
    const token = `${headerB64}.${payloadB64}.${toBase64Url(signature)}`;
    return new Response(JSON.stringify({
      token
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json"
      }
    });
  } catch (error) {
    console.error("Error generating MusicKit token:", error);
    return new Response(JSON.stringify({
      error: "Failed to generate MusicKit token"
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
