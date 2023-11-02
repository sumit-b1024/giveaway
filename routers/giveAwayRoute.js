const express = require("express");
const router = express.Router();

var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });

const {
  getYoutubeVideoInfo,
  getYoutubeVideoCommets,
  getGiveawayWinner,
  getGiveawayResult
} = require("../controllers/api/GiveawayController");



router.get(
  "/api/V1/youtube/info",
  urlencodeParser,
  getYoutubeVideoInfo
);

router.get(
  "/api/V1/youtube/comments",
  urlencodeParser,
  getYoutubeVideoCommets
);

router.post(
  "/api/V1/GiveawayWinner",
  urlencodeParser,
  getGiveawayWinner
);

router.get(
  "/api/V1/GiveawayResult/:code",
  urlencodeParser,
  getGiveawayResult
);

module.exports = router;
