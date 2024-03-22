const BASE_URL = "https://api.jikan.moe/v4";

async function searchAnime(query) {
  console.log(query);
  let url = `${BASE_URL}/anime?q=${query}&order_by=title&sort=asc&limit=20`;
  const result = await fetch(url)
    .then((res) => res.json())
    .catch((err) => {});
  console.log(result);
}
async function getTopAnime(e) {
  let url = `${BASE_URL}/top/anime?filter=bypopularity&limit=20`;
  const result = await fetch(url)
    .then((res) => res.json())
    .catch((err) => {});
  console.log("top anime", result);
}

function debounce(func) {
  let id;
  return function (query) {
    clearTimeout(id);
    id = setTimeout(() => {
      console.log("api call");
      func.call(this, query);
    }, 1500);
  };
}
const debounceSearchAnime = debounce(searchAnime);

document.getElementById("myInput").addEventListener("input", (e) => {
  debounceSearchAnime(e.target.value);
});
document.getElementById("button").addEventListener("click", getTopAnime);
