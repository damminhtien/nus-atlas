const base = (process.env.SITE_URL || "https://damminhtien.github.io/nus-atlas").replace(/\/+$/, "");
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function get(pathname, attempt = 0) {
  try {
    const response = await fetch(`${base}${pathname}`, { cache: "no-store", redirect: "follow" });
    if (response.ok) return response;
    throw new Error(`${response.status} ${pathname}`);
  } catch (error) {
    if (attempt < 5) { await wait(3000); return get(pathname, attempt + 1); }
    throw error;
  }
}
async function main() {
  const home = await get("/");
  const html = await home.text();
  const version = html.match(/atlas-version[^>]+content=["']([^"']+)/i)?.[1];
  if (!version) throw new Error("production index has no atlas-version");
  const manifest = await (await get("/content/manifest.json")).json();
  if (manifest.schemaVersion !== "nus.content-manifest.v3") throw new Error("production manifest schema mismatch");
  const course = (manifest.courses || []).find(item => item.code === "DSA5105");
  if (!course) throw new Error("DSA5105 is missing from production manifest");
  await get(`/content/${course.outline}`);
  const lessonAsset = Object.values(course.lessonAssets || {})[0];
  if (!lessonAsset) throw new Error("production lesson shard missing");
  await get(`/content/${lessonAsset}`);
  await get("/nus/DSA5105/dsa5105-linear-week1/");
  for (const pathname of ["/data/algorithms.js", "/data/nus/dsa5105.js"]) {
    const removedAsset = await fetch(`${base}${pathname}`, { cache: "no-store" });
    if (removedAsset.ok) throw new Error(`removed Atlas asset is still deployed: ${pathname}`);
  }
  console.log(`PRODUCTION SMOKE GREEN · ${base} · v${version} · DSA5105 outline + lesson shard`);
}
if (require.main === module) main().catch(error => { console.error(`PRODUCTION SMOKE FAILED · ${error.message}`); process.exitCode = 1; });
module.exports = { main };
