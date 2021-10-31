/**
 * Get cookie by name
 * @param {string} cname
 * @returns {string} value
 */
function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(";");
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == " ") {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

/**
 * Get SPC_CDS from cookie
 * @returns {string}
 */
function getSPC_CDS() {
  const SPC_CDS = getCookie("SPC_CDS");
  if (!SPC_CDS) throw new Error("Cannot find SPC_CDS in cookie. Please login");
  return SPC_CDS;
}

/**
 * Fetch rating
 * @param {string} SPC_CDS
 * @param {number} pageNumber
 * @param {boolean} replied
 * @returns {Promise}
 */
async function fetchRating(SPC_CDS, pageNumber, replied = false) {
  const url = `https://seller.shopee.com.my/api/v3/settings/search_shop_rating_comments/?SPC_CDS=${SPC_CDS}&SPC_CDS_VER=2&replied=${replied}&page_number=${pageNumber}&page_size=60&cursor=0&from_page_number=1`;
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    throw new Error(error);
  }
}

/**
 * Fetch all ratings
 * @param {string} SPC_CDS
 * @returns {Promise<Array>}
 */
async function fetchAllRatings(SPC_CDS) {
  let pageNumber = 1;
  let resp = [];

  console.log("Fetching all ratings");
  const response = await fetchRating(SPC_CDS, pageNumber);
  if (response.code == 0) {
    resp.push(response.data.list);

    const totalPages = Math.ceil(response.data.page_info.total / response.data.page_info.page_size);

    if (totalPages > 1) {
      for (let i = 2; i <= totalPages; i++) {
        const response = await fetchRating(SPC_CDS, i);
        resp.push(response.data.list);
      }
    }
  }

  resp = resp.flat();

  console.log("Fetching done!");
  return resp;
}

/**
 * Map reply with rating data
 * @param {Array} data
 * @param {string} reply
 * @returns {Array} data
 */
function mapReplies(data, reply = "Tqqq my dear customer..🥰🥳\nSaya jual ❤️\nPlease come again ye 💓🌈 ") {
  return data.map((item) => {
    return {
      comment_id: item.comment_id,
      order_id: item.order_id,
      comment: reply,
    };
  });
}

/**
 * Post reply for each ratings
 * @param {string} SPC_CDS
 * @param {Array} data data array from fetch
 */
async function postReplyEachRating(SPC_CDS, data) {
  console.log("Replying all ratings");
  const replies = mapReplies(data);
  for (let i = 0; i < replies.length; i++) {
    const opts = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(replies[i]),
    };
    const url = `https://seller.shopee.com.my/api/v3/settings/reply_shop_rating/?SPC_CDS=${SPC_CDS}&SPC_CDS_VER=2`;
    try {
      console.log(`Replying to id ${replies[i].comment_id}`);
      await fetch(url, opts);
    } catch (error) {
      console.log(`Reply error ${error}`);
    }
  }
}

/**
 * Run function
 */
async function run() {
  const SPC_CDS = getSPC_CDS();
  const data = await fetchAllRatings(SPC_CDS);
  await postReplyEachRating(SPC_CDS, data);
  console.log("All jobs done!");
}

run();
