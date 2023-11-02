const express = require("express");
const router = express.Router();

var bodyParser = require("body-parser");
var urlencodeParser = bodyParser.urlencoded({ extended: false });

const {
  getYoutubeVideoInfo,
  getYoutubeVideoCommets,
  getGiveawayWinner,
  getGiveawayResult,
  getGiveawayResultImage
} = require("../controllers/api/YoutubeController");



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

router.get(
  "/api/V1/GiveawayResultImg/:code",
  urlencodeParser,
  getGiveawayResultImage
);

module.exports = router;
